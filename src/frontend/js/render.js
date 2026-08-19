/*
 * PNDES 신규 메뉴 화면 렌더 함수
 * data.js의 mock 데이터를 받아 화면별 HTML 문자열을 생성한다.
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

  function renderKpiCards(list) {
    return '<div class="kpi-grid">' + list.map(function (k) {
      var colorStyle = k.kind === 'success' ? 'color:var(--badge-success-text)' : k.kind === 'danger' ? 'color:var(--badge-danger-text)' : k.kind === 'info' ? 'color:var(--badge-info-text)' : '';
      return '<div class="kpi-card"><div class="kpi-value" style="' + colorStyle + '">' + esc(k.value) + '</div><div class="kpi-label">' + esc(k.label) + '</div></div>';
    }).join('') + '</div>';
  }

  function renderLinkGrid(links) {
    return '<div class="link-grid">' + links.map(function (l) {
      return '<div class="link-card" data-action="select-screen" data-screen-id="' + l.screenId + '">' +
        '<div class="link-card-title">' + esc(l.label) + '</div>' +
        '<div class="link-card-desc">' + esc(l.desc) + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderCardGrid(cards) {
    return '<div class="card-grid">' + cards + '</div>';
  }

  function rateColor(v) {
    return v >= 70 ? 'var(--color-auto-text)' : v >= 40 ? 'var(--badge-warning-text)' : 'var(--badge-danger-text)';
  }

  // ---------- GNB (좌측 메뉴) ----------

  // FEATURE_FLAGS.showFlowMapInNav가 false(기본값)면 FLOW-MAP은 GNB에서 숨깁니다.
  // 화면설계서(sb-creator-kbt) 캡처 등 필요 시에는 ?showFlowMap=1로 런타임에 노출할 수 있습니다.
  function isNavItemVisible(id) {
    if (id === 'FLOW-MAP') return !!global.PNDES.FEATURE_FLAGS.showFlowMapInNav;
    return true;
  }

  // SCR-006(통합 로드맵)처럼 하위 메뉴가 있는 항목은 화살표 클릭 시 펼침/접힘(state.navSubOpen)
  function renderGnbSide(currentScreen, navSubOpen) {
    navSubOpen = navSubOpen || {};
    var NAV_CHILDREN = global.PNDES.NAV_CHILDREN || {};
    var childIds = {};
    Object.keys(NAV_CHILDREN).forEach(function (pid) { NAV_CHILDREN[pid].forEach(function (cid) { childIds[cid] = true; }); });

    var html = '';
    global.PNDES.NAV.forEach(function (group) {
      var items = group.items.filter(isNavItemVisible).filter(function (id) { return !childIds[id]; });
      if (!items.length) return;
      html += '<div class="gnb-group"><div class="gnb-group-title">' + esc(group.title) + '</div>';
      items.forEach(function (id) {
        var meta = SCREENS[id];
        var children = NAV_CHILDREN[id];
        var isOpen = !!navSubOpen[id];
        var active = id === currentScreen || (children && children.indexOf(currentScreen) !== -1);
        html += '<div class="gnb-item' + (active ? ' active' : '') + '" data-action="select-screen" data-screen-id="' + id + '">' +
          '<span>' + esc(meta.name) + '</span>' +
          '<span class="gnb-item-right">' +
            (meta.admin ? '<span class="admin-mark">A</span>' : '') +
            (children ? '<span class="gnb-chevron' + (isOpen ? '' : ' collapsed') + '" data-action="toggle-nav-sub" data-screen-id="' + id + '">&#9662;</span>' : '') +
          '</span>' +
        '</div>';
        if (children && isOpen) {
          children.forEach(function (cid) {
            var cMeta = SCREENS[cid];
            html += '<div class="gnb-item gnb-item-child' + (cid === currentScreen ? ' active' : '') + '" data-action="select-screen" data-screen-id="' + cid + '">' +
              '<span>' + esc(cMeta.name) + '</span>' +
              (cMeta.admin ? '<span class="admin-mark">A</span>' : '') +
            '</div>';
          });
        }
      });
      html += '</div>';
    });
    return html;
  }

  function renderGnbTop(currentScreen) {
    var meta = SCREENS[currentScreen];
    return (
      '<div class="gnb-top-left">' +
        '<div class="gnb-logo">PNDES</div>' +
        '<div class="gnb-breadcrumb">' +
          '<span>생기포털</span><span class="sep">&rsaquo;</span>' +
          '<span>' + esc(meta.group) + '</span><span class="sep">&rsaquo;</span>' +
          '<span class="current">' + esc(meta.name) + '</span>' +
          (meta.admin ? '<span class="badge-admin-top">관리자</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="gnb-top-right">' +
        '<span>홍길동 님</span><span class="sep">|</span><a href="#" data-action="logout">로그아웃</a>' +
      '</div>'
    );
  }

  // ---------- FLOW-MAP ----------

  function flowNodePreview(kind) {
    if (kind === 'dashboard') {
      return (
        '<div style="display:flex;gap:4px;margin-bottom:4px">' +
          '<div style="flex:1;height:16px;background:var(--color-border);border-radius:2px"></div>' +
          '<div style="flex:1;height:16px;background:var(--color-border);border-radius:2px"></div>' +
          '<div style="flex:1;height:16px;background:var(--color-border);border-radius:2px"></div>' +
        '</div>' +
        '<div style="display:flex;align-items:flex-end;gap:3px;height:28px">' +
          '<div style="width:8px;height:60%;background:var(--color-primary);border-radius:1px"></div>' +
          '<div style="width:8px;height:90%;background:var(--color-primary);border-radius:1px"></div>' +
          '<div style="width:8px;height:40%;background:var(--color-primary);border-radius:1px"></div>' +
          '<div style="width:8px;height:70%;background:var(--color-primary);border-radius:1px"></div>' +
        '</div>'
      );
    }
    if (kind === 'table') {
      return (
        '<div style="height:8px;background:#DEE2E6;border-radius:2px"></div>' +
        '<div style="height:5px;width:85%;background:var(--color-border);border-radius:2px"></div>' +
        '<div style="height:5px;width:70%;background:var(--color-border);border-radius:2px"></div>' +
        '<div style="height:5px;width:90%;background:var(--color-border);border-radius:2px"></div>' +
        '<div style="height:5px;width:60%;background:var(--color-border);border-radius:2px"></div>'
      );
    }
    if (kind === 'cards') {
      return (
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;height:100%">' +
          '<div style="background:var(--color-border);border-radius:2px"></div>' +
          '<div style="background:var(--color-border);border-radius:2px"></div>' +
          '<div style="background:var(--color-border);border-radius:2px"></div>' +
          '<div style="background:var(--color-border);border-radius:2px"></div>' +
        '</div>'
      );
    }
    if (kind === 'gantt') {
      return (
        '<div style="height:8px;width:60%;background:var(--gantt-top-progress);border-radius:2px;margin-bottom:6px"></div>' +
        '<div style="height:8px;width:80%;margin-left:14px;background:var(--gantt-top-pending);border-radius:2px;margin-bottom:6px"></div>' +
        '<div style="height:8px;width:45%;margin-left:28px;background:var(--gantt-sub-progress);border-radius:2px"></div>'
      );
    }
    if (kind === 'form') {
      return (
        '<div style="height:6px;width:100%;background:var(--color-border);border-radius:2px"></div>' +
        '<div style="height:6px;width:100%;background:var(--color-border);border-radius:2px"></div>' +
        '<div style="height:6px;width:100%;background:var(--color-border);border-radius:2px"></div>' +
        '<div style="align-self:flex-end;width:36%;height:10px;background:var(--color-primary);border-radius:2px;margin-top:4px"></div>'
      );
    }
    return '';
  }

  function renderFlowRow(ids) {
    var nodes = ids.map(function (id) {
      var meta = SCREENS[id];
      var kind = global.PNDES.FLOW_KIND[id];
      return (
        '<div class="flow-node">' +
          '<div class="flow-node-card" data-action="select-screen" data-screen-id="' + id + '">' +
            '<div class="flow-node-preview">' + flowNodePreview(kind) + '</div>' +
            '<div class="flow-node-foot">' +
              '<div class="flow-node-id">' + id + '</div>' +
              '<div class="flow-node-label">' + esc(meta.name) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    return '<div class="flow-row">' + nodes + '</div>';
  }

  function renderFLOWMAP() {
    return (
      '<div data-screen-label="FLOW-MAP 전체 프로세스 흐름도">' +
        '<div class="section-title" style="margin-bottom:4px">공정 자동화 현황 흐름</div>' +
        '<div class="screen-subtitle">생기 업무담당자 · 공장/라인 현장담당자</div>' +
        renderFlowRow(global.PNDES.FLOW_AUTO_IDS) +
        '<div class="section-title" style="margin-bottom:4px">중장기 방향성 공유 흐름</div>' +
        '<div class="screen-subtitle">생기 업무담당자 · 분과 담당자/의사결정자</div>' +
        renderFlowRow(global.PNDES.FLOW_MTRM_IDS) +
      '</div>'
    );
  }

  // ---------- DASH-AUTO ----------
  // 근거: Claude Design PNDES Portal Prototype.dc.html — DASH-AUTO는 SCR-001/003의 9~5개 라인 전체가 아니라
  // 요약된 별도 mock 값(dashAutoRateBars/overallRate)을 사용합니다(디자인 원본 그대로 포팅, 라이브 계산 아님).

  function renderDashAutoMatrixBar() {
    // 근거: 디자인 원본은 "현재 상태(4건)"가 아니라 확대전개계획 매트릭스 전체 셀(4행 x 8열)을 순회하며
    // 라벨에 '자동'이 포함되면 자동, '협의'/'가능'이 포함되면 수동(추진필요)으로 집계합니다.
    var autoCount = 0, manualCount = 0;
    var KIND_LABEL = {
      auto: '자동', na: '미해당',
    };
    D.scr001ProcessDetail.forEach(function (row) {
      Object.keys(row.cells).forEach(function (colId) {
        var cell = row.cells[colId];
        if (cell.kind === 'auto') { autoCount++; return; }
        if (cell.kind === 'na') { return; }
        // possible/agree/agreeUnrecoverable/review 모두 "협의" 또는 "가능" 문구를 포함하는 추진필요 항목
        manualCount++;
      });
    });
    var total = autoCount + manualCount;
    var autoPct = Math.round((autoCount / total) * 100);
    var manualPct = Math.round((manualCount / total) * 100);
    var bar = '<div class="matrix-bar">' +
      '<div class="matrix-bar-seg" style="width:' + autoPct + '%;background:var(--color-auto-text)"></div>' +
      '<div class="matrix-bar-seg" style="width:' + manualPct + '%;background:var(--color-manual-text)"></div>' +
    '</div>';
    var legend = '<div class="matrix-legend">' +
      '<div class="matrix-legend-item"><span class="legend-dot" style="background:var(--color-auto-text)"></span><span>자동 ' + autoCount + '건 (' + autoPct + '%)</span></div>' +
      '<div class="matrix-legend-item"><span class="legend-dot" style="background:var(--color-manual-text)"></span><span>수동 ' + manualCount + '건 (' + manualPct + '%)</span></div>' +
    '</div>';
    return { html: bar + legend, total: total };
  }

  // 근거: 디자인 원본 moduleAutoBars — scr003LineDefs(5개 라인)의 autoTotal("자동/총공정")로부터 계산.
  function computeModuleAutoBars() {
    return D.scr003LineDefs.map(function (l) {
      var parts = l.autoTotal.split('/').map(function (n) { return parseInt(n, 10); });
      var pct = Math.round((parts[0] / parts[1]) * 100);
      return { label: l.label.replace('[BP] ', ''), pct: pct, ratio: l.autoTotal };
    });
  }

  // 근거: 디자인 원본 moduleDirectStaff = 21 + 10 + 8 + 4 + 8 (scr003SummaryRows '조립 인원 (직접)' 행의 5개 값 합)
  function computeModuleDirectStaff() {
    var row = D.scr003SummaryRows.filter(function (r) { return r.label === '조립 인원 (직접)'; })[0];
    var sum = 0;
    row.cells.forEach(function (v) { sum += parseInt(v, 10) || 0; });
    return sum;
  }

  function renderExpansionRoadmapPanel() {
    var cards = D.scr001Expansion.map(function (e) {
      var statusKind = e.status === '진행중' ? 'info' : 'neutral';
      return (
        '<div>' +
          '<div class="expansion-card-head">' +
            '<span class="expansion-card-line">' + esc(e.line) + '</span>' +
            badge(e.status, statusKind) +
          '</div>' +
          '<div class="expansion-card-track-row">' +
            '<div class="rate-bar-track"><div class="rate-bar-fill" style="width:' + e.pct + '%;background:var(--color-primary)"></div></div>' +
            '<span class="expansion-card-pct">' + e.pct + '%</span>' +
          '</div>' +
          '<div class="expansion-card-target">목표 완료: ' + esc(e.target) + '</div>' +
        '</div>'
      );
    }).join('');
    return (
      '<div class="panel" style="flex:1">' +
        '<div class="panel-head-row">' +
          '<div class="panel-title" style="margin-bottom:0">중장기 확대 전개 로드맵</div>' +
          '<a href="#" class="panel-link" data-action="select-screen" data-screen-id="SCR-001">상세 보기 &rsaquo;</a>' +
        '</div>' +
        '<div class="card-grid">' + cards + '</div>' +
      '</div>'
    );
  }

  function renderDASHAUTO() {
    var rateBarsData = D.dashAutoRateBars;
    var overallRate = D.overallRate;
    var moduleBarsData = computeModuleAutoBars();
    var moduleDirectStaff = computeModuleDirectStaff();

    var rateBars = rateBarsData.map(function (r) {
      return '<div class="rate-bar-row">' +
        '<div class="rate-bar-label' + (r.emphasis ? ' emphasis' : '') + '">' + esc(r.label) + '</div>' +
        '<div class="rate-bar-track"><div class="rate-bar-fill" style="width:' + r.value + '%;background:' + rateColor(r.value) + '"></div></div>' +
        '<div class="rate-bar-value" style="color:' + rateColor(r.value) + '">' + r.value + '%</div>' +
      '</div>';
    }).join('');

    var moduleBars = moduleBarsData.map(function (r) {
      return '<div class="rate-bar-row">' +
        '<div class="rate-bar-label">' + esc(r.label) + '</div>' +
        '<div class="rate-bar-track"><div class="rate-bar-fill" style="width:' + r.pct + '%;background:' + rateColor(r.pct) + '"></div></div>' +
        '<div class="rate-bar-value" style="color:' + rateColor(r.pct) + '">' + esc(r.ratio) + '</div>' +
      '</div>';
    }).join('');

    var matrixBar = renderDashAutoMatrixBar();

    var logs = D.scr005Rows.slice(0, 3).map(function (log) {
      var kind = log.resultKind === 'success' ? 'success' : 'danger';
      return '<div class="log-row"><span class="time">' + esc(log.time) + '</span><span>' + esc(log.ifId) + '</span>' + badge(log.result, kind) + '</div>';
    }).join('');

    return (
      '<div data-screen-label="DASH-AUTO 공정 자동화 현황 통합 대시보드">' +
        '<div class="section-title">요약 지표</div>' +
        renderKpiCards(D.dashAutoKpis) +
        '<div class="panel-row">' +
          '<div class="panel" style="flex:1">' +
            '<div class="panel-head-row">' +
              '<div class="panel-title" style="margin-bottom:0">부품 공정 — 공장/라인별 자동화율</div>' +
              '<a href="#" class="panel-link" data-action="select-screen" data-screen-id="SCR-001">부품 공정 &rsaquo;</a>' +
            '</div>' + rateBars +
          '</div>' +
          '<div class="panel" style="flex:1">' +
            '<div class="panel-head-row">' +
              '<div class="panel-title" style="margin-bottom:0">모듈 공정 — 차종별 자동공정/총공정</div>' +
              '<a href="#" class="panel-link" data-action="select-screen" data-screen-id="SCR-003">모듈 공정 &rsaquo;</a>' +
            '</div>' + moduleBars +
          '</div>' +
          '<div class="panel donut-wrap" style="flex:0.6">' +
            '<div class="panel-title" style="align-self:flex-start">전체 자동화율</div>' +
            '<div class="donut" style="background:conic-gradient(var(--color-primary) 0% ' + overallRate + '%, var(--color-table-head-bg) ' + overallRate + '% 100%)">' +
              '<div class="donut-inner"><div class="val">' + overallRate + '%</div><div class="lbl">자동화</div></div>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--color-text-faint);text-align:center">모듈 조립 직접인원 합계 ' + moduleDirectStaff + '명</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel-row">' +
          '<div class="panel" style="flex:1">' +
            '<div class="panel-title">공정별 상세 매트릭스 — 자동/수동 비율 (' + matrixBar.total + '건)</div>' +
            matrixBar.html +
          '</div>' +
          '<div class="panel" style="flex:1">' +
            '<div class="panel-title">최근 I/F 실행결과</div>' + logs +
          '</div>' +
        '</div>' +
        '<div class="panel-row">' +
          renderExpansionRoadmapPanel() +
        '</div>' +
        '<div class="section-title">바로가기</div>' +
        renderLinkGrid(D.dashAutoLinks) +
      '</div>'
    );
  }

  // ---------- DASH-MTRM ----------

  function renderMiniGantt() {
    var quarters = D.ganttQuarters.map(function (q) { return '<div class="mini-gantt-quarter-cell">' + esc(q) + '</div>'; }).join('');
    var rows = D.ganttRowsFull.filter(function (r) { return r.top; }).map(function (r) {
      return '<div class="mini-gantt-row">' +
        '<div class="mini-gantt-row-label">' + esc(r.label) + '</div>' +
        '<div class="mini-gantt-track"><div class="gantt-bar ' + r.barClass + '" style="left:' + r.left + '%;width:' + r.width + '%"></div></div>' +
      '</div>';
    }).join('');
    return (
      '<div class="panel" style="margin-bottom:var(--sp-xl);padding:0">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 20px 16px">' +
          '<div class="panel-title" style="margin-bottom:0">통합 로드맵 간트 미리보기</div>' +
          '<a href="#" data-action="go-to-gantt">전체 보기 &rsaquo;</a>' +
        '</div>' +
        '<div class="mini-gantt-head"><div class="mini-gantt-label-col">로드맵</div><div class="mini-gantt-quarters">' + quarters + '</div></div>' +
        rows +
        '<div style="height:16px"></div>' +
      '</div>'
    );
  }

  function renderDASHMTRM() {
    var progress = D.roadmapProgress.map(function (r) {
      return '<div class="roadmap-progress-item">' +
        '<div class="roadmap-progress-head"><span class="roadmap-progress-name">' + esc(r.name) + '</span>' + badge(r.status, r.statusKind) + '</div>' +
        '<div class="roadmap-progress-bottom">' +
          '<div class="rate-bar-track"><div class="rate-bar-fill" style="width:' + r.pct + '%;background:var(--color-primary)"></div></div>' +
          '<span class="roadmap-progress-pct">' + r.pct + '%</span>' +
        '</div>' +
      '</div>';
    }).join('');

    var trendPreview = D.trendsData.slice(0, 3).map(function (t, i) {
      return '<div class="log-row" style="cursor:pointer" data-action="trend-detail" data-index="' + i + '">' +
        '<span>' + esc(t.title) + '</span><span style="color:var(--color-text-faint)">' + esc(t.date) + ' · 조회 ' + t.views + '</span>' +
      '</div>';
    }).join('');

    return (
      '<div data-screen-label="DASH-MTRM 중장기 방향성 공유 통합 대시보드">' +
        '<div class="section-title">요약 지표</div>' +
        renderKpiCards(D.dashMtrmKpis) +
        renderMiniGantt() +
        '<div class="panel-row">' +
          '<div class="panel" style="flex:1"><div class="panel-title">로드맵 진행률</div>' + progress + '</div>' +
          '<div class="panel" style="flex:1"><div class="panel-title">최근 기술동향</div>' + trendPreview + '</div>' +
        '</div>' +
        '<div class="section-title">바로가기</div>' +
        renderLinkGrid(D.dashMtrmLinks) +
      '</div>'
    );
  }

  // ---------- MTRM-MAIN 메인 대시보드 ----------
  // 근거: 중장기 방향성 공유 그룹의 최종 랜딩 화면 — KPI 5개(SCR-006과 동일 데이터) + 통합 로드맵
  // 미니 간트(dashRoadmaps: scr006Rows의 5개 대표 로드맵을 고정 lead/span 막대로 표시, 행 클릭 시
  // 아코디언으로 taskRoadmapList 상세과제 펼침 — SCR-008과는 별개 데이터/상태) +
  // 생산기술 Tech PR 미리보기(3개, SCR-009와 동일 유형 배지/썸네일) + 최근 기술동향(8개)

  // 근거: barMap — 5개 대표 로드맵의 12분기(26.Q1~28.Q4) 그리드 상 고정 위치/색상.
  var DASH_ROADMAP_BAR_MAP = {
    '차체 자동화 로드맵': { lead: 0, span: 4, color: 'var(--gantt-top-progress)' },
    '조립 자동화 로드맵': { lead: 1, span: 5, color: 'var(--gantt-top-pending)' },
    '도장 자동화 로드맵': { lead: 0, span: 3, color: '#F472B6' },
    '엔진 자동화 로드맵': { lead: 3, span: 4, color: '#10B981' },
    '물류/반송 자동화 로드맵': { lead: 4, span: 4, color: 'var(--color-purple)' },
  };

  function renderMtrmMainGantt(state) {
    var expanded = state.dashExpandedRoadmaps || [];
    var quarterHeader = D.chartQuarters.map(function (q) {
      return '<th class="al-c" style="font-weight:400;font-size:11px;color:var(--color-text-muted)">' + esc(q) + '</th>';
    }).join('');

    var rowsHtml = D.scr006Rows.filter(function (rm) { return DASH_ROADMAP_BAR_MAP[rm.name]; }).map(function (rm) {
      var conf = DASH_ROADMAP_BAR_MAP[rm.name];
      var subs = D.taskRoadmapList.filter(function (r) { return r.roadmap === rm.name; });
      var hasSub = subs.length > 0;
      var isExpanded = hasSub && expanded.indexOf(rm.name) !== -1;
      var isLogistics = rm.name === '물류/반송 자동화 로드맵';
      var expandAttrs = hasSub ? ' style="cursor:pointer" data-action="toggle-dash-roadmap" data-category="' + esc(rm.name) + '"' : '';
      var expandIcon = hasSub ? '<span style="display:inline-block;transition:transform .15s;transform:rotate(' + (isExpanded ? '90' : '0') + 'deg);margin-right:4px;font-size:10px;color:var(--color-text-faint)">&#9656;</span>' : '<span style="display:inline-block;width:14px"></span>';
      var barInner = isLogistics
        ? '<div style="grid-column:' + (conf.lead + 1) + ' / span ' + conf.span + ';background:' + conf.color + ';border-radius:4px;height:24px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden">상세과제 미등록</div>'
        : '<div style="grid-column:' + (conf.lead + 1) + ' / span ' + conf.span + ';background:' + conf.color + ';border-radius:4px;height:16px"></div>';
      var row = '<tr>' +
        '<td class="' + (hasSub ? 'row-clickable' : '') + '" style="font-weight:600"' + expandAttrs + '>' + expandIcon + esc(rm.name) + '</td>' +
        '<td colspan="12" style="padding:6px 8px">' +
          '<div style="display:grid;grid-template-columns:repeat(12,1fr);align-items:center;height:' + (isLogistics ? '24px' : '16px') + '">' + barInner + '</div>' +
        '</td>' +
      '</tr>';

      var subRows = '';
      if (isExpanded) {
        subRows = subs.map(function (r, si) {
          var span = periodToChartSpan(r.period);
          return '<tr style="background:' + (si % 2 === 0 ? 'var(--color-zebra-bg)' : 'var(--color-surface)') + '">' +
            '<td style="padding-left:34px">' +
              '<div style="font-weight:600;color:var(--color-text-sub)">&#8627; ' + esc(r.name) + '</div>' +
              '<div style="display:flex;align-items:center;gap:6px;margin-top:4px">' +
                '<span class="badge badge-' + CHART_SUBTASK_STATUS_KIND[r.status] + '" style="font-size:10px">' + esc(r.status) + '</span>' +
                '<span style="font-size:10px;color:var(--color-text-muted)">' + esc(r.period) + '</span>' +
              '</div>' +
            '</td>' +
            '<td colspan="12" style="padding:6px 8px">' +
              '<div style="display:grid;grid-template-columns:repeat(12,1fr);height:10px">' +
                '<div style="grid-column:' + span.colStart + ' / span ' + span.colSpan + ';background:' + conf.color + ';border-radius:5px"></div>' +
              '</div>' +
            '</td>' +
          '</tr>';
        }).join('');
      }
      return row + subRows;
    }).join('');

    return (
      '<div class="panel" style="margin-bottom:var(--sp-xl);padding:0">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 20px 16px">' +
          '<div class="panel-title" style="margin-bottom:0">통합 로드맵</div>' +
          '<a href="#" class="panel-link" data-action="select-screen" data-screen-id="SCR-006">통합 로드맵 보기 &rsaquo;</a>' +
        '</div>' +
        '<div style="overflow-x:auto;padding:0 20px 20px">' +
          '<table class="data-table gantt-table gantt-table-1row" style="min-width:820px"><thead><tr><th style="min-width:200px">로드맵</th>' + quarterHeader + '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
        '</div>' +
      '</div>'
    );
  }

  function renderMTRMMAIN(state) {
    var techPrPreview = D.techPrCards.slice(0, 3).map(function (c, i) { return renderTechPrCard(c, i, false); }).join('');
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

  function renderTabs(active) {
    var partActive = active === 'part' ? ' active' : '';
    var moduleActive = active === 'module' ? ' active' : '';
    return (
      '<div class="tab-bar">' +
        '<div class="tab-item' + partActive + '" data-action="select-screen" data-screen-id="SCR-001">부품 공정</div>' +
        '<div class="tab-item' + moduleActive + '" data-action="select-screen" data-screen-id="SCR-003">모듈 공정</div>' +
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
    var head = '<th>구분</th>' + D.scr001SummaryCols.map(function (c) {
      return '<th class="al-c"' + (c.bp ? ' style="color:var(--color-primary);background:var(--badge-info-bg)"' : '') + '>' + esc(c.label) + '</th>';
    }).join('');
    var rows = D.scr001SummaryRows.map(function (row) {
      var cells = D.scr001SummaryCols.map(function (col) {
        return '<td class="al-c"' + (col.bp ? ' style="background:var(--badge-info-bg)"' : '') + '>' + formatDelta(row.values[col.id], row.unit) + '</td>';
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
        return '<td class="al-c" style="color:var(--color-primary);font-weight:600;white-space:nowrap">' + esc(cell.t) + '</td>';
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
        '<th class="al-c" colspan="3" style="background:var(--badge-info-bg);color:var(--color-primary)">[BP]창원2C 라인</th>' +
        matrixCols.map(function (c) { return '<th rowspan="2" class="al-c" style="min-width:110px">' + esc(c.label) + '</th>'; }).join('') +
      '</tr>' +
      '<tr>' +
        '<th class="al-c" style="min-width:90px;background:var(--badge-info-bg)">현재</th>' +
        '<th class="al-c" style="min-width:80px;background:var(--badge-info-bg)">개선</th>' +
        '<th style="min-width:170px;background:var(--badge-info-bg)">주요내용</th>' +
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
          '<span' + attrs + ' style="display:inline-flex;align-items:center;gap:4px;background:#111827;color:#fff;font-size:10px;font-weight:500;padding:2px 8px;border-radius:4px' + (row.hasVideo ? ';cursor:pointer' : '') + '">' +
          (row.hasVideo ? '<i class="video-play-icon" style="font-size:8px;animation:none">&#9658;</i>' : '') + '자동</span></td>';
      }
      case 'manual':
        return '<td class="al-c" style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border);color:var(--badge-danger-text);font-weight:600">X 수동</td>';
      default:
        return '<td class="matrix-cell none">-</td>';
    }
  }

  function renderScr003ProcessDetailTable() {
    var head =
      '<tr>' +
        '<th rowspan="2" style="min-width:50px">NO</th><th rowspan="2" style="min-width:200px">작업내용</th>' +
        '<th class="al-c" colspan="2">Best Practice</th>' +
        D.scr003DetailCols.map(function (c) { return '<th rowspan="2" class="al-c" style="min-width:110px">' + esc(c) + '</th>'; }).join('') +
      '</tr>' +
      '<tr>' +
        '<th class="al-c" style="min-width:80px">기술현황</th><th style="min-width:220px">상세계획</th>' +
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
        renderTabs('module') +
        renderFilterBar(D.scr003Filters, { placeholders: D.scr003FilterPlaceholders, hideLabels: true }) +
        '<div style="margin-bottom:var(--sp-md);display:inline-block;font-size:11px;color:var(--color-text-faint)">최종 동기화: ' + esc(D.scr003LastSync) + '</div>' +
        (D.scr003Warning ? '<div class="warning-banner"><span>&#9888;</span><span>정합성 검증 실패 항목이 있습니다. 관리자 확인이 필요합니다.</span></div>' : '') +
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
    var filtered = D.scr002Rows;
    var pageSize = 10;
    var page = state.masterPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      var descCell = r.desc ? '<td style="color:var(--color-primary);font-weight:600">' + esc(r.desc) + '</td>' : td('-', null, 'muted');
      return '<tr>' + td(no, null, 'muted') + td(esc(r.factory)) + td(esc(r.line)) +
        '<td style="font-weight:600;background:var(--color-bg)">' + esc(r.name) + '</td>' +
        td(r.seq, 'right') + descCell +
        td('<button type="button" class="btn-link" data-action="open-modal" data-modal-id="stdProcessRegister">수정</button>' +
           '<button type="button" class="btn-link-danger" style="margin-left:8px" data-action="open-modal" data-modal-id="deleteConfirm">삭제</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-002 표준공정 마스터 관리">' +
        '<div class="filter-bar">' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>공장 전체</option><option>A공장</option><option>B공장</option></select>' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>라인 전체</option><option>1라인</option><option>2라인</option><option>3라인</option></select>' +
          '<input placeholder="표준공정명 검색" style="height:32px;min-width:140px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<input placeholder="순서" style="height:32px;width:80px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<input placeholder="비고 검색" style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<button type="button" class="btn btn-secondary" data-action="run-search">엑셀 다운로드</button>' +
          '<button type="button" class="btn btn-secondary" data-action="open-modal" data-modal-id="stdProcessRegister">+ 표준공정 등록</button>' +
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

  // 근거: isModuleTask — 필터(공정유형/작업명 검색/사용현황/등록일) + 우측 표준 작업명 등록 버튼,
  // 목록 NO(내림차순)/표준 작업명/공정유형/사용현황(연동모듈수, 파란 글씨)/등록일/관리(삭제), 24건 페이지네이션.
  function renderSCR004(state) {
    var filtered = D.scr004Rows;
    var pageSize = 10;
    var page = state.taskPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      return '<tr>' + td(no, null, 'muted') +
        '<td style="font-weight:600">' + esc(r.name) + '</td>' + td(esc(r.type)) +
        '<td class="al-r" style="color:var(--color-primary);font-weight:600">' + r.usage + '</td>' +
        td(esc(r.registered), null, 'muted') +
        td('<button type="button" class="btn-link-danger" data-action="open-modal" data-modal-id="deleteConfirm">삭제</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-004 모듈 표준 작업명 관리">' +
        '<div class="filter-bar">' +
          '<select style="height:32px;min-width:130px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 공정유형</option><option>조립</option><option>배선</option><option>검사</option></select>' +
          '<input placeholder="표준 작업명 검색" style="height:32px;min-width:160px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<input placeholder="사용현황(연동모듈수)" style="height:32px;min-width:150px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<input type="date" style="height:32px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;cursor:pointer" />' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="stdTaskRegister">+ 표준 작업명 등록</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '표준 작업명' }, { label: '공정유형' }, { label: '사용현황(연동모듈수)', align: 'right' }, { label: '등록일' }, { label: '관리', align: 'center' },
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
          '<input type="date" style="height:32px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px" />' +
          '<span>~</span>' +
          '<input type="date" style="height:32px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px" />' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 I/F 유형</option><option>배치</option><option>배치(재처리)</option><option>실시간</option></select>' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 결과</option><option>성공</option><option>실패</option></select>' +
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
    { label: '계획', status: '계획', color: 'var(--badge-warning-text)' },
    { label: '반려', status: '반려', color: 'var(--badge-danger-text)' },
    { label: '보류', status: '보류', color: 'var(--color-text-faint)' },
  ];
  function computeRoadmapKpis() {
    return ROADMAP_KPI_DEFS.map(function (def) {
      var count = def.status ? D.scr006Rows.filter(function (r) { return r.status === def.status; }).length : D.scr006Rows.length;
      return { label: def.label, value: count + '건', color: def.color };
    });
  }
  function renderRoadmapKpiCards(kpis) {
    return '<div class="kpi-grid">' + kpis.map(function (k) {
      return '<div class="kpi-card" style="border-top:4px solid ' + k.color + '" data-action="select-screen" data-screen-id="SCR-006">' +
        '<div style="display:flex;align-items:center;gap:6px;color:var(--color-text-muted);font-weight:500;margin-bottom:8px">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:' + k.color + '"></span><span>' + esc(k.label) + '</span>' +
        '</div>' +
        '<div class="kpi-value">' + esc(k.value) + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderSCR006(state) {
    var filtered = D.scr006Rows;
    var pageSize = 10;
    var page = state.roadmapPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      return '<tr>' +
        td(no, null, 'muted') +
        '<td style="font-weight:500">' + esc(r.section) + '</td>' +
        '<td style="color:var(--color-primary);font-weight:600;cursor:pointer" data-action="select-screen" data-screen-id="SCR-007">' + esc(r.name) + '</td>' +
        td(esc(r.period), null, 'muted') + td(esc(r.task)) +
        td(badge(r.status, r.statusKind), 'center') +
        td('<button type="button" class="btn-outline-sm" data-action="open-modal" data-modal-id="history">이력보기</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div data-screen-label="SCR-006 통합 로드맵">' +
        '<div class="section-title" style="margin-bottom:2px">통합 로드맵</div>' +
        '<div class="screen-subtitle">분과별 중장기 자동화 로드맵 등록/조회 · 로드맵명 선택 시 상세 이동</div>' +
        renderRoadmapKpiCards(computeRoadmapKpis()) +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg);flex-wrap:wrap">' +
          '<select style="height:32px;min-width:110px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option></select>' +
          '<input placeholder="로드맵명 검색" style="height:32px;min-width:140px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 기간</option></select>' +
          '<input placeholder="대표과제 검색" style="height:32px;min-width:140px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 상태</option></select>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<a href="#" data-action="go-to-gantt" style="font-size:13px;font-weight:600;margin-right:8px">간트차트로 보기 &rsaquo;</a>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="roadmapRegister">+ 로드맵 등록</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '분과' }, { label: '로드맵명' }, { label: '기간' }, { label: '대표과제' }, { label: '상태', align: 'center' }, { label: '개정이력', align: 'center' },
        ], rows, { pad12: true }) +
        renderPagination(filtered.length, page, pageSize, 'roadmapPage') +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-007 상세과제 로드맵 관리 ----------

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html isRoadmapMgmt — 통합 로드맵별 세그먼트
  // 탭이 아니라 "통합 로드맵/담당자/기간/진행상태" 드롭다운으로 필터링하는 단일 목록(16건, 10건 단위 페이지네이션).
  function renderSCR007(state) {
    var filtered = D.taskRoadmapList;
    var pageSize = 10;
    var page = state.taskRoadmapPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var body = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      return '<tr>' + td(no, null, 'muted') + td('<strong>' + esc(r.name) + '</strong>') + td(esc(r.owner)) + td(esc(r.period), null, 'muted') +
        td(badge(r.status, r.statusKind), 'center') +
        td('<button type="button" class="btn-outline-sm" data-action="open-modal" data-modal-id="detailTaskRegister">수정</button>', 'center') +
      '</tr>';
    }).join('');
    var roadmapFilterOptions = D.taskRoadmapFilterRoadmaps.map(function (r) { return '<option>통합 로드맵: ' + esc(r) + '</option>'; }).join('');

    return (
      '<div data-screen-label="SCR-007 상세과제 로드맵 관리">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--sp-md)">' +
          '<div><div class="section-title" style="margin-bottom:2px">상세과제 로드맵 관리</div>' +
          '<div class="screen-subtitle" style="margin-bottom:0">통합 로드맵에 속한 세부 과제의 담당자·기간·진행상태 관리</div></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="detailTaskRegister">+ 상세과제 등록</button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg);flex-wrap:wrap">' +
          '<select style="height:32px;min-width:170px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>통합 로드맵: 전체</option>' + roadmapFilterOptions + '</select>' +
          '<select style="height:32px;min-width:110px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>담당자: 전체</option></select>' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>기간: 전체</option></select>' +
          '<select style="height:32px;min-width:130px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>진행상태: 전체</option></select>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '과제명' }, { label: '담당자' }, { label: '기간' }, { label: '진행상태', align: 'center' }, { label: '관리', align: 'center' },
        ], body, { pad12: true }) +
        renderPagination(filtered.length, page, pageSize, 'taskRoadmapPage') +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-008 통합 로드맵 차트 (계층형 간트: 로드맵 막대 + 하위 상세과제 아코디언) ----------

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html categoryColor() — 차체=파랑/조립=주황,
  // 그 외(물류/AI 등 taskRoadmapList에 매핑된 상세과제가 없는 로드맵)는 회색 막대로 표시됩니다.
  function chartCategoryColor(category) {
    if (category === '차체 자동화 로드맵') return 'var(--gantt-top-progress)';
    if (category === '조립 자동화 로드맵') return 'var(--gantt-top-pending)';
    return 'var(--badge-neutral-text)';
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

  function renderSCR008(state) {
    var expanded = state.expandedChartRoadmaps || [];
    var full = state.chartMode === 'full';
    var yearHeader =
      '<th class="al-c" style="min-width:280px;background:var(--color-table-head-bg)" rowspan="2">로드맵 / 과제</th>' +
      '<th class="al-c" colspan="4" style="background:var(--color-table-head-bg)">\'26년</th>' +
      '<th class="al-c" colspan="4">\'27년</th>' +
      '<th class="al-c" colspan="4" style="background:var(--color-table-head-bg)">\'28년</th>';
    var quarterHeader = D.chartQuarters.map(function (q) {
      return '<th class="al-c" style="font-weight:400;font-size:11px;color:var(--color-text-muted)">' + esc(q) + '</th>';
    }).join('');

    var rowsHtml = D.chartTasks.map(function (t) {
      var hasSub = D.taskRoadmapList.some(function (r) { return r.roadmap === t.category; });
      var isExpanded = hasSub && (full || expanded.indexOf(t.category) !== -1);
      var color = chartCategoryColor(t.category);
      var barAttrs = 'data-action="open-chart-detail" data-category="' + esc(t.category) + '" data-manager="' + esc(t.manager) +
        '" data-status="' + esc(t.status) + '" data-progress="' + t.progress + '" data-period="' + esc(t.startQ + ' ~ ' + t.endQ) + '"';
      var expandAttrs = hasSub ? ' style="cursor:pointer" data-action="toggle-chart-expand" data-category="' + esc(t.category) + '"' : '';
      var expandIcon = hasSub ? '<span style="display:inline-block;transition:transform .15s;transform:rotate(' + (isExpanded ? '90' : '0') + 'deg);margin-right:4px;font-size:10px;color:var(--color-text-faint)">&#9656;</span>' : '<span style="display:inline-block;width:14px"></span>';
      var row = '<tr>' +
        '<td class="' + (hasSub ? 'row-clickable' : '') + '" style="font-weight:600"' + expandAttrs + '>' + expandIcon + esc(t.category) + '</td>' +
        '<td colspan="12" style="padding:6px 8px">' +
          '<div style="display:grid;grid-template-columns:repeat(12,1fr);height:24px">' +
            '<div ' + barAttrs + ' style="grid-column:' + t.colStart + ' / span ' + t.colSpan + ';background:' + color + ';border-radius:4px;cursor:pointer;display:flex;align-items:center;padding:0 8px;color:#fff;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden"></div>' +
          '</div>' +
        '</td>' +
      '</tr>';

      var subRows = '';
      if (isExpanded) {
        if (!hasSub) {
          subRows = '<tr style="background:var(--color-zebra-bg)"><td colspan="13" style="padding:10px 16px 10px 34px;color:var(--color-text-faint)">등록된 상세과제가 없습니다.</td></tr>';
        } else {
          var subs = D.taskRoadmapList.filter(function (r) { return r.roadmap === t.category; });
          subRows = subs.map(function (r, si) {
            var span = periodToChartSpan(r.period);
            return '<tr style="background:' + (si % 2 === 0 ? 'var(--color-zebra-bg)' : 'var(--color-surface)') + '">' +
              '<td style="padding-left:34px">' +
                '<div style="font-weight:600;color:var(--color-text-sub)">&#8627; ' + esc(r.name) + '</div>' +
                '<div style="display:flex;align-items:center;gap:6px;margin-top:4px">' +
                  '<span class="badge badge-' + CHART_SUBTASK_STATUS_KIND[r.status] + '" style="font-size:10px">' + esc(r.status) + '</span>' +
                  '<span style="font-size:10px;color:var(--color-text-muted)">' + esc(r.period) + '</span>' +
                '</div>' +
              '</td>' +
              '<td colspan="12" style="padding:6px 8px">' +
                '<div style="display:grid;grid-template-columns:repeat(12,1fr);height:10px">' +
                  '<div style="grid-column:' + span.colStart + ' / span ' + span.colSpan + ';background:' + color + ';border-radius:5px"></div>' +
                '</div>' +
              '</td>' +
            '</tr>';
          }).join('');
        }
      }
      return row + subRows;
    }).join('');

    return (
      '<div data-screen-label="SCR-008 통합 로드맵 차트">' +
        '<div class="section-title" style="margin-bottom:2px">통합 로드맵 차트</div>' +
        '<div class="screen-subtitle">분과별 로드맵·과제 일정을 간트차트로 조회 · 막대 선택 시 상세 팝업</div>' +
        '<div class="gantt-toolbar">' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option><option>차체 분과</option><option>조립 분과</option><option>물류 분과</option></select>' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>2026 ~ 2028</option><option>2026 ~ 2030</option></select>' +
          '<div class="filter-spacer"></div>' +
          '<div class="gantt-legend">' +
            '<span class="gantt-legend-item"><span class="legend-dot" style="border-radius:2px;background:var(--gantt-top-progress)"></span>차체</span>' +
            '<span class="gantt-legend-item"><span class="legend-dot" style="border-radius:2px;background:var(--gantt-top-pending)"></span>조립</span>' +
          '</div>' +
          '<div style="display:flex;border:1px solid var(--color-border-strong);border-radius:4px;overflow:hidden">' +
            '<button type="button" data-action="set-chart-mode" data-mode="summary" class="btn" style="height:30px;border-radius:0;' + (!full ? 'background:var(--color-primary);color:#fff' : 'background:#fff;color:var(--color-text-muted)') + '">요약본</button>' +
            '<button type="button" data-action="set-chart-mode" data-mode="full" class="btn" style="height:30px;border-radius:0;' + (full ? 'background:var(--color-primary);color:#fff' : 'background:#fff;color:var(--color-text-muted)') + '">전체보기</button>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto" class="gantt-container">' +
          '<table class="data-table gantt-table gantt-table-2row" style="min-width:900px"><thead><tr>' + yearHeader + '</tr><tr>' + quarterHeader + '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
        '</div>' +
      '</div>'
    );
  }

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

  function renderTechPrCard(c, i, big) {
    var typeInfo = TECH_PR_TYPE[c.type];
    return '<div class="media-card" data-action="open-techpr-detail" data-index="' + i + '">' +
      techPrThumb(c, big) +
      '<div class="media-body">' +
        '<span class="tech-pr-type-badge" style="color:' + typeInfo.color + ';background:' + typeInfo.bg + '">' + esc(typeInfo.label) + '</span>' +
        '<div class="media-title">' + esc(c.title) + '</div>' +
        '<div class="media-meta">' + esc(c.section) + ' &middot; ' + esc(c.date) + '</div>' +
      '</div>' +
    '</div>';
  }

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html isTechPr — 필터는 제목/과제명 검색
  // 타입 선택 + 검색어 입력 하나뿐이며(techPrFilter.type), 5열 카드 그리드, 10건 초과 시 페이지네이션.
  function renderSCR009(state) {
    var pageSize = 10;
    var page = state.techPrPage || 1;
    var totalPages = Math.max(1, Math.ceil(D.techPrCards.length / pageSize));
    page = Math.min(page, totalPages);
    var pageCards = D.techPrCards.slice((page - 1) * pageSize, page * pageSize);
    var cards = pageCards.map(function (c) { return renderTechPrCard(c, D.techPrCards.indexOf(c), true); }).join('');
    return (
      '<div data-screen-label="SCR-009 생산기술 Tech PR">' +
        '<div class="filter-bar" style="justify-content:space-between">' +
          '<div style="display:flex;align-items:center;gap:var(--sp-sm)">' +
            '<select style="height:32px;min-width:90px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>제목</option><option>과제명</option></select>' +
            '<input placeholder="제목 검색" style="height:32px;min-width:200px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
            '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '</div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="techPrInquiry">기술 문의/제안</button>' +
        '</div>' +
        '<div class="card-grid card-grid-5">' + cards + '</div>' +
        renderPagination(D.techPrCards.length, page, pageSize, 'techPrPage') +
      '</div>'
    );
  }

  // SCR-009 카드 클릭 시 열리는 커스텀 상세 오버레이 (공용 activeModal 모달 시스템과 별도)
  function renderTechPrDetailOverlay(index) {
    var c = D.techPrCards[index];
    if (!c) return '';
    var typeInfo = TECH_PR_TYPE[c.type];
    var body;
    if (c.type === 'video') {
      body = '<div class="techpr-video-frame"><div class="play-btn" style="width:64px;height:64px;font-size:24px">&#9658;</div></div>' +
        '<div class="techpr-desc">' + esc(c.desc) + '</div>';
    } else if (c.type === 'file') {
      body = '<div class="techpr-file-row">' +
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="1.5"><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"></path><path d="M15 3v5h5"></path></svg>' +
        '<div class="techpr-file-meta"><div class="techpr-file-name">' + esc(c.fileName) + '</div><div class="techpr-file-size">' + esc(c.fileSize) + '</div></div>' +
        '<button type="button" class="btn btn-primary">다운로드</button>' +
      '</div>';
    } else if (c.type === 'text') {
      body = '<div class="techpr-desc" style="white-space:pre-line">' + esc(c.body) + '</div>';
    } else {
      body = c.items.map(function (it) {
        var itInfo = TECH_PR_TYPE[it.type];
        var inner = it.type === 'video'
          ? '<div class="techpr-video-frame" style="margin-bottom:10px"><div class="play-btn" style="width:52px;height:52px;font-size:20px">&#9658;</div></div><div class="techpr-desc">' + esc(it.desc) + '</div>'
          : it.type === 'file'
            ? '<div class="techpr-file-row"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="1.6"><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"></path><path d="M15 3v5h5"></path></svg><div class="techpr-file-meta"><div class="techpr-file-name">' + esc(it.fileName) + '</div><div class="techpr-file-size">' + esc(it.fileSize) + '</div></div><button type="button" class="btn btn-primary">다운로드</button></div>'
            : '<div class="techpr-desc">' + esc(it.body) + '</div>';
        return '<div class="techpr-multi-item"><span class="tech-pr-type-badge" style="color:' + itInfo.color + ';background:' + itInfo.bg + '">' + esc(itInfo.label) + '</span>' + inner + '</div>';
      }).join('');
    }
    return (
      '<div class="techpr-overlay">' +
        '<div class="techpr-overlay-box">' +
          '<div class="techpr-overlay-head">' +
            '<span class="tech-pr-type-badge" style="color:' + typeInfo.color + ';background:' + typeInfo.bg + '">' + esc(typeInfo.label) + '</span>' +
            '<div class="modal-title" style="flex:1">' + esc(c.title) + '</div>' +
            '<div class="modal-close" data-action="close-techpr-detail">&#10005;</div>' +
          '</div>' +
          '<div class="techpr-overlay-body">' +
            '<div class="techpr-overlay-meta">분과 &middot; ' + esc(c.section) + ' &nbsp; 등록일 &middot; ' + esc(c.date) + ' &nbsp; 담당자 &middot; ' + esc(c.owner) + '</div>' +
            body +
          '</div>' +
          '<div class="modal-footer"><button type="button" class="btn btn-secondary" style="height:36px" data-action="close-techpr-detail">닫기</button></div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-010 Tech PR 관리자 ----------

  // 근거: isTechPrAdmin — 필터 5종(제목/과제/담당자/첨부 검색/등록일), NO 컬럼(내림차순), 15건 페이지네이션.
  function renderSCR010(state) {
    var filtered = D.scr010Rows;
    var pageSize = 10;
    var page = state.techPrAdminPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      return '<tr>' + td(no, null, 'muted') + td('<strong>' + esc(r.title) + '</strong>') + td(esc(r.task)) + td(esc(r.owner)) +
        td(esc(r.attachment), null, 'muted') + td(esc(r.registered), null, 'muted') +
        td('<button type="button" class="btn-outline-sm" data-action="open-modal" data-modal-id="materialRegister">수정</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-010 Tech PR 관리자">' +
        '<div class="filter-bar">' +
          '<input placeholder="제목 검색" style="height:32px;min-width:160px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<select style="height:32px;min-width:130px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 과제</option><option>용접 자동화</option><option>검사 자동화</option></select>' +
          '<input placeholder="담당자 검색" style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<input placeholder="첨부(문서/동영상) 검색" style="height:32px;min-width:160px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<input type="date" style="height:32px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px" />' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="materialRegister">+ 자료 등록</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '제목' }, { label: '과제' }, { label: '담당자' }, { label: '첨부(문서/동영상)' }, { label: '등록일' }, { label: '관리', align: 'center' },
        ], rows, { pad12: true }) +
        renderPagination(filtered.length, page, pageSize, 'techPrAdminPage') +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-011 mTRM 협의체 관리 ----------

  // 근거: isMtrmCouncil — 필터 6종(협의체명/분과/의제/대상 분과장 검색/등록일/상태), NO 컬럼, 13건 페이지네이션.
  function renderSCR011(state) {
    var filtered = D.scr011Rows;
    var pageSize = 10;
    var page = state.mtrmPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      return '<tr>' + td(no, null, 'muted') + td('<strong>' + esc(r.name) + '</strong>') + td(esc(r.section)) + td(esc(r.agenda)) + td(esc(r.target)) +
        td(esc(r.schedule), null, 'muted') +
        td(badge(r.mailStatus, r.mailKind), 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-011 mTRM 협의체 관리">' +
        '<div class="filter-bar">' +
          '<input placeholder="협의체명 검색" style="height:32px;min-width:150px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option><option>차체</option><option>조립</option></select>' +
          '<input placeholder="의제 검색" style="height:32px;min-width:130px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<input placeholder="대상 분과장 검색" style="height:32px;min-width:140px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<input type="date" style="height:32px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px" />' +
          '<select style="height:32px;min-width:110px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 상태</option><option>발송완료</option><option>발송대기</option></select>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="councilRegister">+ 협의체 등록</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: '협의체명' }, { label: '분과' }, { label: '의제' }, { label: '대상 분과장' }, { label: '일정' }, { label: '메일상태', align: 'center' },
        ], rows, { pad12: true }) +
        renderPagination(filtered.length, page, pageSize, 'mtrmPage') +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-012 mTRM 관리 ----------

  // 근거: isMtrmMgmt — 필터 4종(mTRM명 검색/분과/상태/등록일), NO 컬럼, 13건 페이지네이션.
  function renderSCR012(state) {
    var filtered = D.scr012Rows;
    var pageSize = 10;
    var page = state.mtrmMgmtPage || 1;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
    var rows = pageRows.map(function (r, i) {
      var no = filtered.length - ((page - 1) * pageSize + i);
      return '<tr>' + td(no, null, 'muted') + td('<strong>' + esc(r.name) + '</strong>') + td(esc(r.section)) +
        td(badge(r.status, r.statusKind), 'center') +
        td(esc(r.registered), null, 'muted') +
        td('<button type="button" class="btn-link" data-action="open-modal" data-modal-id="mtrmRegister">수정</button><button type="button" class="btn-link-danger" style="margin-left:8px" data-action="open-modal" data-modal-id="deleteConfirm">삭제</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-012 mTRM 관리">' +
        '<div class="filter-bar" style="margin-bottom:var(--sp-md)">' +
          '<input placeholder="mTRM명 검색" style="height:32px;min-width:180px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option><option>차체</option><option>조립</option></select>' +
          '<select style="height:32px;min-width:100px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 상태</option><option>활성</option><option>비활성</option></select>' +
          '<input type="date" style="height:32px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px" />' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="mtrmRegister">+ mTRM 등록</button>' +
        '</div>' +
        '<div class="panel" style="padding:0">' +
        renderTable([
          { label: 'NO' }, { label: 'mTRM명' }, { label: '분과' }, { label: '상태', align: 'center' }, { label: '등록일' }, { label: '관리', align: 'center' },
        ], rows, { pad12: true }) +
        renderPagination(filtered.length, page, pageSize, 'mtrmMgmtPage') +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-013 기술과제 계획 등록 ----------

  // 근거: isTechTask — 연동 mTRM 로드맵을 선택하면 ROADMAP_MAPPINGS[선택값]에 해당하는 자동 매핑 결과
  // 행이 표시되고, 선택 전(기본값)에는 "연동 mTRM 로드맵을 선택하세요." 안내만 노출된다(techTaskNoMapping).
  // 이 화면은 초기 로드 상태를 그대로 보여준다(다른 화면과 동일하게 셀렉트는 장식용).
  function renderSCR013() {
    var options = D.roadmapOptions.map(function (o) { return '<option value="' + esc(o.label) + '">' + esc(o.label) + '</option>'; }).join('');
    var mappingBody = '<tr><td colspan="3" class="empty-row-cell" style="padding:16px">연동 mTRM 로드맵을 선택하세요.</td></tr>';
    return (
      '<div data-screen-label="SCR-013 기술과제 계획 등록">' +
        '<div class="form-panel">' +
          '<div class="form-row">' +
            '<div class="form-group"><label>과제명 *</label><input /></div>' +
            '<div class="form-group"><label>담당자 *</label><select><option>선택</option><option>홍**</option><option>김**</option></select></div>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:var(--sp-lg)"><label>계획등록일 *</label><input type="date" style="max-width:200px" /></div>' +
          '<div class="form-divider">' +
            '<div class="form-subtitle">mTRM 연동 영역</div>' +
            '<div class="form-group" style="margin-bottom:var(--sp-md)"><label>연동 mTRM 로드맵 *</label>' +
              '<select data-role="task-plan-roadmap"><option value="">선택</option>' + options + '</select>' +
            '</div>' +
            '<div style="font-size:12px;color:var(--color-text-muted);margin-bottom:8px">자동 매핑 결과</div>' +
            '<div style="border:1px solid var(--color-border);border-radius:6px;overflow:hidden">' +
            renderTable([{ label: '매핑 로드맵명' }, { label: '매핑 상세과제' }, { label: '매핑상태', align: 'center' }], mappingBody) +
            '</div>' +
          '</div>' +
          '<div class="form-actions">' +
            '<button type="button" class="btn btn-secondary" style="height:36px">취소</button>' +
            '<button type="button" class="btn btn-primary" style="height:36px">등록</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-014 기술동향 ----------

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html isTechTrend — 상세뷰는 목록/이전/다음
  // 내비게이션 + 큰 이미지 프리뷰(480px) + 본문(content, 없으면 "등록된 설명이 없습니다.")로 구성되고,
  // 목록은 관리자용 수정/등록 버튼 + 5열 카드(재생 아이콘 오버레이) + 15건 페이지네이션.
  function renderSCR014(state) {
    if (state.trendView === 'detail') {
      var t = D.trendsData[state.trendIndex];
      var prevDisabled = state.trendIndex === 0;
      var nextDisabled = state.trendIndex === D.trendsData.length - 1;
      return (
        '<div data-screen-label="SCR-014 기술동향">' +
          '<div class="trend-detail-head">' +
            '<a href="#" data-action="trend-back">&lsaquo; 목록으로</a>' +
            '<div class="trend-detail-nav">' +
              '<button type="button" class="btn btn-secondary" data-action="trend-prev"' + (prevDisabled ? ' disabled' : '') + '>&lsaquo; 이전</button>' +
              '<button type="button" class="btn btn-secondary" data-action="trend-next"' + (nextDisabled ? ' disabled' : '') + '>다음 &rsaquo;</button>' +
            '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="trend-detail-title-row">' +
              '<div style="font-size:20px;font-weight:700">' + esc(t.title) + '</div>' +
              '<div style="font-size:12px;color:var(--color-text-faint);white-space:nowrap;margin-left:16px">조회 ' + (t.views + 1) + ' | ' + esc(t.date) + ' | ' + esc(t.dept) + '/' + esc(t.owner) + '</div>' +
            '</div>' +
            '<div style="font-size:12px;color:var(--color-primary);margin-bottom:var(--sp-md)">#' + esc(t.tag) + '</div>' +
            '<div class="trend-detail-body-preview" style="aspect-ratio:auto;height:480px">브로슈어 / 이미지 / 동영상 프리뷰 영역</div>' +
            '<p style="font-size:14px;color:var(--color-text-sub);line-height:24px;margin-top:20px">' + esc(t.content || '등록된 설명이 없습니다.') + '</p>' +
          '</div>' +
        '</div>'
      );
    }
    var pageSize = 10;
    var page = state.techTrendPage || 1;
    var totalPages = Math.max(1, Math.ceil(D.trendsData.length / pageSize));
    page = Math.min(page, totalPages);
    var pageItems = D.trendsData.slice((page - 1) * pageSize, page * pageSize);
    // 근거: onTechTrendEdit/techTrendSelectMode — "수정" 버튼 클릭 시 카드에 선택 라디오 버튼이 노출되는
    // 선택모드로 전환되고, 카드(또는 라디오) 클릭 즉시 해당 항목의 값이 채워진 수정 팝업이 열립니다.
    var selectMode = !!state.trendSelectMode;
    var cards = pageItems.map(function (c) {
      var i = D.trendsData.indexOf(c);
      var cardAction = selectMode ? 'select-trend-edit' : 'trend-detail';
      var radioOverlay = selectMode
        ? '<label class="trend-select-radio" data-action="select-trend-edit" data-index="' + i + '"><input type="radio" name="trendPick" /></label>'
        : '';
      return '<div class="media-card" style="position:relative" data-action="' + cardAction + '" data-index="' + i + '">' +
        radioOverlay +
        '<div class="media-thumb" style="aspect-ratio:1/1;position:relative">' +
          '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">' +
            '<span class="play-btn" style="width:44px;height:44px">&#9658;</span>' +
          '</span>' +
        '</div>' +
        '<div class="media-body">' +
          '<div class="media-title">' + esc(c.title) + '</div>' +
          '<div class="media-meta">조회 ' + c.views + '</div>' +
          '<div class="media-meta">' + esc(c.date) + ' · ' + esc(c.dept) + ' · ' + esc(c.owner) + ' · #' + esc(c.tag) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    return (
      '<div data-screen-label="SCR-014 기술동향">' +
        '<div class="filter-bar">' +
          '<select style="height:32px;min-width:90px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>제목</option><option>태그</option><option>담당자</option></select>' +
          '<input placeholder="제목 검색" style="height:32px;min-width:180px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-secondary" data-action="toggle-trend-select-mode">수정</button>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="trendRegister">+ 등록</button>' +
        '</div>' +
        (selectMode ? '<div class="field-hint" style="margin:-8px 0 var(--sp-md)">수정할 항목의 라디오 버튼을 선택하세요.</div>' : '') +
        '<div class="card-grid card-grid-5">' + cards + '</div>' +
        renderPagination(D.trendsData.length, page, pageSize, 'techTrendPage') +
      '</div>'
    );
  }

  // ---------- 모달 ----------

  function fieldControl(f) {
    var control;
    switch (f.type) {
      case 'textarea': control = '<textarea></textarea>'; break;
      case 'select':
        control = '<select><option>선택</option>' +
          (f.options || []).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') +
          '</select>';
        break;
      case 'checkboxGroup':
        control = '<div class="checkbox-group">' + (f.options || []).map(function (o) {
          return '<label class="checkbox-item"><input type="checkbox"' + (o.checked ? ' checked' : '') + ' /> <span>' + esc(o.label) + '</span></label>';
        }).join('') + '</div>';
        break;
      case 'date': control = '<input type="date" />'; break;
      case 'file': control = '<div class="file-drop">파일을 드래그하거나 클릭하여 첨부</div>'; break;
      case 'plaintext': control = '<div class="plaintext">' + esc(f.value) + '</div>'; break;
      default: control = '<input type="text"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + ' />';
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

  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html selectCard() — SCR-014 카드 선택모드에서
  // 라디오 버튼(또는 카드) 클릭 시 해당 항목(title/owner/dept/tag/content)이 채워진 상태로 열리는 수정 팝업.
  // MODALS 공용 레지스트리는 필드 기본값을 지원하지 않아 chartDetail/autoVideo와 동일하게 전용 렌더러로 분리합니다.
  function renderTrendEditModal(state) {
    var t = D.trendsData[state.trendEditIndex] || {};
    return (
      '<div class="modal-box" style="width:640px">' +
        '<div class="modal-header"><div class="modal-title">기술동향 수정</div><div class="modal-close" data-action="close-modal">&#10005;</div></div>' +
        '<div class="modal-body">' +
          '<div class="modal-field"><label>제목<span class="required">*</span></label><div class="modal-field-control"><input type="text" value="' + esc(t.title) + '" /></div></div>' +
          '<div class="modal-field"><label>담당자 이름<span class="required">*</span></label><div class="modal-field-control"><input type="text" value="' + esc(t.owner) + '" /></div></div>' +
          '<div class="modal-field"><label>부서명<span class="required">*</span></label><div class="modal-field-control"><input type="text" value="' + esc(t.dept) + '" /></div></div>' +
          '<div class="modal-field"><label>태그</label><div class="modal-field-control"><input type="text" value="' + esc(t.tag) + '" /></div></div>' +
          '<div class="modal-field"><label>내용<span class="required">*</span></label><div class="modal-field-control"><textarea>' + esc(t.content || '') + '</textarea></div></div>' +
          '<div class="modal-field"><label>첨부파일</label><div class="modal-field-control">' + fieldControl({ type: 'file' }) + '</div></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button type="button" class="btn btn-secondary" style="height:36px" data-action="close-modal">취소</button>' +
          '<button type="button" class="btn btn-primary" style="height:36px" data-action="confirm-modal" data-message="기술동향이 수정되었습니다.">수정</button>' +
        '</div>' +
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
    if (state.activeModal === 'trendEdit') return renderTrendEditModal(state);
    if (state.activeModal === 'dashTrendDetail') return renderDashTrendDetailModal(state);
    var modal = MODALS[state.activeModal];
    if (!modal) return '';
    var fields = modal.fields.map(function (f) {
      return '<div class="modal-field"><label>' + esc(f.label) + (f.required ? '<span class="required">*</span>' : '') + '</label>' +
        '<div class="modal-field-control">' + fieldControl(f) + '</div></div>';
    }).join('');
    var confirmAttrs = modal.successMessage
      ? ' data-action="confirm-modal" data-message="' + esc(modal.successMessage) + '"'
      : ' data-action="close-modal"';
    return (
      '<div class="modal-box" style="width:' + modal.size + 'px">' +
        '<div class="modal-header"><div class="modal-title">' + esc(modal.title) + '</div><div class="modal-close" data-action="close-modal">&#10005;</div></div>' +
        '<div class="modal-body">' + fields + '</div>' +
        '<div class="modal-footer">' +
          '<button type="button" class="btn btn-secondary" style="height:36px" data-action="close-modal">취소</button>' +
          '<button type="button" class="btn btn-primary" style="height:36px"' + confirmAttrs + '>' + esc(modal.confirm) + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- 화면 라우팅 테이블 ----------

  var SCREEN_RENDERERS = {
    'FLOW-MAP': renderFLOWMAP,
    'DASH-AUTO': renderDASHAUTO,
    'DASH-MTRM': renderDASHMTRM,
    'SCR-001': renderSCR001,
    'SCR-002': renderSCR002,
    'SCR-003': renderSCR003,
    'SCR-004': renderSCR004,
    'SCR-005': renderSCR005,
    'SCR-006': renderSCR006,
    'SCR-007': renderSCR007,
    'SCR-008': renderSCR008,
    'SCR-009': renderSCR009,
    'SCR-010': renderSCR010,
    'SCR-011': renderSCR011,
    'SCR-012': renderSCR012,
    'SCR-013': renderSCR013,
    'SCR-014': renderSCR014,
    'MTRM-MAIN': renderMTRMMAIN,
  };

  global.PNDES.render = {
    gnbTop: renderGnbTop,
    gnbSide: renderGnbSide,
    screen: function (state) {
      var fn = SCREEN_RENDERERS[state.currentScreen];
      return fn ? fn(state) : '';
    },
    modal: renderModal,
    techPrDetail: function (state) {
      return state.techPrDetailIndex != null ? renderTechPrDetailOverlay(state.techPrDetailIndex) : '';
    },
    toast: function (state) {
      if (!state.toast) return '';
      return '<div class="toast"><span class="toast-dot"></span><span>' + esc(state.toast) + '</span></div>';
    },
  };
})(window);
