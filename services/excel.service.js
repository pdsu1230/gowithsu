const XLSX = require('xlsx');

function formatDateDisplay(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function buildTourWorkbook(rows) {
  const workbook = XLSX.utils.book_new();
  const sheetRows = rows.map((row, index) => ({
    STT: index + 1,
    'Ho ten': row.name,
    'Ngay sinh': row.dob || '',
    CCCD: row.cccd || '',
    SDT: row.phone || '',
    'Dia chi': row.address || '',
    Medal: row.medal ? 'Co' : 'Khong',
    'Ten Medal': row.medal_name || '',
    'Benh nen': row.medical_note || '',
    Balo: row.borrow_bag ? 'Co' : 'Khong',
    Den: row.borrow_headlamp ? 'Co' : 'Khong',
    Gay: row.borrow_trekking_pole ? 'Co' : 'Khong'
  }));

  const sheet = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Danh sach');

  return workbook;
}

function buildWeeklyWorkbook(overviewRows, groupedRows) {
  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(
    overviewRows.map((row) => ({
      Tour: row.tour_title,
      Ngay: row.start_date,
      'Tong khach': row.total_guests
    }))
  );
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tong hop');

  Object.entries(groupedRows).forEach(([sheetName, rows]) => {
    const detailSheet = XLSX.utils.json_to_sheet(
      rows.map((row, index) => ({
        STT: index + 1,
        'Ho ten': row.name,
        'Ngay sinh': row.dob || '',
        CCCD: row.cccd || '',
        SDT: row.phone || '',
        'Dia chi': row.address || '',
        Medal: row.medal ? 'Co' : 'Khong',
        'Ten Medal': row.medal_name || '',
        'Benh nen': row.medical_note || '',
        Balo: row.borrow_bag ? 'Co' : 'Khong',
        Den: row.borrow_headlamp ? 'Co' : 'Khong',
        Gay: row.borrow_trekking_pole ? 'Co' : 'Khong'
      }))
    );
    XLSX.utils.book_append_sheet(workbook, detailSheet, sheetName.slice(0, 31));
  });

  return workbook;
}

function workbookToBuffer(workbook) {
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

module.exports = {
  formatDateDisplay,
  buildTourWorkbook,
  buildWeeklyWorkbook,
  workbookToBuffer
};
