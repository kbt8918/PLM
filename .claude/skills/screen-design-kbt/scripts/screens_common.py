# -*- coding: utf-8 -*-
"""
화면설계서 와이어프레임 샘플(05.리포트/화면설계서_부품공정자동화현황_샘플.html) 공용 컴포넌트 빌더.
사이드바(GNB)/탑바/필터바/표/카드그리드/간트/모달 미리보기 등 저충실도 와이어프레임 조각을 생성한다.

사용 전 SIDEBAR_ITEMS를 src/frontend/js/data.js의 NAV/NAV_CHILDREN/SCREENS(admin 플래그) 기준으로
반드시 최신화할 것 — 화면이 추가/제거되거나 admin 여부가 바뀌면 여기부터 고쳐야 한다.
"""

# kind: label(섹션라벨) / item(1뎁스, admin bool 포함) / sub(2뎁스)
# 2026-08-14 기준 src/frontend/js/data.js NAV와 동기화된 상태. 프론트가 바뀌면 이 표부터 갱신.
#
# admin bool은 여전히 "관리자 전용 화면인가"를 구분하는 데 쓰이지만(예: 인디케이터/설명 문구),
# 2026-08-14 사용자 지시로 시각적 색상 구분(보라색 3중 표시)은 전면 폐지되었다 — 아래
# render_sidebar/render_topbar/admin_content_wrap은 더 이상 색상을 넣지 않는다. 새 관리자
# 화면을 추가할 때도 색상 마커를 임의로 되살리지 말 것(문서 전체에서 의도적으로 제거한 것).
SIDEBAR_ITEMS = [
    ("label", "공정 자동화 현황", None, False),
    ("item", "부품 공정 자동화 현황", "scr-001", False),
    ("item", "표준공정 마스터 관리", "scr-002", True),
    ("item", "모듈 공정 자동화 현황", "scr-003", False),
    ("item", "모듈 표준 작업명 관리", "scr-004", True),
    ("item", "I/F 실행결과 관리", "scr-005", True),
    ("label", "중장기 방향성 공유", None, False),
    ("item", "메인 대시보드", "mtrm-main", False),
    ("item", "통합 로드맵", "scr-006", False),
    ("sub", "상세과제 로드맵 관리", "scr-007", False),
    ("sub", "통합 로드맵 차트", "scr-008", False),
    ("item", "생산기술 Tech PR", "scr-009", False),
    ("item", "생산기술 Tech PR 관리자", "scr-010", True),
    ("item", "mTRM 협의체", "scr-011", True),
    ("item", "mTRM 관리", "scr-012", True),
    ("item", "기술과제 관리", "scr-013", False),
    ("item", "기술동향", "scr-014", False),
]

# 실제 구현(src/frontend/js/data.js SCREENS.admin) 기준 관리자 전용 화면 id 집합
ADMIN_SCREENS = {sid for _, _, sid, is_admin in SIDEBAR_ITEMS if is_admin}


def render_sidebar(active_label):
    """active_label: 현재 활성화된 항목의 라벨 문자열(SIDEBAR_ITEMS의 label과 정확히 일치해야 함)."""
    parts = []
    for kind, label, scr, is_admin in SIDEBAR_ITEMS:
        if kind == "label":
            parts.append(f'<div style="padding:8px 14px 6px; font-size:11px; color:#999; white-space:nowrap;">{label}</div>')
        elif kind == "item":
            is_active = (label == active_label)
            # 2026-08-14: 사이드바 보라색 "A" 관리자 배지는 폐지됨 — is_admin은 더 이상 색상에
            # 반영하지 않는다(ADMIN_SCREENS 판별 용도로만 남겨둠).
            chevron = '<span style="width:12px; height:12px; border:1px solid #999; text-align:center; font-size:8px; color:#999; line-height:11px; flex-shrink:0;">&rsaquo;</span>' if scr not in ("scr-001", "mtrm-main") else ''
            if is_active:
                parts.append(f'<div style="padding:8px 14px; background:#333; color:#fff; font-weight:700; font-size:12px; white-space:nowrap; display:flex; align-items:center;"><span>{label}</span></div>')
            else:
                parts.append(f'<div style="padding:8px 14px; font-size:12px; color:#444; display:flex; justify-content:space-between; align-items:center;"><span style="white-space:nowrap;">{label}</span><span style="display:flex; align-items:center;">{chevron}</span></div>')
        elif kind == "sub":
            is_active = (label == active_label)
            style = "color:#333; font-weight:700;" if is_active else "color:#777;"
            parts.append(f'<div style="padding:6px 14px 6px 28px; font-size:11px; {style} white-space:nowrap;">{label}</div>')
    return "\n        ".join(parts)


