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
    currentScreen: 'DASH-AUTO',
    activeModal: null,
    ganttView: 'summary',
    selectedParentRoadmap: 'body',
    trendView: 'list',
    trendIndex: 0,
    videoProcess: null, // SCR-001 "현재=자동"/SCR-003 "기술현황=●" 클릭 시 자동화 설비 동영상 모달에 표시할 공정/작업명
    videoKind: 'part', // 동영상 모달 제목 접두어 구분: 'part'(부품) / 'module'(모듈)
    navSubOpen: { 'SCR-006': true }, // 하위 메뉴(SCR-006 -> SCR-007/008) 펼침 상태
    techPrDetailIndex: null, // SCR-009/MTRM-MAIN Tech PR 카드 클릭 시 표시할 커스텀 상세 오버레이 인덱스
    toast: null, // 화면 우상단(하단) 토스트 알림 메시지, showToast()로 세팅 후 일정 시간 뒤 자동 소멸
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

  function selectScreen(id, roadmapId) {
    var patch = { currentScreen: id, activeModal: null };
    if (roadmapId) patch.selectedParentRoadmap = roadmapId;
    setState(patch);
  }

  $(function () {
    $(document).on('click', '[data-action]', function (e) {
      var $el = $(this);
      var action = $el.data('action');

      switch (action) {
        case 'select-screen':
          selectScreen($el.data('screenId'), $el.data('roadmapId'));
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
        case 'toggle-nav-sub':
          var subId = $el.data('screenId');
          var navSubOpen = $.extend({}, state.navSubOpen);
          navSubOpen[subId] = !navSubOpen[subId];
          setState({ navSubOpen: navSubOpen });
          break;
        case 'select-parent-roadmap':
          setState({ selectedParentRoadmap: $el.data('roadmapId') });
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
        case 'set-gantt-view':
          setState({ ganttView: $el.data('view') });
          break;
        case 'go-to-gantt':
          e.preventDefault();
          selectScreen('SCR-008');
          break;
        case 'trend-detail':
          setState({ currentScreen: 'SCR-014', activeModal: null, trendView: 'detail', trendIndex: Number($el.data('index')) });
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
