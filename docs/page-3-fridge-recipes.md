# 3장 냉장고 레시피 (3D캐릭터 웹진 콘텐츠)

3장에서 누를 수 있는 것은 **냉장고 하나**뿐(자석 메모 4장과 식탁 위 "나만의 레시피" 책은 그림). 냉장고를 누르면 `src/FridgeBook.tsx`가 열려, 팀의 3D캐릭터 웹진(`../3D캐릭터 웹진`)의 레시피 콘텐츠를 책 디자인(종이, Yeon Sung 손글씨 제목, Gamja Flower 메모, 폴라로이드 사진)으로 보여 줌.

## 데이터
- 출처는 웹진: `js/data.js`(재료 사전 34종, 레시피 15개, 필수/선택 재료, 확인된 대체 재료), `media/recipes/photo-*.webp`, `media/character/pony-full.webp`.
- `node scripts/import-zine.mjs` → `src/zine-data.json` + `public/media/zine/recipe-*.webp`(720px), `pony.webp`. 웹진을 고치면 이 스크립트를 다시 실행.
- 판정 규칙은 `src/zine.ts`에 TypeScript로 옮김(`evaluate`: 필수 재료만 비교, 0개 부족 → ① 지금 만들 수 있어요, 1~2개 → ②, 3개 이상 → ③ 접힘; 대체 재료는 레시피의 `subs`만). 웹진 NOTES의 검증 예(당근·달걀·밥·식용유·소금 → ① 달걀말이·달걀볶음밥)와 같은 결과.

## 화면과 링크 (웹진 페이지 이름을 그대로 유지)
| 링크 | 웹진 | 내용 |
|---|---|---|
| `#recipes/recipes` | recipes.html | 레시피 15가지, 종류(한 끼/반찬/간식)·맛 필터 |
| `#recipes/recipe-<id>` | recipe-<id>.html | 사진, 태그, 분량, 재료 체크(냉장고와 공유), 만드는 법, 팁, 쇼츠(원본 3개), 이어서 읽기 2개 |
| `#recipes/planner` | planner.html | 냉장고에 뭐가 있나요? 재료 고르기 → ①②③ 결과 |
- 예전 포스터 링크(`#recipes/poster-gnocchi` 등)는 그대로 열림. 원본 3개 레시피 상세에서 "그림 레시피 포스터로 보기"로도 이어짐.
- 왼쪽 쪽 아래 "나만의 레시피 보내기"는 레시피 모집 포스터(`recipe-share`)를 엶(휴대폰에서는 목록 맨 아래).
- 냉장고 재료·필터는 이 브라우저에 저장(`localStorage` `gujwa:fridge`).
- GTM 이벤트: `recipe_view`, `recipe_filter`, `fridge_search`, `fridge_clear`, `shorts_play`/`shorts_open`(story `recipe-<id>`).

## 옮기지 않은 것 (필요하면 다음에)
- 웹진의 "오늘 메뉴에 담기", 장보기 목록, "우리 아이에게 먼저 보여줄 한 접시는?" 고르기.
- 영어·중국어 번역(레시피 본문과 이 책의 문구는 아직 한국어로만 나옴).
- 15개 레시피의 검색용 구조화 데이터(seo.ts는 아직 기존 3개 포스터 기준).

## 휴대폰: 누를 곳 표시와 안내 (2026-11-04)
- 누를 수 있는 그림마다 웹진의 3D 당근(`public/media/zine/carrot.webp`, import-zine.mjs가 그림자까지 구워 넣음)이 그림 오른쪽 위에서 흔들리고 통통 뛰어요(`src/standingBook.tsx` TapCarrot). 그 그림의 이야기를 한 번 열면 사라지고, 이 브라우저에서는 다시 안 나와요(`src/tapHints.ts`, `localStorage` `gujwa:tapped`).
- 위아래 화살표는 화면 아래 32px(홈 표시줄 위)로 내림.
- 안내 2단계가 안 닫히던 버그: 1단계의 '미리보기' 표시가 풀리지 않아 2단계에서 탭을 무시했음 → 단계가 바뀌면 풀리게 고침. 2단계에서 위로 밀면 안내가 닫히고 다음 책장으로 넘어감(아래로 밀면 이전), 안내 위에서는 화면이 끌려가지 않게 `touch-action:none`.

## 2026-11-05 수정
- 휴대폰 당근 표시: 세게 흔들리고 뛰던 움직임을 살랑살랑(기울기 ±0.09rad, 2.4rad/s, 작은 위아래 흔들림)으로 바꿈 (`src/standingBook.tsx` TapCarrot).
- 안내 1단계: 누르면 비추던 카드의 진짜 이야기 창이 작게(84%) 화면 아래에서 반쯤 올라온 미리보기로 뜸 (`src/Guide.tsx` GuidePeek, 웹·휴대폰 공통). 실제로 열지는 않음(주소·분석·읽음 표시 없음). 화면 아무 곳이나 누르면 내려가고 2단계(책장 넘기기)로. 처음엔 진짜로 열었는데 화면을 다 덮어 닫기 어렵다는 의견으로 바꿈.
- 휴대폰 위아래 화살표: 화면 아래에서 14px(안전 영역 + 4px)로 더 내림 (`src/cinematic.css` .reader-vnav).
- 당근 표시: 1초에 한 번씩 좌우로 3번 흔들리고 멈춤 (책장을 펼칠 때마다 다시) — `SWAYS` in `src/standingBook.tsx`.
- 냉장고 레시피 책·포스터 책: X(또는 Esc)로만 닫힘. 책 옆을 눌러도 안 닫힘.
- 그림 레시피가 있는 뇨끼·김밥·치즈전: 만드는 법에 포스터(읽는 언어판)를 보여 주고, 제목 옆 `글로만 보기` ↔ `그림으로 보기`. 레시피 상세의 "그림 레시피 포스터로 보기" 버튼은 삭제. 글 단계는 `src/posters.ts`의 포스터 글을 그대로 씀 (`src/zine.ts` POSTER_OF) — 포스터를 바꾸면 posters.ts만 고치면 됨.
- 2p 가게 웹진(휴대폰): 메뉴 쪽 마지막 안내문과 본문 제목 사이에 구분선과 간격 추가 (`src/cinematic.css` `.wz-spread+.wz-spread`).