def render_topbar(breadcrumb_group, screen_name, is_admin=False):
    """is_admin은 더 이상 시각 효과를 만들지 않는다(하위호환 목적으로 인자만 유지).
    2026-08-14: breadcrumb 옆 보라색 '관리자' 배지는 사용자 지시로 문서 전체에서 제거됨 —
    새 화면을 추가할 때도 되살리지 말 것."""
    return f'''<div style="display:flex; align-items:center; justify-content:space-between; height:52px; padding:0 44px 0 20px; background:#fff; border-bottom:2px solid #333;">
      <div style="display:flex; align-items:center; gap:16px;">
        <div style="font-size:15px; font-weight:700; color:#333; white-space:nowrap;">PNDES</div>
        <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:#888; white-space:nowrap;">
          <span>생기포털</span><span>&gt;</span><span>{breadcrumb_group}</span><span>&gt;</span><span style="color:#333; font-weight:600;">{screen_name}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px; font-size:12px; color:#666; white-space:nowrap;">
        <span>홍길동 님</span><span>|</span><span>로그아웃</span>
      </div>
    </div>'''


def admin_content_wrap(main_html, is_admin):
    """2026-08-14: 본문 좌측 보라색 강조 바(3중 표시 중 3번째)는 폐지됨 — 항상 no-op으로 동작한다.
    함수 시그니처만 하위호환을 위해 유지(호출부를 일일이 고치지 않아도 되도록)."""
    return main_html


def filter_bar(fields, button_label="조회", extra_right=""):
    """fields: [(label, width_px), ...]"""
    parts = ['<div style="display:flex; align-items:flex-end; gap:10px; margin-bottom:20px; flex-wrap:wrap;">']
    for label, w in fields:
        parts.append(
            f'<div><div style="font-size:11px; color:#888; margin-bottom:6px; white-space:nowrap;">{label}</div>'
            f'<div style="width:{w}px; height:32px; border:1px solid #999; background:#fff; display:flex; align-items:center; justify-content:space-between; padding:0 8px; font-size:12px; color:#555; white-space:nowrap;"><span>전체</span><span>&#9662;</span></div></div>'
        )
    parts.append('<div style="flex:1;"></div>')
    if extra_right:
        parts.append(extra_right)
    parts.append(f'<div style="width:72px; height:32px; background:#333; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; white-space:nowrap;">{button_label}</div>')
    parts.append('</div>')
    return "\n        ".join(parts)


def section_title(title, subtitle=None, buttons=None):
    """buttons: [(label, is_primary_bool), ...]"""
    sub = f' <span style="font-size:11px; color:#999; font-weight:400;">({subtitle})</span>' if subtitle else ''
    if buttons:
        btn_parts = []
        for label, primary in buttons:
            style = "background:#333; color:#fff;" if primary else "border:1px solid #999;"
            btn_parts.append(f'<div style="height:30px; padding:0 14px; {style} display:flex; align-items:center; justify-content:center; font-size:12px; white-space:nowrap;">{label}</div>')
        btn_html = f'<div style="display:flex; gap:8px;">{"".join(btn_parts)}</div>'
        return (f'<div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:2px;">'
                f'<div style="font-size:15px; font-weight:700; color:#333;">{title}{sub}</div>{btn_html}</div>')
    return f'<div style="font-size:15px; font-weight:700; color:#333; margin-bottom:2px;">{title}{sub}</div>'


