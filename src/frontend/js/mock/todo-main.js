/*
 * 메인화면(My Job / todo-main) mock 데이터
 * 근거: design-import/README.md "0. 메인화면 (My Job / todo-main)", design-import/생기포털 v3.dc.html render() 중
 * TO DO LIST / 금주 내 업무 / 내 업무 / Q&A / 공지사항 블록.
 * 실 연동 시 전자결재(TO DO)/업무지연 집계/공지사항 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var todoCards = [
    { label: '결재함', value: 14, icon: 'fa-regular fa-file' },
    { label: '기안함', value: 30, icon: 'fa-regular fa-paper-plane' },
    { label: '반송함', value: 0, icon: 'fas fa-arrow-rotate-left' },
  ];

  var todoScopeOptions = ['개인', '팀', '실'];
  var todoScopeMult = { '개인': 1, '팀': 4, '실': 11 };

  var todoMyRowsBase = [
    { label: '금일', start: 0, end: 0 },
    { label: 'W', start: 0, end: 0 },
    { label: 'W+1', start: 1, end: 0 },
    { label: 'W+2', start: 0, end: 1 },
  ];

  var todoDelayTechBase = 1;

  var weekAllBase = [
    { label: '이벤트', prog: 0, delay: 0 },
    { label: '기술과제', prog: 0, delay: 1 },
    { label: '수익성개선', prog: 0, delay: 0 },
    { label: '프로젝트', prog: 3, delay: 0 },
    { label: '생기표준', prog: 2, delay: 1 },
    { label: '파이로트', prog: 4, delay: 2 },
    { label: '조공서', prog: 1, delay: 0 },
  ];

  var qaRowsByTab = {
    qa: [
      { no: 'SR2605-15911', title: '프로젝트 이벤트 삭제 요청', date: '2026-05-28', state: '종료' },
      { no: 'SR2601-07025', title: '전체 공장 대상 전라인/공정별 인원 정보 확인 요청', date: '2026-01-09', state: '종료' },
      { no: 'SR2601-06931', title: '부품공정배치 PLM 품번 조회 안되는 현상', date: '2026-01-09', state: '종료' },
    ],
    faq: [
      { no: 'FAQ-012', title: '공정배치 등록 후 결재 요청 방법', date: '2025-11-02', state: '-' },
      { no: 'FAQ-009', title: '차종연식 신규 추가 요청 절차', date: '2025-08-14', state: '-' },
      { no: 'FAQ-004', title: '엑셀 업로드 양식 오류 해결', date: '2025-03-20', state: '-' },
    ],
  };

  var noticeRows = [
    { title: '생산기술포털_사용자교육자료_통합_20210723', date: '2020.12.21' },
    { title: '조공서 장착도면 및 결재 이력 자동입력 개선 공지', date: '2019.05.15' },
    { title: '생기모듈공정배치 편성표를 표기 개선 공지', date: '2019.05.15' },
  ];

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.todoMain = {
    todoCards: todoCards,
    todoScopeOptions: todoScopeOptions,
    todoScopeMult: todoScopeMult,
    todoMyRowsBase: todoMyRowsBase,
    todoDelayTechBase: todoDelayTechBase,
    weekAllBase: weekAllBase,
    qaRowsByTab: qaRowsByTab,
    noticeRows: noticeRows,
  };
})(window);
