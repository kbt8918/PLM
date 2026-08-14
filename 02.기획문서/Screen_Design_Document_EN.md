# Screen Design Document

**Project**: PLM PNDES Portal Enhancement — New Feature Development for Process Automation Status and Mid/Long-term Direction Sharing
**Date**: 2026-08-07
**Version**: v1.0
**Source Documents**: `02.기획문서/정보구조도.md` (Information Architecture, SCR-001~014), `02.기획문서/기능명세서.md` (Functional Specification, F-001~F-019)

> This project is a new menu addition within Hyundai Mobis' existing Production Technology Portal (PNDES) system. Mobile screens are therefore out of scope, and all screens are designed **PC-only (1920px, JQuery+HTML5 based on PNDES common UI standards)**. The "Platform" column uses only **PC User / PC Admin** among the V0.43 defaults (Mobile / PC User / PC Admin). Per CLAUDE.md guidance, "Related API" is replaced with the corresponding I/F-ID from `02.기획문서/API스펙.md` (I/F Design Spec, IF-001~IF-009).

---

## 1. Screen List

| Screen ID | Screen Name | URL | Platform | Related Feature ID | Related I/F | Priority |
|---|---|---|---|---|---|---|
| SCR-001 | Part Process Automation Status | /pndes/automation/part | PC User | F-001, F-002 | IF-001, IF-002, IF-006 | P0 |
| SCR-002 | Standard Process Master Management | /pndes/automation/std-process | PC Admin | F-003, F-004 | - | P0 |
| SCR-003 | Module Process Automation Status | /pndes/automation/module | PC User | F-005, F-006, F-008 | IF-003 | P0 |
| SCR-004 | Module Standard Task Name Management | /pndes/automation/std-task | PC Admin | F-007 | - | P0 |
| SCR-005 | I/F Execution Result Management | /pndes/automation/if-log | PC Admin | F-009 | IF-003 | P1 |
| SCR-006 | Integrated Roadmap Management | /pndes/mtrm/roadmap | PC User | F-010 | - | P0 |
| SCR-007 | Detailed Task Roadmap Management | /pndes/mtrm/roadmap/detail | PC User | F-011 | - | P0 |
| SCR-008 | mTRM Integrated Roadmap Dashboard (Gantt Chart) | /pndes/mtrm/dashboard | PC User | F-012 | - | P0 |
| SCR-009 | Production Technology Tech PR | /pndes/mtrm/techpr | PC User | F-013, F-014 | IF-004, IF-006, IF-008 | P0 |
| SCR-010 | Tech PR Administrator | /pndes/mtrm/techpr/admin | PC Admin | F-015 | IF-006 | P1 |
| SCR-011 | mTRM Council Management | /pndes/mtrm/council | PC Admin | F-016 | IF-004, IF-008 | P0 |
| SCR-012 | mTRM Management | /pndes/mtrm/manage | PC Admin | F-017 | - | P1 |
| SCR-013 | Technology Task Plan Registration (mTRM Linkage Area) | /pndes/mtrm/task-plan | PC User | F-018 | IF-007 | P0 |
| SCR-014 | Technology Trend List/Detail | /pndes/mtrm/trend | PC User | F-019 | IF-006 | P1 |

> Common to all screens: IF-005 (SSO Authentication) and IF-009 (Multi-language) apply cross-cutting (see Information Architecture Chapter 4). SCR-002/004/005/010/011/012 are admin-only screens.

---

## 2. Screen Details

### SCR-001. Part Process Automation Status

