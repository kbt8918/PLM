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
    check_pdf_page_count(OUT_PDF, expected_sections=result["count"])
    check_pptx_integrity(OUT_PPTX)
"""
import pathlib
import zipfile
import xml.dom.minidom as minidom


def check_dom_order(page):
    """섹션 개수/순서/JS 에러를 확인한다. 이어붙임(-cont-N) 섹션이 각자의 원본 화면 바로 뒤에
    붙어 있는지 눈으로 한 번 더 확인할 것 — 이 함수는 순서 나열만 해줄 뿐 "올바른 순서인지"는
    판단하지 않는다(과거 이어붙임 페이지가 문서 맨 끝에 잘못 삽입된 사고가 있었음)."""
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    ids = page.evaluate("Array.from(document.querySelectorAll('.screen-section')).map(s => s.id)")
    indicator_count = page.evaluate("document.querySelectorAll('.indicator').length")
    return {"errors": errors, "count": len(ids), "ids": ids, "indicator_count": indicator_count}


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
