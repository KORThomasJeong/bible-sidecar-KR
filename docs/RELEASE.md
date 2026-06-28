# 릴리즈 / 커뮤니티 스토어 제출 가이드

## 1. 사전 점검

```bash
npm run build   # tsc 타입체크 + esbuild 번들 → main.js 생성 (오류 0 확인)
npm test        # vitest (전부 통과 확인)
npm run lint    # eslint-plugin-obsidianmd 규칙 (error 0 확인)
```

- `manifest.json`이 저장소 루트에 있고 기본 브랜치에 커밋되어 있어야 합니다.
- `manifest.json`의 `version`은 SemVer `x.y.z` 형식 (현재 `1.0.0`).
- `manifest.json`의 `minAppVersion`(현재 `1.7.2`)은 사용하는 API의 최소 버전과 일치해야 합니다.
  - `Workspace.revealLeaf`가 1.7.2를 요구하므로 그보다 낮추지 마세요.
- `versions.json`이 `{ "1.0.0": "1.7.2" }` 처럼 플러그인 버전 → 최소 앱 버전을 매핑해야 합니다.
- 저작권 본문(개역개정 JSON)은 **절대 커밋/번들하지 않습니다.** `.gitignore`에 `*.nkrv.json`, `nkrv.json`이 포함되어 있습니다. 개역개정은 파일이 없어도 안내 메시지만 띄우고 정상 동작합니다(리뷰어가 본문 없이 테스트 가능).

## 2. GitHub 릴리즈

1. 버전 태그를 만듭니다. **태그 이름 = manifest의 version, `v` 접두사 없이** (예: `1.0.0`).
2. 릴리즈에 다음 3개 파일을 **개별 에셋으로** 첨부합니다.
   - `main.js` (`npm run build` 산출물)
   - `manifest.json`
   - `styles.css`

```bash
git tag 1.0.0
git push origin 1.0.0
# GitHub Releases에서 1.0.0 태그로 릴리즈 생성 후 main.js/manifest.json/styles.css 첨부
```

## 3. 커뮤니티 플러그인 등록 (최초 1회)

1. [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases) 저장소를 포크합니다.
2. `community-plugins.json` 끝에 항목을 추가합니다.

```json
{
	"id": "bible-sidecar-kr",
	"name": "Bible Sidecar KR",
	"author": "coffee",
	"description": "Korean Bible sidebar (개역한글/개역개정/NIV/KJV) with quick reference search like 히3 or Heb 3.",
	"repo": "<your-github-username>/bible-sidecar-KR"
}
```

3. PR을 올리고 자동 검증 봇 + 리뷰어 피드백에 대응합니다.

### 리뷰에서 자주 지적되는 점 (사전 대비)

- **id 규칙**: 소문자, `obsidian` 미포함, 설치 폴더명(`.obsidian/plugins/bible-sidecar-kr`)과 일치. ✔
- **사용자 지정 경로**는 `normalizePath()`로 처리. (개역개정 경로에 적용됨) ✔
- **이름 규칙**: Basic Latin + 공백/하이픈만. (`Bible Sidecar KR`) ✔
- **포크 사유**: 기존 Bible Sidecar의 포크이므로, 한국어 역본 특화·참조 검색이라는 차별점을 PR/README에 명확히 설명하세요.
- **저작권**: NIV는 저작권 본문이지만 런타임에 bolls.life API로 가져오며 번들하지 않습니다(원본 플러그인과 동일 방식). 개역개정은 사용자가 직접 제공합니다.

## 4. 알려진 사항

- `PluginSettingTab.display()`는 Obsidian 1.13.0부터 deprecated(→ `getSettingDefinitions`)이나, 현재도 표준 설정 API이며 대부분의 플러그인이 사용 중입니다. 추후 마이그레이션 대상으로 추적합니다. (`npm run lint` 시 warning 2건)

## 5. 이후 업데이트

1. 코드 수정 → `npm run build && npm test && npm run lint`.
2. `manifest.json`/`versions.json` 버전 상향 (`npm version`로 자동화 가능).
3. 새 태그로 GitHub 릴리즈 생성 + 에셋 첨부. (커뮤니티 목록은 자동 갱신되므로 추가 PR 불필요)
