# 3장 부엌 v2 — 타일 벽 · 빨랫줄에 건 레시피 · 둥근 식탁

**결정(2026-10-18):** 지금 3장은 부엌 느낌이 없고 포스트잇이 따로 논다. 그래서 다시 짠다. 이 문서가 `page-3-redesign.md`를 대신한다. 그림이 오면 `scripts/prepare-gpt-art.mjs`, `src/story.ts`를 이 문서대로 바꾼다.

**적용(2026-10-19):** 그림 7장을 받아 3장에 넣었다(`scripts/prepare-gpt-art.mjs page-3`, `src/story.ts`). 포스트잇 3장은 새 종이 위에 제목·한 줄·먹선 그림을 브라우저(Nanum Pen Script 웹폰트)에서 얹어 `note-*-card.png`로 저장했다. 접시·냄비·주전자·바구니·식탁 발밑에는 접촉 그림자를 구워 넣었고(`shadow` 옵션, 카드가 그만큼 아래로 길어서 발 높이를 그 만큼 낮춰 잡음), 냄비 김 움직임은 아직 넣지 않았다. 휴대폰은 식탁 3.4, 접시 1.45 이하로 줄여야 종이 아랫부분이 덜 가려진다.

**수정(2026-10-19):** 왼쪽이 허전하고 식탁 위가 복잡하다는 지적으로, 냄비와 주전자를 식탁에서 내려 왼쪽 바닥(주전자·바구니·냄비)에 놓고 식탁에는 접시 3개만 간격을 벌려 놓았다. 휴대폰에서는 냄비와 주전자가 식탁 앞쪽(받침대 앞)에 선다.

## 무엇이 바뀌나

- **벽이 부엌이 된다.** 청록 타일, 구리 후드, 국자·냄비를 건 레일, 양념 선반, 말린 허브. 벽 그림에 "나만의 레시피" 띠는 넣지 않는다(이 문구는 이야기 패널과 안내 문장이 맡는다).
- **포스트잇이 벽의 빨랫줄에 걸린다.** 벽에 면줄이 가로로 지나가고, 종이마다 빨래집게가 달려 줄에 물려 있다. 종이는 벽과 같은 조명 아래 같은 붓 질감으로 그린다.
- **식탁이 둥글고 커진다.** 위에서 비스듬히 본 큰 타원 상판이 보여서, 음식이 상판 위에 선 것처럼 보인다. 접시 발밑에는 둥근 접촉 그림자를 코드로 넣는다.
- **식탁 위에 부엌 소품이 올라간다.** 김 나는 수프 냄비(김은 코드로 움직임), 주전자.

## 화면 구성

| | 웹 (펼친 책) | 휴대폰 (세워 보기) |
|---|---|---|
| 벽 | 타일·후드·선반·줄이 한 그림. 줄이 벽 전체를 가로지른다 | 같은 그림(중앙 70%만 보임) |
| 레시피 | 왼쪽 책장 안, 줄에 걸린 종이 3장 | 같은 줄에 걸린 종이 3장이 벽 앞에 한 줄로 선다 |
| 음식 | 오른쪽 책장 안 둥근 식탁 위: 대표 접시 · 주스 · 버거, 뒤쪽에 냄비와 주전자 | 앞줄 둥근 식탁 위에 같은 순서 |
| 바닥 | 왼쪽에 당근 바구니(기존 그림) | 앞쪽 왼쪽 모서리에 작게 |
| 눌러지는 것 | 6개 | 6개, 서로 겹치지 않음 |

- **줄의 높이:** 벽 그림에서 줄이 위에서 약 35% 되는 곳에 있어야 한다. 종이 윗변이 줄에 닿도록 휴대폰 종이 크기를 이 높이에 맞춘다.
- **눌러지는 사물은 한쪽 책장 안에만 둔다.** 둥근 식탁은 오른쪽 책장 안(가로 약 3.3)에 놓는다.
- 휴대폰에서는 식탁과 접시가 종이 아랫부분을 조금 가린다. 종이 제목과 그림은 위쪽에 둔다.