def simple_table(col_widths_pct, headers, rows, header_bg="#eee"):
    """col_widths_pct/headers 길이 일치, rows: [[cell_html, ...], ...]. 표 폭은 항상 100%(컨테이너에 꽉 참)."""
    cols = "".join(f'<col style="width:{w}%">' for w in col_widths_pct)
    th = "".join(
        (f'<th style="border-bottom:1px solid #ccc; border-right:1px solid #ccc; background:{header_bg}; padding:8px; font-size:12px; text-align:{"left" if i == 0 else "center"}; font-weight:600; color:#333;">{h}</th>'
         if i < len(headers) - 1 else
         f'<th style="border-bottom:1px solid #ccc; background:{header_bg}; padding:8px; font-size:12px; text-align:center; font-weight:600; color:#333;">{h}</th>')
        for i, h in enumerate(headers)
    )
    body_rows = []
    for r in rows:
        tds = []
        for i, cell in enumerate(r):
            border = "border-right:1px solid #ccc; " if i < len(r) - 1 else ""
            align = "text-align:left; " if i == 0 else "text-align:center; "
            tds.append(f'<td style="border-bottom:1px solid #ccc; {border}{align}padding:8px; font-size:12px;">{cell}</td>')
        body_rows.append(f'<tr>{"".join(tds)}</tr>')
    return (f'<div style="overflow-x:auto; border:1px solid #ccc;">'
            f'<table style="border-collapse:collapse; table-layout:fixed; width:100%;"><colgroup>{cols}</colgroup>'
            f'<thead><tr>{th}</tr></thead><tbody>{"".join(body_rows)}</tbody></table></div>')


def badge(text):
    return f'<span style="border:1px solid #999; padding:3px 8px; display:inline-block; word-break:keep-all;">{text}</span>'


def dot(text):
    return f'&#9679; {text}'


def card_grid(cards):
    """cards: [(title, subtitle), ...]"""
    items = []
    for title, subtitle in cards:
        items.append(
            '<div style="width:180px; border:1px solid #ccc; background:#fff;">'
            '<div style="height:100px; background:#e8e8e8; display:flex; align-items:center; justify-content:center; font-size:20px; color:#999;">&#9654;</div>'
            f'<div style="padding:8px; font-size:12px; font-weight:600; color:#333;">{title}</div>'
            f'<div style="padding:0 8px 8px; font-size:11px; color:#888;">{subtitle}</div>'
            '</div>'
        )
    return f'<div style="display:flex; gap:14px; flex-wrap:wrap;">{"".join(items)}</div>'


def gantt(rows):
    """rows: [(label, indent_px, bar_left_pct, bar_width_pct), ...]"""
    parts = ['<div style="border:1px solid #ccc; padding:12px; background:#fff;">',
             '<div style="font-size:10px; color:#999; margin-bottom:8px; padding-left:140px;">2026.Q1&nbsp;&nbsp;&nbsp;Q2&nbsp;&nbsp;&nbsp;Q3&nbsp;&nbsp;&nbsp;Q4&nbsp;|&nbsp;2027.Q1&nbsp;&nbsp;&nbsp;Q2&nbsp;&nbsp;&nbsp;Q3&nbsp;&nbsp;&nbsp;Q4&nbsp;|&nbsp;2028</div>']
    for label, indent, left, width in rows:
        parts.append(
            '<div style="display:flex; align-items:center; height:26px; position:relative;">'
            f'<div style="width:140px; flex-shrink:0; padding-left:{indent}px; font-size:11px; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{label}</div>'
            f'<div style="flex:1; position:relative; height:14px; background:#f2f2f2;"><div style="position:absolute; left:{left}%; width:{width}%; height:14px; background:#555;"></div></div>'
            '</div>'
        )
    parts.append('</div>')
    return "\n".join(parts)


