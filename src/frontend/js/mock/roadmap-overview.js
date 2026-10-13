/*
 * SCR-006 mTRM(통합로드맵) 간트차트 mock 데이터
 * 근거: design-import/README.md "7. mTRM (통합로드맵)", design-import/생기포털 v3.dc.html RM_YEARS/RM_QUARTERS/RM_LANES.
 * 좌표계: start/span은 분기 인덱스(1~16 = '25~'28년 x 4분기)를 1-based로 가리킨다.
 * bar.kind: 'roadmap'(mTRM 로드맵, 청록 pill) | 'task'(상세과제, 얇은 색 바).
 * bar.prev: 이전 버전(Ver.0)의 start/span — 있으면 "변경된 바"로 취급(점선 외곽선 + 버전 비교 팝업 대상).
 * bar.milestones: 이미 지난 완료 단계(P1~P4, 초록 마름모). bar.trail: 바 끝에 이어지는 예정 단계(흰 마름모).
 * bar.linkFrom / linkFromNode: 다른 바에서 이 바로 이어지는 SVG 화살표 연결(연관 로드맵 표시).
 * 실 연동 시 mTRM 로드맵/상세과제 조회 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var RM_YEARS = ["'25년", "'26년", "'27년", "'28년"];
  var RM_QUARTERS = ['1Q', '2Q', '3Q', '4Q'];

  var RM_LANES = [
    {
      label: '물류',
      bars: [
        { kind: 'roadmap', label: '로드맵 제목 01', start: 2, span: 5, mtrm: '물류 mTRM', status: '확정', owner: '정물류 책임',
          tasks: [['AGV 경로 최적화', 'P4', '완료', 2, 4, '정*류'], ['자동창고 입출고 연동', 'P3', '확정', 3, 4, '김*수']] },
        { kind: 'roadmap', label: '로드맵 제목02', start: 8, span: 5, prev: { start: 9, span: 4 }, mtrm: '물류 mTRM → 신규 mTRM', status: '진행중', owner: '정물류 책임',
          tasks: [
            ['무인지게차 자율주행 경로 최적화', 'P2', '결재중', 8, 3, '정*류'],
            ['AMR 부품 공급 자동화', 'P1', '작성중', 9, 4, '박*호'],
            ['라인사이드 공급 무인화', 'P2', '확정', 8, 4, '이*영'],
            ['물류 관제 시스템 통합', 'P3', '확정', 10, 3, '김*수'],
            ['팔레트 자동 인식 비전', 'P1', '반려', 11, 2, '최*훈'],
          ] },
      ],
    },
    {
      label: '차체',
      bars: [
        { kind: 'task', label: '상세과제명#', start: 2, span: 7, color: '#22a559' },
        { kind: 'task', label: '상세과제명#', start: 3, span: 6, color: '#22a559' },
      ],
    },
    {
      label: '지게차',
      bars: [
        { kind: 'task', label: '상세과제명#', start: 3, span: 4, color: '#22a559', milestones: ['P1', 'P2'], trail: { span: 3, marks: ['P3', 'P4'] }, linkFromNode: '1-1' },
      ],
    },
    {
      label: '#A',
      bars: [
        { kind: 'task', label: '상세과제명#', start: 2, span: 7, prev: { span: 6 }, color: '#e8a33d', trail: { span: 2, marks: ['P3', 'P4'] } },
      ],
    },
    {
      label: '#B',
      bars: [
        { kind: 'roadmap', label: '로드맵 제목03', start: 9, span: 5, prev: { start: 10, span: 5 }, mtrm: '#B mTRM', status: '계획', owner: '이*영 책임',
          tasks: [['협동로봇 셀 표준화', 'P1', '작성중', 9, 3, '이*영'], ['비전 검사 AI 모델', 'P2', '확정', 10, 4, '김*수'], ['로봇 티칭 자동화', 'P1', '결재중', 11, 3, '박*호']] },
        { kind: 'roadmap', label: '로드맵 제목05', start: 11, span: 5, linkFrom: true, mtrm: '#B mTRM', status: '계획', owner: '이*영 책임',
          tasks: [['로봇 셀 확대 적용', 'P1', '작성중', 12, 4, '최*훈']] },
      ],
    },
    {
      label: '도장',
      bars: [
        { kind: 'roadmap', label: '도장 로봇 증설 로드맵', start: 3, span: 7, mtrm: '도장 mTRM', status: '진행중', owner: '이도장 책임',
          tasks: [['도장 부스 개선', 'P3', '확정', 3, 4, '이*장'], ['실러 도포 자동화', 'P2', '결재중', 5, 4, '박*호']] },
        { kind: 'task', label: '도장 품질 비전검사', start: 6, span: 5, color: '#22a559' },
      ],
    },
    {
      label: '조립',
      bars: [
        { kind: 'task', label: '코봇 체결 자동화', start: 4, span: 6, color: '#22a559', milestones: ['P1'], trail: { span: 2, marks: ['P3', 'P4'] } },
        { kind: 'task', label: '너트런너 다축화', start: 7, span: 5, color: '#e8a33d' },
      ],
    },
    {
      label: '검사',
      bars: [
        { kind: 'roadmap', label: 'AI 외관검사 로드맵', start: 6, span: 8, mtrm: '검사 mTRM → AI mTRM', status: '계획', owner: '김검사 책임',
          tasks: [['외관 불량 판정 AI 모델', 'P2', '확정', 6, 4, '김*수'], ['검사 데이터 수집 체계', 'P1', '작성중', 7, 3, '최*훈'], ['검사기 라인 적용', 'P1', '작성중', 10, 4, '이*영']] },
      ],
    },
    {
      label: '엔진',
      bars: [
        { kind: 'task', label: '조립셀 무인화 1차', start: 9, span: 4, color: '#22a559', milestones: ['P1', 'P2'] },
        { kind: 'roadmap', label: '엔진 자동화 로드맵', start: 10, span: 6, mtrm: '엔진 mTRM', status: '계획', owner: '최엔진 수석',
          tasks: [['조립셀 무인화 2차', 'P1', '작성중', 12, 4, '최*진']] },
      ],
    },
    {
      label: '에너지',
      bars: [
        { kind: 'task', label: '에너지 사용량 모니터링', start: 2, span: 6, color: '#e8a33d', trail: { span: 3, marks: ['P3', 'P4'] } },
      ],
    },
    {
      label: '#C',
      bars: [
        { kind: 'roadmap', label: '로드맵 제목06', start: 5, span: 6, mtrm: '#C mTRM', status: '진행중', owner: '정*호 책임',
          tasks: [['스마트 공구 관리', 'P2', '확정', 5, 3, '정*호'], ['작업자 보조 웨어러블', 'P1', '결재중', 7, 4, '박*호']] },
      ],
    },
  ];

  // README 하단 "과제 진행 단계" 가이드
  var RM_PHASE_GUIDE = [
    { p: 'P1', title: '기술과제 계획 등록', desc: '계획 단계' },
    { p: 'P2', title: '기술과제 실적(계획) 등록', desc: '심의회 이후 등록 · 승인' },
    { p: 'P3', title: '기술과제 실적(완료) 등록', desc: '완료 심의회 단계' },
    { p: 'P4', title: '양산 적용 완료', desc: '완료 심의회 이후 등록 · 승인' },
  ];

  // 상세과제 상세 팝업 "현재 변경 이력" — 모든 과제 공통 고정 mock(v3.dc.html subTaskChangeRows)
  var RM_TASK_CHANGE_ROWS = [
    { label: '분과 및 담당자 변경', before: '차체 / 박생기 수석', after: '차체 / 김의왕 매니저', date: '2026.08.12' },
    { label: 'mTRM 변경 (A→B)', before: '차체 mTRM', after: '조립 mTRM', date: '2026.09.01' },
    { label: '일정변경', before: 'P1 26.2Q ~ P4 27.3Q', after: 'P1 26.3Q ~ P4 28.1Q', date: '2026.09.18' },
  ];

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.roadmapOverview = {
    years: RM_YEARS,
    quarters: RM_QUARTERS,
    lanes: RM_LANES,
    phaseGuide: RM_PHASE_GUIDE,
    taskChangeRows: RM_TASK_CHANGE_ROWS,
  };
})(window);
