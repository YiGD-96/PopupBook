# 2·3장 컨셉 초안과 GPT 이미지 프롬프트

1장(해질녘 당근밭)과 같은 방식이다. 판마다 GPT로 그림을 만들어 PNG로 받는다. 투명 배경이고 배경판만 불투명이다.

- 넣을 곳: `art-src/gpt/page-2/`, `art-src/gpt/page-3/`
- 받은 뒤 여기서 할 일: `scripts/prepare-gpt-art.mjs`로 오림 테두리를 두르고 WebP로 바꾼 다음, 위치·크기를 잡는다(웹과 휴대폰 세워 보기 둘 다).

세 장의 시간대를 다르게 해서 넘길 때마다 분위기가 바뀌게 했다.

| 장 | 시간대 | 빛 |
|---|---|---|
| 1장 | 해질녘 밭 | 주황·보라 노을 |
| 2장 | 늦은 오전 바닷가 마을 | 청록 바다, 밝은 해 |
| 3장 | 저녁 부엌 | 따뜻한 등불 |

시간대는 바꿔도 된다. 바꾸면 공통 스타일의 빛 문장만 고치면 된다.

**누르는 사물은 모두 한쪽 책장 안에만 둔다.** 표의 위치가 그렇게 잡혀 있다. 좌표는 펼친 책 기준이고(가로 −3.55~3.55, 깊이 −2.3~2.3), 1장처럼 큼직하게 채우는 구도다.

## 공통 스타일

1장과 같은 문장이다. 빛 문장만 장마다 바꾼다.

```text
Vintage mid-century European pop-up book illustration, hand-painted gouache on thick matte card stock, rich layered colors,
visible brush texture and fine paper grain, warm natural palette, {LIGHT}, detailed and grown-up storybook realism —
not cute, not chibi, not cartoon, no outlines, no text, no lettering, no signage words. Front-facing straight-on view of a single
standing die-cut piece.
```

- 2장 `{LIGHT}`: `bright late-morning sunlight from the left with crisp soft shadows, turquoise sea and whitewashed walls, carrot orange accents`
- 3장 `{LIGHT}`: `warm evening lamplight from above-left, cozy amber glow, deep blue dusk outside the window, carrot orange accents`

### 판마다 붙일 기술 조건

- **배경판을 뺀 나머지:** `isolated single die-cut piece, fully transparent background (PNG with alpha), no drop shadow, no border, edges follow the silhouette`
- **배경판:** `one flat, continuous full-bleed opaque backdrop, no paper edge, no border; keep important shapes in the middle horizontal band; the top 25% is quiet sky or wall and the bottom 15% is quiet ground or floor so they can be cropped`
- **해상도:** 1024×1024, 1536×1024, 1024×1536 가운데 비율에 가까운 것.

---

## 2장 — 02 PEOPLE WHO COOK · 구좌를 맛보는 다채로운 방식

**장면.** 늦은 오전, 구좌 바닷가 마을 골목이다(평대·세화 같은 해안 마을).

- 뒤로는 청록 바다와 낮은 집들, 멀리 오름이 보인다.
- 골목을 따라 구좌 당근으로 요리하는 식당 세 곳이 있다.
- 양옆의 팽나무와 동백나무가 무대 막처럼 감싸고, 앞에는 밭담과 당근 상자를 실은 손수레가 있다.

식당 이름과 간판은 아직 정해지지 않았다(웹진 원고 대기). 그래서 글자 없는 외관으로 구분한다.

| # | 판 | 파일 이름 | 위치 x / 깊이 z | 크기(가로×세로) | 누름 |
|---|---|---|---|---|---|
| 1 | 바닷가 마을 배경 | `village-back.png` | 0 / −1.7 | 6.9 × 2.7 | – |
| 2 | 팽나무 (왼쪽 앞, 장면 감쌈) | `village-tree-left.png` | −2.5 / 1.75 | 2.0 × 3.0 | – |
| 3 | 동백나무 (오른쪽 앞) | `village-tree-right.png` | 2.55 / 1.75 | 1.8 × 2.6 | – |
| 4 | 돌담 골목 띠 | `village-lane.png` | 0 / 0 | 6.8 × 1.5 | – |
| 5 | **식당 A** — 현무암 돌집을 고친 식당 | `shop-a.png` | −1.75 / −0.6 | 2.2 × 1.8 | 식당 A 이야기 |
| 6 | **식당 B** — 흰 벽 카페, 큰 창 | `shop-b.png` | 1.6 / −0.7 | 2.2 × 1.8 | 식당 B 이야기 |
| 7 | **식당 C** — 나무 비스트로, 앞치마 두른 요리사 | `shop-c.png` | 1.2 / 0.9 | 1.7 × 1.6 | 식당 C 이야기 |
| 8 | 여행자 (배낭, 지도) | `char-traveler.png` | −1.0 / 0.9 | 0.8 × 1.6 | – |
| 9 | 앞 밭담 + 당근 상자 실은 손수레 | `village-front.png` | −0.3 / 1.5 | 3.0 × 0.9 | – |

