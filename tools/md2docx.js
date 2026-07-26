#!/usr/bin/env node
/**
 * 기획안 Markdown -> .docx 변환기
 *
 * 버전업 시 재실행해 배포본을 다시 만든다.
 *   node tools/md2docx.js <input.md> <output.docx>
 *
 * 지원 문법: ATX 헤딩, 문단, GFM 표, 코드펜스, 인용구, 순서/비순서 목록,
 *           수평선, 인라인 **굵게** 와 `코드`.
 */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageNumber, Header, Footer,
} = require('docx');

const FONT = 'Malgun Gothic';
const FONT_EA = '맑은 고딕';
const MONO = 'Consolas';
const ACCENT = '1F4D78';
const RULE = 'D9E1EA';

// 본문 폭 = A4(11906) - 좌우 여백(1440*2) = 9026 DXA
const CONTENT_WIDTH = 9026;

// ---------- 인라인 파싱 ----------

/** `**굵게**` 와 `` `코드` `` 를 TextRun 배열로 변환한다. */
function inline(text, base = {}) {
  const runs = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    if (m[2] !== undefined) {
      runs.push(new TextRun({ text: m[2], bold: true, ...base }));
    } else {
      runs.push(new TextRun({ text: m[3], font: MONO, size: 18, ...base }));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), ...base }));
  return runs.length ? runs : [new TextRun({ text: '', ...base })];
}

// 본문 폰트/크기는 문서 기본 스타일에 정의한다. 런에는 차이나는 값만 지정한다.
const fonts = (extra = {}) => extra;

// ---------- 블록 생성기 ----------

function heading(text, level) {
  const map = {
    1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4,
  };
  const sizes = { 1: 32, 2: 26, 3: 22, 4: 20 };
  return new Paragraph({
    heading: map[level] || HeadingLevel.HEADING_4,
    spacing: { before: level <= 2 ? 320 : 240, after: 140 },
    ...(level === 2
      ? { border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 6, color: RULE } } }
      : {}),
    children: inline(text, fonts({ bold: true, color: ACCENT, size: sizes[level] || 20 })),
  });
}

function body(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: inline(text),
  });
}

function quote(text) {
  return new Paragraph({
    spacing: { before: 120, after: 160 },
    indent: { left: 240, right: 240 },
    shading: { type: ShadingType.CLEAR, fill: 'F2F6FA' },
    // 한 면만 사용한다. docx-js는 문단 테두리를 top,bottom,left,right 순으로 쓰지만
    // 스키마는 top,left,bottom,right를 요구하므로 여러 면을 섞으면 검증에 실패한다.
    border: { left: { style: BorderStyle.SINGLE, size: 18, space: 8, color: ACCENT } },
    children: inline(text, fonts({ size: 19, color: ACCENT })),
  });
}

// 코드 줄은 서식을 문단 스타일 'CodeLine'에 몰아넣는다. 줄마다 음영·테두리·들여쓰기를
// 반복하면 document.xml이 크게 부풀기 때문이다.
function code(lines) {
  return lines.map(ln => new Paragraph({
    style: 'CodeLine',
    children: [new TextRun({ text: ln || ' ' })],
  }));
}

function listItem(text, ordered, index, level = 0) {
  return new Paragraph({
    spacing: { after: 60 },
    ...(ordered
      ? { numbering: { reference: 'ordered', level } }
      : { bullet: { level } }),
    children: inline(text),
  });
}

function hr() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: RULE } },
    children: [new TextRun({ text: '' })],
  });
}