## 받을 그림 7장

| # | 파일 | 크기 · 배경 | 용도 |
|---|---|---|---|
| 1 | `kitchen-back.png` | 1536×1024 · 불투명 | 타일 벽 부엌(기존 파일은 `_archive`로) |
| 2 | `kitchen-table-round.png` | 1536×1024 · 투명 | 둥근 식탁 |
| 3 | `kitchen-pot.png` | 1024×1024 · 투명 | 수프 냄비(김 없이) |
| 4 | `kitchen-kettle.png` | 1024×1024 · 투명 | 주전자 |
| 5 | `note-paper-a.png` | 1024×1024 · 투명 | 노란 포스트잇(라페) |
| 6 | `note-paper-b.png` | 1024×1024 · 투명 | 레시피 인덱스 카드(수프) |
| 7 | `note-paper-c.png` | 1024×1024 · 투명 | 연두색 메모지(피클) |

모두 `art-src/gpt/page-3/`에 넣는다. 먹선 그림 `note-rape/soup/pickle.png`과 `kitchen-basket.png`, 접시 3개는 그대로 쓴다. 7장은 한 대화에서 이어서 받아야 같은 붓 질감이 나온다.

## 공통 스타일 (모든 프롬프트 앞에 붙임)

```text
Vintage mid-century European pop-up book illustration, hand-painted gouache on thick matte card stock, rich layered colors, visible brush texture and fine paper grain, warm natural palette (teal-green tile, cream plaster, copper, walnut wood, carrot orange), warm evening lamplight from above-left, cozy amber glow, detailed and grown-up storybook realism — not cute, not chibi, not cartoon, no outlines, no text, no lettering, no signage words, no numbers.
```

투명 그림(2~7번)에는 다음 문장도 붙인다.

```text
Isolated single die-cut piece, fully transparent background (PNG with alpha), no drop shadow on the background, no border, edges follow the silhouette.
```

## 프롬프트

### 1. 부엌 벽 `kitchen-back.png`

```text
{공통 스타일}
One flat, continuous full-bleed opaque backdrop: a straight-on view of one wall of a warm Jeju home kitchen in the evening, no paper edge, no border, no window, no door, no calendar, no frame.
The lower two thirds of the wall is covered in glossy teal-green and cream handmade subway tiles with slightly uneven edges and soft lamp reflections; above them is warm cream plaster.
A single taut cotton string runs horizontally across the wall at about 35% of the image height, from about 15% to 85% of the width, tied at each end to a small iron hook screwed into the wall; the string sags only slightly and casts a thin soft shadow on the wall. Nothing hangs from the left half of the string; on its right half hang three small bundles of dried herbs and a short strand of dried red chili peppers.
The whole left half of the wall below the string (0%–45% of the width) is quiet, clean tile and plaster lit by one copper pendant lamp hanging at about 28% of the width from the top, with a wide pool of warm light on the tiles, so paper notes can be hung there later.
The right half: at the top right a copper range hood with its chimney rising to the top edge (about 55%–78% of the width), and below it a wooden rail with a ladle, a whisk, a spatula and a copper pan hanging from hooks, and one open wooden shelf with a few glass jars of spices and two stacked ceramic bowls (about 68%–86% of the width, at about 55% of the height).
The bottom 20% of the image is just tile and plaster, because a table will stand in front of it.
Keep every important shape inside the middle 70% of the width; the outer 14% on each side is plain tile and plaster only. Deep warm vignette toward the corners. No text anywhere.
```

### 2. 둥근 식탁 `kitchen-table-round.png`

```text
{공통 스타일} {투명 문장}
A large round wooden kitchen table seen from slightly above (about 25–30 degrees), so its round top appears as a wide, clear ellipse about 2.4 times wider than it is tall and fills the full width of the canvas; a short sturdy central pedestal with three carved feet underneath, about half as tall as the ellipse. Aged walnut wood with visible grain and a few knife marks, a pale linen cloth runner laid across the middle with a thin red stripe, a few carrot leaves and herb sprigs scattered on the edge of the top. The tabletop surface is wide, open and uncluttered so dishes can stand on it later; the near rim of the tabletop shows its thick edge. The whole table is centered with transparent space above and below.
```

