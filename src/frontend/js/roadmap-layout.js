/*
 * SCR-006 mTRM(통합로드맵) 간트 — 막대 위치/겹침 계산 순수 함수
 * 근거: design-import/생기포털 v3.dc.html rmRange()/rmLanes 계산 로직(2026-11-24), CHANGES_2026-11-24.md 2~5번.
 * 모든 계산은 "월 컬럼" 기준이다: 축은 2025-01 ~ 2030-12 고정 72개월(컬럼 1 = 2025-01).
 * DOM/state에 의존하지 않으므로 node에서도 단독 실행·검증할 수 있다.
 */
(function (global) {
  'use strict';

  var BASE_YEAR = 2025;
  var MAX_YEAR = 2030;
  var TOTAL_MONTHS = (MAX_YEAR - BASE_YEAR + 1) * 12; // 72

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // 조회 기간 보정: 2025~2030 범위, 시작 > 종료이면 종료를 시작에 맞춘다.
  // 반환: from/to(연도), years, N(기간 월 수), off(기간 시작 전 월 수)
  function normalizeRange(fromYear, toYear) {
    var from = Math.min(MAX_YEAR, Math.max(BASE_YEAR, Number(fromYear) || BASE_YEAR));
    var to = Math.min(MAX_YEAR, Math.max(from, Number(toYear) || MAX_YEAR));
    var years = to - from + 1;
    return { from: from, to: to, years: years, N: years * 12, off: (from - BASE_YEAR) * 12 };
  }

  // 막대 기간을 월 단위로: m{start,span}(월)이 있으면 우선, 없으면 분기 start/span x3
  function barMonths(bar) {
    if (bar.m) return { start: bar.m.start, span: bar.m.span };
    return { start: (bar.start - 1) * 3 + 1, span: bar.span * 3 };
  }

  // 조회 기간 기준 컬럼 배치. 기간 밖이면 visible=false, 경계에 걸치면 경계에서 자른다.
  // colStart/colSpan은 72컬럼 격자 기준(기간 시작 = 컬럼 1)
  function placeInRange(bar, range) {
    var mm = barMonths(bar);
    var s0 = mm.start - range.off;
    var visible = s0 + mm.span > 1 && s0 <= range.N;
    var s = Math.max(1, s0);
    var e = Math.min(range.N + 1, s0 + mm.span);
    return { visible: visible, colStart: s, colSpan: Math.max(1, e - s) };
  }

  // 같은 줄 배치: row 값이 같으면 같은 줄, 없으면 막대마다 새 줄. 반환: 막대 순서대로 1-based 줄 번호
  function rowKeyOf(bar, idx) { return bar.row != null ? bar.row : ('u' + idx); }
  function assignRows(bars) {
    var ids = {};
    var count = 0;
    return bars.map(function (bar, idx) {
      var k = rowKeyOf(bar, idx);
      if (!(k in ids)) ids[k] = ++count;
      return ids[k];
    });
  }

  // 진행상태: P1~P3은 모든 상세과제, P4는 p4:true만. milestones 없으면 P1만 완료
  function phaseSeq(bar) { return bar.p4 ? ['P1', 'P2', 'P3', 'P4'] : ['P1', 'P2', 'P3']; }
  function donePhases(bar) { return bar.milestones || ['P1']; }
  function pendingPhases(bar) {
    var done = donePhases(bar);
    return phaseSeq(bar).filter(function (p) { return done.indexOf(p) === -1; });
  }

  // 단계를 막대 아래 줄로 내릴지: 기간 1분기(3개월) 이하이거나,
  // 같은 줄에서 뒤따르는 막대가 "막대 끝 + 예정 단계 표시 폭" 안에서 시작하면 true
  function isCompact(bars, idx) {
    var b = bars[idx];
    if (!b || b.kind !== 'task') return false;
    var mb = barMonths(b);
    if (mb.span <= 3) return true;
    var key = rowKeyOf(b, idx);
    var reach = mb.start + mb.span + 3 * Math.ceil(pendingPhases(b).length * 0.7 + 0.5);
    return bars.some(function (o, j) {
      if (j === idx || rowKeyOf(o, j) !== key) return false;
      var mo = barMonths(o);
      return mo.start >= mb.start && mo.start < reach;
    });
  }

  // 월 인덱스(0 = 2025-01) -> 'YYYY-MM'
  function ymOf(i) { return (BASE_YEAR + Math.floor(i / 12)) + '-' + pad2((i % 12) + 1); }
  function lastDayOf(i) { return new Date(BASE_YEAR + Math.floor(i / 12), (i % 12) + 1, 0).getDate(); }

  // 툴팁용 일자: 계획일정(막대 시작일) / 완료일정(막대 종료일) / P1 기간 문자열
  function barDates(bar) {
    var mm = barMonths(bar);
    var s = mm.start - 1;
    var e = s + mm.span - 1;
    return {
      planStart: ymOf(s) + '-01',
      planEnd: ymOf(e) + '-' + pad2(lastDayOf(e)),
      periodLabel: ymOf(s) + ' ~ ' + ymOf(e),
      startYm: ymOf(s),
    };
  }

  // 오늘선 위치: 72컬럼 중 비율. 조회 기간 밖이면 null(숨김)
  function todayFraction(todayMonths, range) {
    var f = (todayMonths - range.off) / TOTAL_MONTHS;
    if (f < 0 || f > range.N / TOTAL_MONTHS) return null;
    return f;
  }

  // 분기/월 서브헤더 셀: 기간 안의 칸만 만든다(기간 밖은 빈 공간)
  function timeCells(scale, range) {
    var month = scale === 'month';
    var n = month ? range.N : range.N / 3;
    var cells = [];
    for (var i = 0; i < n; i++) {
      cells.push({
        label: month ? String((i % 12) + 1) : ((i % 4) + 1) + 'Q',
        yearEnd: month ? (i % 12 === 11) : (i % 4 === 3),
        quarterEnd: !month || i % 3 === 2,
      });
    }
    return cells;
  }

  var api = {
    BASE_YEAR: BASE_YEAR, MAX_YEAR: MAX_YEAR, TOTAL_MONTHS: TOTAL_MONTHS,
    normalizeRange: normalizeRange, barMonths: barMonths, placeInRange: placeInRange,
    assignRows: assignRows, phaseSeq: phaseSeq, donePhases: donePhases, pendingPhases: pendingPhases,
    isCompact: isCompact, barDates: barDates, todayFraction: todayFraction, timeCells: timeCells,
  };

  global.PNDES = global.PNDES || {};
  global.PNDES.rmLayout = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
