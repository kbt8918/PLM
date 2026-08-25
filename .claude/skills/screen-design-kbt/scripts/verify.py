# -*- coding: utf-8 -*-
"""
가이드 4절(Step 9. 최종 검증)을 코드로 강제하는 헬퍼. 화면설계서 와이어프레임 샘플 파일을
수정한 뒤에는 이 파일의 함수들을 반드시 순서대로 실행할 것 — 생략하고 "완료"라고 보고하지 말 것
(과거 세션에서 검증 없이 완료 보고했다가 사용자에게 지적받은 이력 있음).

사용 예:
    import pathlib
    from playwright.sync_api import sync_playwright

    html_path = pathlib.Path(TARGET_HTML).resolve()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1800, "height": 1400})
        page.goto(html_path.as_uri())
        page.wait_for_load_state("networkidle")

        result = check_dom_order(page)          # 1) 섹션 개수/순서/에러
        assert not result["errors"]

        # PPTX 다운로드 버튼 클릭 -> 파일 저장은 프로젝트의 기존 다운로드 테스트 스크립트 참고
        # (05.리포트 작업 시 사용했던 test_pptx_download.py 패턴 그대로 재사용 가능)
        browser.close()

    pdf_path = render_pdf_via_print(TARGET_HTML, OUT_PDF)
    check_pdf_page_count(OUT_PDF, expected_sections=result["pdf_expected_count"])
    check_pptx_integrity(OUT_PPTX, expected_slides=result["pdf_expected_count"])
"""
import pathlib
import zipfile
import xml.dom.minidom as minidom


def check_dom_order(page):
    """섹션 개수/순서/JS 에러를 확인한다. 이어붙임(-cont-N) 섹션이 각자의 원본 화면 바로 뒤에
    붙어 있는지 눈으로 한 번 더 확인할 것 — 이 함수는 순서 나열만 해줄 뿐 "올바른 순서인지"는
    판단하지 않는다(과거 이어붙임 페이지가 문서 맨 끝에 잘못 삽입된 사고가 있었음).

    pdf_expected_count(2026-08-19 R14 대응 추가): `.screen-only-page`(예: scr-001-scroll —
    HTML 전용, `@media print`에서 display:none)는 `.screen-section` 전체 개수(count)에는
    포함되지만 PDF/PPTX에는 나타나지 않는다. `check_pdf_page_count`/`check_pptx_integrity`에
    `expected_sections=dom["count"]`를 그대로 넘기면 R14 도입 이전 가정(모든 섹션이 PDF에도
    그대로 나온다)이 깨져 있어 상시 1장 차이 오탐이 난다 — 실측: dom.count=51인데
    `.screen-only-page`가 1개(scr-001-scroll) 있어 PDF 실제 페이지는 50. `.pdf-only-page`
    (예: scr-001-table/table-2)는 반대로 HTML에서 숨겨질 뿐 `.screen-section`이자 PDF에도
    나오므로 count에서 뺄 필요가 없다 — 헷갈리지 말 것. 이후 PDF/PPTX 검증 시
    `expected_sections=dom["pdf_expected_count"]`를 사용한다."""
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    ids = page.evaluate("Array.from(document.querySelectorAll('.screen-section')).map(s => s.id)")
    indicator_count = page.evaluate("document.querySelectorAll('.indicator').length")
    screen_only_count = page.evaluate("document.querySelectorAll('.screen-section.screen-only-page').length")
    return {
        "errors": errors,
        "count": len(ids),
        "ids": ids,
        "indicator_count": indicator_count,
        "screen_only_count": screen_only_count,
        "pdf_expected_count": len(ids) - screen_only_count,
    }


def render_pdf_via_print(html_path, out_pdf_path):
    """applyPrintScaling()을 명시적으로 호출한 뒤 page.pdf()로 저장한다.
    주의: Playwright의 page.pdf()는 beforeprint/afterprint를 실제로 발생시키지 않을 수 있으므로
    (버전에 따라 다름, 과거 세션에서 혼선 있었음) 항상 명시적으로 applyPrintScaling()을 호출한다."""
    from playwright.sync_api import sync_playwright

    html_path = pathlib.Path(html_path).resolve()
    out_pdf_path = pathlib.Path(out_pdf_path)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(html_path.as_uri())
        page.wait_for_load_state("networkidle")
        page.emulate_media(media="print")
        page.evaluate("applyPrintScaling()")
        page.pdf(path=str(out_pdf_path), print_background=True, width="13.33in", height="7.5in", prefer_css_page_size=True)
        browser.close()
    return out_pdf_path


def check_pdf_page_count(pdf_path, expected_sections):
    """PDF 페이지 수가 .screen-section 개수와 정확히 일치해야 한다(1장이라도 다르면 오버플로우로
    인한 빈 페이지 등 실제 문제가 있다는 뜻 — '거의 맞다'고 넘어가지 말 것)."""
    import fitz  # PyMuPDF
    doc = fitz.open(str(pdf_path))
    actual = len(doc)
    ok = actual == expected_sections
    detail = None
    if not ok:
        # 어느 페이지가 문제인지 텍스트 스니펫을 뽑아준다
        detail = [(i, page.get_text()[:40].replace("\n", " | ")) for i, page in enumerate(doc)]
    return {"ok": ok, "expected": expected_sections, "actual": actual, "pages_preview": detail}


def check_pptx_integrity(pptx_path, expected_slides=None):
    """PPTX가 (a) 모든 slide XML이 well-formed하고 (b) spAutoFit(과거 PowerPoint '복구' 손상의
    근본 원인)이 0건인지 확인한다. python-pptx로 슬라이드 수도 함께 확인."""
    from pptx import Presentation

    bad_files = []
    spautofit_count = 0
    with zipfile.ZipFile(pptx_path) as z:
        for name in z.namelist():
            if name.startswith("ppt/slides/") and name.endswith(".xml"):
                content = z.read(name)
                try:
                    minidom.parseString(content)
                except Exception as e:
                    bad_files.append((name, str(e)))
                if b"spAutoFit" in content:
                    spautofit_count += content.count(b"<a:spAutoFit")

    prs = Presentation(pptx_path)
    slide_count = len(prs.slides)

    result = {
        "slide_count": slide_count,
        "bad_xml_files": bad_files,
        "spautofit_count": spautofit_count,
        "ok": (not bad_files) and spautofit_count == 0,
    }
    if expected_slides is not None:
        result["slide_count_matches"] = (slide_count == expected_slides)
        result["ok"] = result["ok"] and result["slide_count_matches"]
    return result


def print_report(dom_result, pdf_result, pptx_result):
    lines = []
    lines.append(f"[DOM] sections={dom_result['count']} indicators={dom_result['indicator_count']} errors={len(dom_result['errors'])}")
    if dom_result["errors"]:
        lines.append("  !! JS 에러 발생: " + "; ".join(dom_result["errors"][:3]))
    lines.append(f"[PDF] expected={pdf_result['expected']} actual={pdf_result['actual']} ok={pdf_result['ok']}")
    if not pdf_result["ok"] and pdf_result["pages_preview"]:
        lines.append("  페이지별 미리보기(문제 페이지 찾기용):")
        for i, txt in pdf_result["pages_preview"]:
            lines.append(f"    {i}: {txt}")
    lines.append(f"[PPTX] slides={pptx_result['slide_count']} bad_xml={len(pptx_result['bad_xml_files'])} spAutoFit={pptx_result['spautofit_count']} ok={pptx_result['ok']}")
    report = "\n".join(lines)
    print(report)
    return report


# ---------------------------------------------------------------------------
# 재발 방지 회귀 체크 (2026-08-18 도입, 2026-08-19 R7/R8 추가)
#
# 아래 함수들은 이 문서를 다루면서 실제로 사용자에게 지적받았던 사고 유형을 코드로
# 고정한 것이다. 새 회귀가 생기면 이 목록에 함수를 추가할 것 — "가이드 문서에 적었으니
# 사람이 기억해서 피하겠지"에 의존하지 않고, **이 문서를 다루는 모든 세션이(오늘 이 세션이
# 끝난 뒤에도) 작업 종료 전 반드시** `check_all_regressions()`를 기계적으로 돌려서
# 확인한다 — 가이드 문서(1-1절)를 읽었는지와 무관하게, 이 함수들 자체가 재발 방지의
# 실행 단위다.
#
#   R1. check_colgroup_widths   — colgroup 열 너비 합계가 100%를 넘으면 마지막 컬럼이
#       스크롤 wrap 밖으로 밀려 잘려 보인다(2026-08-18, SCR-001 공정별 상세 표 MWX 컬럼 잘림 사고).
#   R2. check_desc_overflow     — Description 텍스트가 desc-table 셀 경계를 넘어 다음 NO
#       행과 겹치거나 페이지 밖으로 잘리는지(카테고리 1 사고, 페이지 분할 누락/부정확).
#   R3. check_indicator_el_placement — 요소 인디케이터(.indicator-el)가 타겟의 중첩 자식이
#       아니라 wireframe-wrap 기준 고정좌표 형제 요소로 만들어졌는지(카테고리 2 사고 원인).
#   R4. check_indicator_el_completeness — Description에 등장하는 요소번호(N-1, N-2…) 개수와
#       실제 .indicator-el 배지 개수가 화면별로 일치하는지(배지 추가를 빠뜨리는 사고 반복 이력).
#   R5. check_popup_backdrop_marker — popup_page()로 만든 팝업 페이지의 딤 처리 배경 wrapper에
#       .popup-backdrop 클래스가 붙어 있는지(없으면 PPT에서만 배경-모달 텍스트가 겹쳐 보임).
#   R6. check_desc_underflow    — R2의 반대 극단, Description 페이지 분할이 지나치게 보수적
#       이어서 하단에 불필요한 빈 공간이 남는지(2026-08-19, SCR-001 NO=3/5/6 하단 빈 공간).
#   R7. check_print_scale_collapse — 원본 화면(HTML에서도 기본 노출되는 페이지)의 표/콘텐츠가
#       스크롤 wrap 안에 과도하게 많은 행을 담고 있으면, PDF 변환(applyPrintScaling())이
#       그 섹션 전체를 표준 페이지 1장에 맞추려고 zoom 배율을 극단적으로 축소해 텍스트가
#       읽을 수 없게 깨진다(2026-08-19, SCR-001 원본 "공정별 상세" 표 17행 전체 노출 사고).
#   R8. check_print_only_layout_leftovers — PDF/PPT 전용 정적 페이지(id가 '-table'로 끝나는
#       등, 표 전체 데이터만 보여주려고 만든 별도 섹션)에 사이드바/탭/필터처럼 그 페이지의
#       존재 이유가 아닌 배경 영역이 그대로 남아있는지(2026-08-19, scr-001-table 사고).
#   R13. check_template_layout_ratio — `화면설계서_템플릿.md`가 고정한 캔버스(76%)/설명(24%)
#       폭 비율이 실제로 모든 화면 페이지에서 지켜지는지(2026-08-19, 사용자가 "템플릿 크기가
#       상황에 따라 변동되는 것 같다"고 지적 — 그날 실측으론 비율 자체는 안 벗어났고 캔버스
#       내용물 불일치가 진짜 원인이었지만, 비율 이탈 자체도 상시 감시 대상으로 코드화).
#   R14. check_screen_only_page_hidden_in_print / check_screen_only_page_pptx_skip —
#       .pdf-only-page의 반대 방향 매체 분기(.screen-only-page: HTML 전용, PDF/PPT 제외)가
#       실제로 두 매체 모두에서 빠지는지(2026-08-19, SCR-001 "공정별 상세 전체 스크롤 보기"
#       페이지 scr-001-scroll 도입 — CSS `.screen-only-page`만으로 시도했다가 기존
#       `.screen-section:not(#cover-page) { display:grid !important; }` 규칙의 :not() 안
#       ID 특정도에 밀려 PDF에 그대로 출력되는 사고가 실측에서 드러남, id 셀렉터로 특정도를
#       올려 해결. downloadPPTX() 루프에도 별도 continue 가드 필요 — R9와 동일한 매커니즘).
#   R15. check_no_number_ambiguity — 같은 화면 그룹 안에서 같은 Description NO 번호가
#       서로 다른 영역명으로 두 섹션 이상에 걸쳐 등장하는지(정보성 — 정상 이어붙임 cont
#       반복과 진짜 번호 충돌을 영역명 비교로 기계적으로 구분). 2026-08-19, `scr-001-scroll`
#       NO=4("상세 영역 (전체 보기)" 안내문)와 `scr-001-cont-1` NO=4("상세 영역" 진짜
#       설명)가 같은 번호로 겹쳐 사용자가 혼란스러워한 사고 — 해결 절차는 함수 docstring에
#       상세 기록(안내문 쪽 NO를 '-'로, 대응 캔버스 배지도 함께 제거).
#
# (R9~R11은 아직 코드베이스 의존적이라 자동 함수화 전 — 가이드 문서 1-1절 참고. R12, R15는
# 정보성 체크로 check_all_regressions()의 ok 판정에는 포함하지 않는다 — 둘 다 "사람이 맥락을
# 보고 최종 판단해야 하는" 유형이라 자동 pass/fail로 강제하면 오탐이 나기 때문.)
#
# 전부 정적 HTML 파싱(BeautifulSoup 불필요, 표준 re/html.parser만 사용)으로 동작하므로
# Playwright 없이도 빠르게 돌릴 수 있다. 단, R1/R2/R6/R7/R13은 실제 렌더 겹침/여백/축소/
# 비율을 보는 게 아니라 "그럴 수 있는 구조적 결함"을 정적/실측으로 잡아내는 것이라, 잡아내지
# 못하는 케이스가 있으면 Playwright 실측(문서 상단 check_dom_order 등)이나 실제 PDF/PPTX
# 다운로드 검증을 추가로 병행할 것 — 이 체크는 최소 방어선이지 완전한 대체재가 아니다.
# ---------------------------------------------------------------------------