def el_badge(target_html_open_tag, label, corner="bottom-right", offset=(-9, -6)):
    """요소별 인디케이터(.indicator-el)를 타겟 요소의 '중첩 자식 배지'로 만들 때 쓰는 스니펫 생성기.

    2026-08-14 핵심 교훈: 이 문서의 화면 레이아웃은 유동폭이다
    (`.screen-section { grid-template-columns: 1fr 380px; }`). 같은 화면인데도 HTML 뷰(임의 폭),
    PDF 내보내기(`applyPrintScaling`이 강제하는 1240px 부근), PPTX 내보내기(`downloadPPTX`가
    강제하는 1680px) 세 가지 렌더 폭이 다르다. 요소 인디케이터를 `.wireframe-wrap` 기준 고정
    top/left px 값으로 별도 형제 요소로 박아두면, 어느 한 폭에서만 맞고 나머지 두 곳에서는
    타겟이 이동한 만큼 어긋나거나(가벼운 경우) PPT 변환 시 슬라이드 밖으로 밀려나 아예
    렌더링에서 누락된다(x/y가 슬라이드 경계를 벗어나면 `sbpptxRenderElement`가 그 요소를
    통째로 건너뜀). 그래서 요소 인디케이터는 **반드시 타겟 요소 자신의 자식으로 중첩**시켜
    `position:relative`(부모) + `position:absolute`(배지, top/left 대신 bottom/right 코너
    오프셋)로 배치한다 — 이러면 렌더 폭이 달라져도 항상 타겟을 따라간다. 사이드바 옆(고정
    190px)처럼 폭 변화와 무관하게 위치가 고정되는 타겟은 예외적으로 기존 방식(고정 형제 요소)도
    무방하지만, 새로 만드는 요소 배지는 이 헬퍼처럼 중첩 방식을 기본값으로 한다.

    이 함수는 타겟의 여는 태그 문자열(예: '<div style="width:88px; ...">')을 받아
    position:relative를 주입하고, 뒤에 붙일 배지 HTML을 함께 반환한다. 실제로는
    "여는태그 + 원래 텍스트/내용 + 배지 + </div>" 형태로 조립해야 하므로, 보통은 이 함수보다
    make_el_badge_wrap()으로 통째로 감싸는 편이 더 간단하다.
    """
    corner_css = {
        "bottom-right": f"bottom:{offset[0]}px; right:{offset[1]}px;",
        "top-left": f"top:{offset[0]}px; left:{offset[1]}px;",
        "top-right": f"top:{offset[0]}px; right:{offset[1]}px;",
        "bottom-left": f"bottom:{offset[0]}px; left:{offset[1]}px;",
    }[corner]
    return f'<div class="indicator-el" style="{corner_css}"><span>{label}</span></div>'


def make_el_badge_wrap(inner_html, label, extra_style="", corner="bottom-right", offset=(-9, -6)):
    """target_html이 이미 완성된 '<div style="...">내용</div>' 문자열일 때, 그 스타일에
    position:relative를 주입하고 내부에 el_badge()를 덧붙인 새 문자열을 만든다.
    inner_html은 태그 없이 순수 내용(텍스트/자식 마크업)만 넘긴다 — 여는/닫는 div는 이 함수가 만든다.
    extra_style: 원래 타겟 div에 주려던 스타일 문자열(position:relative는 자동 추가되므로 빼고 넘김).
    """
    badge = el_badge(None, label, corner=corner, offset=offset)
    return f'<div style="position:relative; {extra_style}">{inner_html}{badge}</div>'


