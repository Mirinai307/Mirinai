# 알려진 이슈

해결되지 않은 알려진 결함을 추적한다. 고쳐지면 해당 항목을 닫고(✅) PR 링크를 단다.
시스템이 깨지는 크리티컬은 즉시 수정 대상, 표시·미관 한정은 보류 가능.

출처: `repo-consistency-audit` (2026-05-19, claude-main·codex-main 병렬 + Orchestrator 교차검증).
상세 근거표(`repo-consistency-audit`)는 공개 배포본에 미포함 — 유지보수자 전용.

---

## KI-1 (audit C3) — 표준 `worker-brief.md`를 쓰면 mat이 워커 목적을 ` ```yaml `로 표시

- **상태**: 열림 / **보류** (경미·표시 한정. 크리티컬 C1·C2는 PR #3·#5에서 해소됨)
- **심각도**: 낮음 — 시스템·워커 호출·데이터에 영향 없음. [mat](https://github.com/netwaif/mat) **모니터 화면 표시만** 오염. mat 미사용 시 영향 0.
- **재현**: 항상. `_templates/worker-brief.md` 표준 구조를 그대로 채운 brief를 쓰는 모든 작업.

### 증상

mat의 핵심 화면 요소인 "워커 한 줄 목적"이 실제 Objective가 아니라 문자열 ` ```yaml `로 표시된다.

### 근본 원인

| repo | 파일·라인 | 내용 |
|------|-----------|------|
| starter | `_templates/worker-brief.md` | 1행 `# Brief`(heading), 2–4행 `<!-- -->`(comment), 6행 `## Execution Context`(heading), **8행 ` ```yaml ` fence** |
| mat | `internal/parser/task.go:280` | brief 존재 시 무조건 `w.Purpose = firstMeaningfulLine(brief 내용)` |
| mat | `internal/parser/task.go:499–515` | `firstMeaningfulLine`은 **빈 줄·`#`시작·`<!--`시작만 skip**, 그 다음 줄을 그대로 반환 |
| mat | `internal/parser/task.go:71–76` | `w.Purpose == ""`일 때만 `planned_workers.purpose`로 fallback |

### 수정 후보 (택1, 미결정)

- **(a) starter 템플릿** — `_templates/worker-brief.md`를 첫 의미 있는 줄이 실제 한 줄 목적이 되도록 재구성
- **(b) mat 파서** — `firstMeaningfulLine`이 코드펜스도 skip하거나, 명시적 purpose 필드를 우선

---

## KI-2 — Antigravity 호스트 설치 경로 미확정 (루트 `plugin.json` 미동봉)

- **상태**: 열림 / **보류** (생성 코어엔 영향 없음. 머지 전 실설치 검증 대상)
- **심각도**: 중간 — `antigravity` flavor **생성·validate·ZIP**은 호스트 독립으로 PASS. 영향 범위는 Antigravity를 **오케스트레이터 호스트로 두고 플러그인을 설치**하는 경로 한정.

---

## KI-3 — Windows 네이티브 미지원 (gemini/api 워커가 POSIX bash 디스패처에 의존)

- **상태**: 열림 / **보류** (출시 후 대응. 디스패처 Python 이식은 v2.1 로드맵)
- **심각도**: 중간 — 생성기·파일 코어·native(claude Task)·MCP(codex) 워커는 크로스플랫폼으로 동작. 차단점은 **gemini 워커(+api 폴백)** 한정.
