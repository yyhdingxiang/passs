import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";
import type { ItineraryDocument } from "@/lib/itinerary-document";

export async function exportItineraryDocx(documentModel: ItineraryDocument) {
  const title = new Paragraph({
    spacing: { after: 240 },
    children: [new TextRun({ text: documentModel.title, bold: true, size: 30 })]
  });

  const meta = new Paragraph({
    spacing: { after: 240 },
    children: [
      new TextRun(
        documentModel.headerFields
          .map(field => `${field.label}: ${field.value}`)
          .join(documentModel.locale === "zh" ? " | " : " | ")
      )
    ]
  });

  const headerRow = new TableRow({
    children: documentModel.columns.map(column => (
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: column.label, bold: true })] })]
      })
    ))
  });

  const bodyRows = documentModel.rows.map(row => (
    new TableRow({
      children: documentModel.columns.map(column => (
        new TableCell({
          children: [new Paragraph(row[column.key])]
        })
      ))
    })
  ));

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows]
  });

  const doc = new Document({
    sections: [{ children: [title, meta, table] }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${documentModel.fileName}.docx`);
}