import re as _re


def check_colgroup_widths(html_path, tolerance=0.5):
    """R1: 모든 <colgroup> 안 <col style="width:N%"> 합계가 100%(±tolerance)를 넘는지 검사.
    100%를 초과하면 table-layout:fixed 표에서 마지막 컬럼이 스크롤 wrap 밖으로 밀려나
    잘려 보인다(2026-08-18 SCR-001 사고: 107.3% 합계로 MWX 조립1 컬럼이 잘림).
    100% 미만이면(빈 여백만 생기고 잘림은 없지만) 의도치 않은 여백일 수 있어 함께 보고한다."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    colgroups = _re.findall(r"<colgroup>(.*?)</colgroup>", content, _re.S)
    bad = []
    for i, cg in enumerate(colgroups):
        widths = [float(w) for w in _re.findall(r'<col style="width:([\d.]+)%">', cg)]
        if not widths:
            continue
        total = sum(widths)
        if abs(total - 100.0) > tolerance:
            bad.append({"colgroup_index": i, "total": round(total, 2), "col_count": len(widths)})
    return {"ok": len(bad) == 0, "bad_colgroups": bad, "checked": len(colgroups)}


def check_desc_overflow(page):
    """R2: 현재 로드된 페이지에서 각 .desc-table 셀(td)의 스크롤 높이가 보이는 높이를
    넘는지, 그리고 형제 tr(NO 행)끼리 세로 좌표가 겹치는지 Playwright로 실측한다.
    text-overflow 없이 순수 height 비교이므로 오탐(false positive)이 있을 수 있는데,
    이는 브라우저가 자동으로 줄바꿈해서 tr 자체 높이가 늘어나는 정상 케이스와 진짜
    clip(overflow:hidden 등으로 잘리는 경우)을 구분하기 위해 clientHeight/scrollHeight
    비교와 tr-tr bounding box 겹침 두 가지를 모두 검사한다."""
    return page.evaluate("""
        () => {
            const problems = [];
            document.querySelectorAll('.desc-table').forEach((table, ti) => {
                const rows = Array.from(table.querySelectorAll('tbody > tr, tr'));
                const rects = rows.map(r => r.getBoundingClientRect());
                // 1) 셀 내부 overflow:hidden으로 실제 잘림이 발생하는지
                rows.forEach((r, i) => {
                    r.querySelectorAll('td').forEach(td => {
                        const cs = getComputedStyle(td);
                        if (cs.overflow === 'hidden' && td.scrollHeight > td.clientHeight + 2) {
                            problems.push({type: 'cell-clip', rowIndex: i, scrollHeight: td.scrollHeight, clientHeight: td.clientHeight});
                        }
                    });
                });
                // 2) 인접하지 않은 행끼리 세로 좌표가 겹치는지(다음 NO 영역과 겹쳐 보이는 사고)
                for (let i = 0; i < rects.length; i++) {
                    for (let j = i + 1; j < rects.length; j++) {
                        const a = rects[i], b = rects[j];
                        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
                        if (overlapY > 4 && a.width > 0 && b.width > 0) {
                            problems.push({type: 'row-overlap', rowA: i, rowB: j, overlapY: Math.round(overlapY)});
                        }
                    }
                }
            });
            return problems;
        }
    """)


def check_indicator_el_placement(html_path):
    """R3: .indicator-el 배지가 .wireframe-wrap의 고정 top/left 형제 요소로 만들어졌는지
    정적으로 검사한다(2026-08-14 사고 원인). 올바른 배치는 타겟 요소의 중첩 자식이며
    보통 bottom/right 또는 top/left 코너 오프셋(-9px, -6px 등 절대값이 작은 값)을 쓴다.
    형제 배치는 대개 wireframe-wrap 바로 아래에서 큰 절대좌표(top:100px 이상 등)로
    나열되는 패턴을 보이므로, '.indicator-el 태그 앞에 </div>가 연속으로 여러 번 나오고
    그 직후 형제로 다시 열리는' 얕은 휴리스틱 대신, 정확히는 '.indicator-el이 등장하는
    지점 직전 100자 안에 다른 태그의 닫힘이 있고 그 위치가 <div class="indicator"
    (영역 인디케이터, 이건 형제 배치가 정상)와 동일한 컨테이너에 나란히 있는지'를
    간이 판별한다. 완전 자동 판별은 어렵기 때문에, 의심 사례가 나오면 반드시 Step 4의
    표준 구현(el_badge/make_el_badge_wrap)과 육안 대조할 것 — 이 함수는 강한 신호만 준다."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    # "indicators (relative to whole wireframe-wrap ...)" 주석 블록 안에 .indicator-el이
    # 있으면 100% 형제 배치 오배치다(그 블록은 .indicator 전용 구역이어야 함).
    suspicious = []
    for m in _re.finditer(r"<!--\s*indicators?\s*\(relative to whole wireframe-wrap[^>]*-->(.*?)(?=<!--|\Z)", content, _re.S):
        block = m.group(1)
        if "indicator-el" in block:
            snippet_start = m.start()
            line_no = content.count("\n", 0, snippet_start) + 1
            count = block.count("indicator-el")
            suspicious.append({"near_line": line_no, "indicator_el_count_in_sibling_block": count})
    return {"ok": len(suspicious) == 0, "suspicious_blocks": suspicious}


def check_indicator_el_completeness(page):
    """R4: 현재 로드된 화면(섹션)마다 Description에 등장하는 요소번호(예: NO=3의 3-1, 3-2)
    개수와 실제 .indicator-el 배지 라벨 집합이 일치하는지 확인한다(2026-08-18 SCR-002
    사고: Description은 2-1/2-2/2-3을 설명하는데 배지가 하나도 없었음).

    주의(2026-08-18 오탐 수정): Step 4-2 규칙에 따라 상위 화면에서 트리거되는 팝업/디테일
    페이지는 그 팝업 자신의 섹션 Description에서 상위 NO를 그대로 재사용하지만("...요소
    2-2와 동일 NO"), 실제 배지는 그 요소가 시각적으로 존재하는 원본(상위) 페이지에만
    있고 팝업/설명-이어붙임 페이지 자체에는 배지가 없는 것이 정상이다(팝업은 고유 위치가
    없어 Step 4가 배지 생략을 허용). 따라서 같은 화면(SCR-NNN/MTRM-MAIN 등 접두사) 그룹
    전체에서 해당 라벨의 배지를 먼저 찾고, 그룹 내 어디에도 없을 때만 진짜 결함으로 보고한다.
    섹션 전체를 순회하며 {section_id: {"desc_labels": [...], "badge_labels": [...], "missing": [...]}} 를 반환."""
    return page.evaluate("""
        () => {
            const result = {};
            const sections = Array.from(document.querySelectorAll('.screen-section'));

            // 화면 그룹 키 추출: id에서 -cont-N / -popup-* / -selectmode / -detail 등 페이지
            // 변형 접미사를 떼어내고 base id로 묶는다(예: scr-014, scr-014-cont-1,
            // scr-014-selectmode, scr-014-detail, scr-014-popup-trendedit 전부 'scr-014' 그룹).
            const groupKey = (id) => id.replace(/-(cont-\\d+|popup(-[a-z0-9]+)*|selectmode|detail)$/i, '')
                                       .replace(/-(cont-\\d+|popup(-[a-z0-9]+)*|selectmode|detail)$/i, '');

            // 그룹별로 그 그룹에 속한 모든 섹션의 배지 라벨을 합집합으로 미리 모은다.
            const groupBadges = {};
            sections.forEach(section => {
                const key = groupKey(section.id);
                if (!groupBadges[key]) groupBadges[key] = new Set();
                section.querySelectorAll('.indicator-el span').forEach(s => groupBadges[key].add(s.textContent.trim()));
            });

            sections.forEach(section => {
                const descText = Array.from(section.querySelectorAll('.desc-table')).map(t => t.innerText).join('\\n');
                // "N-1", "N-2" 같은 요소번호 패턴을 Description 텍스트에서 추출
                // ("요소: 3-1 ...", "요소: N-N ..." 형태만; 단순 "1-1"처럼 날짜/기타 오탐 방지를 위해
                //  '요소:' 뒤 또는 줄 시작 근처에 오는 패턴만 취함)
                const descLabels = new Set(
                    Array.from(descText.matchAll(/요소:\\s*(\\d+-\\d+)/g)).map(m => m[1])
                );
                if (descLabels.size === 0) return; // 요소번호를 쓰는 화면이 아니면 스킵
                const badgeLabels = new Set(
                    Array.from(section.querySelectorAll('.indicator-el span')).map(s => s.textContent.trim())
                );
                const key = groupKey(section.id);
                const groupBadgeSet = groupBadges[key] || new Set();
                // 이 섹션 자신에 없어도 같은 화면 그룹(원본/cont/popup/selectmode/detail) 어딘가에
                // 있으면 Step 4-2에 따른 정상 케이스이므로 결함으로 치지 않는다.
                const missing = Array.from(descLabels).filter(l => !groupBadgeSet.has(l));
                if (missing.length > 0) {
                    result[section.id] = {
                        desc_labels: Array.from(descLabels),
                        badge_labels: Array.from(badgeLabels),
                        missing: missing,
                    };
                }
            });
            return result;
        }
    """)


