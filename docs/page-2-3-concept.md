# 2·3장 컨셉과 GPT 이미지 프롬프트

1장(해질녘 당근밭)과 같은 방식이다. 판마다 GPT로 그림을 만들어 PNG로 받는다. 투명 배경이고 배경판만 불투명이다.

- 넣을 곳: `art-src/gpt/page-2/`
- 3장은 `docs/page-3-kitchen-v2.md`가 대신한다(이 문서의 3장 옛 구성은 지웠다).
- 받은 뒤 여기서 할 일: `scripts/prepare-gpt-art.mjs page-2`로 오림 테두리를 두르고 WebP로 바꾼 다음, 위치·크기를 잡는다(웹과 휴대폰 세워 보기 둘 다).

세 장의 시간대를 다르게 해서 넘길 때마다 분위기가 바뀌게 했다.

| 장 | 시간대 | 빛 |
|---|---|---|
| 1장 | 해질녘 밭 | 주황·보라 노을 |
| 2장 | 늦은 오전 바닷가 마을 | 청록 바다, 밝은 해 |
| 3장 | 저녁 부엌 | 따뜻한 등불 |

**누르는 사물은 모두 한쪽 책장 안에만 둔다.** 좌표는 펼친 책 기준이고(가로 −3.55~3.55, 깊이 −2.3~2.3), 1장처럼 큼직하게 채우는 구도다.

## 공통 스타일

```text
Vintage mid-century European pop-up book illustration, hand-painted gouache on thick matte card stock, rich layered colors,
visible brush texture and fine paper grain, warm natural palette, bright late-morning sunlight from the left with crisp soft shadows,
turquoise sea and whitewashed walls, carrot orange accents, detailed and grown-up storybook realism — not cute, not chibi,
not cartoon, no outlines, no text, no lettering, no signage words, no numbers.
```

(가게 간판 글자는 실제 가게 것이라 아래 가게 프롬프트에서만 예외로 그대로 둔다.)

### 판마다 붙일 기술 조건

- **투명 그림:** `isolated single die-cut piece, fully transparent background (PNG with alpha), no drop shadow, no glow, no border, edges follow the silhouette`
- **사람:** `realistic proportions, a natural unposed stance, full body from head to feet, soft natural expression`을 같이 붙이고, 사람 그림은 한 대화에서 이어서 받아야 같은 붓 질감과 얼굴 말투가 나온다.
- **해상도:** 1024×1024, 1536×1024, 1024×1536 가운데 비율에 가까운 것.

---

## 2장 — 02 PEOPLE WHO COOK · 구좌를 맛보는 다채로운 방식 (v4)

**바닥 수정(2026-10-22):** 바닥 길이 일직선이던 것을 건물 사이를 굽이쳐 돌아 앞으로 넓어지는 길로 바꿨다(`scripts/street-floor.mjs`, 가장자리는 울퉁불퉁하게 종이로 스며듦). 인쇄된 글씨(제목·부제·쪽 번호) 자리는 돌이 완전히 사라지고 맨 종이가 되게 해서 라벨 상자 없이 바닥과 이어지게 했다(`scripts/create-pages.mjs`의 `spreadClear`). 마노아를 앞으로 당기고(z .35) 버거캐럿을 더 길게(가로 1.7 × 세로 2.55) 했다.

**v4 적용(2026-10-21 저녁):** 가게 그림을 v4(`*-v4.png`)로 바꿨다. 버거캐럿은 세로 그림(가로:세로 약 2:3)이라 가장 키가 크고(가로 1.6 × 세로 2.4), 마노아 2.3, 소농로드 3.1이다. 웹은 버거캐럿 왼쪽 끝 · 마노아 그 안쪽 뒤 · 소농로드 오른쪽, 휴대폰은 양옆 가게가 앞 · 마노아 가운데 뒤.

**수정(2026-10-21 오후):** 바닥을 더 단순하게 바꿨다. 옆의 꽃과 돌담을 빼고, 작은 자갈만 가운데로 좁아지는 길(가까운 쪽이 넓고 먼 쪽이 좁음)로 파피루스 위에 깔았다(`scripts/street-floor.mjs`가 `village-floor.png`의 자갈 부분만 줄여 이음매 없이 이어 붙임). 가게는 서로 겹쳐도 되게 키웠다(소농로드 3.35, 버거캐럿 2.1, 마노아 2.3).

