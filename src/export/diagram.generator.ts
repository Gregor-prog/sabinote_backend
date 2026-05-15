import PDFDocument = require('pdfkit');
import type { Diagram } from '../generation/schemas/diagram.schema';

// ─── SVG Generators (used for DOCX via base64 img) ────────────────────────────

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateSvg(diagram: Diagram): string {
  switch (diagram.type) {
    case 'number_line':     return numberLineSvg(diagram);
    case 'cartesian_plane': return cartesianPlaneSvg(diagram);
    case 'bar_chart':       return barChartSvg(diagram);
    case 'table_of_values': return tableOfValuesSvg(diagram);
  }
}

function numberLineSvg(d: Diagram): string {
  const W = 500, H = 80;
  const [rMin, rMax] = d.range ?? [-5, 5];
  const count = Math.max(rMax - rMin, 1);
  const padL = 40, padR = 40;
  const lineY = 35;
  const lineXStart = padL, lineXEnd = W - padR;
  const unitW = (lineXEnd - lineXStart) / count;
  const toX = (v: number) => lineXStart + (v - rMin) * unitW;

  let ticks = '';
  for (let i = rMin; i <= rMax; i++) {
    const x = toX(i);
    ticks += `<line x1="${x}" y1="${lineY - 6}" x2="${x}" y2="${lineY + 6}" stroke="#000" stroke-width="1.5"/>`;
    ticks += `<text x="${x}" y="${lineY + 18}" text-anchor="middle" font-size="10" font-family="serif">${i}</text>`;
  }

  let marked = '';
  for (const pt of d.markedPoints ?? []) {
    const x = toX(pt.value);
    marked += `<circle cx="${x}" cy="${lineY}" r="5" fill="#1a56db" stroke="#fff" stroke-width="1"/>`;
    if (pt.label && pt.label !== String(pt.value)) {
      marked += `<text x="${x}" y="${lineY - 10}" text-anchor="middle" font-size="10" font-family="serif" fill="#1a56db" font-weight="bold">${esc(pt.label)}</text>`;
    }
  }

  const title = d.title
    ? `<text x="${W / 2}" y="${H - 2}" text-anchor="middle" font-size="10" font-family="serif" font-style="italic" fill="#555">${esc(d.title)}</text>`
    : '';

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="nlarr" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
    <polygon points="0 0, 6 2.5, 0 5" fill="#000"/>
  </marker></defs>
  <line x1="${lineXStart - 5}" y1="${lineY}" x2="${lineXEnd + 8}" y2="${lineY}" stroke="#000" stroke-width="2" marker-end="url(#nlarr)"/>
  ${ticks}${marked}${title}
</svg>`;
}

function cartesianPlaneSvg(d: Diagram): string {
  const SIZE = 380, margin = 45;
  const [xMin, xMax] = d.xRange ?? [-6, 6];
  const [yMin, yMax] = d.yRange ?? [-6, 6];
  const inner = SIZE - margin * 2;
  const toSX = (v: number) => margin + ((v - xMin) / (xMax - xMin)) * inner;
  const toSY = (v: number) => SIZE - margin - ((v - yMin) / (yMax - yMin)) * inner;
  const ox = toSX(0), oy = toSY(0);

  let grid = '';
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    const sx = toSX(x);
    grid += `<line x1="${sx}" y1="${margin}" x2="${sx}" y2="${SIZE - margin}" stroke="#e0e0e0" stroke-width="0.5"/>`;
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    const sy = toSY(y);
    grid += `<line x1="${margin}" y1="${sy}" x2="${SIZE - margin}" y2="${sy}" stroke="#e0e0e0" stroke-width="0.5"/>`;
  }

  let ticks = '';
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    if (x === 0) continue;
    const sx = toSX(x);
    ticks += `<line x1="${sx}" y1="${oy - 4}" x2="${sx}" y2="${oy + 4}" stroke="#000" stroke-width="1"/>`;
    ticks += `<text x="${sx}" y="${oy + 14}" text-anchor="middle" font-size="9" font-family="serif">${x}</text>`;
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    if (y === 0) continue;
    const sy = toSY(y);
    ticks += `<line x1="${ox - 4}" y1="${sy}" x2="${ox + 4}" y2="${sy}" stroke="#000" stroke-width="1"/>`;
    ticks += `<text x="${ox - 7}" y="${sy + 4}" text-anchor="end" font-size="9" font-family="serif">${y}</text>`;
  }

  let linesSvg = '';
  for (const ln of d.lines ?? []) {
    linesSvg += `<line x1="${toSX(ln.from.x)}" y1="${toSY(ln.from.y)}" x2="${toSX(ln.to.x)}" y2="${toSY(ln.to.y)}" stroke="#e63946" stroke-width="1.5"/>`;
  }

  let pts = '';
  for (const pt of d.points ?? []) {
    const sx = toSX(pt.x), sy = toSY(pt.y);
    pts += `<circle cx="${sx}" cy="${sy}" r="4" fill="#1a56db"/>`;
    if (pt.label) {
      pts += `<text x="${sx + 7}" y="${sy - 5}" font-size="9" font-family="serif" fill="#1a56db">${esc(pt.label)}(${pt.x},${pt.y})</text>`;
    }
  }

  const title = d.title
    ? `<text x="${SIZE / 2}" y="${SIZE - 4}" text-anchor="middle" font-size="10" font-family="serif" font-style="italic" fill="#555">${esc(d.title)}</text>`
    : '';

  return `<svg viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="cpax" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
    <polygon points="0 0, 7 2.5, 0 5" fill="#000"/>
  </marker></defs>
  ${grid}${linesSvg}
  <line x1="${margin - 5}" y1="${oy}" x2="${SIZE - margin + 8}" y2="${oy}" stroke="#000" stroke-width="1.5" marker-end="url(#cpax)"/>
  <line x1="${ox}" y1="${SIZE - margin + 5}" x2="${ox}" y2="${margin - 8}" stroke="#000" stroke-width="1.5" marker-end="url(#cpax)"/>
  <text x="${SIZE - margin + 12}" y="${oy + 4}" font-size="11" font-family="serif" font-style="italic">x</text>
  <text x="${ox + 4}" y="${margin - 10}" font-size="11" font-family="serif" font-style="italic">y</text>
  <text x="${ox - 10}" y="${oy + 14}" text-anchor="middle" font-size="9" font-family="serif">O</text>
  ${ticks}${pts}${title}
</svg>`;
}

function barChartSvg(d: Diagram): string {
  const bars = d.bars ?? [];
  if (!bars.length) return '';
  const W = 500, H = 280;
  const mL = 50, mB = 55, mT = 20, mR = 20;
  const innerW = W - mL - mR, innerH = H - mT - mB;
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const barW = (innerW / bars.length) * 0.65;
  const gap = innerW / bars.length;
  const toY = (v: number) => mT + innerH - (v / maxVal) * innerH;

  let yTicksSvg = '';
  for (let i = 0; i <= 5; i++) {
    const val = (maxVal / 5) * i;
    const y = toY(val);
    yTicksSvg += `<line x1="${mL - 4}" y1="${y}" x2="${W - mR}" y2="${y}" stroke="#e8e8e8" stroke-width="0.5"/>`;
    yTicksSvg += `<text x="${mL - 6}" y="${y + 4}" text-anchor="end" font-size="9" font-family="serif">${Math.round(val)}</text>`;
  }

  let barsSvg = '';
  bars.forEach((bar, i) => {
    const x = mL + i * gap + (gap - barW) / 2;
    const y = toY(bar.value);
    barsSvg += `<rect x="${x}" y="${y}" width="${barW}" height="${H - mB - y}" fill="#1a56db" opacity="0.85" rx="2"/>`;
    barsSvg += `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="9" font-family="serif">${bar.value}</text>`;
    const label = bar.label.length > 9 ? bar.label.substring(0, 8) + '…' : bar.label;
    barsSvg += `<text x="${x + barW / 2}" y="${H - mB + 13}" text-anchor="middle" font-size="9" font-family="serif">${esc(label)}</text>`;
  });

  const yLabel = d.yAxisLabel
    ? `<text transform="rotate(-90)" x="${-(mT + innerH / 2)}" y="12" text-anchor="middle" font-size="10" font-family="serif">${esc(d.yAxisLabel)}</text>`
    : '';
  const title = d.title
    ? `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-size="10" font-family="serif" font-style="italic" fill="#555">${esc(d.title)}</text>`
    : '';

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  ${yTicksSvg}
  <line x1="${mL}" y1="${mT}" x2="${mL}" y2="${H - mB}" stroke="#000" stroke-width="1.5"/>
  <line x1="${mL}" y1="${H - mB}" x2="${W - mR}" y2="${H - mB}" stroke="#000" stroke-width="1.5"/>
  ${barsSvg}${yLabel}${title}
</svg>`;
}