| Item | Content |
|---|---|
| URL | /pndes/automation/part |
| Platform | PC User |
| Access Rights | All users (view), Production Technology staff and above (registration/edit popup) |
| Related Features | F-001 (view), F-002 (register) |
| Related I/F | IF-001 (Part process layout linkage), IF-002 (Mid/long-term plan linkage), IF-006 (Attachments) |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Process Automation Status > Part Process Automation Status  [User][Logout]  |
+------------------------------------------------------------------------------------------+
|  Tabs: [ Part Process ] | Module Process                                                   |
+------------------------------------------------------------------------------------------+
|  Search Conditions                                                                         |
|  Product Group:[All v]  Product:[All v]  Region:[All v]  Plant:[All v]  Line:[All v] [Reset][Search]  |
+------------------------------------------------------------------------------------------+
|  Summary Status                                                                            |
|  +--------------------------------------------------------------------------------------+ |
|  | Category    | Auto.Rate | Auto/Total Proc. | Shift    | Total Staff | Headcount Sav.  | |
|  +--------------------------------------------------------------------------------------+ |
|  | Best Practice | 82%    | 41/50         | 3-shift  |    12       |    8 / 10       | |
|  | Overall Total | 65%    | 130/200       |   -       |    98       |   45 / 60       | |
|  | Plant A Line1 | 70%    | 28/40         | 2-shift  |    20       |    9 / 12       | |
|  | Plant A Line2 | 58%    | 22/38         | 2-shift  |    18       |    7 / 10       | |
|  +--------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------+
|  Process Detail                                             [+ Register Process]  [Excel][Email Share]  |
|  +--------------------------------------------------------------------------------------+ |
|  | NO | Process   | Best Practice(Process/Content) | Plant A L1 | Plant A L2 | Plant B L1 |  |
|  +--------------------------------------------------------------------------------------+ |
|  | 1  | Welding   | Applied auto welding case      |  ● Auto   | X Manual(reason) |  ● Auto   |  |
|  | 2  | Assembly  | Applied cobot case              |  ● Auto   |  ● Auto     | X Manual(reason)|  |
|  | 3  | Inspection| -                               |  X Manual  |  X Manual   |  ● Auto   |      |
|  +--------------------------------------------------------------------------------------+ |
|  [Click row for detail popup: Best Practice description + attached video/image playback]  |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Tabs | Tabs | Part Process / Module Process (navigates to SCR-003) | Click to switch tab |
| Search condition dropdowns | Dropdown x5 | Product Group/Product/Region/Plant/Line, dependent filtering on parent selection | Sub-dropdown options auto-refresh on selection |
| Search button | Button(primary) | Apply conditions | Click refreshes summary/detail tables |
| Summary Status table | DataTable(readonly) | Best Practice/Overall/Plant-Line comparison | Sortable, no row click |
| Process Detail table | DataTable | Process x Plant/Line matrix | Click cell (●/X) for detail popup, header sortable |
| Register Process button | Button(secondary) | Calls F-002 registration popup | Only visible to Production Technology staff and above (permission check) |
| Excel button | Button(secondary) | Download search results | Logs history on click (NFR-003) |
| Email Share button | Button(secondary) | Send email to person in charge | Opens recipient input modal on click |
| Registration/Edit popup | Modal | Input process name/BP designation/status/staff/attachment | Required field validation, attachment extension validation (IF-006) |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Data exists after selecting search conditions | Summary/detail tables displayed normally |
| Loading | Search request in progress | Skeleton in table area |
| Empty State | No aggregated data | "No data" + last sync time (based on IF-001 batch) notice |
| Condition Not Selected | Search clicked without required condition | Guidance message displayed, search blocked |
| Consistency Warning | Part process layout data mismatch (NFR-008) | Warning banner shown at top of detail popup |

---

### SCR-002. Standard Process Master Management

