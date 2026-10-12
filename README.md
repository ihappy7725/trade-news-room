# 뉴스 속 무역 공부방

세계 무역 뉴스를 고르고, 그래프를 직접 움직여 보고, 퀴즈를 풀며 무역 개념을 익히는 학습 웹사이트.

## 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 화면 구조, 3D가 안 될 때 보이는 그림 지도(SVG) |
| `css/style.css` | 디자인 (흰 카드·얇은 선, 왼쪽 정렬 섹션, 눈누 기초고딕) |
| `js/data.js` | 사이트 이름·챗봇 설정(`window.SITE`), 학습실 뉴스, 퀴즈, 용어, 무역 맵 장소, 요소 통계 |
| `js/sims.js` | 뉴스별 ‘만져보기’ 시뮬레이터 |
| `js/app.js` | 화면 동작, 저장, 실시간 뉴스 표시 |
| `js/scene3d.js` + `js/vendor/three.module.min.js` | 3D 무역 맵: 첫 화면을 꽉 채우는 해안 마을, 무역 장소 21곳·분야 5개 (three.js, MIT 라이선스: `js/vendor/three-LICENSE.txt`) |
| `js/sound.js` | 상단바 확성기 버튼의 배경음악, 항상 켜진 딸깍 효과음 (음원 파일 없이 브라우저에서 합성) |
| `js/guide.js` | 사이트 이름 적용, 안내 챗봇 |
| `fonts/` | 눈누 기초고딕 웹폰트 |
| `images/` | 앱 아이콘(`app-icon*.png`, `app-icon-maskable.png`, `favicon-64.png`, `apple-touch-icon.png`), 챗봇 캐릭터(`chatbot.png` 전신, `chatbot-face.png` 얼굴) |
| `api/news.js` | 실시간 뉴스를 받아오는 서버 함수 `/api/news` (Vercel Function, API 키를 숨김) |
| `package.json` | 서버 함수가 최신 자바스크립트 문법(import/export)을 쓰도록 알려 주는 설정 (설치할 것 없음) |
| `.vercelignore` | 웹에 올리지 않을 파일 (`docs/`, `README.md`) |
| `docs/project-prompt.md` | Claude 프로젝트 지침 |

## 배포 (GitHub + Vercel)

1. GitHub에 저장소를 만들고 이 폴더의 파일을 폴더 구조 그대로 올려요. (`.vercelignore`처럼 점으로 시작하는 파일도 함께 올려요.)
2. Vercel에서 Add New > Project를 누르고 GitHub 저장소를 가져와요. Framework Preset은 Other, Build Command와 Output Directory는 비워 둬요.
3. 같은 화면의 Environment Variables(배포 뒤에는 Settings > Environment Variables)에서 이름 `NEWS_API_KEY`, 값에 NewsData.io API 키를 넣어요.
4. Deploy를 눌러요. 키를 나중에 넣었거나 바꿨다면 Deployments에서 Redeploy를 해야 적용돼요.
5. 확인: 배포 주소 뒤에 `/api/news`를 붙여 열었을 때 `"ok":true`가 보이면 성공이에요.

## 규칙

- API 키를 코드, 커밋, 채팅에 절대 넣지 않아요. Vercel 환경 변수에만 넣어요.
- 실시간 뉴스는 영어 2번·한국어 1번 받아 10개 주제로 나누고, 30분 동안 캐시돼요(하루 최대 약 144크레딧). 무료 플랜은 하루 200크레딧, 기사는 약 12시간 늦게 들어와요.
- 학습 기록은 방문자 각자의 브라우저(localStorage, 키 `trade-news-room-v1`)에 저장돼요.
- 학습실 뉴스를 추가하려면 `js/data.js`의 `NEWS` 배열에 같은 형식으로 항목을 넣어요.

## 폰트 · 소리 · 챗봇

- 폰트: 눈누 기초고딕 (Project Noonnu). 웹에 올려 쓰기 전에 눈누 사이트의 사용 범위를 확인하세요.
- 배경음악: 저작권 걱정 없도록 Web Audio로 직접 합성한 잔잔한 코드와 오르골 멜로디. 상단바 오른쪽 확성기 아이콘으로 켜고 꺼요. 브라우저 정책상 자동 재생은 안 되고, 한 번 켜 두면 다음 방문 때 첫 클릭에서 다시 시작돼요. 효과음은 항상 켜져 있어요.
- 챗봇: AI가 아니라 사이트 안의 용어 사전, 학습실, 무역 맵 내용에서 답을 찾아요. API 비용이 들지 않아요.

## 출처

- 실시간 뉴스: NewsData.io. 기사 제목과 링크의 저작권은 각 언론사에 있어요.
- 요소 수입 통계: 관세청 수출입무역통계 (HS 310210, 2021–2025, 2026-10-08 조회)
- 학습실 뉴스 출처는 각 학습실과 `js/data.js`에 링크로 표시돼 있어요.