### 3. 수프 냄비 `kitchen-pot.png`

```text
{공통 스타일} {투명 문장}
A round enamel cooking pot in carrot orange with two black handles and its lid slightly ajar, set on a small wooden trivet, a wooden ladle resting across the rim, a few carrot tops tucked beside it. No steam is drawn at all (steam will be added later). Front-facing, slightly from above, compact and rounded so it reads clearly even when small.
```

### 4. 주전자 `kitchen-kettle.png`

```text
{공통 스타일} {투명 문장}
An old copper kettle with a curved spout and a black wooden handle, polished with warm lamp reflections and a few small dents, sitting on a small round wooden board. No steam is drawn. Front-facing, slightly from above, compact so it reads clearly even when small.
```

### 5~7. 포스트잇 종이 3종 (글자는 코드로 넣으므로 모두 비워 둠)

공통 문장:

```text
A single blank piece of paper hung from a string by a small wooden clothespin clipped at the top center; only a tiny piece of string passes through the top of the clothespin. The paper is nearly square, fills about 80% of the canvas, and hangs straight with a very slight natural curl at the lower corners and a soft contact shadow behind it. The whole surface is completely blank and clean so handwriting and a small drawing can be added later: no writing, no printed words, no stamps. Lit from above-left with the same warm lamp light as the kitchen wall.
```

- **A 노란 포스트잇** `note-paper-a.png`: `Butter-yellow sticky note paper with a faint adhesive strip at the top, soft handmade paper grain.`
- **B 레시피 카드** `note-paper-b.png`: `A cream index card with a thin red rule near the top and very faint pale-blue ruled lines across it, slightly worn corners and one tiny old grease stain at a corner.`
- **C 연두 메모지** `note-paper-c.png`: `Pale sage-green notepaper torn from a pad, with a fine perforated top edge and a slightly rough torn bottom edge.`

## 포스트잇 문구

종이 위에는 제목, 손글씨 한 줄, 작은 먹선 그림(`note-*.png`)을 코드로 얹는다. 한 줄은 12자 안팎이다.

| 종이 | 제목 | 한 줄 | 그림 | 열리는 이야기 |
|---|---|---|---|---|
| A 노란 포스트잇 | 당근 라페 | 입맛 없는 날, 새콤하게 | `note-rape.png` | `recipe-01` |
| B 레시피 카드 | 당근 수프 | 추운 저녁엔 따뜻하게 | `note-soup.png` | `recipe-02` |
| C 연두 메모지 | 당근 피클 | 두고두고 꺼내 먹는 맛 | `note-pickle.png` | `recipe-03` |

이야기 패널의 첫 문장도 같은 말투로 맞춘다.

## 받은 뒤 할 일

- **벽:** `kitchen-back`의 잘라내기 값을 새 그림에 맞추고(줄이 위에서 약 35%), `header-recipe` 합성을 뺀다. `header-recipe.png`는 쓰지 않는다.
- **종이:** 새 종이 위에 제목·한 줄·먹선 그림을 얹어 `note-*-card`를 다시 만들고, 줄 높이에 맞춰 걸린 위치를 잡는다(웹은 `on:'back'`으로 벽에 붙여 같이 접힘).
- **식탁:** 둥근 식탁을 오른쪽 책장 안에 놓고(가로 약 3.3), 접시 발이 타원 안쪽에 닿게 높이를 맞춘다. 접시와 냄비·주전자 밑에 둥근 접촉 그림자를 `prepare-gpt-art.mjs`에서 구워 넣는다.
- **냄비 김:** 가벼운 효과(투명도와 이동만)로 움직이고, 넣기 전후로 프레임을 재서 끊김이 없는지 본다.
- **휴대폰:** 종이 윗변이 줄에 닿는지, 식탁이 종이 아랫부분만 가리는지 확인하고 위치를 맞춘다. `tests/`의 3장 관련 테스트(접시 목록, 깊이 한계 z≤3.25, 카메라 안)도 같이 고친다.

