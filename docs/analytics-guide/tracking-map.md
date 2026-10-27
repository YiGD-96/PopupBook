# 추적 점검표 · 페이지별 추적 지도

2026-10-27 점검. 빌드한 사이트를 브라우저(PC 1440×900, 휴대폰 390×844)에서 실제로 눌러 보고, GTM이 받는 `dataLayer`에 무엇이 들어오는지 하나씩 확인했어요.

- 설정 방법: [README.md](README.md)
- 가져오기 파일: [gtm-container-popupbook.json](gtm-container-popupbook.json)

---

## 1. GTM 가져오기 파일 점검

| 항목 | 개수 | 확인 |
|---|---|---|
| 태그 | 2 | `Google 태그 - GA4 주소별 본편 테스트`: 모든 페이지, 자동 페이지뷰 끔<br>`GA4 이벤트 - 팝업북 전부 주소별 본편 테스트`: 아래 트리거 |
| 트리거 | 1 | `팝업북 이벤트 전부`: 사이트가 보내는 이벤트 22개와 이름이 정확히 일치 |
| 측정 ID 변수 | 3 | `lxwebzine.hankyung.com`이면 본편 G-RM4BJ9MT1R, 그 밖의 주소는 `GA4 측정 ID - 테스트` |
| 데이터 영역 변수 | 40 | 사이트가 실제로 보내는 정보 40가지와 1:1, 모두 이벤트 태그에 연결 |
| 기본 변수 | 2 | `Event`, `Page Hostname` (둘 다 사용) |

- **매개변수 수:** 이벤트 하나에 실제로 실리는 값은 많아야 12개예요. GA4 한도인 25개보다 적어요.
- **이전 값 섞임:** 앞 이벤트의 값(예: `content_id`)이 다음 이벤트에 남지 않게, 매번 비우고 보내요.

> 이 파일을 예전에 이미 가져왔다면, 이번에 `ui_id`, `story_scroll`, `scroll_percent`가 추가돼서 **한 번 더 가져오기(덮어쓰기)** 해야 해요.

---

## 2. 요소별 추적 확인

✅ = 실제로 눌러서 이벤트가 들어오는 것을 확인함

