---
name: screen-design-kbt
description: >
  PNDES 생기포털 고도화 프로젝트에서 `05.리포트/화면설계서_부품공정자동화현황_샘플.html`
  (손그림 저충실도 와이어프레임 + PPT/PDF 다운로드 샘플, 공식 Document Chain #9 화면설계서.md와는
  별개 파일)을 **실제 구현(`src/frontend/`)을 기준**으로 새로 만들거나, 프론트 변경 후 갱신하는
  스킬. 사용 시점: "프론트 화면 완성됐으니 화면설계서 만들어줘", "프론트 수정했으니 화면설계서
  반영해줘", "화면설계서 수정해줘", "와이어프레임 갱신해줘", "screen-design-kbt" 요청 시.
  공식 산출물(02.기획문서/화면설계서.md)을 직접 갱신하는 작업에는 사용하지 않는다 —
  그건 `docs-cascade-kbt` 스킬의 영역이다(필요하면 두 스킬을 이어서 호출).
---

# 화면설계서 와이어프레임 샘플 작성/갱신 스킬 (screen-design-kbt)

2026-08-13~14 세션에서 실제로 실행한 절차(SCR-001 샘플 → 실제 구현 기준 14개 화면 전체 확장 →
관리자/팝업/인디케이터/예외Case 부록 보완)를 일반화했습니다. 상세 배경·정책·트러블슈팅 표는
`05.리포트/화면설계서_와이어프레임_작성가이드.md`(작업 절차)와
`05.리포트/화면설계서_Description작성가이드.md`(Description 내용 규칙)에 있습니다 —
이 SKILL.md는 그 두 문서를 실행 순서로 엮은 요약이며, 세부 근거는 항상 원본 가이드를 확인하세요.

## 핵심 원칙 (반드시 지킬 것)

1. **스펙 문서가 아니라 실제 구현을 근거로 삼는다.** `src/frontend/js/data.js`(NAV/SCREENS/MODALS)
   와 `js/render.js`(렌더 함수)를 직접 조사한다. 코드가 있어도 `NAV`/`FEATURE_FLAGS`에서 빠져
   있으면(예: 과거 세션의 `DASH-AUTO`/`DASH-MTRM`/`FLOW-MAP`) 실사용자에게 노출되지 않는
   화면이므로 이번 작업 범위에서 제외한다.
2. **작업 범위를 스스로 넓히지 않는다.** 사용자가 특정 화면만 지목했으면 그 화면만 고친다.
   전체 화면 재작성처럼 범위가 큰 작업은 먼저 사용자에게 범위(어떤 파일을, 몇 개 화면을)를
   확인한다(AskUserQuestion 1회로 충분).
3. **인디케이터를 빠뜨리지 않는다.** 화면 콘텐츠 블록을 통째로 교체할 때 특히 주의 —
   2026-08-14 세션에서 전체 화면 재작성 후 인디케이터 삽입을 통째로 빠뜨린 사고가 있었다.
   작업이 끝나면 `verify.py`의 `check_dom_order`로 인디케이터 개수가 0이 아닌지 반드시 확인한다.
4. **청크 유실 없는 페이지 분할만 사용한다.** `paginate.py`의 `pack_pages()`를 그대로 쓴다
   (자체 구현 금지 — 과거 두 세션에서 각각 다른 방식으로 짰다가 콘텐츠가 조용히 사라지는
   버그를 만들었다).
5. **검증 없이 "완료"라고 보고하지 않는다.** `verify.py`의 DOM 순서/인디케이터·PDF 페이지 수·
   PPTX 무결성 3종 **및** `check_all_regressions()`(R1~R8, R13~R15, 아래 Step 9 참고)를 전부 통과해야
   완료다 — 이 5가지 중 하나라도 생략하면 완료로 치지 않는다.
6. **요소 인디케이터(`.indicator-el`)는 타겟의 중첩 자식으로만 배치한다.** `.wireframe-wrap`
   기준 고정 top/left 형제 요소로 만들면 안 된다 — 이 문서는 유동폭 그리드라 HTML/PDF(~1240px)
   /PPT(1680px) 세 렌더 폭이 달라서, 고정 좌표는 폭이 바뀔 때마다 어긋나거나(PPT에서는 슬라이드
   밖으로 밀려나면 아예 렌더링 누락) 문제가 재발한다. 근거·구현·PPT 엔진과의 상호작용은
   `화면설계서_와이어프레임_작성가이드.md` 1절 Step 4, 헬퍼는 `screens_common.py`의
   `el_badge`/`make_el_badge_wrap` 참고.
7. **관리자 화면 색상 마커(보라색 3중 표시)는 되살리지 않는다.** 2026-08-14 사용자 지시로
   문서 전체에서 제거됨 — `render_sidebar`/`render_topbar`/`admin_content_wrap`은 이미 no-op.
8. **팝업/모달은 Description 텍스트만으로 끝내지 않고, `popup_page()`로 별도 페이지를
   만든다.** 부모 화면 배경을 흐리게 깔고 중앙에 모달을 얹는 표준 틀은 가이드 1절 Step 3 참고.
