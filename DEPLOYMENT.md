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
