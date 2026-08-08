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
    scr001SelectedVideo: null, // SCR-001: 공정별 상세 "현재" 자동 요소 클릭 시 자동화 설비 동영상 노출 대상 공정 no
  };

  function setState(patch) {
    $.extend(state, patch);
    renderAll();
  }

  function renderAll() {
    $('#gnb-top').html(render.gnbTop(state.currentScreen));
    $('#gnb-side').html(render.gnbSide(state.currentScreen));
    $('#content').html(render.screen(state));

    var modalHtml = render.modal(state);
    var $modalRoot = $('#modal-root');
    if (modalHtml) {
      $modalRoot.html(modalHtml).addClass('open');
    } else {
      $modalRoot.empty().removeClass('open');
    }
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
          var modalPatch = { activeModal: $el.data('modalId') };
          // SCR-001: 공정별 상세 "현재(자동)" 셀은 어떤 공정의 동영상을 열지 함께 전달
          if ($el.data('no') != null) modalPatch.scr001SelectedVideo = Number($el.data('no'));
          setState(modalPatch);
          break;
        case 'close-modal':
          setState({ activeModal: null });
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

    // SCR-007: 소속 통합 로드맵 변경
    $(document).on('change', '[data-role="parent-roadmap"]', function () {
      setState({ selectedParentRoadmap: $(this).val() });
    });

    renderAll();
  });
})(window, jQuery);