def check_popup_backdrop_marker(html_path):
    """R5: popup_page() 스타일의 딤 처리 배경(opacity:0.32 등)을 쓰는 div에
    .popup-backdrop 클래스가 빠져 있는지 정적으로 검사한다(2026-08-18 사고:
    이 클래스가 없으면 HTML/PDF에서는 안 보이지만 PPT 변환에서만 배경-모달 텍스트가
    최대 100%까지 겹쳐 출력됨). opacity:0.32와 filter:grayscale이 함께 쓰인 div를
    딤 배경 후보로 보고, 그 style 속성 안에 popup-backdrop 클래스가 없으면 결함으로 잡는다."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    bad = []
    for m in _re.finditer(r'<div([^>]*style="[^"]*opacity:\s*0\.32[^"]*filter:\s*grayscale[^"]*"[^>]*)>', content):
        tag = m.group(0)
        if "popup-backdrop" not in tag:
            line_no = content.count("\n", 0, m.start()) + 1
            bad.append({"near_line": line_no, "tag_preview": tag[:120]})
    return {"ok": len(bad) == 0, "missing_marker": bad}


def check_desc_underflow(page, min_slack_px=100):
    """R6: R2(오버플로우)의 반대 극단 — Description 페이지 분할이 지나치게 보수적이어서
    .desc-table 하단에 불필요한 빈 공간이 남는지 확인한다(2026-08-19 SCR-001 사고: NO 완결성
    우선 원칙을 과도하게 적용해 다음 청크가 들어갈 수 있는데도 다음 페이지로 넘김).

    측정 대상 선정(2026-08-19 재설계 — 최초 구현은 section.scrollHeight 기반이라 전량
    오탐이었음, 아래 "재설계 배경" 참고): 페이지 하단에 `.desc-continue`("다음 화면에
    계속 ▼") 마커가 있는 섹션만 검사한다. 이 마커가 있다는 것 자체가 "이 Description은
    다음 페이지로 이어진다"는 저작 시점의 명시적 신호이므로, 이어붙임 그룹 구성을 정규식
    (`-cont-\\d+$` 등)으로 역추정할 필요가 없다 — 그 추정은 `-popup-7-1/7-2/7-3`처럼
    다른 명명 관례를 오분류할 위험이 있었다. 이 마커는 실제 관찰상 팝업 페이지에는 전혀
    쓰이지 않지만(모달은 자체 완결 콘텐츠), 안전망으로 `.popup-backdrop`이 있는 섹션은
    한 번 더 명시적으로 제외한다.

    여유 공간(slack) 계산: 같은 섹션 안의 `.desc-wrap`(우측 Description 컬럼) 높이를
    `.wireframe-wrap`(좌측 와이어프레임 컬럼, 그 페이지의 실제 지면 높이) 높이와 비교한다.
    문서 전체 섹션 높이의 median을 기준으로 삼았던 최초 구현은 `.wireframe-wrap`이
    `min-height:800px`로 고정돼 있어 `section.scrollHeight`가 항상 800~930px 근방에
    몰리는 바람에(콘텐츠 길이와 무관하게 거의 상수) 실질적으로 아무 것도 못 잡아냈다.
    같은 섹션 내부에서 두 컬럼 높이를 비교하면 "그 페이지에서 실제로 쓸 수 있었던 세로
    공간"과 "Description이 실제로 쓴 높이"를 직접 비교하게 되어 문서 전체의 페이지 높이
    편차(868~928px 등, 콘텐츠에 따라 요동)에 영향받지 않는다.

    재설계 배경(오탐 검증, 2026-08-19): 최초 구현으로 SCR-001 실제 데이터를 검증했더니
    모든 min_slack_px(50/100/150)에서 0건이 나왔다. section.scrollHeight를 실측한 결과
    897/1025px 등 몇 개 값에 거의 고정되어 있어 median과 거의 차이가 나지 않았기 때문
    (즉 R6이 완전히 무력화된 상태였음). 반면 desc-wrap 대비 wireframe-wrap 높이차로
    다시 측정하니 `.desc-continue`가 있는 섹션에서만 84~438px의 뚜렷한 slack이 나왔고,
    이는 스크린샷 육안 확인(scr-001/scr-001-cont-1/scr-001-cont-2 우측 패널 하단의 실제
    빈 공간)과 정확히 일치했다. `.desc-continue`가 없는 섹션(그룹 마지막 페이지, 팝업)은
    slack이 크더라도(예: 팝업 페이지들이 400~600px대) 애초에 검사 대상에서 제외되므로
    오탐이 나지 않는다 — 팝업/이어붙임 마지막 페이지는 원래 한 페이지를 다 채우지 않는
    것이 정상이라는 설계와 부합한다.

    기결정 사례(2026-08-19, scr-004/scr-012/scr-014는 병합 완료·scr-001-cont-1은 불가피로 확정):
    이 4건 모두 R6이 지적했던 시점에 실측 검증한 결과, scr-004(131px)와 scr-012(113px)는
    다음 청크(NO=3 "페이지네이션", 107px)가 여백에 정확히 들어가 원본 페이지로 병합하고
    cont-1 섹션 자체를 삭제했다(HTML/PDF/PPTX 검증 통과). scr-014(131px)는 다음 청크가
    NO=2의 후속 요소(2-2, 89px)+NO=3(107px)+NO=4(305px) 순인데 2-2만 들어가서 2-2까지만
    병합하고 NO=3/4는 cont-1에 남겼다(병합 후 여백 42px로 기준 100px 미만 통과).
    **scr-001-cont-1(376px)은 병합하지 않기로 확정** — 다음 청크가 NO=5("CTA 영역", 3개
    요소를 가진 원자적 청크, HTML 뷰 413px)라 애초에 376px 여백보다 커서 안 들어가고, PDF 폭
    (~1240px, 텍스트 줄바꿈 증가)에서 재측정하면 629px까지 늘어나 병합 시 desc-wrap이
    wireframe-wrap을 크게 초과해 R7(PDF 축소 붕괴)을 유발할 것이 실측으로 확인됐다(PDF 폭
    기준 여백 306px에 629px 청크는 절대 안 들어감). 즉 이 여백은 "NO 완결성 우선 원칙"에 따른
    불가피한 결과이며, 이후 세션이 R6 목록에서 이 섹션을 다시 보더라도 **매번 재조사하지 말고
    이 판단을 재사용**할 것 — 단, 만약 SCR-001 NO=5 자체의 텍스트가 나중에 대폭 줄어드는 등
    전제가 바뀌면 재검토 대상이 될 수 있다."""
    return page.evaluate("""
        (minSlack) => {
            const sections = Array.from(document.querySelectorAll('.screen-section'));
            const problems = [];
            sections.forEach(section => {
                const descWrap = section.querySelector('.desc-wrap');
                const wireframeWrap = section.querySelector('.wireframe-wrap');
                if (!descWrap || !wireframeWrap) return; // Description/와이어프레임이 없는 페이지(커버, 부록 등)는 스킵

                const isPopup = !!section.querySelector('.popup-backdrop');
                if (isPopup) return; // 팝업은 모달 콘텐츠만 있어 원래 짧은 것이 정상

                const hasContinue = !!descWrap.querySelector('.desc-continue');
                if (!hasContinue) return; // "다음 화면에 계속" 마커가 없으면 이 페이지가 그룹의 마지막(또는 유일) 페이지 — 여백이 정상

                const descHeight = descWrap.getBoundingClientRect().height;
                const wireframeHeight = wireframeWrap.getBoundingClientRect().height;
                const slack = wireframeHeight - descHeight;
                if (slack > minSlack) {
                    problems.push({
                        section_id: section.id,
                        desc_height: Math.round(descHeight),
                        wireframe_height: Math.round(wireframeHeight),
                        slack_px: Math.round(slack),
                    });
                }
            });
            return problems;
        }
    """, min_slack_px)


def check_print_scale_collapse(page, min_scale=0.55):
    """R7: PDF 출력 시 섹션 하나가 지나치게 많은 콘텐츠(대표적으로 스크롤 wrap 안에 눌러
    담은 표 전체 행)를 갖고 있으면, applyPrintScaling()이 그 섹션을 표준 페이지 1장에
    맞추려고 zoom 배율을 극단적으로 작게 계산해 텍스트가 읽을 수 없는 크기로 축소된다
    (2026-08-19 사고: SCR-001 원본 화면의 "공정별 상세" 표가 17개 공정 행 전체를 담고
    있어 PDF 2페이지 전체 텍스트가 깨져 보임 — HTML 브라우저에서는 .scroll-wrap-detail의
    overflow:auto 덕에 문제가 안 보이지만, applyPrintScaling()은 section.scrollHeight를
    측정하므로 스크롤 wrap 내부에 눌러 담긴 콘텐츠 양과 무관하게 표가 클수록 배율이 작아진다).

    applyPrintScaling()의 배율 계산식(pageW/scrollWidth, pageH/scrollHeight 중 작은 값 ×
    0.995)을 그대로 재현해서 각 섹션의 예상 zoom 배율을 구하고, min_scale 미만이면 결함으로
    본다(0.55 미만이면 12px 본문 폰트가 6.6px 이하로 줄어들어 인쇄물에서 사실상 판독 불가).
    이 함수는 body.style.width를 pageW로 강제한 뒤 scrollWidth/scrollHeight를 재는 원본
    로직과 동일한 순서로 측정하므로, 실제 다운로드한 PDF에서 보이는 축소 정도와 근사한다.

    주의(2026-08-19 오탐 수정): `.pdf-only-page`(예: scr-001-table) 섹션은 `@media screen`에서
    `display:none !important`로 숨겨져 있어, 이 함수를 print media 전환 없이 일반 페이지
    상태에서 실행하면 scrollWidth/scrollHeight가 0/0이 되고 `scale = min(w/0, h/0) = Infinity`가
    되어 아무리 실제 PDF에서 심하게 축소되더라도 항상 통과(오탐)한다 — 처음 버전은 이 케이스를
    스킵해 R7이 정작 잡아야 할 "3P(scr-001-table)" 축소는 못 잡고 "2P(scr-001)" 축소만 잡는
    반쪽짜리 검사였다. 측정 직전 `.pdf-only-page` 요소들의 인라인 display를 강제로 block으로
    켜서(downloadPPTX가 PPTX 생성 직전 하는 것과 동일한 처리, R8/가이드 R7 문단 참고) 실제
    PDF/PPTX 렌더와 동일한 조건에서 측정한 뒤 원상복구한다."""
    return page.evaluate("""
        (minScale) => {
            const dpi = 96;
            const PDF_PAGE_W_IN = 13.33, PDF_PAGE_H_IN = 7.5, PDF_MARGIN_IN = 0.2;
            const pageW = (PDF_PAGE_W_IN - PDF_MARGIN_IN * 2) * dpi;
            const pageH = (PDF_PAGE_H_IN - PDF_MARGIN_IN * 2) * dpi;
            const sections = Array.from(document.querySelectorAll('.screen-section:not(#cover-page)'));
            const bodyOrigWidth = document.body.style.width;
            document.body.style.width = pageW + 'px';
            document.querySelectorAll('.wireframe-wrap').forEach(el => {
                el.dataset._verifyOrigAlignSelf = el.style.alignSelf;
                el.style.alignSelf = 'start';
            });
            // .pdf-only-page는 @media screen에서 display:none이므로 측정 직전 강제로 노출한다
            // (PDF/PPTX 실제 렌더 조건과 동일하게 맞춤 — 그렇지 않으면 scrollWidth/Height가 0/0이 되어
            // scale이 Infinity로 계산되고 실제로는 심하게 축소되는 섹션도 놓치는 오탐이 발생한다).
            const pdfOnlyEls = Array.from(document.querySelectorAll('.pdf-only-page'));
            pdfOnlyEls.forEach(el => {
                el.dataset._verifyOrigDisplay = el.style.display;
                el.style.setProperty('display', 'grid', 'important');
            });
            void document.body.offsetHeight;
            const problems = [];
            sections.forEach(sec => {
                const w = sec.scrollWidth, h = sec.scrollHeight;
                const scale = Math.min(pageW / w, pageH / h) * 0.995;
                if (scale < minScale) {
                    problems.push({
                        section_id: sec.id,
                        scale: Math.round(scale * 1000) / 1000,
                        scroll_w: w,
                        scroll_h: h,
                    });
                }
            });
            document.body.style.width = bodyOrigWidth;
            document.querySelectorAll('.wireframe-wrap').forEach(el => {
                el.style.alignSelf = el.dataset._verifyOrigAlignSelf || '';
                delete el.dataset._verifyOrigAlignSelf;
            });
            pdfOnlyEls.forEach(el => {
                if (el.dataset._verifyOrigDisplay) {
                    el.style.display = el.dataset._verifyOrigDisplay;
                } else {
                    el.style.removeProperty('display');
                }
                delete el.dataset._verifyOrigDisplay;
            });
            return problems;
        }
    """, min_scale)


def check_desc_underflow_pdfwidth(page, min_slack_px=150, min_scale=0.55):
    """R12: R6(check_desc_underflow)이 HTML 뷰(임의 뷰포트 폭) 기준으로 slack을 재기 때문에,
    실제 PDF 렌더 폭(약 1240px, .desc-wrap도 76:24 비율에 따라 그만큼 좁아짐)에서는 같은
    Description 텍스트가 훨씬 많은 줄바꿈을 먹어 slack이 크게 줄어들거나(때로는 R7 초과로
    이어지는) 경우를 R6 혼자서는 구분하지 못한다(2026-08-19 SCR-001 사고: cont-1에 NO=5를
    합치면 HTML 뷰 기준 slack은 줄어 보이지만, PDF 폭에서는 desc-wrap 높이가 wireframe-wrap
    보다 훨씬 커져서 R7 scale이 0.479까지 붕괴함 — 좁은 폭에서 텍스트가 줄바꿈되며 desc-wrap
    자체 높이가 늘어나는 게 원인. HTML 뷰 폭에서만 측정하는 R6은 이 변화를 전혀 못 봄).

    이 함수는 R6과 동일한 대상 선정 기준(.desc-continue가 있는 섹션만, 팝업 제외)을 쓰되,
    body 폭을 PDF 페이지 폭으로 강제한 뒤 slack을 재측정한다. 함께 반환하는 `note` 필드로
    "이 여백이 불가피한 것인지"를 시사한다 — 정확한 결론(다음 청크를 추가하면 R7이 발생하는지)
    은 이 함수만으로 자동 확정할 수 없으므로(청크 경계를 모름), slack이 여전히 크게 나오면
    가이드 1-1절 Step 5 원칙대로 "그 NO 하나가 페이지를 거의 다 채우는 상태"일 가능성이 높다는
    것만 알려준다 — 사람이 함께 check_print_scale_collapse(R7) 결과와 대조해 실제로 다음 청크를
    추가했을 때 R7이 발생하는지 반드시 실측 검증할 것(자동으로 대신해주지 않음).

    사용법 예(SCR-001 cont-1 사례로 실측 검증한 방식과 동일):
        1) 이 함수로 PDF 폭 기준 slack이 여전히 큰 섹션을 찾는다.
        2) 그 섹션에 다음 NO(또는 다음 요소 청크)를 추가한 임시 사본을 만들어
           check_print_scale_collapse()로 scale을 확인한다.
        3) scale이 min_scale 미만이면 그 여백은 "정상"(NO 완결성 우선 원칙에 따른 불가피한
           결과)이다 — 억지로 채우지 말 것. scale이 min_scale 이상이면 R6이 잡은 대로 실제
           결함이므로 페이지를 다시 짜야 한다."""
    return page.evaluate("""
        (args) => {
            const minSlack = args.minSlack;
            const dpi = 96;
            const pageW = (13.33 - 0.4) * dpi;
            const bodyOrigWidth = document.body.style.width;
            document.body.style.width = pageW + 'px';
            document.querySelectorAll('.wireframe-wrap').forEach(el => {
                el.dataset._verifyOrigAlignSelf = el.style.alignSelf;
                el.style.alignSelf = 'start';
            });
            void document.body.offsetHeight;

            const sections = Array.from(document.querySelectorAll('.screen-section'));
            const problems = [];
            sections.forEach(section => {
                const descWrap = section.querySelector('.desc-wrap');
                const wireframeWrap = section.querySelector('.wireframe-wrap');
                if (!descWrap || !wireframeWrap) return;
                const isPopup = !!section.querySelector('.popup-backdrop');
                if (isPopup) return;
                const hasContinue = !!descWrap.querySelector('.desc-continue');
                if (!hasContinue) return;

                const descHeight = descWrap.getBoundingClientRect().height;
                const wireframeHeight = wireframeWrap.getBoundingClientRect().height;
                const slack = wireframeHeight - descHeight;
                if (slack > minSlack) {
                    problems.push({
                        section_id: section.id,
                        desc_height: Math.round(descHeight),
                        wireframe_height: Math.round(wireframeHeight),
                        slack_px: Math.round(slack),
                        note: 'PDF 폭 기준으로도 여백이 큼 — 다음 청크 추가 시 R7(check_print_scale_collapse) 결과를 반드시 실측해 불가피한 여백인지 확인할 것',
                    });
                }
            });

            document.body.style.width = bodyOrigWidth;
            document.querySelectorAll('.wireframe-wrap').forEach(el => {
                el.style.alignSelf = el.dataset._verifyOrigAlignSelf || '';
                delete el.dataset._verifyOrigAlignSelf;
            });
            return problems;
        }
    """, {"minSlack": min_slack_px})


def check_print_only_layout_leftovers(html_path):
    """R8: PDF/PPT 전용 정적 페이지(원본 화면 옆에 별도로 만든, 표 데이터 전체를 담기 위한
    섹션 — 예: SCR-001의 "공정별 상세 전체" 페이지)에 사이드바(GNB)나 상단 필터/탭처럼
    "이 페이지의 존재 이유가 아닌" 영역이 그대로 남아있는지 정적으로 검사한다(2026-08-19
    사고: scr-001-table 페이지가 좌측 사이드바/탭/필터/요약현황을 배경째로 끌고 와서, 표만
    보여주려던 원래 의도와 다르게 일반 화면과 거의 같은 모습으로 나왔다).

    판별 대상: id가 '-table'로 끝나거나 Status 배지 문구에 "PDF/PPT 전용"이 포함된 섹션.
    그 섹션 안에 사이드바 특유의 마커(SIDEBAR_ITEMS 렌더링 결과인 GNB 링크 목록, 클래스명
    'sidebar' 등)가 남아있으면 결함으로 본다. 이 검사는 "PDF 전용 페이지는 사이드바를 아예
    빼야 한다"는 특정 화면(SCR-001)의 정책을 일반화한 것이므로, 오탐 가능성이 있으면 —
    즉 어떤 PDF 전용 페이지가 의도적으로 사이드바를 유지하기로 했다면 — 이 함수의 판별
    조건 자체를 그 케이스에 맞게 조정할 것(무조건 통과시키지 말고 판단 근거를 남길 것)."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    bad = []
    for m in _re.finditer(r'<div id="([a-zA-Z0-9_-]+)" class="screen-section[^"]*">(.*?)(?=<div id="[a-zA-Z0-9_-]+" class="screen-section|\Z)', content, _re.S):
        sec_id, body = m.group(1), m.group(2)
        is_print_only_page = sec_id.endswith('-table') or 'PDF/PPT 전용' in body[:3000]
        if not is_print_only_page:
            continue
        has_sidebar_markers = ('공정 자동화 현황</div>' in body and '중장기 방향성 공유</div>' in body)
        if has_sidebar_markers:
            line_no = content.count("\n", 0, m.start()) + 1
            bad.append({"section_id": sec_id, "near_line": line_no})
    return {"ok": len(bad) == 0, "bad_sections": bad}