### 2장 판별 프롬프트

1. **배경** (1536×1024)
   `Wide panoramic view of a Gujwa seaside village on Jeju Island in late morning: a turquoise and emerald sea with white surf on black lava rocks, low whitewashed and basalt-stone houses with colorful tin roofs (teal, red, orange), a few wind turbines standing in the shallow sea, a soft green volcanic cone (oreum) far behind, a clear blue sky with small white clouds.`
2. **팽나무 왼쪽** (1024×1536)
   `A large old Jeju village hackberry tree (paengnamu) with a broad twisted trunk and spreading branches, light green winter-bare and leafy mix, a small black basalt wall around its roots, painted as a tall standing cut-out; dense trunk on the LEFT, branches reaching to the right with open space along the right edge.`
3. **동백나무 오른쪽** (1024×1536)
   `A dense Jeju camellia tree in bloom with glossy dark green leaves and many red camellia flowers, a few fallen petals at its base, painted as a tall standing cut-out; dense on the RIGHT, open toward the left.`
4. **돌담 골목 띠** (1536×1024, 가로로 길게 잘라 씀)
   `Long horizontal strip of a narrow Jeju village lane lined with black porous basalt stone walls (batdam), a few small carrot patches and potted herbs along the walls, warm sunlit paving stones.`
5. **식당 A** (1536×1024)
   `A small restaurant in a renovated traditional Jeju basalt stone house with a thatched-style low roof replaced by dark tiles, a tangerine-orange wooden door, a small wooden bench and two outdoor tables with bowls of carrot dishes, a basket of fresh carrots by the door. No readable text.`
6. **식당 B** (1536×1024)
   `A bright whitewashed seaside café with a large front window showing glass bottles of carrot juice and a counter, an orange-and-white striped awning, potted plants, a bicycle leaning on the wall. No readable text.`
7. **식당 C** (1024×1024)
   `A cozy wooden bistro corner with warm light inside, a cook in a linen apron standing at the door holding a plate of a carrot dish, hanging dried herbs and a crate of carrots beside the door, realistic proportions. No readable text.`
8. **여행자** (1024×1536)
   `A young Korean woman traveler with a canvas backpack and a paper map, looking toward the village with curiosity, casual spring clothes, sneakers, realistic proportions, full body, three-quarter view.`
9. **앞 밭담 + 손수레** (1536×1024)
   `A low black basalt stone wall with small wildflowers at its foot and an old wooden hand cart loaded with crates of fresh carrots in front of it, a straw hat resting on the crates.`

---

## 3장 — 03 MENU & RECIPE · 구좌를 요리하는 가장 쉬운 방식

**장면.** 저녁 부엌이다.

- 뒤로는 선반과 창이 있고, 창밖은 짙은 파랑 저녁 바다다.
- 가운데에 긴 나무 식탁이 놓여 있다.
- 양옆의 말린 허브·당근 다발 걸이와 옹기·냄비 선반이 장면을 감싼다.
- **왼쪽 책장은 집에서 만드는 레시피**(라페·수프·피클), **오른쪽 책장은 식당 메뉴**(대표 접시·주스·버거)다. 눌러 열리는 이야기와 짝이 맞는다.

대표 메뉴 세 가지는 웹진 카드뉴스가 확정되면 그림을 바꿀 수 있다. 지금은 식당 A·B·C의 자리 표시 메뉴다.