9. **팝업 하위 페이지가 이미 자기완결적으로 상세하면, 상위 화면 Description에 그 팝업들을
   요약하는 NO 행("영역명: 팝업 영역")을 별도로 만들지 않는다.** 만들면 하위 페이지와 순수
   중복이 된다(2026-08-18 SCR-001 NO=7 사고). NO 행을 삭제할 때는 그 행이 속한 이어붙임(cont)
   페이지·tab-nav 버튼·이전 페이지의 "다음 화면에 계속" 마커까지 함께 정리한다. 가이드
   Step 4-2 "주의" 문단 참고.
10. **PDF/PPT 전용 정적 분할 페이지(표를 여러 장으로 미리 나눈 것)를 다시 한 페이지로
    합쳐 달라는 요청이 오면, 손으로 복사/붙여넣기하지 말고 정규식으로 각 페이지의 tbody 행을
    순서대로 이어붙인다.** 병합 페이지가 표준 페이지보다 커도 `applyPrintScaling`의 개별 zoom
    축소를 신뢰하되, PDF 페이지 수·PPTX 텍스트 겹침은 반드시 실측 재확인한다(2026-08-18
    SCR-001 공정별 상세 17행 병합). 가이드 Step 4-4 참고.
11. **파일을 여러 차례 Read/Edit하는 세션에서 Edit가 "디스크에서 변경됨" 경고를 내면, 이전에
    Read한 라인 번호를 그대로 믿지 않는다.** 삭제/수정 직전 `grep`으로 대상 id의 실제 위치를
    재확인한다(2026-08-18 사고 이력). 가이드 2절 트러블슈팅 표 참고.
12. **`05.리포트/화면설계서_템플릿.md`의 레이아웃 규격(헤더 0~8%/캔버스 0~76%/설명 76~100%/
    푸터, 16:9 960×540pt)은 모든 SCR-XXX 화면에서 절대 재조정하지 않는다.** 신규/수정 작업이
    끝나면 이 문서(요청하지 않아도 항상 먼저 열어서 기준으로 삼는다)의 비율에서 벗어난 페이지가
    없는지 `verify.py`의 `check_template_layout_ratio()`(R13, `check_all_regressions()`에
    포함되어 자동 실행됨)로 확인한다(2026-08-19 사고: 페이지를 여러 장으로 나누는 작업을
    반복하다 캔버스 내용물이 원본과 달라져 사용자가 "레이아웃이 화면마다 바뀐다"고 지적 —
    실측 결과 비율 자체보다는 캔버스 콘텐츠 불일치가 원인이었으나, 재발 방지를 위해 비율
    이탈 자체도 R13으로 상시 감시하도록 코드화했다. 두 가지(비율/콘텐츠) 다 확인할 것).
13. **PDF/PPT 출력만 고쳐 달라는 요청은 HTML 브라우저 뷰를 절대 바꾸지 않는다.** 매체별
    조건부 렌더링 기법(`@media screen`으로 HTML에서 숨기고 PDF/PPT 생성 시점에만 노출, 또는
    그 반대)을 사용하고, 수정 전/후 HTML 스크린샷을 대조해 뷰가 그대로임을 증명한다(가이드
    1-1절 R7/R9, `verify.py`의 `check_print_only_layout_leftovers` 참고).

## 절차

### Step 0. 변경 내용 파악
- `05.리포트/화면설계서_템플릿.md`(레이아웃 규격 SSOT)를 항상 먼저 훑는다 — 요청하지 않아도.
  신규 화면이든 기존 화면 수정이든, 캔버스/설명/헤더/푸터 비율은 이 문서 기준으로 고정한다.
- 사용자가 설명했으면 그대로 근거로 삼는다.
- 불명확하거나 전체 재작성이면 `Agent`(Explore 서브에이전트)로 `src/frontend/`를 조사해
  as-built 인벤토리(화면 목록/GNB 노출 여부/관리자 여부/팝업 목록)를 먼저 만든다 —
  직접 파일을 몇 개 열어보고 넘겨짚지 말 것(2026-08-13 세션에서 이 조사를 생략했다면
  화면 개수·명칭·경고배너 등 다수 오류가 그대로 남았을 것).

### Step 1~8. 작성/갱신
`05.리포트/화면설계서_와이어프레임_작성가이드.md`의 1절(Step 1~8)을 그대로 따른다:
GNB 확인 → 화면별 와이어프레임 → Description(+팝업 영역) → 인디케이터 → 페이지 분할 →
커버 페이지 → 탭 네비게이션 → 예외Case/Alert 부록. 각 단계에서 쓸 재사용 코드는
`scripts/`에 있다:

