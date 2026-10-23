# GitHub에서 Vercel로 배포하기

이 프로젝트는 React + Vite로 빌드하는 정적 웹사이트입니다. `vercel.json`에 설치·빌드·출력 폴더를 설정했습니다. 환경 변수는 필요하지 않습니다.

1. GitHub에서 `PopupBook` 저장소를 만듭니다.
2. 준비된 `PopupBook-source.zip`을 압축 해제합니다. 그 안의 `src`, `public`, `package.json` 등 모든 파일과 폴더를 저장소 최상위에 올립니다. ZIP 자체를 올리는 방식은 아닙니다. `node_modules`, `dist`, `.git`, `.openai`, `.sites-runtime`은 업로드 대상이 아닙니다.
3. [Vercel 새 프로젝트](https://vercel.com/new)에서 GitHub 저장소를 선택하고 Import합니다.
4. 아래 설정을 확인하고 Deploy합니다.

| 항목 | 값 |
| --- | --- |
| Root Directory | `./` — 저장소 최상위에 `package.json`이 있을 때 |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variables | 없음 |

폴더 전체를 저장소 안의 `jeju-storybook` 하위 폴더로 올린 경우에만 Root Directory를 `jeju-storybook`으로 선택합니다.

배포 성공 후 Vercel이 표시하는 사이트 주소를 열어 표지 펼침, 책장 넘김, 세 장의 풍경을 확인합니다. 이후 연결된 배포 브랜치에 수정본을 올리면 Vercel이 새 버전을 빌드합니다.

공식 안내: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel 프로젝트 설정](https://vercel.com/docs/project-configuration/project-settings).

# GitHub Pages로 배포하기

주소: https://yigd-96.github.io/PopupBook/

빌드 결과의 경로는 모두 상대 경로입니다(`vite.config.ts`의 `base: './'`, 앱 안의 경로는 `src/base.ts`의 `url()`). 그래서 같은 빌드를 도메인 최상위(Vercel), 하위 경로(GitHub Pages의 `/PopupBook/`), 다른 사이트 어디에 올려도 그대로 동작합니다. 꼭 절대 경로가 필요한 곳이면 빌드할 때 `VITE_BASE=/경로/`를 주면 됩니다.

1. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿉니다(처음 한 번). "Deploy from a branch"로 두면 빌드 전 소스가 그대로 올라가 빈 화면이 나옵니다.
2. `main`에 올리면 `.github/workflows/deploy-pages.yml`이 `npm ci` → `npm run build` → `dist`를 Pages에 배포합니다. Actions 탭에서 수동 실행(Run workflow)도 됩니다.
3. 선택: GA4를 쓰려면 Settings → Secrets and variables → Actions → **Variables**에 `VITE_GA_ID`를 추가합니다.

웹진(https://lxwebzine.hankyung.com/2026-1/team5)이 기본 주소입니다: `.env.production`에 `VITE_SITE_URL`로 적혀 있어, 그냥 `npm run build`해도 공유 미리보기 사진(og:image)과 canonical·sitemap이 그 전체 주소로 들어갑니다(카카오톡·페이스북은 경로만 적힌 사진을 못 가져옵니다). 빌드 환경에서 `VITE_SITE_URL`을 주면 그쪽이 우선합니다(GitHub Pages 워크플로처럼).

다른 사이트에 올릴 때는 `npm run build`로 만든 `dist` 폴더 전체를 그 사이트의 원하는 경로에 그대로 올리면 됩니다. 검색용 절대 주소(canonical, og:image, sitemap)는 빌드할 때 `VITE_SITE_URL=그 사이트 주소`로 맞춥니다.

서버 함수는 쓰지 않으므로 Pages에서도 그대로 동작합니다. 책의 언어는 기본이 한국어이고, 읽는 사람이 설정(오른쪽 위 톱니)에서 고르면 그 브라우저에 기억됩니다.
