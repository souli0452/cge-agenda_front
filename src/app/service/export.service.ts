import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface PdfTableExportOptions {
    title:       string;
    subtitle:    string;
    columns:     string[];
    rows:        (string | number)[][];
    columnStyles?: Record<number, { cellWidth?: number; halign?: 'left' | 'center' | 'right' }>;
    filename:    string;
    footerLabel?: string;
}

export interface ExcelSheet {
    name:              string;
    rows:              Record<string, unknown>[];
    emptyPlaceholder?: Record<string, unknown>;
    postProcess?:      (ws: XLSX.WorkSheet, rows: Record<string, unknown>[]) => void;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

    /** Export tabulaire PDF paysage : bannière verte + titre + tableau + pagination en pied de page. */
    exportTableToPdf(options: PdfTableExportOptions): void {
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFillColor(0, 150, 64);
        doc.rect(0, 0, 297, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(options.title, 148.5, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(options.subtitle, 148.5, 22, { align: 'center' });

        autoTable(doc, {
            head: [options.columns],
            body: options.rows,
            startY: 35,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [0, 150, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: options.columnStyles || {}
        });

        const pageCount = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(150);
            doc.setFontSize(8);
            doc.text(
                options.footerLabel
                    ? `Page ${i} sur ${pageCount} — ${options.footerLabel}`
                    : `Page ${i} sur ${pageCount} — Généré le ${new Date().toLocaleDateString('fr-FR')}`,
                148.5, 205, { align: 'center' }
            );
        }

        doc.save(options.filename);
    }

    /** Export Excel multi-feuilles avec largeur de colonnes calculée automatiquement. */
    exportToExcel(sheets: ExcelSheet[], filename: string): void {
        const wb = XLSX.utils.book_new();

        for (const sheet of sheets) {
            const data = sheet.rows.length ? sheet.rows : [sheet.emptyPlaceholder || {}];
            const ws = XLSX.utils.json_to_sheet(data);

            if (sheet.rows.length) {
                const keys = Object.keys(sheet.rows[0]);
                ws['!cols'] = keys.map(k => ({
                    wch: Math.max(k.length + 2, ...sheet.rows.map(r => String(r[k] ?? '').length))
                }));
                sheet.postProcess?.(ws, sheet.rows);
            }

            XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        }

        XLSX.writeFile(wb, filename);
    }
}
