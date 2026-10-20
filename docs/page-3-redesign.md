# 3장 구도 다시 짜기 — 03 MENU & RECIPE (창 없는 부엌 벽 + 포스트잇 레시피)

**결정(2026-10-18):** 창을 뺀다. 왼쪽은 벽에 붙은 포스트잇 레시피, 오른쪽은 짧은 식탁 위 음식. 휴대폰 세워 보기를 같은 무게로 고려한다. 코드와 그림은 아직 그대로이고, 아래 프롬프트로 그림을 받은 뒤 적용한다.

**적용(2026-10-18):** 그림 6장을 받아 3장에 넣었다(`scripts/prepare-gpt-art.mjs page-3`, `src/story.ts`). 포스트잇 3장(`note-*-card`)과 벽의 '나만의 레시피' 띠(`header-recipe.png`, 벽 그림에 합성)는 브라우저에서 Nanum Pen Script 웹폰트로 그려 PNG로 저장했다. 실제 크기와 위치는 아래 표와 조금 다르다(식탁 3.3, 주스 0.7, 휴대폰 식탁·접시는 z≤3.25). 포스트잇은 웹에서 벽 판에 붙어 같이 접히고(`on:'back'`), 휴대폰에서는 벽 앞 한 줄로 선다.

## 왜 바꾸나

- 뒷벽 그림(`kitchen-back`)에 선반이 양옆으로 꽉 그려져 있고 그 앞에 책장 판(`kitchen-left/right`)이 또 서 있어서 겹친다. 포스트잇 둘 벽도 없다.
- 식탁이 6.4 폭으로 책 전체를 가로지르고 접시 7개가 앞뒤 두 줄로 겹쳐 있다.
- 휴대폰은 바닥 페이지 폭 4.75를 약 390px에 담아 크기 1.0이 약 70~75px이다. 지금 접시(0.6~1.1)는 45~80px라 작고 서로 가린다.
- 뒷벽은 휴대폰에서 좌우가 각각 약 13%씩 잘린다(`backdropCrop`). 가장자리 그림은 안 보인다.

## 새 구도

| | 웹 (펼친 책) | 휴대폰 (세워 보기) |
|---|---|---|
| 벽 | 회벽 + 조명 둘 + 오른쪽 윗벽 레일(그림). 창·선반 없음. 제목 '나만의 레시피'는 벽에 구워 넣음 | 같은 그림. 중앙 70%만 보임 |
| 레시피 | 왼쪽 책장 안 포스트잇 3장(라페·수프·피클). 벽 판 위에 올림 | 뒷줄에 한 줄, 각 1.45(약 100px), 벽 가까이(z≈.5) |
| 음식 | 오른쪽 책장 안 짧은 식탁 3.4, 접시 3개(1.3~1.5), 한 줄 | 앞줄 식탁 3.8, 접시 3개(1.2~1.7), 한 줄 |
| 장식 | 왼쪽 바닥 당근 바구니 | 바구니는 가운데 빈 바닥을 보고 정함 |
| 눌러지는 것 | 6개, 모두 한쪽 책장 안 | 6개 이하, 서로 겹치지 않음 |

- 포스트잇 종이·글자·핀·그림자는 **코드로 그린다**(손글씨 폰트, 약간 기울임). 제목('당근 라페')과 GPT가 그린 작은 먹선 그림(아래 4~6번)만 넣고 설명 문장은 상세 패널에 둔다.
- 기존 `dish-rape/soup/pickle`은 상세 패널 머리 그림으로 재사용한다.
- 짧은 식탁은 기존 `kitchen-table`을 3.4:1.56 비율로 잘라 쓸 수 있는지 먼저 본다. 어색하면 아래 3번으로 새로 받는다.
- 열린 문제: 휴대폰에서는 벽이 윗장에 인쇄돼서 포스트잇이 벽에 직접 붙지 못한다. 바닥에 세운 카드가 벽 앞에 서는 방식이라, 크기와 간격으로 붙은 것처럼 보이는지 직접 확인한다.

## GPT 이미지 프롬프트

### 공통 스타일 (모든 프롬프트 앞에 붙임)

```text
Vintage mid-century European pop-up book illustration, hand-painted gouache on thick matte card stock, rich layered colors,
visible brush texture and fine paper grain, warm natural palette (cream plaster, earthy browns, copper, carrot orange),
warm evening lamplight from above-left, cozy amber glow, detailed and grown-up storybook realism — not cute, not chibi,
not cartoon, no outlines, no text, no lettering, no signage words.
```

### 1. 뒷벽 — `kitchen-back.png` (1536×1024, 불투명)

> 기존 `kitchen-back.png`를 덮어쓴다. 기존 파일은 `_archive`로 옮겨 둔다.