def check_screen_only_page_hidden_in_print(page):
    """R14(2026-08-19 도입): .screen-only-page(.pdf-only-page의 반대 방향 매체 분기 —
    HTML 브라우저 뷰에서만 노출되고 PDF/PPT에서는 완전히 빠져야 하는 페이지. 최초 사례:
    SCR-001의 "공정별 상세 전체 스크롤 보기" 페이지 scr-001-scroll, 사용자가 "HTML 3~4P에
    있던 스크롤이 없어졌다"고 지적해 복원하면서 도입) 클래스를 가진 섹션이 실제로
    @media print 아래에서 display:none이 되는지 emulate_media(media="print")로 실측한다.

    사고 이력: 이 페이지를 처음 만들 때 CSS를 `@media print { .screen-only-page {
    display:none !important; } }`로만 작성했는데, 같은 파일 앞쪽(.screen-section 공통 스타일)
    에 이미 `@media print { .screen-section:not(#cover-page) { display: grid !important; } }`
    규칙이 있었다. CSS 특정도는 `:not(#cover-page)`의 ID가 그대로 특정도의 id 자리에
    가산되므로(class 1 + id 1 = (0,1,1,0)) `.screen-only-page` 단독(class 1, (0,0,1,0))은
    물론 `.screen-section.screen-only-page`(class 2, (0,0,2,0))로 올려도 id 자리가 0이라
    여전히 진다 — !important끼리는 소스 순서가 아니라 특정도가 우선이기 때문에, 실제로
    PDF를 열어보기 전까지는 육안 스크린샷(HTML 뷰)만으로는 이 실패가 전혀 드러나지 않았다
    (해당 클래스는 HTML/screen 미디어에서는 애초에 아무 효과가 없는 게 정상이므로).
    render_pdf_via_print()로 실제 PDF를 만들어 PyMuPDF로 텍스트를 검색해서야 해당 페이지의
    Status 배지 문구가 PDF 페이지에 그대로 출력된 것을 발견했다. 해결: 클래스 조합이 아니라
    섹션 자신의 id 셀렉터(#scr-001-scroll.screen-only-page, 특정도 (0,1,0,0), id 1개는
    class를 아무리 더해도 못 이기는 값이 아니라 반대로 id 1개 vs id 1개+class 1개 비교에서
    class 쪽이 추가로 밀리므로 id 자리를 채우는 쪽이 확실히 이김)로 바꿔서 해결했다 — 새
    .screen-only-page를 추가할 때마다 그 섹션의 id를 CSS 셀렉터에 명시해야 한다는 뜻이다.

    이 함수는 (a) print 미디어 강제 전환 후 .screen-only-page 각 섹션의 computed display가
    'none'인지, (b) downloadPPTX() 함수 소스 안에 그 섹션을 슬라이드 루프에서 스킵하는
    분기(classList.contains('screen-only-page') 뒤 continue)가 존재하는지 함께 확인한다."""
    page.emulate_media(media="print")
    result = page.evaluate("""
        () => {
            const bad = [];
            document.querySelectorAll('.screen-only-page').forEach(el => {
                const display = getComputedStyle(el).display;
                if (display !== 'none') {
                    bad.push({ section_id: el.id, computed_display: display });
                }
            });
            return bad;
        }
    """)
    # 주의(2026-08-19 발견): emulate_media(media=None)은 "에뮬레이션 해제"가 아니라
    # 인자를 안 넘긴 것과 동일하게 취급되어 print 상태가 그대로 유지된다(실측 확인 —
    # window.matchMedia('print').matches가 True로 남음). 반드시 media="screen"으로
    # 명시해야 실제로 화면 매체로 되돌아간다. 이 버그로 인해 check_all_regressions() 이후
    # 같은 page 객체를 재사용하는 후속 코드(PPTX 다운로드 버튼 클릭 등)에서 @media print
    # 규칙(.no-print { display:none } 등)이 계속 적용되어 버튼이 안 보이는 오류가 발생했다.
    page.emulate_media(media="screen")
    return {"ok": len(result) == 0, "still_visible_in_print": result}


