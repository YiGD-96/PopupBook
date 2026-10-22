# 1장 컨셉 초안 — 01 FARMER · 구좌를 길러내는 묵묵한 방식

**결정(2026-10-17):** 사실적인 사람 농부 · 해질녘 겨울 밭 · 랜턴 말뚝 포함(누르는 사물 3개) · 휴대폰 세워 보기는 1장 그림 확정 뒤 1장부터.

**적용(2026-10-17):** GPT 그림 9판을 받아 1장에 넣었다(`scripts/prepare-gpt-art.mjs`, `src/story.ts`). 실제 배치는 아래 표와 조금 다르다(밭담은 가운데 낮게, 수확 상자와 랜턴은 그 앞 양쪽).

회의용 초안이다. 정해지면 이 문서의 프롬프트로 GPT 이미지를 만들고, 받은 이미지를 `art-src/gpt/page-1/`에 넣으면 여기서 오림 테두리·크기·위치를 맞춰 넣는다.

## 방향

- **참고 이미지에서 가져올 것.** 1·3번은 1960년대 유럽 빈티지 팝업북 스타일이다.
  - 손으로 칠한 과슈 그림과 깊은 색감, 앞뒤 여러 겹의 오림 판.
  - 양옆 나무가 무대 막처럼 장면을 감싼다.
  - 인물이 장면 앞에 따로 서 있다.
- **2번에서 가져올 것.** 접은 종이의 입체감(겹친 나뭇잎, 접힌 나무).
- **피할 것.** 둥글고 큰 머리의 캐릭터, 평평한 단색, 스티커처럼 보이는 그림.
- **장면.** 해질녘 초겨울 구좌의 당근밭.
  - 뒤로는 주황·분홍 노을 하늘에 오름 실루엣과 풍력발전기, 멀리 바다가 노을빛으로 반짝인다.
  - 밭 양옆에 삼나무 방풍림, 앞에는 검은 현무암 밭담이 있다.
  - 낮게 깔린 노을빛이 고랑에 긴 그림자를 드리운다. 고랑 사이 그늘에는 서리가 조금 남아 있다.
  - 하루 수확을 마친 농부가 막 뽑은 당근을 들고 있고, 수확 상자가 쌓여 있다.
  - 밭 앞 말뚝에는 밤 순찰에 쓸 랜턴이 막 켜져 있다. 웹진의 “농약 대신 랜턴과 파리채로” 이야기를 이 장면에 담는다.

## 판 구성 (뒤 → 앞)

좌표는 지금 책 기준이다(가로 −3.55~3.55, 깊이 −2.3~2.3). 누르는 사물은 **한쪽 책장 안에만** 둔다(가운데 홈에서 0.12 이상 떨어지게).

| # | 판 | 위치 x / 깊이 z | 크기(가로×세로) | 누름 |
|---|---|---|---|---|
| 1 | 하늘·오름·풍력발전기·먼 바다 (배경) | 0 / −1.7 | 7.1 × 2.7 | – |
| 2 | 삼나무 방풍림 왼쪽 | −2.75 / −1.0 | 1.6 × 2.5 | – |
| 3 | 삼나무 방풍림 오른쪽 | 2.75 / −1.0 | 1.6 × 2.5 | – |
| 4 | 당근밭 고랑 + 뒤쪽 낮은 밭담 | 0 / −0.5 | 7.0 × 1.1 | – |
| 5 | 제주마(조랑말), 노을 쪽으로 날아가는 까마귀 몇 마리는 배경에 | −2.6 / 0 | 1.0 × 1.1 | – |
| 6 | **농부** — 막 뽑은 당근 한 다발 | 1.5 / 0.3 | 1.5 × 2.1 | 농부 이야기 |
| 7 | **수확 상자** — 흙 묻은 당근, 나무 상자 2~3개 | −1.4 / 0.6 | 1.7 × 1.2 | 수확 이야기 |
| 8 | 앞쪽 밭담 + 들꽃·갓 잎 | 0 / 1.65 | 6.6 × 0.7 | – |

| 9 | **랜턴 말뚝** — 막 켜진 랜턴과 파리채 | 2.6 / 1.0 | 0.7 × 1.2 | 새 이야기 “밤의 밭고랑” (웹진 기사 내용으로 작성) |

## GPT 이미지 프롬프트

### 공통 스타일 (모든 판 프롬프트 앞에 붙임)

```text
Vintage mid-century European pop-up book illustration, hand-painted gouache on thick matte card stock, rich layered colors,
visible brush texture and fine paper grain, warm natural palette (deep greens, earthy browns, carrot orange, basalt charcoal,
dusky violet, sunset orange and rose), low warm sunset light from the left with long soft shadows, detailed and grown-up storybook realism — not cute, not chibi, not cartoon,
no outlines, no text, no lettering. Front-facing straight-on view of a single standing die-cut piece.
```

### 판마다 기술 조건

