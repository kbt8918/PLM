/*
 * PNDES 신규 메뉴 — 화면 메타 / 내비게이션 구조 (정적 설정, mock 데이터 아님)
 * 근거: design-import/README.md "상단 메뉴 구조 (GNB)" / "Screens / Views".
 * mock 데이터(목록/카드/필터 옵션 등)는 js/mock/*.js로 분리되어 있습니다.
 */
(function (global) {
  'use strict';

  var SCREENS = {
    'SCR-001': { group: '공정 자동화 현황', name: '부품 공정 자동화 현황', admin: false },
    'SCR-002': { group: '공정 자동화 현황', name: '표준공정 마스터 관리', admin: true },
    'SCR-003': { group: '공정 자동화 현황', name: '모듈 공정 자동화 현황', admin: false },
    'SCR-004': { group: '공정 자동화 현황', name: '모듈 표준 작업명 관리', admin: true },
    'SCR-005': { group: '공정 자동화 현황', name: 'I/F 실행결과 관리', admin: true },
    'SCR-006': { group: '중장기 방향성 공유', name: 'mTRM (통합로드맵)', admin: false },
    'SCR-007': { group: '중장기 방향성 공유', name: '상세과제 로드맵 관리', admin: false },
    'SCR-009': { group: '중장기 방향성 공유', name: '생산기술 Tech PR', admin: false },
    'SCR-010': { group: '중장기 방향성 공유', name: '생산기술 Tech PR 관리자', admin: true },
    'SCR-011': { group: '중장기 방향성 공유', name: 'mTRM 협의체', admin: true },
    'SCR-012': { group: '중장기 방향성 공유', name: 'mTRM 관리', admin: true },
    'SCR-013': { group: '중장기 방향성 공유', name: '기술과제 관리', admin: true },
    'SCR-014': { group: '중장기 방향성 공유', name: '기술동향', admin: false },
    'MTRM-MAIN': { group: '중장기 방향성 공유', name: '메인 대시보드', admin: false },
    // README 0~16번 목록에는 없으나 v3.dc.html GNB "공법 관리 > 부품/모듈공정배치"에서 연결되는 신규 화면.
    'bp-gk': { group: '공법 관리', name: '생기부품공정배치 관리', admin: false },
    'bp-sc': { group: '공법 관리', name: '생산부품공정배치 관리', admin: false },
    'mp-gk': { group: '공법 관리', name: '생기모듈공정배치 관리', admin: false },
    'mp-sc': { group: '공법 관리', name: '생산모듈공정배치 관리', admin: false },
  };

  // ---- GNB (상단 메가메뉴) ----
  // 근거: design-import/README.md "상단 메뉴 구조 (GNB)" 트리를 그대로 반영.
  // `*` 표시 항목만 view id를 연결(클릭 시 이동), 나머지는 view를 비워 "준비중" 토스트로 처리.
  // it = [label, view?, admin?, sub?] — admin: 1이면 (A) 표시, sub: 1이면 "ㄴ" 하위 항목(들여쓰기) 표시.
  var GNB_MENUS = [
    { id: 'myjob', label: 'My Job', landing: 'todo-main' },
    { id: 'equip', label: '설비 통합 관리' },
    { id: 'base', label: '기준정보' },
    {
      id: 'method', label: '공법 관리', tabs: ['조립공법시스템', 'DEPS', 'DEPS 설계'],
      cols: [
        { title: '엔드아이템', items: [['생기엔드아이템 관리'], ['생기조공서연계 관리'], ['생산조공서연계 관리'], ['생산엔드아이템 관리']] },
        { title: '조공서', items: [['생기조공서 작성 관리'], ['생기조공서 조회'], ['생산조공서 작성 관리'], ['생산조공서 조회'], ['공법편찬조회'], ['생기조공서 부차대 관리']] },
        { title: '모듈공정배치', items: [['생기모듈공정배치 관리', 'mp-gk'], ['생산모듈공정배치 조회'], ['생산모듈공정배치 관리', 'mp-sc'], ['생기모듈공정배치 조회'], ['모듈 공정별 현황비교', 'SCR-003']] },
        { title: '부품공정배치', items: [['생기부품공정배치 관리', 'bp-gk'], ['생산부품공정배치 조회'], ['생산부품공정배치 관리', 'bp-sc'], ['생기부품공정배치 조회'], ['공정배치 산출율 조회'], ['부품 공정별 현황비교', 'SCR-001']] },
        { title: '조공서 현황', items: [['완공장 조공서 현황']] },
        { title: '모델 현황', items: [['편성표 종합 현황'], ['편성표 상세 현황'], ['월별 편성표율']] },
        { title: '부품 현황', items: [['CT 종합 현황'], ['CT 상세 현황(라인)'], ['CT 상세 현황(인원별)']] },
      ],
    },
    { id: 'kpi', label: '업무지표현황' },
    { id: 'std', label: '생기표준' },
    { id: 'proj', label: '프로젝트' },
    { id: 'pilot', label: '파이로트' },
    { id: 'datamap', label: '데이터맵' },
    {
      id: 'mtrm', label: 'mTRM',
      cols: [
        {
          title: '로드맵', items: [
            ['생산기술 Tech PR', 'SCR-009', 0, 0],
            ['생산기술 Tech PR 관리자', 'SCR-010', 1, 1],
            ['mTRM (통합로드맵)', 'SCR-006', 0, 0],
            ['mTRM 협의체', 'SCR-011', 1, 1],
            ['mTRM 관리', 'SCR-012', 1, 1],
          ],
        },
        { title: '기술공유', items: [['기술동향', 'SCR-014']] },
      ],
    },
    {
      id: 'admin', label: '관리자',
      cols: [{ title: '공법기본관리', items: [['표준공정', 'SCR-002', 1], ['모듈 표준 작업명 관리', 'SCR-004', 1]] }],
    },
  ];
  // view id -> 소유 GNB 메뉴 id (브레드크럼/활성 탭 판별용)
  var GNB_VIEW_OWNER = { 'todo-main': 'myjob' };
  GNB_MENUS.forEach(function (m) {
    (m.cols || []).forEach(function (c) {
      c.items.forEach(function (it) { if (it[1]) GNB_VIEW_OWNER[it[1]] = m.id; });
    });
  });
  // 홈 화면 좌측 "빠른 메뉴" 9개 아이콘 (GNB 1차 메뉴와 동일 id로 연결)
  var QUICK_MENUS = [
    ['equip', '설비 통합 관리', 'fas fa-desktop'], ['base', '기준정보', 'fas fa-database'], ['method', '공법 관리', 'fas fa-gear'],
    ['kpi', '업무지표현황', 'fas fa-chart-simple'], ['std', '생기표준', 'fa-regular fa-file-lines'], ['proj', '프로젝트', 'fa-regular fa-window-maximize'],
    ['pilot', '파이로트', 'fa-regular fa-paper-plane'], ['datamap', '데이터맵', 'fas fa-diagram-project'], ['admin', '관리자', 'fas fa-shield-halved'],
  ];

  global.PNDES = global.PNDES || {};
  global.PNDES.SCREENS = SCREENS;
  global.PNDES.GNB_MENUS = GNB_MENUS;
  global.PNDES.GNB_VIEW_OWNER = GNB_VIEW_OWNER;
  global.PNDES.QUICK_MENUS = QUICK_MENUS;
})(window);
