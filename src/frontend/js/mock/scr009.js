/*
 * SCR-009 생산기술 Tech PR mock 데이터
 * 근거: design-import/README.md "10. 생산기술 Tech PR", design-import/생기포털 v3.dc.html TP_GROUPS/TP_TAGS/TECH_PR_ITEMS.
 * groups: 화면 목록(분과 > 적용공장 패널 > 카드). 카드 kind는 'video'(재생 아이콘) | 'image'.
 * detailItems: 카드 클릭 시 열리는 상세 자료 15건. v3와 동일하게 카드 위치 (분과+공장+카드 인덱스) % 15 로 순환 참조한다.
 * 실 연동 시 Tech PR 목록/상세 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var tags = ['#AI', '#비전', '#AMR', '#OED', '#로봇'];

  var filterOptions = {
    div: ['전체', '물류', 'D/T', '차체', '조립'],
    bu: ['전체', '전동화', '내연기관'],
    factory: ['전체', '울산 전동화공장', '창원 2공장'],
    tag: ['전체', '#AI', '#비전', '#AMR', '#OED', '#로봇'],
  };

  var LONG_TITLE = '기술명 : 무인지게차 무인지게차 무인지게차 무인...';
  function card(kind, title, place, period, badges) {
    return { kind: kind, title: title, place: '적용처 : ' + place, period: '개발기간 : ' + period, badges: badges };
  }
  var groups = [
    { category: '물류', factories: [
      { name: '울산 전동화공장', cards: [
        card('image', LONG_TITLE, '울산 85A 화공장', '26.3~28.3', ['동영상', '기술자료', '연관과제']),
        card('video', LONG_TITLE, '울산 85A 화공장', '26.3~28.3', ['동영상', '기술자료']),
        card('image', LONG_TITLE, '울산 85A 화공장', '26.3~28.3', ['동영상', '기술자료']),
      ] },
    ] },
    { category: 'D/T', factories: [
      { name: '울산 전동화공장', cards: [
        card('image', LONG_TITLE, '울산 85A 화공장', '26.3~28.3', ['동영상', '기술자료', '연관과제']),
        card('video', LONG_TITLE, '울산 85A 화공장', '26.3~28.3', ['동영상', '기술자료']),
        card('image', LONG_TITLE, '울산 85A 화공장', '26.3~28.3', ['동영상', '기술자료']),
        card('image', LONG_TITLE, '울산 85A 화공장', '26.3~28.3', ['동영상', '기술자료']),
        card('video', '기술명 : 협동로봇 체결 자동화', '울산 85A 화공장', '26.1~27.6', ['동영상', '기술자료']),
        card('image', '기술명 : 비전 기반 외관검사', '울산 85A 화공장', '26.4~27.9', ['기술자료', '연관과제']),
        card('image', '기술명 : AMR 부품 공급', '울산 85A 화공장', '26.6~28.1', ['동영상', '기술자료']),
        card('video', '기술명 : 하네스 자동 결선', '울산 85A 화공장', '27.1~28.6', ['동영상']),
      ] },
    ] },
    { category: '차체', factories: [
      { name: '아산 차체공장', cards: [
        card('video', '기술명 : 루프 레이저 브레이징 자동화', '아산 차체 2라인', '26.2~27.8', ['동영상', '기술자료', '연관과제']),
        card('image', '기술명 : 실러 도포 비전 검사', '아산 차체 1라인', '26.5~27.12', ['기술자료']),
        card('image', '기술명 : 스폿 용접 품질 AI 판정', '아산 차체 2라인', '27.1~28.3', ['동영상', '기술자료']),
      ] },
      { name: '전주 상용차공장', cards: [
        card('image', '기술명 : 프레임 리벳팅 로봇셀', '전주 상용 1라인', '26.4~27.10', ['기술자료', '연관과제']),
        card('video', '기술명 : AGV 차체 반송', '전주 상용 2라인', '26.7~28.2', ['동영상']),
      ] },
    ] },
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
    video: { label: '동영상', color: '#1D4ED8', bg: '#DBEAFE' },
    file: { label: '파일', color: '#B45309', bg: '#FDEEDC' },
    text: { label: '텍스트', color: '#157A3D', bg: '#EAF7EE' },
    multi: { label: '복합자료', color: '#6B46C1', bg: '#F1EAFB' },
  };

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr009 = {
    tags: tags, filterOptions: filterOptions, groups: groups,
    detailItems: techPrCards, typeInfo: TECH_PR_TYPE,
  };
})(window);
