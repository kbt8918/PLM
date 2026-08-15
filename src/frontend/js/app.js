/*
 * PNDES 신규 메뉴 프로토타입 앱 상태 / 이벤트 위임
 * jQuery 이벤트 위임(data-action)으로 화면 전환·모달·간트뷰·기술동향 상세 탐색을 처리한다.
 * 실 연동 시 각 액션 핸들러 내부를 서버 API 호출로 교체합니다.
 */
(function (global, $) {
  'use strict';

  var render = global.PNDES.render;

  // FLOW-MAP(전체 프로세스 흐름도)은 기본적으로 GNB에서 숨깁니다. 화면설계서(sb-creator-kbt)
  // 캡처처럼 필요할 때만 URL에 ?showFlowMap=1을 붙이면 해당 세션에서만 노출됩니다.
  if (/[?&]showFlowMap=1(&|$)/.test(global.location.search)) {
    global.PNDES.FEATURE_FLAGS.showFlowMapInNav = true;
  }

  var state = {
    currentScreen: 'SCR-001', // 근거: design_handoff_생기포털/source/부품 공정 자동화 현황.dc.html activeView 기본값 'part-auto' — 최초 진입 화면은 통합 대시보드(DASH-AUTO)가 아니라 부품 공정 자동화 현황(SCR-001)
    activeModal: null,
    chartMode: 'summary', // SCR-008 통합 로드맵 차트 요약본/전체보기 토글
    expandedChartRoadmaps: [], // SCR-008에서 아코디언으로 펼쳐진 로드맵명 목록(여러 개 동시 펼침 유지)
    chartTaskDetail: null, // SCR-008 간트 막대 클릭 시 표시할 과제 상세 정보
    dashExpandedRoadmaps: [], // MTRM-MAIN 통합 로드맵 미니 간트에서 아코디언으로 펼쳐진 로드맵명 목록(SCR-008과 별개 상태)
    trendView: 'list',
    trendIndex: 0,
    trendSelectMode: false, // SCR-014 "수정" 버튼 클릭 시 카드에 선택 라디오 버튼을 노출하는 선택모드
    trendEditIndex: null, // 선택모드에서 라디오(카드) 클릭 시 수정 팝업에 채울 기술동향 인덱스
    dashTrendDetailIndex: null, // MTRM-MAIN "최근 기술동향" 항목 클릭 시 표시할 상세 팝업 인덱스
    videoProcess: null, // SCR-001 "현재=자동"/SCR-003 "기술현황=●" 클릭 시 자동화 설비 동영상 모달에 표시할 공정/작업명
    videoKind: 'part', // 동영상 모달 제목 접두어 구분: 'part'(부품) / 'module'(모듈)
    navSubOpen: { 'SCR-006': true }, // 하위 메뉴(SCR-006 -> SCR-007/008) 펼침 상태
    techPrDetailIndex: null, // SCR-009/MTRM-MAIN Tech PR 카드 클릭 시 표시할 커스텀 상세 오버레이 인덱스
    toast: null, // 화면 우상단(하단) 토스트 알림 메시지, showToast()로 세팅 후 일정 시간 뒤 자동 소멸
    masterPage: 1, // SCR-002 표준공정 마스터 관리 페이지네이션
    taskPage: 1, // SCR-004 모듈 표준 작업명 관리 페이지네이션
    ifPage: 1, // SCR-005 I/F 실행결과 관리 페이지네이션
    roadmapPage: 1, // SCR-006 통합 로드맵 페이지네이션
    taskRoadmapPage: 1, // SCR-007 상세과제 로드맵 관리 페이지네이션
    techPrPage: 1, // SCR-009 생산기술 Tech PR 페이지네이션
    techPrAdminPage: 1, // SCR-010 생산기술 Tech PR 관리자 페이지네이션
    mtrmPage: 1, // SCR-011 mTRM 협의체 페이지네이션
    mtrmMgmtPage: 1, // SCR-012 mTRM 관리 페이지네이션
    techTrendPage: 1, // SCR-014 기술동향 페이지네이션
  };
  var toastTimer = null;

  function setState(patch) {
    $.extend(state, patch);
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
    $('#gnb-top').html(render.gnbTop(state.currentScreen));
    $('#gnb-side').html(render.gnbSide(state.currentScreen, state.navSubOpen));
    $('#content').html(render.screen(state));

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
  }

  function selectScreen(id) {
    setState({ currentScreen: id, activeModal: null });
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
          setState({ activeModal: $el.data('modalId') });
          break;
        case 'close-modal':
          setState({ activeModal: null });
          break;
        case 'open-video':
          // SCR-001 "현재=자동" 배지 / SCR-003 "기술현황=●" 배지 클릭 -> 공용 동영상 모달
          setState({ activeModal: 'autoVideo', videoProcess: $el.data('process'), videoKind: $el.data('kind') || 'part' });
          break;
        case 'confirm-modal':
          // 등록/전송 등 모달 확인 버튼: 모달을 닫고 성공 토스트를 표시 (MODALS[id].successMessage 기반)
          setState({ activeModal: null });
          showToast($el.data('message'));
          break;
        case 'scr001-search':
          // 근거: onSearch — 부품 공정 자동화 현황 조회 버튼 클릭 시 토스트 알림
          showToast('필터 조건으로 조회가 완료되었습니다.');
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
        case 'toggle-nav-sub':
          var subId = $el.data('screenId');
          var navSubOpen = $.extend({}, state.navSubOpen);
          navSubOpen[subId] = !navSubOpen[subId];
          setState({ navSubOpen: navSubOpen });
          break;
        case 'open-techpr-detail':
          setState({ techPrDetailIndex: Number($el.data('index')) });
          break;
        case 'close-techpr-detail':
          setState({ techPrDetailIndex: null });
          break;
        case 'run-search':
          // 프로토타입 단계: 실 연동 시 조회조건 기반 API 호출로 교체
          break;
        case 'set-chart-mode':
          // 근거: setChartModeSummary/Full — 'full'일 때는 상세과제가 있는 모든 로드맵이 강제로 펼쳐진다.
          setState({ chartMode: $el.data('mode') });
          break;
        case 'toggle-chart-expand': {
          var category = $el.data('category');
          var idx = state.expandedChartRoadmaps.indexOf(category);
          var next = idx === -1
            ? state.expandedChartRoadmaps.concat([category])
            : state.expandedChartRoadmaps.filter(function (c) { return c !== category; });
          setState({ expandedChartRoadmaps: next });
          break;
        }
        case 'toggle-dash-roadmap': {
          var dashCategory = $el.data('category');
          var dashIdx = state.dashExpandedRoadmaps.indexOf(dashCategory);
          var dashNext = dashIdx === -1
            ? state.dashExpandedRoadmaps.concat([dashCategory])
            : state.dashExpandedRoadmaps.filter(function (c) { return c !== dashCategory; });
          setState({ dashExpandedRoadmaps: dashNext });
          break;
        }
        case 'open-chart-detail':
          setState({
            activeModal: 'chartDetail',
            chartTaskDetail: {
              category: $el.data('category'), manager: $el.data('manager'),
              status: $el.data('status'), progress: $el.data('progress'), period: $el.data('period'),
            },
          });
          break;
        case 'go-to-gantt':
          e.preventDefault();
          selectScreen('SCR-008');
          break;
        case 'trend-detail':
          setState({ currentScreen: 'SCR-014', activeModal: null, trendView: 'detail', trendIndex: Number($el.data('index')) });
          break;
        case 'toggle-trend-select-mode':
          setState({ trendSelectMode: !state.trendSelectMode });
          break;
        case 'select-trend-edit':
          setState({ activeModal: 'trendEdit', trendSelectMode: false, trendEditIndex: Number($el.data('index')) });
          break;
        case 'open-dash-trend-detail':
          setState({ activeModal: 'dashTrendDetail', dashTrendDetailIndex: Number($el.data('index')) });
          break;
        case 'trend-back':
          e.preventDefault();
          setState({ trendView: 'list' });
          break;
        case 'trend-prev':
          setState({ trendIndex: Math.max(0, state.trendIndex - 1) });
          break;
        case 'trend-next':
          setState({ trendIndex: Math.min(global.PNDES.data.trendsData.length - 1, state.trendIndex + 1) });
          break;
        case 'logout':
          e.preventDefault();
          // 프로토타입 단계: 실 연동 시 PNDES SSO(Azure/MPASS/PKI) 로그아웃 처리로 교체
          break;
        default:
          break;
      }
    });

    // 모달 오버레이 클릭 시 닫기 (모달 박스 자체 클릭은 버블링으로 걸러짐)
    $(document).on('click', '#modal-root.open', function (e) {
      if (e.target.id === 'modal-root') setState({ activeModal: null });
    });

    // Tech PR 상세 오버레이 바깥 클릭 시 닫기
    $(document).on('click', '.techpr-overlay', function (e) {
      if ($(e.target).is('.techpr-overlay')) setState({ techPrDetailIndex: null });
    });

    renderAll();
  });
})(window, jQuery);
