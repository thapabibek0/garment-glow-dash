import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PdfSection {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
}

export function exportPDF(filename: string, title: string, sections: PdfSection[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleString(), 14, 25);
  doc.setTextColor(0);

  let y = 32;
  for (const s of sections) {
    if (s.title) {
      doc.setFontSize(12);
      doc.text(s.title, 14, y);
      y += 4;
    }
    autoTable(doc, {
      startY: y,
      head: [s.headers],
      body: s.rows.map((r) => r.map((c) => String(c))),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 30, 30] },
      margin: { left: 14, right: 14 },
    });
    // @ts-expect-error lastAutoTable injected by autoTable
    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  }

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