def check_screen_only_page_pptx_skip(html_path):
    """R14 보조: downloadPPTX()의 슬라이드 생성 루프(`pptx.addSlide()` 호출부) 앞에
    `.screen-only-page`를 continue로 건너뛰는 분기가 실제로 소스에 존재하는지 정적으로
    확인한다. 없으면 CSS만으로는 PPTX(라이브 DOM 직접 순회, @media 미적용)를 못 막아
    빈 배경색 슬라이드가 하나 생겨버린다(실측 확인된 사고, check_screen_only_page_hidden_in_print
    docstring 참고)."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    has_marker = "screen-only-page" in content
    if not has_marker:
        return {"ok": True, "note": ".screen-only-page 클래스를 쓰는 섹션이 없음 — 검사 대상 아님"}
    has_skip = _re.search(r"classList\.contains\(['\"]screen-only-page['\"]\)\s*\)\s*continue", content) is not None
    return {"ok": has_skip, "has_screen_only_page_marker": has_marker, "has_pptx_skip_guard": has_skip}


def check_pptx_phantom_overflow_pages(page, small_overflow_tolerance_in=0.5):
    """R20(2026-08-25 도입): downloadPPTX()의 desc-table 8pt 재계산이 원본 HTML에는 없는
    "가상 이월(-cont-N) 페이지"를 만들어내는지 다운로드 없이 정적으로 미리 잡는다.

    사고 배경: SCR-014는 원본 HTML에 -cont-1 청크가 없는데(12~13px 기준으로는 한 화면에
    다 들어가서 애초에 안 나눠 둠), PPT 변환 시 desc-table을 8pt로 재계산하는 과정에서
    "폭은 scale만큼 줄어드는데 폰트는 8pt로 고정"되는 구조적 특성 때문에 NO=3 행이 캔버스
    높이를 약 0.4in 초과한다고 오판정됐다. 실제로는 육안상 전혀 넘치지 않는 경계 케이스였는데,
    downloadPPTX()가 이걸 "진짜 오버플로우"로 처리해 화면 전체(사이드바·GNB·필터·카드
    그리드 전부)를 통째로 복제한 가상 -cont-1 섹션을 추가로 만들어, 결과 PPTX가 원본보다
    1장 더 많은 페이지로 나왔다(사용자가 첨부한 목표 PDF와 PPT 다운로드 결과를 페이지 수로
    비교하다가 발견 — 육안 대조로는 두 페이지 내용이 겹쳐 보여 놓치기 쉬웠다).

    이 함수는 각 원본 SCR 섹션(팝업/이미 존재하는 -cont-N 아님)에 대해 downloadPPTX()와
    동일한 sbpptxBuildDescTable()을 그대로 호출해 hasOverflow를 실측하고, hasOverflow가
    나면서 원본 HTML에 그 화면의 다음 -cont-N 섹션이 실제로 없는 경우(=PPT가 가상 섹션을
    새로 만들어야 하는 경우)만 골라 초과분(in)을 함께 보고한다. 초과분이
    small_overflow_tolerance_in(desc-table의 SMALL_OVERFLOW_TOLERANCE_IN과 동일 기본값
    0.5in) 이하면 downloadPPTX() 쪽 소형 초과 허용 로직이 이미 흡수하므로 문제없음으로
    분류하고, 그보다 크면 실제로 새 가상 페이지가 생길 것이므로 결함으로 보고한다.

    주의: downloadPPTX() 안의 SMALL_OVERFLOW_TOLERANCE_IN 상수값을 바꾸면 이 함수의
    small_overflow_tolerance_in 인자도 반드시 같이 맞출 것 — 두 값이 어긋나면 이 체크가
    실제 downloadPPTX() 동작과 다른 기준으로 판정하게 된다."""
    return page.evaluate("""
        (toleranceIn) => {
            const SLIDE_W = 13.33, SLIDE_H = 7.5;
            const allSections = Array.from(document.querySelectorAll('.screen-section'));
            const idSet = new Set(allSections.map(s => s.id));
            const descBaseId = (id) => id.replace(/-cont-\\d+$/, '');
            const results = [];
            for (const section of allSections) {
                if (!section.id || section.classList.contains('screen-only-page')) continue;
                if (section.id.includes('-popup-')) continue;
                if (/-cont-\\d+$/.test(section.id)) continue; // 이미 사람이 만들어 둔 청크는 대상 아님
                const table = section.querySelector('.desc-table');
                if (!table) continue;

                const sRect = section.getBoundingClientRect();
                if (sRect.width < 10 || sRect.height < 10) continue;
                const scale = Math.min(SLIDE_W / sRect.width, SLIDE_H / sRect.height);
                const sx = sRect.left + window.scrollX, sy = sRect.top + window.scrollY;

                const wfEl = section.querySelector('.wireframe-wrap');
                const wfBottomIn = wfEl
                    ? (wfEl.getBoundingClientRect().bottom + window.scrollY - sy) * scale
                    : SLIDE_H;
                const tableRect = table.getBoundingClientRect();
                const tableY = (tableRect.top + window.scrollY - sy) * scale;
                const bannerReserveIn = 0.32;
                const maxHeightIn = Math.max(0.5, wfBottomIn - tableY - bannerReserveIn);

                let built;
                try {
                    built = sbpptxBuildDescTable(table, sx, sy, scale, 0, 0, SLIDE_W, SLIDE_H, null, maxHeightIn);
                } catch (e) {
                    results.push({ section_id: section.id, error: String(e) });
                    continue;
                }
                if (!built || !built.hasOverflow) continue;

                const nextContId = descBaseId(section.id) + '-cont-1';
                const hasRealContChunk = idSet.has(nextContId);
                if (hasRealContChunk) continue; // 원본에 이미 사람이 나눠 둔 다음 청크가 있음 — 정상 이월

                const overflowIn = (built.heightIn || 0) - maxHeightIn;
                results.push({
                    section_id: section.id,
                    max_height_in: Math.round(maxHeightIn * 1000) / 1000,
                    built_height_in: Math.round((built.heightIn || 0) * 1000) / 1000,
                    overflow_in: Math.round(overflowIn * 1000) / 1000,
                    within_tolerance: overflowIn <= toleranceIn,
                });
            }
            return results;
        }
    """, small_overflow_tolerance_in)


def check_template_layout_ratio(page, canvas_pct=76.0, tolerance_pct=1.5):
    """R13: `05.리포트/화면설계서_템플릿.md`가 고정 규격으로 못박은 캔버스(좌측, 0~76%
    폭)/설명(우측, 76~100% 폭) 비율이 실제로 모든 화면 페이지에서 지켜지는지 실측한다
    (2026-08-19 사용자 지적: "템플릿 크기가 고정으로 유지돼야 하는데 상황에 따라 변동되는
    것 같다" — 실측해 보니 그날은 비율 자체보다 캔버스 내용물 불일치가 원인이었지만, 비율
    이탈 자체도 앞으로 재발할 수 있으므로 별도 상시 회귀 체크로 코드화한다).

    측정 대상: `.wireframe-wrap`(캔버스)과 `.desc-wrap`(설명)을 모두 가진 섹션(팝업/커버/
    부록처럼 이 2분할 구조를 안 쓰는 페이지는 애초에 템플릿의 "SCR-XXX 화면" 규격 대상이
    아니므로 자동 스킵). `.pdf-only-page`(`@media screen`에서 숨겨진 PDF/PPT 전용 정적
    페이지, 예: scr-001-table)는 R7과 동일하게 측정 직전 강제로 노출시켜 실제 PDF/PPTX
    렌더와 같은 조건에서 잰다 — 단, 이런 페이지가 의도적으로 설명(Description) 영역을
    비웠거나(R8 참고, "이 페이지는 표만 보여주는 목적") 아예 캔버스를 100% 폭으로 쓰기로
    확정한 경우, 그 자체는 템플릿 위반이 아니라 스킬 문서에 근거를 남긴 의도된 예외이므로
    호출자가 `exempt_section_ids`로 명시적으로 제외해야 한다(이 함수는 그 목록을 모르므로
    무조건 76:24만 검사한다 — 예외가 있으면 결과에서 해당 section_id를 걸러내고 판단할 것).

    캔버스 폭 비율(canvas / (canvas + desc) * 100)이 canvas_pct ± tolerance_pct를 벗어나면
    결함으로 본다. 기본 tolerance 1.5%p는 서브픽셀 렌더링 오차를 흡수하는 정도로만 좁게
    잡았다 — 실제 레이아웃 사고(예: 사이드바 제거로 캔버스 내부 grid-template-columns
    자체가 다시 계산된 경우)는 보통 수 %p 이상 벌어진다."""
    return page.evaluate("""
        (args) => {
            const canvasPct = args.canvasPct, tolerance = args.tolerance;
            const pdfOnlyEls = Array.from(document.querySelectorAll('.pdf-only-page'));
            pdfOnlyEls.forEach(el => {
                el.dataset._verifyOrigDisplay = el.style.display;
                el.style.setProperty('display', 'grid', 'important');
            });
            void document.body.offsetHeight;

            const sections = Array.from(document.querySelectorAll('.screen-section'));
            const problems = [];
            sections.forEach(section => {
                const canvas = section.querySelector('.wireframe-wrap');
                const desc = section.querySelector('.desc-wrap');
                if (!canvas || !desc) return; // 2분할 구조가 아닌 페이지(커버/부록 등)는 대상 아님
                const cw = canvas.getBoundingClientRect().width;
                const dw = desc.getBoundingClientRect().width;
                if (cw <= 0 || dw <= 0) return; // 강제 노출에도 여전히 0이면 별도 원인 — R7/R8이 이미 잡음
                const actualPct = (cw / (cw + dw)) * 100;
                if (Math.abs(actualPct - canvasPct) > tolerance) {
                    problems.push({
                        section_id: section.id,
                        canvas_width: Math.round(cw),
                        desc_width: Math.round(dw),
                        canvas_pct: Math.round(actualPct * 100) / 100,
                        expected_pct: canvasPct,
                    });
                }
            });

            pdfOnlyEls.forEach(el => {
                if (el.dataset._verifyOrigDisplay) {
                    el.style.display = el.dataset._verifyOrigDisplay;
                } else {
                    el.style.removeProperty('display');
                }
                delete el.dataset._verifyOrigDisplay;
            });
            return problems;
        }
    """, {"canvasPct": canvas_pct, "tolerance": tolerance_pct})


def check_no_number_ambiguity(page):
    """R15: 같은 화면 그룹(예: scr-001, scr-001-scroll, scr-001-cont-1 …) 안에서 같은
    Description NO 번호가 서로 다른 "영역명"으로 두 번 이상 쓰이는지 검사한다(2026-08-19
    사고: `scr-001-scroll`(HTML 전용 "전체보기" 페이지)의 NO=4가 "상세 영역 (전체 보기)"라는
    짧은 안내문이었는데, 같은 그룹의 `scr-001-cont-1`에도 NO=4가 "상세 영역"이라는 진짜
    상세설명으로 따로 있어 사용자가 "NO=4가 2화면에 나뉘어 있다"고 혼란스러워했다).

    **팝업 페이지는 비교 대상에서 제외한다(2026-08-19 초판 구현의 오탐 수정)**: 작성가이드
    Step 4-2 규칙상 팝업 전용 페이지(`.popup-backdrop`가 있는 섹션)는 그 자체로 독립된 NO
    네임스페이스를 가질 수 있다 — ① 상위 화면의 NO를 그대로 이어받는 정상 케이스도 있지만,
    ② 팝업이 이미 자기 완결적으로 상세를 갖췄다면(Step 4-2 "주의" 문단, 2026-08-18 도입)
    상위의 요약 NO 행 자체를 아예 만들지 않고, 그 결과 팝업 페이지들이 각자 NO=1부터 새로
    매기는 것도 정상이다(예: `scr-002-popup-stdprocess` NO=1 "팝업 영역" vs 같은 그룹의
    `scr-002` NO=1 "조회 필터 & 액션 버튼" — 완전히 다른 영역을 우연히 같은 번호로 각자
    독립적으로 매긴 것뿐, 실제 사고가 아니다). 초판 구현은 팝업을 그룹 내 다른 모든 섹션과
    동일하게 비교해 이 정상 패턴을 대량 오탐(scr-001/002/004/006/007/008/009/010/011/012/014
    전 그룹에서 발생 확인)으로 잡아냈다 — 팝업이 상위 NO를 그대로 이어받았는지, 아니면
    독자적으로 새로 매겼는지는 정적으로 신뢰성 있게 구분할 수 없으므로, 팝업은 서로 간(팝업↔팝업
    포함) 비교 대상에서 전부 제외하고 **비-팝업 섹션끼리만** 비교한다(원래 이 함수가 잡아야
    했던 `scr-001-scroll` vs `scr-001-cont-1` 사고 케이스는 둘 다 비-팝업 섹션이므로 이 제외
    로직과 무관하게 계속 잡힌다).

    **탐지만 한다 — 자동으로 고치지 않는다.** 이 사고는 애초에 "정상적인 이어붙임 페이지의
    같은 NO 반복"(Step 5, `cont-row`로 표시되는 정상 케이스: 같은 NO가 원본과 이어붙임
    페이지에 걸쳐 반복되되 영역명은 동일)과 "번호가 우연히 겹쳤을 뿐 실제로는 서로 다른
    내용을 가리키는 잘못된 중복"을 구분해야 하는데, 이 구분은 영역명 텍스트가 같은지 다른지
    비교하는 것으로 기계적으로 판별 가능하다 — 영역명이 다르면 잘못된 중복(사람이 확인),
    같으면 정상 이어붙임(문제 없음)으로 분류한다.

    **상태 변형 섹션(-selectmode/-detail)도 비교 대상에서 제외한다(2026-08-19 두 번째 오탐
    수정)**: `scr-014-selectmode`(카드 그리드가 선택모드로 전환된 상태)의 NO=1/2가 `scr-014`
    (기본 목록 상태)의 NO=1/2와 문자열도 다르고 실제로 서로 다른 영역을 가리켜 R15가 잡았지만,
    사용자 확인 결과 selectmode는 "안내문/리다이렉트"가 아니라 원본과 구조가 다른 **화면 상태를
    설명하는 별도의 정식 Description**이었다 — groupKey가 `-selectmode`/`-detail` 접미사를
    잘라내 원본과 같은 그룹으로 묶어버리는 것 자체가 과잉 비교였다. 팝업과 동일한 논리(자기
    완결적 설명은 독자적 NO 네임스페이스를 가질 수 있다)로, `-selectmode`/`-detail`로 끝나는
    섹션은 `is_state_variant`로 판별해 그룹 내 NO 충돌 비교에서 제외한다. 만약 향후 다른
    상태 변형 접미사(예: `-expanded`, `-edit`)가 같은 패턴의 오탐을 낸다면 이 정규식에 추가할 것
    — 단, 그 전에 "정말 안내문인지 자기 완결적 정식 설명인지"를 실제 내용으로 먼저 확인해야
    한다(모든 접미사가 이 예외에 해당하는 것은 아니다 — `scr-001-scroll`은 반대로 R15가 잡아야
    하는 진짜 사고 케이스였다).

    **해결 절차(2026-08-19 사고에서 실제로 적용한 표준 처리, 이후 유사 사고에도 그대로
    적용할 것)**:
    1. 두 섹션 중 어느 쪽이 "진짜 상세설명"이고 어느 쪽이 "다른 페이지를 참고하라는 안내문/
       요약"인지 판별한다(보통 안내문 쪽이 텍스트가 훨씬 짧고 "참고", "확인 가능합니다" 같은
       리다이렉트 표현을 포함한다).
    2. 안내문 쪽 섹션의 Description `<td class="num">`을 실제 숫자 대신 `-`(하이픈)로 바꿔
       번호를 떼어낸다 — 그 섹션 안에서 완결된 정보(무엇을 어디서 볼 수 있는지)는 유지하되,
       "이것도 NO=N의 정식 설명이다"라는 오해를 없앤다.
    3. 그 섹션의 캔버스(와이어프레임)에 있던 대응 `.indicator`(영역 배지, N번)도 함께
       제거한다 — Description 번호와 캔버스 배지는 1:1 대응이 원칙이므로, 번호를 뗐는데
       배지만 남으면 그 배지가 무엇을 가리키는지 알 수 없는 새 혼란이 생긴다.
    4. 두 섹션(원래 있던 진짜 상세설명 쪽)은 그대로 둔다 — 그 쪽이 유일한 정식 NO=N이 된다.
    5. 사용자에게 "어느 쪽을 안내문으로, 어느 쪽을 정식 설명으로 남길지"와 "배지도 함께
       지울지"는 AskUserQuestion으로 확인하고 진행한다(자동 판단하지 않는다 — 어느 페이지가
       더 자연스러운 기준점인지는 문서 맥락에 따라 다르다).

    반환값: {group_key: [{no, section_ids: [...], area_names: [...]}]} 형태로, 같은 그룹 안에서
    같은 NO가 서로 다른 영역명으로 등장하는 케이스만 추린다(영역명이 완전히 같으면 정상
    이어붙임이므로 결과에서 제외)."""
    return page.evaluate("""
        () => {
            const sections = Array.from(document.querySelectorAll('.screen-section'));
            const groupKey = (id) => id.replace(/-(cont-\\d+|popup(-[a-z0-9]+)*|selectmode|detail|scroll|table(-\\d+)?)$/i, '')
                                       .replace(/-(cont-\\d+|popup(-[a-z0-9]+)*|selectmode|detail|scroll|table(-\\d+)?)$/i, '');

            // groupKey -> NO -> [{section_id, area_name, is_popup}]
            const groups = {};
            sections.forEach(section => {
                const key = groupKey(section.id);
                const table = section.querySelector('.desc-table');
                if (!table) return;
                // 팝업 전용 페이지는 Step 4-2 규칙상 독립된 NO 네임스페이스를 가질 수 있으므로
                // (상위 NO를 이어받거나, 자기 완결적이면 1부터 새로 매기거나 — 둘 다 정상)
                // 다른 섹션과의 NO 충돌 비교에서는 제외한다. .popup-backdrop 유무로 판별
                // (R6/R7이 이미 같은 마커로 팝업 섹션을 식별하는 것과 동일한 방식).
                const isPopup = !!section.querySelector('.popup-backdrop');
                // -selectmode/-detail 등은 팝업과 마찬가지로 "원본 화면의 특정 상태"를 그
                // 상태만 떼어 자기 완결적으로 설명하는 독립 섹션일 수 있다(2026-08-19 발견:
                // scr-014-selectmode NO=1 "선택모드 안내 배너"/NO=2 "카드+라디오 오버레이"가
                // scr-014 NO=1 "검색 & 액션 버튼"/NO=2 "카드 그리드(목록뷰)"와 번호만 겹칠 뿐
                // 서로 다른 정식 설명 — selectmode는 "안내문"이 아니라 원본과 구조적으로 다른
                // 화면 상태의 정식 Description이므로, groupKey가 원본과 합쳐버리는 것 자체가
                // 과잉 비교다). 팝업과 동일하게 그룹 내 NO 충돌 비교에서 제외한다.
                const isStateVariant = /-(selectmode|detail)$/i.test(section.id);
                const rows = Array.from(table.querySelectorAll('tbody > tr'));
                rows.forEach(row => {
                    const numCell = row.querySelector('td.num');
                    if (!numCell) return;
                    const no = numCell.textContent.trim();
                    if (!no || no === '-') return; // 이미 번호 없는 안내문 처리된 행은 스킵
                    const bodyCell = row.querySelector('td:not(.num)');
                    if (!bodyCell) return;
                    // Step 5 규칙상 cont-row는 원래 영역의 NO를 그대로 반복하는 이어붙임 행이며,
                    // <b> 텍스트도 보통 "영역명:"이 아니라 그 안의 세부 요소 라벨("요소: 2-2 수정" 등)을
                    // 담고 있어 원본 행의 area_name과 문자열이 다른 것이 정상이다(2026-08-19 발견:
                    // scr-002-cont-1 NO=2 cont-row가 "요소: 2-2 수정"으로 표기되어 scr-002 NO=2의
                    // "영역명: 표준공정 마스터 목록"과 문자열이 달라 오탐 발생 — area_name 비교로는
                    // cont-row의 정상성을 판별할 수 없으므로, cont-row 자체를 비교 대상에서 제외한다.
                    const isContRow = row.classList.contains('cont-row');
                    const boldEl = bodyCell.querySelector('b');
                    const areaName = boldEl ? boldEl.textContent.trim() : bodyCell.textContent.trim().slice(0, 40);

                    if (!groups[key]) groups[key] = {};
                    if (!groups[key][no]) groups[key][no] = [];
                    groups[key][no].push({ section_id: section.id, area_name: areaName, is_popup: isPopup, is_cont_row: isContRow, is_state_variant: isStateVariant });
                });
            });

            const ambiguous = {};
            Object.keys(groups).forEach(key => {
                Object.keys(groups[key]).forEach(no => {
                    // 팝업 섹션, cont-row(이어붙임 반복 행), 상태 변형 섹션(selectmode/detail)은
                    // 비교 대상에서 제외 — 나머지 "정식 영역명 행"끼리만 충돌 여부를 판단한다.
                    const entries = groups[key][no].filter(e => !e.is_popup && !e.is_cont_row && !e.is_state_variant);
                    const distinctSectionIds = new Set(entries.map(e => e.section_id));
                    if (distinctSectionIds.size < 2) return; // 한 섹션 안에서만 나오면 문제 아님(예: cont-row 반복은 같은 섹션 아님, 별도 섹션이어야 대상)
                    const distinctAreaNames = new Set(entries.map(e => e.area_name));
                    if (distinctAreaNames.size < 2) return; // 영역명이 전부 같으면 정상 이어붙임(cont) 반복 — 문제 아님
                    if (!ambiguous[key]) ambiguous[key] = [];
                    ambiguous[key].push({
                        no: no,
                        section_ids: Array.from(distinctSectionIds),
                        area_names: Array.from(distinctAreaNames),
                    });
                });
            });
            return ambiguous;
        }
    """)


def check_filter_bar_label_stack_style(html_path):
    """R16(2026-08-19 도입): 관리자 화면(data-area="1" 필터 영역)에 "라벨 위/입력 아래" 세로형
    필터 레이아웃이 남아있는지 검사한다.

    사고 배경: 실제 구현(src/frontend/js/render.js)의 filter-bar는 라벨 없이 select/input을
    한 줄로 나열하고 `<div class="filter-spacer">`로 조회 버튼을 우측 정렬하는 스타일로
    통일되어 있다(SCR-001/003/006이 원조, 이후 SCR-002/007도 이 스타일로 맞춤). 그런데
    화면설계서 와이어프레임은 화면별로 개별 제작되다 보니 일부(SCR-002, SCR-004가 실제
    발견된 사례)가 각 필터 위에 `font-size:11px; color:#888` 라벨 div를 얹은 구버전
    세로형 레이아웃으로 남아 있었다 — SCR-002는 2026-08-19 "조회 필터바 UI 정합화" 커밋으로,
    SCR-004는 이 R16을 추가한 시점에 함께 고쳐졌다. 이 함수는 그 회귀가 다른 관리자 화면
    (SCR-005 등)이나 향후 재작업에서 재발하는지 기계적으로 감시한다.

    판별 대상: `<div id="scr-XXX" ...>` 본문(및 -cont-N, -popup-* 등 동일 그룹 섹션)의
    `data-area="1"` 블록 안에서, `font-size:11px; color:#888` 스타일의 라벨 div 바로 뒤에
    입력/셀렉트 박스가 오는 세로형 패턴이 2회 이상 반복되면 구버전 스타일 잔존으로 본다
    (1회는 우연한 스타일 일치일 수 있어 오탐을 줄이려 임계값을 2로 둔다).

    이 검사는 "필터바는 전부 라벨 없는 한 줄 스타일이어야 한다"는 현재 정책을 코드화한
    것이므로, 만약 특정 화면이 의도적으로 라벨형 필터를 쓰기로 결정되면(요구사항 변경 등)
    이 함수의 판별 조건이나 예외 목록을 그 결정에 맞게 조정할 것 — 무조건 통과시키지 말고
    조정 근거를 이 docstring에 남길 것."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    label_stack_pattern = _re.compile(
        r'font-size:11px;\s*color:#888[^"]*">[^<]{1,20}</div>\s*<div style="width:\d+px; height:32px; border:1px solid #999'
    )
    bad = []
    for m in _re.finditer(r'<div id="([a-zA-Z0-9_-]+)" class="screen-section[^"]*">(.*?)(?=<div id="[a-zA-Z0-9_-]+" class="screen-section|\Z)', content, _re.S):
        sec_id, body = m.group(1), m.group(2)
        area1_m = _re.search(r'<div data-area="1">(.*?)</div></div><div data-area="2">', body, _re.S)
        if not area1_m:
            continue
        hits = label_stack_pattern.findall(area1_m.group(1))
        if len(hits) >= 2:
            line_no = content.count("\n", 0, m.start()) + 1
            bad.append({"section_id": sec_id, "near_line": line_no, "label_count": len(hits)})
    return {"ok": len(bad) == 0, "bad_sections": bad}