| 요소 (class) | 눌렀을 때 들어오는 이벤트 | 확인 |
|---|---|---|
| "책장 속으로" `.prologue-start` | `ui_click` + `prologue_start` | ✅ |
| 인트로 끝까지 재생 | `intro_complete` (화면 형태, 끊긴 프레임 수) | ✅ |
| 인트로 "건너뛰기" `.opening-skip-button` | `ui_click` + `intro_skip` | ✅ |
| 사용법 안내 | `guide_start` / `guide_done` | ✅ (시작) |
| 상단 "목차" `.top-pill` | `ui_click` + `about_open` | ✅ |
| 목차 안의 장 이동 버튼 | `ui_click` + `page_turn` (method `link`) | 코드 확인 |
| 목차 닫기 `.icon-button` | `ui_click` | ✅ |
| 언어 버튼 `.lang-switch` | `ui_click` + `language_change` (ko→en→zh→ko) | ✅ |
| 효과음 켜기/끄기 `.icon-toggle` | `ui_click` (`ui_state` 켜짐/꺼짐) | ✅ |
| 시작 영상 보기 켜기/끄기 `.icon-toggle` | `ui_click` (`ui_state`) | 코드 확인 |
| 로고(홈) `.brand` | `ui_click` + `story_link_click` (header) | 코드 확인 |
| 다음/이전 화살표 `.reader-next` `.reader-prev` (휴대폰 `.reader-down` `.reader-up`) | `ui_click` + `page_turn` (method `arrow`) | ✅ PC·휴대폰 |
| 키보드 ← → | `page_turn` (method `key`) | ✅ |
| 마우스 휠 | `page_turn` (method `wheel`) | ✅ |
| 손가락·마우스로 끌어 넘기기 | `page_turn` (method `drag`) | ✅ |
| 공유 링크로 들어옴 (`#cooks/cook-02`) | `page_turn` (method `link`) + `select_content` (source `link`) | ✅ |
| **3D 책 속 그림** (농부, 가게, 냉장고 메모, 레시피 책) | `select_content` (source `object`) | ✅ |
| 이야기 안의 "관련 이야기" 버튼 | `ui_click` + `select_content` (source `related`) | 코드 확인 |
| 이야기 창 다음/이전 쪽 `.wz-nav button` | `ui_click` (`content_id` = 보고 있는 이야기) | ✅ |
| 이야기 창 닫기 `.wz-close` `.detail-close` `.detail-book-close` | `ui_click` + `story_close` (열어 둔 시간, 가장 많이 내린 %) | ✅ |
| **이야기 안에서 아래로 내리기** (휴대폰 웹진 `.wz-sheet`, 포스터 북 `.pb-sheet`, 이야기 패널·책) | `story_scroll` 25·50·75·100% (한 번 열 때마다 각 1번) | ✅ 휴대폰 |
| 이야기를 연 채 창 닫기·떠나기 | `story_close` | ✅ |
| 쇼츠 재생 `.pb-shorts-cover` | `ui_click` + `shorts_play` | ✅ |
| 쇼츠 실제 시청 | `video_start` → `video_progress` 25·50·75 → `video_complete` / `video_pause` | ✅ (시작, 25%) |
| "YouTube에서 보기" | `ui_click` + `shorts_open` + `story_link_click` | 코드 확인 |
| 레시피 공유 시트의 메일·인스타그램 `.detail-sheet-link` | `ui_click` + `story_link_click` (outbound) | 코드 확인 |
| 마지막 장 도착 | `story_complete` (연 이야기 수) + `page_view` `#ending` | ✅ |
| "관련 기사 보기" `.ending-link` | `ui_click` + `story_link_click` (기사 주소) | ✅ |
| "처음으로" `.ending-restart` | `ui_click` + `restart` | ✅ |

"코드 확인"은 같은 경로(같은 리스너와 같은 함수)를 쓰는 다른 요소를 실제로 눌러 확인했고, 해당 요소는 코드에서 연결만 확인했다는 뜻이에요.

### 이번 점검에서 고친 것

| 문제 | 영향 | 고친 내용 |
|---|---|---|
| 영어·중국어 화면에서 `ui_label`이 번역된 글자로 기록됨 | 같은 버튼이 "다음 책장", "Next page", "下一页"로 나뉘어 집계됨 | `ui_label`을 한국어 원문으로 되돌려 보냄<br>언어와 상관없는 **`ui_id`**(버튼 고유 이름)를 새로 추가 |
| 드래그하다 놓쳤거나 막힌 키를 누른 뒤 화살표로 넘기면 `method`가 drag·key로 잘못 기록됨 | 넘기는 방식 통계가 틀어짐 | 화살표를 누르는 순간 `arrow`로 기록 |
| 이야기를 연 채 창을 닫으면 `story_close`가 없음 | 체류 시간이 빠짐 | 창을 닫거나 떠날 때도 기록 |
| `story_complete`의 "연 이야기 수"가 장 개수를 셈 | 링크로 연 이야기는 0으로 나옴 | 실제로 연 이야기 수(중복 제외)로 셈 |
| 쇼츠 "YouTube에서 보기" 링크 위치가 `page`로 기록됨 | 링크 위치 구분 불가 | `story`로 기록 |
| 인트로 "건너뛰기" 위치가 `page`로 기록됨 | 화면 영역 구분 불가 | `intro`로 기록 |

### 추적하지 않는 것 (일부러)

