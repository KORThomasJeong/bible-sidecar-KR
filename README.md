# Bible Sidecar KR

Obsidian 사이드바에서 성경을 읽고, 구절을 노트로 복사할 수 있는 플러그인입니다. 한국어 사용 환경에 맞춰 **개역한글 · 개역개정 · NIV · KJV** 4개 역본만 제공하고, 상단 검색창으로 `히3`, `히브리서 3`, `히3:5`, `Heb 3` 처럼 입력하면 바로 해당 장/절로 이동합니다.

> 이 플러그인은 [Janis Ringli](https://github.com/janisringli)님의 **Bible Sidecar** 플러그인을 포크해 한국어 환경에 맞게 재구성한 것입니다. (MIT License)

## 주요 기능

- **역본 4종**: 개역한글(KRV·기본), 개역개정(로컬 파일), NIV, KJV
- **빠른 참조 검색**: 상단 검색창에 입력 → 자동완성 후보 표시 → Enter 또는 클릭으로 이동
  - `히3` / `히브리서 3` / `Heb 3` → 해당 장 전체
  - `히3:5` → 3장을 열고 5절로 스크롤 + 하이라이트
  - 한글 책 이름·약어와 영어 책 이름·약어 모두 인식
- **브라우즈**: 검색창 아래에 구약/신약 → 책 → 장 버튼 UI 유지
- **구절 복사**: 절을 클릭해 선택 후 클립보드로 복사 (복사 형식·출처 표기·내부 링크 옵션)

## 성경 본문 출처

- 개역한글 / NIV / KJV: [bolls.life](https://bolls.life) 공개 API에서 실시간으로 가져옵니다. (플러그인에 본문을 포함하지 않음)
- **개역개정**: 저작권 보호 본문이므로 플러그인에 포함되지 않습니다. 사용자가 직접 준비한 JSON 파일을 vault에 넣고 경로를 설정해야 합니다. (아래 참고)

## 개역개정 설정 방법

1. 개역개정 본문 JSON 파일을 vault 안에 둡니다. (예: `bible/nkrv.json`)
2. 설정 → "Bible Sidecar KR" → **개역개정 JSON 경로**에 해당 경로를 입력합니다.
3. 역본 드롭다운에서 "개역개정"을 선택합니다.

> 파일이 없거나 경로가 비어 있으면 개역개정 선택 시 안내 메시지만 표시되고 오류가 나지 않습니다.

### JSON 형식

플러그인은 두 가지 형식을 모두 읽습니다.

**(권장) 중첩 형식** — `{ "<bookid>": { "<chapter>": [ { "verse": n, "text": "..." } ] } }`

```json
{
  "58": {
    "3": [
      { "verse": 1, "text": "그러므로 ..." },
      { "verse": 2, "text": "..." }
    ]
  }
}
```

**평면 배열 형식** — `[ { "book": <bookid>, "chapter": n, "verse": n, "text": "..." } ]`

`bookid`는 개신교 정경 순서 1~66 (창세기=1 … 마태복음=40 … 요한계시록=66) 입니다.

### 변환 스크립트

평면 배열 형식을 권장(중첩) 형식으로 바꾸려면:

```bash
node scripts/convert-nkrv.mjs input.json output.json
```

## 설치

### 커뮤니티 스토어 (배포 후)

설정 → 커뮤니티 플러그인 → 탐색 → "Bible Sidecar KR" 검색 → 설치 → 활성화.

### 수동 설치

1. 릴리즈에서 `main.js`, `manifest.json`, `styles.css`를 내려받습니다.
2. vault의 `.obsidian/plugins/bible-sidecar-kr/` 폴더에 복사합니다.
3. Obsidian을 다시 시작하고 커뮤니티 플러그인에서 활성화합니다.

## 개발

```bash
npm install      # 의존성 설치
npm run dev      # 워치 빌드
npm run build    # 타입체크 + 프로덕션 번들 (main.js 생성)
npm test         # 단위 테스트 (vitest)
npm run lint     # eslint (eslint-plugin-obsidianmd 포함)
```

빌드/릴리즈/스토어 제출 절차는 [docs/RELEASE.md](docs/RELEASE.md)를 참고하세요.

## 크레딧 / 라이선스

- 원작: **Bible Sidecar** by [Janis Ringli](https://github.com/janisringli) (MIT)
- 포크: Bible Sidecar KR (MIT)
- 성경 본문 API: [bolls.life](https://bolls.life)

본 저장소의 코드는 MIT 라이선스로 배포됩니다. 단, 개역개정 등 저작권이 있는 성경 본문은 저장소에 포함되지 않으며, 사용자가 합법적으로 확보한 본문을 개인적으로만 사용해야 합니다.