| # | 판 | 파일 이름 | 위치 x / 깊이 z | 크기(가로×세로) | 누름 |
|---|---|---|---|---|---|
| 1 | 부엌 벽·선반·창 (배경) | `kitchen-back.png` | 0 / −1.7 | 6.9 × 2.7 | – |
| 2 | 말린 허브·당근 다발 걸이 (왼쪽 앞) | `kitchen-left.png` | −2.55 / 1.7 | 1.6 × 2.8 | – |
| 3 | 옹기·냄비 선반 (오른쪽 앞) | `kitchen-right.png` | 2.6 / 1.7 | 1.6 × 2.6 | – |
| 4 | 긴 나무 식탁 | `kitchen-table.png` | 0 / −0.4 | 6.8 × 1.3 | – |
| 5 | **당근 라페** 볼 | `dish-rape.png` | −2.0 / 0.4 | 1.3 × 1.0 | 레시피: 당근 라페 |
| 6 | **당근 수프** 냄비와 그릇 | `dish-soup.png` | −0.85 / 0.2 | 1.4 × 1.2 | 레시피: 당근 수프 |
| 7 | **당근 피클** 유리병 | `dish-pickle.png` | −1.5 / 1.2 | 0.8 × 1.2 | 레시피: 당근 피클 |
| 8 | **대표 당근 접시** (식당 A) | `dish-plate.png` | 0.9 / 0.2 | 1.4 × 1.0 | 메뉴: 당근이 주연인 한 접시 |
| 9 | **당근 주스** 잔과 병 (식당 B) | `dish-juice.png` | 2.0 / 0.4 | 0.9 × 1.3 | 메뉴: 처음 만나는 당근의 맛 |
| 10 | **당근 버거** (식당 C) | `dish-burger.png` | 1.45 / 1.2 | 1.2 × 1.1 | 메뉴: 구좌 당근, 새로운 메뉴가 되다 |
| 11 | 앞 도마: 당근·칼·레시피 카드 | `kitchen-front.png` | 0 / 1.6 | 2.4 × 0.7 | – |

### 3장 판별 프롬프트

1. **배경** (1536×1024)
   `A warm Jeju home kitchen wall at evening: open wooden shelves with ceramic bowls, glass jars of pickles and spices, copper pots, a wide window in the middle showing a deep blue dusk sea with a tiny lighthouse light, pendant lamps glowing amber, white plaster wall with a few tiles.`
2. **허브·당근 걸이 왼쪽** (1024×1536)
   `A tall wooden kitchen rack with bunches of dried herbs and fresh carrots with green tops hanging from hooks, a woven basket on its lower shelf, painted as a tall standing cut-out; dense on the LEFT, open toward the right.`
3. **옹기·냄비 선반 오른쪽** (1024×1536)
   `A tall rustic shelf with Korean earthenware jars (onggi), stacked cast-iron and enamel pots, a wooden ladle and a linen towel, painted as a tall standing cut-out; dense on the RIGHT, open toward the left.`
4. **식탁** (1536×1024, 가로로 길게 잘라 씀)
   `Long horizontal strip of a solid wooden farmhouse dining table seen straight-on at table height, a linen runner with a red stripe across it, a few scattered carrot tops and herb leaves, warm lamplight.`
5. **당근 라페** (1024×1024)
   `A shallow ceramic bowl of French carrot râpé: finely julienned bright orange carrots glossy with dressing, flecks of parsley and whole-grain mustard, a fork resting on the rim.`
6. **당근 수프** (1536×1024)
   `A small enamel pot and a white bowl of smooth bright orange carrot soup with a swirl of cream and herbs on top, a little steam rising, a wooden spoon beside it.`
7. **당근 피클** (1024×1536)
   `A tall glass jar of carrot pickles: carrot sticks standing in clear brine with peppercorns and a bay leaf, a linen cloth tied over the lid with string.`
8. **대표 당근 접시** (1536×1024)
   `A restaurant-style plate where roasted whole Jeju carrots are the star: glazed carrots with their green tops, a smear of sauce, herbs and seeds, on a speckled ceramic plate.`
9. **당근 주스** (1024×1536)
   `A tall glass of fresh carrot juice with a few drops on the glass and a small glass bottle of carrot juice beside it, a slice of tangerine on the rim.`
10. **당근 버거** (1024×1024)
   `A hearty burger with layers of shredded carrot slaw and roasted carrot in a toasted bun, on a small wooden board with a few carrot fries.`
11. **앞 도마** (1536×1024, 가로로 길게 잘라 씀)
   `A wooden cutting board seen straight-on with whole and half-chopped carrots, a kitchen knife, a small bowl of salt and a handwritten recipe card shown blank (no writing).`

## 받은 뒤

- 같은 폴더 구조로 넣어 주시면 1장처럼 처리한다.
- 지금 2·3장에 있는 옛 그림(`village-*`, `shop-*`, `kitchen-*`, `dish-*`, `char-traveler`)은 같은 이름의 새 그림으로 바뀐다.
- 휴대폰 세워 보기 위치도 그림이 온 뒤 장마다 직접 잡는다.
