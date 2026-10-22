/*
 * 마스터 관리(stdprc-m 제품별 표준공정 / stdwork-m 표준 작업명) mock 데이터
 * 근거: design-import/생기포털 v3.dc.html SM_STD / SM_WORK / SM_F0 / smVals / smRows.
 */
(function (global) {
  'use strict';

  var SM_STD = [
    ['열간압입 핀 체인지', 'Press-Fitting Pin Change', ''], ['모터 하우징 로딩', 'Motor housing Loading', 'test1'], ['스테이터 로딩', 'stator Loading', ''], ['열간압입', 'Hot Press-Fitting', ''],
    ['열간압입 검사', 'Hot Penetration Inspecting', ''], ['하우징-스테이터 앗세이 언로딩', 'Housing-stator Unloading', ''], ['모터 핀 체인지', 'Motor Pin Change', ''], ['하우징-스테이터 앗세이 로딩', 'Housing-stator assy Loading', ''],
    ['감속기 하우징 로딩', 'Reducer housing Loading', ''], ['[SUB] 오일씰 압입', '[SUB] Oil Seal Press-Fitting', ''], ['SGR 압입', 'SGR Press-Fitting', ''], ['스테이터 -하우징 볼트 체결', 'Stator-housing bolt Tightening', ''],
    ['로터 조립', 'Rotor Assembling', ''], ['엔드캡 체결', 'End-cap Tightening', ''], ['레졸버 조립', 'Resolver Assembling', ''], ['누설 검사', 'Leak Testing', ''],
    ['절연 내압 검사', 'Insulation Testing', ''], ['EOL 검사', 'EOL Testing', ''], ['라벨링', 'Labeling', ''], ['완제품 언로딩', 'Product Unloading', ''],
  ].map((a, i) => ({ id: 'sa' + i, group: '전동화', product: '모터', ko: a[0], en: a[1], bp: a[2], status: 'Y', use: 'Y', writer: '이*영', at: '2026.09.02' }));
  var SM_WORK = [
    ['[가체결] 다이나믹 댐퍼 + 스트럿', '[Provisional Tightening] Dynamic Damper + Strut'], ['[완체결] 다이나믹 댐퍼 + 스트럿', '[Tightening] Dynamic Damper + Strut'], ['[가체결] 다이나믹 댐퍼 + 트레일링암', '[Provisional Tightening] Dynamic Damper + Trailing Arm'], ['[완체결] 다이나믹 댐퍼 + 트레일링암', '[Tightening] Dynamic Damper + Trailing Arm'],
    ['[로딩] 리어 디프 (4WD)', '[Loading] Rear Differential (4WD)'], ['[가체결] 리어 디프 + 멤버 (4WD)', '[Provisional Tightening] Rear Differential + Member'], ['[완체결] 리어 디프 + 멤버 (4WD)', '[Tightening] Rear Differential + Member'], ['[오일주입] 리어 디프 (4WD)', '[Oil Filling] Rear Differential (4WD)'],
    ['[가체결] 리어 디프 와이어링', '[Provisional Tightening] Rear Differential Wiring'], ['[완체결] 리어 디프 와이어링', '[Tightening] Rear Differential Wiring'], ['[조립] 리어 드라이브샤프트 + 디프', '[Assembling] Rear Drive Shaft + Differential'], ['[조립] 리어 드라이브샤프트 + 휠허브', '[Assembling] Rear Drive Shaft + Wheel Hub'],
    ['[조립] 리어 스태빌라이저 바', '[Assembling] Rear Stabilizer Bar'], ['[완체결] 리어 스태빌라이저 링크', '[Tightening] Rear Stabilizer Link'], ['[가체결] 리어 어퍼암', '[Provisional Tightening] Rear Upper Arm'], ['[완체결] 리어 어퍼암', '[Tightening] Rear Upper Arm'],
    ['[조립] 리어 쇽업소버', '[Assembling] Rear Shock Absorber'], ['[조립] 리어 코일스프링', '[Assembling] Rear Coil Spring'], ['[결선] 리어 센서 커넥터', '[Wiring] Rear Sensor Connector'], ['[검사] 리어 얼라인먼트', '[Inspection] Rear Alignment'],
  ].map((a, i) => ({ id: 'sw' + i, group: '모듈', product: 'RCM', ko: a[0], en: a[1], bp: '', status: 'Y', use: 'Y', writer: '이*영', at: '2026.10.06' }));
  var SM_F0 = { group: '전체', product: '전체', name: '' };
  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.sm = {
    std: SM_STD, work: SM_WORK, F0: SM_F0,
    popGroups: ['전동화', '내연기관'],
    popProducts: ['모터', '인버터', '감속기'],
  };
})(window);