def check_fixed_width_card_grid(html_path, min_repeat=2):
    """R17(2026-08-19 도입, 정보성): 카드형 요소가 실제 CSS에서는 컨테이너 폭에 비례해 꽉
    채우는 grid(`display:grid; grid-template-columns:repeat(N,1fr)`)인데, 와이어프레임에서는
    `flex-wrap:wrap` 컨테이너 안에 카드마다 동일한 고정 `width:NNpx`를 줘서 카드가 작게 좌측에
    몰리고 우측에 큰 여백이 남는 구버전 패턴으로 그려졌는지 의심 케이스를 잡는다.

    사고 배경: MTRM-MAIN "생산기술 Tech PR" 카드가 실제로는 `.card-grid-3`
    (`grid-template-columns:repeat(3,1fr)`, `src/frontend/css/common.css`)로 패널 폭을 정확히
    3등분해 꽉 채우는데, 와이어프레임은 `display:flex; gap:14px; flex-wrap:wrap`에 카드마다
    `width:120px`(처음엔 160px) 고정값을 줘서 그려져 있었다. 종횡비(16:9→1:1)만 먼저 고치고
    이 배치 방식 차이는 사용자가 두 차례 지적한 뒤에야 발견됐다 — "저충실도 손그림 스타일"은
    색상·질감을 단순화하라는 것이지 레이아웃 배치 방식(고정폭 vs 비율분할)까지 바꿔도 된다는
    뜻이 아니라는 원칙을 코드화했다(가이드 Step 9-(e) 참고).

    판별 대상: 같은 `flex-wrap:wrap` 컨테이너 직계 자식으로 동일한 `width:NNpx` 고정값을 가진
    카드형 div(뒤에 `border:1px solid #ccc`가 붙는 카드 껍데기)가 min_repeat(기본 2)회 이상
    반복되면 의심 케이스로 본다. 이 검사는 "고정폭 카드가 항상 틀렸다"를 단정하지 않는다 —
    실제 구현이 정말 고정폭 카드(예: 개수가 가변적이라 폭이 고정이어야 자연스러운 목록)라면
    오탐이므로 `ok` 판정(전체 통과 여부)에는 포함하지 않고, 발견 시 반드시 해당 컴포넌트의
    실제 `common.css` 클래스 정의를 확인해 grid 비율분할이 맞는지 사람이 판단해야 한다."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    # flex-wrap 컨테이너 시작 지점 뒤 800자 이내(카드 3~5개 분량 여유)에서 동일 폭 카드가
    # 반복되는지 본다 — 균형 괄호 파싱 없이 "컨테이너 시작 직후 구간에 동일 width가 N회
    # 이상 나타나는가"만 보는 근사 검사이므로, 너무 먼 거리의 우연한 동일 폭은 잡지 않는다.
    flex_wrap_pattern = _re.compile(r'<div style="display:flex; gap:\d+px; flex-wrap:wrap;">')
    fixed_width_card_pattern = _re.compile(
        r'<div style="width:(\d+)px; border:1px solid #ccc; background:#fff;">'
    )
    suspicious = []
    for m in _re.finditer(r'<div id="([a-zA-Z0-9_-]+)" class="screen-section[^"]*">(.*?)(?=<div id="[a-zA-Z0-9_-]+" class="screen-section|\Z)', content, _re.S):
        sec_id, body = m.group(1), m.group(2)
        for flex_m in flex_wrap_pattern.finditer(body):
            window = body[flex_m.end():flex_m.end() + 800]
            hits = fixed_width_card_pattern.findall(window)
            if len(hits) >= min_repeat and len(set(hits)) == 1:
                line_no = content.count("\n", 0, m.start()) + 1
                suspicious.append({"section_id": sec_id, "near_line": line_no, "card_count": len(hits), "width_px": hits[0]})
    return {"ok": len(suspicious) == 0, "suspicious_cards": suspicious}


def check_card_thumb_aspect_ratio(html_path, css_path=None):
    """R18(2026-08-19 도입, 정보성): 미디어 카드(썸네일+텍스트, 예: SCR-014 기술동향)의
    썸네일이 실제 `common.css`의 `.media-thumb`/카드 썸네일 정의(`aspect-ratio:1/1` 등 컨테이너
    폭에 비례하는 정사각형)를 쓰는데, 와이어프레임에서는 고정 `height:NNpx` 픽셀값으로 그려져
    카드 전체 종횡비가 실제 화면과 달라지는 케이스를 잡는다.

    사고 배경: SCR-014 "기술동향 - 수정 선택모드" 카드 그리드가 일반 목록뷰(scr-014)와 동일한
    데이터(카드 10개, `grid-template-columns:repeat(5,1fr)`)를 쓰면서도, 썸네일만
    `height:110px` 고정값으로 그려져 있었다(일반 목록뷰는 이미 `aspect-ratio:1/1`로 정확히
    구현돼 있었음 — 같은 화면 안에서도 상태(선택모드)별로 구현 방식이 갈릴 수 있다는 뜻이므로,
    화면 하나를 확인했다고 그 화면의 다른 상태 페이지까지 안전하다고 가정하지 않는다). R17이
    잡는 "그리드 자체가 flex 고정폭으로 틀어진" 패턴과는 다른 하위 사고 유형 — 그리드 배치
    방식(비율분할)은 맞았지만 카드 내부 썸네일 종횡비가 실제 CSS와 어긋난 경우다.

    판별 대상: `display:grid`류 카드 컨테이너 안에서 `height:\\d+px`로 고정된 카드 썸네일 블록이
    반복되면 의심 케이스로 본다. 이 검사도 R17처럼 정보성이다 — 실제 구현이 정말 고정 높이
    썸네일(16:9 비디오 프리뷰 등)이라면 오탐이므로 `ok` 판정에는 포함하지 않고, 발견 시
    `src/frontend/css/common.css`의 해당 카드/썸네일 클래스 정의(`aspect-ratio` vs 고정
    `height`)를 직접 대조해 사람이 판단해야 한다."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    grid_container_pattern = _re.compile(r'display:grid;\s*grid-template-columns:repeat\(\d+,\s*1fr\)')
    fixed_height_thumb_pattern = _re.compile(r'<div style="height:(\d+)px; background:repeating-linear-gradient')
    suspicious = []
    for m in _re.finditer(r'<div id="([a-zA-Z0-9_-]+)" class="screen-section[^"]*">(.*?)(?=<div id="[a-zA-Z0-9_-]+" class="screen-section|\Z)', content, _re.S):
        sec_id, body = m.group(1), m.group(2)
        for grid_m in grid_container_pattern.finditer(body):
            window = body[grid_m.end():grid_m.end() + 6000]
            hits = fixed_height_thumb_pattern.findall(window)
            if len(hits) >= 2:
                line_no = content.count("\n", 0, m.start()) + 1
                suspicious.append({"section_id": sec_id, "near_line": line_no, "card_count": len(hits), "height_px": hits[0]})
    return {"ok": len(suspicious) == 0, "suspicious_cards": suspicious}


