# -*- coding: utf-8 -*-
"""
예외 Case / Alert 문구 부록 페이지 생성기.
전체 문서의 .desc-table을 스캔해 "예외 Case:" 라벨이 붙은 텍스트를 화면/요소 정보와 함께 추출하고,
문구 내용에 따라 "구분"(Alert/Toast/확인 모달/모달 내 경고/버튼 비활성화/인라인 안내/뱃지 표시 등)을
판단해 색상 뱃지로 표시하는 부록(APPENDIX) 페이지를 만든다. 필요 시 여러 페이지로 자동 분할한다.

구분 자동 판단 규칙(guess_type 함수) — 100% 정확하지 않을 수 있으니 최종적으로 사람이 한 번 훑어
보는 것을 권장한다. 애매하면 사용자에게 확인.

사용 흐름:
    rows = extract_exceptions(page)                 # Playwright로 전체 desc-table 스캔
    for r in rows: r["type"] = guess_type(r["text"])  # 또는 직접 지정
    blocks, tab_buttons = build_appendix_pages(page, rows)
    text = inject_appendix(text, blocks, tab_buttons)
"""
import re

TYPE_COLORS = {
    "Alert": "#e8590c",
    "Alert / Toast": "#e8590c",
    "Toast": "#f08c00",
    "버튼 비활성화 / Alert": "#e8590c",
    "버튼 비활성화": "#868e96",
    "모달 내 경고": "#e03131",
    "확인 모달": "#1971c2",
    "인라인 안내": "#495057",
    "뱃지 표시": "#0ca678",
}


def guess_type(text):
    """예외 Case 원문 텍스트에서 구분을 추정한다. 여러 신호가 겹치면 우선순위대로 하나만 반환."""
    has_alert = "alert:" in text or "alert :" in text
    has_toast = "toast:" in text or "toast :" in text
    has_confirm = ("확인 모달" in text or "재확인" in text or "계속하시겠습니까" in text)
    has_modal_inline = ("모달 내" in text or "등록 폼 내" in text or "팝업 내" in text)
    has_disable = "비활성화" in text
    has_badge = "뱃지" in text

    if has_alert and has_toast:
        return "Alert / Toast"
    if has_confirm:
        return "확인 모달"
    if has_modal_inline:
        return "모달 내 경고"
    if has_alert and has_disable:
        return "버튼 비활성화 / Alert"
    if has_alert:
        return "Alert"
    if has_toast:
        return "Toast"
    if has_disable:
        return "버튼 비활성화"
    if has_badge:
        return "뱃지 표시"
    return "인라인 안내"


def extract_exceptions(page):
    """page: 문서가 이미 goto()된 Playwright Page. 전체 desc-table을 스캔해 예외 Case 항목을 뽑는다.
    반환: [{"scrNo","scrName","sectionId","no","area","element","text"}, ...]"""
    data = page.evaluate("""() => {
        const out = [];
        document.querySelectorAll('.screen-section').forEach(sec => {
            if (sec.id === 'cover-page' || sec.id.startsWith('appendix-')) return;
            const badge = sec.querySelector('.screen-id-badge');
            const nameEl = sec.querySelector('.meta-value');
            const scrNo = badge ? badge.textContent.trim() : sec.id;
            const scrName = nameEl ? nameEl.textContent.trim() : '';
            sec.querySelectorAll('.desc-table tbody tr').forEach(tr => {
                const td = tr.querySelectorAll('td')[1];
                if (!td) return;
                out.push({ sectionId: sec.id, scrNo, scrName, no: tr.querySelector('.num').textContent.trim(), html: td.innerHTML });
            });
        });
        return out;
    }""")

    results = []
    for row in data:
        chunks = re.split(r"<br>\s*<br>", row["html"])
        for chunk in chunks:
            el_match = re.search(r"<b>요소:\s*(.*?)</b>", chunk)
            el_name = el_match.group(1).strip() if el_match else None
            area_match = re.search(r"<b>영역명:\s*(.*?)</b>", chunk)
            area_name = area_match.group(1).strip() if area_match else None
            exc_match = re.search(
                r'<span class="cond-label">예외 Case:</span>\s*(.*?)(?=<span class="cond-label">|$)',
                chunk, re.DOTALL,
            )
            if exc_match:
                exc_text = exc_match.group(1).strip()
                exc_text = re.sub(r"<br>\s*$", "", exc_text).strip()
                while exc_text.startswith("<br>"):
                    exc_text = exc_text[4:].strip()
                results.append({
                    "scrNo": row["scrNo"], "scrName": row["scrName"], "sectionId": row["sectionId"],
                    "no": row["no"], "area": area_name, "element": el_name, "text": exc_text,
                })
    return results


def _type_badge(t):
    color = TYPE_COLORS.get(t, "#495057")
    return f'<span style="display:inline-block; padding:3px 8px; border:1px solid {color}; color:{color}; border-radius:4px; font-size:11px; font-weight:600; white-space:nowrap;">{t}</span>'


def _row_html(idx, e):
    return (
        f'<tr>'
        f'<td style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; padding:8px; font-size:12px; text-align:center;">{idx}</td>'
        f'<td style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; padding:8px; font-size:12px; white-space:nowrap;"><b>{e["scrNo"]}</b><br><span style="color:#888; font-size:11px;">{e["scrName"]}</span></td>'
        f'<td style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; padding:8px; font-size:12px;">{e["element"] or e["area"] or "-"}</td>'
        f'<td style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; padding:8px; font-size:12px; text-align:center;">{_type_badge(e.get("type", "인라인 안내"))}</td>'
        f'<td style="border-bottom:1px solid #ccc; padding:8px; font-size:12px; line-height:1.6;">{e["text"]}</td>'
        f'</tr>'
    )


