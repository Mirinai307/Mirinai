# LLM-Wiki × MultiAgent 설치 안내

이 폴더 전체를 **LLM-Wiki 폴더 안으로 복사**하면 됩니다.

## 1단계 — 파일 복사

이 폴더의 모든 파일을 LLM-Wiki 폴더로 옮깁니다.  
*(macOS Finder: 이 폴더 전체 선택 → LLM-Wiki 폴더에 붙여넣기)*

```
LLM-Wiki/          ← 여기에 붙여넣기
├── CLAUDE.md
├── .mcp.json
├── .claude/
├── _shared/
├── _templates/
├── knot/
├── tasks/
└── _local/
```

기존 LLM-Wiki 파일은 건드리지 않으므로 안심하고 붙여넣으면 됩니다.

## 2단계 — KNOT_VAULT 설정 (한 번만)

터미널을 열고 아래 명령을 실행합니다.  
`<LLM-Wiki 폴더 경로>`를 실제 경로로 바꿔주세요.

```bash
mkdir -p ~/.config/knot
echo "<LLM-Wiki 폴더 경로>/knot" > ~/.config/knot/vault
```

예시 (바탕화면에 있을 경우):
```bash
echo "$HOME/Desktop/LLM-Wiki/knot" > ~/.config/knot/vault
```

## 3단계 — Claude Code 실행

LLM-Wiki 폴더 안에서 Claude Code를 엽니다.

**Claude Code 앱(데스크톱)** 사용 시:  
→ 파일 > 폴더 열기 > LLM-Wiki 선택

**터미널** 사용 시:
```bash
cd ~/Desktop/LLM-Wiki && claude
```

Claude Code를 열면 CLAUDE.md가 자동으로 로드되고,  
"이 시스템 규칙 요약해줘"라고 물어보면 규칙이 적용됐는지 확인할 수 있습니다.

## 4단계 — 첫 번째 지식 등록 (선택)

기존 LLM-Wiki 메모나 자료를 `knot/inbox/`에 복사하고:

```
"inbox에 있는 자료 ingest 해줘"
```

Claude가 정독 후 `knot/wiki/`에 구조화된 페이지로 정리합니다.

---

## 시스템 구조 요약

| 폴더/파일 | 역할 |
|-----------|------|
| `CLAUDE.md` | 오케스트레이터 규칙 (Claude 자동 로드) |
| `_shared/` | 워커 라우팅, 승인 정책, 설정 |
| `_templates/` | 작업 양식 (task/brief/result) |
| `tasks/` | 작업 폴더 (작업마다 하나씩 생성) |
| `knot/` | 지식그물 vault |
| `knot/inbox/` | 새 자료 투입구 |
| `knot/wiki/` | AI가 정리한 지식 페이지 |
| `knot/raw/` | 원본 보관 |
