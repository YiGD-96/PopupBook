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
