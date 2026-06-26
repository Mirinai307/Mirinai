# insane-search 로컬 설치 가이드

Claude Code 플러그인 `insane-search`를 로컬 환경에 설치하는 방법입니다.  
트위터/X, Reddit, YouTube, 네이버, 쿠팡 등 차단된 사이트에 자동으로 접근합니다.

---

## 사전 요구사항

- Claude Code CLI 설치됨 (`claude --version`)
- Python 3.9+
- Node.js (선택 — Playwright 로컬 실행 시 필요)

---

## 설치

### 1단계 — 마켓플레이스 등록

```bash
claude plugin marketplace add https://github.com/fivetaku/gptaku_plugins.git
```

> 처음 실행 시 GitHub에서 마켓플레이스를 클론합니다 (수 초 소요).

### 2단계 — 플러그인 설치

```bash
claude plugin install insane-search@gptaku-plugins
```

설치 확인:

```bash
claude plugin list
# insane-search@gptaku-plugins  v0.8.2  ✓ enabled 이 보이면 완료
```

### 3단계 — Python 의존성 설치

```bash
pip install "curl_cffi>=0.15.0" beautifulsoup4 pyyaml
```

`curl_cffi 0.15+`가 필수입니다 — 0.14는 Chrome 지문이 구버전(chrome142)에 고정되어 최신 WAF에 탐지됩니다.

### 4단계 (선택) — Playwright 설치

Cloudflare·Akamai 등 강한 WAF 사이트까지 뚫으려면 Playwright도 설치합니다.

```bash
npm install -g playwright playwright-extra puppeteer-extra-plugin-stealth
npx playwright install chrome
```

---

## 검증

```bash
# 플러그인 상세 확인
claude plugin details insane-search

# 엔진 도움말
PLUGIN_ROOT=$(claude plugin details insane-search 2>&1 | grep -o '~/.claude/plugins/.*' | head -1 || echo "$HOME/.claude/plugins/cache/gptaku-plugins/insane-search/0.8.2")
cd "$HOME/.claude/plugins/cache/gptaku-plugins/insane-search/0.8.2/skills/insane-search"
python3 -m engine --help

# 유닛 테스트 (네트워크 불필요)
python3 engine/tests/test_smoke.py
python3 engine/tests/test_u1.py
python3 engine/tests/test_u7.py

# 편향 검사 (사이트명 하드코딩 없는지)
python3 engine/bias_check.py

# 실제 URL 테스트
python3 -m engine "https://news.ycombinator.com" --json
```

---

## 사용법

설치 후 Claude Code에서 자연어로 요청하면 자동 활성화됩니다.

```
트위터 @elonmusk 타임라인 읽어줘
레딧 r/MachineLearning 최근 글 가져와
유튜브 https://youtu.be/xxx 자막 추출해줘
네이버 블로그 https://blog.naver.com/xxx 읽어줘
스택오버플로우 https://stackoverflow.com/questions/xxx 읽어줘
```

또는 차단된 URL에 WebFetch가 실패하면 자동으로 insane-search가 개입합니다.

---

## 업데이트

```bash
claude plugin update insane-search
```

---

## 제거

```bash
claude plugin uninstall insane-search
```

---

## 문제 해결

### `curl_cffi` 버전 오류

```bash
python3 -c "import curl_cffi; print(curl_cffi.__version__)"
pip install -U "curl_cffi>=0.15.0"
```

### Playwright 폴백이 작동 안 함

```bash
npx playwright install chrome
# 또는
npx playwright install chromium
```

### 마켓플레이스 클론 실패

git이 GitHub에 접근하지 못하는 환경(방화벽·프록시)에서는 zip으로 수동 설치합니다:

```bash
# 1. 플러그인 zip 다운로드
curl -L https://github.com/fivetaku/insane-search/archive/refs/heads/main.zip -o /tmp/insane-search.zip
unzip /tmp/insane-search.zip -d /tmp/

# 2. 마켓플레이스 zip 다운로드
curl -L https://github.com/fivetaku/gptaku_plugins/archive/refs/heads/main.zip -o /tmp/gptaku_plugins.zip
unzip /tmp/gptaku_plugins.zip -d /tmp/

# 3. 서브모듈 내용 채우기
cp -r /tmp/insane-search-main/. /tmp/gptaku_plugins-main/plugins/insane-search/

# 4. 로컬 경로로 마켓플레이스 등록 후 설치
claude plugin marketplace add /tmp/gptaku_plugins-main
claude plugin install insane-search@gptaku-plugins
```

---

## 참고

- 플러그인 소스: [fivetaku/insane-search](https://github.com/fivetaku/insane-search)
- 마켓플레이스: [fivetaku/gptaku_plugins](https://github.com/fivetaku/gptaku_plugins)
