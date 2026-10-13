/*
 * SCR-014 기술동향 mock 데이터
 * 근거: design-import/생기포털 v3.dc.html isTechTrend 블록
 *       (techTrendList, 유형 배지 kinds, tagList/techTrendDetailTags, ttImages/ttFiles/ttTags, TT_MAIL_*).
 * 주의: design-import/README.md "15. 기술동향"은 이전 버전 화면(제목 검색 + 5열 카드 그리드 + 단순 등록 폼)을
 *       설명하고 있어 v3.dc.html 실제 화면과 다르다. README가 "최신 기준 소스"로 지정한 v3.dc.html을 따른다.
 * 실 연동 시 기술동향 목록/상세 조회, 첨부 업로드, 알림메일 발송 API로 교체됩니다.
 */
(function (global) {
  'use strict';

  // 유형 배지 (v3 kinds — 색상은 violet-500 / green-600 / amber-500)
  var kinds = [
    { label: '전시회/학회', color: '#8B5CF6' },
    { label: '동향보고서', color: '#16A34A' },
    { label: '기술자료', color: '#F59E0B' },
  ];
  var yearOptions = ['2026', '2025'];
  var scopeOptions = ['제목/내용', '제목', '내용'];

  // v3는 유형을 목록 순번(idx % 3)으로, 제목 앞 분기 표기를 '2026 1분기' 고정으로 표시한다. 여기서는 행 데이터로 둔다.
  var rows = [
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
  rows.forEach(function (r, i) {
    r.kind = kinds[i % kinds.length].label;
    r.period = '2026 1분기';
  });

  var listTags = ['#AI', '#비전', '#AMR', '#DED', '#로봇', '#ESGESGESG'];
  var detailTags = ['#AI', '#비전', '#AMR', '#DED', '#로봇', '#ESGESGESG', '#AI'];

  // ---- 등록 팝업 ----
  var registrant = { dept: '자동화기술팀', owner: '김의왕 매니저' };
  var imageMax = 10;
  var defaultImages = ['기술동향_이미지_01.png', '기술동향_이미지_02.png'];
  var defaultFiles = [['기술동향_보고서.pdf', 2.4], ['기술비교_자료.pptx', 8.1]];
  // "파일선택" 클릭 시 순서대로 추가되는 샘플 첨부 [파일명, MB]
  var fileSamples = [['기술동향_보고서.pdf', 2.4], ['기술비교_자료.pptx', 8.1], ['시험결과_데이터.xlsx', 0.6], ['참고문헌.zip', 15.3]];
  var defaultTags = ['#AI', '#비전', '#AMR', '#DED', '#로봇', '#ESG'];
  var mailRecipients = ['자동화기술팀', '요소기술팀', '지능화기술팀'];
  var mailSubject = '[생기포털] 신규 기술동향이 등록되었습니다.';
  var mailBody = '안녕하세요.\n생기포털 기술동향 게시판에 새로운 자료가 등록되어 안내드립니다.\n\n· 등록자 : 자동화기술팀 / 김의왕 매니저\n· 등록일 : 2026.09.30\n\n자세한 내용은 생기포털 > 생산기술 Tech PR > 기술동향 메뉴에서 확인하실 수 있습니다.\n감사합니다.';
  var mailBodyMax = 1000;
  var mailDate = '2026.09.30';

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr014 = {
    kinds: kinds, yearOptions: yearOptions, scopeOptions: scopeOptions, rows: rows,
    listTags: listTags, detailTags: detailTags,
    registrant: registrant, imageMax: imageMax, defaultImages: defaultImages,
    defaultFiles: defaultFiles, fileSamples: fileSamples, defaultTags: defaultTags,
    mailRecipients: mailRecipients, mailSubject: mailSubject, mailBody: mailBody, mailBodyMax: mailBodyMax, mailDate: mailDate,
  };
})(window);