## 적용 (v3 · 폰/웹 조정)
- 뒷벽은 `art-src/gpt/page-3/new/kitchen-wal.png`. 폰에서는 확대 없이 원본 비율에 가깝게(`kitchen-back-phone`, backdrop top 20 / bottom 824), 웹은 `kitchen-back`.
- 눌리는 것은 `note-carrot-burger`(레시피 상세 `recipe-burger`)와 `recipe-booklet`(참여형 `recipe-share`)뿐.
- 폰: 테이블 `{x:.1,z:2.7,size:[4.2,1.87]}`, 레시피 북 `{x:-1.5,z:3.15,size:[1.2,.829]}`로 앞쪽·크게. 웹: 테이블 `[3.6,1.603]`(20% 축소).
- 공유 채널(인스타/메일)은 `src/site.ts`의 `SHARE`에 넣으면 패널에 버튼이 생김(비어 있으면 "곧 열려요").

## 적용 (v4 · 2026-10-22)
- 뒷벽은 `art-src/gpt/page-3/kitchen-wall-910x360.png` 전체(웹 `[6.45,2.559]`). 폰도 같은 그림을 쓰고 양옆만 잘림(`kitchen-back-phone`은 더 쓰지 않음).
- 벽 판에 메모 4장을 한 줄로: 당근 뇨끼·당근 김밥·당근 치즈전(장식) + 빈 메모(`note-blank`, 누르면 `recipe-share`). 예전 메모 6장은 벽에서 뺐고, 그림 파일은 구조화 데이터(`src/seo.ts`)용으로 남김.
- 폰: 테이블 `{x:.45,z:3.05,size:[3.5,1.626]}`로 책 안에 들어오게, 레시피 북 `{x:-1.6,z:3.2}`로 테이블 앞에 보이게.
- 엔딩의 "웹진에서 이어 읽기"는 "관련 기사 보기"(`SITE.article`, 한국경제 기사)로 바뀜.
- 레시피 포스터(2026-10-22): 뇨끼·김밥·당근전 메모를 누르면 `src/PosterBook.tsx`가 열림. 오른쪽 쪽은 언어별 포스터(웹: 2:3 쪽에 여백 없이 꽉 차서 스크롤 없음, 폰: 사진 자리와 포스터가 한 쪽으로 이어져 통째로 스크롤; `public/media/posters/{gnocchi,gimbap,jeon}-{ko,en,zh}.webp`, 원본 `art-src/gpt/page-3/new/poster` → `node scripts/prepare-posters.mjs`)를 안에서 스크롤, 왼쪽 쪽은 실사 사진·영상 자리. 사진이나 영상은 `src/posters.ts`의 `media`에 넣으면 빈 틀 대신 나옴. 언어는 오른쪽 위 언어 선택을 따름(책 안 언어 버튼은 없앰). 웹 메모는 책 가운데 접힘에서 0.12 이상 떨어져야 해서(테스트) 폭 .72로 조금 줄임.