def popup_page(section_id, screen_id_badge, screen_name, trigger_text, backdrop_html,
                modal_title, modal_body_html, modal_width=420, area_badge="1"):
    """팝업/모달을 '화면 안에 작은 미리보기 박스'가 아니라 **별도 screen-section 페이지**로
    문서화할 때 쓰는 표준 틀(2026-08-14 도입). Description의 "팝업 영역"(desc_common.popup_area)
    텍스트만으로는 html/pdf/ppt 어디에도 팝업의 실제 모습이 노출되지 않는다는 지적을 받고
    확립한 패턴이다 — 팝업이 있는 화면은 반드시 이 함수로 만든 새 screen-section을
    부모 화면 페이지들 바로 뒤(다음 화면 앞)에 추가한다.

    backdrop_html: 부모 화면의 TOP BAR+LEFT SIDEBAR+MAIN CONTENT 마크업(그 화면 만들 때 쓴 것을
        그대로 재사용). 단, 그 화면에 이미 붙어있는 `.indicator`/`.indicator-el` 배지는 전부
        제거하고 넘길 것(불필요한 중복 배지로 배경이 지저분해짐) —
        `re.sub(r'<div class="indicator-el"[^>]*>.*?</div>', '', backdrop_html)` 로 제거 후
        `position:relative; ` 문자열도 제거해서 넘긴다.
    modal_body_html: 모달 카드 내부(헤더 아래) 콘텐츠 — 보통 필드 폼 또는 미디어 미리보기 +
        하단 버튼 행. 필드 행은 아래 field_row()로 만든다.
    area_badge: 모달 전체를 가리키는 영역 인디케이터 번호(주황, 보통 "1"). 모달 카드 자체에
        중첩시키므로(position:relative가 이미 모달 wrapper에 있음) 렌더 폭이 달라져도 항상
        모달을 따라간다 — 절대 wireframe-wrap 기준 고정 좌표로 별도 배치하지 말 것.
    """
    return f'''
<div id="{section_id}" class="screen-section">
  <div class="meta-box" style="margin:8px 24px 0 24px;">
    <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
      <span class="screen-id-badge">{screen_id_badge}</span>
      <div><span class="meta-label">Screen</span><div class="meta-value" style="font-weight:600; font-size:15px;">{screen_name}</div></div>
      <div style="margin-left:24px;"><span class="meta-label">Trigger</span><div class="meta-value">{trigger_text}</div></div>
      <div style="margin-left:24px;"><span class="meta-label">Status</span><div class="meta-value">와이어프레임 (샘플, 보정 예정)</div></div>
    </div>
  </div>

  <div class="wireframe-wrap ind-container" style="margin:8px 0 8px 0; border-radius:0; overflow:visible; border:1px solid #ccc; min-height:800px; min-width:0; background:#f2f2f2; font-family:Helvetica,Arial,sans-serif; color:#333;">
    <div class="popup-backdrop" style="opacity:0.32; filter:grayscale(35%); pointer-events:none;">
{backdrop_html}
    </div>
    <div style="position:absolute; inset:0; background:rgba(20,20,20,0.45); display:flex; align-items:center; justify-content:center; z-index:10;">
      <div style="position:relative; width:{modal_width}px; background:#fff; border-radius:6px; box-shadow:0 10px 30px rgba(0,0,0,0.35);">
        <div class="indicator" style="top:-12px; left:-12px;">{area_badge}</div>
        <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #eee;">
          <div style="font-size:15px; font-weight:700; color:#333;">{modal_title}</div>
          <div style="width:22px; height:22px; text-align:center; color:#999; font-size:16px; line-height:22px;">&times;</div>
        </div>
{modal_body_html}
      </div>
    </div>
  </div>

  <div class="desc-wrap" style="margin:0 24px 24px 24px;">
    <h3 style="font-size:16px; font-weight:700; color:#212529; margin:0 0 12px 0;">Description</h3>
    <table class="desc-table">
      <thead><tr><th class="num">NO</th><th>상세설명</th></tr></thead>
      <tbody>
        <!-- 호출부에서 <tr><td class="num">1</td><td>...</td></tr> 를 채워 넣는다 (desc_common.area_row_html 재사용 가능) -->
      </tbody>
    </table>
  </div>
</div>
'''


def field_row(label, required, placeholder, kind="text"):
    """팝업 모달 안의 입력 필드 한 줄. kind: text/textarea/select/checkbox/file."""
    star = ' <span style="color:#e03131;">*</span>' if required else ''
    if kind == "textarea":
        box = f'<div style="min-height:64px; border:1px solid #999; background:#fff; padding:8px 10px; font-size:12px; color:#999;">{placeholder}</div>'
    elif kind == "select":
        box = (f'<div style="height:34px; border:1px solid #999; background:#fff; display:flex; align-items:center; '
               f'justify-content:space-between; padding:0 10px; font-size:12px; color:#555;"><span>{placeholder}</span><span>&#9662;</span></div>')
    elif kind == "checkbox":
        box = (f'<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border:1px solid #999; background:#fff;"></div>'
               f'<span style="font-size:12px; color:#555;">{placeholder}</span></div>')
    elif kind == "file":
        box = (f'<div style="height:34px; border:1px solid #999; background:#fff; display:flex; align-items:center; padding:0 4px;">'
               f'<div style="height:26px; padding:0 10px; background:#eee; border:1px solid #ccc; display:flex; align-items:center; font-size:11px; color:#555; margin-right:8px;">파일 선택</div>'
               f'<span style="font-size:11px; color:#999;">{placeholder}</span></div>')
    else:
        box = f'<div style="height:34px; border:1px solid #999; background:#fff; display:flex; align-items:center; padding:0 10px; font-size:12px; color:#999;">{placeholder}</div>'
    return f'<div><div style="font-size:12px; color:#555; margin-bottom:6px;">{label}{star}</div>{box}</div>'


