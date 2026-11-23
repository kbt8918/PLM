/*
 * SCR-006 mTRM(통합로드맵) 간트차트 mock 데이터
 * 근거: design-import/생기포털 v3.dc.html RM_YEARS/RM_QUARTERS/RM_LANES (2026-11-24 갱신본, 데이터 원문 그대로 이식).
 * 축: 2025-01 ~ 2030-12 (6년 = 72개월). 위치 계산은 js/roadmap-layout.js(월 컬럼 기준 순수 함수) 참고.
 * start/span: 분기 인덱스(1 = '25.1Q, 1-based). m: { start, span } 이 있으면 월 단위(1 = 2025-01)가 우선.
 * row: 같은 값이면 같은 줄에 배치(겹치지 않는 과제/로드맵을 옆으로 나열). 없으면 막대마다 한 줄.
 * bar.kind: 'roadmap'(mTRM 로드맵, 청록) | 'task'(상세과제, 초록 단일색).
 * bar.milestones: 완료 단계(없으면 P1만 완료). bar.p4: true 인 과제만 P4 단계를 표시.
 * bar.color / bar.trail: 원본 데이터에 남아 있으나 2026-11-24 기준 렌더에 사용하지 않음(색 고정, 예정 단계는 milestones/p4로 계산).
 * bar.prev: 이전 버전(Ver.0)의 start/span — 있으면 "변경된 바"로 취급(점선 외곽선 + 버전 비교 팝업 대상).
 * bar.linkFrom / linkFromNode: 다른 바에서 이 바로 이어지는 SVG 화살표 연결. linkFromNode는 '레인인덱스-막대인덱스'.
 * lane.unmapped: 분과 매핑이 없는 상세과제 행("분과 미매핑 / 연계 분과 없음").
 * 실 연동 시 API 응답(계획 시작/종료일, P2 실적계획 시작일, P3 완료일, P4 대상/확인 여부)으로 교체됩니다.
 */