## 적용 (v5 · 2026-10-22 오후) — 냉장고 부엌
- 그림: `art-src/gpt/page-3/new/new2` → `prepare-gpt-art.mjs page-3`. 뒷벽 `jeju-kitchen-wall-high-resolution`(창 너머 바다), 왼쪽 쪽 냉장고 `kitchen-fridge`(front-fridge-with-plant-wider), 오른쪽 앞 낮은 식탁 `kitchen-table-low`(simple-table-no-book), 식탁 왼쪽 끝 `my-recipe-book`.
- 냉장고 문에 자석 메모 4장(2×2, `on:'fridge'`): 뇨끼·김밥 위, 치즈전·빈 메모 아래. 뇨끼/김밥/치즈전 → 포스터 책, 빈 메모와 레시피 책 → `recipe-share`.
- 웹: 냉장고 `[-2,.186,.3]` 1.3×2.909, 식탁 `[1.75,.156,1.6]` 2.7 폭, 책 `on:'table'` `[.95,1.1,1.66]`.
- 폰: 냉장고 `{x:-1.4,z:1.4}` 1.35×3.02, 자석 lift 2.04/1.56, 식탁 `{x:.6,z:2.75}` 2.9 폭, 책 `{x:-.15,z:2.81,lift:.67}`.
- 수정(같은 날): 벽 그림 교체(1445×1088). 웹은 전등 줄 아래(104px)부터 타일 띠까지 `kitchen-back` {top:104,bottom:700} → 6.45×2.67, 폰은 맨 위부터 `kitchen-back-phone` {top:0,bottom:756}(폰 세운 쪽 비율 1.91). 웹 냉장고 1.5×3.356(자석 .53), 레시피 책 `[1.4,.74,1.7]`(식탁 안쪽·앞). 폰 냉장고 1.55×3.467(자석 .54, lift 2.41/1.87), 식탁 2.3 폭 `{x:.9,z:2.8}`, 책 `{x:.3}`. 냉장고를 더 키우면 카메라 테스트(웹·폰 모두)가 깨짐 — 지금 크기가 거의 한계.
- 수정 2(같은 날): 웹 냉장고 `[-1.93,.164,1.55]` 1.64×3.669 — 발이 왼쪽 쪽 인쇄 제목 바로 뒤, 꼭대기가 장 제목 점 바로 아래(이보다 크면 제목을 가림; 프라이팬까지 채우려면 폭 ≈2.4·높이 ≈5.4라 화면보다 큼). 자석 .56, 웹 식탁 z 1.2·책 z 1.3. 카펫: `scripts/kitchen-rug.mjs`(땋은 타원 러그) — 웹은 `create-pages.mjs 2`로 오른쪽 쪽에 인쇄, 폰은 `stage:'kitchen-floor-stage'`(prepare-gpt-art). 폰 벽 `kitchen-back-phone`은 그림 전체(위→아래)를 왼쪽 550px·오른쪽 46px 거울 복사로 1.91:1까지 넓혀 확대감 최소화. 폰 냉장고 z 2.2, 자석 .5(간격 넓힘, lift 2.51/1.77), 책 .95.
- 테스트 `book-view`: 붙은 카드(`on`)는 부모의 경첩을 따라 움직이도록(앱의 GluedCard와 같게) 고침 — 전에는 자기 높이에서 따로 접히는 것으로 계산해 냉장고 위 자석이 거짓으로 걸림.
- 수정 3(같은 날): 벽을 `jeju-kitchen-dish-shelf-high-resolution`(타일 위 그릇 선반)으로 교체. 웹 {top:106,bottom:775} → 6.45×2.992 — 웹 벽은 높이 3.0이 한계(더 크면 책장 넘길 때 화면 밖, 멈춰 있을 때 장 제목에 닿음)라 선반 받침대는 잘림. 폰은 전체+거울 확장 그대로. 웹 냉장고 x -1.65. 자석 메모 지그재그(왼·오·왼·더 오른쪽), 웹 .72·폰 .66, 앞 두 장은 모서리 겹침, 뒤 메모일수록 z +.01. 폰 냉장고 1.75×3.915 `{x:-1.2,z:2.2}`, 식탁 1.8 `{x:1.25,z:2.8}`, 책 .95 유지 `{x:.85,lift:.4}`, 러그 {cx:1103,rx:320,ry:110}.
- 수정 4(같은 날): 웹 벽 {top:0,bottom:660}(전등 줄 전체 ~ 그릇 바로 위) → 6.45×2.952. 바닥 러그를 `ivory-terracotta-rectangular-rug.png`로: `scripts/kitchen-rug.mjs`가 원근 그림을 위에서 본 직사각형으로 펴고(호모그래피) 테두리 두께를 유지한 채 늘림(9-slice). 웹은 오른쪽 쪽 {x:26,y:494,w:559,h:188}(쪽 단위, 가로로 길게), 폰은 stage {x:884,y:380,w:438,h:670}(px, 깊이 방향으로 길게). 웹 책 1.1×.801 `[1.45,.7,1.3]`. 폰 냉장고 x -1.05(자석도 +.15).
- 수정 5(같은 날): 러그를 더 크게·두께감 있게(앞쪽 가장자리에 어두운 파일 두께 띠, 안쪽 빛 그라데이션, 앞으로 더 퍼지는 그림자) — 웹 {x:26,y:458,w:577,h:227,thick:10}(쪽 단위), 폰 {x:784,y:274,w:639,h:760,thick:18}(px). 식탁을 러그 안쪽으로: 웹 z 1.0(책 1.1), 폰 z 2.55(책 2.61). 러그 색은 주황·갈색만(`recolour`: 아이보리 바탕 → 주황, 테라코타 테두리 → 진한 갈색, 그림의 명암 유지). 웹 벽 그림을 위로 밀어 {top:40,bottom:700} — 냄비 뚜껑 끝(669px)은 식탁 뒤에 가려짐.
- 수정 6(같은 날): 러그를 `natural-beige-thick-rug.png`로 교체(윗면 모서리 QUAD [[276,168],[1499,168],[1747,718],[29,718]], 원래 색 그대로 — 주황 재색은 꺼 둠 `RECOLOUR=false`).
- 포스터 책 왼쪽 쪽(스크랩북): 위 "직접 만들어 본 한 접시와 만드는 과정", 왼쪽에 유튜브 쇼츠(9:16 휴대폰 모양 틀, YouTube 썸네일+재생 버튼 → 누르면 youtube-nocookie 플레이어 로드, 아래 "YouTube에서 보기"), 오른쪽에 테이프 붙은 폴라로이드 실사 사진(+ 한 줄). 데이터는 `src/posters.ts`(`shorts` 영상 id — 지금은 세 요리 모두 임시 j4WDQC1tTyI, `photo`, `caption` 3개 언어). 사진: `…_실사.png` → `prepare-posters.mjs` → `public/media/posters/photo-*.webp`. 재생 시 GA 이벤트 `shorts_play`.
- 수정 7(같은 날): 러그 삭제. 바닥은 `honey-oak-floor-only.png` 마루 — `scripts/kitchen-floor.mjs`가 원근 그림을 위에서 본 판자로 펴서(QUAD 먼쪽 모서리를 안쪽 [287,142]/[1528,142]로 잡아야 판자가 곧게 나옴) 1·2장처럼 두 쪽 전체에 인쇄(`create-pages.mjs` FLOORS[2]), 인쇄 글자 아래는 종이색으로 반쯤 밝게(완전히 지우면 나무 위 얼룩처럼 보임). 폰 바닥 stage도 같은 마루. 폰 식탁 2.1×1.202 `{x:1.0,z:2.55}`, 책 `{x:.55,lift:.47}`. `scripts/kitchen-rug.mjs` 삭제.
- 수정 8(같은 날): 냉장고 그림을 `fridge-with-plant-wider-base.png`로(앞으로 쏠려 보이던 것 해결, 비율 .465) — 높이는 그대로, 폭만 웹 1.706·폰 1.82. 웹 마루는 판자를 좁게(`oakFloor` `boards:26`): 펴낸 판자 가운데의 곧은 부분을 판자 틈에서 잘라 옆으로 반복, 쪽 깊이 전체로 늘림(판자도 길어짐). 폰 마루는 그대로(그림 한 장을 덮어 깔기).
- 수정 9(같은 날): 냉장고·식탁 그림자를 단순하게 — 다리 모양을 따라가던 `cast` 그림자 대신 발밑에 굽는 `shadow`: 냉장고는 부드러운 네모(`shape:'rect'`, 몸통 가운데 `cx:.537`), 식탁은 부드러운 타원. 카드 크기: 웹 냉장고 1.706×3.693(발 y .144), 폰 1.809×3.915(폰 카메라 한계), 식탁 2.7×1.563(발 y .14)·폰 2.1×1.215.
