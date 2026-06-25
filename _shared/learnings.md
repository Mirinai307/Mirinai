# Shared Learnings

작업 완료 후 재사용 가능한 교훈만 추가. append-only.  
중복·일회성·작업 특화 내용은 기록하지 말 것.

## 분류 규칙 (어디에 적을지)

- **시스템 운영 자체**에 대한, 어떤 작업에든 적용되는 교훈 → **이 파일** (`_shared/learnings.md`, git 추적·공개).
- **특정 외부 프로젝트/repo에 묶인** 교훈 → **`_local/learnings.md`** (git 추적 안 함·미배포. 없으면 새로 생성. 오케스트레이터는 명시 요청 없이는 로드하지 않음).

## 형식

```
## [YYYY-MM-DD] [작업명]
**교훈**: 한 문장. 다음 작업에 그대로 적용 가능한 형태로.
**근거**: 왜 그런지, 어떤 작업에서 발견했는지.
**worker**: [관련 worker명]
```

---

<!-- 이 아래부터 교훈 추가 -->

## [2026-06-25] insane-search 설치
**교훈**: 원격 컨테이너에서 git proxy가 허용하지 않는 외부 GitHub 레포는 `curl -L <zip-url>`로 zip을 받아 unzip 후 로컬 마켓플레이스로 등록하면 Claude Code 플러그인 설치 가능.
**근거**: git proxy는 `Mirinai307/Mirinai`만 허용하지만 HTTPS proxy는 GitHub 도메인의 파일 다운로드를 허용한다. `claude plugin marketplace add <local-path>` → `claude plugin install <name>@<marketplace>` 순서로 설치.
**worker**: orchestrator
