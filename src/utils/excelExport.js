import ExcelJS from 'exceljs';

export const exportToExcel = async (branchName, branchType, employees, transactions) => {
  // Aggregate data by employee
  const dataMap = {};

  employees.forEach(emp => {
    dataMap[emp.id] = {
      Name: emp.name,
      DiscountHours: 0,
      RewardHours: 0,
      DiscountMoney: 0,
      RewardMoney: 0,
      Other: 0,
    };
  });

  transactions.forEach(t => {
    if (!dataMap[t.employeeId]) return;
    
    // Parse value depending on if it's a number (money) or time (hours)
    let amount = 0;
    if (t.value.includes(':')) {
      amount = parseFloat(t.value.split(':')[0]); // Simplified hour parsing
    } else {
      amount = parseFloat(t.value) || 0;
    }

    if (t.type === 'خصم') {
      if (branchType === 'money' || !t.value.includes(':')) dataMap[t.employeeId].DiscountMoney += amount;
      else dataMap[t.employeeId].DiscountHours += amount;
    } else if (t.type === 'مكافأة') {
      if (branchType === 'money' || !t.value.includes(':')) dataMap[t.employeeId].RewardMoney += amount;
      else dataMap[t.employeeId].RewardHours += amount;
    } else {
      dataMap[t.employeeId].Other += amount;
    }
  });

  const rows = Object.values(dataMap).map(row => {
    const finalRow = { 'اسم الموظف': row.Name };
    if (branchType === 'hours' || branchType === 'mixed') {
      finalRow['خصومات (ساعات)'] = row.DiscountHours;
      finalRow['مكافآت (ساعات)'] = row.RewardHours;
    }
    if (branchType === 'money' || branchType === 'mixed') {
      finalRow['خصومات (مبالغ)'] = row.DiscountMoney;
      finalRow['مكافآت (مبالغ)'] = row.RewardMoney;
    }
    if (branchType === 'money' || branchType === 'mixed') {
      finalRow['أخرى'] = row.Other;
    }
    return finalRow;
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(branchName, {
    views: [{ rightToLeft: true }] // Enable RTL for Arabic
  });

  // Define columns based on branchType
  const columns = [
    { header: 'اسم الموظف', key: 'اسم الموظف', width: 30 }
  ];

  if (branchType === 'hours' || branchType === 'mixed') {
    columns.push({ header: 'خصومات (ساعات)', key: 'خصومات (ساعات)', width: 20 });
    columns.push({ header: 'مكافآت (ساعات)', key: 'مكافآت (ساعات)', width: 20 });
  }
  
  if (branchType === 'money' || branchType === 'mixed') {
    columns.push({ header: 'خصومات (مبالغ)', key: 'خصومات (مبالغ)', width: 20 });
    columns.push({ header: 'مكافآت (مبالغ)', key: 'مكافآت (مبالغ)', width: 20 });
    columns.push({ header: 'أخرى', key: 'أخرى', width: 15 });
  }

  worksheet.columns = columns;

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Cairo', bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Dark blue header
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Add Data Rows
  rows.forEach((rowData, index) => {
    const row = worksheet.addRow(rowData);
    row.font = { name: 'Cairo', size: 11 };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Zebra Striping
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' } // Light gray
      };
    }

    // Add Borders
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    });
  });

  // Export File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير_${branchName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
