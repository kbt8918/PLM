/*
 * MTRM-MAIN 메인 대시보드 mock 데이터
 * 근거: design-import/README.md "6. 메인 대시보드", design-import/생기포털 v3.dc.html state.roadmapList 생성 로직과
 * dashRoadmaps의 barMap(대표 로드맵 5개의 12분기 그리드 상 위치·색상).
 * KPI 카드 건수는 roadmapList를 상태별로 집계한 값이다(v3 마크업의 고정 숫자 4/1/1/1/1은 자체 목록과 맞지 않아 쓰지 않음).
 * 하위 상세과제는 js/mock/scr007.js, Tech PR·기술동향 미리보기는 각 화면 mock을 공유한다.
 * 실 연동 시 통합 로드맵 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var roadmapList = (function () {
    var base = [
      { section: '차체', name: '차체 자동화 로드맵', period: '2026.01~2026.12', task: '용접 자동화', status: '진행중' },
      { section: '조립', name: '조립 자동화 로드맵', period: '2026.04~2027.06', task: '코봇 도입', status: '계획' },
      { section: '도장', name: '도장 자동화 로드맵', period: '2026.01~2026.09', task: '도장 로봇 재검토', status: '반려' },
      { section: '엔진', name: '엔진 자동화 로드맵', period: '2026.10~2027.09', task: '조립라인 자동화', status: '보류' },
      { section: '물류', name: '물류/반송 자동화 로드맵', period: '2027.01~2027.12', task: '물류 반송 표준화', status: '계획' },
    ];
    var depts = ['차체', '조립', '도장', '엔진', '물류', '검사', '배선', '냉각'];
    var statuses = ['진행중', '계획', '반려', '보류'];
    var rows = base.slice();
    for (var i = 5; i < 14; i++) {
      var dept = depts[i % depts.length];
      rows.push({
        section: dept,
        name: dept + ' 자동화 로드맵 ' + (Math.floor(i / depts.length) + 1),
        period: '202' + (6 + (i % 3)) + '.0' + ((i % 9) + 1) + '~20' + (29 + (i % 2)) + '.12',
        task: '확대전개 검토',
        status: statuses[i % statuses.length],
      });
    }
    return rows;
  })();

  // lead/span: 26.Q1~28.Q4 12칸 기준 막대 시작 오프셋과 길이.
  // color: v3 막대색(bg-blue-600은 CSS override로 accent-600, 나머지는 Tailwind 기본값).
  // accent: 하위 상세과제 행 좌측 3px 강조선 색(v3 accentStyle).
  var barMap = {
    '차체 자동화 로드맵': { lead: 0, span: 4, color: '#4F46E5', accent: '#2563EB' },
    '조립 자동화 로드맵': { lead: 1, span: 5, color: '#FB923C', accent: '#FB923C' },
    '도장 자동화 로드맵': { lead: 0, span: 3, color: '#F472B6', accent: '#F472B6' },
    '엔진 자동화 로드맵': { lead: 3, span: 4, color: '#10B981', accent: '#10B981' },
    '물류/반송 자동화 로드맵': { lead: 4, span: 4, color: '#7E22CE', accent: '#A78BFA' },
  };

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.mtrmMain = { roadmapList: roadmapList, barMap: barMap };
})(window);
