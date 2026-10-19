/*
 * PNDES 신규 메뉴 mock 데이터 (SCR-001~014 업무 화면 전용)
 * 화면 메타/GNB 구조는 js/config.js, 포털 홈(todo-main) mock은 js/mock/todo-main.js 참고.
 * 실 연동 시 부품/모듈 공정배치 원천 데이터, mTRM 로드맵 API 등으로 교체됩니다.
 */
(function (global) {
  'use strict';

  // ---- SCR-001 ----
  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html(최종 확정본) — 필터바는 라벨 없이
  // 각 셀렉트의 기본 옵션 자체가 "{필터명} 전체" 형태로 노출된다(라벨 텍스트는 접근성 용도로만 별도 보관).
  var scr001Filters = ['제품군', '제품', '지역', '공장', '라인'];
  var scr001FilterPlaceholders = ['제품군 전체', '제품 전체', '지역 전체', '공장 전체', '라인 전체'];

  // 요약현황 컬럼 = 공장/라인 그룹 (Best Practice 라인은 bp:true 로 강조)
  var scr001SummaryCols = [
    { id: 'c2c', label: '[B/P] 창원2C 라인', detailLabel: '[BP]창원2C 라인', bp: true },
    { id: 'c2a', label: '창원 2A' },
    { id: 'c2b', label: '창원 2B' },
    { id: 'c2d', label: '창원 2D' },
    { id: 'c2e', label: '창원 2E' },
    { id: 'msk1', label: 'MSK 조립1' },
    { id: 'mmx1', label: 'MMX 조립1' },
    { id: 'mwx1', label: 'MWX 조립1' },
    { id: 'mwx2', label: 'MWX 조립2' },
  ];
  // 자동화율 / 직접인원: to-be 초안의 "현재→개선(증감)" 델타 표기를 그대로 반영 (중장기 확대전개 반영 전/후 비교)
  var scr001SummaryRows = [
    {
      label: '자동화율', unit: '%',
      values: {
        c2c: { before: 72, after: 94, delta: 22 }, c2a: { before: 71, after: 94, delta: 23 },
        c2b: { before: 67, after: 94, delta: 27 }, c2d: { value: 63 }, c2e: { before: 63, after: 94, delta: 31 },
        msk1: { before: 47, after: 93, delta: 46 }, mmx1: { before: 40, after: 93, delta: 53 },
        mwx1: { before: 47, after: 93, delta: 46 }, mwx2: { before: 40, after: 93, delta: 53 },
      },
    },
    {
      label: '직접인원', unit: '명',
      values: {
        c2c: { before: 4, after: 1, delta: 3 }, c2a: { before: 4, after: 1, delta: 3 },
        c2b: { before: 5, after: 1, delta: 4 }, c2d: { value: 4 }, c2e: { before: 4, after: 1, delta: 3 },
        msk1: { before: 5, after: 1, delta: 4 }, mmx1: { before: 6, after: 1, delta: 5 },
        mwx1: { before: 5, after: 1, delta: 4 }, mwx2: { before: 6, after: 1, delta: 5 },
      },
    },
    {
      // 신규: 중장기 확대 전개/계획 현황
      label: '완료일정', unit: '',
      values: {
        c2c: { text: "'27년" }, c2a: { text: "'27년" }, c2b: { text: "'30년" }, c2d: { text: '-' }, c2e: { text: "'30년" },
        msk1: { text: "'30년" }, mmx1: { text: "'30년" }, mwx1: { text: "'30년" }, mwx2: { text: "'30년" },
      },
    },
  ];

  // 공정별 상세: 17개 공정(NO 1~17) x 11개 열(BP 현재/개선/주요내용 + 창원2A/2B/2D/2E/MSK/MMX/MWX1/MWX2).
  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html(최종 확정본)의 정적 마크업을 셀 단위로
  // 그대로 파싱해 옮긴 값이며(행/열 임의 재구성 없음), rowspan/colspan 병합은 원본에 없어 매 셀 독립 렌더링한다.
  // 셀 종류(k): auto(자동/旣자동화, 초록 점) · manual(수동, 회색 아웃라인 pill, n=인원수) · blue(가능/적용 연도, 파란 텍스트) ·
  //            amber(협의必, 호박색 pill) · orange(미적용/X(기술), 주황 텍스트) · note(사유 설명, 회색 소형 텍스트) ·
  //            muted(-·미해당, 옅은 회색) · empty(값 없음). video:true인 셀만 클릭 시 자동화 설비 동영상 팝업이 열린다
  // (원본에서 NO.1 오버몰딩의 일부 셀만 실제로 클릭 가능하며, 다른 행의 자동/旣자동화 셀은 정적 표시).
  var scr001ProcessDetail = [
    { no: 1, process: '오버몰딩', cells: [
      { k: 'auto', t: '자동', video: true }, { k: 'auto', t: '자동', video: true }, { k: 'muted', t: '-' },
      { k: 'auto', t: '자동' }, { k: 'muted', t: '-' },
      { k: 'auto', t: '자동', video: true }, { k: 'auto', t: '자동', video: true },
      { k: 'muted', t: '미해당' }, { k: 'muted', t: '미해당' },
      { k: 'auto', t: '자동', video: true }, { k: 'amber', t: '협의必(ROI 13년) 1명' },
    ] },
    { no: 2, process: '파워헤드 버퍼적재', cells: [
      { k: 'manual', n: '1명' }, { k: 'blue', t: "가능('27)" }, { k: 'note', t: '6축로봇 + 버퍼교체' },
      { k: 'blue', t: "가능('27)" }, { k: 'note', t: '6축로봇 + 버퍼교체' },
      { k: 'blue', t: "가능('27)" }, { k: 'blue', t: "가능('28)" },
      { k: 'muted', t: '미해당' }, { k: 'muted', t: '미해당' },
      { k: 'blue', t: "가능('27)" }, { k: 'amber', t: '협의必(회수 불가) 1명' },
    ] },
    { no: 3, process: '인풋풀 조립', cells: [
      { k: 'manual', n: '1명' }, { k: 'blue', t: "가능('27)" }, { k: 'note', t: '인풋풀 조립 인덱스, 컬럼 로딩/조립로봇 外' },
      { k: 'blue', t: "가능('27)" }, { k: 'note', t: '인풋풀 조립 인덱스, 컬럼 로딩/조립로봇 外' },
      { k: 'blue', t: "가능('27)" }, { k: 'blue', t: "가능('28)" },
      { k: 'orange', t: '미적용(협의中) 1명' }, { k: 'blue', t: "가능('29)" },
      { k: 'amber', t: '협의必(ROI 42년) 1명' }, { k: 'amber', t: '협의必(회수불가) 1명' },
    ] },
    { no: 4, process: '컬럼 조립 (추정)', cells: [
      { k: 'manual' }, { k: 'blue', t: "가능('28)" }, { k: 'blue', t: "가능('29)" },
      { k: 'blue', t: "가능('28)" }, { k: 'blue', t: "가능('29)" },
      { k: 'orange', t: '미적용(협의中) 1명' }, { k: 'blue', t: "가능('30)" },
      { k: 'amber', t: '협의必(ROI 45년) 1명' }, { k: 'amber', t: '협의必(회수불가) 1명' },
      { k: 'amber', t: '협의必(회수불가) 1명' }, { k: 'amber', t: '협의必(회수불가) 1명' },
    ] },
    { no: 5, process: 'ECU S/W 다운', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'orange', t: '미적용(협의完) 1명' }, { k: 'blue', t: "가능('29)" },
      { k: 'amber', t: '협의必(ROI 18년) 1명' }, { k: 'amber', t: '협의必(ROI 44년) 1명' },
      { k: 'amber', t: '협의必(ROI 159년) 1명' }, { k: 'amber', t: '협의必(회수불가) 1명' },
    ] },
    { no: 6, process: '파워팩 조립', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'blue', t: "적용('28)" },
      { k: 'auto', t: '자동' }, { k: 'blue', t: "적용('28)" }, { k: 'auto', t: '자동' },
      { k: 'empty' }, { k: 'empty' }, { k: 'empty' }, { k: 'empty' }, { k: 'empty' },
    ] },
    { no: 7, process: '센서 케이블 조립', cells: [
      { k: 'orange', t: 'X(기술) 1명' }, { k: 'note', t: '설계사양 변경 & 신기술개발 검토 中' }, { k: 'orange', t: 'X(기술) 1명' },
      { k: 'orange', t: 'X(기술) 1명' }, { k: 'note', t: '설계사양 변경 & 신기술개발 검토 中' },
      { k: 'orange', t: 'X(기술) 1명' }, { k: 'orange', t: 'X(기술) 1명' },
      { k: 'orange', t: 'X(기술) 1명' }, { k: 'orange', t: 'X(기술) 1명' },
      { k: 'orange', t: 'X(기술) 1명' }, { k: 'orange', t: 'X(기술) 1명' },
    ] },
    { no: 8, process: '컬럼 작동 검사', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'amber', t: '협의必(ROI 102년) 2명' },
    ] },
    { no: 9, process: '다이나믹검사', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'amber', t: '협의必(ROI 181년) 2명' },
    ] },
    { no: 10, process: '노이즈 검사 (부하)', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
    ] },
    { no: 11, process: '프릭션 검사', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'amber', t: '협의必(ROI 181년) 2명' },
    ] },
    { no: 12, process: '노이즈 검사 (무부하)', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
    ] },
    { no: 13, process: '작동 소음검사', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'muted', t: '-' }, { k: 'muted', t: '-' },
      { k: 'muted', t: '-' }, { k: 'muted', t: '-' },
    ] },
    { no: 14, process: '유니버설조인트 조립', cells: [
      { k: 'manual', n: '1명' }, { k: 'blue', t: "가능('27)" }, { k: 'blue', t: "가능('30)" },
      { k: 'blue', t: "가능('27)" }, { k: 'blue', t: "가능('30)" }, { k: 'blue', t: "가능('26)" },
      { k: 'orange', t: '미적용(협의完) 1명' }, { k: 'blue', t: "가능('30)" },
      { k: 'amber', t: '협의必(ROI 28년) 1명' }, { k: 'amber', t: '협의必(ROI 110년) 1명' },
      { k: 'amber', t: '협의必(회수불가) 1명' },
    ] },
    { no: 15, process: '유조인트조립', cells: [
      { k: 'blue', t: "가능('26)" }, { k: 'note', t: '6축로봇 + 정렬유닛 外' }, { k: 'blue', t: "가능('27)" },
      { k: 'note', t: '6축로봇 + 정렬유닛 外' }, { k: 'blue', t: "가능('27)" }, { k: 'blue', t: "가능('30)" },
      { k: 'blue', t: "가능('26)" }, { k: 'orange', t: '미적용(협의完) 1명' }, { k: 'blue', t: "가능('30)" },
      { k: 'amber', t: '협의必(ROI 28년) 1명' }, { k: 'amber', t: '협의必(ROI 110년) 1명' },
    ] },
    { no: 16, process: '라벨링', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'orange', t: '미적용(공간부족) 1명' },
      { k: 'amber', t: '협의必(ROI 27년) 1명' }, { k: 'amber', t: '협의必(ROI 58년) 1명' },
      { k: 'amber', t: '협의必(회수불가) 1명' },
    ] },
    { no: 17, process: '완제품 업로딩', cells: [
      { k: 'auto', t: '旣자동화' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' }, { k: 'auto', t: '자동' },
      { k: 'auto', t: '자동' }, { k: 'muted', t: '-' }, { k: 'muted', t: '-' },
      { k: 'muted', t: '-' }, { k: 'muted', t: '-' },
    ] },
  ];

  // ---- SCR-003 ----
  // 근거: Claude Design PNDES Portal Prototype.dc.html scr003LineDefs/scr003SummaryRows/scr003Matrix 1:1 포팅.
  // 요약현황(7열: Best Practice/국내외종합(계)/조지아 대표차종/울산 차종명/차종명x3)과
  // 작업내용별 상세 매트릭스(5개 일반열: 조지아/울산/차종명x3)는 서로 다른 열 구성을 그대로 유지합니다.
  var scr003Filters = ['제품군', '제품', '권역', '공장', '엔진타입'];
  var scr003FilterPlaceholders = ['제품군 전체', '제품 전체', '권역 전체', '공장 전체', '엔진타입 전체'];

  // 자동화율/조립인원 등 대시보드 파생값 계산에 사용하는 라인별 원본 정의(디자인 원본 lineDefs)
  var scr003LineDefs = [
    { label: '[BP] 조지아 대표차종', bp: true, rateFrom: 65, rateTo: 90, staffFrom: 5, staffTo: 2, deadline: "'28년", autoTotal: '13/17' },
    { label: '조지아 2차종', rateFrom: 58, rateTo: 88, staffFrom: 6, staffTo: 2, deadline: "'28년", autoTotal: '11/17' },
    { label: '울산 1차종', rateFrom: 52, rateTo: 85, staffFrom: 6, staffTo: 3, deadline: "'29년", autoTotal: '12/17' },
    { label: '울산 2차종', rate: 47, staff: 8, deadline: '-', autoTotal: '9/15' },
    { label: '벤전대 차종', rateFrom: 40, rateTo: 80, staffFrom: 8, staffTo: 4, deadline: "'30년", autoTotal: '9/15' },
  ];

  var scr003SummaryCols = [
    { label: 'Best Practice', bp: true },
    { label: '국내/외 종합(계)' },
    { label: '조지아 대표차종' },
    { label: '울산 차종명' },
    { label: '차종명' },
    { label: '차종명' },
    { label: '차종명' },
  ];

  // cells: scr003SummaryCols와 동일한 순서(7열)의 값 배열. '-'는 해당 없음.
  var scr003SummaryRows = [
    { label: '자동화율', cells: ['-', '-', '-', '-', '-', '-', '-'] },
    { label: '자동공정 / 총 공정', cells: ['-', '-', '-', '11/17', '12/17', '9/15', '9/15'] },
    { label: '교대운영', cells: ['-', '-', '3교대', '2교대', '2교대', '1교대', '2교대'] },
    { label: 'UPH', cells: ['-', '-', '71UPH', '-', '-', '-', '-'] },
    { label: '조립 인원 (직접)', cells: ['-', '-', '21명', '10명', '8명', '4명', '8명'] },
    { label: '검사 인원 (간접)', cells: ['-', '-', '미확인', '-', '-', '-', '-'] },
    { label: '총인원', cells: ['-', '-', '-', '-', '-', '-', '-'] },
    { label: '총 성인화 (실적/계획)', cells: ['-', '-', '-', "'28년 0명/6명", "'27년 0명/4명", '-', "'30년 0명/2명"] },
  ];

  // 작업내용별 상세 매트릭스 공통 헤더(일반화된 5개 라인열)
  var scr003DetailCols = ['조지아', '울산', '차종명', '차종명', '차종명'];

  // 기술현황(tech): auto(완료 ●) / partial(개발중 ▲) / manual(불가 X) — 셋 다 배지 없는 일반 텍스트(font-semibold)로
  // 표시되고 클릭도 불가하다(디자인 원본에 색상/버튼 없음). cells: scr003DetailCols와 동일한 순서(5열).
  // 'auto'는 검정 필 버튼(재생 아이콘)로 클릭 시 동영상 모달이 열리고, 'manual'은 빨간 텍스트, null은 '-'.
  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html — 매트릭스에서 실제로 값이 채워지고
  // 클릭 가능한 셀은 NO.1(이대치조정)의 "조지아" 열 하나뿐이며, 나머지 11개 행은 5열 모두 공란('-')이다.
  var scr003ProcessDetail = [
    { no: 1, task: '이대치조정', tech: 'auto', plan: '기술 확보 完', hasVideo: true, cells: ['auto', null, null, null, null] },
    { no: 2, task: '디프로딩(4WD)', tech: 'partial', plan: "기술개발 중('27)", cells: ['manual', null, null, null, null] },
    { no: 3, task: '멤버로딩', tech: 'auto', plan: '기술 확보 完', cells: [null, null, null, null, null] },
    { no: 4, task: '리어 로워암 로딩', tech: 'manual', plan: '유동으로 인한 現기술 자동화 불가', cells: [null, null, null, null, null] },
    { no: 6, task: '디프/멤버 가체결(4WD)', tech: 'partial', plan: "기술개발 중('29)", cells: [null, null, null, null, null] },
    { no: 8, task: '디프/멤버 완체결(4WD)', tech: 'auto', plan: '기술 확보 完', cells: [null, null, null, null, null] },
    { no: 10, task: '커플링 / 디프케리어 조립(4WD)', tech: 'manual', plan: '커플링 조립 난해로 現기술력 자동화 불가', cells: [null, null, null, null, null] },
    { no: 11, task: '디프오일주입(4WD)', tech: 'auto', plan: '기술 확보 完', cells: [null, null, null, null, null] },
    { no: 12, task: 'RR로워 암/멤버 가체결', tech: 'manual', plan: '유동으로 인한 現기술 자동화 불가', cells: [null, null, null, null, null] },
    { no: 13, task: '스텝바/멤버 가체결', tech: 'auto', plan: '기술 확보 完', cells: [null, null, null, null, null] },
    { no: 14, task: '리어 어퍼암/멤버 가체결', tech: 'manual', plan: '체결부 유동으로 現 기술력 자동화 불가', cells: [null, null, null, null, null] },
    { no: 15, task: '스텝바 링크/스텝바 가체결', tech: 'manual', plan: '체결부 유동으로 現 기술력 자동화 불가', cells: [null, null, null, null, null] },
  ];

  var scr003Warning = true;
  var scr003LastSync = '2026-08-07 03:00';

  // ---- SCR-002 ----
  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html state.masterList 생성 로직을 그대로 이식(30건).
  // NO는 화면에서 내림차순(최신 등록이 위)으로 계산되므로 렌더링 시점에 filtered.length - index로 매긴다.
  // (SCR-002/004 mock은 js/mock/scr002.js, js/mock/scr004.js로 분리됨)

  // ---- SCR-005 ----
  // 근거: 위 소스 state.ifList 생성 로직 이식(23건).
  var scr005Rows = (function () {
    var ids = ['IF-001', 'IF-002', 'IF-003', 'IF-004', 'IF-005'];
    var types = ['배치', '배치(재처리)', '실시간'];
    var reasons = ['원본 DB 연결 타임아웃', '스키마 불일치', '외부 API 응답 지연'];
    var rows = [];
    for (var i = 0; i < 23; i++) {
      var isFail = i % 5 === 1;
      var day = 7 - Math.floor(i / 3);
      rows.push({
        time: '2026-08-' + String(Math.max(1, day)).padStart(2, '0') + ' 03:' + String((i % 6) * 10).padStart(2, '0') + ':' + String((i * 7) % 60).padStart(2, '0'),
        ifId: ids[i % ids.length],
        type: types[i % types.length],
        count: String(800 + i * 37),
        result: isFail ? '실패' : '성공',
        reason: isFail ? reasons[i % reasons.length] : '',
      });
    }
    return rows;
  })();

  // ---- MTRM-MAIN 통합 로드맵 목록 (mock은 js/mock/mtrm-main.js로 분리됨) ----
  var scr006Rows = global.PNDES.mock.mtrmMain.roadmapList;

  // ---- SCR-007 ----
  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html isRoadmapMgmt — 상세과제 로드맵 관리는
  // (구버전처럼) 통합 로드맵별 탭이 아니라, "통합 로드맵/담당자/기간/진행상태" 드롭다운으로 필터링하는
  // 단일 목록(16건)이다. state.taskRoadmapList 생성 로직을 그대로 이식.
  var taskRoadmapList = global.PNDES.mock.scr007.rows; // mock은 js/mock/scr007.js로 분리됨
  var taskRoadmapFilterRoadmaps = global.PNDES.mock.scr007.filterRoadmaps;

  // ---- SCR-008 통합 로드맵 차트 (계층형 간트: 로드맵 막대 + 하위 상세과제 아코디언) ----
  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html state.chartTasks/QUARTERS —
  // 분기 인덱스 계산용 전체 라벨(26.Q1~28.Q4, 12개)과 4개 로드맵 막대(colStart/colSpan은 QUARTERS 기준 1-based).
  var chartQuarters = ['26.Q1', '26.Q2', '26.Q3', '26.Q4', '27.Q1', '27.Q2', '27.Q3', '27.Q4', '28.Q1', '28.Q2', '28.Q3', '28.Q4'];
  var chartTasks = [
    { id: 1, category: '차체 자동화 로드맵', manager: '김기획 책임', progress: 75, status: '진행중', colStart: 1, colSpan: 3, startQ: '26.Q1', endQ: '26.Q3' },
    { id: 2, category: '조립 자동화 로드맵', manager: '박생기 수석', progress: 40, status: '검토중', colStart: 3, colSpan: 4, startQ: '26.Q3', endQ: '27.Q2' },
    { id: 3, category: '물류/반송 자동화 표준화', manager: '이자동 책임', progress: 15, status: '계획중', colStart: 5, colSpan: 4, startQ: '27.Q1', endQ: '27.Q4' },
    { id: 4, category: 'AI 비전 검사 시스템 도입', manager: '최지능 선임', progress: 90, status: '완료임박', colStart: 2, colSpan: 3, startQ: '26.Q2', endQ: '26.Q4' },
  ];

  // ---- SCR-009 (mock은 js/mock/scr009.js로 분리됨) ----
  var techPrCards = global.PNDES.mock.scr009.detailItems;
  var TECH_PR_TYPE = global.PNDES.mock.scr009.typeInfo;

  // ---- SCR-010 (mock은 js/mock/scr010.js로 분리됨 — v3 기준 재구현으로 구 자료목록 mock은 제거) ----

  // ---- SCR-011 (mock은 js/mock/scr011.js로 분리됨 — v3 기준 재구현으로 구 협의체 목록 mock은 제거) ----

  // ---- SCR-012 (mock은 js/mock/scr012.js로 분리됨 — v3 기준 재구현으로 구 mTRM 목록 mock은 제거) ----

  // ---- SCR-013 (mock은 js/mock/scr013.js로 분리됨) ----

  // ---- SCR-014 (mock은 js/mock/scr014.js로 분리됨 — MTRM-MAIN "최근 기술동향"도 같은 목록을 참조) ----
  var trendsData = global.PNDES.mock.scr014.rows;

  // ---- 등록/수정 모달 필드 정의 ----
  var MODALS = {
    registerProcess: { title: '공정 등록', confirm: '등록', size: 640, successMessage: '새 공정이 성공적으로 등록되었습니다.', fields: [
      { label: '공정명', required: true, type: 'text' },
      { label: 'Best Practice 지정', required: false, type: 'select', options: ['창원 2C 라인', '창원 2A', '창원 2B'] },
      { label: '상태', required: true, type: 'select', options: ['자동', '수동', '旣자동화'] },
      { label: '담당자', required: true, type: 'select', options: ['홍**', '김**'] },
      { label: '첨부', required: false, type: 'file' },
    ] },
    // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html emailModalOpen — 수신자 입력(Enter/쉼표 안내) +
    // 첨부 자료 체크박스(요약 현황/공정별 상세, 기본 체크) + 메모로 구성된다.
    emailShare: { title: '이메일 공유', confirm: '전송', size: 480, successMessage: '이메일 공유가 완료되었습니다.', fields: [
      { label: '수신자', required: true, type: 'text', hint: 'Enter 또는 쉼표(,)로 여러 명 추가' },
      { label: '첨부 자료', type: 'checkboxGroup', options: [
        { label: '요약 현황 (엑셀)', checked: true },
        { label: '공정별 상세 (엑셀)', checked: true },
      ] },
      { label: '메모', required: false, type: 'textarea' },
    ] },
    cellDetail: { title: 'Best Practice 상세', confirm: '닫기', size: 640, fields: [
      { label: '공정', type: 'plaintext', value: '용접' },
      { label: '내용', type: 'plaintext', value: '자동용접 적용 사례' },
      { label: '첨부 재생', type: 'file' },
    ] },
    stdProcessRegister: { title: '표준공정 마스터 등록', editTitle: '표준공정 마스터 수정', confirm: '저장', size: 480, successMessage: '성공적으로 저장되었습니다.', fields: [
      { label: '공장', field: 'factory', required: true, type: 'select', options: ['A공장', 'B공장'] },
      { label: '라인', field: 'line', required: true, type: 'select', options: ['1라인', '2라인'] },
      { label: '표준공정명', field: 'name', required: true, type: 'text', placeholder: '예: 용접, 조립 등' },
      { label: '순서', field: 'seq', required: true, type: 'number', placeholder: '예: 10, 20 등' },
      { label: '비고', field: 'desc', required: false, type: 'text', placeholder: '비고 입력' },
    ] },
    stdTaskRegister: {
      title: '표준 작업명 등록', editTitle: '표준 작업명 수정', confirm: '등록', editConfirm: '수정', size: 480,
      successMessage: '표준 작업명이 등록되었습니다.', editSuccessMessage: '표준 작업명이 수정되었습니다.',
      fields: [
        { label: '작업명', field: 'name', required: true, type: 'text' },
        { label: '공정유형', field: 'type', required: true, type: 'select', options: ['조립', '배선', '검사'] },
      ],
    },
    roadmapRegister: { title: '통합 로드맵 등록', confirm: '등록', size: 640, fields: [
      { label: '분과', required: true, type: 'select' },
      { label: '로드맵명', required: true, type: 'text' },
      { label: '기간(시작)', required: true, type: 'date' },
      { label: '기간(종료)', required: true, type: 'date' },
      { label: '대표과제', required: false, type: 'text' },
    ] },
    history: { title: '개정 이력', confirm: '닫기', size: 640, fields: [
      { label: 'v1.2', type: 'plaintext', value: '2026-07-20 · 기간 연장 (2028.12까지)' },
      { label: 'v1.1', type: 'plaintext', value: '2026-04-01 · 대표과제 변경' },
      { label: 'v1.0', type: 'plaintext', value: '2026-01-05 · 최초 등록' },
    ] },
    detailTaskRegister: {
      title: '상세과제 등록', editTitle: '상세과제 수정', confirm: '등록', editConfirm: '수정', size: 480,
      successMessage: '상세과제가 저장되었습니다.',
      fields: [
        { label: '과제명', field: 'name', required: true, type: 'text' },
        { label: '담당자', field: 'owner', required: true, type: 'select', options: global.PNDES.mock.scr007.owners },
        { label: '기간(시작)', field: 'startDate', required: true, type: 'date' },
        { label: '기간(종료)', field: 'endDate', required: true, type: 'date' },
        { label: '진행상태', field: 'status', required: true, type: 'select', options: global.PNDES.mock.scr007.statuses },
      ],
    },
    ganttDetail: { title: '과제 상세', confirm: '닫기', size: 640, fields: [
      { label: '과제명', type: 'plaintext', value: '용접 로봇 도입' },
      { label: '기간', type: 'plaintext', value: '2026.03 ~ 2026.09' },
      { label: '상태', type: 'plaintext', value: '진행중' },
    ] },
    // 근거: v3.dc.html "기술문의 / 제안" 모달 — 기술명(읽기전용)/요청자/문의·제안 내용 + 안내 문구
    techPrInquiry: { title: '기술문의 / 제안', confirm: '등록', size: 640, successMessage: '문의/제안이 전송되었습니다.', fields: [
      { label: '기술명', field: 'target', type: 'plaintext', value: '' },
      { label: '요청자', type: 'plaintext', value: '자동화기술팀 / 김의왕 매니저' },
      { label: '문의/제안 내용', field: 'content', required: true, type: 'textarea', hint: '※ 검토 후 메일/팀즈로 안내드리겠습니다.' },
    ] },
    ifError: { title: 'I/F 오류 로그', confirm: '닫기', size: 640, fields: [
      { label: '오류 내용', type: 'plaintext', value: '원본 DB 연결 타임아웃 (Connection timeout after 30000ms)' },
    ] },
  };

  // ---- [공통] 메일알림 대상 검색 ----
  // 근거: design-import/생기포털 v3.dc.html MT_DIR (담당실 / 부서(팀) 마스터).
  // SCR-011 협의체 수신자, SCR-012 mTRM 관리 메일알림대상, SCR-014 기술동향 수신자가 공유한다.
  // 실 연동 시 조직 마스터(담당실/팀) 조회 API 응답으로 교체됩니다.
  var mailDirectory = [
    ['램프생기실', '램프생기팀'], ['램프생기실', '램프선행생기팀'], ['모듈생기실', '모듈생기팀'], ['모듈생기실', '모듈공법팀'],
    ['배터리생기실', '금형기술팀'], ['배터리생기실', '셀공정기술팀'], ['생기개발실', '자동화기술팀'], ['생기개발실', '요소기술팀'],
    ['생기개발실', '지능화기술팀'], ['사사안전생기실', '안전생기팀'], ['전동화생기실', '전동화생기팀'], ['전동화생기실', '모터공법팀'],
    ['전장생기실', '전장생기팀'], ['파워모듈생산개발실', '파워모듈개발팀'], ['파워모듈생산개발실', '파워모듈공정팀'],
  ].map(function (d) { return { room: d[0], team: d[1], key: d[0] + '|' + d[1] }; });

  global.PNDES = global.PNDES || {};
  global.PNDES.TECH_PR_TYPE = TECH_PR_TYPE;
  global.PNDES.data = {
    scr001Filters: scr001Filters, scr001FilterPlaceholders: scr001FilterPlaceholders,
    scr001SummaryCols: scr001SummaryCols, scr001SummaryRows: scr001SummaryRows,
    scr001ProcessDetail: scr001ProcessDetail,
    scr003Filters: scr003Filters, scr003FilterPlaceholders: scr003FilterPlaceholders, scr003LineDefs: scr003LineDefs, scr003SummaryCols: scr003SummaryCols,
    scr003SummaryRows: scr003SummaryRows, scr003DetailCols: scr003DetailCols,
    scr003ProcessDetail: scr003ProcessDetail, scr003Warning: scr003Warning, scr003LastSync: scr003LastSync,
    scr005Rows: scr005Rows,
    scr006Rows: scr006Rows,
    taskRoadmapList: taskRoadmapList, taskRoadmapFilterRoadmaps: taskRoadmapFilterRoadmaps,
    chartQuarters: chartQuarters, chartTasks: chartTasks,
    techPrCards: techPrCards,
    trendsData: trendsData,
    mailDirectory: mailDirectory,
  };
  global.PNDES.MODALS = MODALS;
})(window);
