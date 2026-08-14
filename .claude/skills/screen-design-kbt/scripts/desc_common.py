# -*- coding: utf-8 -*-
"""
Description(상세설명) 표 생성 — 확정된 작성 정책 적용
(자세한 정책 근거는 05.리포트/화면설계서_Description작성가이드.md 참고):
 - NO 컬럼은 영역번호만
 - 영역 1개 = 표에서 1행(tr). 요소가 여러 개여도 한 셀에 이어서 작성
 - 요소가 1개면 번호 생략, 2개 이상이면 "N-순번" 번호 부여
 - 영역명/요소명/요소NO 볼드, 노출조건→입력조건→출력조건→인터랙션→예외Case→관리자연동→BE연동
   순, 없으면 생략
 - 좌측 상단 정렬(desc-table 기본 CSS로 이미 충족)
 - 팝업/모달은 반드시 "팝업 영역"(요소 여러 개면 각 팝업이 요소 1개씩)으로 문서화
"""

LABELS_ORDER = ["노출조건", "입력조건", "출력조건", "인터랙션", "예외 Case", "관리자 화면 연동", "BE 연동"]


def _detail_html(detail_pairs):
    """detail_pairs: [(label, text), ...] — label은 LABELS_ORDER 중 하나를 권장(강제하지 않음)."""
    return "<br>".join(f'<span class="cond-label">{label}:</span> {text}' for label, text in detail_pairs)


def area_row_html(no, name, desc, elements):
    """elements: [{"name": str|None, "detail": [(label,text),...]}, ...]
    name이 None이면 detail만 이어서 출력(단일 셀 병합용, 흔치 않음)."""
    cell_parts = [f'<b>영역명: {name}</b><br>ㄴ {desc}']
    multi = len(elements) > 1
    for i, el in enumerate(elements, start=1):
        if el.get("name"):
            el_label = f'{no}-{i} {el["name"]}' if multi else el["name"]
            cell_parts.append(f'<b>요소: {el_label}</b><br>{_detail_html(el["detail"])}')
        else:
            cell_parts.append(_detail_html(el["detail"]))
    cell = "<br><br>".join(cell_parts)
    return f'''        <tr>
          <td class="num">{no}</td>
          <td>
            {cell}
          </td>
        </tr>
'''


def popup_area(no, popups):
    """popups: [(팝업 제목, [(label, text), ...]), ...] — 화면 마지막 영역으로 추가할 때 사용."""
    if len(popups) == 1:
        title, detail = popups[0]
        return dict(no=no, name="팝업 영역", desc=f"{title}을 트리거하는 영역이다.",
                    elements=[dict(name=title, detail=detail)])
    elements = [dict(name=t, detail=d) for t, d in popups]
    return dict(no=no, name="팝업 영역", desc="이 화면에서 트리거되는 팝업/모달로 구성된 영역이다.",
                elements=elements)


def build_desc_table(areas, heading="Description"):
    """areas: [{"no": str, "name": str, "desc": str, "elements": [...]}, ...]"""
    rows = "".join(area_row_html(a["no"], a["name"], a["desc"], a["elements"]) for a in areas)
    return f'''<h3 style="font-size:16px; font-weight:700; color:#212529; margin:0 0 12px 0;">{heading}</h3>
    <table class="desc-table">
      <thead><tr><th class="num">NO</th><th>상세설명</th></tr></thead>
      <tbody>
{rows}      </tbody>
    </table>'''