- **마우스 올리기(hover), 그림 위 커서 이동:** 이벤트가 너무 많아지고 쓸 데가 적어요.
- **책 화면 자체의 스크롤:** 3D 책 화면은 페이지가 스크롤되지 않아요. 내리는 동작은 이야기 창 안에서만 생겨서 `story_scroll`로 받아요.
- **쇼츠 플레이어 안의 버튼(전체 화면, 음량 등):** YouTube 화면 안이라 사이트에서 볼 수 없어요. 대신 재생·진행률·멈춤·완료는 YouTube API로 받아요.
- **일부 고정 문구의 `ui_label`:** "Watch the Short"처럼 번역 사전에 없는 문구는 그 언어 글자로 남아요. 이런 버튼은 **`ui_id`로 보면** 언어와 상관없이 하나로 모여요.

---

## 3. 페이지별 추적 지도

모든 이벤트에 **`book_chapter`**(지금 장), **`book_lang`**(언어), **`book_layout`**(phone·desktop), **`book_env`**(main·test), **`book_host`**(주소)가 붙어요.

### 0. 시작 (첫 화면 · 인트로 · 사용법 안내)

| 주소 | 들어오는 이벤트 |
|---|---|
| `…/team5/` (해시 없음) | `page_view` (첫 방문) |

| 독자 행동 | 이벤트 |
|---|---|
| 첫 화면에서 "책장 속으로" | `prologue_start` |
| 인트로 끝까지 보기 / 건너뛰기 | `intro_complete` (layout: open·standing) / `intro_skip` (remember: 다음에도 건너뛰기) |
| 사용법 안내 시작 / 완료 | `guide_start` / `guide_done` |
| 상단 언어·효과음·시작 영상·목차 | `ui_click` (`ui_area` settings·header), `language_change`, `about_open` |

**알 수 있는 것:** 진입률(첫 방문 대비 "책장 속으로"), 인트로 이탈률(건너뛰기 비율), 기기별 성능(끊긴 프레임)

### 1장. 구좌 당근, 맛의 시작 (`farmer`)

| 주소 | `#farmer`, 이야기를 열면 `#farmer/<이야기 ID>` |
|---|---|

| 누를 수 있는 그림 | `content_id` | 열리는 화면 (`ui_area`) |
|---|---|---|
| 농부 | `farmer` (당근밭에서 시작되는 이야기) | 웹진 책 (`webzine`) |
| 수확 | `harvest` (겨울을 견딘 단맛) | 웹진 책 |
| 밤 지킴이 | `night-watch` (농약 대신 랜턴과 파리채) | 웹진 책 |

**이벤트:** `page_view` → 그림 클릭 `select_content` → 웹진 쪽 넘김·닫기 `ui_click` (`ui_id` `wz-nav button`·`wz-close`) → 내려 읽기 `story_scroll`(25·50·75·100%) → `story_close`(체류 초) → 다음 장 `page_turn`

### 2장. 구좌 당근, 색다른 변신 (`cooks`)

| 주소 | `#cooks`, 이야기를 열면 `#cooks/<이야기 ID>` |
|---|---|

| 누를 수 있는 그림 | `content_id` | 열리는 화면 (`ui_area`) |
|---|---|---|
| 가게 1 | `cook-01` (당근 한 접시가 주인공이 되기까지) | 웹진 책 (`webzine`) |
| 가게 2 | `cook-02` (익숙한 재료로 새로운 맛을 만드는 법) | 웹진 책 |
| 가게 3 | `cook-03` (구좌의 계절을 식탁에 올리는 사람) | 웹진 책 |

관련 이야기로 `menu-01~03`, `recipe-01~03`이 열릴 수 있어요. 이때 `source`는 `related`이고, 이야기 패널(`story_panel`)로 열려요.

**이벤트:** `page_view` → `select_content` → 웹진 쪽 넘김 `ui_click` (`ui_id` `wz-nav button`, 라벨 "다음 쪽"/"이전 쪽") → 내려 읽기 `story_scroll`(25·50·75·100%) → `story_close` → `page_turn`

