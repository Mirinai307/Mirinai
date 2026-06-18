#!/usr/bin/env bash
# MultiAgent 하네스 설치 스크립트
# 사용: bash install.sh ~/Desktop/LLM-Wiki
# 이미 있는 파일은 덮어쓰지 않음 (--force 로 강제 덮어쓰기)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORCE=0

# ── 인수 파싱 ────────────────────────────────────────────────────
for arg in "$@"; do
    case "$arg" in
        --force) FORCE=1 ;;
        -*) echo "[error] 알 수 없는 옵션: $arg"; exit 1 ;;
        *)  TARGET="$arg" ;;
    esac
done

if [[ -z "${TARGET:-}" ]]; then
    read -r -p "LLM-Wiki 폴더 경로 (예: ~/Desktop/LLM-Wiki): " TARGET
fi

TARGET="$(eval echo "$TARGET")"   # ~/ 확장
TARGET="$(cd "$(dirname "$TARGET")" 2>/dev/null && echo "$(pwd)/$(basename "$TARGET")" || echo "$TARGET")"

echo ""
echo "  대상 폴더  : $TARGET"
echo "  KNOT_VAULT : $TARGET/knot"
echo "  모드       : $([ -d "$TARGET" ] && echo 'update (기존 파일 보존)' || echo 'init')"
echo ""
read -r -p "진행할까요? [y/N]: " yn
[[ "$yn" =~ ^[Yy]$ ]] || { echo "취소됨"; exit 0; }

# ── 디렉토리 생성 ────────────────────────────────────────────────
mkdir -p \
    "$TARGET/.claude/agents" \
    "$TARGET/_shared/adapters" \
    "$TARGET/_templates" \
    "$TARGET/tasks" \
    "$TARGET/_local" \
    "$TARGET/knot/inbox" \
    "$TARGET/knot/wiki" \
    "$TARGET/knot/raw" \
    "$TARGET/knot/prompts" \
    "$TARGET/knot/scripts"

# ── 파일 복사 헬퍼 ───────────────────────────────────────────────
cp_file() {
    local src="$1" dst="$2"
    if [[ -f "$dst" && "$FORCE" -eq 0 ]]; then
        echo "  [skip] 이미 존재: $dst"
        return
    fi
    cp "$src" "$dst"
    echo "  [write] $dst"
}

# ── 하네스 파일 복사 ─────────────────────────────────────────────
# CLAUDE.md — 경로 참조를 TARGET으로 교체
if [[ ! -f "$TARGET/CLAUDE.md" || "$FORCE" -eq 1 ]]; then
    sed "s|/home/user/Mirinai|$TARGET|g" \
        "$REPO_DIR/CLAUDE.md" > "$TARGET/CLAUDE.md"
    echo "  [write] $TARGET/CLAUDE.md"
else
    echo "  [skip] 이미 존재: $TARGET/CLAUDE.md"
fi

for f in .mcp.json .gitignore LICENSE NOTICE KNOWN_ISSUES.md; do
    [[ -f "$REPO_DIR/$f" ]] && cp_file "$REPO_DIR/$f" "$TARGET/$f"
done

cp_file "$REPO_DIR/.claude/agents/claude-main.md" "$TARGET/.claude/agents/claude-main.md"

for f in routing.md approval-policy.md orchestrator-rules.md backends.json \
          design-basis.md system-invariants.md learnings.md; do
    [[ -f "$REPO_DIR/_shared/$f" ]] && cp_file "$REPO_DIR/_shared/$f" "$TARGET/_shared/$f"
done

for f in _run.py call_worker.sh gemini_api.sh; do
    [[ -f "$REPO_DIR/_shared/adapters/$f" ]] && \
        cp_file "$REPO_DIR/_shared/adapters/$f" "$TARGET/_shared/adapters/$f"
done

for f in task.md context.md log.md worker-brief.md worker-result.md task-folder.md; do
    [[ -f "$REPO_DIR/_templates/$f" ]] && cp_file "$REPO_DIR/_templates/$f" "$TARGET/_templates/$f"
done

# .gitkeep 플레이스홀더
touch "$TARGET/tasks/.gitkeep" "$TARGET/_local/.gitkeep"

# ── knot vault 복사 ──────────────────────────────────────────────
for f in schema.md index.md log.md CLAUDE.md AGENTS.md GEMINI.md README.md; do
    [[ -f "$REPO_DIR/knot/$f" ]] && cp_file "$REPO_DIR/knot/$f" "$TARGET/knot/$f"
done

for f in ingest.md lint.md query.md; do
    [[ -f "$REPO_DIR/knot/prompts/$f" ]] && \
        cp_file "$REPO_DIR/knot/prompts/$f" "$TARGET/knot/prompts/$f"
done

[[ -f "$REPO_DIR/knot/scripts/lint.py" ]] && \
    cp_file "$REPO_DIR/knot/scripts/lint.py" "$TARGET/knot/scripts/lint.py"

touch "$TARGET/knot/inbox/.gitkeep" \
      "$TARGET/knot/wiki/.gitkeep" \
      "$TARGET/knot/raw/.gitkeep"

# knot/schema.md — KNOT_VAULT 경로 갱신
if [[ -f "$TARGET/knot/schema.md" ]]; then
    sed -i "s|KNOT_VAULT=/home/user/Mirinai/knot|KNOT_VAULT=$TARGET/knot|g" \
        "$TARGET/knot/schema.md"
fi

# ── KNOT_VAULT 환경변수 안내 ─────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  설치 완료!"
echo ""
echo "  다음 단계:"
echo "  1. KNOT_VAULT 설정 (터미널에서 한 번 실행):"
echo "     echo \"$TARGET/knot\" > ~/.config/knot/vault"
echo ""
echo "  2. LLM-Wiki 폴더에서 Claude Code 실행:"
echo "     cd \"$TARGET\" && claude"
echo ""
echo "  3. lint 확인:"
echo "     python3 \"$TARGET/knot/scripts/lint.py\" \"$TARGET/knot\""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