**적용(2026-10-21):** 받은 v3 그림으로 적용했다. 길은 카드로 세우지 않고 **바닥에 직접 그렸다**: `village-floor.png`(위에서 본 돌길)를 웹은 2장의 인쇄 면(`scripts/create-pages.mjs 1`)에, 휴대폰은 납작한 바닥 면(`village-floor-stage*`, `src/story.ts`의 `stage`)에 입혔다. 이유는 길이 책장 바닥이라서 카드로 세우면 벽처럼 서 있게 되고, 바닥에 그리면 가게와 사람이 그 위에 서는 구도가 되기 때문이다. `village-road-front.png`는 쓰지 않는다. 가게는 `buggercarrot-left-v3`(왼쪽 끝), `manoa-turn-v3`(왼쪽 안쪽), `sonongroad-right-v3`(오른쪽)를 쓴다. 휴대폰은 양옆 가게를 앞에, 마노아를 가운데 뒤에 둔다. 아래 표와 가게 프롬프트는 이 그림을 받기 전 기록이다.

**바뀐 점(2026-10-21):** 가게 세 곳을 정면이 아니라 **길 가운데를 향해 기울여** 그린다. 책장 바닥이 길이고, 양옆 건물이 모두 가운데 길 쪽으로 모여드는 한 점 투시 거리 구도다. 그림 평면 카드는 돌릴 수 없으니, 각 가게를 **기울어진 모습으로 다시 그려 받는다.** 길 그림(`village-road`)은 쓰지 않는다. 책장 바닥 가운데의 빈 곳이 길이고, 그 끝에 뒤 배경의 바다 마을이 보인다.

- **그대로 쓰는 것:** 뒤 배경(`village-back`), 여행자(`char-traveler`), 유모차 가족(`family-walk`).
- **다시 그릴 것:** 가게 3곳(원본 `buggercarrot.png`, `manoa.png`, `sonongroad.png`을 참고 이미지로 붙여서 각도만 바꿔 받는다).

**장면.** 늦은 오전, 거리 한가운데에 서서 길 끝의 바다를 본다. 왼쪽 끝에는 버거캐럿이 키 큰 모습으로 오른쪽(길)을 향해 서 있고, 그 뒤쪽 안쪽에는 마노아가 살짝 길 쪽으로 틀어 서 있다. 오른쪽에는 소농로드가 크게 왼쪽(길)을 향해 서 있다. 두 건물 사이 가운데가 길이고, 그 길을 여행자와 유모차 가족이 걸어 나온다.

| # | 판 | 파일 이름 | 위치 x / 깊이 z (대략) | 크기(가로×세로) | 누름 |
|---|---|---|---|---|---|
| 1 | 바닷가 마을 배경(기존) | `village-back.png` | 0 / −1.7 | 6.8 × 2.7 | – |
| 2 | **버거캐럿** — 왼쪽 끝, 길(오른쪽)을 향해 기울임 | `buggercarrot-left.png`(새로) | −2.6 / 0.1 | 1.9 × 2.1 | 식당 C 이야기(`cook-03`) |
| 3 | **마노아** — 왼쪽 안쪽, 길 쪽으로 살짝 틂 | `manoa-turn.png`(새로) | −1.2 / −0.9 | 2.3 × 1.5 | 식당 B 이야기(`cook-02`) |
| 4 | **소농로드** — 오른쪽, 길(왼쪽)을 향해 기울임 | `sonongroad-right.png`(새로) | 1.9 / −0.2 | 3.3 × 2.2 | 식당 A 이야기(`cook-01`) |
| 5 | 여행자(기존) | `char-traveler.png` | −0.9 / 1.6 | 0.7 × 1.5 | – |
| 6 | 유모차 어머니와 5살 딸(기존) | `family-walk.png` | 0.4 / 2.0 | 1.8 × 1.55 | – |

- **가운데 길:** 마노아 오른쪽 끝(약 −0.1)과 소농로드 왼쪽 끝(약 0.25) 사이를 열어 두어, 그 틈으로 뒤 배경의 바다가 보이게 한다. 눌러지는 사물은 모두 한쪽 책장 안에 있다(버거캐럿·마노아는 왼쪽, 소농로드는 오른쪽).
- **가게와 식당 연결(추정):** 소농로드 → 식당 A, 마노아 → 식당 B, 버거캐럿 → 식당 C. 다르면 알려 주면 바꾼다.
- 휴대폰에서는 소농로드와 버거캐럿을 뒷줄 양쪽에, 마노아를 가운데 앞쪽에 놓는 식으로 길을 열고, 그림이 온 뒤 화면에서 잡는다.
- 쓰지 않는 기존 가게 정면 그림은 `_archive`로 옮긴다(`village-road`는 파일만 남기고 쓰지 않는다).

### 2장 가게 프롬프트 (참고 이미지를 붙여서)

가게마다 **해당 원본 PNG를 첨부하고** 아래 문장을 쓴다. 건물의 디자인, 색, 재질, 간판과 포스터의 글자(소농로드, BURGER CARROT·버거캐럿, 마노아의 곰 로고)는 원본 그대로 두고 **보는 각도만** 바꾼다. 세 장을 한 대화에서 이어서 받는다.

