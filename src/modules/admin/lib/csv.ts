/** Client-side CSV export — no backend, no dependency. */

const escapeCell = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCsv(rows: Array<Array<string | number>>): string {
    return rows.map((row) => row.map(escapeCell).join(',')).join('\n');
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
