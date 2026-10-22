/*
 * 모듈공정배치 관리(mp-gk 생기 / mp-sc 생산) mock 데이터
 * 근거: design-import/생기포털 v3.dc.html MP_ROWS / MP_F0 / MP_COLS0 / MP_COL_DEF / MP_COL_LABEL.
 * 디자인 원본의 튜플+map 생성 로직을 그대로 이식한다(손으로 옮겨 적지 않음 — 행 수/값 불일치 방지).
 * 실 연동 시 공정배치 목록 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var MP_ROWS = [
    ['울산', 'RG3kV 21', '', '울산 모듈1공장', 'DIFF 서브3라인', 'PE MODULE', 0, '0.0', '0.00', '3.406', '0', '0', '2026.10.16', 0, '', 0, '', ''],
    ['울산', 'MC 06', 'OSE 19', '울산 모듈1공장', '샤시1라인', '리어샤시', 0, '0.0', '0.00', '36.752', '0', '0', '2026.10.16', 0, '', 0, '', ''],
    ['의왕', 'OS', '', '교육용1공장', 'FR Calliper Assembly L...', 'FEM', 1, '0.0', '0.00', '0.000', '0', '0', '2026.10.16', 0, '', 0, '', ''],
    ['서산', 'UM 18PE', 'TAM 18PE', '서산 모듈공장', '샤시1라인', '프론트샤시', 0, '0.0', '0.00', '4.260', '0', '1', '2026.10.16', 0, '', 0, '', ''],
    ['서산', 'SA 08FL', 'TAM 18PE', '서산 모듈공장', '샤시1라인', '샤시', 0, '0.0', '0.00', '0.000', '0', '1', '2026.10.13', 0, '', 0, '', ''],
    ['서산', 'TA 11', 'TAM 18PE', '서산 모듈공장', '샤시1라인', '프론트샤시', 0, '0.0', '0.00', '0.000', '0', '0', '2026.10.07', 0, '', 0, '', ''],
    ['아산', 'HG 16MY', 'DN8 19', '아산 모듈공장', 'FEM 라인', 'FEM', 0, '0.0', '0.00', '0.000', '0', '0', '2026.10.07', 0, '', 0, '', ''],
    ['충주', 'Fe FCEV', '', '충주 수소전지공장', 'FE FPS 라인', 'PFC MODULE', 1, '3.3', '0.00', '0.000', '0', '0', '2026.10.06', 1, '오*홍', 1, 'SF기술개발팀', '2026.10.01'],
    ['아산', 'LFE 17MY', 'DN8 19', '아산 모듈공장', 'FEM 라인', 'FEM', 1, '0.0', '0.00', '0.000', '0', '0', '2026.09.30', 1, '오*홍', 1, 'SF기술개발팀', '2026.09.30'],
    ['북경', 'SU2 20', '', 'MBJ 모듈1공장', 'FEM 라인', 'FEM', 1, '3.0', '17.51', '210.154', '1', '0', '2026.09.30', 1, '오*홍', 1, 'SF기술개발팀', '2026.09.30'],
    ['의왕', 'JA 17', '', '교육용1공장', 'FR Calliper Assembly L...', 'FEM', 1, '0.0', '0.00', '26.115', '0', '0', '2026.09.30', 1, '오*홍', 1, 'SF기술개발팀', '2026.09.30'],
    ['터키', 'AC3 20', 'GB 18FL', 'MTR 모듈공장', '프론트샤시라인', '프론트샤시', 0, '60.0', '129.71', '778.289', '10', '0', '2026.09.30', 1, '오*홍', 1, 'SF기술개발팀', '2026.09.30'],
    ['광주', 'NQ5 22', '', '광주 모듈공장', 'FEM 2라인', 'FEM', 0, '0.0', '0.00', '258.907', '0', '0', '2026.06.08', 1, '', 0, 'SF기술개발팀', ''],
  ].map((a, i) => ({ id: 'mp' + (i + 1), region: a[0], dev: a[1], prod: a[2], plant: a[3], line: a[4], product: a[5], std: !!a[6], uph: a[7], rate: a[8], work: a[9], direct: a[10], rev: a[11], mod: a[12], wDone: !!a[13], app: a[14], aDone: !!a[15], dept: a[16], dist: a[17], writer: '이*영' }));
  var MP_F0 = { region: '전체', plant: '전체', car: '전체', carTxt: '', line: '전체', lineTxt: '', product: '전체', productTxt: '모듈', mine: true, kwField: '전체', kw: '' };
  var MP_COLS0 = { work: true, car: true, bar: true, tq: true, fast: true, hw: true, prod: true, spec: true, tool: true, note: true };
  var MP_COL_DEF = [['공정', null], ['주작업내용', 'work'], ['조립 인터페이스', null], ['작업내용', null], ['표준 작업명', null], ['평자동화 적용여부', null], ['순서', null], ['작업번호', null], ['작업명', null], ['기존자종', 'car'], ['바코드리딩', 'bar'], ['T/Q값', 'tq'], ['체결개소', 'fast'], ['H/W', 'hw'], ['제품', 'prod'], ['사양수', 'spec'], ['Tool', 'tool'], ['비고', 'note']];
  var MP_COLS0 = { work: true, car: true, bar: true, tq: true, fast: true, hw: true, prod: true, spec: true, tool: true, note: true };
  var MP_COL_DEF = [['공정', null], ['주작업내용', 'work'], ['조립 인터페이스', null], ['작업내용', null], ['표준 작업명', null], ['평자동화 적용여부', null], ['순서', null], ['작업번호', null], ['작업명', null], ['기존자종', 'car'], ['바코드리딩', 'bar'], ['T/Q값', 'tq'], ['체결개소', 'fast'], ['H/W', 'hw'], ['제품', 'prod'], ['사양수', 'spec'], ['Tool', 'tool'], ['비고', 'note']];
  var MP_COL_DEF = [['공정', null], ['주작업내용', 'work'], ['조립 인터페이스', null], ['작업내용', null], ['표준 작업명', null], ['평자동화 적용여부', null], ['순서', null], ['작업번호', null], ['작업명', null], ['기존자종', 'car'], ['바코드리딩', 'bar'], ['T/Q값', 'tq'], ['체결개소', 'fast'], ['H/W', 'hw'], ['제품', 'prod'], ['사양수', 'spec'], ['Tool', 'tool'], ['비고', 'note']];
  var MP_COL_LABEL = [['work', '주작업내용'], ['car', '기존자종'], ['bar', '바코드리딩'], ['tq', 'T/Q값'], ['fast', '체결개소'], ['hw', 'H/W'], ['prod', '제품'], ['spec', '사양수'], ['tool', 'Tool'], ['note', '비고']];
  // 상세 팝업 그리드 시드 — 디자인은 mp1만 다른 값을 쓰고 나머지는 공통 2행을 보여준다.
  var gridSeed = {
    mp1: [
      { main: '12공정', proc: '12공정', std: '선택', work: '', no: '366-36600-01', name: '프론트 모터 & 감속기 ASSY를 바코드 리딩 (RR)' },
      { main: '', proc: '선택', std: '선택', work: '', no: '090-90909-09', name: '공정 오류 테스트' },
    ],
    other: [
      { main: '1공정', proc: '1공정', std: '선택', work: '멤버로딩', no: '375-01000-81', name: 'BSA 수작업 1 (LH)' },
      { main: '', proc: '1공정', std: '선택', work: '어태치조정', no: '375-01000-81', name: 'BSA 수작업 2 (LH)' },
    ],
  };

  var tabs = [['basic', '기본운영방안'], ['std', '표준공수 및 인원산출'], ['layout', '공정배치'], ['out', '산출물']];

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.mp = {
    rows: MP_ROWS, F0: MP_F0, COLS0: MP_COLS0, COL_DEF: MP_COL_DEF, COL_LABEL: MP_COL_LABEL,
    gridSeed: gridSeed, tabs: tabs,
  };
})(window);
