const xlsx = require('xlsx');

const toXLSX = (columns, rows) => {
  try {
    console.log('Starting XLSX export, columns:', columns);
    console.log('Rows count:', rows.length);

    const worksheetData = [
      columns,
      ...rows.map(row => columns.map(col => row[col]))
    ];

    console.log('Worksheet data:', worksheetData);

    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    const workbook  = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log('Buffer size:', buffer.length);

    return buffer;
  } catch (err) {
    console.error('XLSX generation error:', err.message);
    throw err;
  }
};

const toJSON = (columns, rows) => {
  return rows.map(row => {
    const obj = {};
    columns.forEach(col => { obj[col] = row[col]; });
    return obj;
  });
};

module.exports = { toXLSX, toJSON };