def scroll_table_wrap(table_html, max_height=520, direction="vertical", sticky_header=True):
    """스크롤 가능한 테이블 영역을 감싸는 wrapper(2026-08-15 도입, 가이드 1절 Step 4-1 참고).

    실 구현(render.js)의 .scroll-panel/sticky-head 등으로 세로 스크롤이 있거나 컬럼이 많아
    가로 스크롤이 생기는 표는 와이어프레임에도 "스크롤된다"는 사실이 드러나야 한다. 정적
    캡처(PDF/PPT)에서는 실제 스크롤 동작을 재현할 수 없으므로, wrapper 안쪽에 작은 배지
    텍스트로 스크롤 가능함을 표시한다.

    table_html: 이미 완성된 <table>...</table> 또는 simple_table() 반환값(자체 wrapper 포함).
    direction: "vertical"(세로, sticky 헤더) / "horizontal"(가로) / "both"(양방향).
    max_height: 세로 스크롤 시 wrapper의 max-height(px). 실제 구현 값을 실측해서 넣을 것
        (감으로 정하지 않는다 — 가이드 Step 4 원칙과 동일).
    """
    badges = []
    if direction in ("vertical", "both"):
        badges.append('<div style="position:absolute; top:6px; right:10px; font-size:10px; color:#999; background:rgba(255,255,255,0.9); padding:2px 6px; border:1px solid #ccc; z-index:5;">&#9660; 스크롤</div>')
    if direction in ("horizontal", "both"):
        badges.append('<div style="position:absolute; bottom:6px; right:10px; font-size:10px; color:#999; background:rgba(255,255,255,0.9); padding:2px 6px; border:1px solid #ccc; z-index:5;">&#9664; 좌우 스크롤 &#9654;</div>')
    badge_html = "".join(badges)

    overflow_css = {
        "vertical": f"overflow-y:auto; overflow-x:hidden; max-height:{max_height}px;",
        "horizontal": "overflow-x:auto; overflow-y:hidden;",
        "both": f"overflow:auto; max-height:{max_height}px;",
    }[direction]

    sticky_css = ""
    if sticky_header and direction in ("vertical", "both"):
        sticky_css = "<style>.scroll-wrap-sticky thead th { position:sticky; top:0; z-index:3; }</style>"

    return (
        f'{sticky_css}'
        f'<div style="position:relative; border:1px solid #ccc;">'
        f'<div class="scroll-wrap-sticky" style="{overflow_css}">{table_html}</div>'
        f'{badge_html}'
        f'</div>'
    )


def modal_preview(title, fields):
    """fields: [(label, required_bool, placeholder), ...] — 화면 안에 직접 박아넣는 팝업 미리보기 박스(선택 사용)."""
    rows = []
    for label, req, ph in fields:
        star = ' *' if req else ''
        rows.append(
            '<div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">'
            f'<div style="width:110px; flex-shrink:0; font-size:12px; color:#333;">{label}{star}</div>'
            f'<div style="flex:1; height:30px; border:1px solid #999; background:#fff; display:flex; align-items:center; padding:0 8px; font-size:12px; color:#999;">{ph}</div>'
            '</div>'
        )
    return (
        '<div style="width:420px; border:1px solid #999; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.15);">'
        f'<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid #ccc;"><div style="font-size:13px; font-weight:700; color:#333;">{title}</div><div style="font-size:14px; color:#999;">&times;</div></div>'
        f'<div style="padding:14px;">{"".join(rows)}'
        '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">'
        '<div style="height:30px; padding:0 16px; border:1px solid #999; display:flex; align-items:center; justify-content:center; font-size:12px;">취소</div>'
        '<div style="height:30px; padding:0 16px; background:#333; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px;">등록</div>'
        '</div></div></div>'
    )


