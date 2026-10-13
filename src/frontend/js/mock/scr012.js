/*
 * SCR-012 mTRM 관리 mock 데이터
 * 근거: design-import/생기포털 v3.dc.html isMtrmMgmt 블록
 *       (MM_TASKS/MM_INFOS/MM_DEPTS, versionRows/verCompareRows, SUM_DEPTS/SUM_STATUS_DEF/SUM_TASKS, RM_SUM,
 *        deptChangeRows/deptHeadRows/pickerRows).
 * 주의: design-import/README.md "13. mTRM 관리"는 이전 버전 화면(mTRM명/분과/상태/등록일 필터 + 활성/비활성 목록)을
 *       설명하고 있어 v3.dc.html 실제 화면과 다르다. README가 "최신 기준 소스"로 지정한 v3.dc.html을 따른다.
 * 표기: 과제상태 "결재중"(목록)과 "결제중"(요약 팝업)은 v3 원본 표기가 서로 달라 그대로 옮겼다.
 * 실 연동 시 기술과제 목록 / mTRM 정보 / 분과 마스터 / 버전 이력 / 요약 통계 API 응답으로 교체됩니다.
 */
(function (global) {
  'use strict';

  // ---- 본 화면 표 3종 ----
  var tasks = [
    { dept: 'AI', roadmap: '자체 mTRM', task: '소재 제적 단성계수 적용 사출성형조건 최적화', linked: '다색 lens 오버레이 구간 weldline 예측 성능 고도화', state: '작성중', phase: 'P3', reg: '2026-09-21', period: 'P1 26.1Q ~ P4 27.2Q' },
    { dept: '물류', roadmap: '물류 무인화 로드맵', task: '무인지게차 자율주행 경로 최적화', linked: '', state: '결재중', phase: 'P2', reg: '2026-09-15', period: 'P1 26.2Q ~ P4 27.4Q' },
    { dept: 'AI', roadmap: '기술과제 중장기 로드맵', task: '비전 검사 AI 불량 판정 모델', linked: '외관검사 자동화 라인 적용', state: '확정', phase: 'P2', reg: '2026-08-30', period: 'P1 26.1Q ~ P4 27.3Q' },
    { dept: '차체', roadmap: '차체 자동화 로드맵', task: '용접 로봇 품질 모니터링', linked: '', state: '완료', phase: 'P4', reg: '2026-07-11', period: 'P1 25.3Q ~ P4 26.3Q' },
    { dept: '물류', roadmap: '물류 무인화 로드맵', task: 'AMR 부품 공급 자동화', linked: '라인사이드 공급 무인화', state: '반려', phase: 'P1', reg: '2026-06-02', period: 'P1 26.3Q ~ P4 28.1Q' },
  ];
  var infos = [
    { dept: 'AI', roadmap: '기술과제 중장기 로드맵', period: '2026.01~2027.12', prev: '자체 mTRM', next: '연계 mTRM', reg: '2026-09-09', modDate: '2026.09.20', status: '작성중' },
    { dept: 'AI', roadmap: '자체 mTRM', period: '2026.09.09~2026.09.09', prev: '-', next: '자체 mTRM', reg: '2026-09-01', modDate: '2026.09.09', status: '결재중' },
    { dept: '물류', roadmap: '물류 무인화 로드맵', period: '2026.03~2028.03', prev: '물류 mTRM', next: '물류 mTRM v2', reg: '2026-07-14', modDate: '2026.08.02', status: '확정' },
    { dept: '차체', roadmap: '차체 자동화 로드맵', period: '2025.07~2026.12', prev: '-', next: '차체 mTRM', reg: '2026-05-20', modDate: '2026.06.11', status: '완료' },
  ];
  var depts = [
    { dept: 'AI', regDate: '2026.01.05', modDate: '2026.09.01', owner: '홍길동(정) / 김의왕(부)' },
    { dept: '물류', regDate: '2026.01.05', modDate: '2026.07.14', owner: '정물류(정) / 박생기(부)' },
    { dept: '차체', regDate: '2026.02.10', modDate: '2026.05.20', owner: '이차체(정) / 최용접(부)' },
  ];

  // ---- 신규등록 팝업 ----
  var registrant = '자동화기술팀 / 김의왕 매니저';
  var regDate = '2026-09-09';
  var regDeptOptions = ['AI', '물류'];
  var pickerRows = {
    council: [
      { name: '차체 mTRM 협의체', sub: '차체 · 2026-08-20 · 예정' },
      { name: '조립 mTRM 협의체', sub: '조립 · 2026-07-15 · 완료' },
      { name: '도장 mTRM 협의체', sub: '도장 · 2026-06-24 · 완료' },
    ],
    trm: [
      { name: '차체 mTRM', sub: '차체 · 활성 · 2026-01-05' },
      { name: '조립 mTRM', sub: '조립 · 활성 · 2026-01-19' },
      { name: '도장 mTRM', sub: '도장 · 활성 · 2026-02-02' },
      { name: '엔진 mTRM', sub: '엔진 · 비활성 · 2026-02-27' },
    ],
  };

  // ---- 버전관리 팝업 (versions[i]와 versionSnaps[i]는 같은 버전) ----
  var versions = [
    { ver: 'Ver. 3', date: '2026-09-09 15:30:25', owner: '김의왕 매니저', note: '연계 mTRM 추가', current: true },
    { ver: 'Ver. 2', date: '2026-06-18 10:12:03', owner: '박생기 수석', note: '기간 조정', current: false },
    { ver: 'Ver. 1', date: '2026-01-05 09:40:11', owner: '김기획 책임', note: '최초 등록', current: false },
  ];
  var versionSnaps = [
    { dept: 'AI', roadmap: '차체 자동화 로드맵', period: '2026.01~2026.12', pre: '차체 mTRM', post: '조립 mTRM', owner: '김의왕 매니저', status: '확정' },
    { dept: 'AI', roadmap: '차체 자동화 로드맵', period: '2026.01~2026.12', pre: '차체 mTRM', post: '-', owner: '박생기 수석', status: '확정' },
    { dept: 'AI', roadmap: '차체 자동화 로드맵', period: '2026.01~2026.09', pre: '차체 mTRM', post: '-', owner: '김기획 책임', status: '작성중' },
  ];
  var versionFields = [['dept', '분과'], ['roadmap', '로드맵'], ['period', '기간'], ['pre', '연계 mTRM 前'], ['post', '연계 mTRM 後'], ['owner', '수정자'], ['status', '상태']];

  // ---- 요약 팝업 (과제명 기준) ----
  // sumDepts: [분과, 로드맵, [P1, P2, P3, P4 과제 수]] / sumStatusDef: [상태, 건수, 막대색, 배지 배경, 배지 글자]
  var sumDepts = [
    ['생산', '생산 자동화 로드맵', [3, 4, 3, 2]], ['물류', '물류/반송 로드맵', [2, 3, 2, 2]], ['생산관리', '생산관리 DX 로드맵', [2, 2, 1, 1]],
    ['보전', '예지보전 로드맵', [1, 2, 1, 1]], ['품질', '품질 자동검사 로드맵', [2, 2, 2, 2]], ['에너지', '에너지 절감 로드맵', [2, 1, 1, 0]],
    ['인간친화', '인간친화 작업환경 로드맵', [1, 1, 1, 0]],
  ];
  var sumStatusDef = [
    ['작성중', 6, '#94a3b8', '#F1F5F9', '#475569'], ['결제중', 5, '#f59e0b', '#FEF3C7', '#B45309'],
    ['완료', 14, '#16a34a', '#DCFCE7', '#15803D'], ['반려', 3, '#dc2626', '#FFE4E6', '#BE123C'],
    ['확정', 11, '#2563eb', '#DBEAFE', '#1D4ED8'], ['변경요청', 5, '#a855f7', '#F3E8FF', '#7E22CE'],
    ['취소', 3, '#475569', '#E5E7EB', '#4B5563'],
  ];
  var sumPhases = [['P1', 13, '#93c5fd'], ['P2', 15, '#3b82f6'], ['P3', 11, '#1d4ed8'], ['P4', 8, '#1e3a8a']];
  var sumCards = [
    { label: '총 과제 수', value: '47', unit: '건' },
    { label: '완료', value: '14', unit: '건 (29.8%)' },
    { label: '진행 (작성중·결제중·확정)', value: '22', unit: '건' },
    { label: '이슈 (반려·변경요청·취소)', value: '11', unit: '건' },
  ];
  var sumTotal = 47;
  var sumDoneRate = '29.8%';
  // 상세 표 47건: 분과×단계로 펼친 뒤 상태를 건수 비율대로 순환 배정(v3 SUM_TASKS 생성 로직)
  var sumTasks = (function () {
    var statusPool = [];
    sumStatusDef.forEach(function (s) { for (var n = 0; n < s[1]; n++) statusPool.push(s[0]); });
    var list = [];
    sumDepts.forEach(function (d) {
      d[2].forEach(function (count, pi) {
        for (var k = 0; k < count; k++) list.push({ dept: d[0], roadmap: d[1], phase: 'P' + (pi + 1) });
      });
    });
    return list.map(function (t, i) {
      t.no = i + 1;
      t.name = t.dept + ' 기술과제 #' + String(i + 1).padStart(2, '0');
      t.linked = i % 3 === 0 ? '연계과제 #' + ((i % 5) + 1) : '-';
      t.status = statusPool[(i * 7) % statusPool.length];
      return t;
    });
  })();

  // ---- 요약 팝업 (로드맵 기준) ----
  // [분과, 로드맵, 시작 분기(0='26.1Q), 기간(분기 수), 연계 mTRM 前, 後, 상태, 과제 수, 등록일, 수정일]
  var roadmapSummary = [
    ['생산', '생산 자동화 로드맵', 0, 8, '차체 mTRM', '조립 mTRM', '확정', 12, '2026.01.12', '2026.09.20'],
    ['생산', '셀 무인화 로드맵', 4, 8, '조립 mTRM', '-', '작성중', 4, '2026.09.10', '2026.09.20'],
    ['물류', '물류/반송 로드맵', 1, 9, '물류 mTRM', '신규 mTRM', '확정', 9, '2026.02.03', '2026.10.02'],
    ['생산관리', '생산관리 DX 로드맵', 2, 6, 'DX mTRM', 'AI mTRM', '변경요청', 6, '2026.03.15', '2026.09.28'],
    ['보전', '예지보전 로드맵', 0, 7, '보전 mTRM', '-', '확정', 5, '2026.01.20', '2026.06.11'],
    ['보전', '설비 이상감지 로드맵', 0, 4, '보전 mTRM', '-', '완료', 3, '2026.01.08', '2026.08.30'],
    ['품질', '품질 자동검사 로드맵', 3, 9, '검사 mTRM', '-', '결제중', 5, '2026.04.01', '2026.09.05'],
    ['품질', 'AI 외관검사 로드맵', 6, 8, '검사 mTRM', 'AI mTRM', '작성중', 3, '2026.06.22', '2026.10.06'],
    ['에너지', '에너지 절감 로드맵', 2, 10, '에너지 mTRM', '-', '확정', 4, '2026.03.02', '2026.07.18'],
    ['인간친화', '인간친화 작업환경 로드맵', 5, 7, '안전 mTRM', '-', '반려', 3, '2026.05.11', '2026.08.04'],
    ['물류', 'AGV 확대 로드맵', 8, 8, '물류 mTRM', '-', '취소', 0, '2026.07.07', '2026.07.29'],
  ];
  var roadmapSummaryDepts = ['생산', '물류', '생산관리', '보전', '품질', '에너지', '인간친화'];
  var roadmapSummaryYears = ["'26년", "'27년", "'28년", "'29년"];
  var roadmapSummaryToday = '2026.10.10'; // "최근 30일 수정" 판정 및 간트 "오늘" 선 기준일

  // ---- 분과 변경 / 분과장 관리 팝업 ----
  var deptChangeRows = [
    { name: 'AI', regDate: '2026.01.05', modDate: '2026.09.09' },
    { name: '물류', regDate: '2026.01.19', modDate: '2026.09.09' },
    { name: '적층', regDate: '2026.02.02', modDate: '2026.08.11' },
    { name: '로봇', regDate: '2026.02.27', modDate: '2026.08.30' },
  ];
  var deptHeadRows = [
    { dept: 'AI', main: '김기획 책임 (자동화기술팀)', sub: '박생기 수석 (요소기술팀)' },
    { dept: '물류', main: '이도장 책임 (물류기술팀)', sub: '정물류 매니저 (물류기술팀)' },
    { dept: '적층', main: '최엔진 수석 (적층기술팀)', sub: '-' },
    { dept: '로봇', main: '한로봇 책임 (지능화기술팀)', sub: '유코봇 매니저 (지능화기술팀)' },
  ];

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr012 = {
    tasks: tasks, infos: infos, depts: depts,
    registrant: registrant, regDate: regDate, regDeptOptions: regDeptOptions, pickerRows: pickerRows,
    versions: versions, versionSnaps: versionSnaps, versionFields: versionFields,
    sumDepts: sumDepts, sumStatusDef: sumStatusDef, sumPhases: sumPhases, sumCards: sumCards,
    sumTotal: sumTotal, sumDoneRate: sumDoneRate, sumTasks: sumTasks,
    roadmapSummary: roadmapSummary, roadmapSummaryDepts: roadmapSummaryDepts,
    roadmapSummaryYears: roadmapSummaryYears, roadmapSummaryToday: roadmapSummaryToday,
    deptChangeRows: deptChangeRows, deptHeadRows: deptHeadRows,
  };
})(window);
