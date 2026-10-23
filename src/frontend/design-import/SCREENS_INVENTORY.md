# 생기포털 v3 화면·팝업 인벤토리

기준 파일: `생기포털 v3.dc.html` (소스 내 `<!-- VIEW: ... -->` 주석 기준). Claude Code는 이 목록을 체크리스트로 사용하세요.

## 화면 (VIEW)
| # | 화면 | 소스 상태값 |
|---|---|---|
| 1 | 메인 (포털 홈, My Job) | isTodoMain |
| 2 | 생기포털 메인화면 (메뉴구조) | isPortalMain |
| 3 | 생기/생산 부품·모듈 공정배치 관리 | isBpMgmt |
| 4 | 제품별 표준공정 마스터 | isSmStd |
| 5 | 표준 작업명 관리 마스터 | isSmWork |
| 6 | 부품공정배치 관리 (생기/생산) | isPpList |
| 7 | 모듈공정배치 관리 (생기/생산) | isMpList |
| 8 | [모듈] 공장별 현황 비교 | isModCmp |
| 9 | [부품] 공장별 현황 비교 | isPartCmp |
| 10 | 부품 공정 자동화 현황 | isPartAuto |
| 11 | 통합 로드맵 개요 (mTRM 통합로드맵) | isRoadmapOverview |
| 12 | 상세과제 로드맵 관리 | isRoadmapMgmt |
| 13 | 통합 로드맵 차트 | isRoadmapChart |
| 14 | mTRM 협의체 | isMtrmCouncil |
| 15 | mTRM 관리 | isMtrmMgmt |
| 16 | 기술과제 계획관리 | isTtPlan |
| 17 | 기술과제 관리 | isTechTask |
| 18 | 기술동향 (목록 + 상세) | isTechTrend |
| 19 | 생산기술 Tech PR 관리자 | isTechPrAdmin |
| 20 | 생산기술 Tech PR | isTechPr |
| 21 | 업무프로세스 가이드 | isGuide |
| 22 | 화면 와이어프레임 | isWireframe |
| 23 | 표준공정 마스터 관리 | isStdMaster |
| 24 | 메인 대시보드 | isMainDash |
| 25 | 모듈 공정 자동화 현황 | isModuleAuto |
| 26 | 모듈 표준 작업명 관리 | isModuleTask |
| 27 | I/F 실행결과 관리 | isIfResult |
| 28 | 기타 메뉴 공통 안내(준비중) | isFallback |

## 팝업 / 모달
| 소속 | 팝업 | 상태값 |
|---|---|---|
| 공통 | 메일알림 대상 검색 | mtIsOpen |
| 공통 | 이메일 공유 | emailModalOpen |
| 공통 | 동영상 팝업 | modalOpen |
| 부품 공정 자동화 | 공정 등록 | regModalOpen |
| 공정배치 | 공정배치 등록/상세 | bpModalOpen |
| 표준공정 마스터 | 표준공정 등록 | smPopOpen |
| 표준공정 마스터 관리 | 표준공정 등록/수정 | masterModalOpen |
| 부품공정배치 | 작성 팝업 | ppModalOpen |
| 모듈공정배치 | 상세 팝업 | mpModalOpen |
| 통합 로드맵 | 로드맵 등록 | roadmapModalOpen |
| 통합 로드맵 | 버전 변경 내용 | rmVerModalOpen |
| 상세과제 로드맵 | 상세과제 등록/수정 | taskRoadmapModalOpen |
| 로드맵 차트 | 과제 상세 / 과제 추가 | chartTaskDetail / chartAddModalOpen |
| mTRM 협의체 | 협의체 등록 | mtrmModalOpen |
| mTRM 관리 | mTRM 등록/수정, 기술태그 추가, 상세 과제, 업데이트 이력, 버전관리, 요약 | mtrmMgmtModalOpen / tagAddOpen / subTaskDetail / updHistOpen / versionMgmtOpen / mtrmSummaryOpen |
| mTRM 관리 | mTRM 정보 상세 | mmInfoDetailOpen |
| mTRM 관리 | 분과 신규등록/변경 | deptHeadOpen |
| mTRM 관리 | 조회 선택(협의체/연계 mTRM) | pickerOpen |
| 기술과제 계획관리 | 계획 상세 / 등록·수정 | ttModalOpen |
| 기술동향 | 등록 모달 | techTrendModalOpen |
| 메인 대시보드 | 최근 기술동향 상세 | dashTechTrendDetailOpen |
| Tech PR 관리자 | 자료 등록/수정 | techPrAdminModalOpen |
| Tech PR | 상세 / 연관과제 검색 / 기술 문의·제안 | techPrDetailOpen / lkOpen / techPrModalOpen |
| 모듈 표준 작업명 | 표준 작업명 등록 | taskModalOpen |

## 상단 메뉴 (GNB)
소스의 `GNB_MENUS` 상수와 `GNB_VIEW_OWNER` 매핑 참고. 화면이 연결되지 않은 메뉴는 클릭 시 "준비중" 안내가 뜹니다.

## 주의
- 28번 "화면 와이어프레임"과 21번 "업무프로세스 가이드"는 프로토타입용 참고 화면입니다. 서비스에 포함할지 확인이 필요합니다.
- 3번 "버전관리 팝업"은 코드에 있지만 현재 열 수 있는 버튼이 없습니다.
- 모든 목록·숫자는 샘플 데이터입니다.