| Item | Content |
|---|---|
| URL | /pndes/automation/std-process |
| Platform | PC Admin |
| Access Rights | Production Planning Team (admin) — register/edit, All users — view/download |
| Related Features | F-003 (register/edit), F-004 (view/excel) |
| Related I/F | - |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Process Automation Status > Standard Process Master Mgmt   [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Plant:[All v]  Line:[All v]                                    [Reset][Search][Excel Download] |
+------------------------------------------------------------------------------------------+
|                                                          [+ Register Standard Process](Admin only) |
|  +--------------------------------------------------------------------------------------+ |
|  | No | Plant  | Line    | Standard Process Name | Seq | Note        | Manage(Admin only)   | |
|  +--------------------------------------------------------------------------------------+ |
|  | 1  | Plant A| Line1   | Welding    |   10    | -           | [Edit][Delete]             | |
|  | 2  | Plant A| Line1   | Assembly    |   20    | -           | [Edit][Delete]             | |
|  | 3  | Plant A| Line2   | Inspection    |   10    | New line     | [Edit][Delete]             | |
|  +--------------------------------------------------------------------------------------+ |
|                                          < Prev  1  [2]  3  ...  Next >                    |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Search conditions | Dropdown x2 | Plant/Line | Click [Search] after selecting |
| Excel Download button | Button(secondary) | Download list as Excel | Disabled when 0 results, logs download history |
| Register button | Button(primary) | Opens admin-only registration form | Not shown to non-admins |
| Master table | DataTable | Standard process list | Sortable, pagination |
| Edit/Delete | Button(small) | Row-level management | Admin only visible, blocks save on duplicate process name |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Data exists | Master list displayed |
| Empty State | No search results | "No registered standard processes", Excel button disabled |
| Duplicate Error | Attempt to register duplicate process name in same plant/line | Warning message in registration form |

---

### SCR-003. Module Process Automation Status

| Item | Content |
|---|---|
| URL | /pndes/automation/module |
| Platform | PC User |
| Access Rights | All users (view) |
| Related Features | F-005 (view), F-006 (display linkage result), F-008 (display standard task name) |
| Related I/F | IF-003 (Module process layout linkage) |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Process Automation Status > Module Process Automation Status  [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Tabs: Part Process | [ Module Process ]                Last Sync: 2026-08-07 03:00 (IF-003) |
+------------------------------------------------------------------------------------------+
|  ProductGroup:[Allv] Product:[Allv] Region:[Allv] Plant:[Allv] Line:[Allv]  Std.Task:[Allv] [Search]|
+------------------------------------------------------------------------------------------+
|  Plant Comparison Status                                                                   |
|  +--------------------------------------------------------------------------------------+ |
|  | Plant   | Module     | Standard Task   | Auto/Manual | Auto.Rate | Last Changed        |    |
|  +--------------------------------------------------------------------------------------+ |
|  | Plant A | Front Module | Bolt Fastening      | Auto      |  74%    | 2026-08-07 03:00      |    |
|  | Plant B | Front Module | Bolt Fastening      | Manual    |  74%    | 2026-08-06 03:00      |    |
|  | Plant A | Rear Module   | Wiring      | Auto      |  61%    | 2026-08-07 03:00      |    |
|  +--------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Last sync time badge | Text(badge) | IF-003 latest batch/event reflection time | Highlighted color on refresh (green if within 1 hour) |
| Standard task filter | Dropdown | F-008 standard task name list | Only "All" shown with notice if not registered |
| Plant comparison table | DataTable | Plant x Module x Task Name matrix | Sortable, default sort by latest change date |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Data exists | Comparison table displayed normally |
| Empty State | No search results | "No data" + last sync time notice |
| Consistency Check Failed | F-006 inconsistency found | Top warning banner + "admin confirmation needed" indicator |

---

### SCR-004. Module Standard Task Name Management

| Item | Content |
|---|---|
| URL | /pndes/automation/std-task |
| Platform | PC Admin |
| Access Rights | Production Planning Team (admin) |
| Related Features | F-007 |
| Related I/F | - |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Process Automation Status > Module Standard Task Name Mgmt  [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Process Type:[Allv]  Search:[Task name input        ] [Search]         [+ Register Std. Task Name]  |
+------------------------------------------------------------------------------------------+
|  +--------------------------------------------------------------------------------------+ |
|  | No | Standard Task Name | Process Type | Usage(Linked Module Count) | Registered  | Manage    | |
|  +--------------------------------------------------------------------------------------+ |
|  | 1  | Bolt Fastening    | Assembly      |          12           | 2026-01-10 | [Delete]          | |
|  | 2  | Wiring    | Wiring      |           8            | 2026-02-15 | [Delete]          | |
|  +--------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Register button | Button(primary) | New standard task name input modal | Duplicate task name validation |
| Usage column | Text(count) | Number of modules linked via SCR-003 (F-008) | Click for popup of linked module list |
| Delete button | Button(danger, small) | Delete task name | Confirmation modal with warning if usage>0 |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Data exists | List displayed |
| Deletion Block Warning | Attempt to delete a task name currently in use | "In use by N modules. Continue?" confirmation modal |
| Empty State | No search results | "No search results found" |

---

### SCR-005. I/F Execution Result Management

| Item | Content |
|---|---|
| URL | /pndes/automation/if-log |
| Platform | PC Admin |
| Access Rights | Production Planning Team (admin) |
| Related Features | F-009 |
| Related I/F | IF-003 |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Process Automation Status > I/F Execution Result Mgmt      [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Period:[Start]~[End]  I/F Type:[Allv]  Result:[Allv]                          [Search]     |
+------------------------------------------------------------------------------------------+
|  +--------------------------------------------------------------------------------------+ |
|  | Execution Time       | I/F-ID | Type   | Count | Result | Failure Reason      |      |
|  +--------------------------------------------------------------------------------------+ |
|  | 2026-08-07 03:00:12 | IF-003 | Batch   |  1,204  | Success   | -                  |       |
|  | 2026-08-06 03:00:08 | IF-003 | Batch   |    980  | Failed   | Source DB connection timeout |     |
|  | 2026-08-06 03:05:01 | IF-003 | Batch(Retry) |  980  | Success  | -                 |      |
|  +--------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Result filter | Dropdown | Success/Failed/All | Highlights notification target when filtering failures only |
| Execution result table | DataTable(readonly) | I/F execution history | Click a failed row for detailed error log popup |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | History exists | Execution result list |
| Empty State | No search results | "No execution history" |
| Failure Highlight | Failed entries exist | Result column shown with red badge |

---

### SCR-006. Integrated Roadmap Management

| Item | Content |
|---|---|
| URL | /pndes/mtrm/roadmap |
| Platform | PC User |
| Access Rights | Production Technology staff and above (register/edit), All users (view) |
| Related Features | F-010 |
| Related I/F | - |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > Integrated Roadmap Mgmt   [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Section:[Allv]  Status:[Allv]                                          [+ Register Roadmap]     |
+------------------------------------------------------------------------------------------+
|  +--------------------------------------------------------------------------------------+ |
|  | Section    | Roadmap Name          | Period              | Representative Task      | Status  | Revision History    | |
|  +--------------------------------------------------------------------------------------+ |
|  | Body    | Body Automation Roadmap | 2026.01~2028.12  | Welding Automation     | In Progress | [View History]  | |
|  | Assembly    | Assembly Automation Roadmap | 2026.03~2029.06  | Cobot Introduction  | Pending Approval | [View History]  | |
|  +--------------------------------------------------------------------------------------+ |
|                                                                    [View as Gantt Chart >]     |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Register button | Button(primary) | Roadmap registration form (section/period/rep. task/status) | Required field validation, error if period is inverted |
| Roadmap list | DataTable | Integrated roadmap list | Click row to go to Detailed Task Roadmap (SCR-007) |
| Revision History button | Button(small) | View version change history | Opens history timeline modal on click |
| View as Gantt Chart | LinkButton | Navigates to SCR-008 | Navigates to dashboard on click |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Data exists | Roadmap list |
| Input Error | Required field missing/period inverted | Error notice, requires re-entry |
| Empty State | No registered roadmap | "No registered integrated roadmaps" |

---

### SCR-007. Detailed Task Roadmap Management

| Item | Content |
|---|---|
| URL | /pndes/mtrm/roadmap/detail |
| Platform | PC User |
| Access Rights | Production Technology staff and above (register/edit), All users (view) |
| Related Features | F-011 |
| Related I/F | - |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > Detailed Task Roadmap Mgmt  [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Parent Roadmap: [Body Automation Roadmap v]                                [+ Register Detail Task]  |
+------------------------------------------------------------------------------------------+
|  +--------------------------------------------------------------------------------------+ |
|  | Task Name         | Owner | Period              | Progress |                              | |
|  +--------------------------------------------------------------------------------------+ |
|  | Welding Robot Introduction   | Hong**   | 2026.03~2026.09  | In Progress   | [Edit]                       | |
|  | Inspection Process Automation | Kim**   | 2026.06~2027.02  | Planned     | [Edit]                       | |
|  +--------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Parent roadmap select | Dropdown | Specify parent integrated roadmap (required) | Register button disabled if unspecified |
| Detail task registration form | Modal | Task name/owner/period/progress | Blocks save if parent roadmap not specified |
| Detail task table | DataTable | Task list | Sortable, colored progress status badge |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Data exists | Detail task list |
| Save Blocked | Parent roadmap not specified | "Please select a parent integrated roadmap first" |
| Empty State | No detail tasks | "No registered detail tasks" |

---

### SCR-008. mTRM Integrated Roadmap Dashboard (Gantt Chart)

| Item | Content |
|---|---|
| URL | /pndes/mtrm/dashboard |
| Platform | PC User |
| Access Rights | All users (view) |
| Related Features | F-012 |
| Related I/F | - |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > mTRM Integrated Roadmap Dashboard [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Section:[Allv]  Period:[2026v]~[2029v]  Status:[Allv]      View: ( )Summary  (o)Full View       |
+------------------------------------------------------------------------------------------+
|  +--------------------------------------------------------------------------------------+ |
|  |             2026.Q1  Q2  Q3  Q4 | 2027.Q1  Q2  Q3  Q4 | 2028.Q1  Q2 ...              | |
|  | Body Automation Roadmap  [====================]                                           | |
|  |  └ Welding Robot Introduction      [========]                                                     | |
|  |  └ Inspection Process Automation        [============]                                            | |
|  | Assembly Automation Roadmap          [========================]                               | |
|  +--------------------------------------------------------------------------------------+ |
|  (Highcharts Gantt component, click bar for detail popup, color = status distinction)         |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| View toggle | RadioGroup | Summary/Full view | Reconstructs Gantt data on selection (F-012) |
| Gantt chart | GanttChart(Highcharts) | Period bars + status colors | Click bar for detail popup, horizontal scroll for period navigation |
| Detail popup | Modal | Task detail info | Read-only, [Go to Detail Task Management] link (SCR-007) |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Data exists | Gantt chart rendered |
| Empty State | No search results | "No roadmaps found" |

---

### SCR-009. Production Technology Tech PR

| Item | Content |
|---|---|
| URL | /pndes/mtrm/techpr |
| Platform | PC User |
| Access Rights | All users (view/play/inquiry send) |
| Related Features | F-013 (grid view/play), F-014 (email send) |
| Related I/F | IF-004 (email), IF-006 (attachment), IF-008 (history) |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > Production Technology Tech PR [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Task:[Allv]  Section:[Allv]  Material Type:[Allv]                        [Ask/Suggest Technology]  |
+------------------------------------------------------------------------------------------+
|  +----------------+  +----------------+  +----------------+  +----------------+           |
|  | [Thumbnail/Play▶] |  | [Thumbnail/Play▶] |  | [Thumbnail/Play▶] |  | [Thumbnail/Play▶] |           |
|  | Welding Robot Intro   |  | Inspection AI Applied    |  | Cobot Use Case   |  | Wiring Automation     |           |
|  | Body Section        |  | Inspection Section       |  | Assembly Section        |  | Wiring Section       |           |
|  +----------------+  +----------------+  +----------------+  +----------------+           |
|  (Grid, infinite scroll/pagination)                                                          |
+------------------------------------------------------------------------------------------+
```

**Technology Inquiry/Suggestion Modal**

```
+-------------------------------------------+
|  Ask/Suggest Technology                  [X]  |
|  -----------------------------------------|
|  Target Material: Welding Robot Introduction                  |
|  Inquiry/Suggestion Content                            |
|  +---------------------------------------+|
|  |                                       ||
|  +---------------------------------------+|
|  -----------------------------------------|
|                        [Cancel]   [Send]     |
+-------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Material grid | CardGrid | Thumbnail + title + section | Click thumbnail for inline video playback (IF-006) |
| Inquiry/Suggestion button | Button(primary) | Opens email send modal | Auto-designates target material on click |
| Send button | Button(primary, modal) | Sends email to person in charge (IF-004) | Disabled guidance if person in charge not registered |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Materials exist | Card grid displayed |
| Playback Error | Unsupported format/playback failure | Guidance message + retry button |
| Send Failed | Email send failure | Error notice + retry |
| Empty State | No search results | "No registered materials" |

---

### SCR-010. Tech PR Administrator

| Item | Content |
|---|---|
| URL | /pndes/mtrm/techpr/admin |
| Platform | PC Admin |
| Access Rights | Production Planning Team (admin) |
| Related Features | F-015 |
| Related I/F | IF-006 |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > Tech PR Administrator      [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Task:[Allv]                                                          [+ Register Material]       |
+------------------------------------------------------------------------------------------+
|  +--------------------------------------------------------------------------------------+ |
|  | No | Title          | Task       | Owner | Attachment(Doc/Video)     | Registered  | Manage    | |
|  +--------------------------------------------------------------------------------------+ |
|  | 1  | Welding Robot Intro  | Welding Automation | Hong**   | 1 video          | 2026-07-01 | [Edit]  | |
|  +--------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Material registration form | Modal | Title/task/attachment/owner | Allowed extension validation (IF-006), reflects to SCR-009 immediately upon registration |
| Attachment upload | FileDropzone | Document/image/video | Error on size/extension exceeded |
| Material list | DataTable | Registered materials | Click row for edit form |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Upload Blocked | Attachment outside allowed extensions | "This file type is not allowed" |
| Default | Data exists | Material list |

---

### SCR-011. mTRM Council Management

| Item | Content |
|---|---|
| URL | /pndes/mtrm/council |
| Platform | PC Admin |
| Access Rights | Production Planning Team (admin) |
| Related Features | F-016 |
| Related I/F | IF-004, IF-008 |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > mTRM Council Mgmt         [User][Logout] |
+------------------------------------------------------------------------------------------+
|                                                                    [+ Register Council]          |
+------------------------------------------------------------------------------------------+
|  +--------------------------------------------------------------------------------------+ |
|  | Council Name       | Section | Agenda        | Target Section Head | Schedule        | Email Status |         |
|  +--------------------------------------------------------------------------------------+ |
|  | 26H1 Council | Body | Roadmap Review | Lee**        | 2026-08-20 | Sent      |         |
|  +--------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------+
```

**Registration Modal**

```
+-------------------------------------------+
|  Register Council                        [X]  |
|  -----------------------------------------|
|  Council Name * [                          ]  |
|  Section *     [Select            v]     |
|  Agenda       [                          ]  |
|  Target Section Head * [Select          v]     |
|  Schedule *     [YYYY-MM-DD]                  |
|  -----------------------------------------|
|                        [Cancel]   [Register]     |
+-------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Registration modal | Modal | Council information input | Blocks save if target section head not specified |
| Register button (in modal) | Button(primary) | Register + trigger email send (IF-004) | Sends email to section head on success, logs history (IF-008) |
| Council list | DataTable | Council list | Email status badge (Sent/Failed) |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Save Blocked | Target section head not specified | "Please specify a target section head" |
| Send Failed | Email send failure | "Send Failed" badge in list + resend button |

---

### SCR-012. mTRM Management

| Item | Content |
|---|---|
| URL | /pndes/mtrm/manage |
| Platform | PC Admin |
| Access Rights | Production Planning Team (admin) — CRUD, others — view only |
| Related Features | F-017 |
| Related I/F | - |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > mTRM Management            [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Search:[            ] [Search]                                          [+ Register mTRM](Admin) |
+------------------------------------------------------------------------------------------+
|  +--------------------------------------------------------------------------------------+ |
|  | No | mTRM Name       | Section | Status  | Registered  | Manage(Admin only)                     | |
|  +--------------------------------------------------------------------------------------+ |
|  | 1  | Body mTRM     | Body | Active  | 2026-01-05 | [Edit][Delete]                         | |
|  +--------------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| CRUD buttons | Button(small) | Register/edit/delete | Admin only visible, blocked at API level as well for unauthorized access |
| Deletion confirmation modal | Modal | Confirms linkage (F-018 linkage status) | Warning + reconfirmation when deleting items linked to other features |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Deletion Warning | Attempt to delete mTRM linked to Technology Task (F-018) | "This mTRM is linked to a technology task. Continue?" |
| No Permission | Non-admin attempts CRUD access | Buttons not shown + access blocked notice |

---

### SCR-013. Technology Task Plan Registration (mTRM Linkage Area)

| Item | Content |
|---|---|
| URL | /pndes/mtrm/task-plan |
| Platform | PC User |
| Access Rights | Production Technology staff, Management/Task managers |
| Related Features | F-018 |
| Related I/F | IF-007 (Technology Task Management System linkage) |

**Layout Structure**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > Technology Task Plan Registration [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Task Name * [                                    ]   Owner * [Select  v]                |
|  Plan Registration Date * [YYYY-MM-DD]                                                                 |
|  -------------------------------------- mTRM Linkage Area ------------------------------------ |
|  Linked mTRM Roadmap *  [Select                                    v]                 |
|  [Auto Mapping Result]                                                                          |
|  +--------------------------------------------------------------------------------------+ |
|  | Mapped Roadmap Name   | Mapped Detail Task        | Mapping Status                                     | |
|  +--------------------------------------------------------------------------------------+ |
|  | Body Automation Roadmap | Welding Robot Introduction        | Mapping Complete                                    | |
|  +--------------------------------------------------------------------------------------+ |
|                                                                    [Cancel]   [Register]          |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| mTRM Linkage Area | Section | Select linked roadmap and display auto mapping result | Auto-executes mapping via IF-007 on selection |
| Mapping result table | DataTable(readonly) | Mapped roadmap/task/status | "Confirmation needed" badge if mapping pending |
| Register button | Button(primary) | Confirm plan registration | Replies to Technology Task Management System on registration (IF-007) |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Mapping Pending | Linked mTRM roadmap deleted/absent | "Mapping pending — owner confirmation required" |
| Default | Mapping successful | "Mapping Complete" displayed |

---

### SCR-014. Technology Trend List/Detail

| Item | Content |
|---|---|
| URL | /pndes/mtrm/trend |
| Platform | PC User |
| Access Rights | Production Planning Team (register), All users (view) |
| Related Features | F-019 |
| Related I/F | IF-006 |

**Layout Structure (List)**

```
+------------------------------------------------------------------------------------------+  1920px
|  [PNDES Logo]  PNDES Portal > Mid/Long-term Direction Sharing > Technology Trend           [User][Logout] |
+------------------------------------------------------------------------------------------+
|  Type:[Allv: Global Trends/New Tech Materials/Tech Dev Proposals]  Tag:[      ]              [+ Register]    |
+------------------------------------------------------------------------------------------+
|  +----------------+  +----------------+  +----------------+  +----------------+           |
|  | [Thumbnail]        |  | [Thumbnail]        |  | [Thumbnail]        |  | [Thumbnail]        |          |
|  | Title A           |  | Title B           |  | Title C           |  | Title D           |          |
|  | Views 120       |  | Views 85        |  | Views 42        |  | Views 200      |          |
|  | 2026-07-01|Planning Team|Owner|#Automation |  |...             |  |...             |  |...      |          |
|  +----------------+  +----------------+  +----------------+  +----------------+           |
+------------------------------------------------------------------------------------------+
```

**Layout Structure (Detail)**

```
+------------------------------------------------------------------------------------------+  1920px
|  < Back to List                                              [< Prev]           [Next >]       |
+------------------------------------------------------------------------------------------+
|  Title A                                            Views 121 | 2026-07-01 | Planning Team/Owner|
|  Tags: #Automation #NewTech                                                                     |
|  --------------------------------------------------------------------------------------- |
|  [Body/Image/Video Preview Area]                                                          |
+------------------------------------------------------------------------------------------+
```

**UI Components**

| Component | Type | Description | Interaction |
|---|---|---|---|
| Card list | CardGrid | Title/views/date/dept/owner/tags/thumbnail | Click card to navigate to detail, view count +1 |
| Register button | Button(primary) | Planning Team-only registration form | Not shown to non-admins |
| Prev/Next navigation | Button x2 | Navigate to adjacent item within detail screen | Disabled on first/last item |

**Screen States**

| State | Condition | Display |
|---|---|---|
| Default | Data exists | Card list/detail displayed normally |
| Empty State | No search results | "No registered technology trends" |
| Navigation Boundary | First/last item | Corresponding direction button disabled |

---

## 3. Common Component Guide (PNDES Standard)

### 3.1 Search Condition Area Pattern

```
+------------------------------------------------------------------------------------------+
|  [Dropdown1] [Dropdown2] [Dropdown3] ...                          [Reset] [Search]           |
+------------------------------------------------------------------------------------------+
```
> Commonly applied at the top of search screens such as SCR-001, 003, 005, 006, 008, 011, 012, 013, 014. When a parent condition changes, sub-dropdown options are dependently filtered (Product Group→Product→Region→Plant→Line).

### 3.2 Registration/Edit Modal Pattern

```
+-------------------------------------------+
|  [Modal Title]                         [X]  |
|  -----------------------------------------|
|  [Required Field *] [Input Field]                  |
|  [Optional Field]   [Input Field]                  |
|  -----------------------------------------|
|                        [Cancel]   [Register/Save]|
+-------------------------------------------+
```

### 3.3 Status Badge Color Rules

| Status | Color |
|---|---|
| Success/Complete/Active | Green |
| In Progress/Pending | Blue/Orange |
| Failed/Error/Blocked | Red |
| On Hold/Confirmation Needed | Gray + warning icon |

### 3.4 Empty State

```
+-------------------------------+
|        [Guide Icon]           |
|    No data found     |
|    (Change conditions and search again)    |
+-------------------------------+
```

---

**Completion Status**: [x] Screen Design Document completed

**Approval**:
- [ ] Screen Design Document approval (User Sign-off)

## Reference Documents

- `02.기획문서/정보구조도.md` (Information Architecture; SCR-001~014, sitemap/user flow/permission classification)
- `02.기획문서/기능명세서.md` (Functional Specification; F-001~F-019)
- `02.기획문서/API스펙.md` (I/F Design Spec; IF-001~IF-009)
- `PRD.md` (Appendix C/D — original screen composition)

---

> This document is an English translation of `02.기획문서/화면설계서.md` (Korean original, v1.0, 2026-08-07). Screen IDs (SCR-xxx), feature IDs (F-xxx), and interface IDs (IF-xxx) are kept identical to the Korean source for cross-referencing. In case of any discrepancy, the Korean original is authoritative.