(function (global) {
  'use strict';

  var RM_YEARS = ["'25년", "'26년", "'27년", "'28년", "'29년", "'30년"];
  var RM_QUARTERS = ['1Q', '2Q', '3Q', '4Q'];
  var RM_LANES = [
    {
      label: '물류',
      bars: [
        { kind: 'roadmap', label: '로드맵 제목 01', row: 'r0', start: 2, span: 5, mtrm: '물류 mTRM', status: '확정', owner: '정물류 책임',
          tasks: [['AGV 경로 최적화', 'P4', '완료', 2, 4, '정*류'], ['자동창고 입출고 연동', 'P3', '확정', 3, 4, '김*수']] },
        { kind: 'task', label: 'AGV 경로 최적화', row: 'r1', start: 2, span: 4, color: '#22a559', milestones: ['P1', 'P2', 'P3'], p4: true },
        { kind: 'task', label: '자동창고 입출고 연동', row: 'r2', start: 3, span: 4, color: '#22a559', milestones: ['P1', 'P2', 'P3'] },
        { kind: 'roadmap', label: '로드맵 제목02', row: 'r0', start: 8, span: 5, prev: { start: 9, span: 4 }, mtrm: '물류 mTRM → 신규 mTRM', status: '진행중', owner: '정물류 책임',
          tasks: [
            ['무인지게차 자율주행 경로 최적화', 'P2', '결재중', 8, 3, '정*류'],
            ['AMR 부품 공급 자동화', 'P1', '작성중', 9, 4, '박*호'],
            ['라인사이드 공급 무인화', 'P2', '확정', 8, 4, '이*영'],
            ['물류 관제 시스템 통합', 'P3', '확정', 10, 3, '김*수'],
            ['팔레트 자동 인식 비전', 'P1', '반려', 11, 2, '최*훈'],
          ] },
        { kind: 'task', label: '무인지게차 자율주행 경로 최적화', row: 'r1', start: 8, span: 3, color: '#e8a33d', milestones: ['P1'] },
        { kind: 'task', label: 'AMR 부품 공급 자동화', row: 'r2', start: 9, span: 4, color: '#22a559', milestones: ['P1', 'P2', 'P3'] },
      ],
    },
    {
      label: '차체',
      bars: [
        { kind: 'roadmap', label: '차체 자동화 로드맵', start: 2, span: 9, mtrm: '차체 mTRM', status: '진행중', owner: '김차체 책임',
          tasks: [['상세과제명#', 'P3', '확정', 2, 7, '김*수'], ['상세과제명#', 'P2', '결재중', 3, 6, '박*호']] },
        { kind: 'task', label: '상세과제명#', start: 2, span: 7, color: '#22a559' },
        { kind: 'task', label: '상세과제명#', row: 't2', start: 3, span: 6, color: '#22a559', milestones: ['P1', 'P2', 'P3'] },
        { kind: 'task', label: '상세과제명# (27년 4Q 시작)', row: 't2', start: 12, span: 4, color: '#e8a33d', milestones: ['P1'] },
      { kind: 'task', label: '1개월 과제 (2027-01)', start: 9, span: 1, m: { start: 25, span: 1 }, color: '#22a559', milestones: ['P1', 'P2', 'P3'] },
        { kind: 'task', label: '연계과제 A (선행)', start: 3, span: 3, color: '#22a559', row: 'seq', milestones: ['P1', 'P2'], trail: { span: 2, marks: ['P3', 'P4'] } },
        { kind: 'task', label: '연계과제 B (후속)', start: 6, span: 5, m: { start: 16, span: 15 }, color: '#22a559', row: 'seq', milestones: ['P1', 'P2', 'P3'], trail: { span: 3, marks: ['P3', 'P4'] } },
      ],
    },
    {
      label: '지게차',
      bars: [
        { kind: 'roadmap', label: '지게차 무인화 로드맵', start: 3, span: 3, mtrm: '지게차 mTRM', status: '진행중', owner: '최지게 책임',
          tasks: [['상세과제명#', 'P2', '확정', 3, 4, '최*훈']] },
        { kind: 'task', label: '상세과제명#', start: 3, span: 4, color: '#22a559', milestones: ['P1', 'P2'], trail: { span: 3, marks: ['P3', 'P4'] }, linkFromNode: '1-2' },
      ],
    },
    {
      label: '#A',
      bars: [
        { kind: 'roadmap', label: '#A 로드맵', start: 2, span: 10, mtrm: '#A mTRM', status: '진행중', owner: '이*영 책임',
          tasks: [['상세과제명#', 'P3', '확정', 2, 7, '이*영']] },
        { kind: 'task', label: '상세과제명#', start: 2, span: 7, prev: { span: 6 }, color: '#e8a33d', p4: true, milestones: ['P1', 'P2', 'P3'] },
      ],
    },
    {
      label: '#B',
      bars: [
        { kind: 'roadmap', label: '로드맵 제목03', start: 9, span: 5, prev: { start: 10, span: 5 }, mtrm: '#B mTRM', status: '계획', owner: '이*영 책임',
          tasks: [['협동로봇 셀 표준화', 'P1', '작성중', 9, 3, '이*영'], ['비전 검사 AI 모델', 'P2', '확정', 10, 4, '김*수'], ['로봇 티칭 자동화', 'P1', '결재중', 11, 3, '박*호']] },
        { kind: 'task', label: '협동로봇 셀 표준화', start: 9, span: 3, color: '#22a559', milestones: ['P1', 'P2'] },
        { kind: 'roadmap', label: '로드맵 제목05', start: 11, span: 5, linkFrom: true, mtrm: '#B mTRM', status: '계획', owner: '이*영 책임',
          tasks: [['로봇 셀 확대 적용', 'P1', '작성중', 12, 4, '최*훈']] },
        { kind: 'task', label: '로봇 셀 확대 적용', start: 12, span: 4, color: '#22a559', milestones: ['P1'] },
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
        { kind: 'roadmap', label: '조립 자동화 로드맵', start: 4, span: 8, mtrm: '조립 mTRM', status: '진행중', owner: '정조립 책임',
          tasks: [['코봇 체결 자동화', 'P1', '작성중', 4, 6, '정*호'], ['너트런너 다축화', 'P1', '작성중', 7, 5, '박*호']] },
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
        { kind: 'roadmap', label: '엔진 자동화 로드맵', start: 10, span: 6, mtrm: '엔진 mTRM', status: '계획', owner: '최엔진 수석',
          tasks: [['조립셀 무인화 2차', 'P1', '작성중', 12, 4, '최*진']] },
        { kind: 'task', label: '조립셀 무인화 1차', start: 10, span: 4, color: '#22a559', milestones: ['P1', 'P2'] },
      ],
    },
    {
      label: '에너지',
      bars: [
        { kind: 'roadmap', label: '에너지 절감 로드맵', start: 2, span: 9, mtrm: '에너지 mTRM', status: '진행중', owner: '장에너 책임',
          tasks: [['에너지 사용량 모니터링', 'P2', '결재중', 2, 6, '장*진']] },
        { kind: 'task', label: '에너지 사용량 모니터링', start: 2, span: 6, color: '#e8a33d', trail: { span: 3, marks: ['P3', 'P4'] } },
      ],
    },
    {
      label: '#C',
      bars: [
        { kind: 'roadmap', label: '로드맵 제목06', start: 5, span: 6, mtrm: '#C mTRM', status: '진행중', owner: '정*호 책임',
          tasks: [['스마트 공구 관리', 'P2', '확정', 5, 3, '정*호'], ['작업자 보조 웨어러블', 'P1', '결재중', 7, 4, '박*호']] },
        { kind: 'task', label: '스마트 공구 관리', start: 5, span: 3, color: '#22a559', milestones: ['P1', 'P2'] },
        { kind: 'task', label: '작업자 보조 웨어러블', start: 7, span: 4, color: '#e8a33d', milestones: ['P1'] },
      ],
    },
    {
      label: '분과 미매핑',
      unmapped: true,
      bars: [
        { kind: 'task', label: '협동로봇 안전 인증 대응', start: 3, span: 5, color: '#22a559', milestones: ['P1', 'P2'], row: 'um1' },
        { kind: 'task', label: 'AI 품질 예측 PoC', start: 9, span: 4, color: '#e8a33d', milestones: ['P1'], row: 'um1' },
        { kind: 'task', label: '저전력 센서 적용 검토', start: 5, span: 6, color: '#22a559', milestones: ['P1', 'P2', 'P3'], p4: true },
      ],
    },
  ];

  // 하단 "과제 진행 단계" 가이드 — 근거: v3.dc.html rmPhaseGuide (2026-11-24)
  var RM_PHASE_GUIDE = [
    { p: 'P1', title: '계획 일정 등록', desc: '계획 시작일정 · 완료일정 등록 (기간 막대 기준)' },
    { p: 'P2', title: '실적(계획) 시작일정 등록', desc: '실적 계획 시작일정 등록' },
    { p: 'P3', title: '실적(완료) 일정 등록', desc: '실적 완료일정 등록' },
    { p: 'P4', title: '양산 적용 계획 체크', desc: '특수 경우에만 표시' },
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
    // 상세과제 막대 마우스 오버 툴팁 공통 고정값(v3.dc.html tipDesc/tipReg) — 실 연동 시 과제별 기술설명/등록일로 교체
    taskTip: {
      desc: '기술에 대한 설명… 기술에 대한 설명… 기술에 대한 설명… 기술에 대한 설명 공통 기술에 대한 설명 공통',
      reg: '2026-09-16',
    },
    taskChangeRows: RM_TASK_CHANGE_ROWS,
  };
})(window);