def check_unclosed_tag_attr(html_path):
    """R19(2026-08-20 도입): `data-area="N"` 등 속성값 뒤에 닫는 `>`가 빠진 채 바로 다음
    태그가 이어 붙은 경우를 잡는다(`<div data-area="3"<div style="...">`처럼).

    사고 배경: SCR-007 본문 및 그 "상세과제 등록" 팝업 페이지 두 곳에서 `<div data-area="3">`의
    닫는 `>`가 누락된 채 `<div data-area="3"<div style="position:relative; ...">`로 이어져
    있었다. 브라우저가 이를 파싱 복구하면서 `data-area="3"<div style="..."` 전체가 속성값
    문자열로 흡수되고 실제 `<div>` 하나가 통째로 누락된 채 DOM 트리가 밀려, `.screen-section`
    grid(76%/24%)의 `.wireframe-wrap`/`.desc-wrap` 자식 배치가 그 여파로 어긋나면서 Description
    노출 영역이 깨져 보였다. HTML을 눈으로 훑어서는 속성값 안에 파묻힌 `<div`를 알아채기
    어려우므로(줄이 매우 길다) 정규식 스캔으로 기계적으로 잡는다.

    판별 대상: `data-area`/`class`/`id`/`style` 속성의 닫는 따옴표 바로 뒤에 `>` 없이 `<`가
    오는 모든 위치. 정상형은 `data-area="3"><div style=...`처럼 속성값 뒤 `>`가 있어야 한다."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")
    pattern = _re.compile(r'(data-area|class|id|style)="[^"]*"<[a-zA-Z]')
    bad = []
    for m in pattern.finditer(content):
        line_no = content.count("\n", 0, m.start()) + 1
        bad.append({"attr": m.group(1), "near_line": line_no, "snippet": content[max(0, m.start() - 30):m.start() + 30]})
    return {"ok": len(bad) == 0, "bad_matches": bad}


def check_area_indicator_distance(page, max_distance_px=150):
    """R21(2026-08-25 도입): `.indicator`(영역 레벨 배지, 요소 배지 `.indicator-el`과는 다름)가
    자신이 가리키는 대상(`data-area="N"` 컨테이너)에서 화면상 너무 멀리 떨어진 고정좌표에
    배치됐는지 실측한다.

    사고 배경: 여러 목록형 화면(SCR-004/006/007/010/011/012/014)의 페이지네이션 영역(NO=3
    또는 NO=4) 배지가 `<div class="indicator" style="top:NNNpx; left:185px;">`처럼 화면
    전체 기준 고정 좌표로 박혀 있었다. `left:185px`는 좌측 사이드바 바로 옆 여백에 해당하는
    값이라 어느 화면에서도 "그럴듯하게" 보이지만, 실제로 배지가 가리켜야 할 대상(표 하단
    페이지네이션 버튼)은 표 길이에 따라 세로 위치가 화면마다 다르다 — 그 결과 배지가 대상과
    수백 px 떨어진 채 사이드바 옆 허공에 떠 있는 상태가 여러 화면에서 반복됐다(사용자가 PDF
    샘플과 육안 대조하다가 발견, "페이지네이션 요소 인디케이터 노출 위치가 이상하다"는
    제보로 확인). `check_indicator_el_placement`(R3)는 `.indicator-el`(요소 배지)의 형제
    배치만 잡고 `.indicator`(영역 배지)의 원거리 배치는 다루지 않아 이 사고 유형을 놓쳤다.

    판별 방법: 각 `.indicator`의 텍스트(NO 번호)와 대응하는 `[data-area="NO"]` 요소를 같은
    `.screen-section` 안에서 찾아, 배지 중심점과 그 컨테이너의 bounding box 사이 유클리드
    거리를 잰다. `max_distance_px`(기본 150px)를 넘으면 의심으로 보고한다. `data-area`가
    없는 영역(팝업 등 구조가 다른 화면)은 대응 컨테이너를 못 찾으므로 비교 대상에서 제외한다
    — 오탐을 늘리기보다 놓치는 쪽을 택한 설계이므로, 이 함수가 0건이라고 해서 모든 영역
    배지가 맞다는 보장은 아니다(정보성 성격이 있지만, 실제로 잡아낸 사고 유형이 명확해
    `ok` 판정에는 포함한다).

    수정 방법(재발 시 참고): `[data-area="N"]`에 `style="position:relative;"`를 추가하고
    그 자식으로 `<div class="indicator" style="top:-12px; left:-12px;">N</div>`을 넣은 뒤,
    화면 하단의 기존 고정좌표 `<div class="indicator" style="top:NNNpx; left:185px;">N</div>`은
    제거한다(2026-08-25에 SCR-004/006/007/010/011/012/014 페이지네이션 영역에 적용한 방식)."""
    return page.evaluate("""
        (maxDist) => {
            const problems = [];
            document.querySelectorAll('.screen-section').forEach(section => {
                const indicators = Array.from(section.querySelectorAll(':scope > .indicator'));
                indicators.forEach(ind => {
                    const no = ind.textContent.trim();
                    const target = section.querySelector(`[data-area="${no}"]`);
                    if (!target) return; // data-area 구조가 없는 화면은 비교 대상 제외
                    const indRect = ind.getBoundingClientRect();
                    const tRect = target.getBoundingClientRect();
                    if (indRect.width === 0 || tRect.width === 0) return;
                    const indCx = indRect.left + indRect.width / 2;
                    const indCy = indRect.top + indRect.height / 2;
                    // 컨테이너 bounding box에서 배지까지의 최단 거리(box 내부면 0)
                    const dx = Math.max(tRect.left - indCx, 0, indCx - tRect.right);
                    const dy = Math.max(tRect.top - indCy, 0, indCy - tRect.bottom);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > maxDist) {
                        problems.push({
                            section_id: section.id,
                            no: no,
                            distance_px: Math.round(dist),
                        });
                    }
                });
            });
            return problems;
        }
    """, max_distance_px)


def check_popup_indicator_inheritance(html_path):
    """R22(2026-08-25 도입): 팝업 섹션(id에 `-popup-` 또는 `popup`이 포함된 `.screen-section`)의
    캔버스 배지(`class="indicator"`, 팝업 박스 좌상단에 중첩)와 Description NO가 그 팝업을
    연 트리거 요소의 번호(예: SCR-001의 "5-1 + 공정 등록 버튼"이 열면 배지도 `5-1`)를
    그대로 이어받았는지 정적으로 검사한다.

    사고 배경: 19개 팝업 전원이 트리거 번호와 무관하게 팝업 내부에서 새로 `1`(또는 목록·상세
    화면의 경우 `2`, `3` 등)부터 매긴 상태로 방치돼 있었다 — 예를 들어 SCR-001 "+ 공정
    등록"(5-1) 버튼이 여는 팝업의 배지가 `5-1`이 아니라 그냥 `1`이었다. 사용자가 "팝업
    화면의 인디케이터는 화면 영역의 인디케이터와 동일하게 노출"이라고 두 차례 요청했는데도
    처음에는 이 규칙 자체를 다른 의미(배지 스타일이 같은지)로 잘못 해석해 놓쳤다 — 실제로는
    "번호 값 자체가 트리거 요소 번호를 상속해야 한다"는 뜻이었다.

    판별 방법: 각 팝업의 meta-box `Trigger` 텍스트(`"...버튼"(N-1) 클릭` 형태)에서 괄호 안
    번호를 추출할 수 있으면, 그 번호가 팝업의 캔버스 배지·Description NO와 정확히 일치하는지
    비교한다. Trigger 텍스트에 괄호 번호가 없는 팝업(예: "행 삭제 클릭", "카드 클릭"처럼
    특정 서브요소 번호가 없는 트리거)은 이 함수로 자동 판별할 수 없으므로 결함 여부만이
    아니라 "even 없음"으로 별도 분류해 사람이 상위 화면 Description과 대조하도록 안내한다
    (2026-08-25 실측: 이런 케이스는 대개 상위 화면의 목록/카드 그리드 영역 번호(NO=2, NO=3
    등)를 그대로 쓴다 — Step 4-2 규칙과 동일한 맥락).

    수정 방법(재발 시 참고): 팝업 섹션 안의 `<div class="indicator" style="top:-12px;
    left:-12px;">N</div>`과 desc-table의 `<td class="num">N</td>`을 트리거 번호로 함께
    교체한다(캔버스 배지와 Description NO 두 곳 모두 바꿔야 한다 — 한쪽만 바꾸면 새로운
    불일치가 생긴다)."""
    html_path = pathlib.Path(html_path)
    content = html_path.read_text(encoding="utf-8")

    ids = [m.group(1) for m in _re.finditer(r'<div id="([a-z0-9-]+)" class="screen-section', content)]
    starts = [(i, content.find(f'id="{i}"')) for i in ids]
    popup_ids = [i for i in ids if "popup" in i]

    mismatches = []
    no_trigger_number = []

    for pid in popup_ids:
        idx = [i for i, (sid, _) in enumerate(starts) if sid == pid][0]
        s = starts[idx][1]
        e = starts[idx + 1][1] if idx + 1 < len(starts) else len(content)
        seg = content[s:e]

        m_trig = _re.search(r'Trigger</span><div class="meta-value">([^<]*)</div>', seg)
        trig_text = m_trig.group(1) if m_trig else ""
        m_num_in_trig = _re.search(r'\(([0-9]+(?:-[0-9]+)?)\)', trig_text)

        m_badge = _re.search(r'<div class="indicator" style="top:-12px; left:-12px;">([^<]*)</div>', seg)
        m_desc_no = _re.search(r'<td class="num">([^<]*)</td>', seg)
        badge_val = m_badge.group(1) if m_badge else None
        desc_val = m_desc_no.group(1) if m_desc_no else None

        if not m_num_in_trig:
            no_trigger_number.append({
                "popup_id": pid,
                "trigger_text": trig_text[:60],
                "canvas_badge": badge_val,
                "desc_no": desc_val,
            })
            continue

        expected = m_num_in_trig.group(1)
        if badge_val != expected or desc_val != expected:
            mismatches.append({
                "popup_id": pid,
                "expected_from_trigger": expected,
                "canvas_badge": badge_val,
                "desc_no": desc_val,
            })

    return {"ok": len(mismatches) == 0, "mismatches": mismatches, "no_trigger_number": no_trigger_number}


def check_all_regressions(html_path, page):
    """R1~R8, R13(+ 정보성 R12)을 한 번에 실행하고 통합 결과를 반환한다. page는 이미
    html_path를 goto()해서 로드가 끝난 Playwright Page 객체여야 한다(check_dom_order 등과
    동일 page 재사용 가능). R12는 "R6이 잡은 여백이 실제 결함인지, PDF 폭에서도 여백이
    크면서 다음 청크를 추가하면 R7이 발생하는 불가피한 경우인지" 사람이 판단하도록 돕는
    정보성 체크라 `ok` 판정(전체 통과 여부)에는 포함하지 않는다 — 사람이 R7과 대조 확인해야
    하는 항목이므로 자동 pass/fail로 강제하면 오탐(실은 불가피한 여백인데 fail 처리)이 난다."""
    r1 = check_colgroup_widths(html_path)
    r2 = check_desc_overflow(page)
    r3 = check_indicator_el_placement(html_path)
    r4 = check_indicator_el_completeness(page)
    r5 = check_popup_backdrop_marker(html_path)
    r6 = check_desc_underflow(page)
    r7 = check_print_scale_collapse(page)
    r8 = check_print_only_layout_leftovers(html_path)
    r12 = check_desc_underflow_pdfwidth(page)
    r13 = check_template_layout_ratio(page)
    r14a = check_screen_only_page_hidden_in_print(page)
    r14b = check_screen_only_page_pptx_skip(html_path)
    r15 = check_no_number_ambiguity(page)
    r16 = check_filter_bar_label_stack_style(html_path)
    r17 = check_fixed_width_card_grid(html_path)
    r18 = check_card_thumb_aspect_ratio(html_path)
    r19 = check_unclosed_tag_attr(html_path)
    r20 = check_pptx_phantom_overflow_pages(page)
    r20_bad = [p for p in r20 if not p.get("within_tolerance", True) or p.get("error")]
    r21 = check_area_indicator_distance(page)
    r22 = check_popup_indicator_inheritance(html_path)
    ok = (r1["ok"] and (len(r2) == 0) and r3["ok"] and (len(r4) == 0) and r5["ok"]
          and (len(r6) == 0) and (len(r7) == 0) and r8["ok"] and (len(r13) == 0)
          and r14a["ok"] and r14b["ok"] and r16["ok"] and r19["ok"] and (len(r20_bad) == 0)
          and (len(r21) == 0) and r22["ok"])
    return {
        "ok": ok,
        "R1_colgroup_widths": r1,
        "R2_desc_overflow": r2,
        "R3_indicator_el_placement": r3,
        "R4_indicator_el_completeness": r4,
        "R5_popup_backdrop_marker": r5,
        "R6_desc_underflow": r6,
        "R7_print_scale_collapse": r7,
        "R8_print_only_layout_leftovers": r8,
        "R12_desc_underflow_pdfwidth": r12,
        "R13_template_layout_ratio": r13,
        "R14a_screen_only_page_hidden_in_print": r14a,
        "R14b_screen_only_page_pptx_skip": r14b,
        "R15_no_number_ambiguity": r15,
        "R16_filter_bar_label_stack_style": r16,
        "R17_fixed_width_card_grid": r17,
        "R18_card_thumb_aspect_ratio": r18,
        "R19_unclosed_tag_attr": r19,
        "R20_pptx_phantom_overflow_pages": r20,
        "R21_area_indicator_distance": r21,
        "R22_popup_indicator_inheritance": r22,
    }


def print_regression_report(result):
    lines = ["[회귀 체크 R1-R8, R12-R15]"]
    r1 = result["R1_colgroup_widths"]
    lines.append(f"  R1 colgroup 너비: checked={r1['checked']} bad={len(r1['bad_colgroups'])} ok={r1['ok']}")
    for b in r1["bad_colgroups"]:
        lines.append(f"    - colgroup#{b['colgroup_index']}: 합계={b['total']}% (col {b['col_count']}개)")

    r2 = result["R2_desc_overflow"]
    lines.append(f"  R2 Description 오버플로우: problems={len(r2)} ok={len(r2) == 0}")
    for p in r2[:10]:
        lines.append(f"    - {p}")

    r3 = result["R3_indicator_el_placement"]
    lines.append(f"  R3 인디케이터 고정좌표 오배치 의심: suspicious={len(r3['suspicious_blocks'])} ok={r3['ok']}")
    for s in r3["suspicious_blocks"]:
        lines.append(f"    - line~{s['near_line']}: indicator-el {s['indicator_el_count_in_sibling_block']}개가 형제 인디케이터 블록 안에 있음")

    r4 = result["R4_indicator_el_completeness"]
    lines.append(f"  R4 요소 배지 누락: sections_with_missing={len(r4)} ok={len(r4) == 0}")
    for sid, info in r4.items():
        lines.append(f"    - {sid}: missing={info['missing']} (desc={info['desc_labels']}, badge={info['badge_labels']})")

    r5 = result["R5_popup_backdrop_marker"]
    lines.append(f"  R5 popup-backdrop 마커 누락: bad={len(r5['missing_marker'])} ok={r5['ok']}")
    for b in r5["missing_marker"]:
        lines.append(f"    - line~{b['near_line']}: {b['tag_preview']}")

    r6 = result.get("R6_desc_underflow", [])
    lines.append(f"  R6 Description 빈공간 과다: problems={len(r6)} ok={len(r6) == 0}")
    for p in r6[:10]:
        lines.append(f"    - {p['section_id']}: desc={p['desc_height']}px wireframe={p['wireframe_height']}px slack={p['slack_px']}px")

    r7 = result.get("R7_print_scale_collapse", [])
    lines.append(f"  R7 PDF 축소배율 붕괴(텍스트 깨짐): problems={len(r7)} ok={len(r7) == 0}")
    for p in r7[:10]:
        lines.append(f"    - {p['section_id']}: scale={p['scale']} (scrollW={p['scroll_w']} scrollH={p['scroll_h']})")

    r8 = result.get("R8_print_only_layout_leftovers", {"ok": True, "bad_sections": []})
    lines.append(f"  R8 PDF전용 페이지 사이드바 등 잔존: bad={len(r8['bad_sections'])} ok={r8['ok']}")
    for b in r8["bad_sections"]:
        lines.append(f"    - {b['section_id']} (line~{b['near_line']})")

    r12 = result.get("R12_desc_underflow_pdfwidth", [])
    lines.append(f"  R12(정보성, ok 판정 미포함) PDF폭 기준 여백: problems={len(r12)} — R6과 겹치면 R7과 대조해 불가피한 여백인지 사람이 판단할 것")
    for p in r12[:10]:
        lines.append(f"    - {p['section_id']}: desc={p['desc_height']}px wireframe={p['wireframe_height']}px slack={p['slack_px']}px")

    r13 = result.get("R13_template_layout_ratio", [])
    lines.append(f"  R13 템플릿 캔버스:설명 비율(76:24) 이탈: problems={len(r13)} ok={len(r13) == 0}")
    for p in r13[:10]:
        lines.append(f"    - {p['section_id']}: canvas={p['canvas_width']}px({p['canvas_pct']}%) desc={p['desc_width']}px (기대 {p['expected_pct']}%)")

    r14a = result.get("R14a_screen_only_page_hidden_in_print", {"ok": True, "still_visible_in_print": []})
    lines.append(f"  R14a .screen-only-page가 PDF(print 미디어)에서도 보임: bad={len(r14a['still_visible_in_print'])} ok={r14a['ok']}")
    for b in r14a["still_visible_in_print"]:
        lines.append(f"    - {b['section_id']}: computed display={b['computed_display']} (기대: none)")

    r14b = result.get("R14b_screen_only_page_pptx_skip", {"ok": True})
    lines.append(f"  R14b downloadPPTX()에 .screen-only-page continue 가드 존재: ok={r14b['ok']}")

    r15 = result.get("R15_no_number_ambiguity", {})
    total_r15 = sum(len(v) for v in r15.values())
    lines.append(f"  R15(정보성, ok 판정 미포함) NO 번호 중복/모호: groups_flagged={total_r15}")
    for key, items in r15.items():
        for item in items:
            lines.append(f"    - {key} NO={item['no']}: {item['section_ids']} (영역명 서로 다름: {item['area_names']}) — docstring 절차대로 안내문 쪽 NO를 '-'로, 대응 캔버스 배지도 함께 정리할 것")

    r16 = result.get("R16_filter_bar_label_stack_style", {"ok": True, "bad_sections": []})
    lines.append(f"  R16 필터바 구버전 라벨 세로형 잔존: bad={len(r16['bad_sections'])} ok={r16['ok']}")
    for b in r16["bad_sections"]:
        lines.append(f"    - {b['section_id']} (line~{b['near_line']}, 라벨 {b['label_count']}개)")

    r17 = result.get("R17_fixed_width_card_grid", {"ok": True, "suspicious_cards": []})
    lines.append(f"  R17(정보성, ok 판정 미포함) 카드 그리드 고정폭 의심: suspicious={len(r17['suspicious_cards'])} — 실제 common.css의 grid-template-columns 정의와 대조해 사람이 판단할 것")
    for s in r17["suspicious_cards"]:
        lines.append(f"    - {s['section_id']} (line~{s['near_line']}): 카드 {s['card_count']}개, width:{s['width_px']}px 고정")

    r18 = result.get("R18_card_thumb_aspect_ratio", {"ok": True, "suspicious_cards": []})
    lines.append(f"  R18(정보성, ok 판정 미포함) 카드 썸네일 고정높이 의심: suspicious={len(r18['suspicious_cards'])} — 실제 common.css의 aspect-ratio 정의와 대조해 사람이 판단할 것")
    for s in r18["suspicious_cards"]:
        lines.append(f"    - {s['section_id']} (line~{s['near_line']}): 카드 {s['card_count']}개, height:{s['height_px']}px 고정")

    r19 = result.get("R19_unclosed_tag_attr", {"ok": True, "bad_matches": []})
    lines.append(f"  R19 속성값 뒤 닫는 '>' 누락(다음 태그가 속성값에 흡수됨): bad={len(r19['bad_matches'])} ok={r19['ok']}")
    for b in r19["bad_matches"]:
        lines.append(f"    - {b['attr']} (line~{b['near_line']}): ...{b['snippet']}...")

    r20 = result.get("R20_pptx_phantom_overflow_pages", [])
    r20_bad = [p for p in r20 if not p.get("within_tolerance", True) or p.get("error")]
    lines.append(f"  R20 PPT 가상 이월 페이지(원본에 없는 -cont-N 발생): bad={len(r20_bad)} ok={len(r20_bad) == 0}")
    for p in r20_bad:
        if p.get("error"):
            lines.append(f"    - {p['section_id']}: sbpptxBuildDescTable 호출 실패 — {p['error']}")
        else:
            lines.append(f"    - {p['section_id']}: 초과 {p['overflow_in']}in (허용치 초과) — maxHeight={p['max_height_in']}in built={p['built_height_in']}in, downloadPPTX()가 가상 -cont-N 페이지를 생성할 것")

    r21 = result.get("R21_area_indicator_distance", [])
    lines.append(f"  R21 영역 인디케이터-대상 원거리 배치: bad={len(r21)} ok={len(r21) == 0}")
    for p in r21[:10]:
        lines.append(f"    - {p['section_id']} NO={p['no']}: 대상([data-area=\"{p['no']}\"])과 {p['distance_px']}px 떨어짐 — 고정좌표 대신 컨테이너 중첩 배치로 교체할 것")

    r22 = result.get("R22_popup_indicator_inheritance", {"ok": True, "mismatches": [], "no_trigger_number": []})
    lines.append(f"  R22 팝업 인디케이터 트리거 번호 상속: bad={len(r22['mismatches'])} ok={r22['ok']} (판별불가 {len(r22['no_trigger_number'])}건은 별도 표시)")
    for p in r22["mismatches"]:
        lines.append(f"    - {p['popup_id']}: trigger에서 기대값={p['expected_from_trigger']}, 캔버스 배지={p['canvas_badge']}, Description NO={p['desc_no']} — 트리거 번호로 통일할 것")
    for p in r22["no_trigger_number"]:
        lines.append(f"    - (판별불가) {p['popup_id']}: trigger=\"{p['trigger_text']}\" 캔버스={p['canvas_badge']} desc={p['desc_no']} — 상위 화면 Description과 대조해 사람이 확인할 것")

    lines.append(f"  => 전체 ok={result['ok']}")
    report = "\n".join(lines)
    print(report)
    return report