/** GFM 표 -> docx Table. columnWidths 합계 = 셀 width 합계 = CONTENT_WIDTH. */
function table(rows) {
  const cols = Math.max(...rows.map(r => r.length));
  const norm = rows.map(r => { const c = r.slice(); while (c.length < cols) c.push(''); return c; });

  // 열별 최대 글자수 비례 배분(최소 8%, 최대 45%)
  const weights = [];
  for (let c = 0; c < cols; c++) {
    let max = 1;
    for (const r of norm) max = Math.max(max, r[c].replace(/[*`]/g, '').length);
    weights.push(Math.min(Math.max(max, 4), 46));
  }
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map(w => Math.floor(CONTENT_WIDTH * w / total));
  widths[cols - 1] += CONTENT_WIDTH - widths.reduce((a, b) => a + b, 0); // 반올림 오차 흡수

  const border = { style: BorderStyle.SINGLE, size: 2, color: 'BFCEDE' };
  // 여백은 표 단위로 한 번만 정의하고, 음영은 헤더행에만 준다(본문 셀 기본값은 흰색).
  const cell = (text, r, c) => new TableCell({
    width: { size: widths[c], type: WidthType.DXA },
    ...(r === 0 ? { shading: { type: ShadingType.CLEAR, fill: 'E8EFF7' } } : {}),
    children: [new Paragraph({
      spacing: { after: 0, line: 252 },
      ...(r === 0 ? { alignment: AlignmentType.CENTER } : {}),
      children: inline(text, fonts({ size: 18, ...(r === 0 ? { bold: true, color: ACCENT } : {}) })),
    })],
  });

  return new Table({
    columnWidths: widths,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    borders: { top: border, bottom: border, left: border, right: border,
               insideHorizontal: border, insideVertical: border },
    rows: norm.map((r, ri) => new TableRow({
      tableHeader: ri === 0,
      children: r.map((t, ci) => cell(t, ri, ci)),
    })),
  });
}

const splitRow = line =>
  line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(s => s.trim());

const isDivider = line => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');

// ---------- Markdown -> 블록 ----------

function convert(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // 코드 펜스
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(...code(buf));
      continue;
    }

    // 수평선
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push(hr()); i++; continue; }

    // 헤딩
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push(heading(h[2].trim(), h[1].length)); i++; continue; }

    // 표: 헤더행 + 구분행
    if (line.includes('|') && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const rows = [splitRow(line)];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i++]));
      }
      out.push(table(rows));
      out.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun('')] }));
      continue;
    }

    // 인용구 (연속 줄 병합)
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(quote(buf.join(' ').trim()));
      continue;
    }

    // 목록
    const li = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (li) {
      let n = 0;
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        if (!m) {
          // 목록 항목의 이어지는 줄
          if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && out.length) { i++; continue; }
          break;
        }
        const ordered = /\d+\./.test(m[2]);
        const level = Math.min(Math.floor(m[1].length / 2), 2);
        out.push(listItem(m[3].trim(), ordered, n++, level));
        i++;
      }
      continue;
    }

    // 문단 (연속 줄 병합)
    const buf = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>|```|\s*([-*+]|\d+\.)\s)/.test(lines[i])
           && !(lines[i].includes('|') && i + 1 < lines.length && isDivider(lines[i + 1]))
           && !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])) {
      buf.push(lines[i++].trim());
    }
    out.push(body(buf.join(' ')));
  }

  return out;
}

// ---------- 실행 ----------

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('usage: node tools/md2docx.js <input.md> <output.docx>');
  process.exit(1);
}

const doc = new Document({
  creator: 'Mirinai',
  title: '소상공인 정부지원·정책금융 공고 토큰 0 자동수집 시스템 상세기획안',
  description: '수집 시스템 상세기획안 v1.1',
  styles: {
    default: {
      document: {
        run: { font: { name: FONT, eastAsia: FONT_EA }, size: 20 },
        paragraph: { spacing: { line: 288 } },
      },
    },
    paragraphStyles: [{
      id: 'CodeLine',
      name: 'Code Line',
      basedOn: 'Normal',
      quickFormat: false,
      run: { font: MONO, size: 17 },
      paragraph: {
        spacing: { before: 0, after: 0, line: 240 },
        indent: { left: 180 },
        shading: { type: ShadingType.CLEAR, fill: 'F7F7F7' },
        border: { left: { style: BorderStyle.SINGLE, size: 12, space: 8, color: 'C8C8C8' } },
      },
    }],
  },
  numbering: {
    config: [{
      reference: 'ordered',
      levels: [0, 1, 2].map(level => ({
        level,
        format: LevelFormat.DECIMAL,
        text: `%${level + 1}.`,
        alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: 420 + level * 360, hanging: 300 } } },
      })),
    }],
  },
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            children: ['- ', PageNumber.CURRENT, ' -'],
            font: { name: FONT, eastAsia: FONT_EA }, size: 16, color: '808080',
          })],
        })],
      }),
    },
    children: convert(fs.readFileSync(inPath, 'utf8')),
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log(`wrote ${outPath} (${buf.length} bytes)`);
});
