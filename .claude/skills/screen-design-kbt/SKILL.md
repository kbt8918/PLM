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
5. **검증 없이 "완료"라고 보고하지 않는다.** `verify.py`의 3개 체크(DOM 순서/인디케이터,
   PDF 페이지 수, PPTX 무결성)를 전부 통과해야 완료다.
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

## 절차

### Step 0. 변경 내용 파악
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

### Step 9. 검증 (생략 금지)
`scripts/verify.py` 사용:
```python
result = check_dom_order(page)                                  # 섹션 수·순서·인디케이터·JS에러
check_pdf_page_count(render_pdf_via_print(html, out_pdf), result["count"])  # PDF 페이지 수 == 섹션 수
check_pptx_integrity(out_pptx, expected_slides=result["count"])  # XML 정상 + spAutoFit 0건
```
대표 화면(신규/관리자/이어붙임 페이지 포함) 몇 개는 스크린샷으로 시각 확인도 병행한다.
불일치가 나오면 "거의 맞다"며 넘어가지 말고 `화면설계서_와이어프레임_작성가이드.md` 2절
(자주 나온 문제와 해결 패턴)에서 원인을 찾는다.

## 완료 보고 형식
- 무엇을 몇 개 화면에 반영했는지(신규/수정/삭제)
- as-built 조사에서 발견한 스펙과의 주요 차이점(있다면)
- 검증 결과 3종(DOM/PDF/PPTX) 요약
- 남은 이슈나 사용자 확인이 필요한 판단(예: 구분 자동 분류가 애매한 항목)
