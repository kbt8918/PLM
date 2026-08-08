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
    var fields = labels.map(function (label) {
      return '<div class="filter-field"><label>' + esc(label) + '</label>' +
        '<select><option>전체</option></select></div>';
    }).join('');
    var reset = opts.noReset ? '' : '<button type="button" class="btn btn-secondary">초기화</button>';
    var syncBadge = opts.syncBadge ? '<div class="filter-sync-badge">최종 동기화: ' + esc(opts.syncBadge) + '</div>' : '';
    return (
      '<div class="filter-bar">' +
        fields +
        '<div class="filter-spacer"></div>' +
        reset +
        '<button type="button" class="btn btn-primary" data-action="run-search">조회</button>' +
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

  function renderGnbSide(currentScreen) {
    var html = '';
    global.PNDES.NAV.forEach(function (group) {
      var items = group.items.filter(isNavItemVisible);
      if (!items.length) return;
      html += '<div class="gnb-group"><div class="gnb-group-title">' + esc(group.title) + '</div>';
      items.forEach(function (id) {
        var meta = SCREENS[id];
        var active = id === currentScreen ? ' active' : '';
        html += '<div class="gnb-item' + active + '" data-action="select-screen" data-screen-id="' + id + '">' +
          '<span>' + esc(meta.name) + '</span>' +
          (meta.admin ? '<span class="admin-mark">A</span>' : '') +
        '</div>';
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
  // SCR-001 요약현황(자동화율 행)·공정별 상세(현재 상태)를 단일 소스로 삼아 라이브 계산합니다.
  // (데이터 정합성 유지: SCR-001에서 값이 바뀌면 대시보드도 함께 바뀝니다)

  function findSummaryRow(label) {
    return D.scr001SummaryRows.filter(function (r) { return r.label === label; })[0];
  }

  function currentRatePctOf(cellVal) {
    return cellVal.value != null ? cellVal.value : cellVal.before;
  }

  function computeDashAutoRateBars() {
    var rateRow = findSummaryRow('자동화율');
    return D.scr001SummaryCols.map(function (col) {
      var v = rateRow.values[col.id];
      return { label: col.label, value: currentRatePctOf(v), emphasis: !!col.bp };
    });
  }

  function computeOverallRate(rateBars) {
    var sum = 0;
    rateBars.forEach(function (r) { sum += r.value; });
    return Math.round(sum / rateBars.length);
  }

  function renderDashAutoMatrixBar() {
    var autoCount = 0, manualCount = 0;
    D.scr001ProcessDetail.forEach(function (row) {
      if (row.current.kind === 'auto') autoCount++; else if (row.current.kind === 'manual') manualCount++;
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

  // SCR-003 요약현황('자동공정 / 총 공정' 행)을 단일 소스로 삼아 모듈 공정 막대그래프를 라이브 계산합니다.
  function findScr003Row(label) {
    return D.scr003SummaryRows.filter(function (r) { return r.label === label; })[0];
  }

  function computeModuleAutoBars() {
    var row = findScr003Row('자동공정 / 총 공정');
    var bars = [];
    D.scr003LineCols.forEach(function (col) {
      if (col.bp || col.id === 'total') return;
      var v = row.values[col.id];
      if (!v) return;
      var parts = v.split('/').map(function (n) { return parseInt(n, 10); });
      var pct = Math.round((parts[0] / parts[1]) * 100);
      bars.push({ label: col.label, pct: pct, ratio: v.replace(/\s/g, '') });
    });
    return bars;
  }

  function computeModuleDirectStaff() {
    var row = findScr003Row('조립 인원 (직접)');
    var sum = 0;
    D.scr003LineCols.forEach(function (col) {
      if (col.id === 'total') return;
      var v = row.values[col.id];
      if (!v) return;
      sum += parseInt(v, 10) || 0;
    });
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
    var rateBarsData = computeDashAutoRateBars();
    var overallRate = computeOverallRate(rateBarsData);
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
      return '<th class="al-c"' + (c.bp ? ' style="color:var(--color-primary)"' : '') + '>' + esc(c.label) + '</th>';
    }).join('');
    var rows = D.scr001SummaryRows.map(function (row) {
      var cells = D.scr001SummaryCols.map(function (col) {
        return '<td class="al-c">' + formatDelta(row.values[col.id], row.unit) + '</td>';
      }).join('');
      return '<tr><td><strong>' + esc(row.label) + '</strong></td>' + cells + '</tr>';
    }).join('');
    return '<table class="data-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderExpansionCell(cell, rowspan) {
    var rs = rowspan > 1 ? ' rowspan="' + rowspan + '"' : '';
    switch (cell.kind) {
      case 'auto':
        return '<td class="matrix-cell auto"' + rs + ' data-action="open-modal" data-modal-id="cellDetail"><span>&#9679;</span> <span>자동</span></td>';
      case 'na':
        return '<td class="matrix-cell none"' + rs + '>미해당</td>';
      case 'possible':
        return '<td class="al-c"' + rs + ' style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border)">' + badge("가능('" + cell.year + ')', 'info') + '</td>';
      case 'agree':
        return '<td class="al-c"' + rs + ' style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border)">' + badge('협의必(ROI ' + cell.roi + ') ' + cell.headcount + '명', 'warning') + '</td>';
      case 'agreeUnrecoverable':
        return '<td class="al-c"' + rs + ' style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border)">' + badge('협의必(회수불가) ' + cell.headcount + '명', 'warning') + '</td>';
      case 'review':
        return '<td class="al-c"' + rs + ' style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border)">' + badge('미적용(협의中) ' + cell.headcount + '명', 'neutral') + '</td>';
      default:
        return '<td class="matrix-cell none"' + rs + '>-</td>';
    }
  }

  // 현재/개선/주요내용이 동일한 연속 행을 하나의 그룹으로 묶어 rowspan 병합 렌더링
  // (to-be 초안: 인풋툴 조립/컬럼 조립처럼 같은 개선내용을 공유하는 공정은 셀을 합쳐서 표기)
  function groupProcessRows(rows) {
    var groups = [];
    var i = 0;
    while (i < rows.length) {
      var row = rows[i];
      var group = [row];
      var j = i + 1;
      while (
        j < rows.length &&
        rows[j].current.label === row.current.label &&
        rows[j].improve.label === row.improve.label &&
        rows[j].mainContent === row.mainContent
      ) {
        group.push(rows[j]);
        j++;
      }
      groups.push(group);
      i = j;
    }
    return groups;
  }

  function renderScr001ProcessDetailTable() {
    // 확대전개계획 매트릭스 컬럼: [BP]창원2C 라인(bp)은 현재/개선/주요내용 그룹으로 이미 표현되므로 제외
    var bpCol = D.scr001SummaryCols.filter(function (c) { return c.bp; })[0];
    var matrixCols = D.scr001SummaryCols.filter(function (c) { return !c.bp; });
    var head =
      '<tr>' +
        '<th rowspan="2" style="min-width:60px">NO</th><th rowspan="2" style="min-width:140px">공정</th>' +
        '<th class="al-c" colspan="3" style="background:var(--badge-info-bg)">' + esc(bpCol.detailLabel || bpCol.label) + '</th>' +
        matrixCols.map(function (c) { return '<th rowspan="2" class="al-c" style="min-width:120px">' + esc(c.label) + '</th>'; }).join('') +
      '</tr>' +
      '<tr>' +
        '<th class="al-c" style="min-width:90px">현재</th><th class="al-c" style="min-width:90px">개선</th>' +
        '<th style="min-width:200px">주요 내용</th>' +
      '</tr>';

    var groups = groupProcessRows(D.scr001ProcessDetail);
    var rowsHtml = groups.map(function (group) {
      var rowspan = group.length;
      return group.map(function (row, idx) {
        var mergedCells = '';
        if (idx === 0) {
          var currentBadgeKind = row.current.kind === 'auto' ? 'success' : 'neutral';
          var currentSymbol = row.current.kind === 'auto' ? '&#9679; ' : '';
          var currentAttrs = row.hasVideo ? ' style="cursor:pointer" data-action="open-modal" data-modal-id="processVideo" data-no="' + row.no + '"' : '';
          mergedCells =
            '<td class="al-c" rowspan="' + rowspan + '"' + currentAttrs + '>' +
              '<span class="badge badge-' + currentBadgeKind + '">' + currentSymbol + esc(row.current.label) + '</span>' +
              (row.current.count ? ' <span style="margin-left:6px;color:var(--color-text-muted);font-size:13px">' + esc(row.current.count) + '</span>' : '') +
              (row.hasVideo ? ' <span style="margin-left:2px">&#9658;</span>' : '') +
            '</td>' +
            '<td class="al-c" rowspan="' + rowspan + '">' + esc(row.improve.label) + '</td>' +
            '<td class="muted" rowspan="' + rowspan + '">' + esc(row.mainContent) + '</td>';
        }
        // 현재/개선/주요내용은 그룹 병합되지만, 확대전개계획 매트릭스는 행마다 개별 값을 가지므로 매 행 렌더링
        var expansionCells = matrixCols.map(function (col) { return renderExpansionCell(row.cells[col.id], 1); }).join('');
        var processLabel = '<strong>' + esc(row.process) + '</strong>' +
          (row.processNote ? ' <span style="color:var(--color-text-faint);font-size:12px">(' + esc(row.processNote) + ')</span>' : '');
        return '<tr>' +
          td(row.no, 'center') +
          td(processLabel) +
          mergedCells +
          expansionCells +
        '</tr>';
      }).join('');
    }).join('');

    return '<table class="data-table"><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table>';
  }

  function renderSCR001() {
    return (
      '<div data-screen-label="SCR-001 부품 공정 자동화 현황">' +
        renderTabs('part') +
        renderFilterBar(D.scr001Filters) +
        '<div class="section-title">요약 현황 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(공장/라인별 자동화율·직접인원 현재&rarr;개선 및 중장기 완료일정)</span></div>' +
        renderScr001SummaryTable() +
        '<div class="actions-row" style="margin-top:var(--sp-lg)">' +
          '<div class="section-title" style="margin-bottom:0">공정별 상세 <span style="font-size:12px;color:var(--color-text-faint);font-weight:400">(현재/개선/주요내용 · 공장/라인별 확대전개계획, 현재=자동 선택 시 동영상 팝업)</span></div>' +
          '<div class="actions-group">' +
            '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="registerProcess">+ 공정 등록</button>' +
            '<button type="button" class="btn btn-secondary">엑셀</button>' +
            '<button type="button" class="btn btn-secondary" data-action="open-modal" data-modal-id="emailShare">이메일 공유</button>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto">' + renderScr001ProcessDetailTable() + '</div>' +
      '</div>'
    );
  }

  function scr003Value(v) {
    return v == null ? '<span class="muted">-</span>' : esc(v);
  }

  function renderScr003SummaryTable() {
    var head = '<th>구분</th>' + D.scr003LineCols.map(function (c) {
      var style = c.bp ? ' style="background:var(--badge-warning-bg)"' : '';
      var label = c.sub
        ? esc(c.label) + '<br><span style="font-weight:400;font-size:11px;color:var(--color-text-muted)">' + esc(c.sub) + '</span>'
        : esc(c.label);
      return '<th class="al-c"' + style + '>' + label + '</th>';
    }).join('');

    var rows = D.scr003SummaryRows.map(function (row) {
      var cells = D.scr003LineCols.map(function (col) {
        return '<td class="al-c">' + scr003Value(row.values[col.id]) + '</td>';
      }).join('');
      return '<tr><td><strong>' + esc(row.label) + '</strong></td>' + cells + '</tr>';
    }).join('');

    return '<table class="data-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderScr003ExpansionCell(kind) {
    switch (kind) {
      case 'auto':
        return '<td class="matrix-cell auto" data-action="open-modal" data-modal-id="cellDetail"><span>&#9679;</span> <span>자동</span></td>';
      case 'manual':
        return '<td class="matrix-cell manual"><span>X</span> <span>수동</span></td>';
      case 'partial':
        return '<td class="al-c" style="padding:10px 16px;border-bottom:1px solid var(--color-table-row-border)">' + badge('개발중', 'warning') + '</td>';
      default:
        return '<td class="matrix-cell none">-</td>';
    }
  }

  function renderScr003ProcessDetailTable() {
    // 확대전개계획 매트릭스: Best Practice/국내외종합(계)는 기술현황·상세계획 그룹으로 이미 표현되므로 제외
    var matrixCols = D.scr003LineCols.filter(function (c) { return !c.bp && c.id !== 'total'; });
    var head =
      '<tr>' +
        '<th rowspan="2" style="min-width:60px">NO</th><th rowspan="2" style="min-width:220px">작업내용</th>' +
        '<th class="al-c" colspan="2" style="background:var(--badge-warning-bg)">Best Practice</th>' +
        matrixCols.map(function (c) { return '<th rowspan="2" class="al-c" style="min-width:110px">' + esc(c.label) + '</th>'; }).join('') +
      '</tr>' +
      '<tr>' +
        '<th class="al-c" style="min-width:80px">기술 현황</th><th style="min-width:240px">상세 계획</th>' +
      '</tr>';

    var rowsHtml = D.scr003ProcessDetail.map(function (row) {
      var techSymbol = row.tech === 'auto' ? '&#9679;' : row.tech === 'partial' ? '&#9650;' : 'X';
      var techKind = row.tech === 'auto' ? 'success' : row.tech === 'partial' ? 'warning' : 'neutral';
      var expansionCells = matrixCols.map(function (col) { return renderScr003ExpansionCell(row.cells[col.id]); }).join('');
      return '<tr>' +
        td(row.no, 'center') +
        td('<strong>' + esc(row.task) + '</strong>') +
        '<td class="al-c"><span class="badge badge-' + techKind + '">' + techSymbol + '</span></td>' +
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

  // ---------- SCR-006 통합 로드맵 관리 ----------

  function renderSCR006() {
    var rows = D.scr006Rows.map(function (r) {
      return '<tr>' +
        '<td style="cursor:pointer;color:var(--color-primary);font-weight:500" data-action="select-screen" data-screen-id="SCR-007" data-roadmap-id="' + r.roadmapId + '">' + esc(r.section) + '</td>' +
        '<td style="cursor:pointer" data-action="select-screen" data-screen-id="SCR-007" data-roadmap-id="' + r.roadmapId + '">' + esc(r.name) + '</td>' +
        td(esc(r.period), null, 'muted') + td(esc(r.task)) +
        td(badge(r.status, r.statusKind), 'center') +
        td('<button type="button" class="btn-outline-sm" data-action="open-modal" data-modal-id="history">이력보기</button>', 'center') +
      '</tr>';
    }).join('');
    return (
      '<div data-screen-label="SCR-006 통합 로드맵 관리">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option></select>' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 상태</option></select>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="roadmapRegister">+ 로드맵 등록</button>' +
        '</div>' +
        renderTable([
          { label: '분과' }, { label: '로드맵명' }, { label: '기간' }, { label: '대표과제' }, { label: '상태', align: 'center' }, { label: '개정이력', align: 'center' },
        ], rows) +
        '<div style="text-align:right"><a href="#" data-action="go-to-gantt">간트차트로 보기 &rsaquo;</a></div>' +
      '</div>'
    );
  }

  // ---------- SCR-007 상세과제 로드맵 관리 ----------

  function renderSCR007(state) {
    var selected = state.selectedParentRoadmap;
    var rows = D.scr007Data[selected] || [];
    var options = D.roadmapOptions.map(function (o) {
      return '<option value="' + o.id + '"' + (o.id === selected ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
    var body = rows.length
      ? rows.map(function (r) {
          return '<tr>' + td('<strong>' + esc(r.name) + '</strong>') + td(esc(r.owner)) + td(esc(r.period), null, 'muted') +
            td(badge(r.status, r.statusKind), 'center') +
            td('<button type="button" class="btn-outline-sm">수정</button>', 'center') +
          '</tr>';
        }).join('')
      : '<tr><td colspan="5" class="empty-row-cell">등록된 상세과제가 없습니다</td></tr>';

    return (
      '<div data-screen-label="SCR-007 상세과제 로드맵 관리">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<label style="font-size:12px;color:var(--color-text-muted)">소속 통합 로드맵</label>' +
          '<select data-role="parent-roadmap" style="height:32px;min-width:220px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff">' + options + '</select>' +
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

  function renderSCR008(state) {
    var full = state.ganttView === 'full';
    var quarters = D.ganttQuarters.map(function (q) { return '<div class="gantt-quarter-cell">' + esc(q) + '</div>'; }).join('');
    var rows = D.ganttRowsFull.filter(function (r) { return full || r.top; }).map(function (r) {
      return '<div class="gantt-row">' +
        '<div class="gantt-row-label" style="padding-left:' + r.indent + 'px;font-weight:' + (r.top ? 600 : 400) + '">' + esc(r.label) + '</div>' +
        '<div class="gantt-track"><div class="gantt-bar ' + r.barClass + '" style="left:' + r.left + '%;width:' + r.width + '%" data-action="open-modal" data-modal-id="' + r.modal + '"></div></div>' +
      '</div>';
    }).join('');
    return (
      '<div data-screen-label="SCR-008 mTRM 통합 로드맵 대시보드">' +
        '<div class="gantt-toolbar">' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option></select>' +
          '<span style="font-size:12px;color:var(--color-text-muted)">2026 ~ 2028</span>' +
          '<div class="filter-spacer"></div>' +
          '<div class="gantt-view-toggle">' +
            '<label data-action="set-gantt-view" data-view="summary"><input type="radio" ' + (!full ? 'checked' : '') + ' readonly /> 요약본</label>' +
            '<label data-action="set-gantt-view" data-view="full"><input type="radio" ' + (full ? 'checked' : '') + ' readonly /> 전체보기</label>' +
          '</div>' +
        '</div>' +
        '<div class="gantt-container">' +
          '<div class="gantt-header-row"><div class="gantt-label-col">로드맵 / 과제</div><div class="gantt-quarters">' + quarters + '</div></div>' +
          rows +
        '</div>' +
      '</div>'
    );
  }

  // ---------- SCR-009 생산기술 Tech PR ----------

  function renderSCR009() {
    var cards = D.techPrCards.map(function (c) {
      return '<div class="media-card">' +
        '<div class="media-thumb"><div class="play-btn">&#9658;</div></div>' +
        '<div class="media-body"><div class="media-title">' + esc(c.title) + '</div><div class="media-meta">' + esc(c.section) + '</div></div>' +
      '</div>';
    }).join('');
    return (
      '<div data-screen-label="SCR-009 생산기술 Tech PR">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-sm);margin-bottom:var(--sp-lg)">' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 과제</option></select>' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 분과</option></select>' +
          '<select style="height:32px;min-width:120px;border:1px solid var(--color-border-strong);border-radius:4px;padding:0 8px;background:#fff"><option>전체 소재유형</option></select>' +
          '<div class="filter-spacer"></div>' +
          '<button type="button" class="btn btn-primary" data-action="open-modal" data-modal-id="techPrInquiry">기술 문의/제안</button>' +
        '</div>' +
        renderCardGrid(cards) +
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
          '<button type="button" class="btn btn-primary">+ mTRM 등록</button>' +
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
          '<button type="button" class="btn btn-primary">+ 등록</button>' +
        '</div>' +
        renderCardGrid(cards) +
      '</div>'
    );
  }

  // ---------- 모달 ----------

  function fieldControl(f) {
    switch (f.type) {
      case 'textarea': return '<textarea></textarea>';
      case 'select': return '<select><option>선택</option></select>';
      case 'date': return '<input type="date" />';
      case 'file': return '<div class="file-drop">파일을 드래그하거나 클릭하여 첨부</div>';
      case 'plaintext': return '<div class="plaintext">' + esc(f.value) + '</div>';
      default: return '<input type="text" />';
    }
  }

  // SCR-001: 공정별 상세 "현재(자동)" 요소 선택 시 등록된 자동화 설비 동영상을 팝업으로 노출
  function renderProcessVideoModal(state) {
    var row = D.scr001ProcessDetail.filter(function (r) { return r.no === state.scr001SelectedVideo; })[0];
    if (!row) return '';
    return (
      '<div class="modal-box" style="width:640px">' +
        '<div class="modal-header"><div class="modal-title">' + esc(row.videoLabel) + '</div><div class="modal-close" data-action="close-modal">&#10005;</div></div>' +
        '<div class="modal-body">' +
          '<div class="media-thumb" style="width:100%;aspect-ratio:16/9"><div class="play-btn">&#9658;</div></div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);margin-top:var(--sp-md)">공정: ' + esc(row.process) + ' · 현재 상태: ' + esc(row.current.label) + '</div>' +
        '</div>' +
        '<div class="modal-footer"><button type="button" class="btn btn-primary" style="height:36px" data-action="close-modal">닫기</button></div>' +
      '</div>'
    );
  }

  function renderModal(state) {
    if (!state.activeModal) return '';
    if (state.activeModal === 'processVideo') return renderProcessVideoModal(state);
    var modal = MODALS[state.activeModal];
    if (!modal) return '';
    var fields = modal.fields.map(function (f) {
      return '<div class="modal-field"><label>' + esc(f.label) + (f.required ? '<span class="required">*</span>' : '') + '</label>' +
        '<div class="modal-field-control">' + fieldControl(f) + '</div></div>';
    }).join('');
    return (
      '<div class="modal-box" style="width:' + modal.size + 'px">' +
        '<div class="modal-header"><div class="modal-title">' + esc(modal.title) + '</div><div class="modal-close" data-action="close-modal">&#10005;</div></div>' +
        '<div class="modal-body">' + fields + '</div>' +
        '<div class="modal-footer">' +
          '<button type="button" class="btn btn-secondary" style="height:36px" data-action="close-modal">취소</button>' +
          '<button type="button" class="btn btn-primary" style="height:36px" data-action="close-modal">' + esc(modal.confirm) + '</button>' +
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
  };

  global.PNDES.render = {
    gnbTop: renderGnbTop,
    gnbSide: renderGnbSide,
    screen: function (state) {
      var fn = SCREEN_RENDERERS[state.currentScreen];
      return fn ? fn(state) : '';
    },
    modal: renderModal,
  };
})(window);
