import * as XLSX from 'xlsx';

export const exportToExcel = (branch, employees, transactions) => {
  // Aggregate data by employee
  const dataMap = {};

  employees.forEach(emp => {
    dataMap[emp.id] = {
      Name: emp.name,
      DiscountHours: 0,
      RewardHours: 0,
      DiscountAmount: 0,
      RewardAmount: 0,
    };
  });

  transactions.forEach(t => {
    if (!dataMap[t.employeeId]) return;
    
    const empData = dataMap[t.employeeId];
    const isDiscount = t.type === 'خصم';
    const isReward = t.type === 'مكافأة';
    const valStr = t.value || "";
    
    // Check if value is hours (contains ':') or amount
    if (valStr.includes(':')) {
      // parse hour like "1:00" -> 1
      const hours = parseInt(valStr.split(':')[0], 10) || 0;
      if (isDiscount) empData.DiscountHours += hours;
      if (isReward) empData.RewardHours += hours;
    } else {
      // Amount
      const amount = parseInt(valStr, 10) || 0;
      if (isDiscount) empData.DiscountAmount += amount;
      if (isReward) empData.RewardAmount += amount;
    }
  });

  // Prepare final array for Excel
  const excelData = Object.values(dataMap).map(data => {
    const row = { 'اسم الموظف': data.Name };

    row['إجمالي ساعات الخصم'] = data.DiscountHours;
    row['إجمالي ساعات المكافأة'] = data.RewardHours;
    row['صافي الساعات'] = data.RewardHours - data.DiscountHours;

    if (branch === 'industrial') {
      row['إجمالي مبلغ الخصم'] = data.DiscountAmount;
      row['إجمالي مبلغ المكافأة'] = data.RewardAmount;
      row['صافي المبلغ'] = data.RewardAmount - data.DiscountAmount;
    }

    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, branch === 'sector' ? 'فرع القطاع' : 'فرع الصناعية');

  // Download
  XLSX.writeFile(workbook, `تقرير_${branch === 'sector' ? 'القطاع' : 'الصناعية'}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
