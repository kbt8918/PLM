/*
 * PNDES 신규 메뉴 mock 데이터
 * 근거: Claude Design 프로토타입(PNDES Portal Prototype.dc.html)의 mock 데이터를 1:1 포팅.
 * 실 연동 시 부품/모듈 공정배치 원천 데이터, mTRM 로드맵 API 등으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var SCREENS = {
    'FLOW-MAP': { group: '가이드', name: '전체 프로세스 흐름도', admin: false },
    'DASH-AUTO': { group: '공정 자동화 현황', name: '통합 대시보드', admin: false },
    'DASH-MTRM': { group: '중장기 방향성 공유', name: '통합 대시보드', admin: false },
    'SCR-001': { group: '공정 자동화 현황', name: '부품 공정 자동화 현황', admin: false },
    'SCR-002': { group: '공정 자동화 현황', name: '표준공정 마스터 관리', admin: true },
    'SCR-003': { group: '공정 자동화 현황', name: '모듈 공정 자동화 현황', admin: false },
    'SCR-004': { group: '공정 자동화 현황', name: '모듈 표준 작업명 관리', admin: true },
    'SCR-005': { group: '공정 자동화 현황', name: 'I/F 실행결과 관리', admin: true },
    'SCR-006': { group: '중장기 방향성 공유', name: '통합 로드맵 관리', admin: false },
    'SCR-007': { group: '중장기 방향성 공유', name: '상세과제 로드맵 관리', admin: false },
    'SCR-008': { group: '중장기 방향성 공유', name: 'mTRM 통합 로드맵 대시보드', admin: false },
    'SCR-009': { group: '중장기 방향성 공유', name: '생산기술 Tech PR', admin: false },
    'SCR-010': { group: '중장기 방향성 공유', name: 'Tech PR 관리자', admin: true },
    'SCR-011': { group: '중장기 방향성 공유', name: 'mTRM 협의체 관리', admin: true },
    'SCR-012': { group: '중장기 방향성 공유', name: 'mTRM 관리', admin: true },
    'SCR-013': { group: '중장기 방향성 공유', name: '기술과제 계획 등록', admin: false },
    'SCR-014': { group: '중장기 방향성 공유', name: '기술동향', admin: false },
  };

  var NAV = [
    { title: '가이드', items: ['FLOW-MAP'] },
    { title: '공정 자동화 현황', items: ['DASH-AUTO', 'SCR-001', 'SCR-002', 'SCR-003', 'SCR-004', 'SCR-005'] },
    { title: '중장기 방향성 공유', items: ['DASH-MTRM', 'SCR-006', 'SCR-007', 'SCR-008', 'SCR-009', 'SCR-010', 'SCR-011', 'SCR-012', 'SCR-013', 'SCR-014'] },
  ];

  // FLOW-MAP(전체 프로세스 흐름도)은 실 운영 화면에서는 노출하지 않고, 화면설계서(sb-creator-kbt)
  // 캡처 등 필요 시에만 노출합니다. app.js가 URL 쿼리스트링(?showFlowMap=1)을 보고 런타임에
  // FEATURE_FLAGS.showFlowMapInNav를 true로 덮어씁니다(기본값은 항상 false = 비노출).
  var FEATURE_FLAGS = {
    showFlowMapInNav: false,
  };

  // FLOW-MAP에서 각 화면의 미리보기 종류(dashboard/table/gantt/cards/form)
  var FLOW_KIND = {
    'DASH-AUTO': 'dashboard', 'SCR-001': 'table', 'SCR-002': 'table', 'SCR-003': 'table', 'SCR-004': 'table', 'SCR-005': 'table',
    'DASH-MTRM': 'dashboard', 'SCR-006': 'table', 'SCR-007': 'table', 'SCR-008': 'gantt', 'SCR-009': 'cards', 'SCR-010': 'table',
    'SCR-011': 'table', 'SCR-012': 'table', 'SCR-013': 'form', 'SCR-014': 'cards',
  };
  var FLOW_AUTO_IDS = ['DASH-AUTO', 'SCR-001', 'SCR-002', 'SCR-003', 'SCR-004', 'SCR-005'];
  var FLOW_MTRM_IDS = ['DASH-MTRM', 'SCR-006', 'SCR-007', 'SCR-008', 'SCR-009', 'SCR-010', 'SCR-011', 'SCR-012', 'SCR-013', 'SCR-014'];

  // ---- SCR-001 ----
  // 근거: 00.통합자료실/고객자료/부품공정 자동화 현황 as-is.pdf(항목/데이터),
  //       부품공정 자동화 현황 to-be 초안.pdf(요약현황·공정별 상세 UI 구조, 자동화율/직접인원 as-is→to-be 델타 표기)
  var scr001Filters = ['제품군', '제품', '지역', '공장', '라인'];

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

  // 공정별 상세: Best Practice 영역 -> 현재/개선/주요내용 + 확대전개계획(공장/라인별) 매트릭스로 고도화
  // 확대전개계획 셀 종류: auto(자동 적용완료) / na(미해당) / possible(연도내 적용가능) / agree(협의必, ROI 근거) /
  //                     agreeUnrecoverable(협의必, 투자비 회수불가) / review(미적용, 협의중)
  var scr001ProcessDetail = [
    {
      no: 1, process: '오버몰딩',
      current: { kind: 'auto', label: '자동' }, improve: { label: '자동' }, mainContent: '-',
      hasVideo: true, videoLabel: '오버몰딩 자동화 설비 동영상',
      cells: {
        c2c: { kind: 'auto' }, c2a: { kind: 'auto' }, c2b: { kind: 'auto' }, c2d: { kind: 'na' }, c2e: { kind: 'na' },
        msk1: { kind: 'auto' }, mmx1: { kind: 'agree', roi: '13년', headcount: 1 },
        mwx1: { kind: 'auto' }, mwx2: { kind: 'agreeUnrecoverable', headcount: 1 },
      },
    },
    {
      no: 2, process: '파워헤드 버퍼적재',
      current: { kind: 'manual', label: '수동', count: '1명' }, improve: { label: "가능('27)" }, mainContent: '6축로봇 + 버퍼대차',
      hasVideo: false,
      cells: {
        c2c: { kind: 'possible', year: '27' }, c2a: { kind: 'possible', year: '27' }, c2b: { kind: 'possible', year: '28' },
        c2d: { kind: 'na' }, c2e: { kind: 'na' }, msk1: { kind: 'possible', year: '27' }, mmx1: { kind: 'agreeUnrecoverable', headcount: 1 },
        mwx1: { kind: 'na' }, mwx2: { kind: 'na' },
      },
    },
    {
      no: 3, process: '인풋툴 조립',
      current: { kind: 'manual', label: '수동', count: '1명' }, improve: { label: "가능('27)" }, mainContent: '인풋툴 조립 인덱스, 컬럼 로딩/조립로봇 外',
      hasVideo: false,
      cells: {
        c2c: { kind: 'possible', year: '27' }, c2a: { kind: 'possible', year: '27' }, c2b: { kind: 'possible', year: '28' },
        c2d: { kind: 'review', headcount: 1 }, c2e: { kind: 'possible', year: '29' },
        msk1: { kind: 'agree', roi: '42년', headcount: 1 }, mmx1: { kind: 'agreeUnrecoverable', headcount: 1 },
        mwx1: { kind: 'agreeUnrecoverable', headcount: 1 }, mwx2: { kind: 'agreeUnrecoverable', headcount: 1 },
      },
    },
    {
      // 프로토타입 PDF 기준: NO.3(인풋툴 조립)·NO.4(컬럼 조립)는 현재/개선/주요내용은 병합 표기되지만
      // 확대전개계획 매트릭스(라인별 확대 가능 시점)는 행마다 개별 값을 가진다.
      no: 4, process: '컬럼 조립', processNote: '추정',
      current: { kind: 'manual', label: '수동', count: '1명' }, improve: { label: "가능('27)" }, mainContent: '인풋툴 조립 인덱스, 컬럼 로딩/조립로봇 外',
      hasVideo: false,
      cells: {
        c2c: { kind: 'possible', year: '28' }, c2a: { kind: 'possible', year: '28' }, c2b: { kind: 'possible', year: '29' },
        c2d: { kind: 'review', headcount: 1 }, c2e: { kind: 'possible', year: '30' },
        msk1: { kind: 'agree', roi: '45년', headcount: 1 }, mmx1: { kind: 'agreeUnrecoverable', headcount: 1 },
        mwx1: { kind: 'agreeUnrecoverable', headcount: 1 }, mwx2: { kind: 'agreeUnrecoverable', headcount: 1 },
      },
    },
  ];

  // ---- SCR-003 (모듈 자동화 현황_as-is.pdf 기준: 리어샤시/조지아·울산 예시, SCR-001과 동일한
  //      요약 현황(지표x라인) + 공정별 상세(Best Practice·확대전개계획 매트릭스) UI/UX 적용) ----
  var scr003Filters = ['제품군', '제품', '권역', '공장', '엔진타입'];

  var scr003LineCols = [
    { id: 'bp', label: 'Best Practice', bp: true },
    { id: 'total', label: '국내/외 종합(계)' },
    { id: 'ga', label: '조지아', sub: '대표차종' },
    { id: 'us', label: '울산', sub: '차종명' },
    { id: 'v1', label: '차종명' },
    { id: 'v2', label: '차종명' },
    { id: 'v3', label: '차종명' },
  ];

  var scr003SummaryRows = [
    { label: '자동화율', values: {} },
    { label: '자동공정 / 총 공정', values: { us: '11 / 17', v1: '12 / 17', v2: '9 / 15', v3: '9 / 15' } },
    { label: '교대운영', values: { ga: '3교대', us: '2교대', v1: '2교대', v2: '1교대', v3: '2교대' } },
    { label: 'UPH', values: { ga: '71UPH' } },
    { label: '조립 인원 (직접)', values: { ga: '21명', us: '10명', v1: '8명', v2: '4명', v3: '8명' } },
    { label: '검사 인원 (간접)', values: { ga: '???' } },
    { label: '총인원', values: {} },
    { label: '총 성인화 (실적/계획)', values: { us: "'28년 0명 / 6명", v1: "'27년 0명 / 4명", v2: '-', v3: "'30년 0명 / 2명" } },
  ];

  // 기술현황(tech): auto(완료 ●) / partial(개발중 ▲) / manual(불가 X)
  var scr003ProcessDetail = [
    { no: 1, task: '이대치조정', tech: 'auto', plan: '기술 확보 完', cells: { ga: 'auto' } },
    { no: 2, task: '디프로딩(4WD)', tech: 'partial', plan: "기술개발 중('27)", cells: { ga: 'manual' } },
    { no: 3, task: '멤버로딩', tech: 'auto', plan: '기술 확보 完', cells: {} },
    { no: 4, task: '리어 로워암 로딩', tech: 'manual', plan: '유동으로 인한 現기술 자동화 불가', cells: {} },
    { no: 6, task: '디프/멤버 가체결(4WD)', tech: 'partial', plan: "기술개발 중('29)", cells: {} },
    { no: 8, task: '디프/멤버 완체결(4WD)', tech: 'auto', plan: '기술 확보 完', cells: {} },
    { no: 10, task: '커플링 / 디프케리어 조립(4WD)', tech: 'manual', plan: '커플링 조립 난해로 現기술력 자동화 불가', cells: {} },
    { no: 11, task: '디프오일주입(4WD)', tech: 'auto', plan: '기술 확보 完', cells: {} },
    { no: 12, task: 'RR로워 암/멤버 가체결', tech: 'manual', plan: '유동으로 인한 現기술 자동화 불가', cells: {} },
    { no: 13, task: '스텝바/멤버 가체결', tech: 'auto', plan: '기술 확보 完', cells: {} },
    { no: 14, task: '리어 어퍼암/멤버 가체결', tech: 'manual', plan: '체결부 유동으로 現 기술력 자동화 불가', cells: {} },
    { no: 15, task: '스텝바 링크/스텝바 가체결', tech: 'manual', plan: '체결부 유동으로 現 기술력 자동화 불가', cells: {} },
  ];

  var scr003Warning = true;
  var scr003LastSync = '2026-08-07 03:00';

  // ---- SCR-002 ----
  var scr002Rows = [
    { plant: 'A공장', line: '1라인', name: '용접', seq: 10, note: '-' },
    { plant: 'A공장', line: '1라인', name: '조립', seq: 20, note: '-' },
    { plant: 'A공장', line: '2라인', name: '검사', seq: 10, note: '신규 라인' },
  ];

  // ---- SCR-004 ----
  var scr004Rows = [
    { name: '볼트 체결', type: '조립', usage: 12, registered: '2026-01-10' },
    { name: '와이어링', type: '배선', usage: 8, registered: '2026-02-15' },
  ];

  // ---- SCR-005 ----
  var scr005Rows = [
    { time: '2026-08-07 03:00:12', ifId: 'IF-003', type: '배치', count: '1,204', result: '성공', resultKind: 'success', reason: '-', clickable: false },
    { time: '2026-08-06 03:00:08', ifId: 'IF-003', type: '배치', count: '980', result: '실패', resultKind: 'danger', reason: '원본 DB 연결 타임아웃', clickable: true, modal: 'ifError' },
    { time: '2026-08-06 03:05:01', ifId: 'IF-003', type: '배치(재처리)', count: '980', result: '성공', resultKind: 'success', reason: '-', clickable: false },
  ];

  // ---- SCR-006 ----
  var scr006Rows = [
    { section: '차체', name: '차체 자동화 로드맵', period: '2026.01~2028.12', task: '용접 자동화', status: '진행중', statusKind: 'info', roadmapId: 'body' },
    { section: '조립', name: '조립 자동화 로드맵', period: '2026.03~2029.06', task: '코봇 도입', status: '승인대기', statusKind: 'warning', roadmapId: 'assembly' },
  ];
  var roadmapOptions = [
    { id: 'body', label: '차체 자동화 로드맵' },
    { id: 'assembly', label: '조립 자동화 로드맵' },
  ];

  // ---- SCR-007 (소속 로드맵별) ----
  var scr007Data = {
    body: [
      { name: '용접 로봇 도입', owner: '홍**', period: '2026.03~2026.09', status: '진행중', statusKind: 'info' },
      { name: '검사공정 자동화', owner: '김**', period: '2026.06~2027.02', status: '계획', statusKind: 'neutral' },
    ],
    assembly: [],
  };

  // ---- SCR-008 간트 ----
  var ganttQuarters = ['26.Q1', 'Q2', 'Q3', 'Q4', '27.Q1', 'Q2', 'Q3', 'Q4', '28.Q1', 'Q2', 'Q3', 'Q4'];
  var ganttRowsFull = [
    { label: '차체 자동화 로드맵', indent: 12, top: true, left: 0, width: 25, barClass: 'gantt-bar-progress-top', modal: 'ganttDetail' },
    { label: 'ㄴ 용접 로봇 도입', indent: 28, top: false, left: 2, width: 8, barClass: 'gantt-bar-progress-sub', modal: 'ganttDetail' },
    { label: 'ㄴ 검사공정 자동화', indent: 28, top: false, left: 4, width: 10, barClass: 'gantt-bar-progress-sub', modal: 'ganttDetail' },
    { label: '조립 자동화 로드맵', indent: 12, top: true, left: 8, width: 33, barClass: 'gantt-bar-pending-top', modal: 'ganttDetail' },
    { label: 'ㄴ 코봇 도입', indent: 28, top: false, left: 9, width: 12, barClass: 'gantt-bar-progress-sub', modal: 'ganttDetail' },
  ];

  // ---- SCR-009 ----
  var techPrCards = [
    { title: '용접 로봇 도입', section: '차체' },
    { title: '검사 AI 적용', section: '검사' },
    { title: '코봇 활용 사례', section: '조립' },
    { title: '배선 자동화', section: '배선' },
  ];

  // ---- SCR-010 ----
  var scr010Rows = [
    { title: '용접 로봇 도입', task: '용접 자동화', owner: '홍**', attachment: '동영상 1건', registered: '2026-07-01' },
  ];

  // ---- SCR-011 ----
  var scr011Rows = [
    { name: '26H1 협의체', section: '차체', agenda: '로드맵 리뷰', target: '이**', schedule: '2026-08-20', mailStatus: '발송완료', mailKind: 'success' },
  ];

  // ---- SCR-012 ----
  var scr012Rows = [
    { name: '차체 mTRM', section: '차체', status: '활성', statusKind: 'success', registered: '2026-01-05' },
  ];

  // ---- SCR-013 ----
  var taskPlanMapping = { roadmapName: '차체 자동화 로드맵', detailTask: '용접 로봇 도입', status: '매핑완료', statusKind: 'success' };

  // ---- SCR-014 ----
  var trendsData = [
    { title: '글로벌 자동화 트렌드 A', views: 120, date: '2026-07-01', dept: '기획팀', owner: '박**', tag: '#자동화' },
    { title: '신기술 소재 자료 B', views: 85, date: '2026-07-05', dept: '기획팀', owner: '이**', tag: '#신소재' },
    { title: '기술개발 제안 C', views: 42, date: '2026-07-10', dept: '기획팀', owner: '최**', tag: '#제안' },
    { title: '글로벌 자동화 트렌드 D', views: 200, date: '2026-07-14', dept: '기획팀', owner: '정**', tag: '#자동화' },
  ];

  // ---- 대시보드 KPI / 바로가기 ----
  var dashAutoKpis = [
    { label: '전체 자동화율', value: '65%', kind: 'success' },
    { label: '부품공정 자동화율', value: '65%', kind: '' },
    { label: '모듈공정 자동화율', value: '68%', kind: '' },
    { label: '등록 표준공정', value: '3건', kind: '' },
    { label: 'I/F 최근 실패', value: '1건', kind: 'danger' },
  ];
  var dashAutoLinks = [
    { label: '부품 공정 자동화 현황', desc: '공장/라인별 자동화 현황 조회', screenId: 'SCR-001' },
    { label: '표준공정 마스터 관리', desc: '표준공정 등록/관리', screenId: 'SCR-002' },
    { label: '모듈 공정 자동화 현황', desc: '모듈 공정 자동화 비교', screenId: 'SCR-003' },
    { label: '모듈 표준 작업명 관리', desc: '표준 작업명 등록/관리', screenId: 'SCR-004' },
    { label: 'I/F 실행결과 관리', desc: '배치 연동 실행 이력', screenId: 'SCR-005' },
  ];

  // 신규: 중장기 확대 전개 로드맵 (DASH-AUTO 대시보드 카드형 요약, 근거: Claude Design PNDES Portal Prototype.dc.html)
  var scr001Expansion = [
    { line: 'A공장 1라인', target: "'27년", pct: 80, status: '진행중' },
    { line: 'A공장 2라인', target: "'29년", pct: 45, status: '진행중' },
    { line: 'B공장 1라인', target: "'28년", pct: 30, status: '계획' },
    { line: '종합', target: "'30년", pct: 55, status: '진행중' },
  ];

  var dashMtrmKpis = [
    { label: '등록 로드맵', value: '2건', kind: '' },
    { label: '진행중 상세과제', value: '1건', kind: 'info' },
    { label: '예정 협의체', value: '1건', kind: '' },
    { label: 'Tech PR 자료', value: '4건', kind: '' },
    { label: '등록 기술동향', value: '4건', kind: '' },
  ];
  var dashMtrmLinks = [
    { label: '통합 로드맵 관리', desc: '분과별 통합 로드맵', screenId: 'SCR-006' },
    { label: '상세과제 로드맵 관리', desc: '로드맵별 상세과제', screenId: 'SCR-007' },
    { label: 'mTRM 통합 로드맵 대시보드', desc: '간트차트 조회', screenId: 'SCR-008' },
    { label: '생산기술 Tech PR', desc: '과제별 자료 그리드', screenId: 'SCR-009' },
    { label: 'Tech PR 관리자', desc: '자료 등록/관리', screenId: 'SCR-010' },
    { label: 'mTRM 협의체 관리', desc: '협의체 등록/메일발송', screenId: 'SCR-011' },
    { label: 'mTRM 관리', desc: 'mTRM 등록/관리', screenId: 'SCR-012' },
    { label: '기술과제 계획 등록', desc: 'mTRM 연동 영역', screenId: 'SCR-013' },
    { label: '기술동향', desc: '글로벌 트렌드/신기술', screenId: 'SCR-014' },
  ];

  // dashAutoRateBars/overallRate는 render.js에서 scr001SummaryCols/scr001SummaryRows(자동화율 행)로부터
  // 실시간 계산합니다 (SCR-001 요약현황과 DASH-AUTO 대시보드 간 데이터 정합성 유지, 5) 항목 가독성 고도화 반영).

  var roadmapProgress = [
    { name: '차체 자동화 로드맵', status: '진행중', statusKind: 'info', pct: 60 },
    { name: '조립 자동화 로드맵', status: '승인대기', statusKind: 'warning', pct: 25 },
  ];

  // ---- 등록/수정 모달 필드 정의 ----
  var MODALS = {
    registerProcess: { title: '공정 등록', confirm: '등록', size: 640, fields: [
      { label: '공정명', required: true, type: 'text' },
      { label: 'Best Practice 지정', required: false, type: 'select' },
      { label: '상태', required: true, type: 'select' },
      { label: '담당자', required: true, type: 'select' },
      { label: '첨부', required: false, type: 'file' },
    ] },
    emailShare: { title: '이메일 공유', confirm: '전송', size: 480, fields: [
      { label: '수신자', required: true, type: 'text' },
      { label: '메모', required: false, type: 'textarea' },
    ] },
    cellDetail: { title: 'Best Practice 상세', confirm: '닫기', size: 640, fields: [
      { label: '공정', type: 'plaintext', value: '용접' },
      { label: '내용', type: 'plaintext', value: '자동용접 적용 사례' },
      { label: '첨부 재생', type: 'file' },
    ] },
    stdProcessRegister: { title: '표준공정 등록', confirm: '등록', size: 480, fields: [
      { label: '공장', required: true, type: 'select' },
      { label: '라인', required: true, type: 'select' },
      { label: '표준공정명', required: true, type: 'text' },
      { label: '순서', required: true, type: 'text' },
    ] },
    stdTaskRegister: { title: '표준 작업명 등록', confirm: '등록', size: 480, fields: [
      { label: '작업명', required: true, type: 'text' },
      { label: '공정유형', required: true, type: 'select' },
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
    techPrInquiry: { title: '기술 문의/제안', confirm: '전송', size: 640, fields: [
      { label: '대상 소재', type: 'plaintext', value: '용접 로봇 도입' },
      { label: '문의/제안 내용', required: true, type: 'textarea' },
    ] },
    materialRegister: { title: '자료 등록', confirm: '등록', size: 800, fields: [
      { label: '제목', required: true, type: 'text' },
      { label: '과제', required: true, type: 'select' },
      { label: '담당자', required: true, type: 'select' },
      { label: '첨부', required: true, type: 'file' },
    ] },
    councilRegister: { title: '협의체 등록', confirm: '등록', size: 480, fields: [
      { label: '협의체명', required: true, type: 'text' },
      { label: '분과', required: true, type: 'select' },
      { label: '의제', required: false, type: 'text' },
      { label: '대상 분과장', required: true, type: 'select' },
      { label: '일정', required: true, type: 'date' },
    ] },
    ifError: { title: 'I/F 오류 로그', confirm: '닫기', size: 640, fields: [
      { label: '오류 내용', type: 'plaintext', value: '원본 DB 연결 타임아웃 (Connection timeout after 30000ms)' },
    ] },
  };

  global.PNDES = global.PNDES || {};
  global.PNDES.SCREENS = SCREENS;
  global.PNDES.NAV = NAV;
  global.PNDES.FEATURE_FLAGS = FEATURE_FLAGS;
  global.PNDES.FLOW_KIND = FLOW_KIND;
  global.PNDES.FLOW_AUTO_IDS = FLOW_AUTO_IDS;
  global.PNDES.FLOW_MTRM_IDS = FLOW_MTRM_IDS;
  global.PNDES.data = {
    scr001Filters: scr001Filters, scr001SummaryCols: scr001SummaryCols, scr001SummaryRows: scr001SummaryRows,
    scr001ProcessDetail: scr001ProcessDetail,
    scr003Filters: scr003Filters, scr003LineCols: scr003LineCols, scr003SummaryRows: scr003SummaryRows,
    scr003ProcessDetail: scr003ProcessDetail, scr003Warning: scr003Warning, scr003LastSync: scr003LastSync,
    scr002Rows: scr002Rows,
    scr004Rows: scr004Rows,
    scr005Rows: scr005Rows,
    scr006Rows: scr006Rows, roadmapOptions: roadmapOptions,
    scr007Data: scr007Data,
    ganttQuarters: ganttQuarters, ganttRowsFull: ganttRowsFull,
    techPrCards: techPrCards,
    scr010Rows: scr010Rows,
    scr011Rows: scr011Rows,
    scr012Rows: scr012Rows,
    taskPlanMapping: taskPlanMapping,
    trendsData: trendsData,
    dashAutoKpis: dashAutoKpis, dashAutoLinks: dashAutoLinks, scr001Expansion: scr001Expansion,
    dashMtrmKpis: dashMtrmKpis, dashMtrmLinks: dashMtrmLinks,
    roadmapProgress: roadmapProgress,
  };
  global.PNDES.MODALS = MODALS;
})(window);
