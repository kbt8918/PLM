# -*- coding: utf-8 -*-
"""
Description 오버플로우 청크 단위 페이지 분할 — 버그 수정판(2026-08-14).

과거 실패 사례 2건과 그 교정:
1) (2026-08-13) 그리디 패킹에서 "현재 영역 추적"과 "페이지 분배 결정"을 한 루프에서 동시에 하다가
   영역 중간에 overflow가 발생하면 이미 담겨 있던 마지막 청크가 조용히 유실됨(assert 없어서
   못 잡음). -> 이 파일은 반드시 (a) 청크를 플랫 리스트로 먼저 배분 (b) 그 다음 각 페이지 안에서
   itertools.groupby로 같은 영역번호를 재그룹, 이 2단계로만 구현한다. pack_pages()가 끝나면
   입력 청크 수 == 출력 청크 수를 assert로 검증한다 — 절대 이 검증을 생략하지 말 것.
2) (2026-08-14) 이어붙임 페이지를 삽입할 때 비탐욕 정규식(`.*?`)이 다음 섹션 시작 주석까지
   통째로 삼켜 엉뚱한 위치(문서 맨 끝)에 삽입된 적이 있음. -> inject_continuation_pages()는
   반드시 "다음 원본 섹션 시작 주석"을 문자열 검색으로 정확히 찾아 그 바로 앞에 삽입한다.
   삽입 후 반드시 DOM 순서를 재검증(verify.py의 check_dom_order 참고)할 것.

사용 흐름:
    chunks = measure_chunks(html_path, screen_id, areas)          # Playwright 실측
    budget, overhead = measure_budget(html_path, screen_id)
    pages = pack_pages(chunks, budget - overhead)                  # 안전한 2단계 패킹
    blocks, tab_buttons = render_continuation_pages(screen_id, screen_meta, pages[1:], wireframe_block_html)
    inject_continuation_pages(html_path, screen_id, pages[0], blocks, tab_buttons)
"""
import itertools


def build_intro_html(area):
    return f'<b>영역명: {area["name"]}</b><br>ㄴ {area["desc"]}'


def build_element_html(area, el, idx, multi):
    if el.get("name"):
        label = f'{area["no"]}-{idx} {el["name"]}' if multi else el["name"]
        prefix = f'<b>요소: {label}</b><br>'
    else:
        prefix = ""
    detail_html = "<br>".join(f'<span class="cond-label">{lab}:</span> {txt}' for lab, txt in el["detail"])
    return prefix + detail_html


def area_chunks(area):
    """area -> [(chunk_id, html), ...]. chunk_id[0]은 'intro', 이후 'el1','el2'..."""
    chunks = [("intro", build_intro_html(area))]
    multi = len(area["elements"]) > 1
    for i, el in enumerate(area["elements"], start=1):
        chunks.append((f"el{i}", build_element_html(area, el, i, multi)))
    return chunks


def measure_budget(page, screen_id):
    """page: 이미 goto()된 Playwright Page 객체(measure width 등 전처리 완료 상태).
    반환: (budget, overhead) — budget=wireframe 자연높이, overhead=h3+thead+padding."""
    budget = page.evaluate("""(sid) => {
        const sec = document.getElementById(sid);
        const wf = sec.querySelector('.wireframe-wrap');
        const metaBox = sec.querySelector('.meta-box');
        let naturalH = 0;
        for (const child of wf.children) {
            if (child.classList && child.classList.contains('indicator')) continue;
            naturalH += child.getBoundingClientRect().height;
        }
        const metaH = metaBox.getBoundingClientRect().height;
        return metaH + naturalH + 40;
    }""", screen_id)
    overhead = page.evaluate("""(sid) => {
        const h3 = document.querySelector('#' + sid + ' .desc-wrap h3');
        const thead = document.querySelector('#' + sid + ' .desc-table thead');
        return (h3 ? h3.getBoundingClientRect().height : 0) + (thead ? thead.getBoundingClientRect().height : 0) + 32;
    }""", screen_id)
    return budget, overhead