_TABLE_HEAD = (
    '<table style="border-collapse:collapse; table-layout:fixed; width:100%;">'
    '<colgroup><col style="width:4%"><col style="width:14%"><col style="width:18%"><col style="width:12%"><col style="width:52%"></colgroup>'
    '<thead><tr>'
    '<th style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; background:#eee; padding:8px; font-size:12px; text-align:center;">NO</th>'
    '<th style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; background:#eee; padding:8px; font-size:12px; text-align:left;">화면</th>'
    '<th style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; background:#eee; padding:8px; font-size:12px; text-align:left;">요소</th>'
    '<th style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; background:#eee; padding:8px; font-size:12px; text-align:center;">구분</th>'
    '<th style="border-bottom:1px solid #ccc; background:#eee; padding:8px; font-size:12px; text-align:left;">예외 Case / Alert·Toast 문구</th>'
    '</tr></thead>'
)


def _page_html(page_no, rows_html_list, total_pages):
    suffix = f" ({page_no}/{total_pages})" if total_pages > 1 else ""
    sid = "appendix-exceptions" if page_no == 1 else f"appendix-exceptions-{page_no}"
    return f'''
<!-- ==================== APPENDIX 예외 Case / Alert 문구 모음{suffix} ==================== -->
<div id="{sid}" class="screen-section" style="grid-template-columns:1fr; display:block;">
  <div class="meta-box" style="margin:8px 24px 0 24px;">
    <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
      <span class="screen-id-badge">APPENDIX</span>
      <div><span class="meta-label">Title</span><div class="meta-value" style="font-weight:600; font-size:15px;">예외 Case / Alert 문구 모음{suffix}</div></div>
      <div style="margin-left:24px;"><span class="meta-label">범위</span><div class="meta-value">전체 화면 Description의 "예외 Case" 항목 통합</div></div>
    </div>
  </div>
  <div style="margin:16px 24px 24px 24px; border:1px solid #ccc; overflow-x:auto;">
    {_TABLE_HEAD}
    <tbody>
{"".join(rows_html_list)}
    </tbody>
    </table>
  </div>
</div>
'''


def build_appendix_pages(page, rows, budget=830, meta_h=90, thead_h=40):
    """rows: extract_exceptions()의 결과(각 dict에 "type" 필드 있어야 함).
    반환: (blocks_html_list, tab_buttons_html_list)"""
    row_heights = []
    for e in rows:
        h = page.evaluate("""(html) => {
            const tbody = document.createElement('tbody');
            document.body.appendChild(tbody);
            tbody.innerHTML = html;
            tbody.style.visibility = 'hidden';
            tbody.style.position = 'absolute';
            tbody.style.width = (1680 - 48) + 'px';
            tbody.style.display = 'table';
            const h = tbody.getBoundingClientRect().height;
            tbody.remove();
            return h;
        }""", _row_html(0, e))
        row_heights.append(h)

    available = budget - thead_h - meta_h
    pages, current, current_h = [], [], 0
    for i, (e, h) in enumerate(zip(rows, row_heights), start=1):
        if current_h + h > available and current:
            pages.append(current)
            current, current_h = [], 0
        current.append((i, e))
        current_h += h
    if current:
        pages.append(current)

    blocks = [_page_html(pi, [_row_html(idx, e) for idx, e in pg], len(pages)) for pi, pg in enumerate(pages, start=1)]
    tab_buttons = []
    for pi in range(1, len(pages) + 1):
        sid = "appendix-exceptions" if pi == 1 else f"appendix-exceptions-{pi}"
        label = "APPENDIX 예외Case/Alert 모음" + (f" ({pi}/{len(pages)})" if len(pages) > 1 else "")
        tab_buttons.append(f'  <button class="tab-btn" onclick="showScreen(\'{sid}\',this)" style="padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer; margin-right:2px;">{label}</button>')
    return blocks, tab_buttons


def remove_existing_appendix(text):
    """재실행 시 기존 부록 블록/탭 버튼을 먼저 제거한다(중복 삽입 방지)."""
    m = re.search(r"<!-- ==================== APPENDIX", text)
    if m:
        js_marker = text.index("<!-- ==================== JAVASCRIPT ====================")
        text = text[:m.start()] + text[js_marker:]
    text = re.sub(
        r'\s*<button class="tab-btn" onclick="showScreen\(\'appendix-exceptions[^"]*\',this\)"[^>]*>[^<]*</button>',
        "",
        text,
    )
    return text


def inject_appendix(text, blocks, tab_buttons, last_regular_tab_marker):
    """last_regular_tab_marker: 부록 바로 앞에 와야 하는 마지막 일반 화면 탭 버튼의 정확한 HTML 문자열
    (예: SCR-014 버튼 전체 태그). 이 문자열 바로 뒤에 부록 탭 버튼들을 붙인다."""
    text = remove_existing_appendix(text)
    js_idx = text.index("<!-- ==================== JAVASCRIPT ====================")
    text = text[:js_idx] + "\n".join(blocks) + "\n\n" + text[js_idx:]
    assert last_regular_tab_marker in text, "last_regular_tab_marker not found — 정확한 버튼 문자열을 넘겼는지 확인"
    text = text.replace(
        last_regular_tab_marker,
        last_regular_tab_marker + "\n" + "\n".join(tab_buttons),
    )
    return text
