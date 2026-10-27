# 3장 "나만의 레시피" 모집 포스터 — GPT 이미지 프롬프트

"나만의 레시피" 책을 누르면 뜨는 레시피 모집 포스터(`public/media/recipe-share.webp`, 1086×1448)를 책의 다른 그림과 같은 느낌으로 다시 만들기 위한 프롬프트.

## 지금 포스터가 어긋나는 점

- 진한 초록의 두꺼운 고딕 제목, 반듯한 전단지 배치 → 책은 손그림·손글씨 느낌.
- 같은 3장의 레시피 포스터(당근 뇨끼 등)는 크림색 종이 위 색연필·크레용 그림, 주황 크레용 낙서 위의 손글씨 제목, 주황 번호 동그라미, 점선 상자로 되어 있음. 냉장고 자석 메모는 낡은 종이 + 구리 핀.
- 앱 글꼴: 제목류는 고운바탕(Gowun Batang, 부드러운 명조), 본문은 Pretendard/Noto Sans KR.

## 맞출 것

- 크림색 결 있는 종이, 색연필·크레용 손그림(그림책·팝업북 느낌), 따뜻한 부엌 조명.
- 색: 크림 종이 `#f4ead8`, 당근 주황 `#e8823a`, 테라코타 `#b9563a`, 냉장고 세이지 그린 `#8fa77e`, 짙은 갈색 글씨 `#4f3a2b`, 구리 핀.
- 글씨: 제목은 레시피 포스터처럼 짙은 갈색 손글씨(크레용·마커) + 뒤에 주황 크레용 낙서 하이라이트. 본문은 또박또박한 손글씨. 이메일 주소만은 또렷하게.
- 문구는 핵심만(사용자 요청, 2026-10-26): 제목 "구좌 당근 / 레시피 모집", 한 줄 "우리 집 당근 요리, 함께 공유해요", 보낼 것 한 줄 "요리 이름 · 재료 · 만드는 법, 사진도 좋아요", 버튼 두 개(+ 이메일 주소). "이메일이나 DM으로 편하게 보내주세요."와 "냉장고에 붙여져요" 꼬리표는 뺌(냉장고에 붙은 모습은 그림이 말해 줌).
- **아래쪽 두 버튼 자리는 지금과 같게**: 화면에서 이 두 칸을 누르면 인스타그램/이메일로 이어지도록 위치가 잡혀 있음(인스타: 가로 11–89%, 세로 80–87% / 이메일: 가로 11–89%, 세로 87.5–96%). 새 그림이 조금 달라도 받은 뒤 위치를 다시 맞추면 됨.

## 프롬프트 (그대로 붙여넣기)

```text
A vertical recipe-call poster for a cozy Korean picture book about Jeju's Gujwa carrots, portrait 3:4 (about 1086 × 1448 px). It must look hand-made, like a page from a vintage pop-up storybook, NOT a modern flyer: no heavy bold sans-serif fonts, no flat vector shapes, no glossy gradients, no photo elements.

Style: hand-drawn colored-pencil and wax-crayon illustration with light watercolor wash on warm cream textured paper (#f4ead8) with soft paper grain and slightly worn edges. Warm evening kitchen light. Palette only: carrot orange (#e8823a), terracotta (#b9563a), soft sage green (#8fa77e), dark brown ink (#4f3a2b), warm cream, small copper accents. Same look as a hand-drawn Korean recipe card: Korean lettering written by hand in dark brown crayon/marker, a loose orange crayon scribble highlight behind the title, small doodle sparkle lines, dashed-line boxes.

The whole sheet is pinned to a sage-green vintage fridge door by a round copper magnet pin at the top center, with a thin soft shadow behind the paper (the fridge door shows only as a narrow sage-green margin around the sheet).

Very little text — only the lines below; let the illustration carry the poster.

Layout, top to bottom:
1. Title, hand-lettered in big dark brown crayon letters over an orange crayon scribble highlight, two lines: "구좌 당근" / "레시피 모집"
2. Center illustration (about 40% of the height): a fresh Gujwa carrot with its green leafy top lying diagonally, and around it three tiny paper notes held by copper magnets — a small plate of carrot gnocchi, a plate of carrot kimbap rolls, a plate of carrot pancakes — plus one blank note with a pencil beside it, inviting the reader to write their own. No words on these notes.
3. One subtitle line, hand-written in dark brown: "우리 집 당근 요리, 함께 공유해요"
4. One short line of small, neat handwriting below it: "요리 이름 · 재료 · 만드는 법, 사진도 좋아요"
5. Two wide hand-drawn buttons stacked at the bottom, each spanning the middle 78% of the width:
   - first button from 80% to 87% of the height: a terracotta crayon-filled rounded box with cream hand-lettering "인스타 DM 보내기"
   - second button from 87.5% to 96% of the height: a cream box with a dark brown hand-drawn outline, hand-lettering "이메일 보내기" and below it, small and clearly legible, "jejucarrotlab@gmail.com"

All Korean text exactly as written above, spelled correctly, nothing else written anywhere. Generous margins, calm and airy composition, nothing touching the edges.
```

## 그림이 나온 뒤

- 글자가 깨지거나 틀리면 GPT에 이어서: `Keep everything the same, only rewrite the Korean text exactly as given: ...` 로 해당 줄만 다시 쓰게 함.
- 받은 그림을 `art-src/gpt/page-3/new/new2/`에 넣어 주면, `public/media/recipe-share.webp`로 바꾸고 인스타/이메일 버튼의 누르는 자리(`src/details.ts`의 `sheet.links` box)를 새 그림에 맞춰 다시 잡음.

## 적용 (2026-10-26)
- 새 그림 `gujwa-recipe-call-poster-transparent.png`(1086×1448, 투명 배경) → `node scripts/prepare-posters.mjs`가 `public/media/recipe-share.webp`로 변환.
- 누르는 자리(`src/details.ts` recipe-share `sheet.links`): 인스타 [15.47, 80.04, 69.8, 6.56], 이메일 [15.1, 87.71, 70.26, 8.7] (가로·세로 %, 그림에서 잰 값). 화면 읽기용 설명(alt)도 새 문구로.
- 휴대폰에서는 포스터를 화면 가운데에 띄움(`src/cinematic.css` `.detail-panel.is-sheet`: top·bottom 0, 높이 fit-content, margin auto).
- 영어·중국어판(2026-10-27): `recipe-call-en-transparent.png` / `recipe-call-zh-cn-transparent.png` → `recipe-share-en.webp` / `recipe-share-zh.webp`(prepare-posters.mjs). 언어별 그림과 버튼 자리는 `details.ts` recipe-share `sheet.byLang`(en 인스타 [16.3,79.21,68.69,6.7]·이메일 [15.19,86.95,70.35,8.7] — 영어판은 종이 여백이 넓어 prepare-posters가 종이를 잘라 다른 두 판과 같은 높이(1418px)로 키워 넣음, zh 인스타 [15.29,79.77,70.07,6.91]·이메일 [14.64,87.71,70.72,8.7]), `DetailPanel.tsx`가 읽는 사람의 언어로 고름. 화면 읽기용 설명은 `src/i18n/en.ts`·`zh.ts`에 번역 추가.
