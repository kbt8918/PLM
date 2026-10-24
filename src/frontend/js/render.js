/*
 * PNDES 신규 메뉴 화면 렌더 함수
 * config.js(화면 메타/GNB 구조) + data.js/mock/*.js(mock 데이터)를 받아 화면별 HTML 문자열을 생성한다.
 * jQuery는 이벤트 위임(app.js)에서만 사용하고, 여기서는 순수 문자열 템플릿으로 마크업을 구성한다.
 */
(function (global) {
  'use strict';

  var D = global.PNDES.data;
  var SCREENS = global.PNDES.SCREENS;
  var MODALS = global.PNDES.MODALS;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- 공용 헬퍼 ----------

  function badge(text, kind) {
    return '<span class="badge badge-' + kind + '">' + esc(text) + '</span>';
  }

  function renderFilterBar(labels, opts) {
    opts = opts || {};
    var fields = labels.map(function (label, i) {
      var placeholder = opts.placeholders ? opts.placeholders[i] : '전체';
      var labelHtml = opts.hideLabels ? '' : '<label>' + esc(label) + '</label>';
      return '<div class="filter-field"' + (opts.hideLabels ? ' style="justify-content:flex-end"' : '') + '>' + labelHtml +
        '<select aria-label="' + esc(label) + '"><option>' + esc(placeholder) + '</option></select></div>';
    }).join('');
    var reset = opts.noReset ? '' : '<button type="button" class="btn btn-secondary">초기화</button>';
    var syncBadge = opts.syncBadge ? '<div class="filter-sync-badge">최종 동기화: ' + esc(opts.syncBadge) + '</div>' : '';
    return (
      '<div class="filter-bar">' +
        fields +
        '<div class="filter-spacer"></div>' +
        reset +
        '<button type="button" class="btn btn-primary" data-action="' + (opts.searchAction || 'run-search') + '">조회</button>' +
      '</div>' +
      syncBadge
    );
  }

  function renderTable(cols, rowsHtml, opts) {
    opts = opts || {};
    var thead = cols.map(function (c) {
      var cls = c.align === 'right' ? ' class="al-r"' : c.align === 'center' ? ' class="al-c"' : '';
      return '<th' + cls + '>' + esc(c.label) + '</th>';
    }).join('');
    return (
      '<table class="data-table' + (opts.grid ? ' data-table-grid' : '') + (opts.pad12 ? ' data-table-pad12' : '') + '"' + (opts.style ? ' style="' + opts.style + '"' : '') + '>' +
        '<thead><tr>' + thead + '</tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>'
    );
  }

  // 근거: design_handoff_생기포털 README "페이지네이션 — 목록 하단 중앙 정렬, 숫자 버튼 나열 + 현재 페이지는
  // accent-600 배경으로 강조". pageKey는 app.js state의 페이지 번호 필드명(예: 'masterPage')과 대응합니다.
  function renderPagination(totalItems, page, pageSize, pageKey) {
    var totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    var cur = Math.min(page, totalPages);
    if (totalPages <= 1) return '';
    var btn = function (label, targetPage, disabled, active) {
      var cls = active ? 'btn-primary' : 'btn-secondary';
      return '<button type="button" class="btn ' + cls + '" style="width:32px;height:32px;padding:0"' +
        (disabled ? ' disabled' : ' data-action="set-page" data-key="' + pageKey + '" data-page="' + targetPage + '"') + '>' + label + '</button>';
    };
    var numbers = '';
    for (var i = 1; i <= totalPages; i++) { numbers += btn(String(i), i, false, i === cur); }
    return '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:var(--sp-md)">' +
      btn('&lsaquo;', cur - 1, cur <= 1, false) + numbers + btn('&rsaquo;', cur + 1, cur >= totalPages, false) +
    '</div>';
  }

  function td(content, align, extraClass) {
    var cls = [];
    if (align === 'right') cls.push('al-r');
    if (align === 'center') cls.push('al-c');
    if (extraClass) cls.push(extraClass);
    return '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + content + '</td>';
  }

  function renderCardGrid(cards) {
    return '<div class="card-grid">' + cards + '</div>';
  }

  // ---------- GNB (상단 헤더 + 메가메뉴) ----------
  // 근거: design-import/README.md "Global Layout (v3)" / "상단 메뉴 구조 (GNB)" / "GNB 인터랙션".
  // 좌측 메뉴(LNB)는 제거됨 — 화면 이동은 이 메가메뉴와 화면 내 링크로만 한다.
  var GNB_MENUS = global.PNDES.GNB_MENUS || [];
  var GNB_VIEW_OWNER = global.PNDES.GNB_VIEW_OWNER || {};

  function renderGnbTop(state) {
    var currentScreen = state.currentScreen;
    var gnbOpen = state.gnbOpen || '';
    var gnbPinned = !!state.gnbPinned;
    var activeOwner = GNB_VIEW_OWNER[currentScreen];

    var navHtml = GNB_MENUS.map(function (m) {
      var isActive = m.id === activeOwner;
      var isOpen = gnbOpen === m.id;
      var cls = 'gnb-nav-item' + (isActive ? ' active' : '') + (isOpen ? ' open' : '');
      return '<div class="gnb-nav-item-wrap" data-action="gnb-enter" data-menu-id="' + m.id + '">' +
        '<button type="button" class="' + cls + '" data-action="gnb-click" data-menu-id="' + m.id + '"' +
          (m.cols ? ' data-has-panel="1"' : '') + (m.landing ? ' data-landing="' + esc(m.landing) + '"' : '') + '>' +
          esc(m.label) +
        '</button>' +
      '</div>';
    }).join('');

    var openMenu = gnbOpen ? GNB_MENUS.filter(function (m) { return m.id === gnbOpen; })[0] : null;
    var panelHtml = '';
    if (openMenu && openMenu.cols) {
      var tabsHtml = '';
      if (openMenu.tabs) {
        tabsHtml = '<div class="gnb-panel-tabs">' + openMenu.tabs.map(function (t, i) {
          return '<button type="button" class="gnb-panel-tab' + (i === (state.gnbTab || 0) ? ' active' : '') + '" data-action="gnb-tab" data-tab-index="' + i + '">' + esc(t) + '</button>';
        }).join('') + '</div>';
      }
      var colsHtml = openMenu.cols.map(function (c) {
        var itemsHtml = c.items.map(function (it) {
          var label = it[0], view = it[1], admin = it[2], sub = it[3];
          var isCurrent = view && view === currentScreen;
          var leafCls = 'gnb-panel-leaf' + (sub ? ' gnb-panel-leaf-sub' : '') + (isCurrent ? ' active' : '');
          return '<button type="button" class="' + leafCls + '" data-action="gnb-leaf"' + (view ? ' data-view="' + esc(view) + '"' : '') + '>' +
            '<span>' + (sub ? 'ㄴ ' : '') + esc(label) + '</span>' +
            (admin ? '<span class="gnb-panel-admin">A</span>' : '') +
          '</button>';
        }).join('');
        return '<div class="gnb-panel-col"><div class="gnb-panel-col-title">' + esc(c.title) + '</div><div class="gnb-panel-col-items">' + itemsHtml + '</div></div>';
      }).join('');
      panelHtml = '<div class="gnb-panel"><div class="gnb-panel-inner">' + tabsHtml +
        '<div class="gnb-panel-grid" style="grid-template-columns:repeat(' + openMenu.cols.length + ',minmax(180px,1fr))">' + colsHtml + '</div>' +
      '</div></div>';
    }

    var backdrop = gnbPinned ? '<div class="gnb-backdrop"></div>' : '';

    return (
      backdrop +
      '<div class="gnb-row">' +
        '<button type="button" class="gnb-brand" data-action="gnb-go" data-view="todo-main">' +
          '<span class="gnb-brand-mark">생</span>' +
          '<span class="gnb-brand-name">생산기술업무</span>' +
          '<span class="gnb-brand-sub">생기포털</span>' +
        '</button>' +
        '<div class="gnb-top-right">' +
          '<span>Today <b>0</b></span><span class="gnb-top-sep"></span>' +
          '<span>현재 접속자 <b>0명</b></span><span class="gnb-top-sep"></span>' +
          '<span class="gnb-top-user"><i class="fa-regular fa-user"></i>홍길동 님</span>' +
          '<button type="button" class="gnb-top-btn" data-action="gnb-guide">업무가이드</button>' +
          '<button type="button" class="gnb-top-btn" data-action="logout">로그아웃</button>' +
          '<button type="button" class="gnb-top-btn">CarCode</button>' +
          '<button type="button" class="gnb-top-btn">번역기</button>' +
          '<select class="gnb-top-select"><option>한국어</option><option>English</option></select>' +
        '</div>' +
      '</div>' +
      '<nav class="gnb-nav">' + navHtml + '</nav>' +
      panelHtml
    );
  }

  // 메인 컨텐츠 상단 타이틀/브레드크럼 — todo-main(포털 홈)에서는 숨김, 그 외 화면은 기존처럼 표시
  function renderContentTitleBar(state) {
    if (state.currentScreen === 'todo-main') return '';
    var meta = SCREENS[state.currentScreen] || { group: '', name: '', admin: false };
    var activeOwner = GNB_VIEW_OWNER[state.currentScreen];
    var ownerMenu = GNB_MENUS.filter(function (m) { return m.id === activeOwner; })[0];
    return '<div class="content-title-bar">' +
      '<h1>' + esc(meta.name) + (meta.admin ? '<span class="badge-admin-top">관리자</span>' : '') + '</h1>' +
      '<p>생기포털 &rsaquo; ' + esc(ownerMenu ? ownerMenu.label : meta.group) + ' &rsaquo; ' + esc(meta.name) + '</p>' +
    '</div>';
  }

  // ---------- 포털 홈 (todo-main) ----------
  // 근거: design-import/생기포털 v3.dc.html isTodoMain 블록(검색 히어로 + TO DO + 금주 내 업무 + 내 업무/Q&A + 공지사항).
  var PM_CLOCK = '한국 : 2026-10-20 07:45'; // v3 pmClock (프로토타입 고정값)

  // ---------- My Job (포털 홈) ----------
  // 근거: design-import/생기포털 v3.dc.html isTodoMain 블록 / pmVals().
  // 구성(소스 순서): ① TO DO 카드 3종 + 내 업무 + 업무 지연 현황(3컬럼)
  //                  ② 금주 내 업무(카드 3종) + 생산제조기술 공유(요약 3종)
  //                  ③ MY Q&A/FAQ 탭 + 공지사항
  // 범위 라디오(개인/팀/실)는 영역별로 독립이며(a: 내 업무, b: 지연현황, c: 금주 업무),
  // 선택에 따라 표/카드 수치가 바뀐다.
  var PM = global.PNDES.mock.todoMain;

  // 상단 3px 액센트 바를 가진 카드 섹션 공통 틀
  function pmSection(inner, extraCls) {
    return '<section class="pm-card' + (extraCls ? ' ' + extraCls : '') + '">' +
      '<div class="pm-card-accent"></div>' +
      '<div class="pm-card-body">' + inner + '</div>' +
    '</section>';
  }

  // 범위 선택 라디오 (개인/팀/실)
  function pmScope(key, current) {
    return '<div class="pm-scope">' + PM.scopes.map(function (l) {
      return '<label class="pm-scope-item">' +
        '<input type="radio" name="pm-' + key + '" data-action="pm-scope" data-key="' + key + '" data-value="' + esc(l) + '"' +
        (l === current ? ' checked' : '') + ' />' + esc(l) +
      '</label>';
    }).join('') + '</div>';
  }

  function pmHeading(label) {
    return '<h3 class="pm-h3"><span class="pm-h3-dot"></span>' + esc(label) + '</h3>';
  }

  function renderTodoMain(state) {
    var scope = state.todoScope || { a: '개인', b: '개인', c: '개인' };
    var week = state.weekSel === '차주' ? '차주' : '금주';
    var qaTab = state.qaTab === 'faq' ? 'faq' : 'qa';

    // ① TO DO 카드 — 좌측 네이비 라벨 + 우측 흰 배경 건수
    var cardsHtml = PM.cards.map(function (c) {
      return '<button type="button" class="pm-todo-card" data-action="pm-toast" data-m="' + esc(c[0]) + ' 목록으로 이동합니다.">' +
        '<span class="pm-todo-label"><i class="' + esc(c[2]) + '"></i><span>' + esc(c[0]) + '</span></span>' +
        '<span class="pm-todo-value"><span class="pm-todo-num">' + c[1] + '</span><span class="pm-todo-unit">건</span></span>' +
      '</button>';
    }).join('');

    // 내 업무 — 일정/시작일/종료일 5행
    var myData = PM.MY[scope.a] || PM.MY['개인'];
    var myRows = PM.myRowLabels.map(function (label, i) {
      return '<tr><td>' + esc(label) + '</td>' +
        '<td><button type="button" class="pm-num" data-action="pm-toast" data-m="' + esc(label) + ' 업무 목록">' + myData[i][0] + '</button><span class="pm-unit">건</span></td>' +
        '<td><button type="button" class="pm-num" data-action="pm-toast" data-m="' + esc(label) + ' 업무 목록">' + myData[i][1] + '</button><span class="pm-unit">건</span></td></tr>';
    }).join('');

    // 업무 지연 현황 — 기술과제는 해당 화면으로 이동, 나머지는 토스트
    var delayRows = (PM.DELAY[scope.b] || PM.DELAY['개인']).map(function (d) {
      var act = d[0] === '기술과제'
        ? ' data-action="select-screen" data-screen-id="SCR-013"'
        : ' data-action="pm-toast" data-m="' + esc(d[0]) + ' 지연 목록"';
      return '<tr><td>' + esc(d[0]) + '</td>' +
        '<td><button type="button" class="pm-num"' + act + '>' + d[1] + '</button><span class="pm-unit">건</span></td></tr>';
    }).join('');

    var topHtml = pmSection(
      '<div class="pm-top-grid">' +
        '<div class="pm-todo-cards">' + cardsHtml + '</div>' +
        '<div class="pm-col">' +
          '<div class="pm-col-head">' + pmHeading('내 업무') + pmScope('a', scope.a) + '</div>' +
          '<table class="pm-table"><thead><tr><th>일정</th><th>시작일</th><th>종료일</th></tr></thead>' +
          '<tbody>' + myRows + '</tbody></table>' +
        '</div>' +
        '<div class="pm-col">' +
          '<div class="pm-col-head">' + pmHeading('업무 지연 현황') + pmScope('b', scope.b) + '</div>' +
          '<table class="pm-table"><thead><tr><th>업무</th><th>지연건</th></tr></thead>' +
          '<tbody>' + delayRows + '</tbody></table>' +
        '</div>' +
      '</div>'
    );

    // ② 금주 내 업무 — 카드 3종(진행중/지연 각각 클릭 가능)
    var weekData = (PM.WEEK[week] || {})[scope.c] || PM.WEEK['금주']['개인'];
    var weekCards = PM.weekCardLabels.map(function (label, i) {
      var prog = weekData[i][0];
      var delay = weekData[i][1];
      var delayAct = label === '기술과제'
        ? ' data-action="select-screen" data-screen-id="SCR-013"'
        : ' data-action="pm-toast" data-m="' + esc(label) + ' 지연 업무 목록"';
      return '<div class="pm-week-card">' +
        '<div class="pm-week-head">' + esc(label) + '</div>' +
        '<div class="pm-week-row pm-week-row-top">' +
          '<span class="pm-week-key"><span class="pm-dot pm-dot-blue"></span>진행중</span>' +
          '<span><button type="button" class="pm-num" data-action="pm-toast" data-m="' + esc(label) + ' 진행중 업무 목록">' + prog + '</button><span class="pm-unit">건</span></span>' +
        '</div>' +
        '<div class="pm-week-row">' +
          '<span class="pm-week-key"><span class="pm-dot pm-dot-red"></span>지연</span>' +
          '<span><button type="button" class="pm-num"' + delayAct + '>' + delay + '</button><span class="pm-unit">건</span></span>' +
        '</div>' +
      '</div>';
    }).join('');

    var weekSelHtml = '<select class="pm-week-sel" data-action="pm-week-sel">' +
      ['금주', '차주'].map(function (w) {
        return '<option value="' + w + '"' + (w === week ? ' selected' : '') + '>' + w + '</option>';
      }).join('') + '</select>';

    var weekHtml = pmSection(
      '<div class="pm-sec-head">' +
        '<p class="pm-sec-title">금주 내 업무</p>' +
        '<div class="pm-sec-tools">' + pmScope('c', scope.c) + weekSelHtml + '</div>' +
      '</div>' +
      '<div class="pm-week-grid">' + weekCards + '</div>'
    );

    // 생산제조기술 공유 — 요약 3종(클릭 시 Tech PR로 이동)
    var shareCards = PM.share.map(function (sh) {
      return '<button type="button" class="pm-share-card" data-action="select-screen" data-screen-id="SCR-009">' +
        '<span class="pm-share-label">' + esc(sh[0]) + '</span>' +
        '<span class="pm-share-value"><span class="pm-todo-num">' + sh[1] + '</span><span class="pm-todo-unit">건</span></span>' +
      '</button>';
    }).join('');
    var shareHtml = pmSection(
      '<div class="pm-sec-head"><p class="pm-sec-title">생산제조기술 공유</p></div>' +
      '<div class="pm-share-grid">' + shareCards + '</div>'
    );

    // ③ MY Q&A / FAQ
    var qaRows = (qaTab === 'faq' ? PM.faq : PM.qa).map(function (q) {
      return '<tr data-action="pm-toast" data-m="' + esc(q[0]) + ' 상세 화면으로 이동합니다.">' +
        '<td class="pm-qa-no">' + esc(q[0]) + '</td>' +
        '<td class="pm-qa-title">' + esc(q[1]) + '</td>' +
        '<td class="pm-qa-date">' + esc(q[2]) + '</td>' +
        '<td class="pm-qa-state">' + (q[3] ? '<span class="pm-state-badge">' + esc(q[3]) + '</span>' : '') + '</td></tr>';
    }).join('');
    var qaTabs = [['qa', 'MY Q&A'], ['faq', 'FAQ']].map(function (t) {
      return '<button type="button" class="pm-qa-tab' + (qaTab === t[0] ? ' is-active' : '') + '" data-action="pm-qa-tab" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join('');
    var qaHtml = pmSection(
      '<div class="pm-qa-head">' +
        '<div class="pm-qa-tabs">' + qaTabs + '</div>' +
        '<div class="pm-icon-btns">' +
          '<button type="button" class="pm-icon-btn" data-action="pm-toast" data-m="Q&A 등록 화면으로 이동합니다." title="Q&A 등록"><i class="fas fa-pen-to-square"></i></button>' +
          '<button type="button" class="pm-icon-btn" data-action="pm-toast" data-m="Q&A 전체 목록으로 이동합니다." title="Q&A 조회"><i class="fas fa-magnifying-glass"></i></button>' +
        '</div>' +
      '</div>' +
      '<table class="pm-table pm-qa-table"><tbody>' + qaRows + '</tbody></table>'
    );

    // 공지사항
    var noticeRows = PM.notices.map(function (n) {
      return '<tr data-action="pm-toast" data-m="공지사항 상세 화면으로 이동합니다.">' +
        '<td class="pm-notice-title">' + esc(n[0]) + '</td>' +
        '<td class="pm-qa-date">' + esc(n[1]) + '</td></tr>';
    }).join('');
    var noticeHtml = pmSection(
      '<div class="pm-sec-head">' +
        '<p class="pm-sec-title">공지사항</p>' +
        '<button type="button" class="pm-icon-btn" data-action="pm-toast" data-m="공지사항 전체 목록으로 이동합니다." title="공지사항 조회"><i class="fas fa-magnifying-glass"></i></button>' +
      '</div>' +
      '<table class="pm-table pm-qa-table"><tbody>' + noticeRows + '</tbody></table>'
    );

    return (
      '<div class="pm-wrap" data-screen-label="My Job">' +
        topHtml +
        '<div class="pm-grid-2">' + weekHtml + shareHtml + '</div>' +
        '<div class="pm-grid-2">' + qaHtml + noticeHtml + '</div>' +
        '<div class="todo-footer">' +
          '<span class="todo-footer-copy">COPYRIGHT (C) 2015 HYUNDAI MOBIS CO.,LTD. ALL RIGHTS RESERVED.</span>' +
          '<div class="todo-footer-tools">' +
            '<button type="button" class="todo-foot-btn" data-action="pm-toast" data-m="Web Manual을 엽니다."><i class="far fa-file-lines"></i>Web Manual</button>' +
            '<select class="todo-foot-sel" aria-label="Family Site"><option>Family Site</option><option>One MOBIS</option></select>' +
            '<select class="todo-foot-sel" aria-label="서버 시간"><option>' + esc(PM.clock) + '</option></select>' +
            '<button type="button" class="todo-foot-icon" data-action="pm-toast" data-m="시간을 새로고침했습니다." title="새로고침"><i class="fas fa-rotate-right"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- MTRM-MAIN 메인 대시보드 ----------
  // 근거: 중장기 방향성 공유 그룹의 최종 랜딩 화면 — KPI 5개(SCR-006과 동일 데이터) + 통합 로드맵
  // 미니 간트(dashRoadmaps: scr006Rows의 5개 대표 로드맵을 고정 lead/span 막대로 표시, 행 클릭 시
  // 아코디언으로 taskRoadmapList 상세과제 펼침 — SCR-008과는 별개 데이터/상태) +
  // 생산기술 Tech PR 미리보기(3개, SCR-009와 동일 유형 배지/썸네일) + 최근 기술동향(8개)

  // 대표 로드맵 5개의 막대 위치·색상은 js/mock/mtrm-main.js barMap 참고.
  // 로드맵명 셀 클릭 = 하위 상세과제 펼침/접힘(v3 onToggle), 막대 클릭 = 해당 로드맵으로 필터된
  // 상세과제 로드맵 관리로 이동(README "로드맵 바 클릭 시 상세과제 로드맵 관리로 이동").
  var DASH_ROADMAP_BAR_MAP = global.PNDES.mock.mtrmMain.barMap;

  function renderMtrmMainGantt(state) {
    var expanded = state.dashExpandedRoadmaps || [];
    // 근거: v3 헤더는 연도 첫 분기만 "26.Q1"로 쓰고 나머지는 "Q2/Q3/Q4"로 줄여 쓴다.
    var quarterHeader = D.chartQuarters.map(function (q) {
      var label = q.slice(-2) === 'Q1' ? q : q.slice(-2);
      return '<th>' + esc(label) + '</th>';
    }).join('');

    var rowsHtml = D.scr006Rows.filter(function (rm) { return DASH_ROADMAP_BAR_MAP[rm.name]; }).map(function (rm) {
      var conf = DASH_ROADMAP_BAR_MAP[rm.name];
      var subs = state.taskRoadmapList.filter(function (r) { return r.roadmap === rm.name; });
      var hasSub = subs.length > 0;
      var isExpanded = hasSub && expanded.indexOf(rm.name) !== -1;
      var expandAttrs = hasSub ? ' data-action="toggle-dash-roadmap" data-category="' + esc(rm.name) + '"' : '';
      var expandIcon = hasSub ? '<i class="fas fa-chevron-' + (isExpanded ? 'down' : 'right') + ' dash-gantt-chevron"></i>' : '';
      var barCls = 'dash-gantt-bar' + (hasSub ? '' : ' dash-gantt-bar-empty');
      var row = '<tr class="dash-gantt-row">' +
        '<td class="dash-gantt-name' + (hasSub ? ' is-clickable' : '') + '"' + expandAttrs + '>' + expandIcon + esc(rm.name) + '</td>' +
        '<td colspan="12" class="dash-gantt-track-cell">' +
          '<div class="dash-gantt-track">' +
            '<div class="' + barCls + '" data-action="dash-roadmap-bar" data-roadmap="' + esc(rm.name) + '" title="상세과제 로드맵 관리로 이동" style="grid-column:' + (conf.lead + 1) + ' / span ' + conf.span + ';background:' + conf.color + '">' + (hasSub ? '' : '상세과제 미등록') + '</div>' +
          '</div>' +
        '</td>' +
      '</tr>';

      var subRows = '';
      if (isExpanded) {
        subRows = subs.map(function (r, si) {
          var span = periodToChartSpan(r.period);
          return '<tr class="dash-gantt-sub' + (si % 2 === 0 ? ' is-zebra' : '') + '">' +
            '<td class="dash-gantt-sub-name" style="border-left-color:' + conf.accent + '" title="' + esc(r.name) + '">' +
              '<div class="dash-gantt-sub-title">&#9492; ' + esc(r.name) + '</div>' +
              '<div class="dash-gantt-sub-meta">' +
                '<span class="badge badge-' + (CHART_SUBTASK_STATUS_KIND[r.status] || 'warning') + '">' + esc(r.status) + '</span>' +
                '<span>' + esc(r.period) + '</span>' +
              '</div>' +
            '</td>' +
            '<td colspan="12" class="dash-gantt-track-cell">' +
              '<div class="dash-gantt-track">' +
                '<div class="dash-gantt-sub-bar" style="grid-column:' + span.colStart + ' / span ' + span.colSpan + ';background:' + conf.color + '"></div>' +
              '</div>' +
            '</td>' +
          '</tr>';
        }).join('');
      }
      return row + subRows;
    }).join('');

    return (
      '<div class="panel" style="margin-bottom:var(--sp-xl);padding:16px">' +
        '<div class="panel-head-row" style="margin-bottom:12px">' +
          '<div class="panel-title" style="margin-bottom:0">통합 로드맵</div>' +
          '<a href="#" class="panel-link" data-action="select-screen" data-screen-id="SCR-006">통합 로드맵 보기 &gt;</a>' +
        '</div>' +
        '<div style="overflow-x:auto">' +
          '<table class="dash-gantt"><thead><tr><th class="dash-gantt-head-name">로드맵</th>' + quarterHeader + '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
        '</div>' +
      '</div>'
    );
  }

  function renderMTRMMAIN(state) {
    // 근거: v3.dc.html dashTechPrCards — 상세 자료 앞 3건을 테두리 없는 정사각 썸네일 + 유형 배지 + 제목 + 분과로 표시
    var techPrPreview = D.techPrCards.slice(0, 3).map(function (c, i) {
      var typeInfo = TECH_PR_TYPE[c.type];
      return '<div class="dash-tp-card" data-action="open-techpr-detail" data-index="' + i + '">' +
        techPrThumb(c, false) +
        '<span class="tech-pr-type-badge" style="color:' + typeInfo.color + ';background:' + typeInfo.bg + '">' + esc(typeInfo.label) + '</span>' +
        '<p class="dash-tp-title">' + esc(c.title) + '</p>' +
        '<p class="dash-tp-dept">' + esc(c.section) + '</p>' +
      '</div>';
    }).join('');
    // 근거: openDashTechTrendDetail — SCR-014로 이동하지 않고, 메인 대시보드 안에서 바로 뜨는 전용 상세 팝업.
    var trendPreview = D.trendsData.slice(0, 8).map(function (t, i) {
      return '<div class="log-row" style="cursor:pointer" data-action="open-dash-trend-detail" data-index="' + i + '">' +
        '<span>' + esc(t.title) + '</span><span style="color:var(--color-text-faint)">' + esc(t.date) + ' &middot; 조회 ' + t.views + '</span>' +
      '</div>';
    }).join('');
    return (
      '<div data-screen-label="MTRM-MAIN 메인 대시보드">' +
        '<div class="section-title" style="margin-bottom:2px">메인 대시보드</div>' +
        '<div class="screen-subtitle">통합 로드맵·생산기술 Tech PR·기술동향을 한 화면에서 확인</div>' +
        renderRoadmapKpiCards(computeRoadmapKpis()) +
        renderMtrmMainGantt(state) +
        '<div class="panel-row">' +
          '<div class="panel" style="flex:1">' +
            '<div class="panel-head-row"><div class="panel-title" style="margin-bottom:0">생산기술 Tech PR</div><a href="#" class="panel-link" data-action="select-screen" data-screen-id="SCR-009">전체보기 &rsaquo;</a></div>' +
            '<div class="card-grid card-grid-3">' + techPrPreview + '</div>' +
          '</div>' +
          '<div class="panel" style="flex:1">' +
            '<div class="panel-head-row"><div class="panel-title" style="margin-bottom:0">최근 기술동향</div><a href="#" class="panel-link" data-action="select-screen" data-screen-id="SCR-014">전체보기 &rsaquo;</a></div>' +
            trendPreview +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-001 / SCR-003 (탭 화면) ----------

  // extraRightHtml: 근거 v3.dc.html 탭 바 우측(ml-auto) 영역 — SCR-003 "최종 동기화: ..." 표시
  function renderTabs(active, extraRightHtml) {
    var partActive = active === 'part' ? ' active' : '';
    var moduleActive = active === 'module' ? ' active' : '';
    return (
      '<div class="tab-bar">' +
        '<div class="tab-item' + partActive + '" data-action="select-screen" data-screen-id="SCR-001">부품 공정</div>' +
        '<div class="tab-item' + moduleActive + '" data-action="select-screen" data-screen-id="SCR-003">모듈 공정</div>' +
        (extraRightHtml ? '<div class="tab-bar-right">' + extraRightHtml + '</div>' : '') +
      '</div>'
    );
  }

  // 자동화율(%)/직접인원(명) 셀 값을 "현재→개선(증감)" 형식으로 표기 (변화 없으면 단일 값만 표기)
  function formatDelta(v, unit) {
    if (v.text != null) return esc(v.text); // 완료일정 등 텍스트형
    if (v.value != null) return esc(v.value + unit);
    var arrowColor = unit === '%' ? 'var(--color-auto-text)' : 'var(--badge-danger-text)';
    var arrowSymbol = unit === '%' ? '&#9650;' : '&#9660;';
    return esc(v.before + unit) + '&rarr;<strong>' + esc(v.after + unit) + '</strong>' +
      '<span style="color:' + arrowColor + ';font-size:11px;margin-left:2px">(' + v.delta + unit + arrowSymbol + ')</span>';
  }

  function renderScr001SummaryTable() {
    // 근거: v3.dc.html [B/P] 창원2C 라인 헤더는 text-blue-900/bg-blue-50 → CSS override로 accent-900/accent-50
    var head = '<th>구분</th>' + D.scr001SummaryCols.map(function (c) {
      return '<th class="al-c"' + (c.bp ? ' style="color:var(--color-accent-900);background:var(--color-accent-50);font-weight:700"' : '') + '>' + esc(c.label) + '</th>';
    }).join('');
    var rows = D.scr001SummaryRows.map(function (row) {
      var cells = D.scr001SummaryCols.map(function (col) {
        return '<td class="al-c"' + (col.bp ? ' style="background:var(--color-accent-50)"' : '') + '>' + formatDelta(row.values[col.id], row.unit) + '</td>';
      }).join('');
      return '<tr><td><strong>' + esc(row.label) + '</strong></td>' + cells + '</tr>';
    }).join('');
    return '<table class="data-table data-table-grid"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html scr001ProcessDetail 셀 종류(k)별 렌더링.
  // video:true인 셀만 클릭 가능(동영상 모달), 나머지 자동/旣자동화 셀은 정적 표시입니다.
  function renderScr001Cell(cell, process) {
    if (!cell || cell.k === 'empty') return '<td></td>';
    switch (cell.k) {
      case 'auto': {
        var attrs = cell.video ? ' style="cursor:pointer" data-action="open-video" data-process="' + esc(process) + '"' : '';
        return '<td class="al-c"' + attrs + '><span style="color:var(--color-auto-text);font-weight:600;white-space:nowrap">' +
          '<span style="color:var(--color-auto-text)">&#9679;</span> ' + esc(cell.t) + '</span>' +
          (cell.video ? ' <span style="color:var(--color-auto-text)">&#9658;</span>' : '') + '</td>';
      }
      case 'manual':
        return '<td class="al-c"><span class="pill-outline">수동</span>' + (cell.n ? ' <span style="color:var(--color-text-faint);font-size:11px">' + esc(cell.n) + '</span>' : '') + '</td>';
      case 'blue':
        // 근거: v3.dc.html "가능('27)" 등은 text-blue-600 → CSS override로 accent-700
        return '<td class="al-c" style="color:var(--color-accent-700);font-weight:600;white-space:nowrap">' + esc(cell.t) + '</td>';
      case 'amber':
        return '<td class="al-c" style="background:var(--badge-warning-bg);color:var(--badge-warning-text);font-weight:600">' + esc(cell.t) + '</td>';
      case 'orange':
        return '<td class="al-c" style="color:var(--color-caution-text);font-weight:600">' + esc(cell.t) + '</td>';
      case 'note':
        return '<td style="color:var(--color-text-muted);font-size:11px">' + esc(cell.t) + '</td>';
      case 'muted':
      default:
        return '<td class="al-c muted">' + esc(cell.t || '-') + '</td>';
    }
  }

  // 근거: 디자인 원본 헤더는 BP 라인만 [현재/개선/주요내용] 3개 하위열로 나뉘고, 나머지 8개 라인열은
  // rowspan=2 단일열입니다. 본문은 rowspan/colspan 없이 매 셀 독립 렌더링됩니다(원본 마크업과 동일).
  function renderScr001ProcessDetailTable() {
    var matrixCols = D.scr001SummaryCols.filter(function (c) { return !c.bp; });
    var head =
      '<tr>' +
        '<th rowspan="2" style="min-width:50px">NO</th><th rowspan="2" style="min-width:150px">공정</th>' +
        '<th class="al-c" colspan="3" style="background:var(--color-accent-50);color:var(--color-accent-900)">[BP]창원2C 라인</th>' +
        matrixCols.map(function (c) { return '<th rowspan="2" class="al-c" style="min-width:110px">' + esc(c.label) + '</th>'; }).join('') +
      '</tr>' +
      '<tr>' +
        '<th class="al-c" style="min-width:90px;background:var(--color-accent-50)">현재</th>' +
        '<th class="al-c" style="min-width:80px;background:var(--color-accent-50)">개선</th>' +
        '<th style="min-width:170px;background:var(--color-accent-50)">주요내용</th>' +
      '</tr>';

    var rowsHtml = D.scr001ProcessDetail.map(function (row) {
      var cellsHtml = row.cells.map(function (cell) { return renderScr001Cell(cell, row.process); }).join('');
      return '<tr>' + td(row.no, 'center') + td('<strong>' + esc(row.process) + '</strong>') + cellsHtml + '</tr>';
    }).join('');

    return '<table class="data-table data-table-grid sticky-head"><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table>';
  }

  function renderSCR001() {
    return (
      '<div data-screen-label="SCR-001 부품 공정 자동화 현황">' +
        renderTabs('part') +
        renderFilterBar(D.scr001Filters, { placeholders: D.scr001FilterPlaceholders, hideLabels: true, noReset: true, searchAction: 'scr001-search' }) +
        '<div class="section-title">요약 현황 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(공장/라인별 자동화율·직접인원 현재&rarr;개선 및 중장기 완료일정)</span></div>' +
        '<div class="panel" style="padding:0;margin-bottom:var(--sp-xl)">' + renderScr001SummaryTable() + '</div>' +
        '<div class="actions-row" style="margin-top:var(--sp-lg)">' +
          '<div class="section-title" style="margin-bottom:0">공정별 상세 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(현재/개선/주요내용 · 공장/라인별 확대전개계획, 현재=자동 선택 시 동영상 팝업)</span></div>' +
          '<div class="actions-group">' +
            '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="registerProcess">+ 공정 등록</button>' +
            '<button type="button" class="btn btn-secondary" data-action="scr001-excel">엑셀</button>' +
            '<button type="button" class="btn btn-secondary" data-action="open-modal" data-modal-id="emailShare">이메일 공유</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel scroll-panel" style="max-height:520px;padding:0">' + renderScr001ProcessDetailTable() + '</div>' +
      '</div>'
    );
  }

  function scr003Value(v) {
    if (v == null || v === '-') return '<span class="muted">-</span>';
    if (v === '미확인') return '<span class="muted" style="font-style:italic">' + esc(v) + '</span>';
    return esc(v);
  }

  // 근거: scr003SummaryCols(7열: Best Practice/국내외종합(계)/조지아 대표차종/울산 차종명/차종명x3)과
  // scr003SummaryRows.cells(동일 순서 7개 값)를 그대로 인덱스 매핑합니다.
  function renderScr003SummaryTable() {
    var head = '<th>구분</th>' + D.scr003SummaryCols.map(function (c) {
      return '<th class="al-c">' + esc(c.label) + '</th>';
    }).join('');

    var rows = D.scr003SummaryRows.map(function (row) {
      var cells = row.cells.map(function (v) { return '<td class="al-c">' + scr003Value(v) + '</td>'; }).join('');
      return '<tr><td style="background:var(--color-bg)"><strong>' + esc(row.label) + '</strong></td>' + cells + '</tr>';
    }).join('');

    return '<table class="data-table data-table-grid"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html scr003ProcessDetail.cells(5열: 조지아/
  // 울산/차종명x3) — 'auto'는 검정 필 버튼("재생아이콘 자동", video:true인 셀만 클릭 가능), 'manual'은 빨간
  // 텍스트("X 수동", 클릭 불가), null은 '-'.
  function renderScr003ExpansionCell(kind, row) {
    switch (kind) {
      case 'auto': {
        var attrs = row.hasVideo ? ' data-action="open-video" data-process="' + esc(row.task) + '" data-kind="module"' : '';
        return '<td class="al-c" style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border)">' +
          '<span' + attrs + ' style="display:inline-flex;align-items:center;gap:4px;background:#000;color:#fff;font-size:10px;font-weight:500;padding:2px 8px;border-radius:4px' + (row.hasVideo ? ';cursor:pointer' : '') + '">' +
          (row.hasVideo ? '<i class="video-play-icon" style="font-size:8px;animation:none;color:#ef4444">&#9658;</i>' : '') + '자동</span></td>';
      }
      case 'manual':
        // 근거: v3.dc.html "X 수동" text-red-600(#dc2626) — README 상태배지(badge-danger)와 별개의 고정 강조색
        return '<td class="al-c" style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border);color:#dc2626;font-weight:600">X 수동</td>';
      default:
        return '<td class="matrix-cell none">-</td>';
    }
  }

  function renderScr003ProcessDetailTable() {
    // 근거: v3.dc.html "Best Practice" 헤더 bg-blue-50/text-blue-900 → CSS override로 accent-50/accent-900
    var head =
      '<tr>' +
        '<th rowspan="2" style="min-width:50px">NO</th><th rowspan="2" style="min-width:200px">작업내용</th>' +
        '<th class="al-c" colspan="2" style="background:var(--color-accent-50);color:var(--color-accent-900)">Best Practice</th>' +
        D.scr003DetailCols.map(function (c) { return '<th rowspan="2" class="al-c" style="min-width:110px">' + esc(c) + '</th>'; }).join('') +
      '</tr>' +
      '<tr>' +
        '<th class="al-c" style="min-width:80px;background:var(--color-accent-50)">기술현황</th><th style="min-width:220px;background:var(--color-accent-50)">상세계획</th>' +
      '</tr>';

    var rowsHtml = D.scr003ProcessDetail.map(function (row) {
      var techSymbol = row.tech === 'auto' ? '&#9679;' : row.tech === 'partial' ? '&#9650;' : 'X';
      var expansionCells = row.cells.map(function (kind) { return renderScr003ExpansionCell(kind, row); }).join('');
      return '<tr>' +
        td(row.no, 'center') +
        '<td style="background:var(--color-bg)"><strong>' + esc(row.task) + '</strong></td>' +
        '<td class="al-c" style="font-weight:600">' + techSymbol + '</td>' +
        '<td class="muted" style="text-align:left">' + esc(row.plan) + '</td>' +
        expansionCells +
      '</tr>';
    }).join('');

    return '<table class="data-table data-table-grid sticky-head"><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table>';
  }

  function renderSCR003() {
    return (
      '<div data-screen-label="SCR-003 모듈 공정 자동화 현황">' +
        renderTabs('module', '최종 동기화: ' + esc(D.scr003LastSync)) +
        renderFilterBar(D.scr003Filters, { placeholders: D.scr003FilterPlaceholders, hideLabels: true, noReset: true }) +
        (D.scr003Warning ? '<div class="warning-banner"><i class="fas fa-exclamation-triangle"></i><span>정합성 검증 실패 항목이 있습니다. 관리자 확인이 필요합니다.</span></div>' : '') +
        '<div class="section-title">요약 현황 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(공장/차종별 자동화율·인원 및 성인화 실적/계획)</span></div>' +
        '<div class="panel" style="padding:0;margin-bottom:var(--sp-xl)">' + renderScr003SummaryTable() + '</div>' +
        '<div class="section-title" style="margin-top:var(--sp-lg)">작업내용별 상세 (NO 1~15) <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(Best Practice 기술현황/상세계획 · 차종별 확대전개계획, 자동 선택 시 상세 팝업)</span></div>' +
        '<div class="panel scroll-panel" style="max-height:520px;padding:0">' + renderScr003ProcessDetailTable() + '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-002 표준공정 마스터 관리 ----------

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html isStdMaster — 필터 5종(공장/라인/
  // 표준공정명 검색/순서 검색/비고 검색, 라벨 없음) + 우측 조회·엑셀 다운로드·표준공정 등록 버튼, 목록은
  // NO(내림차순)/공장/라인/표준공정명/순서/비고(있으면 파란 글씨, 없으면 "-")/관리(수정·삭제), 30건 페이지네이션.
  function renderSCR002(state) {
    var filtered = state.scr002Rows;
    var pageSize = 10;
    var page = state.masterPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var rowIndex = (page - 1) * pageSize + i;
      var no = filtered.length - rowIndex;
      var descCell = r.desc ? '<td style="color:var(--color-primary);font-weight:600">' + esc(r.desc) + '</td>' : td('-', null, 'muted');
      return '<tr>' + td(no, null, 'muted') + td(esc(r.factory)) + td(esc(r.line)) +
        '<td style="font-weight:600;background:var(--color-bg)">' + esc(r.name) + '</td>' +
        td(r.seq, 'right') + descCell +
        td('<button type="button" class="btn-link" data-action="edit-scr002-row" data-index="' + rowIndex + '">수정</button>' +
           '<button type="button" class="btn-link-danger" style="margin-left:8px" data-action="delete-scr002-row" data-index="' + rowIndex + '">삭제</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-002 표준공정 마스터 관리">' +
        '<div class="filter-bar">' +
          '<div class="filter-field"><select aria-label="공장"><option>공장 전체</option><option>A공장</option><option>B공장</option></select></div>' +
          '<div class="filter-field"><select aria-label="라인"><option>라인 전체</option><option>1라인</option><option>2라인</option><option>3라인</option></select></div>' +
          '<div class="filter-field"><input placeholder="표준공정명 검색" /></div>' +
          '<div class="filter-field"><input placeholder="순서" style="width:80px;min-width:0" /></div>' +
          '<div class="filter-field"><input placeholder="비고 검색" /></div>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<button type="button" class="btn btn-excel" data-action="run-search"><i class="fas fa-file-excel" style="margin-right:6px"></i>엑셀 다운로드</button>' +
          '<button type="button" class="btn btn-secondary" data-action="open-scr002-register"><i class="fas fa-plus" style="margin-right:6px;font-size:11px"></i>표준공정 등록</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '공장' }, { label: '라인' }, { label: '표준공정명' }, { label: '순서', align: 'right' }, { label: '비고' }, { label: '관리', align: 'center' },
        ], rows, { grid: true }) +
        renderPagination(filtered.length, page, pageSize, 'masterPage') +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-004 모듈 표준 작업명 관리 ----------

  // 근거: isModuleTask — 필터(공정유형/작업명 검색/등록자/등록일) + 우측 표준 작업명 등록 버튼,
  // 목록 NO(내림차순)/표준 작업명/공정유형/등록자/등록일/관리(수정·삭제), 24건 페이지네이션.
  function renderSCR004(state) {
    var filtered = state.scr004Rows;
    var pageSize = 10;
    var page = state.taskPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var rowIndex = (page - 1) * pageSize + i;
      var no = filtered.length - rowIndex;
      return '<tr>' + td(no, null, 'muted') +
        '<td style="font-weight:600">' + esc(r.name) + '</td>' + td(esc(r.type)) +
        td(esc(r.registeredBy)) +
        td(esc(r.registered), null, 'muted') +
        td('<button type="button" class="btn-link" data-action="edit-scr004-row" data-index="' + rowIndex + '">수정</button> ' +
           '<button type="button" class="btn-link-danger" data-action="delete-scr004-row" data-index="' + rowIndex + '">삭제</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-004 모듈 표준 작업명 관리">' +
        '<div class="filter-bar">' +
          '<div class="filter-field"><select aria-label="공정유형"><option>전체 공정유형</option><option>조립</option><option>배선</option><option>검사</option></select></div>' +
          '<div class="filter-field"><input placeholder="표준 작업명 검색" /></div>' +
          '<div class="filter-field"><input placeholder="등록자" /></div>' +
          '<div class="filter-field"><input type="date" style="cursor:pointer" /></div>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-scr004-register"><i class="fas fa-plus" style="margin-right:6px;font-size:11px"></i>표준 작업명 등록</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '표준 작업명' }, { label: '공정유형' }, { label: '등록자' }, { label: '등록일' }, { label: '관리', align: 'center' },
        ], rows, { pad12: true }) +
        renderPagination(filtered.length, page, pageSize, 'taskPage') +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-005 I/F 실행결과 관리 ----------

  // 근거: isIfResult — 기간(시작~종료)+I/F 유형+결과 필터, 목록 NO(내림차순)/실행시각/I·F-ID/유형/처리건수/
  // 결과(성공=초록·실패=빨강 rounded-full 배지)/실패 원인("-"), 23건 페이지네이션. 실패 행 클릭 팝업은
  // 최종 소스에는 없어 제거(정적 표시만).
  function renderSCR005(state) {
    var filtered = D.scr005Rows;
    var pageSize = 10;
    var page = state.ifPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      var resultKind = r.result === '성공' ? 'success' : 'danger';
      return '<tr>' + td(no, null, 'muted') + td(esc(r.time)) + td(esc(r.ifId)) + td(esc(r.type)) + td(r.count, 'right') +
        td(badge(r.result, resultKind), 'center') +
        td(esc(r.reason || '-'), null, 'muted') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-005 I/F 실행결과 관리">' +
        '<div class="filter-bar">' +
          '<div class="filter-field"><input type="date" aria-label="시작일" /></div>' +
          '<span class="filter-sep">~</span>' +
          '<div class="filter-field"><input type="date" aria-label="종료일" /></div>' +
          '<div class="filter-field"><select aria-label="I/F 유형"><option>전체 I/F 유형</option><option>배치</option><option>배치(재처리)</option><option>실시간</option></select></div>' +
          '<div class="filter-field"><select aria-label="결과"><option>전체 결과</option><option>성공</option><option>실패</option></select></div>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '실행시각' }, { label: 'I/F-ID' }, { label: '유형' }, { label: '처리건수', align: 'right' }, { label: '결과', align: 'center' }, { label: '실패 원인' },
        ], rows, { pad12: true }) +
        renderPagination(filtered.length, page, pageSize, 'ifPage') +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-006 통합 로드맵 ----------

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html isRoadmapOverview/isMainDash — 5개 KPI
  // 카드(등록 로드맵/진행중/계획/반려/보류)는 상단 4px 액센트 보더 + 컬러 점 라벨 + 큰 숫자로 구성되며,
  // SCR-006과 메인 대시보드(MTRM-MAIN)가 동일한 스타일을 공유한다. scr006Rows(14건)로부터 실시간 집계한다.
  var ROADMAP_KPI_DEFS = [
    { label: '등록 로드맵', status: null, color: 'var(--color-text-sub)' },
    { label: '진행중', status: '진행중', color: 'var(--color-primary)' },
    { label: '계획', status: '계획', color: '#D97706' },
    { label: '반려', status: '반려', color: '#DC2626' },
    { label: '보류', status: '보류', color: 'var(--color-text-faint)' },
  ];
  function computeRoadmapKpis() {
    return ROADMAP_KPI_DEFS.map(function (def) {
      var count = def.status ? D.scr006Rows.filter(function (r) { return r.status === def.status; }).length : D.scr006Rows.length;
      return { label: def.label, value: count + '건', color: def.color, status: def.status || '' };
    });
  }
  function renderRoadmapKpiCards(kpis) {
    return '<div class="kpi-grid">' + kpis.map(function (k) {
      return '<div class="kpi-card" style="border-top:4px solid ' + k.color + '" data-action="kpi-go-roadmap" data-status="' + esc(k.status) + '">' +
        '<div style="display:flex;align-items:center;gap:6px;color:var(--color-text-muted);font-weight:500;margin-bottom:8px">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:' + k.color + '"></span><span>' + esc(k.label) + '</span>' +
        '</div>' +
        '<div class="kpi-value">' + esc(k.value) + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  // ---------- SCR-006 mTRM (통합로드맵) — 간트차트 ----------
  // 근거: design-import/README.md "7. mTRM (통합로드맵)", design-import/생기포털 v3.dc.html isRoadmapOverview 블록
  // (분과 레인 간트: roadmap-overview). mock은 js/mock/roadmap-overview.js(RM.lanes 등) 참고.
  var RM = global.PNDES.mock.roadmapOverview;
  var RM_PHASE_CLS = { P1: 'rm-ph-p1', P2: 'rm-ph-p2', P3: 'rm-ph-p3', P4: 'rm-ph-p4' };
  var RM_STATUS_CLS = {
    '완료': 'badge badge-success', '확정': 'badge badge-info', '결재중': 'badge badge-warning',
    '작성중': 'badge badge-neutral', '반려': 'badge badge-danger', '진행중': 'badge badge-info', '계획': 'badge badge-neutral',
  };

  function rmQuarterLabel(n) {
    // n: 1~16 (1-based 분기 인덱스) -> "'25.1Q" 형태
    return "'" + (25 + Math.floor((n - 1) / 4)) + '.' + (((n - 1) % 4) + 1) + 'Q';
  }

  // state.rmVer === 0일 때 prev가 있는 바는 이전 좌표로 교체해서 보여준다(v3.dc.html b0.prev 병합 로직).
  function rmResolveBar(bar, showPrev) {
    if (showPrev && bar.prev) {
      return $.extend({}, bar, bar.prev, { _changed: true });
    }
    return bar;
  }

  function rmMilestoneHtml(label, done) {
    var cls = done ? 'rm-ms rm-ms-done' : 'rm-ms rm-ms-trail';
    return '<span class="' + cls + '" title="' + esc(label) + '"><span class="rm-ms-diamond"></span><span class="rm-ms-label">' + esc(label) + '</span></span>';
  }

  function renderRmLaneBar(bar, laneLabel, laneIdx, barIdx, totalCols, state) {
    var showPrev = state.rmVer === 0;
    var b = rmResolveBar(bar, showPrev);
    var isRoadmap = b.kind === 'roadmap';
    var show = isRoadmap ? (state.rmShowMtrm !== false) : (state.rmShowTask !== false);
    if (!show) return '';

    var nodeId = laneIdx + '-' + barIdx;
    var changedCls = b._changed ? ' rm-bar-changed' : '';
    var barInnerStyle = 'grid-column:' + b.start + ' / span ' + b.span + ';';
    var milestonesHtml = (b.milestones || []).map(function (m) { return rmMilestoneHtml(m, true); }).join('');
    var linkArrowHtml = (bar.linkFrom && isRoadmap) ? '<span class="rm-link-arrow" title="연관 로드맵">&#8627;</span>' : '';

    var barContentStyle, barCls;
    if (isRoadmap) {
      barCls = 'rm-bar rm-bar-roadmap' + changedCls;
      barContentStyle = 'background:#45c4dd';
    } else {
      barCls = 'rm-bar rm-bar-task' + changedCls;
      barContentStyle = 'background:' + esc(b.color || '#22a559');
    }

    var trailHtml = '';
    if (bar.trail) {
      var trailColStart = b.start + b.span;
      var trailMarks = bar.trail.marks.map(function (m) { return rmMilestoneHtml(m, false); }).join('');
      trailHtml = '<div class="rm-trail" style="grid-column:' + trailColStart + ' / span ' + bar.trail.span + '">' +
        '<div class="rm-trail-line"></div>' + trailMarks +
      '</div>';
    }

    var titleAbove = !isRoadmap ? '<p class="rm-bar-title-above">' + esc(b.label) + '</p>' : '';
    var barLabel = isRoadmap ? esc(b.label) : '';
    var hoverAttrs = isRoadmap ? ' data-action="rm-bar-enter" data-lane="' + laneIdx + '" data-bar="' + barIdx + '"' : '';
    var clickAttrs = !isRoadmap ? ' data-action="rm-task-click" data-lane="' + laneIdx + '" data-bar="' + barIdx + '"' : '';

    return (
      '<div class="rm-bar-row" style="grid-template-columns:repeat(' + totalCols + ',minmax(0,1fr))">' +
        '<div class="rm-bar-cell" style="grid-column:' + b.start + ' / span ' + b.span + '"' + hoverAttrs + '>' +
          titleAbove + linkArrowHtml +
          '<div class="rm-bar-line">' +
            milestonesHtml +
            '<div class="' + barCls + '" style="' + barContentStyle + '"' + clickAttrs + ' data-rm-node="' + nodeId + '">' + barLabel + '</div>' +
          '</div>' +
        '</div>' +
        trailHtml +
      '</div>'
    );
  }

  function renderRmLane(lane, laneIdx, totalCols, state) {
    var barsHtml = lane.bars.map(function (bar, barIdx) {
      return renderRmLaneBar(bar, lane.label, laneIdx, barIdx, totalCols, state);
    }).join('');
    return (
      '<div class="rm-lane">' +
        '<div class="rm-lane-label">' + esc(lane.label) + '</div>' +
        '<div class="rm-lane-track" style="grid-template-columns:repeat(' + totalCols + ',minmax(0,1fr))">' +
          '<div class="rm-lane-gridlines" style="grid-template-columns:repeat(' + totalCols + ',minmax(0,1fr))">' +
            Array.apply(null, { length: totalCols }).map(function (_, i) {
              return '<div class="rm-gridline' + ((i + 1) % 4 === 0 ? ' rm-gridline-year' : '') + '"></div>';
            }).join('') +
          '</div>' +
          '<div class="rm-lane-bars">' + barsHtml + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 근거: v3.dc.html rmTodayStyle — 오늘(2026-10-12)이 16분기(4년) 축에서 차지하는 비율로 좌측 위치 계산.
  // '25.1Q 시작(분기 인덱스 1) 기준, 2026-10은 7번째 분기(26.4Q) 중간 지점.
  function rmTodayPercent() {
    var todayQuarterIndex = 6.6; // 26.4Q 진행률(10월 중순) — v3 고정값(0.6640625)과 동일한 산출 근거
    return (todayQuarterIndex / 16) * 100;
  }

  // 근거: v3.dc.html rmPanelVals() — 로드맵 바 hover 시 연계과제 요약 카드(연계과제 N건, P1~P4 분포, 과제 리스트)
  function renderRmHoverPanel(state) {
    var h = state.rmHover;
    if (!h) return '';
    var lane = RM.lanes[h.li];
    var bar = lane && lane.bars[h.bi];
    if (!bar) return '';
    var showPrev = state.rmVer === 0;
    var b = rmResolveBar(bar, showPrev);
    var tasks = bar.tasks || [];
    var phases = ['P1', 'P2', 'P3', 'P4'].map(function (p) {
      var count = tasks.filter(function (t) { return t[1] === p; }).length;
      return '<span class="rm-tip-phase ' + RM_PHASE_CLS[p] + '">' + p + ' ' + count + '</span>';
    }).join('');
    var taskRows = tasks.map(function (t, i) {
      var name = t[0], phase = t[1], status = t[2], s0 = t[3], sp = t[4], who = t[5];
      var left = Math.max(0, (s0 - b.start) / b.span);
      var w = Math.min(1 - left, sp / b.span);
      var statusCls = RM_STATUS_CLS[status] || 'badge badge-neutral';
      return '<button type="button" class="rm-tip-task" data-action="rm-tip-task-click" data-lane="' + h.li + '" data-bar="' + h.bi + '" data-task="' + i + '">' +
        '<span class="rm-tip-task-phase ' + RM_PHASE_CLS[phase] + '">' + esc(phase) + '</span>' +
        '<span class="rm-tip-task-name"><span class="rm-tip-task-name-main">' + esc(name) + '</span><span class="rm-tip-task-name-sub">' + esc(who) + ' · ' + rmQuarterLabel(s0) + '~' + rmQuarterLabel(s0 + sp - 1) + '</span></span>' +
        '<span class="rm-tip-task-bar"><span style="margin-left:' + (left * 100) + '%;width:' + (w * 100) + '%"></span></span>' +
        '<span class="rm-tip-task-status"><span class="' + statusCls + '">' + esc(status) + '</span></span>' +
      '</button>';
    }).join('');
    var statusCls = RM_STATUS_CLS[bar.status] || 'badge badge-neutral';

    return (
      '<div class="rm-hover-panel" style="' + h.style + '">' +
        '<div class="rm-hover-head">' +
          '<div><p class="rm-hover-meta">' + esc(lane.label) + ' · ' + rmQuarterLabel(b.start) + '~' + rmQuarterLabel(b.start + b.span - 1) + '</p>' +
          '<p class="rm-hover-title">' + esc(bar.label) + '</p></div>' +
          '<span class="' + statusCls + '">' + esc(bar.status || '-') + '</span>' +
        '</div>' +
        '<div class="rm-hover-info">' +
          '<p><span class="rm-hover-info-label">연계 mTRM</span><span class="rm-hover-info-value">' + esc(bar.mtrm || '-') + '</span></p>' +
          '<p><span class="rm-hover-info-label">담당</span><span class="rm-hover-info-value">' + esc(bar.owner || '-') + '</span></p>' +
        '</div>' +
        '<div class="rm-hover-count-row"><p>연계과제 <span class="rm-hover-count">' + tasks.length + '</span>건</p><div class="rm-tip-phases">' + phases + '</div></div>' +
        '<div class="rm-hover-task-header"><span>단계</span><span>과제명 · 담당</span><span>기간 (로드맵 대비)</span><span>상태</span></div>' +
        '<div class="rm-hover-task-list">' + taskRows + '</div>' +
        '<div class="rm-hover-footer">과제 선택 시 상세 과제 팝업이 열립니다.</div>' +
      '</div>'
    );
  }

  // 근거: v3.dc.html subTaskDetail 모달 — README는 상세정보 테이블 + "현재 변경 이력" 테이블만 명시(미디어/첨부파일은 범위 밖)
  function renderRmTaskDetailModal(state) {
    var d = state.subTaskDetail || {};
    var changeRows = RM.taskChangeRows.map(function (r) {
      var changed = r.before !== r.after;
      return '<tr class="' + (changed ? 'rm-change-row-changed' : '') + '">' +
        '<td class="rm-change-label">' + esc(r.label) + '</td>' +
        '<td class="rm-change-before">' + esc(r.before) + '</td>' +
        '<td class="' + (changed ? 'rm-change-after-changed' : 'rm-change-after') + '">' + esc(r.after) + '</td>' +
        '<td class="rm-change-date">' + esc(r.date) + '</td>' +
      '</tr>';
    }).join('');

    return (
      '<div class="rm-modal-overlay" data-action="rm-close-task-detail">' +
        '<div class="rm-modal-box" data-action="rm-modal-stop">' +
          '<div class="rm-modal-header-dark"><h3>상세 과제</h3></div>' +
          '<div class="rm-modal-topbar"><button type="button" class="btn-dark" data-action="rm-close-task-detail">닫기</button></div>' +
          '<div class="rm-modal-body">' +
            '<table class="rm-info-table"><tbody>' +
              '<tr><th>과제명(번호)</th><td>' + esc(d.name || '') + '</td><th>등록일</th><td>' + esc(d.reg || 'Data') + '</td></tr>' +
              '<tr><th>분과</th><td>' + esc(d.dept || 'Data') + '</td><th>mTRM</th><td>' + esc(d.mtrm || 'Data') + '</td></tr>' +
              '<tr><th>담당자</th><td>' + esc(d.owner || '자동화기술팀 / 김의왕 매니저') + '</td><th>현재 상태</th><td>' + esc(d.status || '') + '</td></tr>' +
              '<tr><th>일정(P1~P4)</th><td colspan="3">' + esc(d.period || '') + '</td></tr>' +
            '</tbody></table>' +
            '<div class="rm-change-section">' +
              '<div class="rm-change-title">현재 변경 이력</div>' +
              '<table class="rm-change-table"><thead><tr><th>항목</th><th>변경전</th><th>변경후</th><th>변경일</th></tr></thead>' +
              '<tbody>' + changeRows + '</tbody></table>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 근거: v3.dc.html rmVerModal — 버전 전환/비교 시 변경 항목 목록(이전 vs 현재 막대 비교)
  function renderRmVerModal(state) {
    var m = state.rmVerModal;
    var from = m.from, to = m.to;
    var rows = [];
    RM.lanes.forEach(function (lane) {
      lane.bars.forEach(function (bb) {
        if (!bb.prev) return;
        var o = { start: bb.prev.start != null ? bb.prev.start : bb.start, span: bb.prev.span != null ? bb.prev.span : bb.span };
        var c = { start: bb.start, span: bb.span };
        var ds = c.start - o.start, dl = c.span - o.span;
        var tags = [];
        if (ds) tags.push({ label: '시작 ' + (ds > 0 ? '+' : '') + ds + '분기', cls: 'rm-vm-tag rm-vm-tag-shift' });
        if (dl) tags.push({ label: '기간 ' + (dl > 0 ? '+' : '') + dl + '분기', cls: 'rm-vm-tag ' + (dl > 0 ? 'rm-vm-tag-longer' : 'rm-vm-tag-shorter') });
        var color = bb.kind === 'roadmap' ? '#45c4dd' : (bb.color || '#22a559');
        rows.push({
          lane: lane.label, name: bb.label, kind: bb.kind === 'roadmap' ? 'mTRM 로드맵' : '상세과제',
          kindCls: bb.kind === 'roadmap' ? 'rm-vm-kind rm-vm-kind-roadmap' : 'rm-vm-kind rm-vm-kind-task',
          before: rmQuarterLabel(o.start) + ' ~ ' + rmQuarterLabel(o.start + o.span - 1),
          after: rmQuarterLabel(c.start) + ' ~ ' + rmQuarterLabel(c.start + c.span - 1),
          oldPct: { ml: ((o.start - 1) / 16) * 100, w: (o.span / 16) * 100 },
          newPct: { ml: ((c.start - 1) / 16) * 100, w: (c.span / 16) * 100 },
          color: color, tags: tags,
        });
      });
    });
    var shiftCount = rows.filter(function (r) { return r.tags.some(function (t) { return t.label.indexOf('시작') === 0; }); }).length;
    var lenCount = rows.filter(function (r) { return r.tags.some(function (t) { return t.label.indexOf('기간') === 0; }); }).length;
    var toPrev = to === 0;
    var title = m.viewOnly ? '버전 변경 내용' : ('버전 변경 · Ver. ' + from + ' → Ver. ' + to);
    var hasConfirm = !m.viewOnly && from !== to;
    var confirmLabel = toPrev ? 'Ver. 0 보기' : '현재 버전 보기';

    var rowsHtml = rows.map(function (r) {
      var tagsHtml = r.tags.map(function (t) { return '<span class="' + t.cls + '">' + esc(t.label) + '</span>'; }).join('');
      return '<div class="rm-vm-row">' +
        '<div class="rm-vm-row-meta">' +
          '<div class="rm-vm-row-head"><span class="' + r.kindCls + '">' + esc(r.kind) + '</span><span class="rm-vm-row-lane">' + esc(r.lane) + '</span></div>' +
          '<p class="rm-vm-row-name">' + esc(r.name) + '</p>' +
          '<div class="rm-vm-row-tags">' + tagsHtml + '</div>' +
        '</div>' +
        '<div class="rm-vm-row-bars">' +
          '<div class="rm-vm-bar-line"><span class="rm-vm-bar-label">이전</span><div class="rm-vm-bar-track"><div class="rm-vm-bar rm-vm-bar-old" style="margin-left:' + r.oldPct.ml + '%;width:' + r.oldPct.w + '%;border-color:' + r.color + '"></div></div><span class="rm-vm-bar-value">' + esc(r.before) + '</span></div>' +
          '<div class="rm-vm-bar-line"><span class="rm-vm-bar-label rm-vm-bar-label-current">현재</span><div class="rm-vm-bar-track"><div class="rm-vm-bar rm-vm-bar-new" style="margin-left:' + r.newPct.ml + '%;width:' + r.newPct.w + '%;background:' + r.color + '"></div></div><span class="rm-vm-bar-value rm-vm-bar-value-current">' + esc(r.after) + '</span></div>' +
        '</div>' +
      '</div>';
    }).join('');

    var yearHeaders = RM.years.map(function (y) { return '<span>' + esc(y) + '</span>'; }).join('');

    return (
      '<div class="rm-modal-overlay" data-action="rm-close-ver-modal">' +
        '<div class="rm-vm-box" data-action="rm-modal-stop">' +
          '<div class="rm-modal-header-navy"><h3>' + esc(title) + '</h3><button type="button" class="rm-modal-close" data-action="rm-close-ver-modal"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-vm-body">' +
            '<div class="rm-vm-compare">' +
              '<div class="rm-vm-compare-box"><p class="rm-vm-compare-label">이전 버전</p><p class="rm-vm-compare-value">Ver. 0 · 2021-07-02</p></div>' +
              '<i class="fas fa-arrow-right"></i>' +
              '<div class="rm-vm-compare-box rm-vm-compare-box-current"><p class="rm-vm-compare-label">현재 버전</p><p class="rm-vm-compare-value">Ver. 1 · 2021-10-19 (현재)</p></div>' +
            '</div>' +
            '<div class="rm-vm-stats">' +
              '<div><p>변경 항목</p><p class="rm-vm-stat-value">' + rows.length + '<span>건</span></p></div>' +
              '<div><p>시작 시점 이동</p><p class="rm-vm-stat-value rm-vm-stat-blue">' + shiftCount + '<span>건</span></p></div>' +
              '<div><p>기간 변경</p><p class="rm-vm-stat-value rm-vm-stat-amber">' + lenCount + '<span>건</span></p></div>' +
            '</div>' +
            '<div class="rm-vm-table">' +
              '<div class="rm-vm-table-head"><span>항목</span><div class="rm-vm-table-years">' + yearHeaders + '</div></div>' +
              '<div class="rm-vm-table-body">' + rowsHtml + '</div>' +
            '</div>' +
            '<p class="rm-vm-note">점선 막대 = 이전 버전 일정 · 실선 막대 = 현재 버전 일정</p>' +
          '</div>' +
          '<div class="rm-modal-footer">' +
            (hasConfirm ? '<button type="button" class="btn-navy" data-action="rm-vm-confirm" data-to="' + to + '">' + esc(confirmLabel) + '</button>' : '') +
            '<button type="button" class="btn-outline-sm" data-action="rm-close-ver-modal">닫기</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 근거: v3.dc.html measureRmLinks() — linkFromNode가 있는 바에서 출발 바(from)로 이어지는 SVG 꺾은선+화살촉.
  // state.rmLinks는 app.js가 실제 DOM(getBoundingClientRect)을 측정해 채워 넣는다(렌더 시점엔 좌표를 알 수 없으므로
  // 렌더 후 app.js의 measure 루틴이 다시 setState로 채워 재렌더되는 2-pass 구조).
  function renderRmLinksSvg(state) {
    var links = state.rmLinks || [];
    var pathsHtml = links.map(function (lk) {
      return '<g><path d="' + lk.d + '" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 3"></path>' +
        '<path d="' + lk.head + '" fill="#475569"></path></g>';
    }).join('');
    return '<svg class="rm-links-svg">' + pathsHtml + '</svg>';
  }

  function renderSCR006(state) {
    var scale = state.rmScale || 'quarter';
    var totalCols = scale === 'month' ? 48 : 16;
    var ver = state.rmVer === 0 ? 0 : 1;
    var isPrevVer = ver === 0;
    var diffCount = RM.lanes.reduce(function (a, l) { return a + l.bars.filter(function (b) { return b.prev; }).length; }, 0);

    // 축 헤더: 연도(4등분) + 분기/월 서브헤더
    var yearHeader = RM.years.map(function (y) {
      return '<div class="rm-year-cell">' + esc(y) + '</div>';
    }).join('');
    var subCells = Array.apply(null, { length: totalCols }).map(function (_, i) {
      var yearEnd = scale === 'month' ? (i % 12 === 11) : (i % 4 === 3);
      var label = scale === 'month' ? String((i % 12) + 1) : ((i % 4) + 1) + 'Q';
      return '<div class="rm-sub-cell' + (yearEnd ? ' rm-sub-cell-yearend' : '') + '">' + label + '</div>';
    }).join('');

    var lanesHtml = RM.lanes.map(function (lane, li) { return renderRmLane(lane, li, totalCols, state); }).join('');

    var scaleTabs = [['quarter', '분기'], ['month', '월']].map(function (t) {
      return '<button type="button" class="rm-scale-tab' + (scale === t[0] ? ' active' : '') + '" data-action="rm-set-scale" data-scale="' + t[0] + '">' + t[1] + '</button>';
    }).join('');

    var verBanner = isPrevVer
      ? '<div class="rm-ver-banner">' +
          '<p><i class="fas fa-clock-rotate-left"></i> <strong>이전 버전(Ver. 0) mTRM 표시 중</strong> · 현재 버전 대비 변경 <strong>' + diffCount + '</strong>건 (점선 테두리로 표시)</p>' +
          '<div class="rm-ver-banner-actions">' +
            '<button type="button" class="btn-outline-sm" data-action="rm-open-diff">변경 내용</button>' +
            '<button type="button" class="btn-outline-sm" data-action="rm-back-current">현재 버전 보기</button>' +
          '</div>' +
        '</div>'
      : '';

    var detailPanel = state.rmDetailOpen
      ? '<div class="rm-detail-row">' +
          '<div class="filter-field"><label>적용공장</label><select><option>전체</option><option>울산 전동화공장</option><option>창원 2공장</option><option>의왕 교육용1공장</option></select></div>' +
          '<div class="filter-field"><label>담당팀</label><select><option>전체</option><option>자동화기술팀</option><option>요소기술팀</option><option>지능화기술팀</option></select></div>' +
          '<div class="filter-field"><label>버전</label><select data-action="rm-set-ver-direct"><option value="1"' + (ver === 1 ? ' selected' : '') + '>Ver. 1 (현재)</option><option value="0"' + (ver === 0 ? ' selected' : '') + '>Ver. 0</option></select></div>' +
        '</div>'
      : '';

    var phaseGuideHtml = RM.phaseGuide.map(function (pg) {
      return '<div class="rm-phase-guide-item">' +
        '<span class="rm-ms rm-ms-done rm-ms-lg"><span class="rm-ms-diamond"></span><span class="rm-ms-label">' + esc(pg.p) + '</span></span>' +
        '<p><strong>' + esc(pg.title) + '</strong><br><span>' + esc(pg.desc) + '</span></p>' +
      '</div>';
    }).join('');

    var hoverPanel = renderRmHoverPanel(state);
    var taskModal = state.subTaskDetail ? renderRmTaskDetailModal(state) : '';
    var verModal = state.rmVerModal ? renderRmVerModal(state) : '';

    return (
      '<div data-screen-label="SCR-006 mTRM (통합로드맵)">' +
        '<div class="rm-head">' +
          '<div><div class="section-title" style="margin-bottom:2px">통합 로드맵</div>' +
          '<div class="screen-subtitle" style="margin-bottom:0">분과별 중장기 자동화 로드맵 · mTRM/기술과제 매핑 간트</div></div>' +
          '<div class="rm-head-badges">' +
            '<span class="rm-pill"><span class="rm-pill-label">업데이트일자</span><span class="rm-pill-value">2021-10-19 15:30:25</span></span>' +
            '<span class="rm-pill"><span class="rm-pill-label">버전</span><select class="rm-pill-select" data-action="rm-set-ver"><option value="1"' + (ver === 1 ? ' selected' : '') + '>Ver. 1 (현재)</option><option value="0"' + (ver === 0 ? ' selected' : '') + '>Ver. 0 (2021-07-02)</option></select></span>' +
          '</div>' +
        '</div>' +
        verBanner +
        '<section class="rm-filter-bar">' +
          '<div class="filter-field"><label>분과</label><select><option>전체</option><option>물류</option><option>차체</option><option>지게차</option></select></div>' +
          '<div class="filter-field"><label>진행상태</label><select data-action="rm-filter-status"><option value="">전체</option>' + ['진행중', '계획', '반려', '보류'].map(function (st) { return '<option' + (state.rmFilterStatus === st ? ' selected' : '') + '>' + st + '</option>'; }).join('') + '</select></div>' +
          '<div class="filter-field"><label>기간</label><div class="rm-date-range"><input type="date" /><span>-</span><input type="date" /></div></div>' +
          '<label class="rm-checkbox"><input type="checkbox" data-action="rm-toggle-mtrm"' + (state.rmShowMtrm !== false ? ' checked' : '') + ' />mTRM</label>' +
          '<label class="rm-checkbox"><input type="checkbox" data-action="rm-toggle-task"' + (state.rmShowTask !== false ? ' checked' : '') + ' />기술과제</label>' +
          '<div class="rm-filter-right">' +
            '<button type="button" class="rm-detail-toggle' + (state.rmDetailOpen ? ' active' : '') + '" data-action="rm-toggle-detail"><i class="fas fa-sliders"></i>상세조회</button>' +
            '<button type="button" class="btn-dark" data-action="run-search"><i class="fas fa-search"></i>조회</button>' +
          '</div>' +
          detailPanel +
        '</section>' +

        '<div class="rm-legend-row">' +
          '<div class="rm-legend">' +
            '<span class="rm-legend-item"><span class="rm-legend-swatch" style="background:#45c4dd;border-radius:999px;height:10px"></span>mTRM 로드맵</span>' +
            '<span class="rm-legend-item"><span class="rm-legend-swatch" style="background:#22a559;border-radius:999px;height:6px"></span>상세과제 · 완료보고 등록(완료)</span>' +
            '<span class="rm-legend-item"><span class="rm-legend-swatch" style="background:#e8a33d;border-radius:999px;height:6px"></span>상세과제 · 계획대비 미완료</span>' +
            '<span class="rm-legend-item"><span class="rm-ms rm-ms-done rm-ms-sm"><span class="rm-ms-diamond"></span></span>완료 단계</span>' +
            '<span class="rm-legend-item"><span class="rm-ms rm-ms-trail rm-ms-sm"><span class="rm-ms-diamond"></span></span>예정 단계</span>' +
            '<span class="rm-legend-item"><span class="rm-legend-today-line"></span>오늘</span>' +
          '</div>' +
          '<div class="rm-scale-tabs">' + scaleTabs + '</div>' +
        '</div>' +

        '<section class="rm-gantt-panel">' +
          '<div class="rm-gantt-scroll">' +
            '<div class="rm-gantt-inner" style="min-width:900px">' +
              '<div class="rm-axis-row">' +
                '<div class="rm-axis-spacer"></div>' +
                '<div class="rm-axis-years" style="grid-template-columns:repeat(4,1fr)">' + yearHeader + '</div>' +
              '</div>' +
              '<div class="rm-axis-row rm-axis-sub">' +
                '<div class="rm-axis-spacer"></div>' +
                '<div class="rm-axis-sub-cells" style="grid-template-columns:repeat(' + totalCols + ',minmax(0,1fr))">' + subCells + '</div>' +
              '</div>' +
              '<div class="rm-gantt-body" data-rm-gantt="1">' +
                '<div class="rm-today-line" style="left:calc(140px + (100% - 140px) * ' + (rmTodayPercent() / 100) + ')"></div>' +
                renderRmLinksSvg(state) +
                lanesHtml +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>' +

        '<section class="rm-phase-guide">' +
          '<p class="rm-phase-guide-title">과제 진행 단계</p>' +
          '<div class="rm-phase-guide-grid">' + phaseGuideHtml + '</div>' +
        '</section>' +

        hoverPanel + taskModal + verModal +
      '</div>'
    );
  }

  // ---------- SCR-007 상세과제 로드맵 관리 ----------

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html isRoadmapMgmt — 통합 로드맵별 세그먼트
  // 탭이 아니라 "통합 로드맵/담당자/기간/진행상태" 드롭다운으로 필터링하는 단일 목록(16건, 10건 단위 페이지네이션).
  // v3.dc.html과 동일하게 통합 로드맵/진행상태 필터는 선택 즉시 목록에 반영된다(담당자/기간 셀렉트는 원본도 옵션 없음).
  function renderSCR007(state) {
    var all = state.taskRoadmapList;
    var f = state.taskRoadmapFilter || { roadmap: '', status: '' };
    var filtered = all.filter(function (r) {
      return (!f.roadmap || r.roadmap === f.roadmap) && (!f.status || r.status === f.status);
    });
    var pageSize = 10;
    var page = state.taskRoadmapPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var body = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      return '<tr>' + td(no, null, 'muted') + td('<strong>' + esc(r.name) + '</strong>') + td(esc(r.owner)) + td(esc(r.period), null, 'muted') +
        td(badge(r.status, CHART_SUBTASK_STATUS_KIND[r.status] || 'neutral')) +
        td('<button type="button" class="btn-gray-sm" data-action="edit-scr007-row" data-index="' + all.indexOf(r) + '">수정</button>', 'right') +
      '</tr>';
    }).join('');
    var roadmapFilterOptions = D.taskRoadmapFilterRoadmaps.map(function (r) {
      return '<option value="' + esc(r) + '"' + (f.roadmap === r ? ' selected' : '') + '>통합 로드맵: ' + esc(r) + '</option>';
    }).join('');
    if (f.roadmap && D.taskRoadmapFilterRoadmaps.indexOf(f.roadmap) === -1) {
      roadmapFilterOptions += '<option value="' + esc(f.roadmap) + '" selected>통합 로드맵: ' + esc(f.roadmap) + '</option>';
    }
    var statusFilterOptions = ['진행중', '계획'].map(function (s) {
      return '<option value="' + s + '"' + (f.status === s ? ' selected' : '') + '>' + s + '</option>';
    }).join('');

    return (
      '<div data-screen-label="SCR-007 상세과제 로드맵 관리">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--sp-md)">' +
          '<div><div class="section-title" style="margin-bottom:2px">상세과제 로드맵 관리</div>' +
          '<div class="screen-subtitle" style="margin-bottom:0">통합 로드맵에 속한 세부 과제의 담당자·기간·진행상태 관리</div></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-scr007-register"><i class="fas fa-plus" style="margin-right:6px;font-size:11px"></i>상세과제 등록</button>' +
        '</div>' +
        '<div class="filter-bar" style="align-items:center">' +
          '<div class="filter-field"><select aria-label="통합 로드맵" data-action="scr007-filter" data-key="roadmap" style="min-width:170px"><option value="">통합 로드맵: 전체</option>' + roadmapFilterOptions + '</select></div>' +
          '<div class="filter-field"><select aria-label="담당자"><option>담당자: 전체</option></select></div>' +
          '<div class="filter-field"><select aria-label="기간"><option>기간: 전체</option></select></div>' +
          '<div class="filter-field"><select aria-label="진행상태" data-action="scr007-filter" data-key="status"><option value="">진행상태: 전체</option>' + statusFilterOptions + '</select></div>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="scr007-search">조회</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '과제명' }, { label: '담당자' }, { label: '기간' }, { label: '진행상태' }, { label: '관리', align: 'right' },
        ], body, { pad12: true }) +
        renderPagination(filtered.length, page, pageSize, 'taskRoadmapPage') +
        '</div>' +
      '</div>'
    );
  }

  // 근거: periodToSpan(period) — "YYYY.MM~YYYY.MM" 문자열을 D.chartQuarters(26.Q1~28.Q4, 12개) 기준
  // 1-based grid-column-start/span으로 변환합니다.
  function periodToChartSpan(period) {
    var parts = period.split('~');
    var qIndex = function (ym) {
      var y = parseInt(ym.slice(0, 4), 10);
      var m = parseInt(ym.slice(5, 7), 10);
      var q = Math.floor((m - 1) / 3) + 1;
      return D.chartQuarters.indexOf((y - 2000) + '.Q' + q);
    };
    var startIdx = qIndex(parts[0]), endIdx = qIndex(parts[1]);
    if (startIdx < 0) startIdx = 0;
    if (endIdx < 0) endIdx = D.chartQuarters.length - 1;
    return { colStart: startIdx + 1, colSpan: Math.max(1, endIdx - startIdx + 1) };
  }

  var CHART_SUBTASK_STATUS_KIND = { 진행중: 'info', 계획: 'warning', 반려: 'danger', 보류: 'neutral' };

  // ---------- SCR-009 생산기술 Tech PR ----------
  // 근거: 자료 유형(동영상/파일/텍스트/복합자료)별로 썸네일이 다르고, 카드 클릭 시 공용 모달 시스템과는
  // 별도인 커스텀 상세 오버레이(techPrDetailIndex state)가 열립니다 (MTRM-MAIN 미리보기도 동일 로직 재사용).
  var TECH_PR_TYPE = global.PNDES.TECH_PR_TYPE;

  function techPrThumb(c, big) {
    var playSize = big ? '44px' : '34px';
    var iconSize = big ? '34' : '26';
    // 근거: 디자인 원본은 자료 유형(동영상/파일/텍스트/복합자료) 모두 aspect-square(1:1)
    if (c.type === 'video') {
      return '<div class="media-thumb" style="aspect-ratio:1/1"><div class="play-btn" style="width:' + playSize + ';height:' + playSize + '">&#9658;</div></div>';
    }
    if (c.type === 'file') {
      return '<div class="media-thumb media-thumb-file" style="aspect-ratio:1/1">' +
        '<svg width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="1.6"><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"></path><path d="M15 3v5h5"></path></svg>' +
        (big ? '<span class="media-thumb-filename">' + esc(c.fileName) + '</span>' : '') +
      '</div>';
    }
    if (c.type === 'text') {
      return '<div class="media-thumb media-thumb-text" style="aspect-ratio:1/1"><div class="media-thumb-text-body">' + esc(c.body) + '</div></div>';
    }
    // multi
    var count = c.items ? c.items.length : 0;
    return '<div class="media-thumb media-thumb-multi" style="aspect-ratio:1/1">' +
      '<div class="multi-icon-row">' +
        '<span class="multi-icon multi-icon-video">&#9658;</span>' +
        '<span class="multi-icon multi-icon-file">&#128196;</span>' +
        '<span class="multi-icon multi-icon-text">&#8801;</span>' +
      '</div>' +
      '<span class="multi-count">자료 ' + count + '건 등록</span>' +
    '</div>';
  }

  // 근거: design-import/README.md "10. 생산기술 Tech PR", v3.dc.html isTechPr — 분과 제목 > 적용공장 패널 > 5열 카드.
  // 필터(분과/적용공장)는 "조회" 클릭 시 적용된다(state.techPrApplied). BU·기술태그는 mock에 구분값이 없어 선택만 유지.
  // 카드 클릭 = Tech PR 상세 팝업, "연관과제" 배지 클릭 = 상세과제 팝업(카드 클릭과 분리).
  var TP = global.PNDES.mock.scr009;

  function renderTechPrFilterSelect(label, key, state) {
    var cur = (state.techPrFilter || {})[key] || '전체';
    return '<div class="filter-field"><label>' + esc(label) + '</label><select data-action="techpr-filter" data-key="' + key + '">' +
      TP.filterOptions[key].map(function (o) { return '<option' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
    '</select></div>';
  }

  function renderTechPrListCard(c, gi, fi, ci, facName) {
    var detailIndex = (gi + fi + ci) % TP.detailItems.length;
    var badges = c.badges.map(function (bd) {
      return bd === '연관과제'
        ? '<span class="tp-badge tp-badge-task" data-action="techpr-related-task" data-title="' + esc(c.title) + '" data-factory="' + esc(facName) + '">' + esc(bd) + '</span>'
        : '<span class="tp-badge">' + esc(bd) + '</span>';
    }).join('');
    var tags = TP.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    return '<div class="tp-card" data-action="open-techpr-detail" data-index="' + detailIndex + '"' +
      ' data-gi="' + gi + '" data-fi="' + fi + '" data-ci="' + ci + '">' +
      '<div class="tp-card-thumb">' + (c.kind === 'video' ? '<span class="tp-card-play"><i class="fas fa-play"></i></span>' : '') + '</div>' +
      '<div class="tp-card-bar">' +
        '<div class="tp-card-dots"><span class="is-active"></span><span></span><span></span></div>' +
        '<div class="tp-card-badges">' + badges + '</div>' +
      '</div>' +
      '<div class="tp-card-body">' +
        '<p>&middot; ' + esc(c.title) + '</p><p>&middot; ' + esc(c.place) + '</p><p>&middot; ' + esc(c.period) + '</p>' +
        '<div class="tp-card-tags">' + tags + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderSCR009(state) {
    var applied = state.techPrApplied || {};
    var div = applied.div && applied.div !== '전체' ? applied.div : '';
    var factory = applied.factory && applied.factory !== '전체' ? applied.factory : '';

    var groupsHtml = TP.groups.map(function (g, gi) {
      if (div && g.category !== div) return '';
      var facsHtml = g.factories.map(function (f, fi) {
        if (factory && f.name !== factory) return '';
        var cards = f.cards.map(function (c, ci) { return renderTechPrListCard(c, gi, fi, ci, f.name); }).join('');
        return '<div class="tp-panel">' +
          '<div class="tp-panel-head"><i class="fas fa-caret-down"></i>' + esc(f.name) + '<span>(' + f.cards.length + ')</span></div>' +
          '<div class="tp-panel-grid">' + cards + '</div>' +
        '</div>';
      }).join('');
      if (!facsHtml) return '';
      return '<section class="tp-group"><h3><i class="fas fa-th-large"></i>' + esc(g.category) + '</h3>' + facsHtml + '</section>';
    }).join('');
    if (!groupsHtml) groupsHtml = '<div class="panel empty-row-cell">조회 조건에 해당하는 Tech PR 자료가 없습니다.</div>';

    return (
      '<div data-screen-label="SCR-009 생산기술 Tech PR">' +
        '<div class="tp-top"><button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="techPrInquiry">기술 문의/제안</button></div>' +
        '<section class="filter-bar tp-filter">' +
          renderTechPrFilterSelect('분과', 'div', state) +
          renderTechPrFilterSelect('BU', 'bu', state) +
          renderTechPrFilterSelect('적용공장', 'factory', state) +
          renderTechPrFilterSelect('기술태그', 'tag', state) +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-secondary" data-action="techpr-search"><i class="fas fa-search" style="margin-right:6px;font-size:11px"></i>조회</button>' +
        '</section>' +
        '<div class="tp-hierarchy">분과 &gt; BU &gt; 적용공장 &gt; 기술태그</div>' +
        groupsHtml +
        (state.subTaskDetail ? renderRmTaskDetailModal(state) : '') +
      '</div>'
    );
  }

  // SCR-009 카드 클릭 시 열리는 커스텀 상세 오버레이 (공용 activeModal 모달 시스템과 별도)
  // v3 기준 재구현: 기존 type(video/file/text/multi)별 본문 대신,
  // 클릭한 카드의 배지/제목/태그 + 3장 슬라이드(점·좌우 화살표) + 적용처/개발기간/첨부 메타를 표시한다.
  // 근거: design-import/생기포털 v3.dc.html techPrDetailOpen 블록 및 tpd* 바인딩(tpdBadges/tpdTitle/tpdTags/tpdDots/tpdPlace/tpdPeriod/tpdFile/tpdIsVideo).
  var TPD_KINDS = ['video', 'image', 'image']; // 슬라이드 3장의 종류(0번만 동영상) — v3 kinds 배열과 동일
  var TPD_FILE = '[2026년 2분기] 제조 신기술 동향.pdf';

  function renderTechPrDetailOverlay(index, state) {
    var card = null;
    var co = (state || {}).techPrDetailCard;
    if (co) {
      var g = TP.groups[co.gi];
      var f = g && g.factories[co.fi];
      card = f && f.cards[co.ci];
    }
    if (!card) card = TP.detailItems[index]; // 좌표가 없는 경로(초기 ?modal= 진입 등) 폴백
    if (!card) return '';
    var idx = (state || {}).tpdIdx || 0;
    var badges = (card.badges || ['동영상', '기술자료']).map(function (b) {
      return '<span class="tpd-badge' + (b === '연관과제' ? ' is-task' : '') + '">' + esc(b) + '</span>';
    }).join('');
    var tags = TP.tags.map(function (t) { return '<span class="tpd-tag">' + esc(t) + '</span>'; }).join('');
    var dots = [0, 1, 2].map(function (i) {
      return '<button type="button" class="tpd-dot' + (i === idx ? ' is-active' : '') +
        '" data-action="tpd-go" data-idx="' + i + '" aria-label="슬라이드 ' + (i + 1) + '"></button>';
    }).join('');
    return (
      '<div class="techpr-overlay">' +
        '<div class="tpd-box">' +
          '<button type="button" class="tpd-close" data-action="close-techpr-detail" title="닫기">&#10005;</button>' +
          '<div class="tpd-card">' +
            '<div class="tpd-badges">' + badges + '</div>' +
            '<div class="tpd-title-row"><div class="tpd-title">' + esc(card.title) + '</div></div>' +
            '<div class="tpd-tags">' + tags + '</div>' +
            '<div class="tpd-meta">' +
              '<div class="tpd-dots">' + dots + '</div>' +
              '<p class="tpd-place">' + esc(card.place) + ' / ' + esc(card.period) + '</p>' +
              '<p class="tpd-file">' + esc(TPD_FILE) + '</p>' +
            '</div>' +
            '<div class="tpd-stage-wrap">' +
              '<div class="tpd-stage">' +
                (TPD_KINDS[idx] === 'video' ? '<span class="tpd-play"><i class="fas fa-play"></i></span>' : '') +
                '<button type="button" class="tpd-arrow tpd-arrow-prev" data-action="tpd-step" data-d="-1" aria-label="이전">&#10094;</button>' +
                '<button type="button" class="tpd-arrow tpd-arrow-next" data-action="tpd-step" data-d="1" aria-label="다음">&#10095;</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- 공법 관리 > 모듈공정배치 관리 (mp-gk 생기 / mp-sc 생산) ----------
  // 근거: design-import/생기포털 v3.dc.html isMpList 블록 / mpVals.
  // 필터(지역·공장·자종연식·라인·제품·담당·검색어) + 결과표 20컬럼 + 상세 팝업(4탭, 컬럼 토글 그리드).
  var MP = global.PNDES.mock.mp;

  function mpUniq(key) {
    var seen = [];
    MP.rows.forEach(function (r) { if (seen.indexOf(r[key]) < 0) seen.push(r[key]); });
    return seen;
  }

  function mpFilterRows(A) {
    return MP.rows.filter(function (r) {
      return (A.region === '전체' || r.region === A.region) &&
        (A.plant === '전체' || r.plant === A.plant) &&
        (A.car === '전체' || r.dev === A.car || r.prod === A.car) &&
        (!A.carTxt || r.dev.indexOf(A.carTxt) >= 0 || r.prod.indexOf(A.carTxt) >= 0) &&
        (A.line === '전체' || r.line === A.line) &&
        (!A.lineTxt || r.line.indexOf(A.lineTxt) >= 0) &&
        (A.product === '전체' || r.product === A.product) &&
        (!A.kw || [r.region, r.dev, r.plant, r.line, r.product].some(function (x) { return x.indexOf(A.kw) >= 0; }));
    });
  }

  function mpSelect(key, value, options, extraCls) {
    return '<select data-mp-field="' + key + '" class="' + (extraCls || '') + '"><option value="전체">전체</option>' +
      options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select>';
  }

  function mpText(key, value, extraCls) {
    return '<input type="text" data-mp-field="' + key + '" value="' + esc(value) + '" class="' + (extraCls || '') + '" />';
  }

  function renderMpFilter(f) {
    var th = function (t) { return '<th>' + esc(t) + '</th>'; };
    return '<div class="mp-filter"><table class="mp-filter-table">' +
      '<tr>' + th('지역') + '<td>' + mpSelect('region', f.region, mpUniq('region')) + '</td>' +
        th('공장') + '<td>' + mpSelect('plant', f.plant, mpUniq('plant')) + '</td>' +
        '<td colspan="2"></td></tr>' +
      '<tr>' + th('자종연식') + '<td><div class="mp-cell-pair">' + mpSelect('car', f.car, mpUniq('dev'), 'mp-sel-sm') + mpText('carTxt', f.carTxt) + '</div></td>' +
        th('라인') + '<td><div class="mp-cell-pair">' + mpSelect('line', f.line, mpUniq('line'), 'mp-sel-sm') + mpText('lineTxt', f.lineTxt) + '</div></td>' +
        th('제품') + '<td><div class="mp-cell-pair">' + mpSelect('product', f.product, mpUniq('product'), 'mp-sel-sm') + mpText('productTxt', f.productTxt) + '</div></td></tr>' +
      '<tr>' + th('담당') + '<td><label class="mp-check"><input type="checkbox" data-mp-field="mine"' + (f.mine ? ' checked' : '') + ' />본인 담당</label></td>' +
        th('검색어') + '<td colspan="3"><div class="mp-cell-pair">' +
          '<select data-mp-field="kwField" class="mp-sel-sm"><option value="전체"' + (f.kwField === '전체' ? ' selected' : '') + '>전체</option>' +
            '<option value="라인"' + (f.kwField === '라인' ? ' selected' : '') + '>라인</option>' +
            '<option value="제품"' + (f.kwField === '제품' ? ' selected' : '') + '>제품</option></select>' +
          mpText('kw', f.kw) +
          '<select class="mp-sel-xs"><option>AND</option><option>OR</option></select>' +
        '</div></td></tr>' +
      '</table>' +
      '<div class="mp-filter-acts">' +
        '<button type="button" class="btn-dark tpa-btn-sm" data-action="mp-search"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
        '<button type="button" class="btn-outline-sm" data-action="mp-reset">초기화</button>' +
      '</div>' +
    '</div>';
  }

  function renderMpList(state, view) {
    var sc = view === 'mp-sc';
    var f = state.mpF;
    var rows = mpFilterRows(state.mpApplied);
    var body = rows.length
      ? rows.map(function (r, i) {
          var aMark = r.app ? (r.aDone ? '●' : '○') : '';
          return '<tr class="mp-row" data-action="mp-open" data-id="' + esc(r.id) + '">' +
            '<td>' + (i + 1) + '</td><td>' + esc(r.region) + '</td><td>' + esc(r.dev) + '</td><td>' + esc(r.prod) + '</td>' +
            '<td class="mp-left">' + esc(r.plant) + '</td><td class="mp-left">' + esc(r.line) + '</td><td>' + esc(r.product) + '</td>' +
            '<td>' + (r.std ? '●' : '○') + '</td><td>' + esc(r.uph) + '</td><td>' + esc(r.rate) + '</td>' +
            '<td>' + esc(r.work) + '</td><td>' + esc(r.direct) + '</td><td>' + esc(r.rev) + '</td>' +
            '<td class="mp-nowrap">' + esc(r.mod) + '</td><td>' + esc(r.writer) + '</td>' +
            '<td>' + (r.wDone ? '●' : '○') + '</td><td>' + esc(r.app) + ' ' + aMark + '</td>' +
            '<td>' + esc(r.dept) + '</td><td class="mp-nowrap">' + esc(r.dist) + '</td><td></td></tr>';
        }).join('')
      : '<tr><td colspan="20" class="mm-empty">조회된 데이터가 없습니다.</td></tr>';
    return (
      '<div class="admin-screen mp-screen" data-screen-label="' + (sc ? '생산모듈공정배치 관리' : '생기모듈공정배치 관리') + '">' +
        '<div class="mp-head">' +
          '<h2 class="mp-title">' + (sc ? '생산모듈공정배치 관리' : '생기모듈공정배치 관리') + '</h2>' +
          '<div class="mp-head-btns">' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mp-toast" data-m="등록 팝업을 엽니다.">등록</button>' +
            '<button type="button" class="btn-excel" data-action="mp-toast" data-m="조회 결과를 엑셀로 내려받습니다.">엑셀</button>' +
          '</div>' +
        '</div>' +
        renderMpFilter(f) +
        '<p class="mp-total">총 <b>' + rows.length + '</b>건</p>' +
        '<div class="mp-scroll"><table class="tpa-table mp-table"><thead>' +
          '<tr><th rowspan="2">순번</th><th rowspan="2">지역</th><th colspan="2">자종연식</th>' +
            '<th rowspan="2">공장</th><th rowspan="2">라인</th><th rowspan="2">제품</th><th rowspan="2">표준<br />라인</th>' +
            '<th rowspan="2">UPH</th><th rowspan="2">편성율</th><th rowspan="2">조립공수</th><th rowspan="2">직접인원<br />(명)</th>' +
            '<th rowspan="2">Rev</th><th rowspan="2">수정일</th><th colspan="6">작성부서</th></tr>' +
          '<tr><th>개발</th><th>양산</th><th>작성</th><th>검토</th><th>승인</th><th>부서명</th><th>배포일</th><th>작성</th></tr>' +
        '</thead><tbody>' + body + '</tbody></table></div>' +
        (state.mpModalId ? renderMpDetailModal(state, sc) : '') +
      '</div>'
    );
  }

  // 상세 팝업 — 헤더 정보표 + 4탭. "공정배치" 탭은 컬럼 토글(MP_COL_LABEL)에 따라 그리드 컬럼이 늘고 준다.
  function renderMpDetailModal(state, sc) {
    var d = null;
    MP.rows.forEach(function (r) { if (r.id === state.mpModalId) d = r; });
    if (!d) return '';
    var tab = state.mpTab || 'basic';
    var tabsHtml = MP.tabs.map(function (t) {
      return '<button type="button" class="mp-tab' + (tab === t[0] ? ' is-active' : '') + '" data-action="mp-tab" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join('');
    var title = (sc ? '생산모듈공정배치[' : '생기모듈공정배치[') + d.plant + ' ' + d.dev + ' ' + d.product + ' ,Rev : ' + d.rev + ']';
    var info = '<table class="tpa-table mp-info-table"><tbody>' +
      '<tr><th>지역</th><td>' + esc(d.region) + '</td><th>공장</th><td>' + esc(d.plant) + '</td><th>라인</th><td>' + esc(d.line) + '</td></tr>' +
      '<tr><th>제품</th><td>' + esc(d.product) + '</td><th>개발자종</th><td>' + esc(d.dev) + '</td><th>양산자종</th><td>' + esc(d.prod) + '</td></tr>' +
      '<tr><th>Rev</th><td>' + esc(d.rev) + '</td><th>UPH</th><td>' + esc(d.uph) + '</td><th>C/T</th><td>0.0</td></tr>' +
    '</tbody></table>';
    var paneHtml;
    if (tab === 'layout') {
      var cols = state.mpCols || {};
      var vis = MP.COL_DEF.filter(function (c) { return !c[1] || cols[c[1]]; });
      var seed = MP.gridSeed[d.id === 'mp1' ? 'mp1' : 'other'];
      var checks = MP.COL_LABEL.map(function (c) {
        return '<label class="mp-colchk"><input type="checkbox" data-action="mp-col-toggle" data-k="' + c[0] + '"' +
          (cols[c[0]] ? ' checked' : '') + ' />' + esc(c[1]) + '</label>';
      }).join('');
      var heads = vis.map(function (c) { return '<th>' + esc(c[0]) + '</th>'; }).join('');
      var gridRows = seed.map(function (g, gi) {
        var cells = vis.map(function (c) {
          var k = c[0];
          if (k === '공정') return '<td><select class="mp-grid-sel"><option>' + esc(g.proc) + '</option></select></td>';
          if (k === '주작업내용') return '<td><input type="text" class="mp-grid-inp" /></td>';
          if (k === '조립 인터페이스' || k === '평자동화 적용여부') return '<td><input type="checkbox" /></td>';
          if (k === '표준 작업명') return '<td><select class="mp-grid-sel"><option>' + esc(g.std) + '</option></select></td>';
          if (k === '작업내용') return '<td>' + esc(g.work) + '</td>';
          if (k === '순서') return '<td>1</td>';
          if (k === '작업번호') return '<td>' + esc(g.no) + '</td>';
          if (k === '작업명') return '<td class="mp-left">' + esc(g.name) + '</td>';
          return '<td></td>';
        }).join('');
        return (g.main || gi === 0 ? '<tr class="mp-grid-main"><td colspan="' + vis.length + '">' + esc(g.main || '1공정') + '</td></tr>' : '') +
          '<tr>' + cells + '</tr>';
      }).join('');
      var layoutActs = [
        ['엑셀', '엑셀로 내려받습니다.', 'btn-excel'],
        ['추가', '공정 행을 추가했습니다.', 'btn-navy tpa-btn-sm'],
        ['복사', '선택한 행을 복사했습니다.', 'btn-navy tpa-btn-sm'],
        ['삭제', '삭제할 행을 선택하세요.', 'btn-navy tpa-btn-sm'],
        ['저장', '저장되었습니다.', 'btn-navy tpa-btn-sm'],
        ['공수비교', '공수비교 팝업을 엽니다.', 'btn-navy tpa-btn-sm'],
        ['조공서 도면번호 입력', '도면번호 입력 팝업을 엽니다.', 'btn-navy tpa-btn-sm'],
        ['첨부파일', '첨부파일 팝업을 엽니다.', 'btn-navy tpa-btn-sm'],
      ].map(function (a) {
        return '<button type="button" class="' + a[2] + '" data-action="mp-toast" data-m="' + esc(a[1]) + '">' + esc(a[0]) + '</button>';
      }).join('');
      paneHtml = '<div class="mp-pane-head"><p class="mp-pane-title">공정배치계획</p>' +
        '<div class="mp-pane-acts">' + layoutActs + '</div></div>' +
        '<div class="mp-colchks">' + checks + '</div>' +
        '<div class="mp-scroll"><table class="tpa-table mp-grid-table"><thead><tr>' + heads + '</tr></thead>' +
        '<tbody>' + gridRows + '</tbody></table></div>';
    } else if (tab === 'basic') {
      // 기본운영방안 — 정보 입력표 + 변경이력표. 근거: 소스 mpIsBasic 블록.
      var ro = function (v) { return '<td>' + esc(v || '') + '</td>'; };
      var inp = function (v) { return '<td><input type="text" class="mp-grid-inp" value="' + esc(v || '') + '" /></td>'; };
      var selc = function () { return '<td><select class="mp-grid-sel"><option>선택</option></select></td>'; };
      paneHtml =
        '<div class="mp-pane-head">' +
          '<p class="mp-pane-title">기본운영방안</p>' +
          '<div class="mp-pane-acts">' +
            '<label class="mp-check"><input type="checkbox" />표준 라인</label>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mp-toast" data-m="저장되었습니다.">저장</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mp-toast" data-m="첨부파일 팝업을 엽니다.">첨부파일</button>' +
            '<button type="button" class="btn-excel" data-action="mp-toast" data-m="엑셀로 내려받습니다.">엑셀</button>' +
          '</div>' +
        '</div>' +
        '<table class="tpa-table mp-info-table mp-basic-table"><tbody>' +
          '<tr><th>생산차종(개발)</th>' + ro(d.dev) + '<th>생산차종(양산)</th>' +
            '<td colspan="3"><div class="mp-cell-pair"><span>' + esc(d.prod) + '</span>' +
            '<button type="button" class="btn-outline-sm" data-action="mp-toast" data-m="생산차종 변경 팝업을 엽니다.">변경</button></div></td></tr>' +
          '<tr><th><span class="mm-req">*</span> EIS프로젝트</th><td colspan="3">' +
            '<div class="mp-cell-pair"><select class="mp-grid-sel"><option>선택</option></select>' +
            '<button type="button" class="tpa-icon-btn mm-icon-btn" data-action="mp-toast" data-m="EIS프로젝트 검색"><i class="fas fa-search"></i></button></div></td>' +
            '<th><span class="mm-req">*</span> G-MDM 라인코드</th>' + selc() + '</tr>' +
          '<tr><th>생산품</th>' + ro(d.product) + '<th>생산공장</th>' + ro(d.plant + ' ' + d.line) + '<th>납품처</th>' + inp('') + '</tr>' +
          '<tr><th>생산량</th>' + inp('0') + '<th>물류설비</th>' + selc() + '<th>승상용 구분</th>' + selc() + '</tr>' +
          '<tr><th>연간작업시간</th>' + inp('0') + '<th>혼류</th>' + inp('1') + '<th>UPH</th>' + ro(d.uph) + '</tr>' +
          '<tr><th>배포단계</th><td><div class="mp-radio-row">' +
            ['P1', 'M1', '양산', '선행'].map(function (st2, i) {
              return '<label class="mp-check"><input type="radio" name="mpStage"' + (i === 0 ? ' checked' : '') + ' />' + st2 + '</label>';
            }).join('') + '</div></td>' +
            '<th>공정별 최대 작업자수</th><td colspan="3"><div class="mp-cell-pair">' +
            'LH <select class="mp-grid-sel"><option>1</option><option>2</option></select> ' +
            'RH <select class="mp-grid-sel"><option>1</option><option>2</option></select></div></td></tr>' +
          '<tr><th>간접인원(검사)</th>' + inp('0') + '<th>표준 제품명(자동화 반영)</th>' + selc() + '<th>교대 운영</th>' + selc() + '</tr>' +
          '<tr><th>비고</th><td colspan="5"><textarea class="mp-textarea" rows="2"></textarea></td></tr>' +
        '</tbody></table>' +
        '<table class="tpa-table mp-grid-table mp-hist-table"><thead><tr>' +
          '<th>순번</th><th>기호</th><th>변경근거</th><th>변경내용</th><th>작성</th><th>검토</th><th>승인</th>' +
        '</tr></thead><tbody><tr><td>1</td>' +
          '<td><input type="text" class="mp-grid-inp" /></td>' +
          '<td><input type="text" class="mp-grid-inp" /></td>' +
          '<td><input type="text" class="mp-grid-inp" /></td>' +
          '<td>이*영</td><td></td><td></td></tr></tbody></table>';
    } else if (tab === 'std') {
      // 표준공수 및 인원산출 — 근거: 소스 mpIsStd 블록(합계행 포함).
      var stdRows = [
        ['1공정', 'BSA 수작업 1 (LH)', '42.0', '10%', '0.00', '0'],
        ['2공정', 'BSA 수작업 2 (LH)', '36.5', '10%', '0.00', '0'],
      ];
      paneHtml =
        '<p class="mp-pane-title">표준공수 및 인원산출</p>' +
        '<table class="tpa-table mp-grid-table"><thead><tr>' +
          '<th>공정</th><th>작업명</th><th>표준공수(초)</th><th>보조공수율</th><th>편성효율</th><th>필요인원</th>' +
        '</tr></thead><tbody>' +
        stdRows.map(function (r) {
          return '<tr><td>' + esc(r[0]) + '</td><td class="mp-left">' + esc(r[1]) + '</td>' +
            '<td>' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td>' + esc(r[4]) + '</td><td>' + esc(r[5]) + '</td></tr>';
        }).join('') +
        '<tr class="mp-sum-row"><td colspan="2">합계</td><td>78.5</td><td>-</td><td>0.00</td><td>0</td></tr>' +
        '</tbody></table>';
    } else {
      // 산출물 — 근거: 소스 mpIsOut 블록.
      var outRows = [
        ['1', '공정배치계획서.xlsx', '이*영', '2026.10.16'],
        ['2', '표준공수 산출서.pdf', '이*영', '2026.10.16'],
      ];
      paneHtml =
        '<p class="mp-pane-title">산출물</p>' +
        '<table class="tpa-table mp-grid-table"><thead><tr>' +
          '<th>순번</th><th>산출물명</th><th>등록자</th><th>등록일</th><th>다운로드</th>' +
        '</tr></thead><tbody>' +
        outRows.map(function (r) {
          return '<tr><td>' + esc(r[0]) + '</td><td class="mp-left">' + esc(r[1]) + '</td>' +
            '<td>' + esc(r[2]) + '</td><td class="mp-nowrap">' + esc(r[3]) + '</td>' +
            '<td><button type="button" class="tpa-icon-btn mm-icon-btn" data-action="mp-toast" data-m="파일을 내려받습니다." title="다운로드"><i class="fas fa-download"></i></button></td></tr>';
        }).join('') +
        '</tbody></table>';
    }
    return (
      '<div class="rm-modal-overlay" data-action="mp-close">' +
        '<div class="rm-modal-box mp-modal">' +
          '<div class="rm-modal-header-navy"><h3>' + esc(title) + '</h3>' +
            '<button type="button" class="rm-modal-close" data-action="mp-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-body">' +
            info +
            '<div class="mp-tabs">' + tabsHtml + '</div>' +
            paneHtml +
            '<div class="mp-modal-foot">' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="mp-toast" data-m="상신되었습니다.">상신</button>' +
              '<button type="button" class="btn-outline-sm" data-action="mp-close">닫기</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- 공법 관리 > 부품공정배치 관리 (bp-gk 생기 / bp-sc 생산) ----------
  // 근거: design-import/생기포털 v3.dc.html isPpList 블록 / ppVals / ppRowsAll.
  // mp와 달리 페이지네이션(15건)·행 체크박스·탭 안의 서브탭 구조를 가진다.
  var PP = global.PNDES.mock.pp;

  function ppUniq(key) {
    var seen = [];
    PP.rows.forEach(function (r) { if (seen.indexOf(r[key]) < 0) seen.push(r[key]); });
    return seen;
  }

  function ppFilterRows(A) {
    return PP.rows.filter(function (r) {
      return (A.region === '전체' || r.region === A.region) &&
        (A.plant === '전체' || r.plant === A.plant) &&
        (A.line === '전체' || r.line === A.line) &&
        (A.car === '전체' || r.car === A.car) &&
        (!A.carTxt || r.car.indexOf(A.carTxt) >= 0) &&
        (A.product === '전체' || r.product === A.product) &&
        (!A.kw || [r.car, r.plant, r.line, r.product].some(function (x) { return x.indexOf(A.kw) >= 0; }));
    });
  }

  function ppSelect(key, value, options, cls) {
    return '<select data-pp-field="' + key + '" class="' + (cls || '') + '"><option value="전체">전체</option>' +
      options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select>';
  }

  function ppText(key, value, cls) {
    return '<input type="text" data-pp-field="' + key + '" value="' + esc(value) + '" class="' + (cls || '') + '" />';
  }

  function renderPpFilter(f) {
    var th = function (t) { return '<th>' + esc(t) + '</th>'; };
    return '<div class="mp-filter"><table class="mp-filter-table">' +
      '<tr>' + th('지역') + '<td>' + ppSelect('region', f.region, ppUniq('region')) + '</td>' +
        th('공장') + '<td>' + ppSelect('plant', f.plant, ppUniq('plant')) + '</td>' +
        th('라인') + '<td>' + ppSelect('line', f.line, ppUniq('line')) + '</td></tr>' +
      '<tr>' + th('자종연식') + '<td><div class="mp-cell-pair">' + ppSelect('car', f.car, ppUniq('car'), 'mp-sel-sm') + ppText('carTxt', f.carTxt) + '</div></td>' +
        '<td colspan="2"></td>' +
        th('제품') + '<td><div class="mp-cell-pair">' + ppSelect('product', f.product, ppUniq('product'), 'mp-sel-sm') + ppText('productTxt', f.productTxt) + '</div></td></tr>' +
      '<tr>' + th('담당') + '<td><label class="mp-check"><input type="checkbox" data-pp-field="mine"' + (f.mine ? ' checked' : '') + ' />본인 담당</label></td>' +
        th('검색어') + '<td><div class="mp-cell-pair">' +
          '<select data-pp-field="kwField" class="mp-sel-xs"><option value="전체"' + (f.kwField === '전체' ? ' selected' : '') + '>전체</option>' +
          '<option value="라인"' + (f.kwField === '라인' ? ' selected' : '') + '>라인</option></select>' +
          ppText('kw', f.kw) + '</div></td>' +
        th('품번') + '<td>' + ppText('partNo', f.partNo) + '</td></tr>' +
      '</table>' +
      '<div class="mp-filter-acts">' +
        '<button type="button" class="btn-dark tpa-btn-sm" data-action="pp-search"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
        '<button type="button" class="btn-outline-sm" data-action="pp-reset">초기화</button>' +
        '<button type="button" class="btn-outline-sm" data-action="pp-toast" data-m="상세검색 조건을 엽니다.">상세검색</button>' +
      '</div>' +
    '</div>';
  }

  function renderPpList(state, view) {
    var sc = view === 'bp-sc';
    var rows = ppFilterRows(state.ppApplied);
    var per = PP.perPage;
    var pages = Math.max(1, Math.ceil(rows.length / per));
    var page = Math.min(state.ppPage || 1, pages);
    var st0 = (page - 1) * per;
    var pageRows = rows.slice(st0, st0 + per);
    var checked = state.ppChecked || {};
    var allOn = pageRows.length > 0 && pageRows.every(function (r) { return checked[r.id]; });
    var body = pageRows.length
      ? pageRows.map(function (r, i) {
          return '<tr class="mp-row" data-action="pp-open" data-id="' + esc(r.id) + '">' +
            '<td data-action="pp-check" data-id="' + esc(r.id) + '"><input type="checkbox" class="pp-box"' + (checked[r.id] ? ' checked' : '') + ' /></td>' +
            '<td>' + (st0 + i + 1) + '</td><td>' + esc(r.region) + '</td><td>' + esc(r.car) + '</td>' +
            '<td class="mp-left">' + esc(r.plant) + '</td><td class="mp-left">' + esc(r.line) + '</td><td>' + esc(r.product) + '</td>' +
            '<td>' + (r.std ? '●' : '○') + '</td><td>' + esc(r.ct) + '</td><td>' + esc(r.work) + '</td>' +
            '<td>' + esc(r.direct) + '</td><td>' + esc(r.semi) + '</td><td>' + (r.reg ? '●' : '○') + '</td>' +
            '<td>' + esc(r.rev) + '</td><td class="mp-nowrap">' + esc(r.mod) + '</td><td>' + esc(r.writer) + '</td>' +
            '<td></td><td></td><td></td><td></td><td></td></tr>';
        }).join('')
      : '<tr><td colspan="21" class="mm-empty">조회된 데이터가 없습니다.</td></tr>';
    var pgBtns = '';
    for (var pi = 1; pi <= pages; pi++) {
      pgBtns += '<button type="button" class="pp-pg' + (pi === page ? ' is-active' : '') + '" data-action="pp-page" data-page="' + pi + '">' + pi + '</button>';
    }
    return (
      '<div class="admin-screen mp-screen" data-screen-label="' + (sc ? '생산부품공정배치 관리' : '생기부품공정배치 관리') + '">' +
        '<div class="mp-head">' +
          '<h2 class="mp-title">' + (sc ? '생산부품공정배치 관리' : '생기부품공정배치 관리') + '</h2>' +
          '<div class="mp-head-btns">' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="pp-copy">복사</button>' +
            '<button type="button" class="btn-excel" data-action="pp-toast" data-m="조회 결과를 엑셀로 내려받습니다.">엑셀</button>' +
          '</div>' +
        '</div>' +
        renderPpFilter(state.ppF) +
        '<p class="mp-total">총 <b>' + rows.length + '</b>건</p>' +
        '<div class="mp-scroll"><table class="tpa-table mp-table"><thead>' +
          '<tr><th rowspan="2"><input type="checkbox" class="pp-box" data-action="pp-toggle-all"' + (allOn ? ' checked' : '') + ' /></th>' +
            '<th rowspan="2">순번</th><th rowspan="2">지역</th><th rowspan="2">자종연식</th><th rowspan="2">공장</th>' +
            '<th rowspan="2">라인</th><th rowspan="2">제품</th><th rowspan="2">표준<br />라인</th><th rowspan="2">C/T(초)</th>' +
            '<th rowspan="2">수작업시간</th><th rowspan="2">직접인원<br />(명)</th><th rowspan="2">준직접인원<br />(명)</th>' +
            '<th rowspan="2">준직접표준<br />등록여부</th><th rowspan="2">Rev</th><th rowspan="2">수정일</th>' +
            '<th colspan="6">작성부서</th></tr>' +
          '<tr><th>작성</th><th>검토</th><th>승인</th><th>부서명</th><th>배포일</th><th>작성</th></tr>' +
        '</thead><tbody>' + body + '</tbody></table></div>' +
        '<div class="pp-pager">' +
          '<button type="button" class="pp-pg" data-action="pp-page" data-page="1">&laquo;</button>' +
          '<button type="button" class="pp-pg" data-action="pp-page" data-page="' + (page - 1) + '">&lsaquo;</button>' +
          pgBtns +
          '<button type="button" class="pp-pg" data-action="pp-page" data-page="' + (page + 1) + '">&rsaquo;</button>' +
          '<button type="button" class="pp-pg" data-action="pp-page" data-page="' + pages + '">&raquo;</button>' +
        '</div>' +
        (state.ppModalId ? renderPpDetailModal(state, sc) : '') +
      '</div>'
    );
  }

  // 상세 팝업 — 3탭(기본운영방안/산출물/STD), 기본운영방안 안에 서브탭 4개.
  // "부품공정배치계획" 서브탭만 표(PP_PLAN)를 그리고 나머지는 자리표시 영역이다.
  function renderPpDetailModal(state, sc) {
    var d = null;
    PP.rows.forEach(function (r) { if (r.id === state.ppModalId) d = r; });
    if (!d) return '';
    var tab = state.ppTab || 'basic';
    var sub = state.ppSub || 'reg';
    var title = (sc ? '생산부품공정배치 작성 [' : '생기부품공정배치 작성 [') + d.plant + ' ' + d.product + ' ' + d.car + ',Rev : ' + d.rev + ']';
    var tabsHtml = PP.tabs.map(function (t) {
      return '<button type="button" class="mp-tab' + (tab === t[0] ? ' is-active' : '') + '" data-action="pp-tab" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join('');
    var pane;
    if (tab === 'basic') {
      var subsHtml = PP.subs.map(function (t) {
        return '<button type="button" class="pp-sub' + (sub === t[0] ? ' is-active' : '') + '" data-action="pp-sub" data-sub="' + t[0] + '">' + esc(t[1]) + '</button>';
      }).join('');
      var inner;
      if (sub === 'plan') {
        inner = '<table class="tpa-table mp-grid-table"><thead><tr>' +
          '<th>공정</th><th>표준공정명</th><th>공정명</th><th>설비명</th></tr></thead><tbody>' +
          PP.plan.map(function (r) {
            return '<tr><td>' + esc(r[0]) + '</td><td class="mp-left">' + esc(r[1]) + '</td>' +
              '<td class="mp-left">' + esc(r[2]) + '</td><td class="mp-left">' + esc(r[3]) + '</td></tr>';
          }).join('') + '</tbody></table>';
      } else {
        var subName = '';
        PP.subs.forEach(function (t) { if (t[0] === sub) subName = t[1]; });
        inner = '<div class="mp-pane-empty">' + esc(subName) + ' 영역은 상세 설계 확정 후 연결됩니다.</div>';
      }
      pane = '<div class="pp-subs">' + subsHtml + '</div>' + inner;
    } else {
      var label = '';
      PP.tabs.forEach(function (t) { if (t[0] === tab) label = t[1]; });
      pane = '<div class="mp-pane-empty">' + esc(label) + ' 영역은 상세 설계 확정 후 연결됩니다.</div>';
    }
    return (
      '<div class="rm-modal-overlay" data-action="pp-close">' +
        '<div class="rm-modal-box mp-modal">' +
          '<div class="rm-modal-header-navy"><h3>' + esc(title) + '</h3>' +
            '<button type="button" class="rm-modal-close" data-action="pp-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-body">' +
            '<table class="tpa-table mp-info-table"><tbody>' +
              '<tr><th>공장</th><td>' + esc(d.plant) + '</td><th>라인</th><td>' + esc(d.line) + '</td></tr>' +
              '<tr><th>제품</th><td>' + esc(d.product) + '</td><th>자종연식</th><td>' + esc(d.car) + '</td></tr>' +
              '<tr><th>C/T(초)</th><td>' + esc(d.ct) + '</td><th>Rev</th><td>' + esc(d.rev) + '</td></tr>' +
            '</tbody></table>' +
            '<div class="mp-tabs">' + tabsHtml + '</div>' + pane +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- 공법 관리 > 공장별 현황비교 (mod-cmp 모듈 / part-cmp 부품) ----------
  // 근거: design-import/생기포털 v3.dc.html isModCmp/isPartCmp 블록 / cmpVals.
  // 그룹(권역·공장) 헤더가 컬럼을 colspan으로 묶고, 상단 통계행 + 하단 과제 매트릭스를 그린다.
  var CMP = global.PNDES.mock.cmp;

  // 선택된 그룹만 남겨 컬럼·통계·과제행을 다시 계산한다(v3 build()).
  function cmpBuild(groupsDef, colsDef, stat, tasks, selVal, isPart) {
    var groups = groupsDef.filter(function (g) { return selVal === '전체' || g[0] === selVal; });
    var cols = groups.reduce(function (a, g) { return a.concat(g[1]); }, []);
    var idx = cols.map(function (c) { return colsDef.indexOf(c); });
    var trs = tasks.filter(function (t) {
      return selVal === '전체' || cols.some(function (c) { return t[1][c]; });
    });
    return {
      groups: groups.map(function (g) { return { label: g[0], span: g[1].length }; }),
      cols: cols,
      n: cols.length,
      stats: stat.map(function (r) {
        return { label: r[0], bp: r[1], all: r[2], hl: !!r[4], cells: idx.map(function (i) { return r[3][i]; }) };
      }),
      tasks: trs.map(function (t, i) {
        return {
          no: i + 1, name: t[0],
          cells: cols.map(function (c) {
            var v = t[1][c] || (isPart ? '-' : '');
            return { t: v, bold: v === '●' || v === 'X', faint: v === '-', fill: !isPart && !!v };
          }),
        };
      }),
      empty: trs.length === 0,
    };
  }

  function renderCmp(state, view) {
    var mod = view === 'mod-cmp';
    var sel = state.cmpSel || { modRegion: '전체', partPlant: '전체' };
    var applied = state.cmpApplied || { modRegion: '전체', partPlant: '전체' };
    var d = mod
      ? cmpBuild(CMP.modGroups, CMP.modCols, CMP.modStat, CMP.modTasks, applied.modRegion, false)
      : cmpBuild(CMP.partGroups, CMP.partCols, CMP.partStat, CMP.partTasks, applied.partPlant, true);
    var selKey = mod ? 'modRegion' : 'partPlant';
    var opts = ['전체'].concat((mod ? CMP.modGroups : CMP.partGroups).map(function (g) { return g[0]; }));
    var selHtml = '<select data-cmp-field="' + selKey + '">' + opts.map(function (o) {
      return '<option value="' + esc(o) + '"' + (o === sel[selKey] ? ' selected' : '') + '>' + esc(o) + '</option>';
    }).join('') + '</select>';

    var groupHead = d.groups.map(function (g) {
      return '<th colspan="' + g.span + '">' + esc(g.label) + '</th>';
    }).join('');
    var colHead = d.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('');
    var statRows = d.stats.map(function (r) {
      return '<tr' + (r.hl ? ' class="cmp-hl"' : '') + '>' +
        '<td class="cmp-left">' + esc(r.label) + '</td><td>' + esc(String(r.bp)) + '</td><td>' + esc(String(r.all)) + '</td>' +
        r.cells.map(function (t) { return '<td>' + esc(String(t == null ? '' : t)) + '</td>'; }).join('') +
      '</tr>';
    }).join('');
    var taskRows = d.empty
      ? '<tr><td colspan="' + (d.n + 2) + '" class="mm-empty">조회된 데이터가 없습니다.</td></tr>'
      : d.tasks.map(function (t) {
          return '<tr><td>' + t.no + '</td><td class="cmp-left">' + esc(t.name) + '</td>' +
            t.cells.map(function (c) {
              var cls = (c.bold ? 'cmp-b ' : '') + (c.faint ? 'cmp-faint ' : '') + (c.fill ? 'cmp-fill' : '');
              return '<td class="' + cls.trim() + '">' + esc(c.t) + '</td>';
            }).join('') + '</tr>';
        }).join('');

    return (
      '<div class="admin-screen mp-screen" data-screen-label="' + (mod ? '모듈 공장별 현황비교' : '부품 공장별 현황비교') + '">' +
        '<div class="mp-head">' +
          '<h2 class="mp-title">' + (mod ? '[모듈] 공장별 현황 비교' : '공장별 현황 비교') + '</h2>' +
          '<div class="mp-head-btns">' +
            '<button type="button" class="btn-excel" data-action="cmp-excel">엑셀</button>' +
          '</div>' +
        '</div>' +
        '<div class="mp-filter"><table class="mp-filter-table cmp-filter-table"><tr>' +
          '<th>제품군</th><td><select><option>' + (mod ? '모듈' : '부품') + '</option></select></td>' +
          '<th>제품</th><td><select><option>전체</option></select></td>' +
          '<th>' + (mod ? '권역' : '공장') + '</th><td>' + selHtml + '</td>' +
        '</tr></table>' +
        '<div class="mp-filter-acts">' +
          '<button type="button" class="btn-dark tpa-btn-sm" data-action="cmp-search"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
          '<button type="button" class="btn-outline-sm" data-action="cmp-reset">초기화</button>' +
        '</div></div>' +
        '<div class="mp-scroll"><table class="tpa-table cmp-table"><thead>' +
          '<tr><th rowspan="2" class="cmp-corner">구분</th><th rowspan="2">B/P</th><th rowspan="2">전체</th>' + groupHead + '</tr>' +
          '<tr>' + colHead + '</tr>' +
        '</thead><tbody>' + statRows + '</tbody></table></div>' +
        '<p class="cmp-caption">자동화 과제별 적용 현황</p>' +
        '<div class="mp-scroll"><table class="tpa-table cmp-table"><thead>' +
          '<tr><th rowspan="2" style="width:48px">NO</th><th rowspan="2" class="cmp-corner">과제명</th>' + groupHead + '</tr>' +
          '<tr>' + colHead + '</tr>' +
        '</thead><tbody>' + taskRows + '</tbody></table></div>' +
      '</div>'
    );
  }

  // ---------- 업무지표현황 > 기술과제 > 계획관리 (tt-plan) ----------
  // 근거: design-import/생기포털 v3.dc.html isTtPlan 블록 / ttVals / ttRowsAll.
  // 목록 492건(TT_BASE 15건 순환) + 액션바 8종 + 페이지네이션(15건, 10페이지 블록)
  // + 상세 팝업(2탭: 기술과제 상세 / 결재현황).
  var TTP = global.PNDES.mock.tt; // SCR-013의 TT(scr013 mock)와 이름이 겹치지 않도록 TTP 사용

  function ttFilterRows(F) {
    return TTP.rows.filter(function (r) {
      return (F.dept === '전체' || (r.dept || '렘프생기실') === F.dept) &&
        (F.team === '전체' || r.team === F.team) &&
        (F.status === '전체' || r.status === F.status) &&
        (F.type === '전체' || r.type === F.type) &&
        (F.scope === '전체' || r.scope === F.scope) &&
        (F.ptrm === '전체' || r.ptrm === F.ptrm) &&
        (!F.name || r.name.indexOf(F.name) >= 0) &&
        (!F.from || r.plan.replace(/\./g, '-') >= F.from) &&
        (!F.to || r.plan.replace(/\./g, '-') <= F.to);
    });
  }

  function ttSel(key, value, options) {
    return '<select data-tt-field="' + key + '"><option value="전체">전체</option>' +
      options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select>';
  }

  // 결재현황 탭 — 작성중은 이력 없음, 결재중은 상신만, 그 외는 상신+승인/반려.
  function ttApprovals(d) {
    if (!d || d.status === '작성중') return [];
    var list = [{ no: 1, kind: '상신', who: (d.dept || '렘프생기실') + ' ' + d.team + ' ' + d.writer, at: d.plan, memo: '' }];
    if (d.status !== '결재중') {
      list.push({
        no: 2, kind: d.status === '반려' ? '반려' : '승인', who: '렘프생기실 실장', at: d.done,
        memo: d.status === '반려' ? '보완 후 재상신 바랍니다.' : '',
      });
    }
    return list;
  }

  function renderTtDetailModal(state) {
    var d = null;
    TTP.rows.forEach(function (r) { if (r.id === state.ttModalId) d = r; });
    if (!d) return '';
    var tab = state.ttTab || 'detail';
    var tabsHtml = [['detail', '기술과제 상세'], ['approval', '결재현황']].map(function (t) {
      return '<button type="button" class="mp-tab' + (tab === t[0] ? ' is-active' : '') + '" data-action="tt-tab" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join('');
    var pane;
    if (tab === 'approval') {
      var ap = ttApprovals(d);
      pane = '<table class="tpa-table mp-grid-table"><thead><tr>' +
        '<th style="width:56px">순번</th><th style="width:96px">구분</th><th>결재자</th>' +
        '<th style="width:112px">일자</th><th>의견</th></tr></thead><tbody>' +
        (ap.length
          ? ap.map(function (a) {
              return '<tr><td>' + a.no + '</td><td>' + esc(a.kind) + '</td>' +
                '<td class="mp-left">' + esc(a.who) + '</td><td class="mp-nowrap">' + esc(a.at) + '</td>' +
                '<td class="mp-left">' + esc(a.memo) + '</td></tr>';
            }).join('')
          : '<tr><td colspan="5" class="mm-empty">결재 이력이 없습니다.</td></tr>') +
        '</tbody></table>';
    } else {
      var row = function (a, b, c, dd) {
        return '<tr><th>' + esc(a) + '</th><td>' + esc(b) + '</td><th>' + esc(c) + '</th><td>' + esc(dd) + '</td></tr>';
      };
      pane = '<table class="tpa-table mp-info-table tt-detail-table"><tbody>' +
        row('REV', d.rev, '상태', d.status) +
        row('담당자', (d.dept || '렘프생기실') + ' ' + d.team + ' ' + d.writer, '등록일', d.plan) +
        '<tr><th>과제명</th><td colspan="3" class="mp-left">' + esc(d.name) + '</td></tr>' +
        row('과제 유형', d.type, '추진범위', d.scope) +
        '<tr><th>수행목적</th><td colspan="3" class="mp-left">' + esc(d.purpose || d.name) + '</td></tr>' +
        row('정량목표', d.quant || '-', 'P/TRM', d.ptrm) +
        row('계획보고', d.plan, '완료보고', d.done) +
      '</tbody></table>';
    }
    return (
      '<div class="rm-modal-overlay" data-action="tt-close">' +
        '<div class="rm-modal-box mp-modal">' +
          '<div class="rm-modal-header-navy"><h3>기술과제 계획상세 (Rev:' + esc(d.rev) + ')</h3>' +
            '<button type="button" class="rm-modal-close" data-action="tt-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-body">' +
            '<div class="mp-tabs">' + tabsHtml + '</div>' + pane +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderTtPlan(state) {
    var F = state.ttF;
    var rows = ttFilterRows(state.ttApplied);
    var per = TTP.perPage;
    var pages = Math.max(1, Math.ceil(rows.length / per));
    var page = Math.min(state.ttPage || 1, pages);
    var st0 = (page - 1) * per;
    var view = rows.slice(st0, st0 + per);
    var sel = state.ttSel || {};
    var allOn = view.length > 0 && view.every(function (r) { return sel[r.id]; });

    var acts = TTP.actions.map(function (label) {
      var cls = label === '등록' ? 'tt-act is-primary' : (label === 'EXCEL' ? 'tt-act is-excel' : 'tt-act');
      return '<button type="button" class="' + cls + '" data-action="tt-act" data-label="' + esc(label) + '">' + esc(label) + '</button>';
    }).join('');

    var body = view.length
      ? view.map(function (r, i) {
          return '<tr class="' + (r.status === '변경요청' ? 'tt-row-warn' : 'mp-row') + '" data-action="tt-open" data-id="' + esc(r.id) + '">' +
            '<td data-action="tt-check" data-id="' + esc(r.id) + '"><input type="checkbox" class="pp-box"' + (sel[r.id] ? ' checked' : '') + ' /></td>' +
            '<td>' + (st0 + i + 1) + '</td><td>' + esc(r.team) + '</td><td>' + esc(r.writer) + '</td>' +
            '<td>' + esc(r.type) + '</td><td class="mp-left">' + esc(r.name) + '</td><td>' + esc(r.scope) + '</td>' +
            '<td>' + esc(r.ptrm) + '</td><td>' + esc(r.code) + '</td>' +
            '<td class="mp-nowrap">' + esc(r.plan) + '</td><td class="mp-nowrap">' + esc(r.done) + '</td>' +
            '<td>' + esc(r.quant || '') + '</td><td>' + (r.doc ? '●' : '') + '</td>' +
            '<td class="tt-st">' + esc(r.status) + '</td><td>' + esc(r.rev) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="15" class="mm-empty">조회된 데이터가 없습니다.</td></tr>';

    // 페이지 버튼은 10개씩 블록 단위로 보여준다(v3 b0 계산).
    var b0 = Math.floor((page - 1) / 10) * 10 + 1;
    var pgBtns = '';
    for (var pi = b0; pi < b0 + 10 && pi <= pages; pi++) {
      pgBtns += '<button type="button" class="pp-pg' + (pi === page ? ' is-active' : '') + '" data-action="tt-page" data-page="' + pi + '">' + pi + '</button>';
    }

    var th = function (t) { return '<th>' + esc(t) + '</th>'; };
    return (
      '<div class="admin-screen mp-screen" data-screen-label="기술과제 계획관리">' +
        '<div class="mp-head">' +
          '<h2 class="mp-title">기술과제 계획관리</h2>' +
          '<div class="tt-acts">' + acts + '</div>' +
        '</div>' +
        '<div class="mp-filter"><table class="mp-filter-table tt-filter-table">' +
          '<tr>' + th('담당실') + '<td>' + ttSel('dept', F.dept, ['렘프생기실', '금형개발실']) + '</td>' +
            th('담당팀') + '<td>' + ttSel('team', F.team, ['금형기술팀', 'SF기술개발팀']) + '</td>' +
            th('상태') + '<td>' + ttSel('status', F.status, ['작성중', '결재중', '완료', '반려', '확정', '변경요청', '취소']) + '</td></tr>' +
          '<tr>' + th('과제 유형') + '<td>' + ttSel('type', F.type, ['mTRM연계', 'PTRM연계', '생산성개선']) + '</td>' +
            th('추진범위') + '<td>' + ttSel('scope', F.scope, ['선행개발', '양산적용']) + '</td>' +
            th('P/TRM') + '<td>' + ttSel('ptrm', F.ptrm, ['자체', '연계']) + '</td></tr>' +
          '<tr>' + th('추진일정') + '<td colspan="3"><div class="mp-cell-pair">' +
              '<input type="date" data-tt-field="from" value="' + esc(F.from) + '" />' +
              '<span class="tt-tilde">~</span>' +
              '<input type="date" data-tt-field="to" value="' + esc(F.to) + '" />' +
            '</div></td>' +
            th('과제명') + '<td><input type="text" data-tt-field="name" value="' + esc(F.name) + '" /></td></tr>' +
        '</table>' +
        '<div class="mp-filter-acts">' +
          '<button type="button" class="btn-dark tpa-btn-sm" data-action="tt-search"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
          '<button type="button" class="btn-outline-sm" data-action="tt-reset">초기화</button>' +
        '</div></div>' +
        '<p class="mp-total">총 <b>' + rows.length + '</b>건</p>' +
        '<div class="mp-scroll"><table class="tpa-table mp-table tt-table"><thead>' +
          '<tr><th rowspan="2"><input type="checkbox" class="pp-box" data-action="tt-toggle-all"' + (allOn ? ' checked' : '') + ' /></th>' +
            '<th rowspan="2">순번</th><th rowspan="2">담당팀</th><th rowspan="2">담당자</th><th rowspan="2">과제 유형</th>' +
            '<th rowspan="2">과제명</th><th rowspan="2">추진<br />범위</th><th colspan="2">P/TRM</th>' +
            '<th colspan="2">추진일정</th><th rowspan="2">정량목표</th><th rowspan="2">과제<br />정의서</th>' +
            '<th rowspan="2">상태</th><th rowspan="2">REV</th></tr>' +
          '<tr><th>연계유무</th><th>연계코드</th><th>계획보고</th><th>완료보고</th></tr>' +
        '</thead><tbody>' + body + '</tbody></table></div>' +
        '<div class="pp-pager">' +
          '<button type="button" class="pp-pg" data-action="tt-page" data-page="1">&laquo;</button>' +
          '<button type="button" class="pp-pg" data-action="tt-page" data-page="' + (page - 1) + '">&lsaquo;</button>' +
          pgBtns +
          '<button type="button" class="pp-pg" data-action="tt-page" data-page="' + (page + 1) + '">&rsaquo;</button>' +
          '<button type="button" class="pp-pg" data-action="tt-page" data-page="' + pages + '">&raquo;</button>' +
        '</div>' +
        (state.ttModalId ? renderTtDetailModal(state) : '') +
      '</div>'
    );
  }

  // ---------- 관리자 > 공법기본관리 > 마스터 (stdprc-m 표준공정 / stdwork-m 표준 작업명) ----------
  // 근거: design-import/생기포털 v3.dc.html isSmStd/isSmWork 블록 / smVals / smRows.
  // 두 화면은 라벨만 다른 동일 구조의 편집 그리드(행 추가/저장/삭제 + 필터).
  var SM = global.PNDES.mock.sm;

  // 기본 데이터 + 신규 추가분(extra) - 삭제분(del), 사용여부 덮어쓰기(use) 반영 (v3 smRows).
  function smRows(state, key) {
    var st = state.sm[key];
    var base = key === 'std' ? SM.std : SM.work;
    return st.extra.concat(base)
      .filter(function (r) { return st.del.indexOf(r.id) < 0; })
      .map(function (r) { return st.use[r.id] ? $.extend({}, r, { use: st.use[r.id] }) : r; });
  }

  function smVisible(state, key) {
    var A = state.sm[key].A;
    return smRows(state, key).filter(function (r) {
      return r.isNew || ((A.group === '전체' || r.group === A.group) &&
        (A.product === '전체' || r.product === A.product) &&
        (!A.name || r.ko.indexOf(A.name) >= 0 || r.en.toLowerCase().indexOf(A.name.toLowerCase()) >= 0));
    });
  }

  function smUniq(base, key) {
    var seen = [];
    base.forEach(function (r) { if (seen.indexOf(r[key]) < 0) seen.push(r[key]); });
    return seen;
  }

  function renderSmRegisterModal(state) {
    var f = state.smPopF;
    var sel = function (k, options, placeholder) {
      return '<select data-smpop-field="' + k + '"><option value="">' + esc(placeholder) + '</option>' +
        options.map(function (o) {
          return '<option value="' + esc(o) + '"' + (o === f[k] ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join('') + '</select>';
    };
    var txt = function (k) {
      return '<input type="text" data-smpop-field="' + k + '" value="' + esc(f[k]) + '" />';
    };
    return (
      '<div class="rm-modal-overlay" data-action="smpop-close">' +
        '<div class="rm-modal-box sm-pop">' +
          '<div class="rm-modal-header-navy"><h3>표준공정 등록</h3>' +
            '<button type="button" class="rm-modal-close" data-action="smpop-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-body">' +
            '<table class="tpa-table mp-info-table"><tbody>' +
              '<tr><th>제품군 <span class="mm-req">*</span></th><td>' + sel('group', SM.popGroups, '선택') + '</td></tr>' +
              '<tr><th>제품 <span class="mm-req">*</span></th><td>' + sel('product', SM.popProducts, '선택') + '</td></tr>' +
              '<tr><th>표준공정명(한글) <span class="mm-req">*</span></th><td>' + txt('name') + '</td></tr>' +
              '<tr><th>표준공정명(영문) <span class="mm-req">*</span></th><td>' + txt('en') + '</td></tr>' +
              '<tr><th>Best Practice <span class="mm-req">*</span></th><td>' + txt('bp') + '</td></tr>' +
            '</tbody></table>' +
            '<div class="tm-actions">' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="smpop-save">저장</button>' +
              '<button type="button" class="btn-outline-sm" data-action="smpop-close">닫기</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSm(state, view) {
    var isStd = view === 'stdprc-m';
    var key = isStd ? 'std' : 'work';
    var base = isStd ? SM.std : SM.work;
    var st = state.sm[key];
    var rows = smVisible(state, key);
    var allOn = rows.length > 0 && rows.every(function (r) { return st.chk[r.id]; });
    var nameLabel = isStd ? '표준공정명' : '표준 작업명';
    var sel = function (k, options) {
      return '<select data-sm-field="' + k + '" data-key="' + key + '"><option value="전체">전체</option>' +
        options.map(function (o) {
          return '<option value="' + esc(o) + '"' + (o === st.F[k] ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join('') + '</select>';
    };
    var body = rows.length
      ? rows.map(function (r, i) {
          var cell = function (field, value) {
            return r.isNew
              ? '<td><input type="text" data-smrow-field="' + field + '" data-key="' + key + '" data-id="' + esc(r.id) + '" value="' + esc(value) + '" /></td>'
              : '<td class="mp-left">' + esc(value) + '</td>';
          };
          return '<tr>' +
            '<td data-action="sm-check" data-key="' + key + '" data-id="' + esc(r.id) + '"><input type="checkbox" class="pp-box"' + (st.chk[r.id] ? ' checked' : '') + ' /></td>' +
            '<td>' + (i + 1) + '</td><td>' + esc(r.group) + '</td><td>' + esc(r.product) + '</td>' +
            cell('ko', r.ko) + cell('en', r.en) + cell('bp', r.bp) +
            '<td>' + esc(r.status) + '</td>' +
            '<td><select data-sm-use data-key="' + key + '" data-id="' + esc(r.id) + '">' +
              ['Y', 'N'].map(function (o) {
                return '<option value="' + o + '"' + (o === r.use ? ' selected' : '') + '>' + o + '</option>';
              }).join('') + '</select></td>' +
            '<td>' + esc(r.writer) + '</td><td class="mp-nowrap">' + esc(r.at) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="11" class="mm-empty">조회된 데이터가 없습니다.</td></tr>';
    return (
      '<div class="admin-screen mp-screen" data-screen-label="' + (isStd ? '제품별 표준공정 마스터' : '표준 작업명 관리 마스터') + '">' +
        '<div class="mp-head">' +
          '<h2 class="mp-title">' + (isStd ? '제품별 표준공정 마스터' : '표준 작업명 관리 마스터') + '</h2>' +
          '<div class="mp-head-btns">' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="sm-add" data-key="' + key + '">행 추가</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="sm-save" data-key="' + key + '">저장</button>' +
            '<button type="button" class="btn-outline-sm" data-action="sm-del" data-key="' + key + '">삭제</button>' +
            '<button type="button" class="btn-excel" data-action="sm-excel">엑셀</button>' +
          '</div>' +
        '</div>' +
        '<div class="mp-filter"><table class="mp-filter-table cmp-filter-table"><tr>' +
          '<th>제품군</th><td>' + sel('group', smUniq(base, 'group')) + '</td>' +
          '<th>제품</th><td>' + sel('product', smUniq(base, 'product')) + '</td>' +
          '<th>' + esc(nameLabel) + '</th><td><input type="text" data-sm-field="name" data-key="' + key + '" value="' + esc(st.F.name) + '" /></td>' +
        '</tr></table>' +
        '<div class="mp-filter-acts">' +
          '<button type="button" class="btn-dark tpa-btn-sm" data-action="sm-search" data-key="' + key + '"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
        '</div></div>' +
        '<p class="mp-total">총 <b>' + rows.length + '</b>건</p>' +
        '<div class="mp-scroll"><table class="tpa-table mp-table sm-table"><thead>' +
          '<tr><th rowspan="2"><input type="checkbox" class="pp-box" data-action="sm-toggle-all" data-key="' + key + '"' + (allOn ? ' checked' : '') + ' /></th>' +
            '<th rowspan="2">NO</th><th rowspan="2">제품군</th><th rowspan="2">제품</th>' +
            '<th colspan="2">' + esc(nameLabel) + '</th>' +
            '<th rowspan="2">Best Practice<br />주요내용</th><th rowspan="2">상태</th>' +
            '<th rowspan="2">사용여부</th><th rowspan="2">등록자</th><th rowspan="2">등록일시</th></tr>' +
          '<tr><th>(한글)</th><th>(영문)</th></tr>' +
        '</thead><tbody>' + body + '</tbody></table></div>' +
        (isStd && state.smPop ? renderSmRegisterModal(state) : '') +
      '</div>'
    );
  }

  // ---------- SCR-010 Tech PR 관리자 ----------
  // 근거: design-import/생기포털 v3.dc.html isTechPrAdmin — 필터(분과/BU/적용공장/기술태그) + "Tech PR 등록" 표 +
  // "기술태그 Master Table" + 신규등록 팝업 + 기술태그 추가 팝업. (README #11은 이전 화면 설명이라 v3를 따름)
  var TPA = global.PNDES.mock.scr010;

  function tpaChips(tags) {
    return '<div class="tpa-chips">' + (tags || []).map(function (t) { return '<span class="tpa-chip">' + esc(t) + '</span>'; }).join('') + '</div>';
  }

  function renderTpaFilterSelect(label, key) {
    return '<span class="tpa-filter-label">' + esc(label) + '</span><select aria-label="' + esc(label) + '">' +
      TPA.filterOptions[key].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
  }

  // 신규등록 팝업. 입력 중인 글자(기술명/BU/일정)는 app.js가 state.tpaForm에 그때그때 보관하므로
  // 연관 과제 추가·삭제 등으로 다시 그려져도 유지된다.
  function renderTpaRegisterModal(state) {
    var f = state.tpaForm;
    var taskOptions = Object.keys(TPA.taskDb);
    var blocks = f.tasks.map(function (t, i, arr) {
      var info = TPA.taskDb[t] || {};
      var options = '<option value="">선택</option>' + taskOptions.map(function (o) {
        return '<option' + (o === t ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('');
      return '<div class="tpa-block">' +
        '<div class="tpa-block-btns">' +
          (arr.length < 3 ? '<button type="button" data-action="tpa-task-add" title="연관 과제 추가">+</button>' : '') +
          (arr.length > 1 ? '<button type="button" data-action="tpa-task-remove" data-index="' + i + '" title="연관 과제 삭제">&minus;</button>' : '') +
        '</div>' +
        '<table class="rm-info-table tpa-form-table"><tbody>' +
          '<tr><th>연관 과제 ' + (i + 1) + '</th><td colspan="3"><select data-action="tpa-task-select" data-index="' + i + '">' + options + '</select></td></tr>' +
          '<tr><th>분과</th><td>' + esc(info.dept || '자동입력') + '</td><th>연계 mTRM</th><td>' + esc(info.mtrm || '자동입력') + '</td></tr>' +
          '<tr><th>적용공장</th><td>' + esc(info.factory || '자동입력') + '</td><th>담당실/담당자</th><td><span class="tpa-owner"><span class="tpa-icon-btn"><i class="fas fa-search"></i></span>' + esc(info.owner || TPA.defaultOwner) + '</span></td></tr>' +
          '<tr><th>BU</th><td colspan="3"><input type="text" data-tpa-field="bu" data-index="' + i + '" value="' + esc(f.bus[i] || '') + '" /></td></tr>' +
        '</tbody></table>' +
      '</div>';
    }).join('');

    var hashTags = f.hashTags.map(function (t, i) {
      return '<span class="tpa-chip tpa-chip-lg">' + esc(t) + '<button type="button" data-action="tpa-hashtag-remove" data-index="' + i + '" title="태그 삭제">&#10005;</button></span>';
    }).join('');

    var mediaRows = [0, 1, 2].map(function (i) {
      var name = f.media[i];
      return '<tr><th>표출 동영상' + (i + 1) + '</th><td><div class="tpa-media-row">' +
        '<button type="button" class="btn-navy tpa-btn-sm" data-action="tpa-media-pick" data-index="' + i + '">파일선택</button>' +
        (name
          ? '<span class="tpa-media-file"><i class="fas fa-film"></i><span>' + esc(name) + '</span><button type="button" data-action="tpa-media-remove" data-index="' + i + '" title="파일 삭제">&#10005;</button></span>'
          : '<span class="tpa-muted">선택된 파일 없음 (mp4, 최대 500MB)</span>') +
      '</div></td></tr>';
    }).join('');
    var mediaCount = f.media.filter(function (m) { return !!m; }).length;

    return (
      '<div class="rm-modal-overlay" data-action="tpa-close-register">' +
        '<div class="rm-modal-box">' +
          '<div class="rm-modal-header-dark"><h3>신규등록</h3></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-outline-sm"><i class="fas fa-trash" style="font-size:10px;margin-right:4px"></i>중복</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="tpa-save-register">수정/저장</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="tpa-close-register">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body tpa-modal-body">' +
            '<table class="rm-info-table tpa-form-table"><tbody>' +
              '<tr><th>기술명</th><td><input type="text" data-tpa-field="title" value="' + esc(f.title) + '" /></td></tr>' +
            '</tbody></table>' +
            blocks +
            '<table class="rm-info-table tpa-form-table"><tbody>' +
              '<tr><th>기술태그</th><td><div class="tpa-chips tpa-chips-left">' + hashTags + '</div></td></tr>' +
              '<tr><th>일정</th><td><div class="rm-date-range"><input type="date" data-tpa-field="start" value="' + esc(f.start) + '" /><span>-</span><input type="date" data-tpa-field="end" value="' + esc(f.end) + '" /></div></td></tr>' +
              mediaRows +
              '<tr><th>등록 현황</th><td>표출 동영상 <strong class="tpa-count">' + mediaCount + '</strong> / 3개 &middot; 등록 순서대로 상세 팝업에 최대 3개 노출</td></tr>' +
              '<tr><th style="vertical-align:top">기존 첨부파일</th><td>' +
                '<div class="tpa-attach-head"><label><input type="checkbox" />전체선택</label>' +
                  '<div class="tpa-attach-tools"><span>총0건 <strong>10G/10G</strong></span>' +
                    '<span class="tpa-icon-btn"><i class="fas fa-plus"></i></span><span class="tpa-icon-btn"><i class="fas fa-download"></i></span>' +
                    '<span class="tpa-icon-btn"><i class="fas fa-upload"></i></span><span class="tpa-icon-btn tpa-icon-btn-danger"><i class="fas fa-trash"></i></span>' +
                  '</div></div>' +
                '<p class="tpa-muted" style="margin:0">innorix 첨부파일 팝업 참조</p>' +
              '</td></tr>' +
            '</tbody></table>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderTpaTagModal(state) {
    var t = state.tpaTagAdd;
    var chips = t.draft.length
      ? t.draft.map(function (c, i) { return '<span class="tpa-chip tpa-chip-draft">' + esc(c) + '<button type="button" data-action="tpa-tag-chip-remove" data-index="' + i + '" title="태그 삭제">&#10005;</button></span>'; }).join('')
      : '<span class="tpa-muted">입력한 태그가 여기에 표시됩니다.</span>';
    var suggest = TPA.tagSuggest.map(function (c) { return '<button type="button" class="tpa-suggest" data-action="tpa-tag-suggest" data-tag="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
    return (
      '<div class="rm-modal-overlay">' +
        '<div class="rm-modal-box" style="max-width:680px">' +
          '<div class="rm-modal-header-navy"><h3>기술태그 추가</h3><button type="button" class="rm-modal-close" data-action="tpa-tag-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="tpa-tag-save">저장</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="tpa-tag-close">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body">' +
            '<table class="rm-info-table tpa-form-table"><tbody>' +
              '<tr><th>기술태그<span class="tpa-required">*</span></th><td>' +
                '<div class="tpa-tag-input-row"><input type="text" id="tpa-tag-input" data-tpa-tag-field="input" value="' + esc(t.input) + '" placeholder="태그 입력 후 Enter (예: AI → #AI)" />' +
                '<button type="button" class="btn-outline-sm" data-action="tpa-tag-chip-add">추가</button></div>' +
                '<div class="tpa-chips tpa-chips-left" style="margin-top:8px;min-height:26px">' + chips + '</div>' +
              '</td></tr>' +
              '<tr><th>추천 태그</th><td><div class="tpa-chips tpa-chips-left">' + suggest + '</div></td></tr>' +
              '<tr><th>설명</th><td><textarea rows="3" data-tpa-tag-field="desc" placeholder="태그 용도/적용 범위를 입력하세요.">' + esc(t.desc) + '</textarea></td></tr>' +
              '<tr><th>사용여부</th><td><div class="tpa-radio-row"><label><input type="radio" name="tpaTagUse" checked />사용</label><label><input type="radio" name="tpaTagUse" />미사용</label></div></td></tr>' +
              '<tr><th>등록자</th><td>' + esc(TPA.defaultOwner) + '</td></tr>' +
            '</tbody></table>' +
            '<p class="tpa-muted">※ 저장 시 기술태그 Master Table에 추가되며, Tech PR 등록 시 기술태그 선택지로 사용됩니다.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSCR010(state) {
    var rows = state.tpaRows.map(function (r) {
      return '<tr class="tpa-row-clickable" data-action="tpa-open-register">' +
        '<td class="muted">' + esc(r.no) + '</td><td>' + esc(r.dept) + '</td><td class="tpa-bu">' + esc(r.bu) + '</td><td>' + esc(r.factory) + '</td>' +
        '<td>' + tpaChips(r.tags) + '</td><td>' + esc(r.name) + '</td><td>' + esc(r.prio) + '</td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="7" class="muted">데이터가 없습니다.</td></tr>';
    var tagRows = state.tpaTagRows.map(function (r) {
      return '<tr><td>' + tpaChips(r.tags) + '</td><td class="muted">' + esc(r.regDate) + '</td><td class="muted">' + esc(r.modDate) + '</td></tr>';
    }).join('') || '<tr><td colspan="3" class="muted">데이터가 없습니다.</td></tr>';

    return (
      '<div class="admin-screen" data-screen-label="SCR-010 Tech PR 관리자">' +
        '<section class="tpa-filter">' +
          renderTpaFilterSelect('분과', 'div') + renderTpaFilterSelect('BU', 'bu') +
          renderTpaFilterSelect('적용공장', 'factory') + renderTpaFilterSelect('기술태그', 'tag') +
          '<button type="button" class="btn-dark" data-action="tpa-search"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
        '</section>' +
        '<section class="tpa-section">' +
          '<div class="tpa-section-head"><h3><i class="fas fa-caret-right"></i>Tech PR 등록</h3>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="tpa-open-register">신규등록</button></div>' +
          '<table class="tpa-table"><thead><tr><th style="width:96px">과제번호</th><th>분과</th><th>BU</th><th>적용공장</th><th>기술태그</th><th>기술명</th><th style="width:96px">우선순위</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table>' +
        '</section>' +
        '<section class="tpa-section">' +
          '<div class="tpa-section-head"><h3><i class="fas fa-caret-right"></i>기술태그 Master Table</h3>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="tpa-tag-open">추가</button></div>' +
          '<table class="tpa-table"><thead><tr><th>기술태그</th><th style="width:208px">등록일</th><th style="width:208px">최근수정일</th></tr></thead>' +
          '<tbody>' + tagRows + '</tbody></table>' +
        '</section>' +
        (state.tpaRegisterOpen ? renderTpaRegisterModal(state) : '') +
        (state.tpaTagAdd.open ? renderTpaTagModal(state) : '') +
      '</div>'
    );
  }

  // ---------- SCR-011 mTRM 협의체 ----------
  // 근거: design-import/생기포털 v3.dc.html isMtrmCouncil — 필터(기간/진행상태) + "mTRM 협의회 이력" 표 +
  // 상세현황 팝업 + 신규등록 팝업(메일 발송 미리보기 포함). (README #12는 이전 화면 설명이라 v3를 따름)
  var CM = global.PNDES.mock.scr011;

  function renderAttachRow(label, withAddButtons) {
    return '<table class="rm-info-table tpa-form-table"><tbody><tr><th>' + esc(label) + '</th><td>' +
      '<div class="tpa-attach-head"><label><input type="checkbox" />전체선택</label>' +
        '<div class="tpa-attach-tools"><span>총0건 <strong class="cm-quota">10G/10G</strong></span>' +
          (withAddButtons ? '<span class="tpa-icon-btn"><i class="fas fa-plus"></i></span><span class="tpa-icon-btn tpa-icon-btn-danger"><i class="fas fa-times"></i></span>' : '') +
          '<span class="tpa-icon-btn"><i class="fas fa-download"></i></span><span class="tpa-icon-btn tpa-icon-btn-danger"><i class="fas fa-trash"></i></span>' +
        '</div></div>' +
      '<p class="tpa-muted" style="margin:0">innorix 첨부파일 팝업 참조</p>' +
    '</td></tr></tbody></table>';
  }

  function renderCouncilDetailModal(state) {
    var r = state.councilRows[state.councilDetailIndex] || {};
    var detailRows = CM.detailRows.map(function (d) {
      var cell = function (v) { return v ? esc(v) : '<textarea rows="2"></textarea>'; };
      return '<tr><td class="cm-rowbtns"><span class="cm-round-btn">+</span><span class="cm-round-btn">&minus;</span></td>' +
        '<td>' + cell(d.agenda) + '</td><td>' + cell(d.opinion) + '</td></tr>';
    }).join('');
    return (
      '<div class="rm-modal-overlay">' +
        '<div class="rm-modal-box">' +
          '<div class="rm-modal-header-dark"><h3>상세현황</h3></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-navy tpa-btn-sm">수정</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm">저장</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="council-close-detail">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body tpa-modal-body">' +
            '<table class="rm-info-table cm-info-row"><tbody><tr>' +
              '<th>회의완료일</th><td>' + esc(r.doneDate || '-') + '</td>' +
              '<th>등록자</th><td>' + esc(CM.detailRegistrant) + '</td>' +
              '<th>참석분과</th><td>' + esc(r.dept || '') + '</td>' +
              '<th>상태</th><td>' + esc(r.status || '') + '</td>' +
            '</tr></tbody></table>' +
            '<table class="rm-info-table cm-agenda-table"><thead><tr><th class="cm-rowbtns"></th><th>안건</th><th>의견</th></tr></thead><tbody>' + detailRows + '</tbody></table>' +
            renderAttachRow('첨부', false) +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 발송 미리보기: 입력값이 바뀔 때마다 app.js가 이 조각만 다시 그린다(입력창 포커스를 잃지 않도록)
  function renderCouncilMailPreview(f) {
    var to = f.recipients.slice();
    if (f.dept && to.indexOf(f.dept + ' 분과') === -1) to.push(f.dept + ' 분과');
    var agendas = f.agendas.map(function (x) { return (x.agenda || '').trim(); }).filter(function (x) { return !!x; });
    var agendaHtml = agendas.length
      ? '<ol class="cm-prev-agenda">' + agendas.map(function (t, i) { return '<li><span>' + (i + 1) + '.</span><span>' + esc(t) + '</span></li>'; }).join('') + '</ol>'
      : '<span class="tpa-muted">등록된 사전안건이 없습니다.</span>';
    return (
      '<div class="cm-preview">' +
        '<div class="cm-prev-head"><span>PNDES 생기포털</span><span>mTRM 협의체 회의 안내</span></div>' +
        '<div class="cm-prev-body">' +
          '<div class="cm-prev-meta">' +
            '<p><span>받는 사람</span><span>' + esc(to.length ? to.join(', ') : '(수신자를 추가하세요)') + '</span></p>' +
            '<p><span>제목</span><strong>' + esc(f.subject) + '</strong></p>' +
          '</div>' +
          '<p class="cm-prev-text">' + esc(f.body) + '</p>' +
          '<table class="cm-prev-table"><tbody>' +
            '<tr><th>회의예정일</th><td>' + esc(f.schedule ? f.schedule.replace(/-/g, '.') : '미정') + '</td><th>참석분과</th><td>' + esc(f.dept || '미선택') + '</td></tr>' +
            '<tr><th style="vertical-align:top">사전안건</th><td colspan="3">' + agendaHtml + '</td></tr>' +
            '<tr><th>첨부</th><td colspan="3" class="tpa-muted">첨부파일 0건 (첨부 영역에서 등록한 파일이 함께 전달됩니다)</td></tr>' +
          '</tbody></table>' +
          '<div class="cm-prev-cta"><span>생기포털에서 안건 확인하기</span></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderCouncilRegisterModal(state) {
    var f = state.councilForm;
    var deptOptions = '<option value="">선택</option>' + CM.deptOptions.map(function (o) { return '<option' + (o === f.dept ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
    var agendaRows = f.agendas.map(function (x, i) {
      return '<tr><td class="cm-rowbtns">' +
          '<button type="button" class="cm-round-btn" data-action="council-agenda-add" data-index="' + i + '" title="아래에 행 추가">+</button>' +
          '<button type="button" class="cm-round-btn" data-action="council-agenda-remove" data-index="' + i + '" title="행 삭제">&minus;</button>' +
        '</td>' +
        '<td><input type="text" style="text-align:center" data-cm-field="agenda" data-index="' + i + '" value="' + esc(x.agenda) + '" /></td>' +
        '<td><input type="text" data-cm-field="note" data-index="' + i + '" value="' + esc(x.note) + '" /></td></tr>';
    }).join('');
    var recipients = f.recipients.map(function (r, i) {
      return '<span class="tpa-chip tpa-chip-lg">' + esc(r) + '<button type="button" data-action="council-recipient-remove" data-index="' + i + '" title="수신자 삭제">&#10005;</button></span>';
    }).join('');
    return (
      '<div class="rm-modal-overlay" data-action="council-close-register">' +
        '<div class="rm-modal-box">' +
          '<div class="rm-modal-header-dark"><h3>신규등록</h3></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="council-save-register">전달</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="council-close-register">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body tpa-modal-body">' +
            '<table class="rm-info-table cm-info-row"><tbody><tr>' +
              '<th>회의예정일</th><td><input type="date" data-cm-field="schedule" value="' + esc(f.schedule) + '" /></td>' +
              '<th>등록자</th><td><span class="tpa-owner"><span class="tpa-icon-btn"><i class="fas fa-search"></i></span>' + esc(CM.registrant) + '</span></td>' +
              '<th>참석분과</th><td><select data-cm-field="dept">' + deptOptions + '</select></td>' +
            '</tr></tbody></table>' +
            '<table class="rm-info-table cm-agenda-table"><thead><tr><th class="cm-rowbtns"></th><th>사전안건</th><th>비고</th></tr></thead><tbody>' + agendaRows + '</tbody></table>' +
            renderAttachRow('첨부', true) +
            '<table class="rm-info-table tpa-form-table"><tbody>' +
              '<tr><th>수신자</th><td><div class="tpa-chips tpa-chips-left" style="align-items:center"><button type="button" class="tpa-icon-btn" data-action="mt-open" data-target="council" title="메일알림 대상 검색"><i class="fas fa-search"></i></button>' + recipients + '<span class="tpa-muted" style="font-size:11px">참석분과 담당자 자동 포함</span></div></td></tr>' +
              '<tr><th>메일 제목</th><td><input type="text" data-cm-field="subject" value="' + esc(f.subject) + '" /></td></tr>' +
              '<tr><th>전달 내용</th><td>' +
                '<textarea rows="7" data-cm-field="body" maxlength="' + CM.mailBodyMax + '">' + esc(f.body) + '</textarea>' +
                '<div class="cm-body-foot"><span class="tpa-muted">회의예정일 &middot; 참석분과 &middot; 사전안건 &middot; 첨부는 아래 미리보기처럼 본문에 자동 포함됩니다.</span>' +
                  '<span class="cm-body-foot-right"><span class="tpa-muted" id="cm-body-len">' + f.body.length + ' / ' + CM.mailBodyMax + '자</span>' +
                  '<button type="button" class="btn-outline-sm" data-action="council-mail-reset">기본 문구</button></span></div>' +
              '</td></tr>' +
              '<tr><th>발송 미리보기</th><td class="cm-preview-cell" id="cm-preview-slot">' + renderCouncilMailPreview(f) + '</td></tr>' +
            '</tbody></table>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSCR011(state) {
    var applied = state.councilApplied || '';
    var list = state.councilRows.filter(function (r) { return !applied || r.status === applied; });
    var rows = list.map(function (r) {
      return '<tr class="tpa-row-clickable" data-action="council-open-detail" data-index="' + state.councilRows.indexOf(r) + '">' +
        '<td class="cm-no">' + esc(r.no) + '</td><td>' + esc(r.title) + '</td><td>' + esc(r.regDate) + '</td>' +
        '<td>' + esc(r.planDate) + '</td><td>' + esc(r.doneDate) + '</td><td>' + esc(r.status) + '</td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="6" class="muted">데이터가 없습니다.</td></tr>';
    var statusOptions = '<option value="">전체</option>' + CM.statusOptions.map(function (o) {
      return '<option' + (state.councilFilter === o ? ' selected' : '') + '>' + esc(o) + '</option>';
    }).join('');

    return (
      '<div class="admin-screen" data-screen-label="SCR-011 mTRM 협의체">' +
        '<section class="tpa-filter">' +
          '<span class="tpa-filter-label">기간</span>' +
          '<div class="rm-date-range"><input type="date" aria-label="시작일" /><span>~</span><input type="date" aria-label="종료일" /></div>' +
          '<span class="tpa-filter-label">진행상태</span><select aria-label="진행상태" data-action="council-filter">' + statusOptions + '</select>' +
          '<button type="button" class="btn-dark" data-action="council-search"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
        '</section>' +
        '<section class="tpa-section">' +
          '<div class="tpa-section-head"><h3><i class="fas fa-caret-right"></i>mTRM 협의회 이력</h3>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="council-open-register">신규 등록</button></div>' +
          '<div class="cm-table-scroll"><table class="tpa-table cm-table"><thead><tr>' +
            '<th style="width:128px">회의번호</th><th>회의제목</th><th style="width:112px">등록일</th><th style="width:112px">회의예정일</th><th style="width:112px">회의완료일</th><th style="width:112px">상태</th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '</section>' +
        (state.councilDetailIndex != null ? renderCouncilDetailModal(state) : '') +
        (state.councilForm.open ? renderCouncilRegisterModal(state) : '') +
        renderMailTargetLayer(state) +
      '</div>'
    );
  }

  // ---------- SCR-012 mTRM 관리 ----------
  // 근거: v3.dc.html isMtrmMgmt — 필터(분과/로드맵/기간) + 표 3종(기술과제등록 목록 / mTRM 정보 / 분과 Master Table)
  // + 팝업 6종(신규등록, 조회 선택, 버전관리, 요약 2종, 분과 변경, 분과장 관리). README #13은 이전 버전 화면이라 v3를 따른다.

  var MM = global.PNDES.mock.scr012;
  var MM_STATE_KIND = { '작성중': 'draft', '결재중': 'approval', '완료': 'done', '반려': 'reject', '확정': 'fixed', '변경요청': 'change', '취소': 'cancel' };
  var MM_PHASE_KIND = { P1: 'p1', P2: 'p2', P3: 'p3', P4: 'p4' };

  function mmStateBadge(s) {
    return '<span class="mm-st mm-st-' + (MM_STATE_KIND[s] || 'draft') + '">' + esc(s) + '</span>';
  }
  function mmEmptyRow(colspan) {
    return '<tr><td colspan="' + colspan + '" class="mm-empty">데이터가 없습니다.</td></tr>';
  }
  function mmOptions(list, selected) {
    return list.map(function (o) { return '<option value="' + esc(o) + '"' + (o === selected ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
  }
  function mmSumStatusMap() {
    var map = {};
    MM.sumStatusDef.forEach(function (s) { map[s[0]] = { color: s[2], bg: s[3], fg: s[4] }; });
    return map;
  }

  // 로드맵 요약 — 분과 x 상태 교차표 (v3 rmSumStatusIcons/rmSumRows 대응)
  // state.mmRmSort: null|'total' = 합계 내림차순, 0..n = 해당 상태 열 내림차순
  function renderMmRmCrossTable(state) {
    var cols = MM.rmStatusCols;
    var rows = MM.rmBigRaw.map(function (r) {
      var counts = r[1].slice(0, cols.length);
      return { dept: r[0], counts: counts, total: counts.reduce(function (a, b) { return a + b; }, 0) };
    });
    var sortKey = state.mmRmSort == null ? 'total' : state.mmRmSort;
    var sorted = rows.slice().sort(function (a, b) {
      return sortKey === 'total' ? b.total - a.total : b.counts[sortKey] - a.counts[sortKey];
    });
    var grand = rows.reduce(function (a, r) { return a + r.total; }, 0);
    var maxTotal = Math.max.apply(null, rows.map(function (r) { return r.total; }));
    var colTotals = cols.map(function (_, ci) {
      return rows.reduce(function (a, r) { return a + r.counts[ci]; }, 0);
    });

    var head = cols.map(function (c, ci) {
      var on = sortKey === ci;
      return '<th class="mm-rm-th"><button type="button" class="mm-rm-sort' + (on ? ' mm-rm-sort-on' : '') + '"' +
        ' data-action="mm-rm-sort" data-key="' + ci + '"><i class="' + MM.rmStatusIcon[c] + '"></i>' + esc(c) +
        '<span class="mm-rm-mark">' + (on ? '▼' : '') + '</span></button></th>';
    }).join('');
    var headTotal = '<th class="mm-rm-th mm-rm-th-total"><button type="button" class="mm-rm-sort mm-rm-sort-right' +
      (sortKey === 'total' ? ' mm-rm-sort-on' : '') + '" data-action="mm-rm-sort" data-key="total">합계' +
      '<span class="mm-rm-mark">' + (sortKey === 'total' ? '▼' : '') + '</span></button></th>';

    var body = sorted.map(function (r) {
      var cells = r.counts.map(function (v, ci) {
        return '<td class="mm-rm-cell" title="' + esc(r.dept + ' · ' + cols[ci] + ' ' + v + '건') + '">' +
          '<span class="mm-rm-v">' + v + '</span></td>';
      }).join('');
      return '<tr class="mm-rm-row"><td class="mm-rm-dept">' + esc(r.dept) + '</td>' + cells +
        '<td class="mm-rm-total"><div class="mm-rm-total-wrap">' +
          '<div class="mm-rm-total-track"><div class="mm-rm-total-bar" style="width:' + ((r.total / maxTotal) * 100) + '%"></div></div>' +
          '<span class="mm-rm-total-v">' + r.total + '</span></div></td></tr>';
    }).join('');

    var foot = colTotals.map(function (v) {
      return '<td class="mm-rm-foot-cell"><b>' + v + '</b><span>' + ((v / grand) * 100).toFixed(0) + '%</span></td>';
    }).join('');

    return '<div class="mm-sum-panel">' +
      '<div class="mm-sum-panel-head mm-rm-head"><p>분과별 로드맵 상태 <span class="mm-rm-grand">전체 ' + grand + '건</span></p>' +
        '<span class="mm-rm-hint"><i class="mm-rm-dot"></i>상태 헤더 클릭 시 해당 상태 기준 정렬</span></div>' +
      '<div class="mm-scroll mm-scroll-plain"><table class="mm-rm-table">' +
        '<thead><tr><th class="mm-rm-th mm-rm-th-dept">분과</th>' + head + headTotal + '</tr></thead>' +
        '<tbody>' + body + '</tbody>' +
        '<tfoot><tr><td class="mm-rm-foot-dept">합계</td>' + foot +
          '<td class="mm-rm-foot-total"><b>' + grand + '</b></td></tr></tfoot>' +
      '</table></div>' +
    '</div>';
  }
  // 'YYYY.MM.DD' 두 날짜 사이의 일수 (기준일 - 대상일)
  function mmDaysBetween(base, target) {
    var p = function (d) { var a = d.split('.'); return new Date(Number(a[0]), Number(a[1]) - 1, Number(a[2])); };
    return Math.round((p(base) - p(target)) / 86400000);
  }
  function mmPickerCell(kind, label, emptyLabel) {
    return '<div class="tpa-owner"><button type="button" class="tpa-icon-btn mm-icon-btn" data-action="mm-picker-open" data-kind="' + kind + '" title="조회"><i class="fas fa-search"></i></button>' +
      '<span class="mm-picked">' + esc(label || emptyLabel) + '</span></div>';
  }

  // 신규등록 팝업 (mTRM 블록 2개, 결정 협의체/연계 mTRM은 조회 선택 팝업으로 지정)
  function renderMmRegisterModal(state) {
    var blocks = state.mmForm.blocks.map(function (b, i) {
      var field = function (key) { return ' data-mm-field="' + key + '" data-index="' + i + '"'; };
      return '<div class="tpa-block">' +
        '<div class="tpa-block-btns mm-block-btns"><button type="button" title="mTRM 추가">+</button>' + (i > 0 ? '<button type="button" title="mTRM 삭제">&minus;</button>' : '') + '</div>' +
        '<table class="rm-info-table tpa-form-table mm-reg-table"><colgroup><col style="width:112px" /><col style="width:64px" /><col /><col style="width:96px" /><col /></colgroup><tbody>' +
          '<tr><th>mTRM 명</th><th class="mm-th-sub">한글</th><td><input type="text"' + field('ko') + ' value="' + esc(b.ko) + '" /></td>' +
            '<th class="mm-th-sub">영문</th><td><input type="text"' + field('en') + ' value="' + esc(b.en) + '" /></td></tr>' +
          '<tr><th colspan="2">결정 협의체</th><td colspan="3">' + mmPickerCell('council', state.mmPickedCouncil, '선택된 협의체 없음') + '</td></tr>' +
          '<tr><th colspan="2">분과</th><td><select class="mm-reg-dept"' + field('dept') + '><option value="">선택</option>' + mmOptions(MM.regDeptOptions, b.dept) + '</select></td>' +
            '<th class="mm-th-sub">연계 mTRM</th><td>' + mmPickerCell('trm', state.mmPickedTrm, '선택된 mTRM 없음') + '</td></tr>' +
          '<tr><th colspan="2">담당실/담당자</th><td><span class="tpa-owner"><span class="tpa-icon-btn"><i class="fas fa-search"></i></span>' + esc(MM.registrant) + '</span></td>' +
            '<th class="mm-th-sub">등록일</th><td>' + esc(MM.regDate) + '</td></tr>' +
          '<tr><th colspan="2">일정</th><td colspan="3"><input type="date"' + field('date') + ' value="' + esc(b.date) + '" /></td></tr>' +
          '<tr><th colspan="2">내용</th><td colspan="3"><textarea rows="3"' + field('content') + '>' + esc(b.content) + '</textarea></td></tr>' +
          '<tr><th colspan="2">첨부파일</th><td colspan="3">' +
            '<div class="tpa-attach-head"><label><input type="checkbox" />전체선택</label>' +
              '<div class="tpa-attach-tools"><span>총0건 <strong>10G/10G</strong></span>' +
                '<span class="tpa-icon-btn"><i class="fas fa-plus"></i></span><span class="tpa-icon-btn"><i class="fas fa-download"></i></span>' +
                '<span class="tpa-icon-btn"><i class="fas fa-upload"></i></span><span class="tpa-icon-btn tpa-icon-btn-danger"><i class="fas fa-trash"></i></span>' +
              '</div></div>' +
            '<p class="tpa-muted" style="margin:0">innorix 첨부파일 팝업 참조</p>' +
          '</td></tr>' +
        '</tbody></table>' +
      '</div>';
    }).join('');

    return (
      '<div class="rm-modal-overlay mm-overlay-register" data-action="mm-close-modal">' +
        '<div class="rm-modal-box">' +
          '<div class="rm-modal-header-dark"><h3>신규등록</h3></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-save-register">결재</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-close-modal">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body tpa-modal-body mm-reg-body">' + blocks + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 조회 선택 팝업 (결정 협의체 / 연계 mTRM) — 신규등록 팝업 위에 겹쳐 뜬다
  // v3: 조회 선택 팝업이 "검색어 1칸 + 행 클릭 즉시 선택"에서
  // "라벨 2칸 필터 + 체크박스 단일선택 + 선택 버튼 확정"으로 바뀌었다.
  // 근거: design-import/생기포털 v3.dc.html pickerOpen 블록 / pkLabelA·pkLabelB·pkConfirm·pkClear.
  var MM_PK_LABEL = {
    council: { title: 'mTRM 협의체 검색', a: '회의번호', b: '회의제목' },
    trm: { title: '연계 mTRM 검색', a: '분과', b: 'mTRM' },
  };

  // 코드(좌측 열) — 협의체는 회의번호, mTRM은 분과명을 쓴다.
  function mmPkCode(kind, r, i) {
    return kind === 'council' ? 'MT-2026-00' + (i + 1) : String(r.name).split(' ')[0];
  }

  function renderMmPickerModal(state) {
    var kind = state.mmPicker;
    var L = MM_PK_LABEL[kind] || MM_PK_LABEL.trm;
    var pk = state.mmPk || { sel: '', filter: { a: '', b: '' }, applied: { a: '', b: '' } };
    var all = MM.pickerRows[kind].map(function (r, i) {
      return { no: i + 1, code: mmPkCode(kind, r, i), name: r.name, sub: r.sub };
    });
    var A = pk.applied;
    var rows = all.filter(function (r) {
      return (!A.a || r.code.indexOf(A.a) >= 0) && (!A.b || r.name.indexOf(A.b) >= 0);
    });
    var body = rows.map(function (r) {
      // 주의: tr과 내부 체크박스 양쪽에 data-action을 달면 위임이 두 번 발동해 토글이 상쇄된다.
      // 액션은 tr에만 두고 체크박스는 표시 전용(pointer-events 차단)으로 둔다.
      return '<tr class="mm-row-pick" data-action="mm-pk-pick" data-name="' + esc(r.name) + '">' +
        '<td class="mm-center"><input type="checkbox" class="mm-pk-box"' +
          (pk.sel === r.name ? ' checked' : '') + ' /></td>' +
        '<td>' + r.no + '</td><td class="mm-left">' + esc(r.code) + '</td>' +
        '<td class="mm-left mm-pick-name">' + esc(r.name) + '</td></tr>';
    }).join('');
    return (
      '<div class="rm-modal-overlay mm-overlay-center">' +
        '<div class="rm-modal-box mm-picker-box">' +
          '<div class="rm-modal-header-navy mm-picker-head"><h3>' + esc(L.title) + '</h3>' +
            '<button type="button" class="rm-modal-close" data-action="mm-picker-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="mm-picker-body">' +
            '<div class="mm-pk-acts">' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-pk-confirm"' + (pk.sel ? '' : ' disabled') + '>선택</button>' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-picker-close">닫기</button>' +
            '</div>' +
            '<div class="mm-pk-filter">' +
              '<span class="mm-pk-label">' + esc(L.a) + '</span>' +
              '<input type="text" data-pk-field="a" value="' + esc(pk.filter.a) + '" />' +
              '<span class="mm-pk-label">' + esc(L.b) + '</span>' +
              '<input type="text" data-pk-field="b" value="' + esc(pk.filter.b) + '" />' +
              '<button type="button" class="btn-dark tpa-btn-sm" data-action="mm-pk-search"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
            '</div>' +
            '<div class="mm-scroll" style="max-height:340px;min-height:160px"><table class="tpa-table mm-table mm-picker-table"><thead><tr>' +
              '<th style="width:40px"><input type="checkbox" data-action="mm-pk-clear"' + (pk.sel ? '' : ' checked') + ' /></th>' +
              '<th style="width:56px">순번</th><th class="mm-left" style="width:144px">' + esc(L.a) + '</th><th class="mm-left">' + esc(L.b) + '</th>' +
            '</tr></thead><tbody>' + (body || mmEmptyRow(4)) + '</tbody></table></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 버전관리 팝업 (+ 차이점 비교 패널)
  function renderMmVersionModal(state) {
    var picked = state.mmVerPicked;
    var rows = MM.versions.map(function (v, i) {
      var cls = 'mm-row-pick' + (v.current ? ' mm-ver-current' : '') + (picked === i ? ' mm-ver-picked' : '');
      return '<tr class="' + cls + '" data-action="mm-ver-pick" data-index="' + i + '">' +
        '<td><input type="radio" name="mmVerPick"' + (picked === i ? ' checked' : '') + ' /></td>' +
        '<td class="mm-ver-name">' + esc(v.ver) + (v.current ? ' <span class="mm-ver-badge">현재 버전</span>' : '') + '</td>' +
        '<td>' + esc(v.date) + '</td><td>' + esc(v.owner) + '</td><td class="mm-left">' + esc(v.note) + '</td></tr>';
    }).join('');

    var compare = '';
    if (state.mmVerCompare) {
      var baseIdx = picked == null ? 1 : picked;
      var base = MM.versions[baseIdx].ver;
      var cur = MM.versionSnaps[0];
      var old = MM.versionSnaps[baseIdx];
      var diffRows = MM.versionFields.map(function (fld) {
        var changed = cur[fld[0]] !== old[fld[0]];
        return '<tr' + (changed ? ' class="mm-diff-changed"' : '') + '>' +
          '<td class="mm-diff-label">' + esc(fld[1]) + '</td>' +
          '<td class="mm-diff-old">' + esc(old[fld[0]]) + '</td><td class="mm-diff-cur">' + esc(cur[fld[0]]) + '</td>' +
          '<td class="mm-center"><span class="mm-diff-tag">' + (changed ? '변경' : '동일') + '</span></td></tr>';
      }).join('');
      compare =
        '<div class="mm-diff">' +
          '<div class="mm-diff-head"><p>차이점 비교 <span>' + esc(base) + ' ↔ Ver. 3 (현재)</span></p>' +
            '<div class="mm-diff-legend"><span class="mm-diff-legend-old">이전값</span><span class="mm-diff-legend-cur">현재값</span>' +
              '<span class="mm-diff-legend-box"></span><span>변경 항목</span>' +
              '<button type="button" data-action="mm-ver-compare-close" title="비교 닫기"><i class="fas fa-times"></i></button></div></div>' +
          (baseIdx === 0
            ? '<div class="mm-diff-same">현재 버전을 선택했습니다. 비교할 이전 버전을 선택하세요.</div>'
            : '<table class="mm-diff-table"><thead><tr><th style="width:128px">항목</th><th>' + esc(base) + '</th><th>Ver. 3 (현재)</th><th style="width:80px">구분</th></tr></thead>' +
              '<tbody>' + diffRows + '</tbody></table>') +
        '</div>';
    }

    return (
      '<div class="rm-modal-overlay">' +
        '<div class="rm-modal-box" style="max-width:768px">' +
          '<div class="rm-modal-header-navy"><h3>버전관리</h3><button type="button" class="rm-modal-close" data-action="mm-close-modal"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-outline-sm mm-btn-outline" data-action="mm-ver-compare">차이점 비교</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-close-modal">적용</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-close-modal">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body">' +
            '<table class="tpa-table mm-table"><thead><tr><th style="width:48px">선택</th><th style="width:96px">버전</th><th style="width:176px">업데이트일자</th><th style="width:144px">수정자</th><th>변경 내용</th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table>' +
            '<p class="tpa-muted mm-note">※ 이전 버전 선택 시 해당 시점의 mTRM 정보가 표출되며, 현재 버전과의 차이점이 강조 표시됩니다.</p>' +
            compare +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 요약 팝업 — 과제명 기준 (분과 막대/과제상태 행 클릭 시 하단 상세 표 필터)
  function renderMmTaskSummary(state) {
    var stMap = mmSumStatusMap();
    // 막대 스케일은 데이터 최대값 기준으로 산출한다(건수 규모가 바뀌어도 막대가 넘치지 않도록).
    var maxDeptTotal = Math.max.apply(null, MM.sumDepts.map(function (d) {
      return d[2].reduce(function (a, b) { return a + b; }, 0);
    }));
    var maxStatus = Math.max.apply(null, MM.sumStatusShown.map(function (s) { return s[1]; }));
    var cards = MM.sumCards.map(function (c) {
      return '<div><p class="mm-sum-card-label">' + esc(c.label) + '</p><p class="mm-sum-card-value"><strong>' + esc(c.value) + '</strong> <span>' + esc(c.unit) + '</span></p></div>';
    }).join('');
    var steps = MM.sumPhases.map(function (p, i, arr) {
      var pos = i === 0 ? 'first' : (i === arr.length - 1 ? 'last' : 'mid');
      return '<div class="mm-sum-step mm-sum-step-' + pos + '" style="background:' + p[2] + '">' +
        '<p class="mm-sum-step-label">' + esc(p[0]) + ' 단계</p>' +
        '<p><strong>' + p[1] + '</strong><span>건 · ' + ((p[1] / MM.sumTotal) * 100).toFixed(1) + '%</span></p></div>';
    }).join('');
    var legend = MM.sumPhases.map(function (p) { return '<span><i style="background:' + p[2] + '"></i>' + esc(p[0]) + '</span>'; }).join('');
    var deptBars = MM.sumDepts.map(function (d) {
      var total = d[2].reduce(function (a, b) { return a + b; }, 0);
      var segs = d[2].map(function (v, pi) {
        return v > 0 ? '<div style="width:' + ((v / total) * 100) + '%;background:' + MM.sumPhases[pi][2] + '">' + v + '</div>' : '';
      }).join('');
      var cls = 'mm-sum-row' + (state.mmSumDept === d[0] ? ' mm-sum-row-on' : (state.mmSumDept ? ' mm-sum-row-dim' : ''));
      return '<div class="' + cls + '" data-action="mm-sum-dept" data-name="' + esc(d[0]) + '">' +
        '<span class="mm-sum-row-name">' + esc(d[0]) + '</span>' +
        '<div class="mm-sum-track"><div class="mm-sum-segs" style="width:' + ((total / maxDeptTotal) * 100) + '%">' + segs + '</div></div>' +
        '<span class="mm-sum-row-total">' + total + '</span></div>';
    }).join('');
    var statusBars = MM.sumStatusShown.map(function (s) {
      var cls = 'mm-sum-row' + (state.mmSumStatus === s[0] ? ' mm-sum-row-on' : (state.mmSumStatus ? ' mm-sum-row-dim' : ''));
      return '<div class="' + cls + '" data-action="mm-sum-status" data-name="' + esc(s[0]) + '">' +
        '<span class="mm-sum-row-name">' + esc(s[0]) + '</span>' +
        '<div class="mm-sum-track"><div class="mm-sum-bar" style="width:' + ((s[1] / maxStatus) * 100) + '%;background:' + s[2] + '"></div></div>' +
        '<span class="mm-sum-row-count">' + s[1] + '</span><span class="mm-sum-row-pct">' + ((s[1] / MM.sumTotal) * 100).toFixed(1) + '%</span></div>';
    }).join('');

    var list = MM.sumTasks.filter(function (t) {
      return (!state.mmSumDept || t.dept === state.mmSumDept) && (!state.mmSumStatus || t.status === state.mmSumStatus);
    });
    var filterLabel = [state.mmSumDept && '분과: ' + state.mmSumDept, state.mmSumStatus && '과제상태: ' + state.mmSumStatus].filter(Boolean).join(' · ') || '전체';
    var taskRows = list.map(function (t) {
      var st = stMap[t.status];
      return '<tr><td class="mm-muted">' + t.no + '</td><td>' + esc(t.dept) + '</td><td class="mm-link-text mm-nowrap">' + esc(t.roadmap) + '</td>' +
        '<td class="mm-link-text mm-nowrap"><strong>' + esc(t.name) + '</strong></td><td>' + esc(t.linked) + '</td>' +
        '<td><span class="mm-st" style="background:' + st.bg + ';color:' + st.fg + '">' + esc(t.status) + '</span></td>' +
        '<td><span class="mm-phase mm-phase-' + MM_PHASE_KIND[t.phase] + '">' + esc(t.phase) + '</span></td></tr>';
    }).join('') || mmEmptyRow(7);

    return (
      '<p class="mm-sum-title"><i class="fas fa-caret-right"></i>mTRM 기술과제 등록 목록 요약 (과제명 기준)</p>' +
      '<div class="mm-sum-panel mm-sum-panel-flush">' +
        '<div class="mm-sum-cards">' + cards + '</div>' +
        '<div class="mm-sum-rate"><span>완료율</span><div class="mm-sum-rate-track"><div style="width:' + MM.sumDoneRate + '"></div></div><strong>' + MM.sumDoneRate + '</strong></div>' +
      '</div>' +
      '<div class="mm-sum-panel">' +
        '<div class="mm-sum-panel-head"><p>과제현황 단계 (P1 → P4)</p><span>단계별 과제 수 · 비율</span></div>' +
        '<div class="mm-sum-steps">' + steps + '</div>' +
      '</div>' +
      '<div class="mm-sum-grid" style="grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)">' +
        '<div class="mm-sum-panel"><div class="mm-sum-panel-head"><p>분과별 과제현황</p><div class="mm-sum-legend">' + legend + '</div></div><div class="mm-sum-rows">' + deptBars + '</div></div>' +
        '<div class="mm-sum-panel"><div class="mm-sum-panel-head"><p>과제상태</p><span>총 ' + MM.sumTotal + '건</span></div><div class="mm-sum-rows">' + statusBars + '</div></div>' +
      '</div>' +
      '<div class="mm-sum-detail">' +
        '<div class="mm-sum-detail-head"><p>mTRM 기술과제 상세 <span>' + list.length + '건</span></p>' +
          '<div class="mm-sum-detail-filter"><span>필터: <strong>' + esc(filterLabel) + '</strong></span>' +
            (state.mmSumDept || state.mmSumStatus ? '<button type="button" data-action="mm-sum-clear">초기화</button>' : '') +
            '<span class="tpa-muted">※ 분과 막대 / 상태 범례 클릭 시 필터</span></div></div>' +
        '<div class="mm-scroll mm-scroll-plain" style="max-height:288px"><table class="tpa-table mm-table mm-table-dense" style="min-width:760px"><thead><tr>' +
          '<th style="width:48px">NO</th><th style="width:80px">분과</th><th>로드맵</th><th>과제명</th><th>연계과제</th><th style="width:80px">과제상태</th><th style="width:80px">과제현황</th>' +
        '</tr></thead><tbody>' + taskRows + '</tbody></table></div>' +
      '</div>'
    );
  }

  // 요약 팝업 — 로드맵 기준
  function renderMmRoadmapSummary(state) {
    var stMap = mmSumStatusMap();
    var R = MM.roadmapSummary;
    var total = R.length;
    var changedList = R.filter(function (r) { return r[5] !== '-'; });
    var fixed = R.filter(function (r) { return r[6] === '확정' || r[6] === '완료'; }).length;
    var isRecent = function (r) { return mmDaysBetween(MM.roadmapSummaryToday, r[9]) <= 30; };
    var qStart = function (n) { return (2026 + Math.floor(n / 4)) + '.' + String((n % 4) * 3 + 1).padStart(2, '0') + '.01'; };
    var qEnd = function (n) { return (2026 + Math.floor(n / 4)) + '.' + String((n % 4) * 3 + 3).padStart(2, '0') + '.' + [31, 30, 30, 31][n % 4]; };
    var pill = function (status) { return '<span class="mm-sum-pill" style="background:' + stMap[status].color + '">' + esc(status) + '</span>'; };

    var cards = [
      { label: '총 로드맵', value: total, unit: '건' },
      { label: '확정 · 완료', value: fixed, unit: '건 (' + Math.round((fixed / total) * 100) + '%)' },
      { label: '연계 mTRM 변경 (前→後)', value: changedList.length, unit: '건' },
      { label: '최근 30일 수정', value: R.filter(isRecent).length, unit: '건' },
    ].map(function (c) {
      return '<div><p class="mm-sum-card-label">' + esc(c.label) + '</p><p class="mm-sum-card-value"><strong>' + c.value + '</strong> <span>' + esc(c.unit) + '</span></p></div>';
    }).join('');

    var flows = changedList.map(function (r) {
      return '<div class="mm-sum-flow">' +
        '<div class="mm-sum-flow-name"><span>' + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>' +
        '<div class="mm-sum-flow-line"><span class="mm-sum-flow-pre">' + esc(r[4]) + '</span><span class="mm-sum-flow-arrow"><i class="fas fa-caret-right"></i></span><span class="mm-sum-flow-post">' + esc(r[5]) + '</span></div>' +
        '<span class="mm-sum-flow-mod">수정 ' + esc(r[9]) + '</span>' + pill(r[6]) + '</div>';
    }).join('');
    var usedStatus = {};
    R.forEach(function (r) { usedStatus[r[6]] = true; });
    var legend = MM.sumStatusDef.filter(function (s) { return usedStatus[s[0]]; })
      .map(function (s) { return '<span><i style="background:' + s[2] + '"></i>' + esc(s[0]) + '</span>'; }).join('') +
      '<span><i class="mm-sum-today-mark"></i>오늘</span>';
    var years = MM.roadmapSummaryYears.map(function (y) { return '<div style="grid-column:span 4">' + esc(y) + '</div>'; }).join('');
    var ganttRows = R.map(function (r) {
      return '<div class="mm-sum-gantt-row"><div class="mm-sum-gantt-name"><span>' + esc(r[0]) + '</span>' + esc(r[1]) + '</div>' +
        '<div class="mm-sum-gantt-bar" style="grid-column:' + (r[2] + 2) + ' / span ' + Math.min(r[3], 16 - r[2]) + ';background:' + stMap[r[6]].color + '"></div></div>';
    }).join('');
    var detailRows = R.map(function (r, i) {
      return '<tr><td class="mm-muted">' + (i + 1) + '</td><td>' + esc(r[0]) + '</td><td class="mm-link-text mm-nowrap"><strong>' + esc(r[1]) + '</strong></td>' +
        '<td class="mm-nowrap">' + qStart(r[2]) + '~' + qEnd(Math.min(r[2] + r[3] - 1, 15)) + '</td>' +
        '<td class="mm-nowrap">' + esc(r[4]) + '</td><td class="mm-nowrap ' + (r[5] === '-' ? 'mm-post-none' : 'mm-post') + '">' + esc(r[5]) + '</td>' +
        '<td class="mm-nowrap">' + esc(r[8]) + '</td><td class="mm-nowrap' + (isRecent(r) ? ' mm-mod-recent' : '') + '">' + esc(r[9]) + '</td>' +
        '<td>' + pill(r[6]) + '</td></tr>';
    }).join('');

    return (
      '<p class="mm-sum-title"><i class="fas fa-caret-right"></i>mTRM 정보 요약 (로드맵 기준)</p>' +
      '<div class="mm-sum-panel mm-sum-panel-flush"><div class="mm-sum-cards">' + cards + '</div></div>' +
      renderMmRmCrossTable(state) +
      '<div class="mm-sum-panel"><div class="mm-sum-panel-head"><p>연계 mTRM 변경 (前 → 後)</p><span>後가 지정된 로드맵만 표시</span></div><div class="mm-sum-flows">' + flows + '</div></div>' +
      '<div class="mm-sum-panel">' +
        '<div class="mm-sum-panel-head"><p>로드맵 기간 (\'26~\'29)</p><div class="mm-sum-legend">' + legend + '</div></div>' +
        '<div class="mm-sum-gantt-scroll"><div class="mm-sum-gantt">' +
          '<div class="mm-sum-gantt-today" style="left:calc(200px + (100% - 200px) * ' + ((3 + 10 / 92) / 16) + ')"></div>' +
          '<div class="mm-sum-gantt-years"><div></div>' + years + '</div>' + ganttRows +
        '</div></div>' +
      '</div>' +
      '<div class="mm-sum-detail">' +
        '<div class="mm-sum-detail-head"><p>mTRM 정보 상세</p><span class="tpa-muted" style="font-size:11px">※ 파란 수정일 = 최근 30일 이내 수정</span></div>' +
        '<div class="mm-scroll mm-scroll-plain" style="max-height:288px"><table class="tpa-table mm-table mm-table-dense" style="min-width:900px"><thead>' +
          '<tr><th rowspan="2" style="width:48px">NO</th><th rowspan="2" style="width:80px">분과</th><th rowspan="2">로드맵</th><th rowspan="2" style="width:192px">기간</th>' +
            '<th colspan="2">연계 mTRM</th><th rowspan="2" style="width:96px">등록일</th><th rowspan="2" style="width:96px">수정일</th><th rowspan="2" style="width:80px">상태</th></tr>' +
          '<tr><th style="width:96px">前</th><th style="width:96px">後</th></tr>' +
        '</thead><tbody>' + detailRows + '</tbody></table></div>' +
      '</div>'
    );
  }

  function renderMmSummaryModal(state) {
    var isRoadmap = state.mmSummaryMode === 'roadmap';
    return (
      '<div class="rm-modal-overlay">' +
        '<div class="rm-modal-box" style="max-width:1024px">' +
          '<div class="rm-modal-header-navy"><h3>' + (isRoadmap ? '요약 · mTRM 정보 (로드맵 기준)' : '요약 · mTRM 기술과제 (과제명 기준)') + '</h3>' +
            '<button type="button" class="rm-modal-close" data-action="mm-close-modal"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-outline-sm mm-btn-outline">엑셀</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-close-modal">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body mm-sum-body">' + (isRoadmap ? renderMmRoadmapSummary(state) : renderMmTaskSummary(state)) + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 분과 변경 팝업
  function renderMmDeptChangeModal() {
    var rows = MM.deptChangeRows.map(function (r) {
      return '<tr><td><input type="checkbox" /></td><td><input type="text" class="mm-dept-input" value="' + esc(r.name) + '" /></td>' +
        '<td>' + esc(r.regDate) + '</td><td>' + esc(r.modDate) + '</td><td><button type="button" class="mm-btn-delete">삭제</button></td></tr>';
    }).join('');
    return (
      '<div class="rm-modal-overlay">' +
        '<div class="rm-modal-box" style="max-width:672px">' +
          '<div class="rm-modal-header-navy"><h3>분과 변경</h3><button type="button" class="rm-modal-close" data-action="mm-close-modal"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-outline-sm mm-btn-outline"><i class="fas fa-plus" style="font-size:10px"></i>행 추가</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-close-modal">저장</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-close-modal">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body">' +
            '<table class="tpa-table mm-table"><thead><tr><th style="width:48px">선택</th><th>분과명</th><th style="width:128px">등록일</th><th style="width:128px">최근수정일</th><th style="width:80px">삭제</th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table>' +
            '<p class="tpa-muted mm-note">※ 분과명 변경 시 연계된 로드맵·mTRM 정보에 함께 반영됩니다.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 분과장 관리 팝업
  // v3: 분과장 관리 팝업이 읽기전용 표에서 편집 가능한 그리드로 바뀌었다.
  // 행 추가(+)/선택 삭제(−)/저장, 기존 행은 분과명 고정(신규 행만 입력·삭제 가능).
  // 근거: design-import/생기포털 v3.dc.html deptRowsView / deptAddRow / deptRemoveRows / deptSave.
  function renderMmDeptHeadModal(state) {
    var rows = (state.deptRows || []).map(function (r) {
      var person = function (val, field) {
        return '<div class="mm-dept-person">' +
          '<button type="button" class="tpa-icon-btn mm-icon-btn" data-action="dept-search" title="담당자 검색"><i class="fas fa-search"></i></button>' +
          '<input type="text" data-dept-field="' + field + '" data-id="' + r.id + '" value="' + esc(val) + '" />' +
        '</div>';
      };
      var deptCell = r.isNew
        ? '<input type="text" data-dept-field="dept" data-id="' + r.id + '" value="' + esc(r.dept) + '" placeholder="분과명 입력" />'
        : '<span>' + esc(r.dept) + '</span>';
      return '<tr>' +
        '<td><input type="checkbox" data-action="dept-toggle" data-id="' + r.id + '"' + (r.checked ? ' checked' : '') + ' /></td>' +
        '<td class="mm-head-dept">' + deptCell + '</td>' +
        '<td class="mm-left">' + person(r.main, 'main') + '</td>' +
        '<td class="mm-left">' + person(r.sub, 'sub') + '</td>' +
        '<td class="mm-muted mm-nowrap">' + esc(r.reg) + '</td>' +
        '<td class="mm-muted mm-nowrap">' + esc(r.mod) + '</td>' +
      '</tr>';
    }).join('') || mmEmptyRow(6);
    return (
      '<div class="rm-modal-overlay">' +
        '<div class="rm-modal-box" style="max-width:860px">' +
          '<div class="rm-modal-header-navy"><h3>분과장 관리</h3><button type="button" class="rm-modal-close" data-action="mm-close-modal"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-topbar tpa-topbar mm-dept-topbar">' +
            '<div class="mm-dept-tools">' +
              '<button type="button" class="mm-dept-tool" data-action="dept-add-row" title="행 추가">+</button>' +
              '<button type="button" class="mm-dept-tool" data-action="dept-remove-rows" title="선택 삭제">&minus;</button>' +
            '</div>' +
            '<div class="mm-dept-acts">' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="dept-save">저장</button>' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-close-modal">닫기</button>' +
            '</div>' +
          '</div>' +
          '<div class="rm-modal-body">' +
            '<table class="tpa-table mm-table mm-dept-table"><thead><tr>' +
              '<th style="width:40px"></th><th style="width:120px">분과 <span class="mm-req">*</span></th>' +
              '<th>분과 담당자(정) <span class="mm-req">*</span></th><th>분과 담당자(부)</th>' +
              '<th style="width:84px">등록일</th><th style="width:92px">최근수정일</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody></table>' +
            '<p class="tpa-muted mm-note">※ 분과장(정)은 mTRM 협의체 소집 메일의 수신자(To)로 자동 지정됩니다.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // mTRM 정보 상세 팝업 (v3 mmInfoDetailOpen 블록)
  function renderMmInfoDetailModal(state) {
    var stMap = mmSumStatusMap();
    var row = state.mmInfoDetail || {};
    var status = row.status || '작성중';
    var st = stMap[status] || { bg: '#F1F5F9', fg: '#475569' };
    var pick = {
      '분과': row.dept, '로드맵': row.roadmap, '기간': row.period,
      '등록일': row.reg, '수정일': row.modDate,
    };
    var baseRows = MM.infoDetailRows.map(function (r) {
      return '<tr><th class="mm-id-th">' + esc(r.k) + '</th><td class="mm-id-td">' + esc(pick[r.k] || r.v) + '</td></tr>';
    }).join('');
    var prev = row.prev || MM.infoDetailPrev;
    var next = row.next || MM.infoDetailNext;
    var history = MM.infoDetailHistory.map(function (h) {
      return '<tr><td class="mm-center mm-muted mm-nowrap">' + esc(h.date) + '</td><td class="mm-nowrap">' + esc(h.item) + '</td>' +
        '<td class="mm-muted">' + esc(h.before) + '</td><td>' + esc(h.after) + '</td><td class="mm-nowrap">' + esc(h.owner) + '</td></tr>';
    }).join('') || mmEmptyRow(5);

    return (
      '<div class="rm-modal-overlay" data-action="mm-info-detail-backdrop">' +
        '<div class="rm-modal-box" style="max-width:640px">' +
          '<div class="rm-modal-header-navy"><h3>mTRM 정보 상세</h3><button type="button" class="rm-modal-close" data-action="mm-info-detail-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-body">' +
            '<div class="mm-id-top"><p class="mm-id-title">mTRM 정보</p>' +
              '<span class="mm-st" style="background:' + st.bg + ';color:' + st.fg + '">' + esc(status) + '</span></div>' +
            '<table class="tpa-table mm-table mm-id-table"><tbody>' + baseRows +
              '<tr><th class="mm-id-th">연계 mTRM</th><td class="mm-id-td">' +
                '<div class="mm-id-link"><span class="mm-id-dir">前</span><strong>' + esc(prev) + '</strong>' +
                  '<i class="fas fa-arrow-right mm-id-arrow"></i>' +
                  '<span class="mm-id-dir">後</span><strong>' + esc(next) + '</strong></div>' +
              '</td></tr>' +
            '</tbody></table>' +
            '<p class="mm-id-subtitle">변경 이력</p>' +
            '<table class="tpa-table mm-table mm-table-dense"><thead><tr>' +
              '<th style="width:96px">일자</th><th style="width:112px">항목</th><th>변경 전</th><th>변경 후</th><th style="width:120px">수정자</th>' +
            '</tr></thead><tbody>' + history + '</tbody></table>' +
          '</div>' +
          '<div class="rm-modal-footer mm-id-footer">' +
            '<button type="button" class="btn-outline-navy tpa-btn-sm" data-action="mm-info-detail-roadmap">로드맵 이동</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-info-detail-close">닫기</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // 메일알림 대상 팝업은 SCR-011/012/014가 공유한다 — 각 화면 렌더 말미에서 이 헬퍼를 더한다.
  function renderMailTargetLayer(state) {
    return state.mailTarget && state.mailTarget.open ? renderMailTargetModal(state) : '';
  }

  // [공통] 메일알림 대상 검색 팝업 (v3 mtIsOpen 블록) — SCR-011/012/014 공유
  function renderMailTargetModal(state) {
    var mt = state.mailTarget;
    var q = mt.query;
    var rows = PNDES.data.mailDirectory.filter(function (d) {
      return (!q.room || d.room.indexOf(q.room) >= 0) && (!q.team || d.team.indexOf(q.team) >= 0);
    });
    var allChecked = rows.length > 0 && rows.every(function (d) { return mt.selected.indexOf(d.key) >= 0; });
    var body = rows.map(function (d) {
      var on = mt.selected.indexOf(d.key) >= 0;
      return '<tr class="mt-row' + (on ? ' mt-row-on' : '') + '" data-action="mt-toggle" data-key="' + esc(d.key) + '">' +
        '<td class="mm-center"><input type="checkbox" class="mt-cb" tabindex="-1"' + (on ? ' checked' : '') + ' /></td>' +
        '<td>' + esc(d.room) + '</td><td>' + esc(d.team) + '</td></tr>';
    }).join('');
    var empty = '<div class="mt-empty">조회 조건에 해당하는 담당자정보가 없습니다.<br />조회 조건을 변경 후 다시 조회해 주세요.</div>';
    var chips = mt.selected.map(function (k) {
      return '<span class="mt-chip">' + esc(k.split('|')[1]) +
        '<button type="button" data-action="mt-chip-remove" data-key="' + esc(k) + '"><i class="fas fa-times"></i></button></span>';
    }).join('') || '<span class="mt-chip-empty">돋보기를 눌러 알림 대상을 선택하세요.</span>';

    return (
      '<div class="rm-modal-overlay" data-action="mt-backdrop">' +
        '<div class="rm-modal-box mt-box" style="max-width:640px">' +
          '<div class="rm-modal-header-navy"><h3>메일알림 대상 검색</h3><button type="button" class="rm-modal-close" data-action="mt-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="mt-search">' +
            '<div class="mt-search-row">' +
              '<label><span>담당실</span><input type="text" class="tpa-input mt-input" data-mt-field="room" value="' + esc(q.room) + '" /></label>' +
              '<label><span>담당팀</span><input type="text" class="tpa-input mt-input" data-mt-field="team" value="' + esc(q.team) + '" /></label>' +
              '<button type="button" class="btn-dark tpa-btn-sm mt-search-btn" data-action="mt-search"><i class="fas fa-search"></i>조회</button>' +
            '</div>' +
            '<p class="tpa-muted mt-note">부분 일치 검색 · 조건 없이 조회하면 전체 목록이 표시됩니다.</p>' +
          '</div>' +
          '<div class="mt-toolbar">' +
            '<span class="mt-all"><input type="checkbox" class="mt-cb"' + (allChecked ? ' checked' : '') + ' data-action="mt-toggle-all" /><span>전체 선택</span></span>' +
            '<span class="mt-count">조회 <b>' + rows.length + '</b>건 · 선택 <b class="mt-count-sel">' + mt.selected.length + '</b>건</span>' +
          '</div>' +
          '<div class="mt-list mm-scroll mm-scroll-plain">' +
            '<table class="tpa-table mm-table mm-table-dense mt-table"><thead><tr>' +
              '<th style="width:40px"></th><th style="width:160px">담당실</th><th>부서(팀)</th>' +
            '</tr></thead><tbody>' + body + '</tbody></table>' +
            (rows.length ? '' : empty) +
          '</div>' +
          '<div class="rm-modal-footer mt-footer">' +
            '<div class="mt-chips">' + chips + '</div>' +
            '<div class="mt-actions">' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="mt-confirm"' + (mt.selected.length ? '' : ' disabled') + '>확인</button>' +
              '<button type="button" class="btn-outline-gray tpa-btn-sm" data-action="mt-close">닫기</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // v3: mTRM 정보 "협의체" 컬럼 — 상태가 완료/확정인 행만 "<분과> mTRM 협의체"를 표시한다.
  // 근거: design-import/생기포털 v3.dc.html mmInfoRows의 council 계산식.
  function mmCouncil(r) {
    return (r.status === '완료' || r.status === '확정') ? r.dept + ' mTRM 협의체' : '';
  }

  // v3 신규: mTRM 업데이트 이력 팝업 (기존 "버전관리" 버튼이 이 팝업을 연다).
  // 근거: design-import/생기포털 v3.dc.html updHistOpen 블록 / updHistRows.
  function renderMmUpdHistModal() {
    var rows = MM.updHistRows.map(function (u) {
      return '<tr><td>' + esc(String(u.no)) + '</td><td class="mm-nowrap">' + esc(u.kind) + '</td><td>' + esc(u.dept) + '</td>' +
        '<td>' + esc(u.mtrm) + '</td><td>' + esc(u.link) + '</td>' +
        '<td class="mm-nowrap">' + esc(u.date) + '</td><td>' + esc(u.ver) + '</td></tr>';
    }).join('');
    return (
      '<div class="rm-modal-overlay" data-action="mm-close-modal">' +
        '<div class="rm-modal-box mm-updhist-modal">' +
          '<div class="rm-modal-header-navy"><h3>mTRM 업데이트 이력</h3>' +
            '<button type="button" class="rm-modal-close" data-action="mm-close-modal"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-body">' +
            '<div class="mm-updhist-actions"><button type="button" class="btn-navy tpa-btn-sm" data-action="mm-close-modal">닫기</button></div>' +
            '<div class="mm-scroll"><table class="tpa-table mm-table mm-updhist-table"><thead>' +
              '<tr><th style="width:56px">No</th><th style="width:80px">구분</th><th style="width:96px">분과</th>' +
                '<th>mTRM</th><th>mTRM 협의체 링크</th><th style="width:112px">일자</th><th style="width:80px">버전</th></tr>' +
            '</thead><tbody>' + rows + '</tbody></table></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // v3 신규: 연관과제 검색 팝업 — mTRM 기술과제 목록에서 연계과제를 골라 연결한다.
  // 근거: design-import/생기포털 v3.dc.html lkOpen 블록 / lkRows(담당자·과제명 2단 필터 + 단일선택).
  var MM_LK_OWNER = { AI: '자동화기술팀 / 김의왕 매니저', 물류: '물류기술팀 / 박생기 책임', 로봇: '지능화기술팀 / 한로봇 책임' };

  function mmLkAll() {
    return MM.tasks.map(function (t) {
      return { owner: MM_LK_OWNER[t.dept] || MM_LK_OWNER.AI, name: t.task };
    });
  }

  function renderMmLinkPickerModal(state) {
    var lk = state.lk;
    var all = mmLkAll();
    var rows = all.filter(function (r) {
      return (!lk.applied.owner || r.owner === lk.applied.owner) && (!lk.applied.name || r.name === lk.applied.name);
    });
    var uniq = function (key) {
      var seen = [];
      all.forEach(function (r) { if (seen.indexOf(r[key]) < 0) seen.push(r[key]); });
      return seen;
    };
    var opts = function (list, cur) {
      return '<option value="">전체</option>' + list.map(function (v) {
        return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(v) + '</option>';
      }).join('');
    };
    var body = rows.length
      ? rows.map(function (r, i) {
          return '<tr><td><input type="checkbox" data-action="lk-pick" data-name="' + esc(r.name) + '"' +
            (lk.sel === r.name ? ' checked' : '') + ' /></td>' +
            '<td>' + (i + 1) + '</td><td class="mm-left">' + esc(r.owner) + '</td>' +
            '<td class="mm-left">' + esc(r.name) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="4" class="mm-empty">데이터가 없습니다.</td></tr>';
    return (
      '<div class="rm-modal-overlay" data-action="lk-close">' +
        '<div class="rm-modal-box mm-lk-modal">' +
          '<div class="rm-modal-header-navy"><h3>연관과제 검색</h3>' +
            '<button type="button" class="rm-modal-close" data-action="lk-close"><i class="fas fa-times"></i></button></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="lk-choose">선택</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="lk-close">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body">' +
            '<div class="mm-lk-filter">' +
              '<span class="mm-lk-label">담당자</span>' +
              '<select class="mm-lk-sel" data-lk-field="owner">' + opts(uniq('owner'), lk.filter.owner) + '</select>' +
              '<span class="mm-lk-label">과제명</span>' +
              '<select class="mm-lk-sel mm-lk-sel-wide" data-lk-field="name">' + opts(uniq('name'), lk.filter.name) + '</select>' +
              '<button type="button" class="btn-dark tpa-btn-sm" data-action="lk-search"><i class="fas fa-search"></i>조회</button>' +
            '</div>' +
            '<table class="tpa-table mm-table mm-lk-table"><thead><tr>' +
              '<th style="width:48px">선택</th><th style="width:48px">NO</th><th style="width:34%">담당자</th><th>과제명</th>' +
            '</tr></thead><tbody>' + body + '</tbody></table>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSCR012(state) {
    var f = state.mmFilter;
    var a = state.mmApplied;
    var match = function (r) {
      return (!a.dept || r.dept === a.dept) && (!a.roadmap || r.roadmap === a.roadmap) && (!a.from || r.reg >= a.from) && (!a.to || r.reg <= a.to);
    };
    var byRegDesc = function (x, y) { return x.reg < y.reg ? 1 : (x.reg > y.reg ? -1 : 0); };
    var tasks = MM.tasks.filter(match).sort(byRegDesc);
    var infos = state.mmInfos.filter(match).sort(byRegDesc);
    var depts = MM.depts.filter(function (d) { return !a.dept || d.dept === a.dept; });

    var roadmapOptions = [];
    state.mmInfos.forEach(function (r) {
      if ((!f.dept || r.dept === f.dept) && roadmapOptions.indexOf(r.roadmap) < 0) roadmapOptions.push(r.roadmap);
    });

    var unlinked = state.mmUnlinked || [];
    var linkMap = state.mmLinkMap || {};
    var taskRows = tasks.map(function (t, i) {
      var idx = MM.tasks.indexOf(t);
      if (linkMap[t.task]) t = $.extend({}, t, { linked: linkMap[t.task] }); // 검색 팝업으로 새로 연결한 과제
      else if (unlinked.indexOf(t.task) >= 0) t = $.extend({}, t, { linked: '' }); // 해제된 연계과제는 비워서 표시
      return '<tr><td class="mm-muted">' + (tasks.length - i) + '</td><td>' + esc(t.dept) + '</td>' +
        '<td><button type="button" class="mm-link" data-action="mm-go-roadmap"><strong>' + esc(t.roadmap) + '</strong></button></td>' +
        '<td class="mm-left mm-cell-task"><button type="button" class="mm-link mm-link-block" data-action="mm-task-detail" data-kind="task" data-index="' + idx + '"><strong>' + esc(t.task) + '</strong></button></td>' +
        '<td class="mm-left mm-cell-linked"><div class="mm-linked">' +
          '<button type="button" class="tpa-icon-btn mm-icon-btn" data-action="mm-linked-search" data-task="' + esc(t.task) + '" title="연계과제 조회"><i class="fas fa-search"></i></button>' +
          '<button type="button" class="mm-link mm-link-trunc" data-action="mm-task-detail" data-kind="linked" data-index="' + idx + '">' + esc(t.linked) + '</button>' +
          (t.linked ? '<button type="button" class="mm-unlink" data-action="mm-unlink" data-task="' + esc(t.task) + '" title="연계과제 해제"><i class="far fa-rectangle-xmark"></i></button>' : '') +
        '</div></td>' +
        '<td>' + mmStateBadge(t.state) + '</td><td class="mm-phase-text">' + esc(t.phase) + '</td></tr>';
    }).join('') || mmEmptyRow(7);

    var infoRows = infos.map(function (r, i) {
      var infoIdx = state.mmInfos.indexOf(r);
      return '<tr><td class="mm-muted">' + (infos.length - i) + '</td><td>' + esc(r.dept) + '</td>' +
        '<td><div class="mm-linked">' +
          '<button type="button" class="tpa-icon-btn mm-icon-btn" data-action="mm-info-detail-open" data-index="' + infoIdx + '" title="mTRM 정보 상세"><i class="fas fa-magnifying-glass-plus"></i></button>' +
          '<button type="button" class="mm-link" data-action="mm-go-roadmap"><strong>' + esc(r.roadmap) + '</strong></button></div></td>' +
        '<td class="mm-nowrap">' + esc(r.period) + '</td><td class="mm-link-text">' + esc(r.prev) + '</td><td class="mm-link-text">' + esc(r.next) + '</td>' +
        '<td class="mm-link-text">' + esc(mmCouncil(r)) + '</td>' +
        '<td class="mm-muted mm-nowrap">' + esc(r.reg) + '</td><td class="mm-muted mm-nowrap">' + esc(r.modDate) + '</td><td>' + mmStateBadge(r.status) + '</td></tr>';
    }).join('') || mmEmptyRow(10);

    var deptRows = depts.map(function (d) {
      return '<tr><td><button type="button" class="mm-link mm-link-underline" data-action="mm-open-modal" data-modal="deptHead"><strong>' + esc(d.dept) + '</strong></button></td>' +
        '<td class="mm-muted">' + esc(d.regDate) + '</td><td class="mm-muted">' + esc(d.modDate) + '</td><td>' + esc(d.owner) + '</td></tr>';
    }).join('') || mmEmptyRow(4);

    var modal = '';
    if (state.mmModal === 'register') modal = renderMmRegisterModal(state) + (state.mmPicker ? renderMmPickerModal(state) : '');
    else if (state.mmModal === 'version') modal = renderMmVersionModal(state);
    else if (state.mmModal === 'summary') modal = renderMmSummaryModal(state);
    else if (state.mmModal === 'deptChange') modal = renderMmDeptChangeModal();
    else if (state.mmModal === 'deptHead') modal = renderMmDeptHeadModal(state);
    else if (state.mmModal === 'infoDetail') modal = renderMmInfoDetailModal(state);
    else if (state.mmModal === 'updHist') modal = renderMmUpdHistModal();
    if (state.lk && state.lk.open) modal += renderMmLinkPickerModal(state);

    return (
      '<div class="admin-screen" data-screen-label="SCR-012 mTRM 관리">' +
        '<div class="mm-head">' +
          '<button type="button" class="btn-outline-sm mm-btn-outline" data-action="mm-open-modal" data-modal="register"><i class="fas fa-plus" style="font-size:10px"></i>신규등록</button>' +
          '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-deploy">배포</button>' +
        '</div>' +
        '<section class="tpa-filter mm-filter">' +
          '<span class="tpa-filter-label">분과</span>' +
          '<select aria-label="분과" data-mm-filter="dept" style="width:144px"><option value="">전체</option>' + mmOptions(MM.depts.map(function (d) { return d.dept; }), f.dept) + '</select>' +
          '<span class="tpa-filter-label">로드맵</span>' +
          '<select aria-label="로드맵" data-mm-filter="roadmap" style="width:208px"><option value="">전체</option>' + mmOptions(roadmapOptions, f.roadmap) + '</select>' +
          '<span class="tpa-filter-label">기간</span>' +
          '<div class="rm-date-range"><input type="date" aria-label="시작일" data-mm-filter="from" value="' + esc(f.from) + '" /><span>-</span><input type="date" aria-label="종료일" data-mm-filter="to" value="' + esc(f.to) + '" /></div>' +
          '<button type="button" class="btn-dark" data-action="mm-search"><i class="fas fa-search" style="font-size:10px"></i>조회</button>' +
        '</section>' +
        '<section class="tpa-section">' +
          '<div class="tpa-section-head"><h3><i class="fas fa-caret-right"></i>mTRM 기술과제등록 목록 <span class="mm-count">총 ' + tasks.length + '건 · 최신 등록일 순</span></h3>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-open-modal" data-modal="summary" data-mode="task">요약</button></div>' +
          '<div class="mm-scroll" style="max-height:208px"><table class="tpa-table mm-table" style="min-width:960px"><thead><tr>' +
            '<th style="width:56px">순번</th><th style="width:80px">분과</th><th style="width:160px">로드맵</th><th style="min-width:240px">과제명</th><th style="min-width:220px">연계과제</th><th style="width:80px">과제상태</th><th style="width:80px">과제현황</th>' +
          '</tr></thead><tbody>' + taskRows + '</tbody></table></div>' +
        '</section>' +
        '<section class="tpa-section">' +
          '<div class="tpa-section-head"><h3><i class="fas fa-caret-right"></i>mTRM 정보 <span class="mm-count">총 ' + infos.length + '건</span></h3>' +
            '<div class="mm-head-btns"><button type="button" class="btn-navy tpa-btn-sm" data-action="mm-open-modal" data-modal="updHist">버전관리</button>' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-open-modal" data-modal="summary" data-mode="roadmap">요약</button></div></div>' +
          '<div class="mm-scroll" style="max-height:176px"><table class="tpa-table mm-table" style="min-width:960px"><thead>' +
            '<tr><th rowspan="2" style="width:56px">순번</th><th rowspan="2" style="width:80px">분과</th><th rowspan="2" style="min-width:180px">로드맵</th><th rowspan="2" style="min-width:150px">기간</th>' +
              '<th colspan="2">연계 mTRM</th><th rowspan="2" style="min-width:130px">협의체</th><th rowspan="2">등록일</th><th rowspan="2">수정일</th><th rowspan="2" style="width:80px">상태</th></tr>' +
            '<tr><th>前</th><th>後</th></tr>' +
          '</thead><tbody>' + infoRows + '</tbody></table></div>' +
        '</section>' +
        '<section class="tpa-section">' +
          '<div class="tpa-section-head"><h3><i class="fas fa-caret-right"></i>분과 Master Table <span class="mm-count">총 ' + depts.length + '건</span></h3>' +
            '<div class="mm-head-btns"><button type="button" class="btn-outline-sm mm-btn-outline" data-action="mm-open-modal" data-modal="deptHead"><i class="fas fa-plus" style="font-size:10px"></i>신규등록</button>' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="mm-open-modal" data-modal="deptChange">변경</button></div></div>' +
          '<div class="mm-scroll" style="max-height:160px"><table class="tpa-table mm-table"><thead><tr>' +
            '<th>분과</th><th>등록일</th><th>최근수정일</th><th>분과 담당자(정/부)</th>' +
          '</tr></thead><tbody>' + deptRows + '</tbody></table></div>' +
        '</section>' +
        modal +
        (state.subTaskDetail ? renderRmTaskDetailModal(state) : '') +
      '</div>'
    );
  }

  // ---------- SCR-013 기술과제 관리 ----------

  // 근거: v3.dc.html isTechTask / README #14 — 기본정보 폼(과제명/담당자/계획등록일) → 구분선 → mTRM 연동 영역
  // (연동 mTRM 로드맵 셀렉트) → 자동 매핑 결과 표(로드맵 미선택 시 안내 문구) → 취소/등록.
  var TT = global.PNDES.mock.scr013;

  function renderSCR013(state) {
    var f = state.techTaskForm;
    var required = ' <span class="tt-required">*</span>';
    var options = function (list, selected) {
      return '<option value="">선택</option>' + list.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === selected ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('');
    };
    var mappingRows = f.linkedRoadmap
      ? (TT.mappings[f.linkedRoadmap] || []).map(function (r) {
          return '<tr><td class="tt-map-roadmap">' + esc(r.roadmap) + '</td><td>' + esc(r.task) + '</td><td><span class="tt-map-badge">매핑완료</span></td></tr>';
        }).join('')
      : '<tr><td colspan="3" class="tt-map-empty">연동 mTRM 로드맵을 선택하세요.</td></tr>';

    return (
      '<div data-screen-label="SCR-013 기술과제 관리">' +
        '<div class="tt-panel">' +
          '<div class="tt-grid">' +
            '<div><label class="tt-label" for="tt-name">과제명' + required + '</label><input type="text" id="tt-name" class="tt-input" data-tt-field="name" value="' + esc(f.name) + '" /></div>' +
            '<div><label class="tt-label" for="tt-owner">담당자' + required + '</label><select id="tt-owner" class="tt-input" data-tt-field="owner">' + options(TT.owners, f.owner) + '</select></div>' +
          '</div>' +
          '<div class="tt-field"><label class="tt-label" for="tt-plan-date">계획등록일' + required + '</label><input type="date" id="tt-plan-date" class="tt-input tt-input-date" data-tt-field="planDate" value="' + esc(f.planDate) + '" /></div>' +
          '<hr class="tt-divider" />' +
          '<h3 class="tt-section-title">mTRM 연동 영역</h3>' +
          '<div><label class="tt-label" for="tt-roadmap">연동 mTRM 로드맵' + required + '</label><select id="tt-roadmap" class="tt-input" data-tt-field="linkedRoadmap">' + options(TT.roadmaps, f.linkedRoadmap) + '</select></div>' +
          '<div class="tt-field"><span class="tt-label tt-label-table">자동 매핑 결과</span>' +
            '<div class="tt-map-wrap"><table class="tt-map-table"><thead><tr><th>매핑 로드맵명</th><th>매핑 상세과제</th><th>매핑상태</th></tr></thead>' +
            '<tbody>' + mappingRows + '</tbody></table></div>' +
          '</div>' +
          '<div class="tt-actions">' +
            '<button type="button" class="tt-btn-cancel" data-action="tt-cancel">취소</button>' +
            '<button type="button" class="tt-btn-save" data-action="tt-save">등록</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-014 기술동향 ----------
  // 근거: v3.dc.html isTechTrend — 검색 영역(년도/유형/범위 + 검색창) + 수정/등록 버튼 + 유형 배지가 붙은 목록(10건 단위)
  // + 전체화면 상세 오버레이(이전/다음) + 등록 팝업(이미지/첨부/해시태그/알림메일 + 발송 미리보기).
  // README #15는 이전 버전 화면(5열 카드)이라 v3를 따른다.

  var TR = global.PNDES.mock.scr014;
  var TR_FILE_ICON = { pdf: 'fas fa-file-pdf tr-ico-pdf', pptx: 'fas fa-file-powerpoint tr-ico-ppt', xlsx: 'fas fa-file-excel tr-ico-xls', zip: 'fas fa-file-archive tr-ico-zip' };

  function trKindBadge(kind) {
    var k = TR.kinds.filter(function (x) { return x.label === kind; })[0] || TR.kinds[0];
    return '<span class="tr-kind" style="background:' + k.color + '">' + esc(k.label) + '</span>';
  }
  function trOptions(first, list, selected) {
    return '<option value="">' + esc(first) + '</option>' + list.map(function (o) {
      return '<option value="' + esc(o) + '"' + (o === selected ? ' selected' : '') + '>' + esc(o) + '</option>';
    }).join('');
  }
  // "조회" 시점에 확정된 조건으로 목록을 거른다 (년도 / 유형 / 검색 범위 + 검색어)
  function trFilterRows(state) {
    var a = state.trendApplied;
    return state.trendRows.filter(function (r) {
      if (a.year && r.date.slice(0, 4) !== a.year) return false;
      if (a.kind && r.kind !== a.kind) return false;
      if (!a.keyword) return true;
      var inTitle = r.title.indexOf(a.keyword) >= 0;
      var inContent = (r.content || '').indexOf(a.keyword) >= 0;
      return a.scope === '제목' ? inTitle : (a.scope === '내용' ? inContent : (inTitle || inContent));
    });
  }

  // 전체화면 상세 오버레이
  function renderTrendDetailOverlay(state) {
    var idx = state.trendDetailIndex;
    var t = state.trendRows[idx];
    var tags = TR.detailTags.map(function (g) { return '<span>' + esc(g) + '</span>'; }).join('');
    return (
      '<div class="tr-detail-overlay">' +
        '<button type="button" class="tr-detail-arrow tr-detail-arrow-prev" data-action="trm-detail-prev" title="이전"' + (idx === 0 ? ' disabled' : '') + '>&lsaquo;</button>' +
        '<button type="button" class="tr-detail-arrow tr-detail-arrow-next" data-action="trm-detail-next" title="다음"' + (idx === state.trendRows.length - 1 ? ' disabled' : '') + '>&rsaquo;</button>' +
        '<button type="button" class="tr-detail-close" data-action="trm-detail-close" title="닫기"><i class="fas fa-times"></i></button>' +
        '<div class="tr-detail-box">' +
          '<div class="tr-detail-head">' + trKindBadge(t.kind) +
            '<div class="tr-detail-title"><span>「 ' + esc(t.title) + ' 」</span></div><span class="tr-detail-head-pad"></span></div>' +
          '<div class="tr-detail-tags">' + tags + '</div>' +
          '<div class="tr-detail-meta">' +
            '<span><i class="far fa-calendar"></i>' + esc(t.date) + '<span class="tr-detail-views"><i class="far fa-eye"></i>' + t.views + '</span></span>' +
            '<span>' + esc(t.dept) + ' / ' + esc(t.owner) + '</span>' +
            '<a href="#" data-action="trm-detail-file"><i class="fas fa-paperclip"></i>[' + esc(t.title) + '].pdf</a>' +
          '</div>' +
          '<div class="tr-detail-preview">브로슈어 / 이미지 / 동영상 프리뷰 영역</div>' +
          '<p class="tr-detail-content">' + esc(t.content || '등록된 설명이 없습니다.') + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  // 등록 팝업의 발송 미리보기 (제목/알림메일 입력 시 이 조각만 다시 그린다)
  function renderTrendMailPreview(f) {
    var tags = f.tags.map(function (t) { return '<span>' + esc(t.label) + '</span>'; }).join('');
    return (
      '<div class="cm-preview">' +
        '<div class="cm-prev-head"><span>PNDES 생기포털</span><span>기술동향 알림</span></div>' +
        '<div class="cm-prev-body">' +
          '<div class="cm-prev-meta">' +
            '<p><span>받는 사람</span><span>' + esc(f.recipients.join(', ') || '(수신자를 추가하세요)') + '</span></p>' +
            '<p><span>제목</span><strong>' + esc(f.mailSubject) + '</strong></p>' +
          '</div>' +
          '<p class="cm-prev-text">' + esc(f.mailBody) + '</p>' +
          '<div class="tr-prev-card">' +
            '<div class="tr-prev-thumb">' + (f.images.length ? '<div class="tr-img-ph">IMG<span class="tr-thumb-badge">썸네일</span></div>' : '<div class="tr-prev-nothumb">이미지 없음</div>') + '</div>' +
            '<div class="tr-prev-info">' +
              '<p class="tr-prev-title">' + esc(f.title.trim() || '(제목을 입력하세요)') + '</p>' +
              '<p class="tr-prev-sub">' + esc((f.type || '유형 미선택') + ' · ' + TR.registrant.dept + ' / ' + TR.registrant.owner + ' · ' + TR.mailDate) + '</p>' +
              '<div class="tr-prev-tags">' + tags + '</div>' +
              '<p class="tr-prev-sub"><i class="fas fa-paperclip"></i>첨부 ' + f.files.length + '건 · 이미지 ' + f.images.length + '장</p>' +
            '</div>' +
          '</div>' +
          '<div class="cm-prev-cta"><span>생기포털에서 자세히 보기</span></div>' +
        '</div>' +
      '</div>'
    );
  }

  // 등록/수정 팝업
  function renderTrendRegisterModal(state) {
    var f = state.trendForm;
    var isEdit = f.editIndex != null;
    var images = f.images.length
      ? '<div class="tr-img-grid">' + f.images.map(function (im, i) {
          return '<div class="tr-img-tile"><div class="tr-img-ph">IMG</div>' + (i === 0 ? '<span class="tr-thumb-badge">썸네일</span>' : '') +
            '<button type="button" class="tr-img-remove" data-action="trm-image-remove" data-id="' + im.id + '" title="이미지 삭제">&#10005;</button>' +
            '<p>' + esc(im.name) + '</p></div>';
        }).join('') + '</div>'
      : '<div class="tr-empty-box"><i class="far fa-image"></i>업로드된 이미지가 없습니다.</div>';

    var totalMb = f.files.reduce(function (sum, x) { return sum + x.mb; }, 0);
    var totalSize = totalMb >= 1024 ? (totalMb / 1024).toFixed(1) + 'GB' : totalMb.toFixed(1) + 'MB';
    var allFiles = f.files.length > 0 && f.files.every(function (x) { return x.checked; });
    var files = f.files.length
      ? f.files.map(function (x) {
          return '<div class="tr-file-row"><input type="checkbox" data-action="trm-file-toggle" data-id="' + x.id + '"' + (x.checked ? ' checked' : '') + ' />' +
            '<i class="' + (TR_FILE_ICON[x.name.split('.').pop()] || 'fas fa-file tr-ico-etc') + '"></i>' +
            '<span class="tr-file-name">' + esc(x.name) + '</span><span class="tr-file-size">' + x.mb.toFixed(1) + 'MB</span>' +
            '<button type="button" data-action="trm-file-remove" data-id="' + x.id + '" title="파일 삭제">&#10005;</button></div>';
        }).join('')
      : '<div class="tr-file-empty">첨부된 파일이 없습니다.</div>';

    var checkedTags = f.tags.filter(function (t) { return t.checked; }).length;
    var allTags = f.tags.length > 0 && checkedTags === f.tags.length;
    var tags = f.tags.length
      ? '<div class="tr-tag-list">' + f.tags.map(function (t) {
          return '<span class="tr-tag' + (t.checked ? ' tr-tag-checked' : '') + '"><input type="checkbox" data-action="trm-tag-toggle" data-id="' + t.id + '"' + (t.checked ? ' checked' : '') + ' />' +
            '<span>' + esc(t.label) + '</span><button type="button" data-action="trm-tag-remove" data-id="' + t.id + '" title="태그 삭제">&#10005;</button></span>';
        }).join('') + '</div>'
      : '<p class="tpa-muted" style="margin:0;padding:4px 0">등록된 해시태그가 없습니다.</p>';

    var recipients = f.recipients.map(function (r, i) {
      return '<span class="tpa-chip tpa-chip-lg">' + esc(r) + '<button type="button" data-action="trm-recipient-remove" data-index="' + i + '" title="수신자 삭제">&#10005;</button></span>';
    }).join('');

    return (
      '<div class="rm-modal-overlay mm-overlay-register" data-action="trm-close-modal">' +
        '<div class="rm-modal-box" style="max-width:768px">' +
          '<div class="rm-modal-header-dark"><h3>' + (isEdit ? '기술동향 수정' : '기술동향 등록') + '</h3></div>' +
          '<div class="rm-modal-topbar tpa-topbar">' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="trm-save">저장</button>' +
            '<button type="button" class="btn-navy tpa-btn-sm" data-action="trm-close-modal">닫기</button>' +
          '</div>' +
          '<div class="rm-modal-body tpa-modal-body">' +
            '<table class="rm-info-table tpa-form-table tr-form-table"><colgroup><col style="width:112px" /><col style="width:224px" /><col style="width:96px" /><col /></colgroup><tbody>' +
              '<tr><th>제목</th><td colspan="3"><input type="text" data-trm-field="title" value="' + esc(f.title) + '" /></td></tr>' +
              '<tr><th>유형</th><td><select class="tr-type-select" data-trm-field="type">' + trOptions('선택', TR.kinds.map(function (k) { return k.label; }), f.type) + '</select></td>' +
                '<th>담당자</th><td><span class="tpa-owner"><span class="tpa-icon-btn"><i class="fas fa-search"></i></span>' + esc(TR.registrant.dept + ' / ' + TR.registrant.owner) + '</span></td></tr>' +
              '<tr><td colspan="4" class="tr-upload-cell">' +
                '<div class="tr-drop tr-drop-image" data-action="trm-image-add">' +
                  '<span class="tr-drop-icon"><i class="fas fa-cloud-upload-alt"></i></span>' +
                  '<div class="tr-drop-text"><p>이미지 파일 업로드</p><p>파일을 끌어다 놓거나 클릭해서 선택 · JPG, PNG, GIF · 최대 ' + TR.imageMax + '장 (첫 이미지가 썸네일)</p></div>' +
                  '<span class="btn-navy tr-drop-btn">파일선택</span>' +
                '</div>' +
                '<div class="tr-sub-head"><p>업로드된 이미지 <strong>' + f.images.length + '</strong>장</p>' +
                  (f.images.length ? '<button type="button" class="tr-link-danger" data-action="trm-image-clear">전체 삭제</button>' : '') + '</div>' +
                images +
              '</td></tr>' +
              '<tr><th>파일첨부</th><td colspan="3">' +
                '<div class="tr-drop tr-drop-file" data-action="trm-file-add">' +
                  '<span class="tr-drop-icon tr-drop-icon-file"><i class="fas fa-paperclip"></i></span>' +
                  '<div class="tr-drop-text"><p>첨부파일 업로드</p><p>파일을 끌어다 놓거나 클릭해서 선택 · PDF, PPT, XLS, DOC, ZIP · 파일당 최대 1GB, 전체 10GB</p></div>' +
                  '<span class="tr-drop-btn tr-drop-btn-outline">파일선택</span>' +
                '</div>' +
                '<div class="tr-file-box">' +
                  '<div class="tr-file-head"><label><input type="checkbox" data-action="trm-file-toggle-all"' + (allFiles ? ' checked' : '') + ' />전체선택</label>' +
                    '<div class="tr-file-head-right"><span>총 <strong>' + f.files.length + '</strong>건 · <b>' + totalSize + '</b> / 10GB</span>' +
                      '<button type="button" class="tr-btn-del" data-action="trm-file-remove-checked"><i class="fas fa-trash"></i>선택 삭제</button></div></div>' +
                  files +
                '</div>' +
              '</td></tr>' +
              '<tr><th>해시태그</th><td colspan="3">' +
                '<div class="tr-tag-input-row"><div class="tr-tag-input"><span>#</span><input type="text" id="trm-tag-input" data-trm-field="tagInput" value="' + esc(f.tagInput) + '" placeholder="태그 입력 후 Enter 또는 등록 (쉼표로 여러 개)" /></div>' +
                  '<button type="button" class="btn-navy tr-btn-tag" data-action="trm-tag-add">등록</button></div>' +
                '<div class="tr-tag-head"><label><input type="checkbox" data-action="trm-tag-toggle-all"' + (allTags ? ' checked' : '') + ' />전체선택</label>' +
                  '<div class="tr-file-head-right"><span class="tr-tag-count">총 <strong>' + f.tags.length + '</strong>개 · 선택 ' + checkedTags + '개</span>' +
                    '<button type="button" class="tr-btn-del" data-action="trm-tag-remove-checked"><i class="fas fa-trash"></i>선택 삭제</button></div></div>' +
                tags +
              '</td></tr>' +
              '<tr><th>메일알림대상</th><td colspan="3"><div class="tpa-chips tpa-chips-left" style="align-items:center"><button type="button" class="tpa-icon-btn" data-action="mt-open" data-target="trend" title="메일알림 대상 검색"><i class="fas fa-search"></i></button>' + recipients + '</div></td></tr>' +
              '<tr><th>알림메일 내용</th><td colspan="3">' +
                '<div class="tr-mail-row"><span>제목</span><input type="text" data-trm-field="mailSubject" value="' + esc(f.mailSubject) + '" /></div>' +
                '<div class="tr-mail-row tr-mail-row-top"><span>내용</span><textarea rows="5" data-trm-field="mailBody">' + esc(f.mailBody) + '</textarea></div>' +
                '<div class="tr-mail-foot"><label><input type="checkbox" data-trm-field="mailOn"' + (f.mailOn ? ' checked' : '') + ' />저장 시 알림메일 발송</label>' +
                  '<div class="tr-file-head-right"><span class="tpa-muted" id="trm-mail-len" style="font-size:11px">' + f.mailBody.length + ' / ' + TR.mailBodyMax + '자</span>' +
                    '<button type="button" class="tr-btn-plain" data-action="trm-mail-reset">기본 문구</button></div></div>' +
                '<div class="tr-mail-preview"><p>발송 미리보기</p><div class="cm-preview-cell" id="trm-preview-slot">' + renderTrendMailPreview(f) + '</div></div>' +
              '</td></tr>' +
            '</tbody></table>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // v3 신규: 기술동향 "신규 등록" 저장 시 먼저 뜨는 알림메일 팝업. "발송"을 눌러야 실제 등록된다.
  // 근거: design-import/생기포털 v3.dc.html trendMailOpen 블록 / saveTechTrend(신규일 때 trendMailOpen).
  function renderTrendMailModal(state) {
    var f = state.trendForm;
    var files = f.files || [];
    var fileHtml = files.length
      ? files.map(function (x) { return '<p class="tm-file">' + esc(x.name) + '</p>'; }).join('')
      : '<span class="tm-nofile">첨부파일 없음</span>';
    return (
      '<div class="rm-modal-overlay" data-action="trend-mail-close">' +
        '<div class="rm-modal-box tm-modal">' +
          '<div class="rm-modal-header-navy"><h3>알림메일</h3>' +
            '<span class="tm-to">받는 사람 : 메일알림대상 담당자</span></div>' +
          '<div class="rm-modal-body">' +
            '<div class="tm-sheet">' +
              '<p class="tm-from">PNDES에서 알립니다.</p>' +
              '<p class="tm-lead">&lt;신규기술 동향&gt;이 <strong>등록</strong>되었습니다.</p>' +
              '<table class="tm-table"><tbody>' +
                '<tr><td class="tm-th">제목</td><td colspan="3">' + esc(f.title.trim() || '-') + '</td></tr>' +
                '<tr><td class="tm-th">등록자</td><td>[' + esc(TR.registrant.dept) + '] ' + esc(TR.registrant.owner) + '</td>' +
                  '<td class="tm-th">등록일</td><td class="tm-nowrap">' + esc(TR.mailDate) + '</td></tr>' +
                '<tr><td class="tm-th">첨부파일</td><td colspan="3">' + fileHtml + '</td></tr>' +
                '<tr><td class="tm-th">바로가기</td><td colspan="3"><span class="tm-link">기술동향 공유 리스트 바로가기 링크</span></td></tr>' +
              '</tbody></table>' +
            '</div>' +
            '<div class="tm-foot"><span class="tm-brand">PNDES</span>' +
              '<p>관리자 : 디지털 생기팀 오봉훈 과장(TEL : 02-586-5475 HP : 010-5869-6886)<br />' +
              '요청사항 및 건의 사항 : 디지털 생기팀 PNDES관리 담당자앞 (obh@mobis.co.kr)</p></div>' +
            '<div class="tm-actions">' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="trm-save">발송</button>' +
              '<button type="button" class="btn-navy tpa-btn-sm" data-action="trend-mail-close">닫기</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSCR014(state) {
    var f = state.trendFilter;
    var list = trFilterRows(state);
    var pageSize = 10;
    var totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    var page = Math.min(state.techTrendPage || 1, totalPages);
    var selectMode = !!state.trendSelectMode;
    var tags = TR.listTags.map(function (g) { return '<span>' + esc(g) + '</span>'; }).join('');
    var rows = list.slice((page - 1) * pageSize, page * pageSize).map(function (r) {
      return '<div class="tr-row" data-action="trm-row-click" data-index="' + state.trendRows.indexOf(r) + '">' +
        '<div class="tr-row-kind">' + trKindBadge(r.kind) + '</div>' +
        '<div class="tr-row-main">' +
          '<div class="tr-row-meta"><span><i class="far fa-calendar"></i>' + esc(r.date) + '</span><span><i class="far fa-eye"></i>' + r.views + '</span></div>' +
          '<p class="tr-row-title">「 ' + esc(r.period) + ' 」 ' + esc(r.title) + '</p>' +
          '<div class="tr-row-tags">' + tags + '</div>' +
        '</div>' +
        '<div class="tr-row-owner">' + esc(r.dept) + ' | ' + esc(r.owner) + '</div>' +
        '<div class="tr-row-thumb">썸네일</div>' +
      '</div>';
    }).join('') || '<div class="tr-row-empty">데이터가 없습니다.</div>';

    return (
      '<div data-screen-label="SCR-014 기술동향">' +
        '<section class="tr-search">' +
          '<select aria-label="년도" data-trm-filter="year">' + trOptions('년도선택', TR.yearOptions, f.year) + '</select>' +
          '<select aria-label="유형" data-trm-filter="kind">' + trOptions('유형선택', TR.kinds.map(function (k) { return k.label; }), f.kind) + '</select>' +
          '<select aria-label="검색 범위" data-trm-filter="scope">' + TR.scopeOptions.map(function (o) { return '<option' + (o === f.scope ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' +
          '<div class="tr-search-box"><i class="fas fa-search"></i>' +
            '<input type="text" id="trm-keyword" aria-label="검색어" data-trm-filter="keyword" value="' + esc(f.keyword) + '" placeholder="검색어를 입력하세요" />' +
            '<button type="button" class="tr-search-clear" data-action="trm-keyword-clear" title="검색어 지우기">&#10005;</button>' +
            '<button type="button" class="tr-search-go" data-action="trm-search" title="조회"><i class="fas fa-search"></i></button></div>' +
        '</section>' +
        '<div class="tr-actions">' +
          (selectMode ? '<span class="tr-select-hint">수정할 항목을 선택하세요.</span>' : '') +
          '<button type="button" class="btn-outline-sm tr-btn' + (selectMode ? ' tr-btn-on' : '') + '" data-action="trm-toggle-select">수정</button>' +
          '<button type="button" class="btn-outline-sm tr-btn" data-action="trm-open-add">등록</button>' +
        '</div>' +
        '<div class="tr-list' + (selectMode ? ' tr-list-select' : '') + '">' + rows + '</div>' +
        renderPagination(list.length, page, pageSize, 'techTrendPage') +
        (state.trendDetailIndex != null ? renderTrendDetailOverlay(state) : '') +
        (state.trendForm.open ? renderTrendRegisterModal(state) : '') +
        (state.trendMailOpen ? renderTrendMailModal(state) : '') +
        renderMailTargetLayer(state) +
      '</div>'
    );
  }

  // ---------- 모달 ----------

  // 근거: README 공통 규칙 "수정 클릭 시 해당 행 데이터가 채워진 등록 모달과 동일한 폼이 오픈".
  // value는 수정 대상 행에서 가져온 해당 필드의 현재 값(state.modalFormValues[label]), 신규 등록 시 undefined.
  function fieldControl(f, value) {
    var fieldAttr = f.field ? ' data-field="' + esc(f.field) + '"' : '';
    var control;
    switch (f.type) {
      case 'textarea': control = '<textarea' + fieldAttr + '>' + (value != null ? esc(value) : '') + '</textarea>'; break;
      case 'select':
        // 수정 대상 값이 옵션 목록에 없으면(예: 목록 밖 담당자) 저장 시 값이 바뀌지 않도록 현재 값을 옵션으로 보존
        control = '<select' + fieldAttr + '>' + (value == null ? '<option value="">선택</option>' : '') +
          (value != null && (f.options || []).indexOf(value) === -1 ? '<option selected>' + esc(value) + '</option>' : '') +
          (f.options || []).map(function (o) { return '<option' + (value === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
          '</select>';
        break;
      case 'checkboxGroup':
        control = '<div class="checkbox-group">' + (f.options || []).map(function (o) {
          return '<label class="checkbox-item"><input type="checkbox"' + (o.checked ? ' checked' : '') + ' /> <span>' + esc(o.label) + '</span></label>';
        }).join('') + '</div>';
        break;
      case 'date': control = '<input type="date"' + fieldAttr + ' value="' + esc(value || '') + '" />'; break;
      case 'number': control = '<input type="number"' + fieldAttr + ' value="' + esc(value != null ? value : '') + '"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + ' />'; break;
      case 'file': control = '<div class="file-drop">파일을 드래그하거나 클릭하여 첨부</div>'; break;
      case 'plaintext': control = '<div class="plaintext">' + esc(value != null ? value : f.value) + '</div>'; break;
      default: control = '<input type="text"' + fieldAttr + ' value="' + esc(value != null ? value : '') + '"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + ' />';
    }
    return control + (f.hint ? '<div class="field-hint">' + esc(f.hint) + '</div>' : '');
  }

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html modalOpen — SCR-001 "현재=자동" 배지(video:true인
  // 셀) 및 SCR-003 "기술현황=●" 배지 클릭 시 여는 공용 동영상 모달. 제목은 kind에 따라 "[자동화 동영상]"/"[모듈 자동화
  // 동영상]" 접두어가 붙고, 본문은 검정 플레이어 영역에 재생 아이콘 + 안내 문구를 보여주는 정적 목업입니다.
  function renderAutoVideoModal(state) {
    var process = state.videoProcess || '';
    var title = (state.videoKind === 'module' ? '[모듈 자동화 동영상] ' : '[자동화 동영상] ') + process;
    return (
      '<div class="modal-box" style="width:560px">' +
        '<div class="modal-header" style="background:#111827;color:#fff"><div class="modal-title" style="color:#fff;font-size:14px">' + esc(title) + '</div><div class="modal-close" style="color:#9CA3AF" data-action="close-modal">&#10005;</div></div>' +
        '<div style="background:#000;aspect-ratio:16/9;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:6px">' +
          '<i class="video-play-icon">&#9658;</i>' +
          '<p style="font-size:13px;font-weight:600;margin:6px 0 0">해당 공정 자동화 시연 동영상 재생 중...</p>' +
          '<span style="font-size:11px;color:#9CA3AF">(프로토타입 샘플 플레이어)</span>' +
        '</div>' +
        '<div class="modal-footer" style="background:var(--color-bg)"><button type="button" class="btn btn-secondary" style="height:36px" data-action="close-modal">닫기</button></div>' +
      '</div>'
    );
  }

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html chartTaskDetail — SCR-008 간트 막대 클릭 시
  // 담당자/진행상태(%)/기간을 보여주는 상세 팝업(어두운 헤더 + 회색 안내 문단 + 읽기전용 기간 입력).
  function renderChartDetailModal(state) {
    var d = state.chartTaskDetail || {};
    return (
      '<div class="modal-box" style="width:560px">' +
        '<div class="modal-header" style="background:#1F2937;color:#fff">' +
          '<div class="modal-title" style="color:#fff;font-size:14px">[과제 상세 정보] ' + esc(d.category) + '</div>' +
          '<div class="modal-close" style="color:#9CA3AF" data-action="close-modal">&#10005;</div>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div style="display:flex;gap:24px;background:var(--color-bg);padding:12px;border-radius:4px;border:1px solid var(--color-border);margin-bottom:var(--sp-md)">' +
            '<div><div style="font-size:11px;color:var(--color-text-faint);margin-bottom:4px">담당자</div><div style="font-weight:600">' + esc(d.manager) + '</div></div>' +
            '<div><div style="font-size:11px;color:var(--color-text-faint);margin-bottom:4px">진행 상태</div>' + badge((d.status || '') + ' (' + d.progress + '%)', 'info') + '</div>' +
          '</div>' +
          '<div class="modal-field"><label>과제 목표</label><div class="modal-field-control"><div class="plaintext" style="height:auto;padding:10px;line-height:20px;white-space:normal">본 과제는 자동화 생산라인 효율 극대화를 위한 핵심 프로젝트입니다. 지정된 분기별 일정에 맞춰 파일럿 테스트 및 양산 적용 검증을 수행합니다.</div></div></div>' +
          '<div class="modal-field"><label>일정</label><div class="modal-field-control"><div class="plaintext">' + esc(d.period) + '</div></div></div>' +
        '</div>' +
        '<div class="modal-footer"><button type="button" class="btn btn-secondary" style="height:36px" data-action="close-modal">닫기</button></div>' +
      '</div>'
    );
  }

  // 근거: openDashTechTrendDetail/dashTechTrendDetailOpen — MTRM-MAIN "최근 기술동향" 목록 항목 클릭 시
  // 뜨는 전용 상세 팝업(제목/등록일·조회수·부서·담당자/태그/이미지 자리표시/본문). SCR-014 전체 화면 상세와
  // 달리 대시보드에서 벗어나지 않고 모달로만 열립니다.
  function renderDashTrendDetailModal(state) {
    var t = D.trendsData[state.dashTrendDetailIndex] || {};
    return (
      '<div class="modal-box" style="width:640px">' +
        '<div class="modal-header"><div class="modal-title">' + esc(t.title) + '</div><div class="modal-close" data-action="close-modal">&#10005;</div></div>' +
        '<div class="modal-body">' +
          '<div style="font-size:12px;color:var(--color-text-faint);margin-bottom:8px">' + esc(t.date) + ' &middot; 조회 ' + t.views + ' &middot; ' + esc(t.dept) + '/' + esc(t.owner) + '</div>' +
          '<div style="font-size:12px;color:var(--color-primary);font-weight:600;margin-bottom:16px">#' + esc(t.tag) + '</div>' +
          '<div class="trend-detail-body-preview" style="border-top:none;padding-top:0;aspect-ratio:auto;height:280px">기술동향 이미지</div>' +
          '<p style="font-size:14px;color:var(--color-text-sub);line-height:22px;margin-top:16px">' + esc(t.content || '등록된 설명이 없습니다.') + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  function renderModal(state) {
    if (!state.activeModal) return '';
    if (state.activeModal === 'autoVideo') return renderAutoVideoModal(state);
    if (state.activeModal === 'chartDetail') return renderChartDetailModal(state);
    if (state.activeModal === 'dashTrendDetail') return renderDashTrendDetailModal(state);
    var modal = MODALS[state.activeModal];
    if (!modal) return '';
    var formValues = state.modalFormValues || null; // { [field]: value } — 수정 모드일 때 open-edit-modal 호출부가 세팅
    var isEdit = !!formValues;
    var fields = modal.fields.map(function (f) {
      return '<div class="modal-field"><label>' + esc(f.label) + (f.required ? '<span class="required">*</span>' : '') + '</label>' +
        '<div class="modal-field-control">' + fieldControl(f, formValues && f.field ? formValues[f.field] : undefined) + '</div></div>';
    }).join('');
    var confirmAttrs = modal.successMessage
      ? ' data-action="confirm-modal" data-message="' + esc(isEdit ? (modal.editSuccessMessage || modal.successMessage) : modal.successMessage) + '"'
      : ' data-action="close-modal"';
    var title = isEdit && modal.editTitle ? modal.editTitle : modal.title;
    var confirmLabel = isEdit && modal.editConfirm ? modal.editConfirm : modal.confirm;
    return (
      '<div class="modal-box" style="width:' + modal.size + 'px">' +
        '<div class="modal-header"><div class="modal-title">' + esc(title) + '</div><div class="modal-close" data-action="close-modal">&#10005;</div></div>' +
        '<div class="modal-body">' + fields + '</div>' +
        '<div class="modal-footer">' +
          '<button type="button" class="btn btn-secondary" style="height:36px" data-action="close-modal">취소</button>' +
          '<button type="button" class="btn btn-primary" style="height:36px"' + confirmAttrs + '>' + esc(confirmLabel) + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- 화면 라우팅 테이블 ----------

  var SCREEN_RENDERERS = {
    'todo-main': renderTodoMain,
    'SCR-001': renderSCR001,
    'SCR-002': renderSCR002,
    'SCR-003': renderSCR003,
    'SCR-004': renderSCR004,
    'SCR-005': renderSCR005,
    'SCR-006': renderSCR006,
    'SCR-007': renderSCR007,
    'SCR-009': renderSCR009,
    'SCR-010': renderSCR010,
    'SCR-011': renderSCR011,
    'SCR-012': renderSCR012,
    'SCR-013': renderSCR013,
    'SCR-014': renderSCR014,
    'MTRM-MAIN': renderMTRMMAIN,
    'mp-gk': function (state) { return renderMpList(state, 'mp-gk'); },
    'mp-sc': function (state) { return renderMpList(state, 'mp-sc'); },
    'bp-gk': function (state) { return renderPpList(state, 'bp-gk'); },
    'bp-sc': function (state) { return renderPpList(state, 'bp-sc'); },
    'mod-cmp': function (state) { return renderCmp(state, 'mod-cmp'); },
    'part-cmp': function (state) { return renderCmp(state, 'part-cmp'); },
    'tt-plan': renderTtPlan,
    'stdprc-m': function (state) { return renderSm(state, 'stdprc-m'); },
    'stdwork-m': function (state) { return renderSm(state, 'stdwork-m'); },
  };

  global.PNDES.render = {
    gnbTop: renderGnbTop,
    councilMailPreview: renderCouncilMailPreview,
    trendMailPreview: renderTrendMailPreview,
    screen: function (state) {
      var fn = SCREEN_RENDERERS[state.currentScreen];
      return renderContentTitleBar(state) + (fn ? fn(state) : '');
    },
    modal: renderModal,
    techPrDetail: function (state) {
      return state.techPrDetailIndex != null ? renderTechPrDetailOverlay(state.techPrDetailIndex, state) : '';
    },
    toast: function (state) {
      if (!state.toast) return '';
      return '<div class="toast"><span class="toast-dot"></span><span>' + esc(state.toast) + '</span></div>';
    },
  };
})(window);