| 단계 | 스크립트 | 함수 |
|---|---|---|
| GNB/탑바/컴포넌트 | `scripts/screens_common.py` | `render_sidebar`, `render_topbar`, `admin_content_wrap`, `filter_bar`, `section_title`, `simple_table`, `card_grid`, `gantt`, `modal_preview` |
| Description 표 | `scripts/desc_common.py` | `build_desc_table`, `popup_area` |
| 페이지 분할 | `scripts/paginate.py` | `measure_budget`, `measure_chunks`, `pack_pages`, `inject_continuation_pages` |
| 예외Case 부록 | `scripts/build_appendix.py` | `extract_exceptions`, `guess_type`, `build_appendix_pages`, `inject_appendix` |

`scripts/screens_common.py`의 `SIDEBAR_ITEMS`는 **화면이 추가/제거되거나 관리자 여부가
바뀌면 가장 먼저 갱신**해야 하는 단일 진실 소스다 — `src/frontend/js/data.js`의 `NAV`와
어긋나지 않았는지 매번 대조한다.

### Step 9. 검증 (생략 금지 — 사용자가 요청하지 않아도 매번 자동 실행)
이 문서를 만지는 모든 작업(신규 제작/수정/보완, 화면 1개짜리 사소한 변경 포함)은 **끝나기
전에 반드시** `scripts/verify.py`의 `check_all_regressions()`(R1~R8 + R13~R15, 오늘까지 실제로 발생한
사고 유형을 코드화한 회귀 체크 — 상세는 `화면설계서_와이어프레임_작성가이드.md` 1-1절)를
`check_dom_order`/PDF/PPTX 3종과 함께 실행한다. "이번엔 작은 수정이라 생략해도 되겠지"는
금지 — R1~R8/R13~R15이 잡는 사고들(colgroup 너비 초과, Description 겹침/빈칸, 인디케이터 오배치/
누락, 팝업 배경 겹침, PDF 축소 붕괴, PDF전용 페이지 레이아웃 잔존물)은 전부 "사소해 보이는
수정"에서 반복적으로 재발했던 것들이다:

```python
import sys, pathlib
sys.path.insert(0, '.claude/skills/screen-design-kbt/scripts')
import verify
from playwright.sync_api import sync_playwright

html_path = '05.리포트/화면설계서_부품공정자동화현황_샘플.html'
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1800, "height": 1400})
    page.goto(pathlib.Path(html_path).resolve().as_uri())
    page.wait_for_load_state("networkidle")

    dom = verify.check_dom_order(page)                    # 섹션 수·순서·인디케이터·JS에러
    regressions = verify.check_all_regressions(html_path, page)  # R1~R8 + R13~R15 일괄 실행
    verify.print_regression_report(regressions)
    browser.close()

pdf_path = verify.render_pdf_via_print(html_path, OUT_PDF)
pdf = verify.check_pdf_page_count(pdf_path, expected_sections=dom["count"])   # PDF 페이지 수 == 섹션 수
pptx = verify.check_pptx_integrity(OUT_PPTX, expected_slides=dom["count"])    # downloadPPTX() 실제 클릭해 받은 파일, XML 정상 + spAutoFit 0건
verify.print_report(dom, pdf, pptx)

assert regressions["ok"], "R1~R8/R13~R15 회귀 체크 실패 — 완료 보고 전 반드시 원인 해결"
```

대표 화면(신규/관리자/이어붙임 페이지 포함) 몇 개는 스크린샷으로 시각 확인도 병행한다.
불일치가 나오면 "거의 맞다"며 넘어가지 말고 `화면설계서_와이어프레임_작성가이드.md` 2절
(자주 나온 문제와 해결 패턴)에서 원인을 찾는다.

**새 사고 유형을 발견하면 그 세션 안에서 바로 `verify.py`에 함수(R9, R10…)로 추가하고
가이드 문서 1-1절에도 반영한다.** "다음에 시간 날 때 정리"로 미루지 않는다 — 이 프로젝트는
발견한 사고를 그 자리에서 자동 검증 함수로 코드화하는 것이 확립된 관행이다(R1~R8, R13~R15이 전부
이런 식으로 누적됐다). 이렇게 해야 이번 세션이 끝나도 다음에 이 스킬을 여는 다른 세션이
같은 실수를 반복하지 않는다 — 가이드 문서를 읽었는지와 무관하게, `check_all_regressions()`
한 번 호출이 지금까지 발견된 모든 사고 유형을 기계적으로 재검사해 준다.

## 완료 보고 형식
- 무엇을 몇 개 화면에 반영했는지(신규/수정/삭제)
- as-built 조사에서 발견한 스펙과의 주요 차이점(있다면)
- 검증 결과: DOM/PDF/PPTX 3종 + `check_all_regressions()`(R1~R8, R13~R15, R12는 정보성) 요약 —
  `ok=False`인 항목이 있으면 보고 전에 원인을 해결한 뒤 재실행한 결과를 싣는다
- 남은 이슈나 사용자 확인이 필요한 판단(예: 구분 자동 분류가 애매한 항목, R12가 지적한
  "여백을 메우면 R7이 깨지는" 트레이드오프처럼 자동 판정이 어려운 항목)
