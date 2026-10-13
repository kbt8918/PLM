/*
 * SCR-011 mTRM 협의체 mock 데이터
 * 근거: design-import/생기포털 v3.dc.html isMtrmCouncil 블록(councilRows/councilDetailRows/councilRegRows/CM_*).
 * 주의 1: design-import/README.md "12. mTRM 협의체"는 이전 버전 화면(협의체명/분과/의제 필터 + 메일상태 목록)을
 *         설명하고 있어 v3.dc.html 실제 화면과 다르다. README가 "최신 기준 소스"로 지정한 v3.dc.html을 따른다.
 * 주의 2: v3의 이력 표 데이터는 자리표시(회의번호 '123456789' 13행, 나머지 칸 공백)뿐이라 진행상태 필터나
 *         상세현황을 확인할 수 없다. 아래 rows 13건은 화면 확인용으로 채운 임시 데이터이며 v3에서 옮긴 값이 아니다.
 * 실 연동 시 협의회 이력/상세 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var deptOptions = ['AI', '물류', '로봇'];
  var statusOptions = ['예약', '완료'];

  var rows = (function () {
    var list = [
      { no: 'MC-2026-013', dept: 'AI', regDate: '2026-10-08', planDate: '2026-11-20', doneDate: '', status: '예약' },
      { no: 'MC-2026-012', dept: '물류', regDate: '2026-10-02', planDate: '2026-11-06', doneDate: '', status: '예약' },
      { no: 'MC-2026-011', dept: '로봇', regDate: '2026-09-25', planDate: '2026-10-23', doneDate: '', status: '예약' },
    ];
    for (var i = 10; i >= 1; i--) {
      var month = String(Math.max(1, Math.ceil(i * 0.9))).padStart(2, '0');
      list.push({
        no: 'MC-2026-' + String(i).padStart(3, '0'),
        dept: deptOptions[i % deptOptions.length],
        regDate: '2026-' + month + '-03',
        planDate: '2026-' + month + '-15',
        doneDate: '2026-' + month + '-15',
        status: '완료',
      });
    }
    list.forEach(function (r) {
      r.title = "'26년 " + Number(r.no.slice(-3)) + '차 mTRM 협의회 (' + r.dept + ' 분과)';
    });
    return list;
  })();

  // 상세현황 팝업의 안건/의견 표 (v3 councilDetailRows — 빈 칸은 입력창으로 표시)
  var detailRows = [
    { agenda: '', opinion: '' },
    { agenda: '안건 1', opinion: '의견 #1' },
    { agenda: '', opinion: '결정사항1' },
    { agenda: '', opinion: '향후 협의체 예정일' },
  ];
  var detailRegistrant = '홍길동 책임연구원';

  // 신규등록 팝업 초기값 (v3 councilRegRows / CM_SUBJECT / CM_BODY / CM_RECIPIENTS)
  var registrant = '자동화기술팀 / 김의왕 매니저';
  var defaultAgendas = [{ agenda: '사전안건#1', note: '' }, { agenda: '사전안건#2', note: '' }, { agenda: '', note: '' }];
  var mailSubject = '[생기포털] mTRM 협의체 회의 안내';
  var mailBody = '안녕하세요.\nmTRM 협의체 회의 일정과 사전안건을 아래와 같이 안내드립니다.\n\n회의 전 첨부된 자료를 검토해 주시고, 추가 안건이 있으시면 회신 부탁드립니다.\n\n· 등록자 : 자동화기술팀 / 김의왕 매니저\n\n감사합니다.';
  var mailRecipients = ['자동화기술팀', '요소기술팀', '지능화기술팀'];
  var mailBodyMax = 1000;

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr011 = {
    deptOptions: deptOptions, statusOptions: statusOptions, rows: rows,
    detailRows: detailRows, detailRegistrant: detailRegistrant,
    registrant: registrant, defaultAgendas: defaultAgendas,
    mailSubject: mailSubject, mailBody: mailBody, mailRecipients: mailRecipients, mailBodyMax: mailBodyMax,
  };
})(window);