def measure_chunks(page, screen_id, areas):
    """각 영역의 청크(intro/el1/el2...) 실제 렌더 높이를 측정한다.
    반환: [(area_no, chunk_id, html, height), ...] (영역 순서, 청크 순서 그대로)"""
    out = []
    for area in areas:
        for cid, html in area_chunks(area):
            h = page.evaluate("""(args) => {
                const table = document.querySelector('#' + args.sid + ' .desc-table') || document.querySelector('.desc-table');
                const tbody = table.querySelector('tbody');
                const tr = document.createElement('tr');
                tr.innerHTML = '<td class="num">X</td><td>' + args.html + '</td>';
                tr.style.visibility = 'hidden';
                tbody.appendChild(tr);
                const h = tr.getBoundingClientRect().height;
                tr.remove();
                return h;
            }""", {"sid": screen_id, "html": html})
            out.append((area["no"], cid, html, h))
    return out


def pack_pages(chunks, available_height):
    """청크 유실 없는 2단계 그리디 패킹.
    반환: [page, ...], page = [(area_no, [(chunk_id, html), ...]), ...]"""
    flat_pages = []
    current = []
    current_h = 0
    for area_no, cid, html, h in chunks:
        if current_h + h > available_height and current:
            flat_pages.append(current)
            current = []
            current_h = 0
        current.append((area_no, cid, html, h))
        current_h += h
    if current:
        flat_pages.append(current)

    pages = []
    for fp in flat_pages:
        page_rows = []
        for area_no, group in itertools.groupby(fp, key=lambda x: x[0]):
            group = list(group)
            page_rows.append((area_no, [(cid, html) for _, cid, html, _ in group]))
        pages.append(page_rows)

    # 청크 유실 검증 — 반드시 통과해야 함
    in_count = len(chunks)
    out_count = sum(len(chs) for pg in pages for _, chs in pg)
    assert in_count == out_count, (
        f"청크 유실 발생! 입력 {in_count}개 vs 출력 {out_count}개. "
        f"pack_pages 로직을 손대지 말고 그대로 사용할 것 — 손댔다면 이 assert가 왜 있는지 "
        f"파일 상단 주석을 다시 읽을 것."
    )
    return pages


def rows_to_tbody_html(page_rows, seen_area_nos):
    """page_rows: [(area_no, [(chunk_id, html), ...]), ...]
    seen_area_nos: 이 페이지 이전에 이미 등장한 area_no 집합(계속 이어지는 행이면 cont-row 처리).
    반환: (tbody_html, updated_seen_area_nos)"""
    rows = []
    for area_no, chunks in page_rows:
        cell = "<br><br>".join(html for _, html in chunks)
        is_cont = area_no in seen_area_nos
        cls = ' class="cont-row"' if is_cont else ""
        rows.append(f'''        <tr{cls}>
          <td class="num">{area_no}</td>
          <td>
            {cell}
          </td>
        </tr>
''')
        seen_area_nos.add(area_no)
    return "      <tbody>\n" + "".join(rows) + "      </tbody>", seen_area_nos


def extract_wireframe_block(full_html_text, screen_id):
    """원본 screen-section에서 <div class="wireframe-wrap...부터 닫는 지점까지 원문 추출.
    이어붙임 페이지에 그대로 재사용(인디케이터 포함해서 통째로 복사됨)."""
    start_marker = f'<div id="{screen_id}" class="screen-section">'
    start_idx = full_html_text.index(start_marker)
    wf_start = full_html_text.index('<div class="wireframe-wrap', start_idx)
    close_pattern = "\n    </div>\n\n  </div>\n\n  <div class=\"desc-wrap\""
    close_idx = full_html_text.index(close_pattern, wf_start)
    wf_end = close_idx + len("\n    </div>\n\n  </div>\n")
    return full_html_text[wf_start:wf_end]


