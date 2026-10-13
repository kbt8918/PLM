/*
 * SCR-013 기술과제 관리 mock 데이터
 * 근거: design-import/생기포털 v3.dc.html isTechTask 블록(담당자/연동 mTRM 로드맵 선택지, ROADMAP_MAPPINGS),
 *       design-import/README.md "14. 기술과제 관리".
 * 실 연동 시 담당자 조회 / mTRM 로드맵 목록 / 로드맵별 자동 매핑 결과 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var owners = ['홍**', '김**'];
  var roadmaps = ['차체 자동화 로드맵', '조립 자동화 로드맵'];

  // 연동 mTRM 로드맵 선택값 -> 자동 매핑 결과 행
  var mappings = {
    '차체 자동화 로드맵': [{ roadmap: '차체 자동화 로드맵', task: '용접 로봇 도입' }],
    '조립 자동화 로드맵': [{ roadmap: '조립 자동화 로드맵', task: '검사공정 자동화' }],
  };

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr013 = { owners: owners, roadmaps: roadmaps, mappings: mappings };
})(window);
