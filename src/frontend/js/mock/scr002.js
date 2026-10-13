/*
 * SCR-002 표준공정 마스터 관리 mock 데이터
 * 근거: design-import/README.md "2. 표준공정 마스터 관리", design-import/생기포털 v3.dc.html state.masterList 생성 로직.
 * 실 연동 시 표준공정 마스터 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var rows = (function () {
    var names = ['용접', '조립', '검사', '도장', '프레스', '이송', '체결', '포장', '세척', '라벨링'];
    var factories = ['A공장', 'B공장'];
    var lines = ['1라인', '2라인', '3라인'];
    var list = [];
    for (var i = 0; i < 30; i++) {
      list.push({
        factory: factories[i % factories.length],
        line: lines[i % lines.length],
        name: names[i % names.length] + (i >= names.length ? ' ' + (Math.floor(i / names.length) + 1) : ''),
        seq: String((i % 10 + 1) * 10),
        desc: i % 7 === 0 ? '신규 라인' : '',
      });
    }
    return list;
  })();

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr002Rows = rows;
})(window);
