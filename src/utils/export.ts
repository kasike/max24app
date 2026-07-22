/**
 * Utility to export an array of object records directly as a CSV file in the browser.
 * Sanitizes headers, keys, and values to be fully compliant with CSV standards.
 */
export function exportToCSV(filename: string, data: any[]) {
  if (data.length === 0) {
    alert("No hay ningún dato disponible para exportar.");
    return;
  }

  // Get keys to build CSV document headers
  const headers = Object.keys(data[0]);
  const headerLine = headers.join(';');

  // Map each object row record, sanitizing comma and semi-colon issues
  const rows = data.map(record => {
    return headers.map(header => {
      const val = record[header];
      if (val === null || val === undefined) {
        return '';
      }
      let str = String(val).replace(/"/g, '""');
      // If string contains common delimiting chars, wrap inside quotes
      if (str.includes(';') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        str = `"${str}"`;
      }
      return str;
    }).join(';');
  });

  // UTF-8 BOM Prefix to allow Excel for Windows Spanish compatibility
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headerLine, ...rows].join('\r\n');
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  
  // Trigger file download
  link.click();
  document.body.removeChild(link);
}
