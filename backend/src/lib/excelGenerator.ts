import * as XLSX from 'xlsx';

/**
 * Generates an Excel buffer from JSON data.
 */
export function generateExcel(data: any[], sheetName: string = 'Report') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write to a buffer
  const excelBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  return excelBuffer;
}