def inject_continuation_pages(full_html_text, screen_id, screen_meta, pages):
    """
    full_html_text: 파일 전체 텍스트
    screen_id: 원본 화면 id (예: 'scr-006')
    screen_meta: {"no": "SCR-006", "name": "...", "url": "...", "status": "..."}
    pages: pack_pages()의 반환값 전체(첫 페이지 포함)

    반환: 수정된 full_html_text. len(pages) < 2 면 원본 그대로 반환(오버플로우 없음).

    주의: 반드시 "다음 원본 섹션 시작 주석"을 문자열로 정확히 찾아 그 바로 앞에 삽입한다
    (비탐욕 정규식으로 넓은 범위를 매칭하지 말 것 — 과거 사고 사례 참고, 파일 상단 주석 2) 참고).
    """
    if len(pages) < 2:
        return full_html_text
    text = full_html_text

    # 1) 원본 화면의 tbody를 첫 페이지 내용으로 교체
    import re
    tbody_pattern = re.compile(
        r'(<div id="' + re.escape(screen_id) + r'" class="screen-section">.*?<thead><tr><th class="num">NO</th><th>상세설명</th></tr></thead>\n)(      <tbody>.*?</tbody>)',
        re.DOTALL,
    )
    m = tbody_pattern.search(text)
    assert m, f"tbody not found for {screen_id}"
    first_tbody, _ = rows_to_tbody_html(pages[0], set())
    text = text[:m.start()] + m.group(1) + first_tbody + text[m.end():]

    # 2) 이어붙임 페이지 블록 생성
    wireframe_block = extract_wireframe_block(text, screen_id)
    cont_blocks = []
    tab_buttons = []
    seen = set(area_no for area_no, _ in pages[0])
    for i, page_rows in enumerate(pages[1:], start=1):
        cont_id = f"{screen_id}-cont-{i}"
        heading = "Description (계속)" if i == 1 else f"Description (계속 {i})"
        tbody_html, seen = rows_to_tbody_html(page_rows, seen)
        cont_blocks.append(f'''
<!-- ==================== {screen_meta["no"]} {screen_meta["name"]} (Description 계속{'' if i == 1 else ' ' + str(i)}) ==================== -->
<div id="{cont_id}" class="screen-section">
  <div class="meta-box" style="margin:8px 24px 0 24px;">
    <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
      <span class="screen-id-badge">{screen_meta["no"]}</span>
      <div><span class="meta-label">Screen</span><div class="meta-value" style="font-weight:600; font-size:15px;">{screen_meta["name"]}</div></div>
      <div style="margin-left:24px;"><span class="meta-label">URL</span><div class="meta-value">{screen_meta["url"]}</div></div>
      <div style="margin-left:24px;"><span class="meta-label">Status</span><div class="meta-value">{screen_meta.get("status", "와이어프레임 (샘플, 보정 예정)")}</div></div>
    </div>
  </div>

  {wireframe_block}
  <div class="desc-wrap" style="margin:0 24px 24px 24px;">
    <h3 style="font-size:16px; font-weight:700; color:#212529; margin:0 0 12px 0;">{heading}</h3>
    <table class="desc-table">
      <thead><tr><th class="num">NO</th><th>상세설명</th></tr></thead>
{tbody_html}
    </table>
  </div>
</div>
''')
        tab_buttons.append(
            f'  <button class="tab-btn" onclick="showScreen(\'{cont_id}\',this)" style="padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer; margin-right:2px;">{screen_meta["no"]} (Description 계속{"" if i == 1 else " " + str(i)})</button>'
        )

    # 3) "다음 화면에 계속" 마커를 원본 화면 desc-table 뒤에 추가
    insert_marker_pattern = re.compile(
        r'(<div id="' + re.escape(screen_id) + r'" class="screen-section">.*?)\n  </div>\n</div>\n',
        re.DOTALL,
    )
    mm = insert_marker_pattern.search(text)
    assert mm, f"end-of-screen not found for {screen_id}"
    replaced = mm.group(1) + '\n    <div class="desc-continue">다음 화면에 계속 ▼</div>\n  </div>\n</div>\n'
    text = text[:mm.start()] + replaced + text[mm.end():]

    # 4) 이어붙임 섹션들을 "원본 화면 바로 다음 섹션 시작 주석" 직전에 삽입 (정확한 위치 검색 — 중요)
    orig_marker = f'<div id="{screen_id}" class="screen-section">'
    start_idx = text.index(orig_marker)
    next_comment_idx = text.index("<!-- ====================", start_idx + len(orig_marker))
    text = text[:next_comment_idx] + "".join(cont_blocks) + "\n" + text[next_comment_idx:]

    # 5) 탭 네비게이션에 이어붙임 버튼 추가 (원본 화면 버튼 바로 뒤)
    orig_tab_pattern = f"onclick=\"showScreen('{screen_id}',this)\""
    idx = text.index(orig_tab_pattern)
    line_end = text.index("</button>", idx) + len("</button>")
    text = text[:line_end] + "\n" + "\n".join(tab_buttons) + text[line_end:]

    return text