- **배경(1)을 뺀 나머지:** `isolated single die-cut piece, fully transparent background (PNG with alpha), no drop shadow, no border, edges follow the silhouette`
- **해상도:** 정사각 1024×1024, 가로 1536×1024, 세로 1024×1536 가운데 표의 비율에 가까운 것. 여백은 여기서 잘라 낸다.

### 판별 프롬프트

1. **배경** (1536×1024, 나중에 위아래를 잘라 가로로 길게 씀)
   `Wide panoramic landscape of Gujwa, Jeju Island at dusk in early winter: gentle volcanic cones (oreum) as layered blue-violet silhouettes, a row of wind turbines on the ridge catching the last light, a thin strip of sea glowing orange on the far right, a sunset sky from deep rose and orange near the horizon to dusky blue above, a few crows flying toward the sunset. Keep all important shapes in the middle horizontal band; the top 25% is plain sky and the bottom 15% is plain ground so they can be cropped.`
2. **방풍림 왼쪽** (1024×1536)
   `A tall cluster of Japanese cedar windbreak trees typical of Jeju farm fields, dark green layered foliage with warm sunset rim light on one side, trunks at the bottom, slightly leaning, painted as a tall standing cut-out; the right edge is open so it frames a scene.`
3. **방풍림 오른쪽**: 2번과 같고 `the left edge is open` (또는 2번을 좌우 반전해 쓴다).
4. **당근밭** (1536×1024, 가로로 길게 잘라 씀)
   `Long horizontal strip of a winter carrot field on black volcanic soil: neat furrows of feathery carrot tops in rich green, long warm sunset shadows across the rows and a little frost left in the shaded furrows, a low black basalt stone wall (batdam) running along the back edge.`
5. **제주마** (1024×1024)
   `A small sturdy Jeju pony, chestnut brown with a dark mane, standing calmly in three-quarter view, grazing near a field, warm sunset light on its side.`
6. **농부** (1024×1536)
   `A Korean carrot farmer in his fifties standing in a field, warm work jacket, wool cap, rubber boots, gloves with soil on them, holding up a bunch of freshly pulled carrots with long green tops at the end of the day, a quiet proud smile, warm sunset light on his face and the carrots; realistic proportions, full body.`
7. **수확 상자** (1536×1024)
   `Two or three stacked weathered wooden harvest crates full of freshly dug Jeju carrots still covered in dark volcanic soil, green tops spilling over the edges, a few loose carrots on the ground, warm sunset light.`
8. **앞 밭담** (1536×1024, 가로로 길게 잘라 씀)
   `Long low wall of stacked black porous basalt stones (Jeju batdam), irregular rounded stones with holes and texture, small winter wildflowers and mustard-green leaves growing at its foot.`
9. **랜턴 말뚝** (1024×1536)
   `A wooden field post with an old kerosene lantern just lit and glowing warm yellow, a fly swatter hanging beside it, a little rope tied around, dusk light, painted as a standing cut-out.`

## 받은 이미지를 넣는 방법

- **파일 이름:** `art-src/gpt/page-1/` 아래 `farm-back.png`, `farm-trees-left.png`, `farm-trees-right.png`, `farm-field.png`, `char-pony.png`, `char-farmer.png`, `farm-crate.png`, `farm-wall.png`, `farm-lantern.png`.
- **여기서 할 일:**
  - 투명 배경 정리와 크림색 오림 테두리(기존 `prepare-characters.mjs` 방식)
  - 표시 크기에 맞춘 WebP 변환(작은 사물 480~720px, 배경 1440px)
  - 위치와 크기 조정, 그림자 확인
- 그림이 오기 전에는 같은 자리에 **임시 판**(색면 + 이름)을 세워 구도부터 확인할 수 있다.

## 휴대폰: 1·3번 사진처럼 세워 보이기

**적용(2026-10-17):** 만들었다. 1장은 `src/story.ts`의 `phone` 위치로 직접 배치했고 2·3장은 자동 배치다. 세로 인트로 영상은 아직 없고, 영상 뒤에 책이 일어서는 짧은 연출로 이어진다.

1·3번은 책을 90°로 펼쳐 윗장은 세우고 아랫장은 눕힌 모습을 정면에서 본 것이다.

- **바뀌는 것**
  - 휴대폰에서만 책을 돌려 놓는다. 제본선이 화면 가로 방향이 되고, 윗장이 배경판, 아랫장이 글이 있는 바닥이 된다.
  - 같은 판을 장면마다 **휴대폰용 위치표**로 다시 세운다. 무대 폭이 7.1에서 약 4.7(책장 높이)로 좁아진다.
- **그대로인 것**
  - 판 그림과 텍스처, 누르는 사물, 이야기 패널, 소리, 넘기는 입력