```text
{공통 스타일} One flat, continuous full-bleed opaque backdrop of a warm Jeju home kitchen wall in the evening, no paper edge,
no border. A calm, wide cream-and-ochre plaster wall with soft brush-stroked texture and gentle warm light pooling from two
copper pendant lamps with glowing bulbs hanging from the top, one at about 30% and one at about 70% of the width. NO window,
NO shelves, NO furniture, NO door. In the upper right part only (between 58% and 92% of the width, at about 20% height), a
single wooden hanging rail with a few copper pans, a wooden ladle, a linen towel and bunches of dried herbs hanging from hooks.
Along the very bottom, a terracotta tile floor strip. The whole left half of the wall (0%–45% of the width) and the area
under the rail must stay quiet, clean plaster so paper notes can be placed there later. Keep every important shape inside
the middle 70% of the width; the outer 15% on each side is plain plaster only. The top 20% is plain wall and the bottom
15% is the floor strip, so they can be cropped. Nothing is drawn where a table would stand in front (the lower middle-right
third above the floor is plain plaster). No text anywhere.
```

### 2. 당근 바구니 — `kitchen-basket.png` (1024×1024, 투명)

```text
{공통 스타일} Isolated single die-cut piece, fully transparent background (PNG with alpha), no drop shadow, no border, edges
follow the silhouette, front-facing straight-on view. A wide woven wicker basket on the floor, filled with freshly pulled
Jeju carrots with feathery green tops spilling over the rim, a few loose carrots resting at its foot, a folded linen cloth
tucked at one side. The basket is low and broad (about 1.3 : 1, wider than tall), so it reads clearly even when small.
```

### 3. 짧은 식탁 — `kitchen-table.png` (1536×1024, 투명)

> 기존 `kitchen-table.png`를 덮어쓴다(기존 파일은 `_archive`로). 식탁은 가로 약 2.2 : 세로 1 비율로 아래 위에 투명 여백을 두면 가로로 잘라 쓴다. 기존 식탁을 잘라 써도 어색하지 않으면 이 그림은 건너뛴다.

```text
{공통 스타일} Isolated single die-cut piece, fully transparent background (PNG with alpha), no drop shadow, no border, edges
follow the silhouette, front-facing view. A short, sturdy rectangular wooden farmhouse table, seen nearly straight-on from
slightly above so a shallow band of the tabletop surface is visible, thick turned legs, a plain apron under the top, aged
walnut wood with visible grain, a linen runner with a thin red stripe laid lengthwise on the top, a few carrot leaves and
herb sprigs scattered on it. Compact proportions: the table is about 2.2 times wider than it is tall including the legs.
The tabletop surface is clear and uncluttered so dishes can stand on it later. It fills the full width of the canvas with
transparent space above and below.
```

### 4~6. 포스트잇 먹선 그림 3장 — `note-rape.png`, `note-soup.png`, `note-pickle.png` (각 1024×1024, 투명)

> 코드로 그리는 포스트잇 위에 올리는 작은 그림이다. 글자는 코드로 쓰므로 그림에는 글자가 없어야 한다. 3장 모두 같은 말투(같은 펜, 같은 굵기)로 받는다.

공통 문장 (다음 3개 앞에 붙임):

```text
A quick fine-liner ink sketch in dark sepia-brown on a fully transparent background (PNG with alpha), loose hand-drawn
pen lines with light cross-hatching and a touch of carrot-orange watercolor wash, like a cook's quick note in a recipe
notebook. No text, no lettering, no numbers, no paper, no border, no shadow. Centered, with generous empty margin around it.
```

- **라페** `note-rape.png`
  `A shallow bowl of finely shredded carrots piled high with a fork resting on the rim and a few parsley leaves.`
- **수프** `note-soup.png`
  `A small round pot with a ladle and a wisp of steam, a single whole carrot with leafy top leaning against it.`
- **피클** `note-pickle.png`
  `A tall lidded glass jar packed with carrot sticks standing upright, a few peppercorns and a bay leaf floating among them.`

## 받은 이미지를 넣는 방법

- **받을 파일 6개:** `kitchen-back.png`(덮어쓰기), `kitchen-basket.png`, `kitchen-table.png`(덮어쓰기, 선택), `note-rape.png`, `note-soup.png`, `note-pickle.png` — 모두 `art-src/gpt/page-3/`에 둔다.
- **여기서 할 일**
  - `scripts/prepare-gpt-art.mjs`에 `kitchen-basket`을 추가하고, `kitchen-back`의 `backdrop` 잘라내기 값을 새 그림에 맞춘다.
  - 포스트잇 4장(제목 포함)을 코드로 그려 WebP로 만들고, 제목 '나만의 레시피'를 벽 그림에 합성한다.
  - `src/story.ts`의 3장 레이어를 이 문서의 표대로 다시 짠다. 옆 책장 판(`rack-left/right`)과 `dish-rape/soup/pickle` 레이어는 뺀다.
  - 웹과 휴대폰 `phone` 위치를 둘 다 잡고, 휴대폰은 폭 약 390px 화면에서 눌러지는 사물이 모두 약 90px 이상인지 확인한다.
- 그림이 오기 전에는 같은 자리에 임시 색면 판을 세워 구도부터 확인할 수 있다.
