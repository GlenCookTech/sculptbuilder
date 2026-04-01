import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Routine } from '@/types';

const DOCX_COLORS = [
  { hex: 'FEF3C7', accent: 'D97706' },
  { hex: 'EDE9FE', accent: '7C3AED' },
  { hex: 'FEE2E2', accent: 'DC2626' },
  { hex: 'CFFAFE', accent: '0891B2' },
  { hex: 'FFEDD5', accent: 'EA580C' },
  { hex: 'D1FAE5', accent: '059669' },
];

export async function exportRoutineDocx(routine: Routine) {
  const totalMin = routine.tracks.reduce((s, t) => s + t.duration, 0);

  const lb = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  const lb_ = { top: lb, bottom: lb, left: lb, right: lb };

  const docChildren: (Paragraph | Table)[] = [];

  docChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: routine.name, bold: true, size: 40, font: 'Arial', color: '1F2937' })],
  }));

  docChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 480 },
    children: [new TextRun({
      text: `${totalMin} min total  |  ${routine.tracks.length} tracks  |  32-count structure`,
      size: 22, font: 'Arial', color: '9CA3AF', italics: true,
    })],
  }));

  routine.tracks.forEach((track, ti) => {
    const col = DOCX_COLORS[ti % DOCX_COLORS.length];
    const rows: TableRow[] = [];

    rows.push(new TableRow({
      children: [
        new TableCell({
          borders: lb_, width: { size: 7000, type: WidthType.DXA },
          shading: { fill: col.hex, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 180, right: 120 },
          children: [new Paragraph({
            children: [
              new TextRun({ text: `Track ${ti + 1}  `, bold: true, size: 26, font: 'Arial', color: col.accent }),
              new TextRun({ text: track.name, bold: true, size: 26, font: 'Arial', color: '1F2937' }),
            ],
          })],
        }),
        new TableCell({
          borders: lb_, width: { size: 2360, type: WidthType.DXA },
          shading: { fill: col.hex, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 120, right: 180 },
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `${track.duration} min`, size: 22, font: 'Arial', color: '6B7280' })],
          })],
        }),
      ],
    }));

    if (track.muscles.length > 0) {
      rows.push(new TableRow({
        children: [
          new TableCell({
            borders: lb_, width: { size: 7000, type: WidthType.DXA },
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 180, right: 120 },
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'Muscles: ', bold: true, size: 18, font: 'Arial', color: '6B7280' }),
                new TextRun({ text: track.muscles.join(', '), size: 18, font: 'Arial', color: '374151' }),
              ],
            })],
          }),
          new TableCell({
            borders: lb_, width: { size: 2360, type: WidthType.DXA },
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 180 },
            children: [new Paragraph({ children: [new TextRun('')] })],
          }),
        ],
      }));
    }

    track.exercises.forEach((ex) => {
      rows.push(new TableRow({
        children: [
          new TableCell({
            borders: lb_, width: { size: 7000, type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 360, right: 120 },
            children: [new Paragraph({
              numbering: { reference: 'bullets', level: 0 },
              children: [new TextRun({ text: ex.name, size: 20, font: 'Arial', color: '1F2937' })],
            })],
          }),
          new TableCell({
            borders: lb_, width: { size: 2360, type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 120, right: 180 },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: ex.counts, size: 18, font: 'Courier New', color: '6B7280' })],
            })],
          }),
        ],
      }));
    });

    if (track.notes) {
      rows.push(new TableRow({
        children: [
          new TableCell({
            borders: lb_, width: { size: 7000, type: WidthType.DXA },
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 180, right: 120 },
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'Notes: ', bold: true, size: 18, font: 'Arial', color: '6B7280' }),
                new TextRun({ text: track.notes, size: 18, font: 'Arial', color: '374151', italics: true }),
              ],
            })],
          }),
          new TableCell({
            borders: lb_, width: { size: 2360, type: WidthType.DXA },
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 180 },
            children: [new Paragraph({ children: [new TextRun('')] })],
          }),
        ],
      }));
    }

    docChildren.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [7000, 2360],
      rows,
    }));
    docChildren.push(new Paragraph({ spacing: { before: 0, after: 240 }, children: [new TextRun('')] }));
  });

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 180 } } },
        }],
      }],
    },
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: docChildren,
    }],
  });

  const buf = await Packer.toBuffer(doc);
  const blob = new Blob([new Uint8Array(buf)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const filename = routine.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'routine';
  saveAs(blob, `${filename}.docx`);
}
