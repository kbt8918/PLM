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
    ['생산', '생산 자동화 로드맵', [14, 18, 15, 12]], ['물류', '물류/반송 로드맵', [12, 15, 13, 11]], ['생산관리', '생산관리 DX 로드맵', [11, 13, 10, 10]],
    ['보전', '예지보전 로드맵', [10, 12, 11, 10]], ['품질', '품질 자동검사 로드맵', [13, 14, 12, 11]], ['에너지', '에너지 절감 로드맵', [10, 11, 10, 10]],
    ['인간친화', '인간친화 작업환경 로드맵', [10, 10, 11, 10]],
  ];
  // 상태 정의는 7종을 유지한다 — 배지 색상 매핑(mmSumStatusMap)을 SCR-010/011/014와 로드맵 간트가 공유하므로
  // 2종(변경요청/취소)을 지우면 타 화면 배지와 간트 색상이 깨진다.
  // 다만 v3의 SUM_STATUS_DEF는 5종이므로, 요약 화면에 "노출"되는 상태는 sumStatusShown으로 따로 추린다.
  var sumStatusDef = [
    ['작성중', 55, '#94a3b8', '#F1F5F9', '#475569'], ['결제중', 50, '#f59e0b', '#FEF3C7', '#B45309'],
    ['완료', 96, '#16a34a', '#DCFCE7', '#15803D'], ['반려', 28, '#dc2626', '#FFE4E6', '#BE123C'],
    ['확정', 100, '#2563eb', '#DBEAFE', '#1D4ED8'], ['변경요청', 0, '#a855f7', '#F3E8FF', '#7E22CE'],
    ['취소', 0, '#475569', '#E5E7EB', '#4B5563'],
  ];
  // v3 SUM_STATUS_DEF와 동일한 5종 (요약 팝업 과제상태 표 / 과제 생성 statusPool 기준)
  var sumStatusShown = sumStatusDef.filter(function (s) { return s[1] > 0; });
  var sumPhases = [['P1', 80, '#93c5fd'], ['P2', 93, '#3b82f6'], ['P3', 82, '#1d4ed8'], ['P4', 74, '#1e3a8a']];
  var sumCards = [
    { label: '총 과제 수', value: '329', unit: '건' },
    { label: '완료 + 확정', value: '196', unit: '건 (59.6%)' },
    { label: '진행 (작성중·결제중)', value: '105', unit: '건' },
    { label: '이슈 (반려)', value: '28', unit: '건' },
  ];
  var sumTotal = 329;
  var sumDoneRate = '59.6%';
  // 상세 표 47건: 분과×단계로 펼친 뒤 상태를 건수 비율대로 순환 배정(v3 SUM_TASKS 생성 로직)
  var sumTasks = (function () {
    var statusPool = [];
    sumStatusShown.forEach(function (s) { for (var n = 0; n < s[1]; n++) statusPool.push(s[0]); });
    var list = [];
    sumDepts.forEach(function (d) {
      d[2].forEach(function (count, pi) {
        for (var k = 0; k < count; k++) list.push({ dept: d[0], roadmap: d[1], phase: 'P' + (pi + 1) });
      });
    });
    return list.map(function (t, i) {
      t.no = i + 1;
      t.name = t.dept + ' 기술과제 #' + String(i + 1).padStart(3, '0');
      t.linked = i % 3 === 0 ? '연계과제 #' + ((i % 5) + 1) : '-';
      t.status = statusPool[(i * 11) % statusPool.length];
      return t;
    });
  })();

  // ---- 요약 팝업 (로드맵 기준) ----
  // [분과, 로드맵, 시작 분기(0='26.1Q), 기간(분기 수), 연계 mTRM 前, 後, 상태, 과제 수, 등록일, 수정일]
  var roadmapSummary = [
    ['생산', '생산 자동화 로드맵', 0, 8, '차체 mTRM', '조립 mTRM', '확정', 12, '2026.01.12', '2026.09.20'],
    ['생산', '셀 무인화 로드맵', 4, 8, '조립 mTRM', '-', '작성중', 4, '2026.09.10', '2026.09.20'],
    ['물류', '물류/반송 로드맵', 1, 9, '물류 mTRM', '신규 mTRM', '확정', 9, '2026.02.03', '2026.10.02'],
    ['생산관리', '생산관리 DX 로드맵', 2, 6, 'DX mTRM', 'AI mTRM', '결제중', 6, '2026.03.15', '2026.09.28'],
    ['보전', '예지보전 로드맵', 0, 7, '보전 mTRM', '-', '확정', 5, '2026.01.20', '2026.06.11'],
    ['보전', '설비 이상감지 로드맵', 0, 4, '보전 mTRM', '-', '완료', 3, '2026.01.08', '2026.08.30'],
    ['품질', '품질 자동검사 로드맵', 3, 9, '검사 mTRM', '-', '결제중', 5, '2026.04.01', '2026.09.05'],
    ['품질', 'AI 외관검사 로드맵', 6, 8, '검사 mTRM', 'AI mTRM', '작성중', 3, '2026.06.22', '2026.10.06'],
    ['에너지', '에너지 절감 로드맵', 2, 10, '에너지 mTRM', '-', '확정', 4, '2026.03.02', '2026.07.18'],
    ['인간친화', '인간친화 작업환경 로드맵', 5, 7, '안전 mTRM', '-', '반려', 3, '2026.05.11', '2026.08.04'],
    ['물류', 'AGV 확대 로드맵', 8, 8, '물류 mTRM', '-', '작성중', 0, '2026.07.07', '2026.07.29'],
  ];
  var roadmapSummaryDepts = ['생산', '물류', '생산관리', '보전', '품질', '에너지', '인간친화'];
  var roadmapSummaryYears = ["'26년", "'27년", "'28년", "'29년"];
  var roadmapSummaryToday = '2026.10.10'; // "최근 30일 수정" 판정 및 간트 "오늘" 선 기준일

  // ---- 로드맵 요약: 분과 x 상태 교차표 ----
  // 근거: v3.dc.html RM_BIG_RAW / RM_BIG / RM_STATUS_ICON.
  // rmBigRaw는 상태 7종 건수를 보유하고, 교차표는 앞 5종(rmStatusCols)만 노출한다(v3 RM_BIG = slice(0,5)).
  // [분과, [작성중, 결제중, 완료, 반려, 확정, 변경요청, 취소]]
  var rmBigRaw = [
    ['생산', [18, 14, 32, 11, 41, 16, 10]],
    ['물류', [15, 21, 24, 10, 33, 12, 11]],
    ['생산관리', [12, 13, 27, 14, 22, 25, 10]],
    ['보전', [20, 11, 29, 10, 19, 13, 12]],
    ['품질', [13, 24, 18, 15, 36, 11, 14]],
    ['에너지', [11, 10, 23, 12, 15, 10, 10]],
    ['인간친화', [10, 12, 14, 21, 13, 11, 10]],
  ];
  var rmStatusCols = ['작성중', '결제중', '완료', '반려', '확정'];
  var rmStatusIcon = {
    '작성중': 'fas fa-pen', '결제중': 'fas fa-hourglass-half', '완료': 'fas fa-flag-checkered',
    '반려': 'fas fa-rotate-left', '확정': 'fas fa-check', '변경요청': 'fas fa-code-compare', '취소': 'fas fa-ban',
  };

  // ---- mTRM 정보 상세 팝업 ----
  // 근거: v3.dc.html mmInfoDetailOpen 블록 (mmIdRows / mmIdPrev / mmIdNext / mmIdHistory).
  var infoDetailRows = [
    { k: '분과', v: 'AI' },
    { k: '로드맵', v: '기술과제 중장기 로드맵' },
    { k: '기간', v: '2026.01 ~ 2027.12' },
    { k: '등록일', v: '2026-09-09' },
    { k: '수정일', v: '2026.09.20' },
  ];
  var infoDetailPrev = '자체 mTRM';
  var infoDetailNext = '연계 mTRM';
  var infoDetailHistory = [
    { date: '2026.09.20', item: '연계 mTRM', before: '-', after: '연계 mTRM', owner: '김의왕 매니저' },
    { date: '2026.06.18', item: '기간', before: '2026.01~2026.12', after: '2026.01~2027.12', owner: '박생기 수석' },
  ];

  // ---- 분과 변경 / 분과장 관리 팝업 ----
  var deptChangeRows = [
    { name: 'AI', regDate: '2026.01.05', modDate: '2026.09.09' },
    { name: '물류', regDate: '2026.01.19', modDate: '2026.09.09' },
    { name: '적층', regDate: '2026.02.02', modDate: '2026.08.11' },
    { name: '로봇', regDate: '2026.02.27', modDate: '2026.08.30' },
  ];
  // v3: 편집 가능한 그리드로 바뀌며 등록일/최근수정일이 추가됐다(생기포털 v3.dc.html deptRows).
  var deptHeadRows = [
    { id: 1, dept: 'AI', main: '김기획 책임 (자동화기술팀)', sub: '박생기 수석 (요소기술팀)', reg: '2026-01-05', mod: '2026-09-01' },
    { id: 2, dept: '물류', main: '이도장 책임 (물류기술팀)', sub: '정물류 매니저 (물류기술팀)', reg: '2026-01-05', mod: '2026-07-14' },
    { id: 3, dept: '적층', main: '최엔진 수석 (적층기술팀)', sub: '-', reg: '2026-02-02', mod: '2026-08-11' },
    { id: 4, dept: '로봇', main: '한로봇 책임 (지능화기술팀)', sub: '유코봇 매니저 (지능화기술팀)', reg: '2026-02-27', mod: '2026-08-30' },
  ];

  // v3 신규: mTRM 업데이트 이력 팝업 행. 근거: 생기포털 v3.dc.html updHistRows.
  var updHistRows = [
    { no: 4, kind: '취소', dept: '차체', mtrm: '차체 mTRM', link: '차체 mTRM 협의체', date: '2026-10-20', ver: 'v1.3' },
    { no: 3, kind: '변경', dept: '물류', mtrm: '물류 mTRM', link: '물류 mTRM 협의체', date: '2026-10-14', ver: 'v1.2' },
    { no: 2, kind: '변경', dept: 'AI', mtrm: '연계 mTRM', link: 'AI mTRM 협의체', date: '2026-09-09', ver: 'v1.1' },
    { no: 1, kind: '신규', dept: 'AI', mtrm: '자체 mTRM', link: 'AI mTRM 협의체', date: '2026-01-05', ver: 'v1.0' },
  ];

  global.PNDES = global.PNDES || {};
  global.PNDES.mock = global.PNDES.mock || {};
  global.PNDES.mock.scr012 = {
    tasks: tasks, infos: infos, depts: depts, updHistRows: updHistRows,
    registrant: registrant, regDate: regDate, regDeptOptions: regDeptOptions, pickerRows: pickerRows,
    versions: versions, versionSnaps: versionSnaps, versionFields: versionFields,
    sumDepts: sumDepts, sumStatusDef: sumStatusDef, sumStatusShown: sumStatusShown, sumPhases: sumPhases, sumCards: sumCards,
    sumTotal: sumTotal, sumDoneRate: sumDoneRate, sumTasks: sumTasks,
    roadmapSummary: roadmapSummary, roadmapSummaryDepts: roadmapSummaryDepts,
    roadmapSummaryYears: roadmapSummaryYears, roadmapSummaryToday: roadmapSummaryToday,
    rmBigRaw: rmBigRaw, rmStatusCols: rmStatusCols, rmStatusIcon: rmStatusIcon,
    infoDetailRows: infoDetailRows, infoDetailPrev: infoDetailPrev,
    infoDetailNext: infoDetailNext, infoDetailHistory: infoDetailHistory,
    deptChangeRows: deptChangeRows, deptHeadRows: deptHeadRows,
  };
})(window);
