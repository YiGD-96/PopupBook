# 당근을 따라, 구좌 — 팝업북 (구좌 당근을 만나는 사람들)

웹 매거진 [‘당근을 따라, 구좌’](https://gujwa-carrot.vercel.app)의 세 이야기(01 FARMER · 02 PEOPLE WHO COOK · 03 MENU & RECIPE)를 입체 팝업북으로 보여 주는 페이지입니다. 로고·이름·표지 문구·소개 문구는 매거진의 것을 그대로 씁니다(`src/site.ts`).

`../prd.md`를 바탕으로 만든 한국어 인터랙티브 웹 프로토타입입니다. 20~30대 여성 방문자를 고려해 크림색 종이, 세이지 그린, 살구색과 여백을 중심으로 디자인했습니다.

## 실행

Node.js 20.19+ 또는 22.12+ 환경에서:

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## 체험 범위

GitHub 저장소와 Vercel을 연결하는 배포 방법은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요. 저장소 최상위에 이 프로젝트의 파일을 올리면 Vercel의 Root Directory는 `./`입니다.

- 첫 화면은 책등과 옆면이 살짝 보이는 표지입니다. 표지에는 매거진 첫 화면의 움직이는 그림(잎·그림자·주스 수면)과 제목이 그대로 실려 있고, 영상 첫 1초 동안 책이 선 채로 표지 그림이 움직입니다. 메뉴·배너·버튼은 없습니다.
- 표지가 기울어지는 동안 함께 열리고, 여섯 장을 넘겨 첫 풍경으로 이어지는 5.04초/60fps 영상을 재생합니다(첫 1초는 표지). 재생 중에는 3D 엔진이나 WebGL 컨텍스트를 생성하지 않습니다.
- 영상 2.8초의 풍경 상승과 함께 상단 메뉴·화살표·대사를 표시합니다. 조작은 실제 책이 준비될 때까지 잠깁니다. 영상 종료 후 마지막 화면을 유지하며 첫 장의 이미지·GPU·셰이더·숨겨진 렌더를 준비하고 실제 책으로 연결합니다. 영상 실패 시에는 정적인 화면에서 실제 책으로 넘어갑니다.
- 책의 그림자와 실시간 조명을 제거했습니다. 원본 일러스트의 색을 유지하는 가벼운 재질을 사용하고, SVG의 복잡한 종이 필터는 WebP 이미지로 미리 변환했습니다.
- 책은 크게 배치하되 PC에서 하단 여백을 확보합니다. 상단 장 표시는 작은 헤더 텍스트로 통합했으며, 페이지를 넘길 때 카메라 확대·축소는 없습니다.
- 첫 장에서는 책을 닫지 않습니다. 마지막 장 뒤의 마무리 팝업에서도 이전 장으로 돌아갈 수 있고, ‘처음부터 다시 보기’는 표지부터 다시 시작합니다.
- 천 결·제본 홈·모서리 마모가 있는 표지, 두꺼운 판지(0.18)와 종이 단면(0.32), 양면 인쇄와 책갈피 리본을 표현합니다. 영상과 실제 책은 같은 재질 이미지와 치수를 사용합니다.
- 좌우 드래그로 책장을 직접 움직이며, 짧은 드래그는 취소되고 충분한 이동·빠른 스와이프는 완료됩니다. 터치의 세로 이동과 드래그를 구분합니다.
- 책 영역의 세로 휠·가로 트랙패드 입력으로 한 장씩 이동합니다. 전환 중 입력과 휠 관성은 잠그며, 모달 및 확대 제스처는 페이지 넘김에서 제외합니다.
- 화면에 표시되는 장 넘김 조작은 좌우 화살표 두 개입니다. 중복 이전·다음 버튼, 점 표시, 책갈피 목록과 드래그 안내는 제거했습니다.
- 구좌 당근밭 / 제주 마을 골목 / 해안 등대, 장마다 독립 종이 레이어 5개.
- 사물을 좌우 책장에 고정해 종이의 곡면·회전과 함께 움직입니다. 현재 사물은 책장 진행도 70%에서 완전히 눕고, 다음 장의 사물은 기존 속도로 일어납니다. 드래그를 되돌리면 접힘도 같은 비율로 복원됩니다. 첫 진입에서만 차례로 펼치는 연출을 사용합니다.
- 당근 반응, 감귤나무 대사, 등대 빛, 장별 HTML 대응 버튼.
- 이전·다음, 엔딩, 재시작. 여행 설정은 없으며 일반 움직임·선명한 화질·효과음 켜짐으로 고정합니다.
- 브라우저의 소리 자동 재생 정책에 따라 첫 클릭·터치·키 입력 이후 효과음이 재생됩니다. 첫 방문의 자동 연출은 입력 전에는 소리 없이 진행합니다. 오디오 컨텍스트는 재사용합니다.
- 다음 장 리소스 프리로드, 로딩 안내, 리소스 오류 시 재시도.
- WebGL 미지원·컨텍스트 유실 시 일러스트 모드. `?view=paper`로 직접 확인 가능.
- 한국어 DOM 텍스트, 포커스 표시, 모달 포커스 순환, Tab / Enter / 방향키.

React 19 + TypeScript + Vite + Three.js / React Three Fiber / Drei + GSAP + Zustand를 사용합니다. 호환 버전은 `package-lock.json`에 잠갔습니다. 렌더 엔진은 별도 청크로 분리했습니다. 책장은 세분화한 메시를 연속 곡선으로 변형해 휘어집니다. 정교한 종이 물리와 기계식 V-fold는 구현 범위 밖입니다.

## 코드 구성

- `src/App.tsx`: 반응형 화면, 대사, 내비게이션, 모달, 일러스트 폴백.
- `src/Storybook.tsx`: 3D 책, 바닥 힌지와 팝업, 단일 전환 타임라인 소유자.
- `src/story.ts`: 세 장의 콘텐츠, 상태, 첫 사용자 입력 이후 합성 효과음.
- `src/assets.ts`: 텍스처 캐시, 장별 로드·다음 장 프리로드·실패 캐시 정리.
- `src/bookPreparation.ts`: 첫 장 텍스처의 단계별 GPU 업로드, 셰이더·실제 렌더 준비, 취소된 초기화 차단.
- `src/Intro.tsx`, `src/introPlayback.ts`: 표지 정지 화면(영상 첫 프레임) → 영상 재생(첫 1초 표지 유지) → 준비된 실제 책으로 전환.
- `src/analytics.ts`: GA4 이벤트(장 보기·이야기 열기/닫기·책장 넘김 방법·링크 클릭·인트로 완료·마무리)와 화면을 따라가는 주소 해시(`#farmer`, `#cooks/cook-02`, `#ending`). 해시가 붙은 주소로 들어오면 인트로 뒤 그 장·이야기가 열린다. `VITE_GA_ID`가 있을 때만 인트로가 끝난 뒤 gtag.js를 불러온다. GA4 향상된 측정의 "브라우저 기록 이벤트 기반 페이지 변경"은 꺼 두어야 페이지 조회가 두 번 세지 않는다.
- `src/seo.ts` + `vite.config.ts`의 `book-seo` 플러그인: 빌드할 때 책 데이터로 글 버전(전체 장·이야기·레시피·자주 묻는 질문; 화면에는 숨겨져 있고 화면 읽기 프로그램과 검색 엔진이 읽음), JSON-LD(WebSite·WebPage·책과 장·Recipe 3개·FAQPage), 메타·Open Graph·Twitter 태그를 `index.html`에 넣고 `robots.txt`·`llms.txt`·`sitemap.xml`을 만든다. 자바스크립트를 실행하지 않는 검색·AI 크롤러도 이야기 전체를 읽는다. `VITE_SITE_URL`(배포 주소)이 있어야 canonical·sitemap·절대 URL이 생긴다(`.env.example`).
- `src/site.ts`: 매거진의 이름·표지 문구·소개 문구(그대로 옮긴 것).
- `src/standingBook.tsx`, `src/standingLayout.ts`, `src/standingView.ts`: 세로 휴대폰에서 책을 90°로 세워 보여 주는 화면(윗장에 배경, 아랫장에 카드, 아랫장이 올라가며 넘김).
- `src/artSource.ts`: 미리 변환한 WebP 일러스트 경로.
- `src/bookView.ts`: 고정 카메라와 책장·팝업 전체를 담는 반응형 구도.
- `src/bookStructure.ts`: 영상과 실제 책이 공유하는 판지·종이 두께와 치수.
- `src/paperGeometry.ts`: 힌지 고정, 종이 휘어짐, 앞·뒷면 기하.
- `src/paperAttachments.ts`: 책장별 일러스트 분할과 곡면에 붙은 사물의 위치·방향 계산.
- `src/useBookGestures.ts`, `src/turnInput.ts`: 드래그 캡처·취소, 휠 누적·관성 차단.
- `src/reader.css`: 책을 중심에 배치하는 반응형 독서 화면.
- `src/cinematic.css`: 배너 없는 인트로와 크게 배치한 책 화면.
- `public/art`: 책장 인쇄면·인트로 일기장 종이의 SVG 원본(`scripts/create-pages.mjs`)과 파비콘. 장면 그림은 모두 `public/art-raster`의 WebP다.
- `art-src/gpt/page-N`: GPT로 그린 장면 원본 PNG(로컬 전용, git에 포함하지 않음). `scripts/prepare-gpt-art.mjs`가 오림 테두리를 두른 WebP로 바꾼다.
- `src/details.ts`, `src/DetailPanel.tsx`: 사물을 누르면 열리는 이야기 패널의 내용(웹 매거진 ‘당근을 따라, 구좌’ 기준)과 화면.
- `public/art-raster`: 표시용 WebP 일러스트(원본 SVG의 투명도 유지).
- `public/book-materials`: 표지·천 결·판지 모서리·종이 단면·면지의 미리 만든 재질.
- `public/media`: 미리 제작한 시작 영상, 표지와 펼침 완료 이미지, 구도 정보.
- `scripts/render-intro.mjs`: 실제 책과 같은 3D 부품(`src/film.tsx`)을 headless Chrome에서 촬영해 시작 영상을 만드는 오프라인 도구. Node.js·sharp·@napi-rs/canvas·FFmpeg·Chrome이 필요하며, 경로는 `CODEX_NODE_MODULES`, `FFMPEG_PATH`, `CHROME_PATH`로 지정합니다. 일반 실행·빌드에서는 필요하지 않습니다.
- `scripts/book-materials.mjs`: 실시간 조명 없이 사용하는 제본 재질 생성 도구. 표지는 매거진 표지 위에 천 결·홈·마모를 얹고, 움직이는 표지의 프레임마다 같은 마감을 입힙니다(`intro-cache/cover-texture`, 배포하지 않음).
- `scripts/capture-site-cover.mjs`: 매거진 첫 화면을 headless Chrome에서 책 판지 비율(세로)로 띄우고, 사이트의 애니메이션 시계를 영상 프레임 단위로 직접 넘기며 표지(그림·그늘·제목)를 캡처합니다(`intro-cache/site-cover`, 인터넷 필요). 표지를 새로 받으려면 이 스크립트 → `render-intro.mjs` 순서로 실행합니다.
- `art-src/site`: 매거진에서 받은 로고 원본과 표지 그림 원본. 헤더 로고는 `public/media/logo.webp`, 파비콘은 매거진과 같은 `public/art/favicon.svg`.
- `scripts/create-pages.mjs`: 장마다 장면 색에 맞춘 책장 인쇄면 SVG 생성. `scripts/make-social.mjs`: 링크 미리보기 이미지(`og-image.jpg`)와 홈 화면 아이콘 생성.
- `scripts/prepare-gpt-art.mjs`: GPT로 그린 판(`art-src/gpt/page-1~3/*.png`)을 오림 테두리를 두른 WebP 카드로 변환.
- `_archive/`: 지금은 쓰지 않는 첫 버전 장면 그림·글, 옛 그림 생성기, 누적 검증 기록.
- `tests/*.test.mjs`: `node --experimental-strip-types --test tests/*.test.mjs`로 종이 기하·입력·사물 부착·초기 렌더 준비 로직 검사(Node.js 22.18+).

## 에셋 및 라이선스

일러스트는 이 프로젝트를 위해 코드로 직접 제작했으며, 외부 그림이나 예제 저장소 코드를 복사하지 않았습니다. UI 아이콘은 Lucide(ISC 라이선스)입니다. Gowun Batang, Gowun Dodum, Noto Sans KR은 Google Fonts의 SIL Open Font License 폰트를 사용하며, 로드 실패 시 시스템 폰트로 표시합니다. 효과음은 Web Audio로 직접 합성해 녹음 음원에 의존하지 않습니다. 패키지의 라이선스는 각 패키지 배포물에 포함됩니다.

## 프로토타입 검증의 한계

모바일은 데스크톱 브라우저의 화면 크기 변경으로 확인했습니다. Android/iOS 실기기, 저사양 PC, 느린 네트워크, 의도적인 다운로드 실패·WebGL 컨텍스트 유실은 아직 검증하지 않았습니다. 표지는 회전 모델, 책장은 곡선 변형 모델입니다. 최종 고아슈 아트와 교육용 사실 콘텐츠 검수는 후속 작업입니다. 서버·로그인·결제는 없습니다.
