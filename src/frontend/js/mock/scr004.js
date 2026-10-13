/*
 * SCR-004 모듈 표준 작업명 관리 mock 데이터
 * 근거: design-import/README.md "4. 모듈 표준 작업명 관리", design-import/생기포털 v3.dc.html state.taskList 생성 로직.
 * 주의: v3.dc.html의 taskList 원본에는 등록자(registrant) 필드가 없지만(count/regDate만 존재) 테이블 렌더링은
 * {{ row.registrant }}를 참조하는 불일치가 있다. README #4가 "등록자" 컬럼을 명시하므로 보완 데이터로 채운다.
 * 실 연동 시 모듈 표준 작업명 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var rows = (function () {
    var names = ['볼트 체결', '와이어링', '용접', '검사', '도장', '이송', '조립', '포장', '세척', '라벨링', '프레스', '체결확인'];
    var types = ['조립', '배선', '용접', '검사', '도장', '물류'];
    var registrants = ['홍길동', '김철수', '이영희', '박민수', '최지훈']; // 보완: v3 원본에 없는 필드
    var list = [];
    for (var i = 0; i < 24; i++) {
      list.push({
        name: names[i % names.length] + (i >= names.length ? ' ' + (Math.floor(i / names.length) + 1) : ''),
        type: types[i % types.length],
        registeredBy: registrants[i % registrants.length],
        registered: '2026-' + String((i % 12) + 1).padStart(2, '0') + '-' + String((i % 27) + 1).padStart(2, '0'),
      });
    }
    return list;
  })();

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr004Rows = rows;
})(window);
