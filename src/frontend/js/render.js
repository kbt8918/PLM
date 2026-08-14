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
      '<table class="data-table"' + (opts.style ? ' style="' + opts.style + '"' : '') + '>' +
        '<thead><tr>' + thead + '</tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>'
    );
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
  // 근거: 중장기 방향성 공유 그룹의 최종 랜딩 화면 — KPI 3개(SCR-006과 동일 데이터) + 통합 로드맵
  // 미니 간트(행 클릭 시 SCR-008) + 생산기술 Tech PR 미리보기(3개, SCR-009와 동일 유형 배지/썸네일) + 최근 기술동향(3개)

  function renderMtrmMainGantt() {
    var quarters = D.ganttQuarters.map(function (q) { return '<div class="mini-gantt-quarter-cell">' + esc(q) + '</div>'; }).join('');
    var rows = D.ganttRowsFull.filter(function (r) { return r.top; }).map(function (r, i) {
      return '<div class="mini-gantt-row" style="cursor:pointer;background:' + (i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-zebra-bg)') + '" data-action="select-screen" data-screen-id="SCR-008">' +
        '<div class="mini-gantt-row-label">' + esc(r.label) + '</div>' +
        '<div class="mini-gantt-track"><div class="gantt-bar ' + r.barClass + '" style="left:' + r.left + '%;width:' + r.width + '%"></div></div>' +
      '</div>';
    }).join('');
    return (
      '<div class="panel" style="margin-bottom:var(--sp-xl);padding:0">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 20px 16px">' +
          '<div class="panel-title" style="margin-bottom:0">통합 로드맵</div>' +
          '<a href="#" data-action="select-screen" data-screen-id="SCR-006">통합 로드맵 보기 &rsaquo;</a>' +
        '</div>' +
        '<div class="mini-gantt-head"><div class="mini-gantt-label-col">로드맵</div><div class="mini-gantt-quarters">' + quarters + '</div></div>' +
        rows +
        '<div style="height:16px"></div>' +
      '</div>'
    );
  }

  function renderMTRMMAIN() {
    var techPrPreview = D.techPrCards.slice(0, 3).map(function (c, i) { return renderTechPrCard(c, i, false); }).join('');
    var trendPreview = D.trendsData.slice(0, 3).map(function (t, i) {
      return '<div class="log-row" style="cursor:pointer" data-action="trend-detail" data-index="' + i + '">' +
        '<span>' + esc(t.title) + '</span><span style="color:var(--color-text-faint)">' + esc(t.date) + ' &middot; 조회 ' + t.views + '</span>' +
      '</div>';
    }).join('');
    return (
      '<div data-screen-label="MTRM-MAIN 메인 대시보드">' +
        '<div class="section-title" style="margin-bottom:2px">메인 대시보드</div>' +
        '<div class="screen-subtitle">통합 로드맵·생산기술 Tech PR·기술동향을 한 화면에서 확인</div>' +
        renderStatGrid(computeScr006Stats()) +
        renderMtrmMainGantt() +
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
    return '<table class="data-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
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
        return '<td class="al-c">' + badge(cell.t, 'warning') + '</td>';
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

    return '<table class="data-table sticky-head"><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table>';
  }

  function renderSCR001() {
    return (
      '<div data-screen-label="SCR-001 부품 공정 자동화 현황">' +
        renderTabs('part') +
        renderFilterBar(D.scr001Filters, { placeholders: D.scr001FilterPlaceholders, hideLabels: true, noReset: true, searchAction: 'scr001-search' }) +
        '<div class="section-title">요약 현황 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(공장/라인별 자동화율·직접인원 현재&rarr;개선 및 중장기 완료일정)</span></div>' +
        renderScr001SummaryTable() +
        '<div class="actions-row" style="margin-top:var(--sp-lg)">' +
          '<div class="section-title" style="margin-bottom:0">공정별 상세 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(현재/개선/주요내용 · 공장/라인별 확대전개계획, 현재=자동 선택 시 동영상 팝업)</span></div>' +
          '<div class="actions-group">' +
            '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="registerProcess">+ 공정 등록</button>' +
            '<button type="button" class="btn btn-secondary" data-action="scr001-excel">엑셀</button>' +
            '<button type="button" class="btn btn-secondary" data-action="open-modal" data-modal-id="emailShare">이메일 공유</button>' +
          '</div>' +
        '</div>' +
        '<div class="scroll-panel" style="max-height:520px">' + renderScr001ProcessDetailTable() + '</div>' +
      '</div>'
    );
  }

  function scr003Value(v) {
    return v == null || v === '-' ? '<span class="muted">-</span>' : esc(v);
  }

  // 근거: scr003SummaryCols(7열: Best Practice/국내외종합(계)/조지아 대표차종/울산 차종명/차종명x3)과
  // scr003SummaryRows.cells(동일 순서 7개 값)를 그대로 인덱스 매핑합니다.
  function renderScr003SummaryTable() {
    var head = '<th>구분</th>' + D.scr003SummaryCols.map(function (c) {
      var style = c.bp ? ' style="background:var(--badge-warning-bg)"' : '';
      return '<th class="al-c"' + style + '>' + esc(c.label) + '</th>';
    }).join('');

    var rows = D.scr003SummaryRows.map(function (row) {
      var cells = row.cells.map(function (v) { return '<td class="al-c">' + scr003Value(v) + '</td>'; }).join('');
      return '<tr><td><strong>' + esc(row.label) + '</strong></td>' + cells + '</tr>';
    }).join('');

    return '<table class="data-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // 근거: scr003ProcessDetail.cells(5열: 조지아/울산/차종명x3) — auto는 클릭 가능한 "● 자동" 필,
  // manual은 텍스트 "X 수동"(클릭 불가), null은 '-'.
  function renderScr003ExpansionCell(kind, row) {
    switch (kind) {
      case 'auto':
        var attrs = row.hasVideo ? ' style="cursor:pointer" data-action="open-video" data-process="' + esc(row.task) + '"' : '';
        return '<td class="al-c"' + attrs + ' style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border)"><span class="badge badge-success">&#9679; 자동</span></td>';
      case 'manual':
        return '<td class="al-c" style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border);color:var(--color-text-sub)">X 수동</td>';
      default:
        return '<td class="matrix-cell none">-</td>';
    }
  }

  function renderScr003ProcessDetailTable() {
    var head =
      '<tr>' +
        '<th rowspan="2" style="min-width:60px">NO</th><th rowspan="2" style="min-width:220px">작업내용</th>' +
        '<th class="al-c" colspan="2" style="background:var(--badge-warning-bg)">Best Practice</th>' +
        D.scr003DetailCols.map(function (c) { return '<th rowspan="2" class="al-c" style="min-width:110px">' + esc(c) + '</th>'; }).join('') +
      '</tr>' +
      '<tr>' +
        '<th class="al-c" style="min-width:80px">기술 현황</th><th style="min-width:240px">상세 계획</th>' +
      '</tr>';

    var rowsHtml = D.scr003ProcessDetail.map(function (row) {
      var techSymbol = row.tech === 'auto' ? '&#9679;' : row.tech === 'partial' ? '&#9650;' : 'X';
      var techKind = row.tech === 'auto' ? 'success' : row.tech === 'partial' ? 'warning' : 'neutral';
      var techAttrs = row.tech === 'auto' && row.hasVideo ? ' style="cursor:pointer" data-action="open-video" data-process="' + esc(row.task) + '"' : '';
      var expansionCells = row.cells.map(function (kind) { return renderScr003ExpansionCell(kind, row); }).join('');
      return '<tr>' +
        td(row.no, 'center') +
        td('<strong>' + esc(row.task) + '</strong>') +
        '<td class="al-c"' + techAttrs + '><span class="badge badge-' + techKind + '">' + techSymbol + '</span></td>' +
        '<td class="muted">' + esc(row.plan) + '</td>' +
        expansionCells +
      '</tr>';
    }).join('');

    return '<table class="data-table"><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table>';
  }

  function renderSCR003() {
    return (
      '<div data-screen-label="SCR-003 모듈 공정 자동화 현황">' +
        renderTabs('module') +
        renderFilterBar(D.scr003Filters) +
        '<div class="filter-sync-badge" style="margin-bottom:var(--sp-md);display:inline-block">최종 동기화: ' + esc(D.scr003LastSync) + '</div>' +
        (D.scr003Warning ? '<div class="warning-banner"><span>&#9888;</span><span>정합성 검증 실패 항목이 있습니다. 관리자 확인이 필요합니다.</span></div>' : '') +
        '<div class="section-title">요약 현황 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(공장/차종별 자동화율·인원 및 성인화 실적/계획)</span></div>' +
        renderScr003SummaryTable() +
        '<div class="actions-row" style="margin-top:var(--sp-lg)">' +
          '<div class="section-title" style="margin-bottom:0">작업내용별 상세 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(Best Practice 기술현황/상세계획 · 차종별 확대전개계획, 자동 선택 시 상세 팝업)</span></div>' +
          '<div class="actions-group">' +
            '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="registerProcess">+ 작업내용 등록</button>' +
            '<button type="button" class="btn btn-secondary">엑셀</button>' +
            '<button type="button" class="btn btn-secondary" data-action="open-modal" data-modal-id="emailShare">이메일 공유</button>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto">' + renderScr003ProcessDetailTable() + '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-002 표준공정 마스터 관리 ----------

  function renderSCR002() {
    var rows = D.scr002Rows.map(function (r) {
      return '<tr>' + td(esc(r.plant)) + td(esc(r.line)) + td(esc(r.name)) + td(r.seq, 'right') + td(esc(r.note), null, 'muted') +
        td('<button type="button" class="btn-link">수정</button><button type="button" class="btn-link-danger" style="margin-left:8px">삭제</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-002 표준공정 마스터 관리">' +
        '<div class="filter-bar">' +
          '<div class="filter-field"><label>공장</label><select><option>전체</option></select></div>' +
          '<div class="filter-field"><label>라인</label><select><option>전체</option></select></div>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-secondary">초기화</button>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<button type="button" class="btn btn-secondary">엑셀 다운로드</button>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-md)">' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="stdProcessRegister">+ 표준공정 등록</button>' +
        '</div>' +
        renderTable([
          { label: '공장' }, { label: '라인' }, { label: '표준공정명' }, { label: '순서', align: 'right' }, { label: '비고' }, { label: '관리', align: 'center' },
        ], rows) +
      '</div>'
    );
  }

  // ---------- SCR-004 모듈 표준 작업명 관리 ----------

  function renderSCR004() {
    var rows = D.scr004Rows.map(function (r) {
      return '<tr>' + td(esc(r.name)) + td(esc(r.type)) +
        td(r.usage, 'right') +
        td(esc(r.registered), null, 'muted') +
        td('<button type="button" class="btn-link-danger" data-action="open-modal" data-modal-id="deleteConfirm">삭제</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-004 모듈 표준 작업명 관리">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<select style="height:32px;min-width:140px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 공정유형</option></select>' +
          '<input placeholder="작업명 검색" style="height:32px;min-width:200px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="stdTaskRegister">+ 표준 작업명 등록</button>' +
        '</div>' +
        renderTable([
          { label: '표준 작업명' }, { label: '공정유형' }, { label: '사용현황(연동모듈수)', align: 'right' }, { label: '등록일' }, { label: '관리', align: 'center' },
        ], rows) +
      '</div>'
    );
  }

  // ---------- SCR-005 I/F 실행결과 관리 ----------

  function renderSCR005() {
    var rows = D.scr005Rows.map(function (r) {
      var trAttrs = r.clickable ? ' class="row-clickable" data-action="open-modal" data-modal-id="' + r.modal + '"' : '';
      return '<tr' + trAttrs + '>' +
        td(esc(r.time)) + td(esc(r.ifId)) + td(esc(r.type)) + td(esc(r.count), 'right') +
        td(badge(r.result, r.resultKind), 'center') +
        td(esc(r.reason), null, 'muted') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-005 I/F 실행결과 관리">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<input type="date" style="height:32px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px" />' +
          '<span>~</span>' +
          '<input type="date" style="height:32px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px" />' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 I/F 유형</option></select>' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 결과</option></select>' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
        '</div>' +
        renderTable([
          { label: '실행시각' }, { label: 'I/F-ID' }, { label: '유형' }, { label: '처리건수', align: 'right' }, { label: '결과', align: 'center' }, { label: '실패 원인' },
        ], rows) +
      '</div>'
    );
  }

  // ---------- SCR-006 통합 로드맵 ----------

  // 근거: scr006Stats = [등록 로드맵(전체 건수), 진행중(파랑), 계획(주황)] — scr006Rows로부터 집계
  function computeScr006Stats() {
    var total = D.scr006Rows.length;
    var inProgress = D.scr006Rows.filter(function (r) { return r.status === '진행중'; }).length;
    var planned = D.scr006Rows.filter(function (r) { return r.status === '계획'; }).length;
    return [
      { label: '등록 로드맵', value: total + '건', color: '' },
      { label: '진행중', value: inProgress + '건', color: 'var(--color-primary)' },
      { label: '계획', value: planned + '건', color: 'var(--badge-warning-text)' },
    ];
  }

  function renderStatGrid(stats) {
    return '<div class="stat-grid">' + stats.map(function (s) {
      return '<div class="stat-card"><div class="stat-value" style="' + (s.color ? 'color:' + s.color : '') + '">' + esc(s.value) + '</div><div class="stat-label">' + esc(s.label) + '</div></div>';
    }).join('') + '</div>';
  }

  function renderSCR006() {
    var rows = D.scr006Rows.map(function (r) {
      return '<tr class="row-clickable" data-action="select-screen" data-screen-id="SCR-007" data-roadmap-id="' + r.roadmapId + '">' +
        '<td style="color:var(--color-primary);font-weight:600">' + esc(r.section) + '</td>' +
        '<td style="font-weight:500">' + esc(r.name) + '</td>' +
        td(esc(r.period), null, 'muted') + td(esc(r.task)) +
        td(badge(r.status, r.statusKind), 'center') +
        td('<button type="button" class="btn-outline-sm" data-action="open-modal" data-modal-id="history">이력보기</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div data-screen-label="SCR-006 통합 로드맵">' +
        '<div class="section-title" style="margin-bottom:2px">통합 로드맵</div>' +
        '<div class="screen-subtitle">분과별 중장기 자동화 로드맵 등록/조회 · 로드맵명 선택 시 상세 이동</div>' +
        renderStatGrid(computeScr006Stats()) +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option></select>' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 상태</option></select>' +
          '<div class="filter-spacer"></div>' +
          '<a href="#" data-action="go-to-gantt" style="font-size:13px;font-weight:600;margin-right:8px">간트차트로 보기 &rsaquo;</a>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="roadmapRegister">+ 로드맵 등록</button>' +
        '</div>' +
        renderTable([
          { label: '분과' }, { label: '로드맵명' }, { label: '기간' }, { label: '대표과제' }, { label: '상태', align: 'center' }, { label: '개정이력', align: 'center' },
        ], rows) +
      '</div>'
    );
  }

  // ---------- SCR-007 상세과제 로드맵 관리 ----------

  // 근거: SCR-007은 드롭다운이 아니라 세그먼트 탭(pill) 형태로 소속 통합 로드맵을 전환합니다.
  // 빈 상태(과제 없음)에는 안내문 + "+ 상세과제 등록" CTA 버튼을 함께 노출합니다.
  function renderSCR007(state) {
    var selected = state.selectedParentRoadmap;
    var rows = D.scr007Data[selected] || [];
    var tabs = D.roadmapOptions.map(function (o) {
      return '<div class="tab-pill' + (o.id === selected ? ' active' : '') + '" data-action="select-parent-roadmap" data-roadmap-id="' + o.id + '">' + esc(o.label) + '</div>';
    }).join('');
    var body = rows.length
      ? rows.map(function (r) {
          return '<tr>' + td('<strong>' + esc(r.name) + '</strong>') + td(esc(r.owner)) + td(esc(r.period), null, 'muted') +
            td(badge(r.status, r.statusKind), 'center') +
            td('<button type="button" class="btn-outline-sm">수정</button>', 'center') +
          '</tr>';
        }).join('')
      : '<tr><td colspan="5" class="empty-row-cell">' +
          '<div style="margin-bottom:12px">등록된 상세과제가 없습니다</div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="detailTaskRegister">+ 상세과제 등록</button>' +
        '</td></tr>';

    return (
      '<div data-screen-label="SCR-007 상세과제 로드맵 관리">' +
        '<div class="section-title" style="margin-bottom:2px">상세과제 로드맵 관리</div>' +
        '<div class="screen-subtitle">통합 로드맵에 속한 세부 과제의 담당자·기간·진행상태 관리</div>' +
        '<div style="display:flex;align-items:center;gap:var(--sp-md);margin-bottom:var(--sp-lg)">' +
          '<div class="tab-pill-group">' + tabs + '</div>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="detailTaskRegister">+ 상세과제 등록</button>' +
        '</div>' +
        renderTable([
          { label: '과제명' }, { label: '담당자' }, { label: '기간' }, { label: '진행상태', align: 'center' }, { label: '관리', align: 'center' },
        ], body) +
      '</div>'
    );
  }

  // ---------- SCR-008 mTRM 통합 로드맵 대시보드(간트) ----------

  // 근거: SCR-008은 (1) 분과 색상 범례(차체=파랑/조립=주황), (2) 분기 헤더 위 연도 그룹 헤더 행,
  // (3) 요약본/전체보기 토글(state.ganttView)로 부모행만/부모+자식행 필터링, (4) 지그재그(줄무늬) 행 배경을 포함합니다.
  var GANTT_YEARS = [{ label: "'26년", span: 4 }, { label: "'27년", span: 4 }, { label: "'28년", span: 4 }];

  function renderSCR008(state) {
    var full = state.ganttView === 'full';
    var yearHeader = GANTT_YEARS.map(function (y) { return '<div class="gantt-year-cell" style="flex:' + y.span + '">' + esc(y.label) + '</div>'; }).join('');
    var quarters = D.ganttQuarters.map(function (q) { return '<div class="gantt-quarter-cell">' + esc(q) + '</div>'; }).join('');
    var rows = D.ganttRowsFull.filter(function (r) { return full || r.top; }).map(function (r, i) {
      return '<div class="gantt-row" style="background:' + (i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-zebra-bg)') + '">' +
        '<div class="gantt-row-label" style="padding-left:' + r.indent + 'px;font-weight:' + (r.top ? 600 : 400) + '">' + esc(r.label) + '</div>' +
        '<div class="gantt-track"><div class="gantt-bar ' + r.barClass + '" style="left:' + r.left + '%;width:' + r.width + '%" data-action="open-modal" data-modal-id="' + r.modal + '"></div></div>' +
      '</div>';
    }).join('');
    return (
      '<div data-screen-label="SCR-008 통합 로드맵 차트">' +
        '<div class="section-title" style="margin-bottom:2px">통합 로드맵 차트</div>' +
        '<div class="screen-subtitle">분과별 로드맵·과제 일정을 간트차트로 조회 · 막대 선택 시 상세 팝업</div>' +
        '<div class="gantt-toolbar">' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option></select>' +
          '<span style="font-size:12px;color:var(--color-text-muted)">2026 ~ 2028</span>' +
          '<div class="filter-spacer"></div>' +
          '<div class="gantt-legend">' +
            '<span class="gantt-legend-item"><span class="legend-dot" style="border-radius:2px;background:var(--gantt-top-progress)"></span>차체</span>' +
            '<span class="gantt-legend-item"><span class="legend-dot" style="border-radius:2px;background:var(--gantt-top-pending)"></span>조립</span>' +
          '</div>' +
          '<div class="gantt-view-toggle">' +
            '<label data-action="set-gantt-view" data-view="summary"><input type="radio" ' + (!full ? 'checked' : '') + ' readonly /> 요약본</label>' +
            '<label data-action="set-gantt-view" data-view="full"><input type="radio" ' + (full ? 'checked' : '') + ' readonly /> 전체보기</label>' +
          '</div>' +
        '</div>' +
        '<div class="gantt-container">' +
          '<div class="gantt-header-row"><div class="gantt-label-col"></div><div class="gantt-quarters">' + yearHeader + '</div></div>' +
          '<div class="gantt-header-row"><div class="gantt-label-col">로드맵 / 과제</div><div class="gantt-quarters">' + quarters + '</div></div>' +
          rows +
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
    if (c.type === 'video') {
      return '<div class="media-thumb"><div class="play-btn" style="width:' + playSize + ';height:' + playSize + '">&#9658;</div></div>';
    }
    if (c.type === 'file') {
      return '<div class="media-thumb media-thumb-file">' +
        '<svg width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="1.6"><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"></path><path d="M15 3v5h5"></path></svg>' +
        (big ? '<span class="media-thumb-filename">' + esc(c.fileName) + '</span>' : '') +
      '</div>';
    }
    if (c.type === 'text') {
      return '<div class="media-thumb media-thumb-text"><div class="media-thumb-text-body">' + esc(c.body) + '</div></div>';
    }
    // multi
    var count = c.items ? c.items.length : 0;
    return '<div class="media-thumb media-thumb-multi">' +
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

  function renderSCR009() {
    var cards = D.techPrCards.map(function (c, i) { return renderTechPrCard(c, i, true); }).join('');
    return (
      '<div data-screen-label="SCR-009 생산기술 Tech PR">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 과제</option></select>' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option></select>' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 소재유형</option></select>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="techPrInquiry">기술 문의/제안</button>' +
        '</div>' +
        '<div class="card-grid card-grid-5">' + cards + '</div>' +
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

  function renderSCR010() {
    var rows = D.scr010Rows.map(function (r) {
      return '<tr>' + td('<strong>' + esc(r.title) + '</strong>') + td(esc(r.task)) + td(esc(r.owner)) +
        td(esc(r.attachment), null, 'muted') + td(esc(r.registered), null, 'muted') +
        td('<button type="button" class="btn-outline-sm">수정</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-010 Tech PR 관리자">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<select style="height:32px;min-width:140px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 과제</option></select>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="materialRegister">+ 자료 등록</button>' +
        '</div>' +
        renderTable([
          { label: '제목' }, { label: '과제' }, { label: '담당자' }, { label: '첨부(문서/동영상)' }, { label: '등록일' }, { label: '관리', align: 'center' },
        ], rows) +
      '</div>'
    );
  }

  // ---------- SCR-011 mTRM 협의체 관리 ----------

  function renderSCR011() {
    var rows = D.scr011Rows.map(function (r) {
      return '<tr>' + td('<strong>' + esc(r.name) + '</strong>') + td(esc(r.section)) + td(esc(r.agenda)) + td(esc(r.target)) +
        td(esc(r.schedule), null, 'muted') +
        td(badge(r.mailStatus, r.mailKind), 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-011 mTRM 협의체 관리">' +
        '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-md)">' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="councilRegister">+ 협의체 등록</button>' +
        '</div>' +
        renderTable([
          { label: '협의체명' }, { label: '분과' }, { label: '의제' }, { label: '대상 분과장' }, { label: '일정' }, { label: '메일상태', align: 'center' },
        ], rows) +
      '</div>'
    );
  }

  // ---------- SCR-012 mTRM 관리 ----------

  function renderSCR012() {
    var rows = D.scr012Rows.map(function (r) {
      return '<tr>' + td('<strong>' + esc(r.name) + '</strong>') + td(esc(r.section)) +
        td(badge(r.status, r.statusKind), 'center') +
        td(esc(r.registered), null, 'muted') +
        td('<button type="button" class="btn-link">수정</button><button type="button" class="btn-link-danger" style="margin-left:8px" data-action="open-modal" data-modal-id="deleteConfirm">삭제</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div class="admin-screen" data-screen-label="SCR-012 mTRM 관리">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-md)">' +
          '<input placeholder="mTRM명 검색" style="height:32px;min-width:220px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="mtrmRegister">+ mTRM 등록</button>' +
        '</div>' +
        renderTable([
          { label: 'mTRM명' }, { label: '분과' }, { label: '상태', align: 'center' }, { label: '등록일' }, { label: '관리', align: 'center' },
        ], rows) +
      '</div>'
    );
  }

  // ---------- SCR-013 기술과제 계획 등록 ----------

  function renderSCR013() {
    var m = D.taskPlanMapping;
    var options = D.roadmapOptions.map(function (o) { return '<option value="' + o.id + '">' + esc(o.label) + '</option>'; }).join('');
    return (
      '<div data-screen-label="SCR-013 기술과제 계획 등록">' +
        '<div class="form-panel">' +
          '<div class="form-row">' +
            '<div class="form-group"><label>과제명 *</label><input /></div>' +
            '<div class="form-group"><label>담당자 *</label><select><option>선택</option></select></div>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:var(--sp-lg)"><label>계획등록일 *</label><input type="date" style="max-width:200px" /></div>' +
          '<div class="form-divider">' +
            '<div class="form-subtitle">mTRM 연동 영역</div>' +
            '<div class="form-group" style="margin-bottom:var(--sp-md)"><label>연동 mTRM 로드맵 *</label>' +
              '<select data-role="task-plan-roadmap">' + options + '</select>' +
            '</div>' +
            '<div style="font-size:12px;color:var(--color-text-muted);margin-bottom:8px">자동 매핑 결과</div>' +
            renderTable([{ label: '매핑 로드맵명' }, { label: '매핑 상세과제' }, { label: '매핑상태', align: 'center' }],
              '<tr>' + td(esc(m.roadmapName)) + td(esc(m.detailTask)) + td(badge(m.status, m.statusKind), 'center') + '</tr>') +
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
              '<div style="font-size:12px;color:var(--color-text-faint)">조회 ' + (t.views + 1) + ' | ' + esc(t.date) + ' | ' + esc(t.dept) + '/' + esc(t.owner) + '</div>' +
            '</div>' +
            '<div style="font-size:12px;color:var(--color-primary);margin-bottom:var(--sp-md)">' + esc(t.tag) + '</div>' +
            '<div class="trend-detail-body-preview">본문 / 이미지 / 동영상 프리뷰 영역</div>' +
          '</div>' +
        '</div>'
      );
    }
    var cards = D.trendsData.map(function (c, i) {
      return '<div class="media-card" data-action="trend-detail" data-index="' + i + '">' +
        '<div class="media-thumb" style="aspect-ratio:16/9"></div>' +
        '<div class="media-body">' +
          '<div class="media-title">' + esc(c.title) + '</div>' +
          '<div class="media-meta">조회 ' + c.views + '</div>' +
          '<div class="media-meta">' + esc(c.date) + ' · ' + esc(c.dept) + ' · ' + esc(c.owner) + ' · ' + esc(c.tag) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    return (
      '<div data-screen-label="SCR-014 기술동향">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<select style="height:32px;min-width:180px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체(글로벌 트렌드/신기술 자료/기술개발 제안)</option></select>' +
          '<input placeholder="태그 검색" style="height:32px;min-width:140px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 10px" />' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="trendRegister">+ 등록</button>' +
        '</div>' +
        renderCardGrid(cards) +
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

  function renderModal(state) {
    if (!state.activeModal) return '';
    if (state.activeModal === 'autoVideo') return renderAutoVideoModal(state);
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