function tableOfValuesSvg(d: Diagram): string {
  const columns = d.columns ?? [];
  if (!columns.length) return '';
  const rows = Math.max(...columns.map((c) => c.values.length), 1);
  const colW = 70, rowH = 26;
  const W = columns.length * colW + 2;
  const H = (rows + 1) * rowH + (d.title ? 20 : 4);

  let cells = '';
  columns.forEach((col, ci) => {
    const x = ci * colW + 1;
    cells += `<rect x="${x}" y="1" width="${colW}" height="${rowH}" fill="#1a56db"/>`;
    cells += `<text x="${x + colW / 2}" y="${rowH / 2 + 5}" text-anchor="middle" font-size="13" font-family="serif" fill="white" font-weight="bold">${esc(col.header)}</text>`;
    col.values.forEach((val, ri) => {
      const y = (ri + 1) * rowH + 1;
      cells += `<rect x="${x}" y="${y}" width="${colW}" height="${rowH}" fill="${ri % 2 === 0 ? '#f0f4ff' : '#fff'}" stroke="#bbb" stroke-width="0.5"/>`;
      cells += `<text x="${x + colW / 2}" y="${y + rowH / 2 + 5}" text-anchor="middle" font-size="13" font-family="serif">${esc(val)}</text>`;
    });
  });

  const title = d.title
    ? `<text x="${W / 2}" y="${H - 3}" text-anchor="middle" font-size="10" font-family="serif" font-style="italic" fill="#555">${esc(d.title)}</text>`
    : '';

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${W}" height="${(rows + 1) * rowH + 2}" fill="white" stroke="#333" stroke-width="1"/>
  ${cells}${title}
</svg>`;
}

// ─── PDF Drawing Functions (used in PDF export via PDFKit primitives) ─────────

export function diagramPdfHeight(diagram: Diagram): number {
  switch (diagram.type) {
    case 'number_line':     return 70;
    case 'cartesian_plane': return 310;
    case 'bar_chart':       return 220;
    case 'table_of_values': {
      const rows = Math.max(...(diagram.columns ?? [{ values: [] }]).map((c) => c.values.length), 1);
      return (rows + 1) * 22 + 30;
    }
  }
}

export function drawDiagramPdf(
  doc: PDFKit.PDFDocument,
  diagram: Diagram,
  x: number,
  availableWidth: number,
): void {
  doc.fillColor('#000000');
  if (diagram.title) {
    doc
      .fontSize(10)
      .font('Times-Italic')
      .fillColor('#555555')
      .text(diagram.title, x, doc.y, { width: availableWidth, align: 'center' });
    doc.moveDown(0.3);
  }

  switch (diagram.type) {
    case 'number_line':     drawNumberLinePdf(doc, diagram, x, availableWidth); break;
    case 'cartesian_plane': drawCartesianPlanePdf(doc, diagram, x, availableWidth); break;
    case 'bar_chart':       drawBarChartPdf(doc, diagram, x, availableWidth); break;
    case 'table_of_values': drawTableOfValuesPdf(doc, diagram, x, availableWidth); break;
  }

  doc.fillColor('#000000').moveDown(0.5);
}

function drawNumberLinePdf(doc: PDFKit.PDFDocument, d: Diagram, x: number, w: number) {
  const [rMin, rMax] = d.range ?? [-5, 5];
  const count = Math.max(rMax - rMin, 1);
  const padL = 20, padR = 30;
  const lineW = w - padL - padR;
  const unitW = lineW / count;
  const lineX = x + padL;
  const lineY = doc.y + 20;
  const toX = (v: number) => lineX + (v - rMin) * unitW;

  doc.save();
  doc.strokeColor('#000000').fillColor('#000000').lineWidth(1.5);
  doc.moveTo(lineX - 5, lineY).lineTo(lineX + lineW + 5, lineY).stroke();
  // arrowhead
  doc
    .polygon(
      [lineX + lineW + 5, lineY],
      [lineX + lineW, lineY - 4],
      [lineX + lineW, lineY + 4],
    )
    .fill();

  doc.lineWidth(1).fontSize(8).font('Times-Roman');
  for (let i = rMin; i <= rMax; i++) {
    const tx = toX(i);
    doc.moveTo(tx, lineY - 5).lineTo(tx, lineY + 5).stroke();
    doc.text(String(i), tx - 6, lineY + 7, { width: 12, align: 'center' });
  }

  doc.fillColor('#1a56db');
  for (const pt of d.markedPoints ?? []) {
    const tx = toX(pt.value);
    doc.circle(tx, lineY, 5).fill();
    if (pt.label && pt.label !== String(pt.value)) {
      doc.fontSize(8).text(pt.label, tx - 10, lineY - 16, { width: 20, align: 'center' });
    }
  }

  doc.restore();
  doc.y = lineY + 28;
}

function drawCartesianPlanePdf(doc: PDFKit.PDFDocument, d: Diagram, x: number, availableWidth: number) {
  const size = Math.min(availableWidth, 280);
  const margin = 40;
  const [xMin, xMax] = d.xRange ?? [-6, 6];
  const [yMin, yMax] = d.yRange ?? [-6, 6];
  const inner = size - margin * 2;
  const startY = doc.y;
  const toSX = (v: number) => x + margin + ((v - xMin) / (xMax - xMin)) * inner;
  const toSY = (v: number) => startY + size - margin - ((v - yMin) / (yMax - yMin)) * inner;
  const ox = toSX(0), oy = toSY(0);

  doc.save();

  // Grid
  doc.strokeColor('#e0e0e0').lineWidth(0.5);
  for (let v = Math.ceil(xMin); v <= xMax; v++) {
    doc.moveTo(toSX(v), startY + margin).lineTo(toSX(v), startY + size - margin).stroke();
  }
  for (let v = Math.ceil(yMin); v <= yMax; v++) {
    doc.moveTo(x + margin, toSY(v)).lineTo(x + size - margin, toSY(v)).stroke();
  }

  // Line segments
  doc.strokeColor('#e63946').lineWidth(1.5);
  for (const ln of d.lines ?? []) {
    doc.moveTo(toSX(ln.from.x), toSY(ln.from.y)).lineTo(toSX(ln.to.x), toSY(ln.to.y)).stroke();
  }

  // Axes
  doc.strokeColor('#000000').lineWidth(1.5);
  doc.moveTo(x + margin - 5, oy).lineTo(x + size - margin + 5, oy).stroke();
  doc.moveTo(ox, startY + size - margin + 5).lineTo(ox, startY + margin - 5).stroke();

  // Arrowheads
  doc.fillColor('#000000');
  doc.polygon([x + size - margin + 5, oy], [x + size - margin - 2, oy - 4], [x + size - margin - 2, oy + 4]).fill();
  doc.polygon([ox, startY + margin - 5], [ox - 4, startY + margin + 3], [ox + 4, startY + margin + 3]).fill();

  // Axis labels
  doc.fontSize(10).font('Times-Italic').fillColor('#000000');
  doc.text('x', x + size - margin + 8, oy - 5);
  doc.text('y', ox + 4, startY + margin - 16);
  doc.text('O', ox - 13, oy + 3);

  // Ticks
  doc.lineWidth(1).fontSize(7).font('Times-Roman').fillColor('#000000').strokeColor('#000000');
  for (let v = Math.ceil(xMin); v <= xMax; v++) {
    if (v === 0) continue;
    const tx = toSX(v);
    doc.moveTo(tx, oy - 3).lineTo(tx, oy + 3).stroke();
    doc.text(String(v), tx - 6, oy + 5, { width: 12, align: 'center' });
  }
  for (let v = Math.ceil(yMin); v <= yMax; v++) {
    if (v === 0) continue;
    const ty = toSY(v);
    doc.moveTo(ox - 3, ty).lineTo(ox + 3, ty).stroke();
    doc.text(String(v), ox - 20, ty - 4, { width: 16, align: 'right' });
  }

  // Points
  doc.fillColor('#1a56db');
  for (const pt of d.points ?? []) {
    const sx = toSX(pt.x), sy = toSY(pt.y);
    doc.circle(sx, sy, 4).fill();
    if (pt.label) {
      doc.fontSize(8).font('Times-Roman').fillColor('#1a56db').text(`${pt.label}(${pt.x},${pt.y})`, sx + 6, sy - 8);
    }
  }

  doc.restore();
  doc.y = startY + size + 5;
}

function drawBarChartPdf(doc: PDFKit.PDFDocument, d: Diagram, x: number, w: number) {
  const bars = d.bars ?? [];
  if (!bars.length) return;
  const H = 180, mL = 40, mB = 40, mT = 15, mR = 15;
  const innerW = w - mL - mR, innerH = H - mT - mB;
  const startY = doc.y;
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const barW = (innerW / bars.length) * 0.65;
  const gap = innerW / bars.length;
  const toBarX = (i: number) => x + mL + i * gap + (gap - barW) / 2;
  const toBarY = (v: number) => startY + mT + innerH - (v / maxVal) * innerH;

  doc.save();
  doc.fontSize(7).font('Times-Roman').fillColor('#000000');

  for (let i = 0; i <= 5; i++) {
    const val = (maxVal / 5) * i;
    const y = toBarY(val);
    doc.strokeColor('#e8e8e8').lineWidth(0.5).moveTo(x + mL, y).lineTo(x + w - mR, y).stroke();
    doc.fillColor('#000000').text(String(Math.round(val)), x + mL - 6, y - 4, { width: mL - 7, align: 'right' });
  }

  doc.strokeColor('#000000').lineWidth(1.5);
  doc.moveTo(x + mL, startY + mT).lineTo(x + mL, startY + mT + innerH).stroke();
  doc.moveTo(x + mL, startY + mT + innerH).lineTo(x + w - mR, startY + mT + innerH).stroke();

  bars.forEach((bar, i) => {
    const bx = toBarX(i), by = toBarY(bar.value);
    const bh = startY + mT + innerH - by;
    doc.rect(bx, by, barW, bh).fill('#1a56db');
    doc.fillColor('#000000').text(String(bar.value), bx, by - 10, { width: barW, align: 'center' });
    const label = bar.label.length > 8 ? bar.label.substring(0, 7) + '…' : bar.label;
    doc.text(label, bx, startY + mT + innerH + 4, { width: barW, align: 'center' });
  });

  if (d.yAxisLabel) {
    doc.save();
    const labelX = x + 10;
    const labelY = startY + mT + innerH / 2;
    doc.rotate(-90, { origin: [labelX, labelY] });
    doc.fontSize(8).fillColor('#000000').text(d.yAxisLabel, labelX - 30, labelY - 4, { width: 60, align: 'center' });
    doc.restore();
  }

  doc.restore();
  doc.y = startY + H + 5;
}

function drawTableOfValuesPdf(doc: PDFKit.PDFDocument, d: Diagram, x: number, w: number) {
  const columns = d.columns ?? [];
  if (!columns.length) return;
  const rows = Math.max(...columns.map((c) => c.values.length), 1);
  const colW = Math.min(70, Math.floor(w / columns.length));
  const rowH = 22;
  const tableW = columns.length * colW;
  const startX = x + Math.floor((w - tableW) / 2);
  const startY = doc.y;

  doc.save();
  columns.forEach((col, ci) => {
    const cx = startX + ci * colW;
    doc.rect(cx, startY, colW, rowH).fill('#1a56db');
    doc.fontSize(11).font('Times-Bold').fillColor('#ffffff').text(col.header, cx, startY + 5, { width: colW, align: 'center' });

    col.values.forEach((val, ri) => {
      const ry = startY + (ri + 1) * rowH;
      doc.rect(cx, ry, colW, rowH).fill(ri % 2 === 0 ? '#f0f4ff' : '#ffffff').stroke('#bbbbbb');
      doc.fontSize(11).font('Times-Roman').fillColor('#000000').text(val, cx, ry + 5, { width: colW, align: 'center' });
    });
  });

  doc.rect(startX, startY, tableW, (rows + 1) * rowH).stroke('#333333');
  doc.restore();
  doc.fillColor('#000000');
  doc.y = startY + (rows + 1) * rowH + 5;
}