# ---------------------------------------------------------------------------
# 매체별 조건부 렌더링 (2026-08-18 도입, SCR-001 요구사항 1/2에서 처음 사용)
#
# 이 문서는 HTML 화면/PDF(@media print)/PPTX(라이브 DOM, @media를 안 거침) 세 가지 렌더
# 매체를 갖는다. "HTML 화면에서는 숨기고 PDF/PPT에서만 보인다"(또는 그 반대) 패턴이 필요할 때
# 아래 두 CSS 클래스 컨벤션 + downloadPPTX()의 강제 노출 로직을 재사용한다. 새로 발명하지 말 것.
#
#   .scroll-badge-vertical  — 세로 스크롤 배지처럼 "HTML에서는 실제 스크롤이 되니 불필요,
#                             정적 캡처에서만 필요"한 장식 요소에 붙인다.
#   .pdf-only-page          — 정적 분할용으로 새로 만든 .screen-section 자체를 HTML 화면
#                             스크롤 목록에서 숨길 때(그 화면의 PDF/PPT 전용 버전) 붙인다.
#
# 두 클래스 모두 이 문서의 <style> 안에 이미 다음 규칙이 있다(신규 클래스를 추가할 때마다
# 아래와 같은 형태로 <style> 블록에 규칙을 더 추가하면 된다 — 이 함수들은 규칙 자체를
# 만들어주지 않으므로 <style> 편집은 여전히 수동):
#   @media screen { .클래스명 { display: none !important; } }
#
# **주의**: downloadPPTX()에서 이 클래스들을 강제로 다시 보이게 할 때 절대
# `el.style.display = 'block'`을 쓰지 않는다 — 위 CSS 규칙이 `!important`이므로 일반
# 인라인 style은 이긴다. 반드시 `el.style.setProperty('display', 'block', 'important')`를
# 쓴다(2026-08-18 SCR-001 요구사항 1/2 작업 중 처음엔 이 실수로 PPTX에서 3페이지가
# 통째로 빠지는 사고가 있었다 — showEls 강제 노출 로직 참고).
# ---------------------------------------------------------------------------


def paginate_table_rows(row_heights, page_budget, header_height=0):
    """표 행(tr)들을 "정적 캡처(PDF/PPT) 1페이지에 들어갈 분량"씩 그리디하게 나눈다.
    Description 텍스트 청크 분할(paginate.py의 pack_pages())과 같은 문제를, 표의 실제
    렌더 행 높이 기준으로 푸는 버전이다 — 감으로 "대충 7행씩" 나누지 않고, 반드시
    Playwright로 각 행의 getBoundingClientRect().height를 실측해서 이 함수에 넘긴다
    (SCR-001 "공정별 상세" 표 6/7/4행 분할이 이 방식으로 결정됨, 근거는
    화면설계서_와이어프레임_작성가이드.md 참고).

    row_heights: 각 tbody 행의 실측 높이(px) 리스트, 순서 유지.
    page_budget: 표 영역에 쓸 수 있는 페이지당 최대 높이(px). 헤더를 제외한 값이 아니라
        헤더까지 포함한 표 전체 예산을 넘긴다 — header_height를 이 함수가 각 페이지에서
        빼고 계산한다(모든 페이지가 헤더를 반복하므로).
    header_height: thead 반복 높이(px, rowspan 포함 전체 헤더 행 높이 합).

    반환: [[row_index, ...], ...] — 페이지별 원본 인덱스 리스트. 청크(행) 유실 없이
    합집합이 원본 전체와 정확히 일치함을 assert로 보장한다(paginate.py의 원칙과 동일).
    """
    remaining_budget = page_budget - header_height
    if remaining_budget <= 0:
        raise ValueError("page_budget이 header_height보다 작거나 같습니다 — 헤더조차 한 페이지에 안 들어갑니다.")

    pages = []
    current = []
    current_h = 0
    for idx, h in enumerate(row_heights):
        if current and current_h + h > remaining_budget:
            pages.append(current)
            current = []
            current_h = 0
        if not current and h > remaining_budget:
            # 행 하나가 예산을 넘는 예외 케이스 — 그래도 유실 없이 자기 페이지를 차지하게 한다.
            pages.append([idx])
            continue
        current.append(idx)
        current_h += h
    if current:
        pages.append(current)

    flat = [i for pg in pages for i in pg]
    assert flat == list(range(len(row_heights))), "행 유실/순서 오류 — paginate.py 원칙(입력 청크 수 == 출력 청크 수) 위반"
    return pages
