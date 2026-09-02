/*
 * PNDES 신규 메뉴 mock 데이터
 * 근거: Claude Design 프로토타입(PNDES Portal Prototype.dc.html)의 mock 데이터를 1:1 포팅.
 * 실 연동 시 부품/모듈 공정배치 원천 데이터, mTRM 로드맵 API 등으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var SCREENS = {
    'SCR-001': { group: '공정 자동화 현황', name: '부품 공정 자동화 현황', admin: false },
    'SCR-002': { group: '공정 자동화 현황', name: '표준공정 마스터 관리', admin: true },
    'SCR-003': { group: '공정 자동화 현황', name: '모듈 공정 자동화 현황', admin: false },
    'SCR-004': { group: '공정 자동화 현황', name: '모듈 표준 작업명 관리', admin: true },
    'SCR-005': { group: '공정 자동화 현황', name: 'I/F 실행결과 관리', admin: true },
    'SCR-006': { group: '중장기 방향성 공유', name: '통합 로드맵', admin: false },
    'SCR-007': { group: '중장기 방향성 공유', name: '상세과제 로드맵 관리', admin: false },
    'SCR-008': { group: '중장기 방향성 공유', name: '통합 로드맵 차트', admin: false },
    'SCR-009': { group: '중장기 방향성 공유', name: '생산기술 Tech PR', admin: false },
    'SCR-010': { group: '중장기 방향성 공유', name: '생산기술 Tech PR 관리자', admin: true },
    'SCR-011': { group: '중장기 방향성 공유', name: 'mTRM 협의체', admin: true },
    'SCR-012': { group: '중장기 방향성 공유', name: 'mTRM 관리', admin: true },
    'SCR-013': { group: '중장기 방향성 공유', name: '기술과제 관리', admin: false },
    'SCR-014': { group: '중장기 방향성 공유', name: '기술동향', admin: false },
    'MTRM-MAIN': { group: '중장기 방향성 공유', name: '메인 대시보드', admin: false },
  };

  // 근거: design_handoff_pndes_portal 최종 스크린샷 기준 실제 좌측 메뉴 순서는
  // 공정 자동화 현황:[SCR-001~005], 중장기 방향성 공유:[MTRM-MAIN, SCR-006(하위:SCR-007/008), SCR-009~014]
  var NAV = [
    { title: '공정 자동화 현황', items: ['SCR-001', 'SCR-002', 'SCR-003', 'SCR-004', 'SCR-005'] },
    { title: '중장기 방향성 공유', items: ['MTRM-MAIN', 'SCR-006', 'SCR-007', 'SCR-008', 'SCR-009', 'SCR-010', 'SCR-011', 'SCR-012', 'SCR-013', 'SCR-014'] },
  ];

  // SCR-006(통합 로드맵)의 하위 메뉴: 우측 화살표 클릭 시 펼침/접힘 (state: navSubOpen, 기본 펼침)
  var NAV_CHILDREN = { 'SCR-006': ['SCR-007', 'SCR-008'] };

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
  var scr002Rows = (function () {
    var names = ['용접', '조립', '검사', '도장', '프레스', '이송', '체결', '포장', '세척', '라벨링'];
    var factories = ['A공장', 'B공장'];
    var lines = ['1라인', '2라인', '3라인'];
    var rows = [];
    for (var i = 0; i < 30; i++) {
      rows.push({
        factory: factories[i % factories.length],
        line: lines[i % lines.length],
        name: names[i % names.length] + (i >= names.length ? ' ' + (Math.floor(i / names.length) + 1) : ''),
        seq: String((i % 10 + 1) * 10),
        desc: i % 7 === 0 ? '신규 라인' : '',
      });
    }
    return rows;
  })();

  // ---- SCR-004 ----
  // 근거: 위 소스 state.taskList 생성 로직 이식(24건).
  var scr004Rows = (function () {
    var names = ['볼트 체결', '와이어링', '용접', '검사', '도장', '이송', '조립', '포장', '세척', '라벨링', '프레스', '체결확인'];
    var types = ['조립', '배선', '용접', '검사', '도장', '물류'];
    var registrants = ['홍길동', '김철수', '이영희', '박민수', '최지훈'];
    var rows = [];
    for (var i = 0; i < 24; i++) {
      rows.push({
        name: names[i % names.length] + (i >= names.length ? ' ' + (Math.floor(i / names.length) + 1) : ''),
        type: types[i % types.length],
        registeredBy: registrants[i % registrants.length],
        registered: '2026-' + String((i % 12) + 1).padStart(2, '0') + '-' + String((i % 27) + 1).padStart(2, '0'),
      });
    }
    return rows;
  })();

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

  // ---- SCR-006 ----
  // 근거: 위 소스 state.roadmapList 생성 로직 이식(14건: 기본 5건 + 확장 9건).
  var STATUS_KIND = { 진행중: 'info', 계획: 'warning', 반려: 'danger', 보류: 'neutral' };
  var scr006Rows = (function () {
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
    rows.forEach(function (r) { r.statusKind = STATUS_KIND[r.status]; });
    return rows;
  })();
  var roadmapOptions = [
    { id: 'body', label: '차체 자동화 로드맵' },
    { id: 'assembly', label: '조립 자동화 로드맵' },
  ];

  // ---- SCR-007 ----
  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html isRoadmapMgmt — 상세과제 로드맵 관리는
  // (구버전처럼) 통합 로드맵별 탭이 아니라, "통합 로드맵/담당자/기간/진행상태" 드롭다운으로 필터링하는
  // 단일 목록(16건)이다. state.taskRoadmapList 생성 로직을 그대로 이식.
  var taskRoadmapFilterRoadmaps = ['차체 자동화 로드맵', '조립 자동화 로드맵', '물류/반송 자동화 표준화', 'AI 비전 검사 시스템 도입'];
  var taskRoadmapList = (function () {
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
    var owners = ['홍**', '김**', '이**', '박**', '최**', '정**'];
    var statuses = ['진행중', '계획', '반려', '보류'];
    var rows = base.slice();
    for (var i = 4; i < 16; i++) {
      var rm = roadmaps[i % roadmaps.length];
      rows.push({
        name: rm.replace(' 자동화 로드맵', '') + ' 세부과제 ' + (i - 3),
        owner: owners[i % owners.length],
        period: windows[rm][0] + '~' + windows[rm][1],
        status: statuses[i % statuses.length],
        roadmap: rm,
      });
    }
    rows.forEach(function (r) { r.statusKind = STATUS_KIND[r.status]; });
    return rows;
  })();

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

  // ---- SCR-009 ----
  // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html TECH_PR_ITEMS(15건)를 그대로 이식.
  // 자료 유형(type)별로 카드 썸네일과 상세 오버레이(techPrDetail) 콘텐츠가 달라집니다:
  // video(동영상)/file(파일)/text(텍스트)/multi(복합자료).
  var techPrCards = [
    { title: '용접 로봇 도입', section: '차체', type: 'video', date: '2026-07-01', owner: '홍**',
      desc: '차체 용접공정에 6축 로봇을 도입한 사례입니다. 기존 수작업 대비 용접 품질 편차를 크게 줄였습니다.' },
    { title: '검사 AI 적용', section: '검사', type: 'file', date: '2026-07-03', owner: '김**',
      fileName: '검사AI_적용사례.pdf', fileSize: '2.4MB' },
    { title: '코봇 활용 사례', section: '조립', type: 'video', date: '2026-07-05', owner: '이**',
      desc: '조립 공정에 협동로봇(코봇)을 도입해 작업자 부담을 줄인 사례입니다.' },
    { title: '배선 자동화', section: '배선', type: 'text', date: '2026-07-08', owner: '박**',
      body: '배선 자동화 적용 배경과 효과를 정리한 기술 노트입니다. 기존 수작업 배선 공정 대비 불량률을 40% 감소시켰으며, 1일 처리 물량은 1.6배 증가했습니다. 향후 타 라인 확대 적용을 검토 중입니다.' },
    { title: '냉각 시스템 개선', section: '냉각', type: 'multi', date: '2026-07-10', owner: '최**',
      items: [
        { type: 'video', desc: '냉각수 순환 자동화 적용 전/후 비교 영상입니다.' },
        { type: 'file', fileName: '냉각시스템_개선보고서.pdf', fileSize: '1.1MB' },
        { type: 'text', body: '냉각 효율을 15% 개선하고 설비 정지시간을 줄인 사례입니다. 관련 부품 표준화도 함께 진행했습니다.' },
      ] },
    { title: '물류 반송 자동화', section: '배선', type: 'text', date: '2026-07-17', owner: '정**',
      body: '물류 반송 자동화 적용 배경과 기대 효과를 정리한 기술 노트입니다.' },
    { title: '도어 조립 자동화', section: '냉각', type: 'video', date: '2026-07-18', owner: '유**',
      desc: '냉각 공정에 자동화 설비를 도입한 사례를 담은 영상입니다.' },
    { title: '섀시 검사 고도화', section: '물류', type: 'file', date: '2026-07-19', owner: '한**',
      fileName: '섀시 검사 고도화_보고서.pdf', fileSize: '1.8MB' },
    { title: '도장 로봇 튜닝', section: '도어', type: 'text', date: '2026-07-20', owner: '조**',
      body: '도장 로봇 튜닝 적용 배경과 기대 효과를 정리한 기술 노트입니다.' },
    { title: '비전 검사 확대', section: '섀시', type: 'video', date: '2026-07-21', owner: '임**',
      desc: '섀시 공정에 자동화 설비를 도입한 사례를 담은 영상입니다.' },
    { title: '파워트레인 조립 개선', section: '차체', type: 'file', date: '2026-07-22', owner: '홍**',
      fileName: '파워트레인 조립 개선_보고서.pdf', fileSize: '1.8MB' },
    { title: '프레스 라인 무인화', section: '조립', type: 'text', date: '2026-07-23', owner: '김**',
      body: '프레스 라인 무인화 적용 배경과 기대 효과를 정리한 기술 노트입니다.' },
    { title: '용접 비드 검사 AI', section: '도장', type: 'video', date: '2026-07-24', owner: '이**',
      desc: '도장 공정에 자동화 설비를 도입한 사례를 담은 영상입니다.' },
    { title: '조립 토크 관리 자동화', section: '엔진', type: 'file', date: '2026-07-25', owner: '박**',
      fileName: '조립 토크 관리 자동화_보고서.pdf', fileSize: '1.8MB' },
    { title: '부품 이송 로봇 도입', section: '검사', type: 'text', date: '2026-07-26', owner: '최**',
      body: '부품 이송 로봇 도입 적용 배경과 기대 효과를 정리한 기술 노트입니다.' },
  ];

  // 카드 유형별 배지 색상 (design-style-guide.md 3.3 확장 — 복합자료: 보라 #6B46C1/#F1EAFB)
  var TECH_PR_TYPE = {
    video: { label: '동영상', color: '#1A56DB', bg: '#E9F0FD' },
    file: { label: '파일', color: '#B45309', bg: '#FDEEDC' },
    text: { label: '텍스트', color: '#157A3D', bg: '#EAF7EE' },
    multi: { label: '복합자료', color: '#6B46C1', bg: '#F1EAFB' },
  };

  // ---- SCR-010 ----
  // 근거: 위 소스 state.techPrAdminList 생성 로직 이식(15건).
  var scr010Rows = (function () {
    var rows = [{ title: '용접 로봇 도입', task: '용접 자동화', owner: '홍**', attachment: '동영상 1건', registered: '2026-07-01' }];
    var tasks = ['용접 자동화', '검사 자동화', '조립 자동화', '도장 자동화', '물류 자동화'];
    var owners = ['홍**', '김**', '이**', '박**', '최**'];
    var attaches = ['동영상 1건', '문서 1건', '동영상 2건', '문서 2건'];
    for (var i = 1; i < 15; i++) {
      rows.push({
        title: tasks[i % tasks.length].replace(' 자동화', '') + ' 자료 ' + i,
        task: tasks[i % tasks.length],
        owner: owners[i % owners.length],
        attachment: attaches[i % attaches.length],
        registered: '2026-07-' + String((i % 27) + 1).padStart(2, '0'),
      });
    }
    return rows;
  })();

  // ---- SCR-011 ----
  // 근거: 위 소스 state.mtrmList 생성 로직 이식(13건).
  var scr011Rows = (function () {
    var rows = [{ name: '26H1 협의체', section: '차체', agenda: '로드맵 리뷰', target: '이**', schedule: '2026-08-20', mailStatus: '발송완료' }];
    var depts = ['차체', '조립', '도장', '엔진', '물류'];
    var agendas = ['로드맵 리뷰', '기술과제 협의', '진행 현황 점검', '차기 계획 수립'];
    var targets = ['이**', '박**', '최**', '정**'];
    var statuses = ['발송완료', '발송대기'];
    for (var i = 1; i < 13; i++) {
      rows.push({
        name: '26H' + ((i % 2) + 1) + ' ' + depts[i % depts.length] + ' 협의체 ' + (Math.floor(i / depts.length) + 1),
        section: depts[i % depts.length],
        agenda: agendas[i % agendas.length],
        target: targets[i % targets.length],
        schedule: '2026-' + String((i % 12) + 1).padStart(2, '0') + '-' + String((i % 27) + 1).padStart(2, '0'),
        mailStatus: statuses[i % statuses.length],
      });
    }
    rows.forEach(function (r) { r.mailKind = r.mailStatus === '발송완료' ? 'success' : 'neutral'; });
    return rows;
  })();

  // ---- SCR-012 ----
  // 근거: 위 소스 state.mtrmMgmtList 생성 로직 이식(13건).
  var scr012Rows = (function () {
    var rows = [{ name: '차체 mTRM', section: '차체', status: '활성', registered: '2026-01-05' }];
    var depts = ['차체', '조립', '도장', '엔진', '물류'];
    var statuses = ['활성', '비활성'];
    for (var i = 1; i < 13; i++) {
      rows.push({
        name: depts[i % depts.length] + ' mTRM ' + (Math.floor(i / depts.length) + 1),
        section: depts[i % depts.length],
        status: statuses[i % statuses.length],
        registered: '2026-' + String((i % 12) + 1).padStart(2, '0') + '-' + String((i % 27) + 1).padStart(2, '0'),
      });
    }
    rows.forEach(function (r) { r.statusKind = r.status === '활성' ? 'success' : 'neutral'; });
    return rows;
  })();

  // ---- SCR-013 ----
  // 근거: 위 소스 ROADMAP_MAPPINGS — 연동 mTRM 로드맵 선택값에 따라 자동 매핑 결과 테이블 행이 달라진다.
  // 로드맵을 선택하지 않았을 때는 "연동 mTRM 로드맵을 선택하세요." 안내 문구만 노출된다(techTaskNoMapping).
  var ROADMAP_MAPPINGS = {
    '차체 자동화 로드맵': [{ roadmap: '차체 자동화 로드맵', task: '용접 로봇 도입' }],
    '조립 자동화 로드맵': [{ roadmap: '조립 자동화 로드맵', task: '검사공정 자동화' }],
  };

  // ---- SCR-014 ----
  // 근거: 위 소스 state.techTrendList(15건)를 그대로 이식.
  var trendsData = [
    { title: '글로벌 자동화 트렌드 A', views: 121, date: '2026-07-01', dept: '기획팀', owner: '박**', tag: '자동화', content: '해외 완성차 OEM의 조립라인 자동화 도입 현황과 협동로봇 적용 사례를 정리한 자료입니다.' },
    { title: '신기술 소재 자료 B', views: 85, date: '2026-07-05', dept: '기획팀', owner: '이**', tag: '신소재', content: '경량화 신소재 적용을 위한 부품 시험 결과와 원가 영향 분석을 담은 자료입니다.' },
    { title: '기술개발 제안 C', views: 42, date: '2026-07-10', dept: '기획팀', owner: '최**', tag: '제안', content: '현장 제안 기반 기술개발 아이디어와 기대 효과를 정리한 자료입니다.' },
    { title: '글로벌 자동화 트렌드 D', views: 200, date: '2026-07-14', dept: '기획팀', owner: '정**', tag: '자동화', content: '해외 완성차 OEM의 조립라인 자동화 도입 현황과 협동로봇 적용 사례를 정리한 자료입니다.' },
    { title: '로봇 기술동향 E', views: 74, date: '2026-07-19', dept: '기획팀', owner: '한**', tag: '로봇', content: '검사 분야 로봇 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '설계 기술동향 F', views: 85, date: '2026-07-20', dept: '기획팀', owner: '조**', tag: '설계', content: '배선 분야 설계 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '품질 기술동향 G', views: 96, date: '2026-07-21', dept: '기획팀', owner: '임**', tag: '품질', content: '냉각 분야 품질 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '안전 기술동향 H', views: 107, date: '2026-07-22', dept: '기획팀', owner: '홍**', tag: '안전', content: '물류 분야 안전 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '원가 기술동향 I', views: 118, date: '2026-07-23', dept: '기획팀', owner: '김**', tag: '원가', content: '도어 분야 원가 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '물류 기술동향 J', views: 129, date: '2026-07-24', dept: '기획팀', owner: '이**', tag: '물류', content: '섀시 분야 물류 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '자동화 기술동향 K', views: 140, date: '2026-07-25', dept: '기획팀', owner: '박**', tag: '자동화', content: '차체 분야 자동화 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '신소재 기술동향 L', views: 151, date: '2026-07-26', dept: '기획팀', owner: '최**', tag: '신소재', content: '조립 분야 신소재 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '제안 기술동향 M', views: 162, date: '2026-07-27', dept: '기획팀', owner: '정**', tag: '제안', content: '도장 분야 제안 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '비전 기술동향 N', views: 173, date: '2026-07-28', dept: '기획팀', owner: '유**', tag: '비전', content: '엔진 분야 비전 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
    { title: '로봇 기술동향 O', views: 184, date: '2026-07-29', dept: '기획팀', owner: '한**', tag: '로봇', content: '검사 분야 로봇 관련 최신 동향과 적용 사례를 정리한 자료입니다.' },
  ];

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
    stdProcessRegister: { title: '표준공정 마스터 등록', confirm: '저장', size: 480, successMessage: '성공적으로 저장되었습니다.', fields: [
      { label: '공장', required: true, type: 'select', options: ['A공장', 'B공장'] },
      { label: '라인', required: true, type: 'select', options: ['1라인', '2라인'] },
      { label: '표준공정명', required: true, type: 'text', placeholder: '예: 용접, 조립 등' },
      { label: '순서', required: true, type: 'text', placeholder: '예: 10, 20 등' },
      { label: '비고', required: false, type: 'text', placeholder: '비고 입력' },
    ] },
    stdTaskRegister: { title: '표준 작업명 등록', confirm: '등록', size: 480, successMessage: '표준 작업명이 등록되었습니다.', fields: [
      { label: '작업명', required: true, type: 'text' },
      { label: '공정유형', required: true, type: 'select', options: ['조립', '배선', '검사'] },
    ] },
    deleteConfirm: { title: '삭제 확인', confirm: '삭제', size: 480, fields: [
      { label: '안내', type: 'plaintext', value: '이 항목은 12개 모듈에서 사용 중입니다. 계속하시겠습니까?' },
    ] },
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
    detailTaskRegister: { title: '상세과제 등록', confirm: '등록', size: 640, fields: [
      { label: '과제명', required: true, type: 'text' },
      { label: '담당자', required: true, type: 'select' },
      { label: '기간(시작)', required: true, type: 'date' },
      { label: '기간(종료)', required: true, type: 'date' },
      { label: '진행상태', required: true, type: 'select' },
    ] },
    ganttDetail: { title: '과제 상세', confirm: '닫기', size: 640, fields: [
      { label: '과제명', type: 'plaintext', value: '용접 로봇 도입' },
      { label: '기간', type: 'plaintext', value: '2026.03 ~ 2026.09' },
      { label: '상태', type: 'plaintext', value: '진행중' },
    ] },
    techPrInquiry: { title: '기술 문의/제안', confirm: '전송', size: 640, successMessage: '문의/제안이 전송되었습니다.', fields: [
      { label: '대상 소재', type: 'plaintext', value: '용접 로봇 도입' },
      { label: '문의/제안 내용', required: true, type: 'textarea' },
    ] },
    materialRegister: { title: '자료 등록', confirm: '등록', size: 800, successMessage: '자료가 등록되었습니다.', fields: [
      { label: '제목', required: true, type: 'text' },
      { label: '과제', required: true, type: 'select', options: ['용접 자동화', '검사 자동화'] },
      { label: '담당자', required: true, type: 'select', options: ['홍**', '김**'] },
      { label: '담당자 이메일', required: true, type: 'text', placeholder: 'name@company.com' },
      { label: '상세 설명', required: false, type: 'textarea' },
      { label: '첨부 문서', required: false, type: 'file' },
      { label: '첨부 동영상', required: false, type: 'file' },
    ] },
    mtrmRegister: { title: 'mTRM 등록', confirm: '등록', size: 480, successMessage: 'mTRM이 저장되었습니다.', fields: [
      { label: 'mTRM명', required: true, type: 'text' },
      { label: '분과', required: true, type: 'select', options: ['차체', '조립', '도장'] },
      { label: '상태', required: true, type: 'select', options: ['활성', '비활성'] },
      { label: '등록일', required: true, type: 'date' },
    ] },
    trendRegister: { title: '기술동향 등록', confirm: '등록', size: 640, successMessage: '기술동향이 등록되었습니다.', fields: [
      { label: '제목', required: true, type: 'text' },
      { label: '담당자 이름', required: true, type: 'text' },
      { label: '부서명', required: true, type: 'text' },
      { label: '태그', required: false, type: 'text' },
      { label: '내용', required: true, type: 'textarea' },
      { label: '첨부파일', required: false, type: 'file' },
    ] },
    councilRegister: { title: '협의체 등록', confirm: '등록', size: 480, successMessage: '협의체가 등록되었습니다.', fields: [
      { label: '협의체명', required: true, type: 'text' },
      { label: '분과', required: true, type: 'select', options: ['차체', '조립', '도장'] },
      { label: '연동 mTRM', required: true, type: 'select', options: ['차체 mTRM', '조립 mTRM'], hint: '분과를 먼저 선택하세요' },
      { label: '의제', required: false, type: 'text' },
      { label: '대상 분과장', required: true, type: 'select', options: ['이**', '박**'], hint: '메일 수신자(To)로 자동 발송됩니다' },
      { label: '참조(CC)', required: false, type: 'text', placeholder: '이메일 입력 후 Enter', hint: 'Enter 또는 쉼표(,)로 여러 명 추가' },
      { label: '일정', required: true, type: 'date' },
    ] },
    ifError: { title: 'I/F 오류 로그', confirm: '닫기', size: 640, fields: [
      { label: '오류 내용', type: 'plaintext', value: '원본 DB 연결 타임아웃 (Connection timeout after 30000ms)' },
    ] },
  };

  global.PNDES = global.PNDES || {};
  global.PNDES.SCREENS = SCREENS;
  global.PNDES.NAV = NAV;
  global.PNDES.NAV_CHILDREN = NAV_CHILDREN;
  global.PNDES.TECH_PR_TYPE = TECH_PR_TYPE;
  global.PNDES.data = {
    scr001Filters: scr001Filters, scr001FilterPlaceholders: scr001FilterPlaceholders,
    scr001SummaryCols: scr001SummaryCols, scr001SummaryRows: scr001SummaryRows,
    scr001ProcessDetail: scr001ProcessDetail,
    scr003Filters: scr003Filters, scr003FilterPlaceholders: scr003FilterPlaceholders, scr003LineDefs: scr003LineDefs, scr003SummaryCols: scr003SummaryCols,
    scr003SummaryRows: scr003SummaryRows, scr003DetailCols: scr003DetailCols,
    scr003ProcessDetail: scr003ProcessDetail, scr003Warning: scr003Warning, scr003LastSync: scr003LastSync,
    scr002Rows: scr002Rows,
    scr004Rows: scr004Rows,
    scr005Rows: scr005Rows,
    scr006Rows: scr006Rows, roadmapOptions: roadmapOptions,
    taskRoadmapList: taskRoadmapList, taskRoadmapFilterRoadmaps: taskRoadmapFilterRoadmaps,
    chartQuarters: chartQuarters, chartTasks: chartTasks,
    techPrCards: techPrCards,
    scr010Rows: scr010Rows,
    scr011Rows: scr011Rows,
    scr012Rows: scr012Rows,
    roadmapMappings: ROADMAP_MAPPINGS,
    trendsData: trendsData,
  };
  global.PNDES.MODALS = MODALS;
})(window);