### 3장. 구좌 당근, 식탁 위의 발견 (`recipes`)

| 주소 | `#recipes`, 이야기를 열면 `#recipes/<이야기 ID>` |
|---|---|

| 누를 수 있는 그림 | `content_id` | 열리는 화면 (`ui_area`) |
|---|---|---|
| 냉장고 메모: 당근 뇨끼 | `poster-gnocchi` | 포스터 북 (`poster_book`) |
| 냉장고 메모: 당근 김밥 | `poster-gimbap` | 포스터 북 |
| 냉장고 메모: 당근전 | `poster-jeon` | 포스터 북 |
| 빈 메모 / "나만의 레시피" 책 | `recipe-share` | 레시피 공유 시트 (`story_panel`) |

| 포스터 북 안 행동 | 이벤트 |
|---|---|
| 아래로 내려 읽기 (휴대폰: 사진·쇼츠 → 포스터가 한 장으로 이어짐) | `story_scroll` (25·50·75·100%), 닫을 때 `story_close`의 `scroll_percent` |
| 쇼츠 재생 버튼 | `shorts_play` (story) |
| 쇼츠 시청 | `video_start` → `video_progress` (25·50·75%) → `video_complete` / `video_pause`<br>`video_title`, `video_percent`, `video_current_time`, `video_duration` 포함 |
| YouTube에서 보기 | `shorts_open` + `story_link_click` |
| 다른 레시피 버튼 | `select_content` (source `related`) |
| 레시피 공유 시트의 메일·인스타그램 | `story_link_click` (link_url `mailto:…` / instagram, outbound true) |

**알 수 있는 것:** 레시피별 인기, 쇼츠 재생률·완주율, 레시피 공유 참여(메일·인스타 클릭)

### 마무리 (`#ending`)

| 독자 행동 | 이벤트 |
|---|---|
| 3장에서 "여행 마무리" (화살표·드래그·휠·키) | `story_complete` (`stories_opened` = 연 이야기 수) + `page_view` `#ending` |
| "관련 기사 보기" | `story_link_click` (한국경제 기사 주소, `link_location` ending) |
| "처음으로" | `restart` (이후 다시 0단계부터) |

**알 수 있는 것:** 완독률(첫 방문 대비 마무리 도착), 기사 유입 수

---

## 4. GA4에서 보는 법 (예시)

| 알고 싶은 것 | 보고서 · 측정기준 |
|---|---|
| 장별 방문 | 이벤트 `page_view` × 페이지 제목 (또는 `book_chapter`) |
| 어느 장에서 떠나나 | `page_turn` × `from_chapter`, `to_chapter` |
| 인기 이야기·레시피 | `select_content` × `content_id` |
| 이야기 평균 체류 | `story_close` × `content_id`, 측정항목 `open_seconds` 평균 (맞춤 측정항목 등록) |
| **휴대폰에서 어디까지 내려 읽나** | `story_scroll` × `content_id`, `scroll_percent` (+ `book_layout` = phone)<br>예: 당근 김밥 포스터를 연 사람 중 100%까지 내린 비율 = `scroll_percent` 100 수 ÷ `select_content` 수 |
| 어떤 버튼이 많이 눌리나 | `ui_click` × `ui_id` (언어 무관), `ui_area` |
| 쇼츠 완주율 | `video_progress` × `video_percent`, `video_complete` 수 ÷ `video_start` 수 |
| 외국어 독자 | 모든 이벤트 × `book_lang` |
| 휴대폰 vs PC | 모든 이벤트 × `book_layout` |

`open_seconds`, `scroll_percent`, `video_percent`, `stories_opened`처럼 숫자로 평균이나 합계를 내려면 GA4 → 맞춤 정의 → **맞춤 측정항목**(단위: 표준)으로 등록해요. 나머지는 **맞춤 측정기준**으로 등록해요.
