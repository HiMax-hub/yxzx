/**
 * CSV 导出工具（B端系统刚需：客户名单、进件、外呼明细导出）
 * 带 BOM 以兼容 Excel 中文，字段自动转义
 */

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  // UTF-8 BOM 保证 Excel 打开中文不乱码
  const bom = '\uFEFF';
  const headerLine = headers.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  const csv = bom + [headerLine, ...bodyLines].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMultiSectionCsv(
  filename: string,
  sections: { title: string; headers: string[]; rows: (string | number | boolean | null | undefined)[][] }[]
): void {
  const bom = '\uFEFF';
  const lines: string[] = [];

  sections.forEach((sec, idx) => {
    if (idx > 0) {
      lines.push(''); // blank separator row
    }
    lines.push(escapeCsvCell(`【${sec.title}】`));
    lines.push(sec.headers.map(escapeCsvCell).join(','));
    sec.rows.forEach((row) => {
      lines.push(row.map(escapeCsvCell).join(','));
    });
  });

  const csv = bom + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 生成带时间戳的文件名
export function timestampedFilename(prefix: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${prefix}_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

