/*
 * PNDES 신규 메뉴 프로토타입 앱 상태 / 이벤트 위임
 * jQuery 이벤트 위임(data-action)으로 화면 전환·모달·간트뷰·기술동향 상세 탐색을 처리한다.
 * 실 연동 시 각 액션 핸들러 내부를 서버 API 호출로 교체합니다.
 */
(function (global, $) {
  'use strict';

  var render = global.PNDES.render;
  var TPA = global.PNDES.mock.scr010;
  // SCR-010 신규등록 팝업 초기값(v3 state.tpaTasks/tpaMedia/tpaHashTags와 동일)
  function newTpaForm() {
    return {
      title: '', start: '', end: '',
      tasks: TPA.defaultTasks.slice(), bus: ['', '', ''],
      media: TPA.mediaSamples.slice(), hashTags: TPA.defaultHashTags.slice(),
    };
  }
  var CM = global.PNDES.mock.scr011;
  var MM = global.PNDES.mock.scr012;
  var TR = global.PNDES.mock.scr014;
  // SCR-014 등록 팝업 초기값(v3 ttImages/ttFiles/ttTags/TT_MAIL_*). editIndex가 있으면 수정 모드
  function newTrendForm(open, editIndex, row) {
    var withId = function (list, make) { return list.map(function (x, i) { return make(x, i + 1); }); };
    return {
      open: !!open, editIndex: editIndex == null ? null : editIndex,
      title: row ? row.title : '', type: row ? row.kind : '',
      images: withId(TR.defaultImages, function (name, id) { return { id: id, name: name }; }), imageSeq: TR.defaultImages.length,
      files: withId(TR.defaultFiles, function (f, id) { return { id: id, name: f[0], mb: f[1], checked: false }; }), fileSeq: TR.defaultFiles.length,
      tags: withId(TR.defaultTags, function (label, id) { return { id: id, label: label, checked: false }; }), tagSeq: TR.defaultTags.length,
      tagInput: '', recipients: TR.mailRecipients.slice(),
      mailSubject: TR.mailSubject, mailBody: TR.mailBody, mailOn: true,
    };
  }
  // SCR-012 신규등록 팝업 초기값(v3 mtrmRegBlocks — mTRM 블록 2개)
  function newMmForm() {
    return { blocks: [0, 1].map(function () { return { ko: '', en: '', dept: '', date: '', content: '' }; }) };
  }
  // SCR-011 신규등록 팝업 초기값(v3 councilRegRows / CM_SUBJECT / CM_BODY / CM_RECIPIENTS)
  function newCouncilForm(open) {
    return {
      open: open, schedule: '', dept: '',
      agendas: CM.defaultAgendas.map(function (x) { return { agenda: x.agenda, note: x.note }; }),
      recipients: CM.mailRecipients.slice(), subject: CM.mailSubject, body: CM.mailBody,
    };
  }
  // 날짜는 사용자의 현지 시간 기준으로 구한다(toISOString은 UTC라 한국 시간 오전에는 전날이 나옴)
  function todayDotted() {
    var d = new Date();
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  }
  var RM_LANES = global.PNDES.mock.roadmapOverview.lanes;
  function RM_LANES_DIFF_COUNT() {
    return RM_LANES.reduce(function (a, l) { return a + l.bars.filter(function (b) { return b.prev; }).length; }, 0);
  }

  // Figma 변환(html.to.design 등) 캡처처럼 화면별 개별 URL 진입이 필요할 때만 사용.
  // 예: index.html?screen=SCR-006 — 유효한 SCR-ID가 아니면 기본 진입 화면(SCR-001)을 유지.
  var screenParamMatch = /[?&]screen=(SCR-\d{3}|MTRM-MAIN|todo-main)(&|$)/.exec(global.location.search);
  var initialScreen = screenParamMatch ? screenParamMatch[1] : 'todo-main';

  // 같은 목적으로 팝업(모달)도 페이지 로드 시 바로 열리게 하는 파라미터.
  // 예: index.html?screen=SCR-002&modal=stdProcessRegister
  // 특수 모달(autoVideo/dashTrendDetail/techPrDetail)은 상세 데이터가 필요해
  // 첫 번째 데이터 항목으로 기본값을 채운다. 유효하지 않은 modal 값은 무시.
  var modalParamMatch = /[?&]modal=([A-Za-z0-9_-]+)(&|$)/.exec(global.location.search);
  var initialModal = modalParamMatch ? decodeURIComponent(modalParamMatch[1]) : null;
  var initialModalExtras = {};
  if (initialModal === 'autoVideo') {
    initialModalExtras = { videoProcess: '오버몰딩', videoKind: 'part' };
  } else if (initialModal === 'dashTrendDetail') {
    initialModalExtras = { dashTrendDetailIndex: 0 };
  } else if (initialModal === 'techPrDetail') {
    // Tech PR 상세는 activeModal이 아닌 별도 오버레이(techPrDetailIndex)로 열린다.
    initialModal = null;
    initialModalExtras = { techPrDetailIndex: 0 };
  }

  var state = $.extend({
    currentScreen: initialScreen,
    activeModal: initialModal,
    gnbOpen: '', // 상단 GNB 메가메뉴: 현재 펼쳐진 1차 메뉴 id ('' = 닫힘)
    gnbPinned: false, // 클릭으로 고정 오픈된 상태(호버로 연 패널은 mouseleave 시 자동 닫힘)
    gnbTab: 0, // GNB 패널 내 상단 탭(예: 공법 관리 > 조립공법시스템/DEPS/DEPS 설계) 선택 인덱스
    qaTab: 'qa', // 포털 홈 "MY Q&A" / "FAQ" 탭
    weekSel: '금주', // 포털 홈 "금주 내 업무" 셀렉트(금주/차주)
    weekPage: 0, // 포털 홈 "금주 내 업무" 카드 4개씩 페이지네이션
    todoScope: { a: '개인', b: '개인', c: '개인' }, // 포털 홈 내 업무/업무지연/금주 내 업무 범위(개인/팀/실) 토글
    dashExpandedRoadmaps: [], // MTRM-MAIN 통합 로드맵 미니 간트에서 아코디언으로 펼쳐진 로드맵명 목록
    // ---- SCR-006 mTRM(통합로드맵) 간트 ----
    rmScale: 'quarter', // 분기/월 축 전환
    rmFilterStatus: '', // 진행상태 필터 셀렉트 값(메인 대시보드 KPI 카드 클릭 시 미리 세팅됨)
    rmVer: 1, // 0 = 이전 버전(Ver.0), 1 = 현재 버전
    rmVerModal: null, // 버전 비교 팝업: { from, to, viewOnly }
    rmShowMtrm: true, // mTRM 로드맵 바 표시 체크박스
    rmShowTask: true, // 기술과제 바 표시 체크박스
    rmDetailOpen: false, // "상세조회" 패널(적용공장/담당팀/버전) 펼침 여부
    rmHover: null, // 로드맵 바 hover 요약 팝오버: { li, bi, style }
    rmLinks: [], // 로드맵 간 SVG 연결선 좌표(measureRmLinks()가 DOM 실측 후 채움)
    subTaskDetail: null, // 상세과제 상세 팝업에 표시할 { name, status, period, dept, mtrm, owner, reg }
    trendRows: TR.rows.slice(), // SCR-014 기술동향 목록 (등록/수정 시 갱신)
    trendFilter: { year: '', kind: '', scope: TR.scopeOptions[0], keyword: '' }, // 검색 영역 입력값
    trendApplied: { year: '', kind: '', scope: TR.scopeOptions[0], keyword: '' }, // "조회" 시점에 확정된 조건
    trendSelectMode: false, // "수정" 버튼으로 켜는 선택모드 — 켜진 동안 목록 행 클릭 시 수정 팝업이 열린다
    trendDetailIndex: null, // 전체화면 상세 오버레이에 표시할 행 인덱스
    trendForm: newTrendForm(false), // 등록/수정 팝업 입력값
    dashTrendDetailIndex: null, // MTRM-MAIN "최근 기술동향" 항목 클릭 시 표시할 상세 팝업 인덱스
    videoProcess: null, // SCR-001 "현재=자동"/SCR-003 "기술현황=●" 클릭 시 자동화 설비 동영상 모달에 표시할 공정/작업명
    videoKind: 'part', // 동영상 모달 제목 접두어 구분: 'part'(부품) / 'module'(모듈)
    techPrDetailIndex: null, // SCR-009/MTRM-MAIN Tech PR 카드 클릭 시 표시할 커스텀 상세 오버레이 인덱스
    deptRows: MM.deptHeadRows.map(function (r) { return $.extend({}, r, { checked: false, isNew: false }); }), // 분과장 관리 편집 행(v3 deptRows)
    deptRowSeq: MM.deptHeadRows.length, // 신규 행 id 시퀀스
    trendMailOpen: false, // SCR-014 신규 등록 시 먼저 뜨는 알림메일 팝업(v3 trendMailOpen)
    mmUnlinked: [], // SCR-012에서 연계과제를 해제한 과제명 목록(v3 mmUnlinked)
    mmLinkMap: {}, // 연관과제 검색으로 새로 연결한 과제명 매핑(v3 mmLinkMap)
    lk: { open: false, target: '', sel: '', filter: { owner: '', name: '' }, applied: { owner: '', name: '' } }, // 연관과제 검색 팝업(v3 lk*)
    techPrDetailCard: null, // 클릭한 카드 좌표(gi/fi/ci) — 상세 오버레이가 카드 필드를 그대로 표시
    tpdIdx: 0, // 상세 오버레이 슬라이드 인덱스(0~2)
    toast: null, // 화면 우상단(하단) 토스트 알림 메시지, showToast()로 세팅 후 일정 시간 뒤 자동 소멸
    masterPage: 1, // SCR-002 표준공정 마스터 관리 페이지네이션
    scr002Rows: global.PNDES.mock.scr002Rows.slice(), // mock을 state로 복제 — 등록/수정/삭제가 실제로 목록에 반영되도록
    scr004Rows: global.PNDES.mock.scr004Rows.slice(), // SCR-004 모듈 표준 작업명 관리
    taskRoadmapList: global.PNDES.mock.scr007.rows.slice(), // SCR-007 상세과제 로드맵 관리(MTRM-MAIN 미니 간트도 공유)
    taskRoadmapFilter: { roadmap: '', status: '' }, // SCR-007 통합 로드맵/진행상태 필터(선택 즉시 적용)
    modalFormValues: null, // 공용 등록/수정 모달: 수정 모드일 때 채워질 {field: value} 맵(null = 신규 등록)
    modalEditIndex: null, // 공용 등록/수정 모달: 저장 시 교체할 목록 인덱스(null = 신규 등록 → push)
    taskPage: 1, // SCR-004 모듈 표준 작업명 관리 페이지네이션
    ifPage: 1, // SCR-005 I/F 실행결과 관리 페이지네이션
    roadmapPage: 1, // SCR-006 통합 로드맵 페이지네이션
    taskRoadmapPage: 1, // SCR-007 상세과제 로드맵 관리 페이지네이션
    techPrFilter: { div: '전체', bu: '전체', factory: '전체', tag: '전체' }, // SCR-009 필터 셀렉트의 현재 선택값
    techPrApplied: {}, // SCR-009 "조회" 클릭 시점에 확정된 필터(목록은 이 값으로 걸러짐)
    // ---- SCR-010 Tech PR 관리자 ----
    tpaRows: global.PNDES.mock.scr010.rows.slice(), // "Tech PR 등록" 표
    tpaTagRows: global.PNDES.mock.scr010.tagRows.slice(), // "기술태그 Master Table"
    tpaRegisterOpen: false, // 신규등록 팝업
    tpaForm: newTpaForm(), // 신규등록 팝업 입력값
    tpaTagAdd: { open: false, draft: [], input: '', desc: '' }, // 기술태그 추가 팝업
    // ---- SCR-011 mTRM 협의체 ----
    councilRows: global.PNDES.mock.scr011.rows.slice(), // "mTRM 협의회 이력" 표
    councilFilter: '', // 진행상태 셀렉트의 현재 선택값
    councilApplied: '', // "조회" 클릭 시점에 확정된 진행상태 필터
    councilDetailIndex: null, // 상세현황 팝업에 표시할 행 인덱스
    councilForm: newCouncilForm(false), // 신규등록 팝업 입력값
    mmFilter: { dept: '', roadmap: '', from: '', to: '' }, // SCR-012 필터 입력값
    mmApplied: { dept: '', roadmap: '', from: '', to: '' }, // "조회" 클릭 시점에 확정된 필터
    mmInfos: MM.infos.slice(), // "mTRM 정보" 표 (신규등록 결재 시 행 추가)
    mmModal: null, // 열린 팝업: register | version | summary | deptChange | deptHead | infoDetail
    mmInfoDetail: null, // mTRM 정보 상세 팝업에 표시할 행
    mmRmSort: null, // 로드맵 요약 교차표 정렬: null|'total' = 합계, 0..n = 상태 열 인덱스
    // [공통] 메일알림 대상 검색 팝업 — SCR-011 협의체 / SCR-014 기술동향이 공유한다.
    // target: 확인 시 수신자를 반영할 화면 (council | trend)
    mailTarget: { open: false, target: null, query: { room: '', team: '' }, selected: [] },
    mmForm: newMmForm(), // 신규등록 팝업 입력값
    mmPicker: null, // 조회 선택 팝업 종류: council | trm
    mmPickedCouncil: '', mmPickedTrm: '',
    mmVerPicked: null, mmVerCompare: false, // 버전관리 팝업: 선택한 버전 인덱스 / 차이점 비교 패널
    mmSummaryMode: 'task', mmSumDept: '', mmSumStatus: '', // 요약 팝업: task | roadmap, 상세 표 필터
    techTaskForm: { name: '', owner: '', planDate: '', linkedRoadmap: '' }, // SCR-013 기술과제 관리 입력값
    techTrendPage: 1, // SCR-014 기술동향 페이지네이션
  }, initialModalExtras);
  var toastTimer = null;

  // patch는 객체 또는 (state) => 객체 형태의 함수(이전 state를 참조해야 하는 갱신에 사용)
  function setState(patch) {
    $.extend(state, typeof patch === 'function' ? patch(state) : patch);
    renderAll();
  }

  // 근거: design_handoff_생기포털 README "조회 완료 시 화면 우상단 토스트 알림 노출(2~3초 후 자동 소멸)" 공통 동작.
  function showToast(message) {
    if (toastTimer) { clearTimeout(toastTimer); }
    state.toast = message;
    renderAll();
    toastTimer = setTimeout(function () {
      state.toast = null;
      renderAll();
    }, 2600);
  }

  function renderAll() {
    $('#gnb-top').html(render.gnbTop(state));
    var isTodoMain = state.currentScreen === 'todo-main';
    $('#content').toggleClass('content-flush', isTodoMain).html(render.screen(state));

    var modalHtml = render.modal(state);
    var $modalRoot = $('#modal-root');
    if (modalHtml) {
      $modalRoot.html(modalHtml).addClass('open');
    } else {
      $modalRoot.empty().removeClass('open');
    }

    // SCR-009/MTRM-MAIN Tech PR 카드 상세: 공용 modal-root와 별개의 오버레이 컨테이너
    var $techPrRoot = $('#techpr-detail-root');
    var techPrHtml = render.techPrDetail ? render.techPrDetail(state) : '';
    if (techPrHtml) { $techPrRoot.html(techPrHtml); } else { $techPrRoot.empty(); }

    $('#toast-root').html(render.toast ? render.toast(state) : '');

    if (state.currentScreen === 'SCR-006') measureRmLinks();
  }

  // 근거: v3.dc.html measureRmLinks() — linkFromNode가 있는 바에서 출발 바로 이어지는 SVG 꺾은선 좌표를
  // 실제 DOM(getBoundingClientRect)으로 측정한다. 좌표는 렌더 후에만 알 수 있으므로, 측정값이 이전과
  // 달라졌을 때만(JSON 비교) setState로 재렌더한다(달라지지 않았으면 무한 루프 없이 그대로 멈춤).
  var rmLinksRaf = null;
  function measureRmLinks() {
    cancelAnimationFrame(rmLinksRaf);
    rmLinksRaf = requestAnimationFrame(function () {
      var root = document.querySelector('[data-rm-gantt]');
      if (!root) { if ((state.rmLinks || []).length) { state.rmLinks = []; } return; }
      var base = root.getBoundingClientRect();
      var links = [];
      RM_LANES.forEach(function (lane, li) {
        lane.bars.forEach(function (b, bi) {
          if (!b.linkFromNode) return;
          var from = root.querySelector('[data-rm-node="' + b.linkFromNode + '"]');
          var to = root.querySelector('[data-rm-node="' + li + '-' + bi + '"]');
          if (!from || !to) return;
          var fr = (from.parentElement.parentElement || from).getBoundingClientRect();
          var tr = (to.parentElement.parentElement || to).getBoundingClientRect();
          var f = from.getBoundingClientRect(), t = to.getBoundingClientRect();
          var x1 = fr.left - base.left - 2, y1 = f.top + f.height / 2 - base.top;
          var x2 = tr.left - base.left - 2, y2 = t.top + t.height / 2 - base.top;
          var gx = Math.min(x1, x2) - 14;
          var r = function (v) { return Math.round(v * 10) / 10; };
          links.push({
            d: 'M ' + r(x1) + ' ' + r(y1) + ' H ' + r(gx) + ' V ' + r(y2) + ' H ' + r(x2 - 6),
            head: 'M ' + r(x2) + ' ' + r(y2) + ' L ' + r(x2 - 7) + ' ' + r(y2 - 4) + ' L ' + r(x2 - 7) + ' ' + r(y2 + 4) + ' Z',
          });
        });
      });
      var key = JSON.stringify(links);
      if (key !== state._rmLinkKey) {
        state._rmLinkKey = key;
        setState({ rmLinks: links });
      }
    });
  }

  // 근거: README "좁은 화면/터치(폭 < 1024px 또는 hover 불가): hover 비활성, 클릭으로만 열림."
  function isTouchOrNarrow() {
    return global.innerWidth < 1024 || !global.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function selectScreen(id) {
    setState({ currentScreen: id, activeModal: null });
  }

  // GNB 1차 메뉴 클릭/하위 항목 선택 시 패널을 닫고 해당 화면으로 이동 (v3.dc.html gnbGo 포팅)
  function gnbGo(view) {
    setState({ currentScreen: view, activeModal: null, gnbOpen: '', gnbPinned: false });
  }

  // 근거: README 공통 규칙 "등록/수정 폼 저장 시 목록의 해당 행 상태가 즉시 갱신".
  // 화면마다 state의 목록 프로퍼티명·식별 방식이 다르므로, 모달 id별로 저장 핸들러를 등록해 재사용한다.
  // handler(values, editIndex) 형태: values는 {field: value} 맵, editIndex는 수정 대상 행 인덱스(null = 신규 등록).
  // 반환값이 false면 저장을 막고(검증 실패) 모달을 닫지 않는다.
  var MODAL_SAVE_HANDLERS = {};

  // ---- SCR-002 표준공정 마스터 관리: 등록/수정/삭제 ----
  // 근거: v3.dc.html saveMaster/deleteMaster — 표준공정명 미입력 시 alert로 막고, 등록은 배열 끝에 추가,
  // 수정은 해당 인덱스를 교체. 삭제는 confirm 후 즉시 목록에서 제거.
  MODAL_SAVE_HANDLERS.stdProcessRegister = function (values, editIndex) {
    if (!values.name || !values.name.trim()) {
      global.alert('표준공정명을 입력해주세요.');
      return false;
    }
    setState(function (s) {
      var rows = s.scr002Rows.slice();
      if (editIndex != null) { rows[editIndex] = values; } else { rows.push(values); }
      return { scr002Rows: rows };
    });
  };

  // ---- SCR-004 모듈 표준 작업명 관리: 등록/수정/삭제 ----
  // 근거: v3.dc.html saveTask — 작업명+공정유형 미입력 시 alert. 등록은 등록자/등록일이 없는 폼이므로
  // 오늘 날짜로 신규 행 추가(등록자는 v3 원본에 없는 보완 필드라 빈 값), 수정은 name/type만 교체하고
  // 기존 행의 registeredBy/registered(등록자/등록일)는 그대로 유지한다.
  MODAL_SAVE_HANDLERS.stdTaskRegister = function (values, editIndex) {
    if (!values.name || !values.name.trim() || !values.type) {
      global.alert('작업명과 공정유형을 모두 입력해주세요.');
      return false;
    }
    setState(function (s) {
      var rows = s.scr004Rows.slice();
      if (editIndex != null) {
        rows[editIndex] = $.extend({}, rows[editIndex], { name: values.name, type: values.type });
      } else {
        var today = todayDotted().split('.').join('-');
        rows.push({ name: values.name, type: values.type, registeredBy: '', registered: today });
      }
      return { scr004Rows: rows };
    });
  };

  // ---- SCR-007 상세과제 로드맵 관리: 등록/수정 ----
  // 근거: v3.dc.html saveTaskRoadmap — 필수 5개 미입력 시 alert, 기간은 "YYYY.MM~YYYY.MM"으로 합성.
  // 신규 행의 roadmap은 현재 선택된 통합 로드맵 필터 값. 수정 시에는 원본과 달리 기존 roadmap을 유지한다
  // (원본은 필터 값으로 덮어써 필터 미선택 상태에서 수정하면 로드맵 연결이 끊기는 결함이 있음).
  MODAL_SAVE_HANDLERS.detailTaskRegister = function (values, editIndex) {
    if (!values.name || !values.name.trim() || !values.owner || !values.startDate || !values.endDate || !values.status) {
      global.alert('필수 항목을 모두 입력해주세요.');
      return false;
    }
    var period = values.startDate.slice(0, 7).replace('-', '.') + '~' + values.endDate.slice(0, 7).replace('-', '.');
    setState(function (s) {
      var list = s.taskRoadmapList.slice();
      var row = { name: values.name, owner: values.owner, period: period, status: values.status };
      if (editIndex != null) {
        row.roadmap = list[editIndex].roadmap;
        list[editIndex] = row;
      } else {
        row.roadmap = s.taskRoadmapFilter.roadmap || '';
        list.push(row);
      }
      return { taskRoadmapList: list };
    });
  };

  // ---- SCR-009 기술문의/제안: 내용 미입력 시 전송 차단(v3.dc.html sendTechPrInquiry) ----
  MODAL_SAVE_HANDLERS.techPrInquiry = function (values) {
    if (!values.content || !values.content.trim()) {
      global.alert('문의/제안 내용을 입력해주세요.');
      return false;
    }
  };

  // 근거: v3.dc.html addTagChip — 입력값 앞에 '#'를 붙여 칩으로 추가(중복은 무시), 입력창은 비운다
  function addTpaTagChip() {
    var t = state.tpaTagAdd;
    var v = (t.input || '').trim();
    if (!v) return;
    if (v.charAt(0) !== '#') v = '#' + v;
    var draft = t.draft.indexOf(v) === -1 ? t.draft.concat([v]) : t.draft;
    setState({ tpaTagAdd: $.extend({}, t, { draft: draft, input: '' }) });
    $('#tpa-tag-input').trigger('focus');
  }

  // ---- SCR-014 등록 팝업 헬퍼 ----
  function setTrendForm(patch) { setState({ trendForm: $.extend({}, state.trendForm, patch) }); }
  function trendWithout(list, $el) { var id = Number($el.data('id')); return list.filter(function (x) { return x.id !== id; }); }
  function trendToggle(list, $el) {
    var id = Number($el.data('id'));
    return list.map(function (x) { return x.id === id ? $.extend({}, x, { checked: !x.checked }) : x; });
  }
  function trendToggleAll(list) {
    var all = list.length > 0 && list.every(function (x) { return x.checked; });
    return list.map(function (x) { return $.extend({}, x, { checked: !all }); });
  }
  // 입력창의 태그를 쉼표로 나눠 '#태그' 형태로 추가 (v3 ttAddTag — 중복은 건너뛴다)
  function addTrendTags() {
    var f = state.trendForm;
    var parts = f.tagInput.split(',').map(function (t) { return t.trim().replace(/^#+/, ''); }).filter(Boolean).map(function (t) { return '#' + t; });
    if (!parts.length) return;
    var exist = f.tags.map(function (t) { return t.label; });
    var fresh = parts.filter(function (t, i) { return exist.indexOf(t) < 0 && parts.indexOf(t) === i; });
    if (!fresh.length) { setTrendForm({ tagInput: '' }); showToast('이미 등록된 해시태그입니다.'); return; }
    var seq = f.tagSeq;
    setTrendForm({ tags: f.tags.concat(fresh.map(function (label) { seq += 1; return { id: seq, label: label, checked: false }; })), tagSeq: seq, tagInput: '' });
    $('#trm-tag-input').trigger('focus');
  }

  // 현재 열린 모달의 DOM에서 [data-field] 입력값을 읽어 {field: value} 맵으로 반환
  function readModalFormValues() {
    var values = {};
    $('#modal-root [data-field]').each(function () {
      values[$(this).data('field')] = $(this).val();
    });
    return values;
  }

  $(function () {
    $(document).on('click', '[data-action]', function (e) {
      var $el = $(this);
      var action = $el.data('action');

      switch (action) {
        case 'select-screen':
          selectScreen($el.data('screenId'));
          break;
        case 'open-modal':
          // 신규 등록(수정 아님): 폼은 빈 값으로 오픈
          setState({ activeModal: $el.data('modalId'), modalFormValues: null, modalEditIndex: null });
          break;
        case 'open-edit-modal':
          // 근거: README "수정 클릭 시 해당 행 데이터가 채워진 등록 모달과 동일한 폼이 오픈"
          setState({
            activeModal: $el.data('modalId'),
            modalFormValues: $el.data('values') || null,
            modalEditIndex: $el.data('index') != null ? Number($el.data('index')) : null,
          });
          break;
        case 'close-modal':
          setState({ activeModal: null, modalFormValues: null, modalEditIndex: null });
          break;
        case 'open-video':
          // SCR-001 "현재=자동" 배지 / SCR-003 "기술현황=●" 배지 클릭 -> 공용 동영상 모달
          setState({ activeModal: 'autoVideo', videoProcess: $el.data('process'), videoKind: $el.data('kind') || 'part' });
          break;
        case 'confirm-modal': {
          // 등록/수정 모달 저장 버튼: data-field 입력값을 읽어 화면별 저장 핸들러(MODAL_SAVE_HANDLERS) 실행 후 닫기.
          // 저장 핸들러가 없는 모달(안내성 팝업 등)은 기존처럼 토스트만 표시.
          var modalId = state.activeModal;
          var values = readModalFormValues();
          var handler = MODAL_SAVE_HANDLERS[modalId];
          if (handler && handler(values, state.modalEditIndex) === false) break; // 검증 실패 시 모달 유지
          setState({ activeModal: null, modalFormValues: null, modalEditIndex: null });
          showToast($el.data('message'));
          break;
        }
        case 'scr001-search':
          // 근거: onSearch — 부품 공정 자동화 현황 조회 버튼 클릭 시 토스트 알림
          showToast('필터 조건으로 조회가 완료되었습니다.');
          break;
        case 'open-scr002-register':
          // 근거: v3.dc.html openMasterAdd — 신규 등록 시 공장/라인 기본값(A공장/1라인)으로 초기화된 폼이 열림
          setState({ activeModal: 'stdProcessRegister', modalFormValues: null, modalEditIndex: null });
          break;
        case 'edit-scr002-row': {
          var scr002Idx = Number($el.data('index'));
          setState({ activeModal: 'stdProcessRegister', modalFormValues: state.scr002Rows[scr002Idx], modalEditIndex: scr002Idx });
          break;
        }
        case 'delete-scr002-row': {
          // 근거: v3.dc.html deleteMaster — 네이티브 confirm 후 즉시 목록에서 제거(커스텀 모달을 거치지 않음)
          if (!global.confirm('해당 표준공정 마스터 항목을 삭제하시겠습니까?')) break;
          var delIdx = Number($el.data('index'));
          setState(function (s) { return { scr002Rows: s.scr002Rows.filter(function (_, i) { return i !== delIdx; }) }; });
          showToast('삭제되었습니다.');
          break;
        }
        case 'open-scr004-register':
          // 근거: v3.dc.html openTaskAdd — 신규 등록 시 빈 폼으로 오픈
          setState({ activeModal: 'stdTaskRegister', modalFormValues: null, modalEditIndex: null });
          break;
        case 'edit-scr004-row': {
          var scr004Idx = Number($el.data('index'));
          setState({ activeModal: 'stdTaskRegister', modalFormValues: state.scr004Rows[scr004Idx], modalEditIndex: scr004Idx });
          break;
        }
        case 'delete-scr004-row': {
          // 근거: v3.dc.html deleteTask — 네이티브 confirm 후 즉시 목록에서 제거
          if (!global.confirm('해당 표준 작업명을 삭제하시겠습니까?')) break;
          var delTaskIdx = Number($el.data('index'));
          setState(function (s) { return { scr004Rows: s.scr004Rows.filter(function (_, i) { return i !== delTaskIdx; }) }; });
          showToast('삭제되었습니다.');
          break;
        }
        case 'open-scr007-register':
          setState({ activeModal: 'detailTaskRegister', modalFormValues: null, modalEditIndex: null });
          break;
        case 'edit-scr007-row': {
          // 근거: v3.dc.html openTaskRoadmapEdit — "YYYY.MM~YYYY.MM" 기간을 date 입력용 "YYYY-MM-01"로 분해
          var trIdx = Number($el.data('index'));
          var trRow = state.taskRoadmapList[trIdx];
          var trParts = trRow.period.split('~');
          var toDate = function (ym) { return ym ? ym.replace(/\./g, '-') + '-01' : ''; };
          setState({
            activeModal: 'detailTaskRegister', modalEditIndex: trIdx,
            modalFormValues: { name: trRow.name, owner: trRow.owner, startDate: toDate(trParts[0]), endDate: toDate(trParts[1]), status: trRow.status },
          });
          break;
        }
        case 'scr007-search':
        case 'tpa-search':
          showToast('검색 조건이 적용되었습니다.');
          break;
        case 'scr001-excel':
          // 근거: onExcel — 부품 공정 자동화 현황 엑셀 다운로드 버튼 클릭 시 토스트 알림
          showToast('엑셀 다운로드 기능이 실행되었습니다.');
          break;
        case 'set-page': {
          var patch = {};
          patch[$el.data('key')] = Number($el.data('page'));
          setState(patch);
          break;
        }
        case 'open-techpr-detail':
          // v3: 상세 오버레이는 클릭한 카드 자체(제목/적용처/개발기간/배지)를 표시하고,
          // 이미지/동영상은 3장 슬라이드(tpdIdx)로 전환한다.
          setState({
            techPrDetailIndex: Number($el.data('index')),
            techPrDetailCard: { gi: Number($el.data('gi')), fi: Number($el.data('fi')), ci: Number($el.data('ci')) },
            tpdIdx: 0,
          });
          break;
        case 'tpd-go':
          setState({ tpdIdx: Number($el.data('idx')) });
          break;
        case 'tpd-step':
          setState({ tpdIdx: ((state.tpdIdx || 0) + Number($el.data('d')) + 3) % 3 });
          break;
        case 'close-techpr-detail':
          setState({ techPrDetailIndex: null });
          break;
        case 'run-search':
          // 프로토타입 단계: 실 연동 시 조회조건 기반 API 호출로 교체
          break;
        case 'toggle-dash-roadmap': {
          var dashCategory = $el.data('category');
          var dashIdx = state.dashExpandedRoadmaps.indexOf(dashCategory);
          var dashNext = dashIdx === -1
            ? state.dashExpandedRoadmaps.concat([dashCategory])
            : state.dashExpandedRoadmaps.filter(function (c) { return c !== dashCategory; });
          setState({ dashExpandedRoadmaps: dashNext });
          break;
        }
        case 'open-dash-trend-detail':
          setState({ activeModal: 'dashTrendDetail', dashTrendDetailIndex: Number($el.data('index')) });
          break;
        // ---- SCR-014 기술동향 ----
        case 'trm-search':
          setState({ trendApplied: $.extend({}, state.trendFilter), techTrendPage: 1 });
          showToast('검색 조건이 적용되었습니다.');
          break;
        case 'trm-keyword-clear':
          state.trendFilter.keyword = '';
          $('#trm-keyword').val('').trigger('focus');
          break;
        case 'trm-toggle-select':
          setState({ trendSelectMode: !state.trendSelectMode });
          break;
        case 'trm-row-click': {
          var trIdx = Number($el.data('index'));
          if (state.trendSelectMode) setState({ trendSelectMode: false, trendForm: newTrendForm(true, trIdx, state.trendRows[trIdx]) });
          else setState({ trendDetailIndex: trIdx });
          break;
        }
        case 'trm-detail-prev':
          setState({ trendDetailIndex: Math.max(0, state.trendDetailIndex - 1) });
          break;
        case 'trm-detail-next':
          setState({ trendDetailIndex: Math.min(state.trendRows.length - 1, state.trendDetailIndex + 1) });
          break;
        case 'trm-detail-close':
          setState({ trendDetailIndex: null });
          break;
        case 'trm-detail-file':
          e.preventDefault();
          showToast('첨부파일 다운로드는 준비중입니다.');
          break;
        case 'trm-open-add':
          setState({ trendSelectMode: false, trendForm: newTrendForm(true) });
          break;
        case 'trm-close-modal':
          if ($el.is('button') || e.target === this) setTrendForm({ open: false });
          break;
        case 'trm-image-add': {
          var imgForm = state.trendForm;
          if (imgForm.images.length >= TR.imageMax) { showToast('이미지는 최대 ' + TR.imageMax + '장까지 등록할 수 있습니다.'); break; }
          var imgSeq = imgForm.imageSeq + 1;
          setTrendForm({ images: imgForm.images.concat([{ id: imgSeq, name: '기술동향_이미지_' + String(imgSeq).padStart(2, '0') + '.png' }]), imageSeq: imgSeq });
          break;
        }
        case 'trm-image-remove':
          setTrendForm({ images: trendWithout(state.trendForm.images, $el) });
          break;
        case 'trm-image-clear':
          setTrendForm({ images: [] });
          break;
        case 'trm-file-add': {
          var fileSeq = state.trendForm.fileSeq + 1;
          var fileSample = TR.fileSamples[(fileSeq - 1) % TR.fileSamples.length];
          setTrendForm({ files: state.trendForm.files.concat([{ id: fileSeq, name: fileSample[0], mb: fileSample[1], checked: false }]), fileSeq: fileSeq });
          break;
        }
        case 'trm-file-toggle':
          setTrendForm({ files: trendToggle(state.trendForm.files, $el) });
          break;
        case 'trm-file-toggle-all':
          setTrendForm({ files: trendToggleAll(state.trendForm.files) });
          break;
        case 'trm-file-remove':
          setTrendForm({ files: trendWithout(state.trendForm.files, $el) });
          break;
        case 'trm-file-remove-checked':
          setTrendForm({ files: state.trendForm.files.filter(function (x) { return !x.checked; }) });
          break;
        case 'trm-tag-add':
          addTrendTags();
          break;
        case 'trm-tag-toggle':
          setTrendForm({ tags: trendToggle(state.trendForm.tags, $el) });
          break;
        case 'trm-tag-toggle-all':
          setTrendForm({ tags: trendToggleAll(state.trendForm.tags) });
          break;
        case 'trm-tag-remove':
          setTrendForm({ tags: trendWithout(state.trendForm.tags, $el) });
          break;
        case 'trm-tag-remove-checked':
          if (!state.trendForm.tags.some(function (t) { return t.checked; })) { showToast('삭제할 해시태그를 선택하세요.'); break; }
          setTrendForm({ tags: state.trendForm.tags.filter(function (t) { return !t.checked; }) });
          break;
        case 'trm-recipient-remove': {
          var trRcAt = Number($el.data('index'));
          setTrendForm({ recipients: state.trendForm.recipients.filter(function (_, j) { return j !== trRcAt; }) });
          break;
        }
        case 'trm-mail-reset':
          setTrendForm({ mailSubject: TR.mailSubject, mailBody: TR.mailBody });
          break;
        case 'trm-save': {
          // v3의 저장은 이전 버전 폼(담당자/부서/내용)을 검사해 신규 등록이 항상 막힌다. 여기서는 팝업에 실제로 있는
          // 제목·유형을 필수로 보고, 담당자는 팝업에 표시된 등록자로 저장한다.
          var trf = state.trendForm;
          if (!trf.title.trim() || !trf.type) { global.alert('필수 항목을 모두 입력해주세요.'); break; }
          var trEdit = trf.editIndex != null;
          // v3: 신규 등록은 저장 전에 알림메일 팝업을 먼저 띄우고, "발송"을 눌러야 실제 저장된다.
          if (!trEdit && !state.trendMailOpen) { setState({ trendMailOpen: true }); break; }
          var trRows = state.trendRows.slice();
          if (trEdit) {
            trRows[trf.editIndex] = $.extend({}, trRows[trf.editIndex], { title: trf.title.trim(), kind: trf.type });
          } else {
            var trToday = todayDotted().split('.');
            trRows.unshift({
              title: trf.title.trim(), views: 0, date: trToday.join('-'), dept: TR.registrant.dept, owner: TR.registrant.owner,
              tag: trf.tags.length ? trf.tags[0].label.replace(/^#/, '') : '-', kind: trf.type,
              period: trToday[0] + ' ' + Math.ceil(Number(trToday[1]) / 3) + '분기', content: '',
            });
          }
          setState({ trendRows: trRows, trendForm: $.extend({}, trf, { open: false }), techTrendPage: trEdit ? state.techTrendPage : 1, trendMailOpen: false });
          showToast(trEdit ? '기술동향이 수정되었습니다.' : '담당자에게 알림 이메일을 발송했습니다.');
          break;
        }
        case 'logout':
          e.preventDefault();
          // 프로토타입 단계: 실 연동 시 PNDES SSO(Azure/MPASS/PKI) 로그아웃 처리로 교체
          break;
        case 'gnb-go':
          gnbGo($el.data('view'));
          break;
        case 'gnb-guide':
          // TODO: README #16 업무프로세스 가이드 화면 구현 단계에서 gnbGo('guide')로 교체
          showToast('업무프로세스 가이드는 준비중입니다.');
          break;
        case 'gnb-enter':
          // 메가메뉴 호버 오픈: 터치/좁은 화면(<1024px)에서는 비활성, 이미 클릭으로 고정(pin)된 상태면 호버로 다른 메뉴를 바꾸지 않음
          if (!state.gnbPinned && !isTouchOrNarrow()) setState({ gnbOpen: $el.data('menuId') });
          break;
        case 'gnb-click': {
          var menuId = $el.data('menuId');
          var hasPanel = $el.data('hasPanel');
          var landing = $el.data('landing');
          if (menuId === 'myjob') { gnbGo('todo-main'); break; }
          if (landing && !hasPanel) { gnbGo(landing); break; }
          if (!hasPanel) { setState({ gnbOpen: '' }); showToast("'" + $el.text().trim() + "' 메뉴는 준비중입니다."); break; }
          setState({
            gnbOpen: (state.gnbOpen === menuId && state.gnbPinned) ? '' : menuId,
            gnbPinned: !(state.gnbOpen === menuId && state.gnbPinned),
          });
          break;
        }
        case 'gnb-tab':
          setState({ gnbTab: Number($el.data('tabIndex')) });
          break;
        case 'gnb-leaf': {
          var leafView = $el.data('view');
          if (leafView) { gnbGo(leafView); } else { setState({ gnbOpen: '', gnbPinned: false }); showToast("'" + $el.text().trim() + "' 화면은 준비중입니다."); }
          break;
        }
        case 'gnb-close-all':
          setState({ gnbOpen: '', gnbPinned: false });
          break;
        case 'gnb-quick': {
          var quickId = $el.data('menuId');
          var quickMenu = global.PNDES.GNB_MENUS.filter(function (m) { return m.id === quickId; })[0];
          if (quickMenu && quickMenu.cols) { setState({ gnbOpen: quickId, gnbPinned: true }); } else { showToast("'" + $el.data('label') + "' 메뉴는 준비중입니다."); }
          break;
        }
        case 'gnb-search':
          showToast('통합조회 결과가 없습니다.');
          break;
        case 'todo-scope': {
          var scopeKey = $el.data('scopeKey');
          var scopeVal = $el.data('scopeVal');
          var todoScope = $.extend({}, state.todoScope);
          todoScope[scopeKey] = scopeVal;
          setState({ todoScope: todoScope });
          break;
        }
        case 'qa-tab':
          setState({ qaTab: $el.data('tab') });
          break;
        case 'qa-register':
          showToast('Q&A 등록 화면으로 이동합니다.');
          break;
        case 'qa-more':
          showToast('Q&A 전체 목록으로 이동합니다.');
          break;
        case 'notice-more':
          showToast('공지사항 전체 목록으로 이동합니다.');
          break;
        case 'week-sel':
          setState({ weekSel: $el.val ? $el.val() : $el.data('value') });
          break;
        case 'week-page':
          setState({ weekPage: Number($el.data('page')) });
          break;
        case 'todo-card':
          showToast($el.data('label') + ' 목록으로 이동합니다.');
          break;
        case 'week-card':
          if ($el.data('label') === '기술과제') { gnbGo('SCR-013'); } else { showToast($el.data('label') + ' 업무 목록'); }
          break;
        case 'todo-delay-tech':
          gnbGo('SCR-013');
          break;

        // ---- SCR-011 mTRM 협의체 ----
        case 'council-search':
          setState({ councilApplied: state.councilFilter });
          showToast('검색 조건이 적용되었습니다.');
          break;
        case 'council-open-detail':
          setState({ councilDetailIndex: Number($el.data('index')) });
          break;
        case 'council-close-detail':
          setState({ councilDetailIndex: null });
          break;
        case 'council-open-register':
          setState({ councilForm: newCouncilForm(true) });
          break;
        case 'council-close-register':
          if ($el.is('button') || e.target === this) setState({ councilForm: $.extend({}, state.councilForm, { open: false }) });
          break;
        case 'council-agenda-add': {
          var addAt = Number($el.data('index'));
          var addList = state.councilForm.agendas.slice();
          addList.splice(addAt + 1, 0, { agenda: '', note: '' });
          setState({ councilForm: $.extend({}, state.councilForm, { agendas: addList }) });
          break;
        }
        case 'council-agenda-remove': {
          if (state.councilForm.agendas.length <= 1) break; // 최소 1행 유지
          var rmAt = Number($el.data('index'));
          setState({ councilForm: $.extend({}, state.councilForm, { agendas: state.councilForm.agendas.filter(function (_, j) { return j !== rmAt; }) }) });
          break;
        }
        case 'council-recipient-remove': {
          var rcAt = Number($el.data('index'));
          setState({ councilForm: $.extend({}, state.councilForm, { recipients: state.councilForm.recipients.filter(function (_, j) { return j !== rcAt; }) }) });
          break;
        }
        case 'council-mail-reset':
          // 근거: v3.dc.html cmReset — 메일 제목/본문/수신자를 기본값으로 되돌림
          setState({ councilForm: $.extend({}, state.councilForm, { subject: CM.mailSubject, body: CM.mailBody, recipients: CM.mailRecipients.slice() }) });
          break;
        case 'council-save-register': {
          // v3.dc.html saveMtrm은 이 팝업에 없는 필드(협의체명/연동 mTRM/대상 분과장)를 검사해 항상 실패한다.
          // 팝업에 실제로 있는 항목 기준으로 저장한다: 회의예정일·참석분과 필수, '예약' 상태로 이력 맨 위에 추가.
          var cf = state.councilForm;
          if (!cf.schedule || !cf.dept) { global.alert('필수 항목을 모두 입력해주세요.'); break; }
          var maxSeq = state.councilRows.reduce(function (m, r) { return Math.max(m, Number(r.no.slice(-3)) || 0); }, 0);
          var seq = maxSeq + 1;
          var councilRow = {
            no: 'MC-2026-' + String(seq).padStart(3, '0'), dept: cf.dept,
            title: "'26년 " + seq + '차 mTRM 협의회 (' + cf.dept + ' 분과)',
            regDate: todayDotted().split('.').join('-'), planDate: cf.schedule, doneDate: '', status: '예약',
          };
          setState({ councilRows: [councilRow].concat(state.councilRows), councilForm: $.extend({}, cf, { open: false }) });
          showToast('협의체가 등록되었습니다.');
          break;
        }

        // ---- SCR-010 Tech PR 관리자 ----
        case 'tpa-open-register':
          setState({ tpaRegisterOpen: true, tpaForm: newTpaForm() });
          break;
        case 'tpa-close-register':
          if ($el.is('button') || e.target === this) setState({ tpaRegisterOpen: false });
          break;
        case 'tpa-task-add':
          // 근거: v3.dc.html addTpaTask — 연관 과제는 최대 3개
          if (state.tpaForm.tasks.length < 3) {
            setState({ tpaForm: $.extend({}, state.tpaForm, { tasks: state.tpaForm.tasks.concat(['']) }) });
          }
          break;
        case 'tpa-task-remove': {
          // 근거: v3.dc.html removeTpaTask — 최소 1개는 남긴다. 해당 블록의 BU 입력값도 함께 제거
          if (state.tpaForm.tasks.length <= 1) break;
          var rmTaskIdx = Number($el.data('index'));
          var keep = function (_, j) { return j !== rmTaskIdx; };
          setState({ tpaForm: $.extend({}, state.tpaForm, { tasks: state.tpaForm.tasks.filter(keep), bus: state.tpaForm.bus.filter(keep).concat(['']) }) });
          break;
        }
        case 'tpa-hashtag-remove': {
          var rmTagIdx = Number($el.data('index'));
          setState({ tpaForm: $.extend({}, state.tpaForm, { hashTags: state.tpaForm.hashTags.filter(function (_, j) { return j !== rmTagIdx; }) }) });
          break;
        }
        case 'tpa-media-pick':
        case 'tpa-media-remove': {
          // 근거: v3.dc.html pickTpaMedia/removeTpaMedia — 슬롯별 샘플 파일명을 채우거나 비운다(실제 파일 선택은 연동 시 교체)
          var mediaIdx = Number($el.data('index'));
          var media = state.tpaForm.media.slice();
          media[mediaIdx] = action === 'tpa-media-pick' ? TPA.mediaSamples[mediaIdx] : null;
          setState({ tpaForm: $.extend({}, state.tpaForm, { media: media }) });
          break;
        }
        case 'tpa-save-register': {
          // v3.dc.html saveTechPrAdmin은 이 팝업에 없는 필드(과제/담당자/이메일)를 검사해 항상 실패한다.
          // 팝업에 실제로 있는 항목 기준으로 저장한다: 기술명 필수, 분과/적용공장은 첫 번째 연관 과제에서 가져옴.
          var tf = state.tpaForm;
          if (!tf.title.trim()) { global.alert('필수 항목을 모두 입력해주세요.'); break; }
          var firstTask = TPA.taskDb[tf.tasks.filter(function (t) { return !!t; })[0]] || {};
          var newRow = { no: '-', dept: firstTask.dept || '-', bu: tf.bus[0] || '-', factory: firstTask.factory || '-', tags: tf.hashTags.slice(), name: tf.title.trim(), prio: '' };
          setState({ tpaRows: state.tpaRows.concat([newRow]), tpaRegisterOpen: false });
          showToast('자료가 등록되었습니다.');
          break;
        }
        case 'tpa-tag-open':
          setState({ tpaTagAdd: { open: true, draft: [], input: '', desc: '' } });
          break;
        case 'tpa-tag-close':
          setState({ tpaTagAdd: $.extend({}, state.tpaTagAdd, { open: false }) });
          break;
        case 'tpa-tag-chip-add':
          addTpaTagChip();
          break;
        case 'tpa-tag-suggest': {
          var pick = String($el.data('tag'));
          if (state.tpaTagAdd.draft.indexOf(pick) === -1) {
            setState({ tpaTagAdd: $.extend({}, state.tpaTagAdd, { draft: state.tpaTagAdd.draft.concat([pick]) }) });
          }
          break;
        }
        case 'tpa-tag-chip-remove': {
          var rmChipIdx = Number($el.data('index'));
          setState({ tpaTagAdd: $.extend({}, state.tpaTagAdd, { draft: state.tpaTagAdd.draft.filter(function (_, j) { return j !== rmChipIdx; }) }) });
          break;
        }
        case 'tpa-tag-save': {
          // 근거: v3.dc.html saveTagAdd — 태그 1개 이상 필수, 오늘 날짜로 Master Table 맨 위에 추가
          if (!state.tpaTagAdd.draft.length) { global.alert('기술태그를 1개 이상 입력해주세요.'); break; }
          var today = todayDotted();
          setState({
            tpaTagRows: [{ tags: state.tpaTagAdd.draft.slice(), regDate: today, modDate: today }].concat(state.tpaTagRows),
            tpaTagAdd: { open: false, draft: [], input: '', desc: '' },
          });
          showToast('기술태그가 추가되었습니다.');
          break;
        }

        // ---- SCR-009 생산기술 Tech PR ----
        case 'techpr-search':
          setState({ techPrApplied: $.extend({}, state.techPrFilter) });
          showToast('검색 조건이 적용되었습니다.');
          break;
        case 'techpr-related-task':
          // 카드(open-techpr-detail) 안에 있는 배지이므로, 카드의 상세 팝업이 함께 열리지 않도록 전파를 끊는다
          e.stopPropagation();
          setState({ subTaskDetail: { name: String($el.data('title')), status: '진행중', period: $el.data('factory') + ' · P1~P4' } });
          break;

        // ---- MTRM-MAIN 메인 대시보드 ----
        case 'kpi-go-roadmap':
          // 근거: v3.dc.html gotoRoadmapWithStatus — 상태 필터를 미리 세팅한 채 통합 로드맵으로 이동
          setState({ currentScreen: 'SCR-006', activeModal: null, rmFilterStatus: String($el.data('status') || '') });
          break;
        case 'dash-roadmap-bar':
          // 근거: v3.dc.html gotoTaskRoadmapFor — 해당 로드맵으로 필터된 상세과제 로드맵 관리로 이동
          setState({
            currentScreen: 'SCR-007', activeModal: null, taskRoadmapPage: 1,
            taskRoadmapFilter: { roadmap: String($el.data('roadmap')), status: '' },
          });
          break;

        // ---- SCR-006 mTRM(통합로드맵) 간트 ----
        case 'rm-set-scale':
          setState({ rmScale: $el.data('scale') });
          break;
        case 'rm-toggle-mtrm':
          setState({ rmShowMtrm: $el.is(':checked') });
          break;
        case 'rm-toggle-task':
          setState({ rmShowTask: $el.is(':checked') });
          break;
        case 'rm-toggle-detail':
          setState({ rmDetailOpen: !state.rmDetailOpen });
          break;
        case 'rm-open-diff':
          setState({ rmVerModal: { from: 1, to: 0, viewOnly: true } });
          break;
        case 'rm-back-current':
          setState({ rmVer: 1 });
          break;
        case 'rm-close-ver-modal':
          // 닫기 버튼이거나 배경 자체를 클릭했을 때만 닫는다. 위임 핸들러는 버블링 경로의 오버레이에서도 실행되므로
          // e.target으로 실제 클릭 지점을 확인해야 팝업 안쪽 클릭에 닫히지 않는다
          if ($el.is('button') || e.target === this) setState({ rmVerModal: null });
          break;
        case 'rm-vm-confirm': {
          var vmTo = Number($el.data('to'));
          var vmToPrev = vmTo === 0;
          var vmDiff = RM_LANES_DIFF_COUNT();
          setState({ rmVer: vmTo, rmVerModal: null });
          showToast(vmToPrev ? ('이전 버전 mTRM을 표시합니다. 변경 ' + vmDiff + '건') : '현재 버전으로 돌아왔습니다.');
          break;
        }
        case 'rm-tip-task-click': {
          var tipLane = RM_LANES[Number($el.data('lane'))];
          var tipBar = tipLane.bars[Number($el.data('bar'))];
          var tipTask = tipBar.tasks[Number($el.data('task'))];
          setState({
            rmHover: null,
            subTaskDetail: { name: tipTask[0], status: tipTask[2], period: tipLane.label + ' · ' + tipBar.label },
          });
          break;
        }
        case 'rm-task-click': {
          var rtLane = RM_LANES[Number($el.data('lane'))];
          var rtBar = rtLane.bars[Number($el.data('bar'))];
          setState({ subTaskDetail: { name: rtBar.label, status: '진행중', period: rtLane.label + ' · P1~P4' } });
          break;
        }
        // ---- SCR-012 mTRM 관리 ----
        case 'mm-search':
          setState({ mmApplied: $.extend({}, state.mmFilter) });
          showToast('조회 조건이 적용되었습니다.');
          break;
        case 'mm-deploy':
          showToast('현재까지 등록된 mTRM ' + state.mmInfos.length + '건을 배포했습니다.');
          break;
        case 'mm-go-roadmap':
          selectScreen('SCR-006');
          break;
        case 'mm-task-detail': {
          var mmTask = MM.tasks[Number($el.data('index'))];
          setState({ subTaskDetail: { name: $el.data('kind') === 'linked' ? mmTask.linked : mmTask.task, status: mmTask.state, period: mmTask.period } });
          break;
        }
        case 'mm-linked-search':
          setState({ lk: { open: true, target: String($el.data('task')), sel: '', filter: { owner: '', name: '' }, applied: { owner: '', name: '' } } });
          break;
        case 'lk-close':
          // 이벤트 위임은 버블링 경로상의 모든 data-action에서 발동한다.
          // 오버레이(배경)에 걸린 닫기이므로, 실제로 배경을 직접 클릭했을 때만 닫는다
          // (내부 "선택"/"조회" 버튼 클릭이 함께 닫아버리는 것을 방지).
          if ($el.hasClass('rm-modal-overlay') && e.target !== this) break;
          setState(function (st) { return { lk: $.extend({}, st.lk, { open: false }) }; });
          break;
        case 'lk-pick': {
          var lkName = String($el.data('name'));
          setState(function (st) {
            return { lk: $.extend({}, st.lk, { sel: st.lk.sel === lkName ? '' : lkName }) };
          });
          break;
        }
        case 'lk-search':
          setState(function (st) { return { lk: $.extend({}, st.lk, { applied: $.extend({}, st.lk.filter), sel: '' }) }; });
          break;
        case 'lk-choose':
          if (!state.lk.sel) { showToast('연관과제를 선택해주세요.'); break; }
          setState(function (st) {
            var map = $.extend({}, st.mmLinkMap);
            map[st.lk.target] = st.lk.sel;
            return {
              lk: $.extend({}, st.lk, { open: false }),
              mmLinkMap: map,
              mmUnlinked: (st.mmUnlinked || []).filter(function (x) { return x !== st.lk.target; }),
            };
          });
          showToast('연관과제가 연결되었습니다.');
          break;
        case 'dept-toggle': {
          var dtId = Number($el.data('id'));
          setState(function (st) {
            return { deptRows: st.deptRows.map(function (x) { return x.id === dtId ? $.extend({}, x, { checked: !x.checked }) : x; }) };
          });
          break;
        }
        case 'dept-add-row':
          setState(function (st) {
            var nid = st.deptRowSeq + 1;
            var t = todayDotted().replace(/\./g, '-');
            return {
              deptRowSeq: nid,
              deptRows: st.deptRows.concat([{ id: nid, dept: '', main: '', sub: '', reg: t, mod: t, checked: false, isNew: true }]),
            };
          });
          break;
        case 'dept-remove-rows': {
          var dRows = state.deptRows;
          if (!dRows.some(function (r) { return r.checked; })) { showToast('삭제할 분과를 선택하세요.'); break; }
          if (dRows.some(function (r) { return r.checked && !r.isNew; })) {
            showToast('등록된 분과는 삭제할 수 없습니다. 신규로 추가한 행만 삭제할 수 있습니다.');
            break;
          }
          setState({ deptRows: dRows.filter(function (r) { return !r.checked; }) });
          break;
        }
        case 'dept-save': {
          var badDept = state.deptRows.filter(function (r) { return !String(r.dept).trim() || !String(r.main).trim(); });
          if (badDept.length) { global.alert('분과명과 분과 담당자(정)는 필수 입력입니다.'); break; }
          setState({ mmModal: null });
          showToast('분과 정보가 저장되었습니다.');
          break;
        }
        case 'dept-search':
          showToast('담당자 검색 팝업은 이후 연결됩니다.');
          break;
        case 'trend-mail-close':
          setState({ trendMailOpen: false });
          break;
        case 'mm-unlink':
          // v3: 해제한 과제명을 mmUnlinked에 쌓아두고 렌더 시 연계과제를 비운다.
          setState(function (st) {
            return { mmUnlinked: (st.mmUnlinked || []).concat([String($el.data('task'))]) };
          });
          showToast('연계과제가 해제되었습니다.');
          break;
        case 'mm-open-modal': {
          var mmPatch = { mmModal: String($el.data('modal')) };
          if (mmPatch.mmModal === 'summary') mmPatch.mmSummaryMode = String($el.data('mode'));
          if (mmPatch.mmModal === 'register') $.extend(mmPatch, { mmForm: newMmForm(), mmPickedCouncil: '', mmPickedTrm: '', mmPicker: null });
          setState(mmPatch);
          break;
        }
        case 'mm-close-modal':
          if ($el.is('button') || e.target === this) setState({ mmModal: null, mmPicker: null, mmVerCompare: false, mmInfoDetail: null });
          break;
        case 'mm-rm-sort': {
          var rmKey = String($el.data('key'));
          setState({ mmRmSort: rmKey === 'total' ? 'total' : Number(rmKey) });
          break;
        }
        case 'mm-info-detail-open':
          setState({ mmModal: 'infoDetail', mmInfoDetail: state.mmInfos[Number($el.data('index'))] || null });
          break;
        case 'mm-info-detail-close':
          setState({ mmModal: null, mmInfoDetail: null });
          break;
        case 'mm-info-detail-backdrop':
          if (e.target === this) setState({ mmModal: null, mmInfoDetail: null });
          break;
        case 'mm-info-detail-roadmap':
          setState({ mmModal: null, mmInfoDetail: null });
          showToast('해당 로드맵 화면으로 이동합니다.');
          break;
        case 'mt-open': {
          // 현재 화면의 수신자 칩을 팝업 초기 선택값으로 복원한다(팀명 -> 마스터 key 역매핑).
          var mtTarget = String($el.data('target'));
          var mtCurrent = mtTarget === 'council' ? state.councilForm.recipients : state.trendForm.recipients;
          var mtKeys = [];
          PNDES.data.mailDirectory.forEach(function (d) {
            if (mtCurrent.indexOf(d.team) >= 0) mtKeys.push(d.key);
          });
          setState({ mailTarget: { open: true, target: mtTarget, query: { room: '', team: '' }, selected: mtKeys } });
          break;
        }
        case 'mt-close':
          setState({ mailTarget: $.extend({}, state.mailTarget, { open: false }) });
          break;
        case 'mt-backdrop':
          if (e.target === this) setState({ mailTarget: $.extend({}, state.mailTarget, { open: false }) });
          break;
        case 'mt-search': {
          // 입력값은 렌더 전에 DOM에서 수거한다(입력 중 리렌더를 피하기 위해 onChange 대신 조회 시점에 읽음).
          var mtQ = {
            room: String($('.mt-input[data-mt-field="room"]').val() || '').trim(),
            team: String($('.mt-input[data-mt-field="team"]').val() || '').trim(),
          };
          setState({ mailTarget: $.extend({}, state.mailTarget, { query: mtQ }) });
          break;
        }
        case 'mt-toggle': {
          // tr에 위임된 핸들러다. 행 안의 체크박스를 눌러도 click이 tr로 버블링되어 여기로 들어오며,
          // 체크박스는 렌더 결과만 반영하므로 별도 분기 없이 한 번만 토글한다.
          var mtKey = String($el.data('key'));
          var mtSel = state.mailTarget.selected.slice();
          var mtAt = mtSel.indexOf(mtKey);
          if (mtAt >= 0) mtSel.splice(mtAt, 1); else mtSel.push(mtKey);
          setState({ mailTarget: $.extend({}, state.mailTarget, { selected: mtSel }) });
          break;
        }
        case 'mt-toggle-all': {
          var mtQ2 = state.mailTarget.query;
          var mtRows = PNDES.data.mailDirectory.filter(function (d) {
            return (!mtQ2.room || d.room.indexOf(mtQ2.room) >= 0) && (!mtQ2.team || d.team.indexOf(mtQ2.team) >= 0);
          });
          var mtAll = mtRows.length > 0 && mtRows.every(function (d) { return state.mailTarget.selected.indexOf(d.key) >= 0; });
          var mtNext = mtAll ? [] : mtRows.map(function (d) { return d.key; });
          setState({ mailTarget: $.extend({}, state.mailTarget, { selected: mtNext }) });
          break;
        }
        case 'mt-chip-remove': {
          var mtRm = String($el.data('key'));
          setState({ mailTarget: $.extend({}, state.mailTarget, {
            selected: state.mailTarget.selected.filter(function (k) { return k !== mtRm; }),
          }) });
          break;
        }
        case 'mt-confirm': {
          var mtTeams = state.mailTarget.selected.map(function (k) { return k.split('|')[1]; });
          var mtPatch = { mailTarget: $.extend({}, state.mailTarget, { open: false }) };
          if (state.mailTarget.target === 'council') {
            mtPatch.councilForm = $.extend({}, state.councilForm, { recipients: mtTeams });
          } else {
            mtPatch.trendForm = $.extend({}, state.trendForm, { recipients: mtTeams });
          }
          setState(mtPatch);
          showToast('메일알림 대상 ' + mtTeams.length + '건이 반영되었습니다.');
          break;
        }
        case 'mm-picker-open':
          setState({ mmPicker: String($el.data('kind')) });
          break;
        case 'mm-picker-close':
          setState({ mmPicker: null });
          break;
        case 'mm-picker-choose': {
          var pickPatch = { mmPicker: null };
          pickPatch[state.mmPicker === 'council' ? 'mmPickedCouncil' : 'mmPickedTrm'] = String($el.data('name'));
          setState(pickPatch);
          break;
        }
        case 'mm-save-register': {
          // v3의 결재 버튼은 이전 버전 폼을 검사해 항상 경고만 뜬다. 여기서는 첫 번째 블록 기준으로
          // mTRM 명(한글)·분과를 필수로 보고 "mTRM 정보" 표에 결재중 행을 추가한다.
          var mmBlocks = state.mmForm.blocks.filter(function (b) { return b.ko.trim(); });
          if (!mmBlocks.length || mmBlocks.some(function (b) { return !b.dept; })) { global.alert('필수 항목을 모두 입력해주세요.'); break; }
          var mmToday = todayDotted();
          var mmNew = mmBlocks.map(function (b) {
            var sched = b.date ? b.date.split('-').join('.') : '-';
            return {
              dept: b.dept, roadmap: b.ko.trim(), period: b.date ? sched + '~' + sched : '-', prev: '-', next: state.mmPickedTrm || '-',
              reg: mmToday.split('.').join('-'), modDate: mmToday, status: '결재중',
            };
          });
          setState({ mmInfos: mmNew.concat(state.mmInfos), mmModal: null, mmPicker: null });
          showToast('mTRM이 저장되었습니다.');
          break;
        }
        case 'mm-ver-pick':
          setState({ mmVerPicked: Number($el.data('index')) });
          break;
        case 'mm-ver-compare':
          setState({ mmVerCompare: true, mmVerPicked: state.mmVerPicked == null ? 1 : state.mmVerPicked });
          break;
        case 'mm-ver-compare-close':
          setState({ mmVerCompare: false });
          break;
        case 'mm-sum-dept': {
          var sumDeptName = String($el.data('name'));
          setState({ mmSumDept: state.mmSumDept === sumDeptName ? '' : sumDeptName });
          break;
        }
        case 'mm-sum-status': {
          var sumStatusName = String($el.data('name'));
          setState({ mmSumStatus: state.mmSumStatus === sumStatusName ? '' : sumStatusName });
          break;
        }
        case 'mm-sum-clear':
          setState({ mmSumDept: '', mmSumStatus: '' });
          break;

        // ---- SCR-013 기술과제 관리 ----
        // v3에는 취소/등록 동작이 정의돼 있지 않아(버튼만 존재) 다른 등록 화면과 같은 규칙으로 구현:
        // 취소는 입력값 초기화, 등록은 필수 4항목 확인 후 완료 안내와 함께 초기화.
        case 'tt-cancel':
          setState({ techTaskForm: { name: '', owner: '', planDate: '', linkedRoadmap: '' } });
          break;
        case 'tt-save': {
          var ttf = state.techTaskForm;
          if (!ttf.name.trim() || !ttf.owner || !ttf.planDate || !ttf.linkedRoadmap) { global.alert('필수 항목을 모두 입력해주세요.'); break; }
          setState({ techTaskForm: { name: '', owner: '', planDate: '', linkedRoadmap: '' } });
          showToast('기술과제가 등록되었습니다.');
          break;
        }

        case 'rm-close-task-detail':
          if ($el.is('button') || e.target === this) setState({ subTaskDetail: null });
          break;

        default:
          break;
      }
    });

    // GNB 셀렉트(select) change는 click 위임과 별도 처리
    $(document).on('change', '[data-action="week-sel-input"]', function () {
      setState({ weekSel: $(this).val() });
    });

    $(document).on('change', '[data-action="rm-filter-status"]', function () {
      setState({ rmFilterStatus: $(this).val() });
    });

    $(document).on('change', '[data-action="techpr-filter"]', function () {
      var tpFilter = $.extend({}, state.techPrFilter);
      tpFilter[$(this).data('key')] = $(this).val();
      setState({ techPrFilter: tpFilter });
    });

    // SCR-011 진행상태 셀렉트: 값만 보관하고 "조회" 클릭 시 적용
    $(document).on('change', '[data-action="council-filter"]', function () {
      state.councilFilter = $(this).val();
    });
    // SCR-014 검색 영역: 값만 보관하고 조회 버튼(또는 검색창 Enter)에서 적용
    $(document).on('input change', '[data-trm-filter]', function () {
      state.trendFilter[$(this).data('trmFilter')] = $(this).val();
    });
    $(document).on('keydown', '#trm-keyword', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); $('[data-action="trm-search"]').trigger('click'); }
    });
    // SCR-014 등록 팝업 입력값: state에 보관하고 발송 미리보기 조각과 글자 수만 갱신한다(포커스 유지)
    // 분과장 관리 그리드 입력 — 타이핑 중 재렌더로 포커스를 잃지 않도록 state만 갱신한다
    // (저장/행추가 시점에 setState로 다시 그린다). data-trm-field 패턴과 동일.
    $(document).on('change', '[data-lk-field]', function () {
      var key = $(this).data('lkField');
      var val = $(this).val();
      setState(function (st) {
        var f = $.extend({}, st.lk.filter);
        f[key] = val;
        return { lk: $.extend({}, st.lk, { filter: f }) };
      });
    });

    $(document).on('input change', '[data-dept-field]', function () {
      var $i = $(this);
      var id = Number($i.data('id'));
      var key = $i.data('deptField');
      var val = $i.val();
      state.deptRows = state.deptRows.map(function (x) {
        if (x.id !== id) return x;
        var patch = {};
        patch[key] = val;
        return $.extend({}, x, patch);
      });
    });

    $(document).on('input change', '[data-trm-field]', function () {
      var f = state.trendForm;
      var key = $(this).data('trmField');
      if (key === 'mailOn') { f.mailOn = $(this).prop('checked'); return; }
      var val = $(this).val();
      if (key === 'mailBody') {
        f.mailBody = val.slice(0, TR.mailBodyMax);
        $('#trm-mail-len').text(f.mailBody.length + ' / ' + TR.mailBodyMax + '자');
      } else {
        f[key] = val;
      }
      if (key !== 'tagInput') $('#trm-preview-slot').html(render.trendMailPreview(f));
    });
    $(document).on('keydown', '#trm-tag-input', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); addTrendTags(); }
    });
    // SCR-013 입력값: state에만 보관. 연동 mTRM 로드맵을 바꾸면 자동 매핑 결과 표가 달라지므로 다시 그린다
    $(document).on('input change', '[data-tt-field]', function (ev) {
      var ttKey = $(this).data('ttField');
      state.techTaskForm[ttKey] = $(this).val();
      if (ttKey === 'linkedRoadmap' && ev.type === 'change') renderAll();
    });
    // SCR-012 필터: 값만 보관하고 "조회" 클릭 시 적용. 분과를 바꾸면 로드맵 선택지가 달라지므로 다시 그린다
    $(document).on('change', '[data-mm-filter]', function () {
      var mmKey = $(this).data('mmFilter');
      state.mmFilter[mmKey] = $(this).val();
      if (mmKey === 'dept') { state.mmFilter.roadmap = ''; renderAll(); }
    });
    // SCR-012 신규등록 팝업 입력값: 다시 그리지 않고 state에만 보관(조회 선택 팝업을 열고 닫아도 값 보존)
    $(document).on('input change', '[data-mm-field]', function () {
      state.mmForm.blocks[Number($(this).data('index'))][$(this).data('mmField')] = $(this).val();
    });
    // SCR-011 신규등록 팝업 입력값: state에 보관하고 발송 미리보기 조각과 글자 수만 갱신한다
    // (팝업 전체를 다시 그리면 입력 중인 칸의 포커스가 사라지므로 부분 갱신)
    $(document).on('input change', '[data-cm-field]', function () {
      var f = state.councilForm;
      var key = $(this).data('cmField');
      var val = $(this).val();
      if (key === 'agenda' || key === 'note') {
        f.agendas[Number($(this).data('index'))][key] = val;
      } else if (key === 'body') {
        f.body = val.slice(0, CM.mailBodyMax);
        $('#cm-body-len').text(f.body.length + ' / ' + CM.mailBodyMax + '자');
      } else {
        f[key] = val;
      }
      $('#cm-preview-slot').html(render.councilMailPreview(f));
    });

    // SCR-010 팝업 입력값: 다시 그리지 않고 state에만 보관(타이핑 중 포커스 유지, 이후 재렌더 시 값 보존)
    $(document).on('input', '[data-tpa-field]', function () {
      var key = $(this).data('tpaField');
      if (key === 'bu') { state.tpaForm.bus[Number($(this).data('index'))] = $(this).val(); } else { state.tpaForm[key] = $(this).val(); }
    });
    $(document).on('input', '[data-tpa-tag-field]', function () {
      state.tpaTagAdd[$(this).data('tpaTagField')] = $(this).val();
    });
    // 근거: v3.dc.html onTagKey — Enter 또는 쉼표로 태그 칩 추가
    $(document).on('keydown', '#tpa-tag-input', function (ev) {
      if (ev.key === 'Enter' || ev.key === ',') { ev.preventDefault(); addTpaTagChip(); }
    });
    // 연관 과제 선택 시 분과/연계 mTRM/적용공장/담당 자동 입력을 위해 다시 그린다(v3 setTpaTask)
    $(document).on('change', '[data-action="tpa-task-select"]', function () {
      var tasks = state.tpaForm.tasks.slice();
      tasks[Number($(this).data('index'))] = $(this).val();
      setState({ tpaForm: $.extend({}, state.tpaForm, { tasks: tasks }) });
    });

    // SCR-007 필터 셀렉트: 선택 즉시 목록에 반영하고 1페이지로 되돌림
    $(document).on('change', '[data-action="scr007-filter"]', function () {
      var filter = $.extend({}, state.taskRoadmapFilter);
      filter[$(this).data('key')] = $(this).val();
      setState({ taskRoadmapFilter: filter, taskRoadmapPage: 1 });
    });

    // SCR-006 mTRM 버전 셀렉트: 헤더 셀렉트는 비교 팝업을 먼저 띄우고(rmOnVer),
    // "상세조회" 패널의 셀렉트는 팝업 없이 즉시 전환(rmOnVerDirect) — v3.dc.html과 동일하게 분리
    $(document).on('change', '[data-action="rm-set-ver"]', function () {
      var toVer = Number($(this).val());
      var fromVer = state.rmVer === 0 ? 0 : 1;
      setState({ rmVerModal: { from: fromVer, to: toVer } });
    });
    $(document).on('change', '[data-action="rm-set-ver-direct"]', function () {
      var directVer = Number($(this).val());
      setState({ rmVer: directVer, rmVerModal: null });
      showToast(directVer === 0 ? '이전 버전(Ver. 0) 로드맵을 표시합니다.' : '현재 버전으로 돌아왔습니다.');
    });

    // SCR-006 mTRM 로드맵 바 hover 요약 팝오버 — v3.dc.html rmHoverEnter/rmHoverLeave(150ms 지연 닫기) 포팅
    var rmHoverTimer = null;
    $(document).on('mouseenter', '[data-action="rm-bar-enter"]', function () {
      clearTimeout(rmHoverTimer);
      var rect = this.getBoundingClientRect();
      var W = 520, vw = global.innerWidth, vh = global.innerHeight;
      var left = Math.min(Math.max(8, rect.left), vw - W - 8);
      var below = vh - rect.bottom;
      var showBelow = below >= 340 || below >= rect.top;
      var top = showBelow ? (rect.bottom + 6) : null;
      var bottom = showBelow ? null : (vh - rect.top + 6);
      var maxHeight = Math.max(220, (showBelow ? vh - top : rect.top) - 12);
      var styleStr = 'position:fixed;left:' + left + 'px;width:' + W + 'px;z-index:60;max-height:' + maxHeight + 'px;' +
        (showBelow ? 'top:' + top + 'px;' : 'bottom:' + bottom + 'px;');
      var li = Number($(this).data('lane')), bi = Number($(this).data('bar'));
      setState({ rmHover: { li: li, bi: bi, style: styleStr } });
    });
    $(document).on('mouseleave', '[data-action="rm-bar-enter"]', function () {
      clearTimeout(rmHoverTimer);
      rmHoverTimer = setTimeout(function () { setState({ rmHover: null }); }, 150);
    });
    $(document).on('mouseenter', '.rm-hover-panel', function () {
      clearTimeout(rmHoverTimer);
    });
    $(document).on('mouseleave', '.rm-hover-panel', function () {
      clearTimeout(rmHoverTimer);
      rmHoverTimer = setTimeout(function () { setState({ rmHover: null }); }, 150);
    });

    // 모달 오버레이 클릭 시 닫기 (모달 박스 자체 클릭은 버블링으로 걸러짐)
    $(document).on('click', '#modal-root.open', function (e) {
      if (e.target.id === 'modal-root') setState({ activeModal: null });
    });

    // GNB 패널: 메가메뉴 바깥(배경) 클릭 시 닫기 — 호버로 연 패널은 header mouseleave로 처리되므로
    // 여기서는 클릭으로 고정(pinned)된 패널의 바깥 클릭만 닫는다.
    $(document).on('click', '.gnb-backdrop', function () {
      setState({ gnbOpen: '', gnbPinned: false });
    });

    // 헤더 영역에서 마우스가 벗어나면 고정(pin)되지 않은 호버 패널을 닫음
    $(document).on('mouseleave', '#gnb-top', function () {
      if (!state.gnbPinned) setState({ gnbOpen: '' });
    });

    // Tech PR 상세 오버레이 바깥 클릭 시 닫기
    $(document).on('click', '.techpr-overlay', function (e) {
      if ($(e.target).is('.techpr-overlay')) setState({ techPrDetailIndex: null });
    });

    renderAll();
  });
})(window, jQuery);