공통 문장 (각 가게 문장 뒤에 붙임):

```text
Keep the building's design, materials, colors, lighting and every piece of signage, lettering, logo and poster exactly as in the attached image; change only the viewing angle. The same hand-painted gouache storybook style with visible brush texture, bright late-morning sunlight from the left, detailed grown-up realism, not cartoon, not 3D-rendered. Show only the building itself with a short strip of its ground at the foot, no road, no sidewalk beyond that strip, no people, no sky, no background. One isolated die-cut piece on a fully transparent background (PNG with alpha), no drop shadow, no glow, no border, edges following the silhouette. Canvas 1536×1024.
```

1. **버거캐럿 (왼쪽 끝)** → `buggercarrot-left.png`
   `Redraw the attached storefront as the building at the LEFT end of a narrow village street, seen from the middle of the street in strong one-point perspective. The building is turned about 35 degrees so its front facade faces to the right, toward the street's center line, and is foreshortened: the near (left) end of the facade is taller and wider, the far (right) end is shorter and narrower, and the roofline, the door top and the sign band all slope down toward a vanishing point far to the right at about 55% of the image height. The entrance door with its orange glass panels is on the facade that faces the street. Only the street-facing facade and a sliver of the roof edge are visible; the outer left side wall is not visible.`
2. **마노아 (왼쪽 안쪽, 살짝 틂)** → `manoa-turn.png`
   `Redraw the attached café as a building a little farther down the same street on the LEFT side, mostly facing the viewer but turned about 15 degrees to the right toward the street's center line, with gentle perspective: the left end of the facade is slightly taller than the right end, and the roofline and the window and door tops slope down gently toward a vanishing point to the right at about 55% of the image height. Both the large window and the open entrance remain clearly visible.`
3. **소농로드 (오른쪽)** → `sonongroad-right.png`
   `Redraw the attached stone restaurant as the large building on the RIGHT side of a narrow village street, seen from the middle of the street in strong one-point perspective. The building is turned about 35 degrees so its front facade, with its covered porch, the string lights, the door and both windows, faces to the left toward the street's center line, and is foreshortened: the near (right) end is taller and wider, the far (left) end is shorter, and the roof, the porch roof and the window tops slope down toward a vanishing point far to the left at about 55% of the image height. The side wing with the stove chimney at the far end is hidden behind the facade; the porch with the green chairs and table stays visible at the foot.`

## 받은 뒤

- **파일:** 새로 받을 그림은 `buggercarrot-left.png`, `manoa-turn.png`, `sonongroad-right.png` 3장이다(원본 `buggercarrot.png`, `manoa.png`, `sonongroad.png`은 그대로 둔다). `art-src/gpt/page-2/`에 넣는다.
- **여기서 할 일:**
  - `scripts/prepare-gpt-art.mjs`의 2장 목록에서 `village-road`와 옛 정면 가게 3장을 빼고 새 3장을 넣는다(`clean`, 발밑 접촉 그림자 `shadow`).
  - `src/story.ts`의 2장 레이어를 위 표대로 다시 짜고, 누르는 사물 셋은 새 가게 3장(`cook-01~03`)에 연결한다.
  - 웹과 휴대폰 위치를 둘 다 잡고, 가운데 길 틈으로 뒤 배경의 바다가 보이는지, 여행자와 가족이 가게를 가리지 않는지를 화면에서 본다. `tests/`의 2장 관련 테스트도 같이 고친다.
- **지금은 코드를 바꾸지 않았다.** 지금 화면은 이전 배치(소농로드 왼쪽, 버거캐럿 오른쪽)가 그대로이고, 새 그림이 오면 한 번에 바꾼다.

## 적용 (폰 모드 · 모바일 가게 그림)
- 2p 폰: 가게는 `*-mobile.png`(→ `sonongroad-phone`, `manoa-phone`, `buggercarrot-phone`), 뒷배경은 `village-back-narrow.png`(→ `village-back-phone`)을 `phoneSrc`로 사용. 배치는 `바닥 참조.png` 기준(버거캐럿 왼쪽 앞, 마노아 가운데 뒤, 소농로드 오른쪽, 가족은 길 위).
- 3p: 책상·레시피 북의 그림자는 `cast`(모양을 따라가는 그림자, scripts/prepare-gpt-art.mjs)로 붙여서 공중에 뜬 느낌을 없앰.
- 웹 모드도 같은 그림으로 통일: `sonongroad`/`manoa`/`buggercarrot` 텍스처가 `*-mobile.png`, `village-back`이 `village-back-narrow.png`(가로 띠로 잘라 사용).
