function encodeText(value) {
  let encoded = "";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    encoded += (code === 0x2212 ? 0x002d : code).toString(16).padStart(4, "0");
  }
  return `<${encoded.toUpperCase()}>`;
}

function drawText(commands, x, y, size, value) {
  commands.push(`BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm ${encodeText(value)} Tj ET`);
}

function textWidth(value, size) {
  let width = 0;
  for (const character of value) {
    if (character === " ") width += 0.25;
    else if ((character >= "0" && character <= "9") || "+-=−".includes(character)) width += 0.5;
    else width += 1;
  }
  return width * size;
}

function drawAnswerLine(commands, x, y, size) {
  drawRule(commands, x, y - 2, x + size * 3, y - 2);
}

function drawLabeledField(commands, x, y, size, label) {
  drawText(commands, x, y, size, label);
  const lineStart = x + textWidth(label, size) + size * 0.15;
  drawRule(commands, lineStart, y - 2, lineStart + size * 8, y - 2);
}

function drawMultiplicationQuestion(commands, question, x, y, size) {
  const [left, right] = question.text.split(" × ");
  const prefix = `${question.number}.  ${left} `;
  const symbolX = x + textWidth(prefix, size);
  const [rightOperand] = right.split(" = ");
  const rightPrefix = `${rightOperand} = `;
  drawText(commands, x, y, size, prefix);
  commands.push(`BT /F2 ${size} Tf 1 0 0 1 ${symbolX} ${y} Tm (\\327) Tj ET`);
  const rightX = symbolX + size * 1.1;
  drawText(commands, rightX, y, size, rightPrefix);
  drawAnswerLine(commands, rightX + textWidth(rightPrefix, size), y, size);
}

function drawRule(commands, x1, y1, x2, y2) {
  commands.push(`0.7 w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function buildContent(paper, includeAnswers) {
  const commands = ["0.12 0.17 0.14 rg", "0.12 0.17 0.14 RG"];
  drawText(commands, 215, 801, 18, "题匠 · 小学数学每日练习");
  drawText(commands, 44, 779, 9, `日期：${paper.date}`);
  drawLabeledField(commands, 48, 755, 10, "姓名：");
  drawLabeledField(commands, 220, 755, 10, "得分：");
  drawLabeledField(commands, 392, 755, 10, "用时：");
  drawRule(commands, 40, 744, 555, 744);

  drawText(commands, 44, 722, 12, "一、个位数乘法");
  const multiplication = paper.questions.filter(question => question.section === "乘法题");
  multiplication.forEach((question, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawMultiplicationQuestion(commands, question, column === 0 ? 48 : 310, 696 - row * 19, 10);
  });

  drawText(commands, 44, 581, 12, "二、20 以内加减法");
  const mixed = paper.questions.filter(question => question.section === "加减法题");
  mixed.forEach((question, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const questionPrefix = `${question.number}.  ${question.text.split(" = ")[0]} = `;
    const x = column === 0 ? 48 : 310;
    const y = 556 - row * 19;
    drawText(commands, x, y, 10, questionPrefix);
    drawAnswerLine(commands, x + textWidth(questionPrefix, 10), y, 10);
  });

  if (includeAnswers) {
    drawRule(commands, 40, 267, 555, 267);
    drawText(commands, 44, 248, 11, "参考答案");
    paper.questions.forEach((question, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      drawText(commands, 48 + column * 132, 225 - row * 13, 8, `${question.number}. ${question.answer}`);
    });
  }

  drawRule(commands, 40, 48, 555, 48);
  drawText(commands, 205, 32, 8, "每天练一点，进步看得见");
  return commands.join("\n");
}

function createPdf(paper, includeAnswers) {
  if (!paper || !Array.isArray(paper.questions) || paper.questions.length !== 40) {
    throw new Error("试卷数据无效");
  }

  const content = buildContent(paper, includeAnswers);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 7 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [5 0 R] >>",
    "<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 2 >> /DW 1000 /W [1 [250] 12 [500] 14 [500] 17 26 500 30 [500]] >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];

  let pdf = "%PDF-1.4\n% DailyMathWorksheet\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

module.exports = { createPdf };