- **새로 필요한 것**
  - 세로 카메라 구도
  - 휴대폰용 넘김 연출: 판이 접혀 눕고, 윗장이 내려왔다 다음 장이 일어선다.
  - 휴대폰용 인트로 영상(세로로 한 번 더 렌더) 또는 휴대폰에서는 정지 표지 후 바로 시작
- **판단:** 판 그림을 그대로 다시 쓰므로 가능은 하다. 다만 장면마다 휴대폰용 위치표가 따로 필요해서, 새 1장 그림이 정해진 뒤 1장으로 먼저 만들어 보는 것이 효율적이다.

## 1장 v2 (2026-10-21): 헛간과 진흙 마당

그림: `art-src/gpt/page-1/new` (구도는 `전체화면.png` 스케치를 따름). `node scripts/prepare-gpt-art.mjs page-1` → `node scripts/create-pages.mjs 0`.

| 판 | 그림 | 누르면 |
|---|---|---|
| 배경 `farm-back` | 1페이지-배경 (오름·풍력발전기·바다, 해 질 녘). 휴대폰은 `farm-back-phone`: 같은 그림의 왼쪽(해가 보이는 쪽) 1477px | — |
| 헛간 `farm-shed` | 빈티지 도구가 있는 나무 헛간 (왼쪽 장, 흰 테두리 없음 `plain`) | — |
| 파리채·손전등 `farm-swatter` | 헛간 벽에 붙어 함께 접힘 (`on:'shed'`) | night-watch |
| 당근밭 `farm-carrots` | 당근밭-제주현무암재배치-직각윤곽-1500x450.png (원근 돌담 뒤 당근밭, 오른쪽 장 바깥 끝부터 헛간 뒤까지, 농부·상자 뒤) | — |
| 농부 `char-farmer` | 당근을 든 미소 짓는 농부-아침7시-좌측빛 (오른쪽 장, 발밑 그림자) | farmer |
| 강아지 `farm-dog` | 제주강아지-웅크린잠자는자세-그림책 (흰 테두리 없음, 발밑 그림자). 웹: 농부 왼발 왼쪽 / 휴대폰: 농부 발 앞 | — |
| 당근 상자 `farm-crate` | 흙 묻은 당근이 가득한 나무 상자 (오른쪽 앞) | harvest |

- 바닥: `진흙길-아침햇빛-옅은바퀴자국-생성원본.png` 한 장(아침 햇빛의 맨흙, 옅은 바퀴 자국, 왼쪽 가장자리 화산석·풀)을 배경판 발밑부터 앞 가장자리까지 책장에 인쇄 (`scripts/farm-floor.mjs`). 장 제목과 부제는 2장처럼 바닥 위 파피루스 얼룩(`clear`) 위에 놓인다. 휴대폰은 `stage:'farm-floor-stage'`.
- 인쇄된 책장과 휴대폰 바닥은 비스듬히 보이므로 이방성 필터링(anisotropy 8)을 켠다 (`src/assets.ts`).
- 배경판(모든 장)은 크림 테두리가 좌·우·위에만 있고 아래(바닥과 만나는 쪽)에는 없다.
- 농부(z 1.1, 높이 2.45)·상자(z 1.68, 폭 1.3)는 앞쪽 진흙길에 선다 (상자는 오른쪽 부제보다 뒤). 당근밭 판은 그 뒤(z 0.3, 폭 4.3): 돌담 오른쪽 아래 끝이 책 오른쪽 모서리에 딱 맞게 (웹 x 1.27, 오른쪽 끝 3.42 — 책장 끝이 처져 있어 3.55보다 조금 안쪽; 휴대폰 폭 2.6, 오른쪽 끝 2.375 = 책장 끝, `edge:true`). 당근밭 판은 흰 테두리 없음(`plain`).
- 1판의 방풍림, 제주마, 랜턴 말뚝, 당근밭·돌담 판은 뺐다 (원본 PNG는 `art-src/gpt/page-1`에 그대로).
- 책이 처음 펼쳐질 때(판이 누워 있을 때) 바닥 그림이 책장 윗부분까지 이어지도록, 배경판 뒤에 가려지는 윗띠는 바닥 그림의 먼 쪽을 뒤집어 이어 칠했다 (`farm-floor.mjs`).
- 누르는 판의 빛(halo, `src/cardHalo.ts`): 1장은 `halo:{color:'#ff9418',boost:2.4,rest:.7,seen:.32}`로 더 진하다. 테두리 폭은 최소 0.05, 파리채는 휴대폰에서만 판의 `glow:.1`로 더 두껍게; 빛 모양은 실루엣 + 3겹 링으로 채워 판에 바로 붙는다, 발밑에 구운 그림자는 빛에서 제외, 빛은 카드 뒤에 가운데 정렬(휴대폰에서 위로 밀던 것 제거), 카드보다 나중에 그려 헛간에 가려지지 않게(renderOrder 1).
- 휴대폰: 당근 상자는 오른쪽 위(x 1.6, z 2.5), 강아지는 농부 발 앞(z 3.05).
