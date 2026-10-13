/*
 * SCR-007 상세과제 로드맵 관리 mock 데이터
 * 근거: design-import/README.md "8. 상세과제 로드맵 관리", design-import/생기포털 v3.dc.html state.taskRoadmapList 생성 로직.
 * MTRM-MAIN(메인 대시보드) 미니 간트의 하위 상세과제 행도 이 목록을 roadmap 값으로 묶어 사용한다.
 * 실 연동 시 상세과제 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var filterRoadmaps = ['차체 자동화 로드맵', '조립 자동화 로드맵', '물류/반송 자동화 표준화', 'AI 비전 검사 시스템 도입'];
  var owners = ['홍**', '김**', '이**'];
  var statuses = ['진행중', '계획', '반려', '보류'];

  var rows = (function () {
    var base = [
      { name: '용접 로봇 도입', owner: '홍**', period: '2026.03~2026.09', status: '진행중', roadmap: '차체 자동화 로드맵' },
      { name: '검사공정 자동화', owner: '김**', period: '2026.06~2027.02', status: '계획', roadmap: '조립 자동화 로드맵' },
      { name: '엔진 조립라인 자동화', owner: '최**', period: '2026.10~2027.06', status: '진행중', roadmap: '엔진 자동화 로드맵' },
      { name: 'ECU S/W 다운 자동화', owner: '정**', period: '2027.01~2027.09', status: '보류', roadmap: '엔진 자동화 로드맵' },
      { name: '차체 세부과제(28.Q4 종료 예시)', owner: '박**', period: '2026.10~2028.12', status: '계획', roadmap: '차체 자동화 로드맵' },
    ];
    var windows = {
      '차체 자동화 로드맵': ['2026.01', '2026.12'],
      '조립 자동화 로드맵': ['2026.04', '2027.06'],
      '도장 자동화 로드맵': ['2026.01', '2026.09'],
      '엔진 자동화 로드맵': ['2026.10', '2027.09'],
    };
    var roadmaps = Object.keys(windows);
    var genOwners = ['홍**', '김**', '이**', '박**', '최**', '정**'];
    var list = base.slice();
    for (var i = 4; i < 16; i++) {
      var rm = roadmaps[i % roadmaps.length];
      list.push({
        name: rm.replace(' 자동화 로드맵', '') + ' 세부과제 ' + (i - 3),
        owner: genOwners[i % genOwners.length],
        period: windows[rm][0] + '~' + windows[rm][1],
        status: statuses[i % statuses.length],
        roadmap: rm,
      });
    }
    return list;
  })();

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr007 = { rows: rows, filterRoadmaps: filterRoadmaps, owners: owners, statuses: statuses };
})(window);
