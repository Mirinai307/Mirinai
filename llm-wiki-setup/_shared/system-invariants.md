# System Invariants — 시스템 수정 후 자가 점검

> **로드 정책**: 평소 미로드. 시스템 파일 수정·검증 작업일 때만 (`orchestrator-rules.md` §2).
> 목적: 시스템 변경 후 **전면 멀티에이전트 재감사 대신** 이 점검만 돌려 모순 재발을 잡는다.
> 통과해야 커밋. 깨지면 고치거나, 의도된 변경이면 `design-basis.md` 결정(D*)·이 표를 함께 갱신.

## 불변식 목록

| ID | 불변식 | 깨지면 |
|---|---|---|
| INV1 | `write_scope` 값 집합이 CLAUDE.md(정의처)·routing.md·_templates/worker-brief.md·task-folder.md에서 동일 (`none`/`tasks-only`/패턴) | D1 위반 — 어디든 한 곳만 다르면 시스템 자체 모순 |
| INV2 | codex-critic 선행조건에 "claude-main result.md 존재 필수" 같은 **전용 강제** 표현 없음 (일반화 표현이어야) | D2 위반 |
| INV3 | log 태그 = 정확히 `DECISION\|WORKER_CALL\|VERIFICATION\|ERROR\|APPROVAL\|COMPLETE` 6종 (_templates/log.md) | 파서·일관성 깨짐 |
| INV4 | context.md 한도 1500자, brief 한도 1200자 수치가 CLAUDE.md·_templates 헤더에서 동일 | 한도 불일치 |
| INV9 | gemini 백엔드가 `_shared/backends.json`에서 `agy` CLI(call_type cli·command agy)이고 기본 모델 `gemini-3.1-pro-high` | 정본이 폐기 프록시/known-bad 경로 호출 (D4 위반) |
| INV10 | 폐기 브리지 **`mcp__gemini__gemini_*`(CLI 래퍼) 및 `mcp__gemini-pro__*`(프록시)** 가 routing.md·CLAUDE.md에 **활성 호출**로 없음 | D4 위반 |
| INV11 | 재진입 프로토콜이 orchestrator-rules.md §3 **와** CLAUDE.md Task Lifecycle 포인터에 **둘 다** 존재. routing.md 토폴로지표에 4패턴(Pipeline/Fan-out·in/Expert Pool/Producer-Reviewer) 모두 존재하고, Supervisor·Hierarchical은 "배제" 줄에만 등장 | D6 위반 |
| INV12 | 카파시 4원칙: CLAUDE.md에 "운영 원칙 (Operating Principles)" 섹션 존재, _templates/worker-brief.md에 "Worker 행동 규약" 고정 블록 존재, **블록 안에 사용자질문 지시(질문/ask) 없음** | D8 위반 |

## 자가 점검 스크립트

`/home/user/Mirinai`에서 실행.

```bash
ROOT=/home/user/Mirinai

echo "INV1 tasks-only 분포 (CLAUDE/routing/templates 모두 존재해야)"
grep -l 'tasks-only' "$ROOT/CLAUDE.md" "$ROOT/_shared/routing.md" \
  "$ROOT/_templates/worker-brief.md" "$ROOT/_templates/task-folder.md"

echo "INV2 codex-critic 전용 강제 표현 (출력 없어야 PASS)"
grep -n 'result.md. 존재 필수\|claude-main 결과 필요 → 항상 후행' "$ROOT/_shared/routing.md"

echo "INV3 log 태그 (_templates/log.md 에 6종 정의 라인 확인)"
grep -n 'DECISION | WORKER_CALL | VERIFICATION | ERROR | APPROVAL | COMPLETE' "$ROOT/_templates/log.md"

echo "INV4 한도 수치 (1500 / 1200 각 파일)"
grep -rn '1500자\|1200자' "$ROOT/CLAUDE.md" "$ROOT/_templates/context.md" "$ROOT/_templates/worker-brief.md"

echo "INV9 gemini 백엔드 (backends.json gemini=agy cli·pro-high 여야; 둘 다 출력돼야 PASS)"
grep -n '"command": "agy"' "$ROOT/_shared/backends.json"
grep -n 'gemini-3.1-pro-high' "$ROOT/_shared/backends.json"

echo "INV10 폐기 브리지 활성호출 (출력 없어야 PASS)"
grep -rn 'mcp__gemini__gemini_' "$ROOT/_shared/routing.md" "$ROOT/CLAUDE.md"

echo "INV11a 재진입: orchestrator-rules §3 존재"
grep -q '재진입 프로토콜' "$ROOT/_shared/orchestrator-rules.md" && echo " orchestrator-rules PASS" || echo " orchestrator-rules FAIL"
grep -q '재진입 프로토콜' "$ROOT/CLAUDE.md" && echo " CLAUDE.md PASS" || echo " CLAUDE.md FAIL"
echo "INV11b 토폴로지 4패턴 모두 존재 (4개 PASS 떠야)"
for p in 'Pipeline' 'Fan-out/Fan-in' 'Expert Pool' 'Producer-Reviewer'; do
  grep -q "$p" "$ROOT/_shared/routing.md" && echo " $p PASS" || echo " $p FAIL"
done

echo "INV12a 운영 원칙 섹션 (CLAUDE.md 에 존재해야)"
grep -n '운영 원칙 (Operating Principles)' "$ROOT/CLAUDE.md"
echo "INV12b Worker 행동 규약 고정 블록 (worker-brief 에 존재해야)"
grep -n 'Worker 행동 규약' "$ROOT/_templates/worker-brief.md"
echo "INV12c 블록 내 사용자질문 표현 (출력 없어야 PASS)"
sed -n '/^## Worker 행동 규약/,/^## Execution/p' "$ROOT/_templates/worker-brief.md" | grep -inE '질문|ask' || echo " (없음 = PASS)"
```
