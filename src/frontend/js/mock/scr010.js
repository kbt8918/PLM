/*
 * SCR-010 생산기술 Tech PR 관리자 mock 데이터
 * 근거: design-import/생기포털 v3.dc.html isTechPrAdmin 블록(tpaRows/tpaTagRows/TPA_TASK_DB/tpaMedia/tagSuggest).
 * 주의: design-import/README.md "11. 생산기술 Tech PR 관리자"는 이전 버전 화면(제목/과제/담당자 필터 + 자료 목록)을
 * 설명하고 있어 v3.dc.html 실제 화면과 다르다. README가 "최신 기준 소스"로 지정한 v3.dc.html을 따른다.
 * 실 연동 시 Tech PR 등록 목록 / 기술태그 마스터 / 과제 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var filterOptions = {
    div: ['전체', 'AI', '물류/관제', '적층', '로봇'],
    bu: ['전체', '전동화 BU', '전장 BU', '램프 BU', '샤시 BU'],
    factory: ['전체', '울산 전동화', 'MNAe', 'MTJ'],
    tag: ['전체', '#AI', '#비전', '#AMR', '#DED', '#로봇'],
  };

  // "Tech PR 등록" 표
  var rows = [
    { no: '', dept: 'AI', bu: '전동화 BU', factory: '울산 전동화', tags: ['#AI', '#비전'], name: '', prio: '' },
    { no: '-', dept: '물류/관제', bu: '전동화 BU', factory: 'MNAe', tags: ['#AMR'], name: '', prio: '' },
    { no: '-', dept: '적층', bu: '전장 BU', factory: 'MTJ', tags: ['#DED'], name: '', prio: '' },
    { no: '-', dept: '로봇', bu: '램프 BU', factory: '-', tags: ['#로봇'], name: '', prio: '' },
    { no: '-', dept: '로봇', bu: '샤시 BU', factory: '-', tags: ['#AI', '#ESG'], name: '', prio: '' },
  ];

  // "기술태그 Master Table"
  var tagRows = [
    { tags: ['#AI', '#ESG'], regDate: '2026.09.09', modDate: '2026.09.09' },
    { tags: ['#물류', '#ESG'], regDate: '', modDate: '' },
    { tags: ['#로보틱스', '#ESG'], regDate: '', modDate: '' },
    { tags: ['#로보틱스', '#무인지게차'], regDate: '', modDate: '' },
  ];
  var tagSuggest = ['#AI', '#비전', '#AMR', '#DED', '#로봇', '#ESG', '#물류', '#로보틱스', '#무인지게차'];

  // 신규등록 팝업: 연관 과제 선택 시 분과/연계 mTRM/적용공장/담당이 자동 입력된다
  var taskDb = {
    '용접 자동화': { reg: '2026.03.02', dept: '차체', mtrm: '차체 mTRM', factory: '울산 전동화공장', owner: '자동화기술팀 / 김의왕 매니저', status: '진행중', period: 'P1 26.1Q ~ P4 27.2Q' },
    '검사 자동화': { reg: '2026.04.15', dept: '품질', mtrm: '검사 mTRM', factory: '울산 전동화공장', owner: '품질기술팀 / 박생기 수석', status: '확정', period: 'P1 26.2Q ~ P4 27.4Q' },
    '물류 무인화': { reg: '2026.05.20', dept: '물류', mtrm: '물류 mTRM', factory: '창원 2공장', owner: '물류기술팀 / 정물류 책임', status: '작성중', period: 'P1 26.3Q ~ P4 28.1Q' },
    '도장 로봇 증설': { reg: '2026.06.11', dept: '도장', mtrm: '도장 mTRM', factory: '창원 2공장', owner: '도장기술팀 / 이도장 책임', status: '결제중', period: 'P1 26.4Q ~ P4 28.2Q' },
  };
  var defaultOwner = '자동화기술팀 / 김의왕 매니저';

  // 신규등록 팝업 초기값(v3 state.tpaTasks / tpaMedia / tpaHashTags)
  var defaultTasks = ['용접 자동화', '검사 자동화', '물류 무인화'];
  var mediaSamples = ['무인지게차_주행영상.mp4', '무인지게차_적재영상.mp4', '라인적용_현장영상.mp4'];
  var defaultHashTags = ['#AI', '#비전', '#AMR', '#DED', '#로봇', '#ESGESGESG'];

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr010 = {
    filterOptions: filterOptions, rows: rows, tagRows: tagRows, tagSuggest: tagSuggest,
    taskDb: taskDb, defaultOwner: defaultOwner,
    defaultTasks: defaultTasks, mediaSamples: mediaSamples, defaultHashTags: defaultHashTags,
  };
})(window);
