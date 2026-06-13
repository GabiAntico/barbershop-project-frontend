import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';

import { ShiftService } from '../../../services/shift.service';
import { ShiftCompleteResponse, ShiftStatus } from '../../../models/shift.model';
import { ClientResponse } from '../../../models/client.model';

type StatusFilter = 'ALL' | ShiftStatus;

@Component({
  selector: 'app-shifts-view',
  standalone: true,
  imports: [TableModule, SelectButtonModule, FormsModule, NgClass],
  templateUrl: './shifts-view.component.html',
  styleUrl: './shifts-view.component.css',
})
export class ShiftsViewComponent implements OnInit {

  shifts: ShiftCompleteResponse[] = [];
  private originalSorted: ShiftCompleteResponse[] = [];
  mobilePage = 0;
  readonly mobileRows = 8;

  selectedStatusFilter: StatusFilter = 'ALL';
  private lastStatus: StatusFilter = 'ALL';

  readonly statusFilterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'Completados', value: 'COMPLETED' },
    { label: 'Cancelados', value: 'CANCELLED' },
  ];

  readonly statusLabels: Record<ShiftStatus, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };

  getStatusLabel(status: ShiftStatus): string {
    return this.statusLabels[status];
  }

  getClientName(client: ClientResponse | null | undefined): string {
    if (!client) return '—';

    const fullName = [client.firstName, client.lastName].filter(Boolean).join(' ');

    return fullName || '—';
  }

  getClientPrimary(client: ClientResponse | null | undefined): string {
    if (!client) return '-';

    const fullName = [client.firstName, client.lastName].filter(Boolean).join(' ');

    return fullName || client.phoneNumber || client.email || '-';
  }

  get mobileShifts(): ShiftCompleteResponse[] {
    const start = this.mobilePage * this.mobileRows;

    return this.shifts.slice(start, start + this.mobileRows);
  }

  get mobileTotalPages(): number {
    return Math.max(1, Math.ceil(this.shifts.length / this.mobileRows));
  }

  get mobileFirstRecord(): number {
    return this.shifts.length === 0 ? 0 : (this.mobilePage * this.mobileRows) + 1;
  }

  get mobileLastRecord(): number {
    return Math.min((this.mobilePage + 1) * this.mobileRows, this.shifts.length);
  }

  constructor(private shiftService: ShiftService, private router: Router) {}

  ngOnInit(): void {
    this.shiftService.getAllCompleteShifts().subscribe({
      next: data => {
        this.originalSorted = this.sortByGroups(data);

        this.applyStatusFilter();
      },
      error: err => console.error(err)
    });
  }

  goToCreateShift(): void {
    this.router.navigate(['/create-shift']);
  }

  editShift(id: number): void {
    this.router.navigate(['/edit-shift', id]);
  }

  viewShift(id: number): void {
    this.router.navigate(['/shifts', id]);
  }

  // ------------------- SelectButton (filtro) -------------------
  /**
   * Se ejecuta cuando cambia el SelectButton.
   * Si value === null (se intentó deseleccionar), restauramos el último.
   */
  onStatusChange(event: any): void {
    const value: StatusFilter | null = event?.value ?? null;

    if (value === null) {
      setTimeout(() => {
        this.selectedStatusFilter = this.lastStatus;
        this.applyStatusFilter();
      }, 0);
      return;
    }

    this.selectedStatusFilter = value;
    this.lastStatus = value;
    this.applyStatusFilter();
  }

  private applyStatusFilter(): void {
    if (this.selectedStatusFilter === 'ALL') {
      this.shifts = [...this.originalSorted];
      this.mobilePage = 0;
      return;
    }
    this.shifts = this.originalSorted.filter(s => s.status === this.selectedStatusFilter);
    this.mobilePage = 0;
  }

  resetSmartSort(table: any): void {
    this.selectedStatusFilter = 'ALL';
    this.lastStatus = 'ALL';
    this.applyStatusFilter();

    table.sortField = null;
    table.sortOrder = 0;
    table.clear();
  }

  previousMobilePage(): void {
    this.mobilePage = Math.max(0, this.mobilePage - 1);
  }

  nextMobilePage(): void {
    this.mobilePage = Math.min(this.mobileTotalPages - 1, this.mobilePage + 1);
  }

  private parseShiftDate(datetime: string): number {
    const d = new Date(datetime);
    const t = d.getTime();
    return isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }

  private groupPriority(status: ShiftStatus, t: number, now: number): number {
    const isFutureOrNow = t >= now;

    if (isFutureOrNow && status === 'PENDING') return 0;
    if (isFutureOrNow && (status === 'COMPLETED' || status === 'CANCELLED')) return 1;
    return 2;
  }

  private sortByGroups(shifts: ShiftCompleteResponse[]): ShiftCompleteResponse[] {
    const now = Date.now();

    return [...shifts].sort((a, b) => {
      const ta = this.parseShiftDate(a.datetime);
      const tb = this.parseShiftDate(b.datetime);

      const ga = this.groupPriority(a.status, ta, now);
      const gb = this.groupPriority(b.status, tb, now);

      if (ga !== gb) return ga - gb;

      if (ga === 2) return tb - ta;

      return ta - tb;
    });
  }

  goToCreateVisit(id: number): void {
    this.router.navigate(['/visits/create', id], {
      queryParams: { returnTo: 'shifts' }
    });
  }

  exportShiftsPdf(): void {
    if (this.shifts.length === 0) return;

    const pdf = this.buildShiftsPdf();
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `turnos-${this.formatFileDate(new Date())}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private buildShiftsPdf(): Uint8Array {
    const pageWidth = 842;
    const pageHeight = 595;
    const margin = 32;
    const rowHeight = 18;
    const firstRowY = 444;
    const rowsPerPage = 23;
    const pages = this.chunkRows(this.shifts, rowsPerPage);
    const objects: string[] = [];
    const pageObjectIds: number[] = [];

    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    pages.forEach((pageRows, pageIndex) => {
      const pageObjectId = objects.length + 1;
      const contentObjectId = pageObjectId + 1;
      pageObjectIds.push(pageObjectId);

      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
      objects.push(`<< /Length ${this.buildPdfContent(pageRows, pageIndex, pages.length, margin, pageHeight, firstRowY, rowHeight).length} >>
stream
${this.buildPdfContent(pageRows, pageIndex, pages.length, margin, pageHeight, firstRowY, rowHeight)}
endstream`);
    });

    objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`;

    return this.writePdf(objects);
  }

  private buildPdfContent(
    rows: ShiftCompleteResponse[],
    pageIndex: number,
    totalPages: number,
    margin: number,
    pageHeight: number,
    firstRowY: number,
    rowHeight: number
  ): string {
    const lines: string[] = [];
    const title = 'Turnos - respaldo';
    const generatedAt = `Generado: ${this.formatDisplayDateTime(new Date())}`;
    const filterLabel = `Filtro: ${this.selectedStatusFilter === 'ALL' ? 'Todos' : this.getStatusLabel(this.selectedStatusFilter)}`;

    lines.push(this.pdfText(margin, pageHeight - 40, 18, title));
    lines.push(this.pdfText(margin, pageHeight - 62, 9, generatedAt));
    lines.push(this.pdfText(margin, pageHeight - 76, 9, filterLabel));
    const tableTopLineY = pageHeight - 94;
    const headerTextY = tableTopLineY - 24;
    const headerBottomLineY = headerTextY - 14;

    lines.push(this.pdfLine(margin, tableTopLineY, pageWidthSafe() - margin, tableTopLineY));

    const columns = [
      { x: margin, label: 'Fecha', width: 78 },
      { x: margin + 82, label: 'Hora', width: 48 },
      { x: margin + 136, label: 'Cliente', width: 205 },
      { x: margin + 350, label: 'Telefono', width: 100 },
      { x: margin + 460, label: 'Estado', width: 92 },
      { x: margin + 560, label: 'Monto est.', width: 80 }
    ];

    columns.forEach(column => lines.push(this.pdfText(column.x, headerTextY, 9, column.label)));
    lines.push(this.pdfLine(margin, headerBottomLineY, pageWidthSafe() - margin, headerBottomLineY));

    rows.forEach((shift, index) => {
      const y = firstRowY - (index * rowHeight);
      const values = [
        this.formatShiftDate(shift.datetime),
        this.formatShiftTime(shift.datetime),
        this.getExportClientName(shift.client),
        shift.client?.phoneNumber || '-',
        this.getStatusLabel(shift.status),
        this.formatAmount(shift.estimatedAmount)
      ];

      columns.forEach((column, columnIndex) => {
        lines.push(this.pdfText(column.x, y, 8, this.truncate(values[columnIndex], column.width)));
      });
    });

    lines.push(this.pdfText(margin, 24, 8, `Pagina ${pageIndex + 1} de ${totalPages}`));

    function pageWidthSafe(): number {
      return 842;
    }

    return lines.join('\n');
  }

  private writePdf(objects: string[]): Uint8Array {
    const chunks: string[] = ['%PDF-1.4\n'];
    const offsets: number[] = [0];
    let length = chunks[0].length;

    objects.forEach((object, index) => {
      offsets.push(length);
      const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
      chunks.push(chunk);
      length += chunk.length;
    });

    const xrefOffset = length;
    const xref = [
      `xref\n0 ${objects.length + 1}`,
      '0000000000 65535 f ',
      ...offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `),
      'trailer',
      `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
      'startxref',
      String(xrefOffset),
      '%%EOF'
    ].join('\n');

    chunks.push(xref);

    return new TextEncoder().encode(chunks.join(''));
  }

  private pdfText(x: number, y: number, size: number, text: string): string {
    return `BT /F1 ${size} Tf ${x} ${y} Td (${this.escapePdfText(text)}) Tj ET`;
  }

  private pdfLine(x1: number, y1: number, x2: number, y2: number): string {
    return `0.75 w ${x1} ${y1} m ${x2} ${y2} l S`;
  }

  private escapePdfText(text: string): string {
    return this.toPdfSafeText(text)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private toPdfSafeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '-');
  }

  private truncate(text: string, width: number): string {
    const maxChars = Math.max(6, Math.floor(width / 4.4));
    const cleanText = this.toPdfSafeText(text);

    return cleanText.length > maxChars ? `${cleanText.slice(0, maxChars - 3)}...` : cleanText;
  }

  private chunkRows(rows: ShiftCompleteResponse[], size: number): ShiftCompleteResponse[][] {
    const chunks: ShiftCompleteResponse[][] = [];

    for (let i = 0; i < rows.length; i += size) {
      chunks.push(rows.slice(i, i + size));
    }

    return chunks.length ? chunks : [[]];
  }

  formatShiftDate(datetime: string): string {
    if (!datetime) return '-';

    return datetime.includes('T') ? datetime.split('T')[0] : datetime.split(' ')[0];
  }

  formatShiftTime(datetime: string): string {
    if (!datetime) return '-';

    return datetime.includes('T')
      ? datetime.split('T')[1].substring(0, 5)
      : datetime.split(' ')[1] || '-';
  }

  private getExportClientName(client: ClientResponse | null | undefined): string {
    const name = this.getClientName(client);

    return name !== 'â€”' ? name : client?.phoneNumber || client?.email || '-';
  }

  formatAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-';

    return `$ ${Number(amount).toFixed(2)}`;
  }

  private formatDisplayDateTime(date: Date): string {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}-${MM}-${dd} ${HH}:${mm}`;
  }

  private formatFileDate(date: Date): string {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}${MM}${dd}-${HH}${mm}`;
  }

}
