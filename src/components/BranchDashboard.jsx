import React, { useState, useEffect } from 'react';
import { Download, Plus, Users, Save } from 'lucide-react';
import { addEmployee, listenEmployees, addTransaction, listenTransactions } from '../services/db';
import { exportToExcel } from '../utils/excelExport';

const BranchDashboard = ({ branchName, branchId }) => {
  const [employees, setEmployees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const [newEmpName, setNewEmpName] = useState('');
  
  const [selectedEmp, setSelectedEmp] = useState('');
  const [type, setType] = useState('خصم');
  const [value, setValue] = useState('1:00');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Define options based on branch
  const hourOptions = ['1:00', '2:00', '3:00', '4:00', '5:00'];
  const amountOptions = branchId === 'industrial' ? ['5000', '2500'] : [];
  const valueOptions = [...hourOptions, ...amountOptions];
  const typeOptions = branchId === 'industrial' ? ['خصم', 'مكافأة', 'Other'] : ['خصم', 'مكافأة'];

  useEffect(() => {
    setLoading(true);
    setErrorMsg('');
    
    // Set a timeout to stop loading if it takes too long
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const handleFirebaseError = (error) => {
      console.error("Firebase Error:", error);
      setErrorMsg("لم نتمكن من الاتصال بقاعدة البيانات. يرجى التأكد من تفعيل (Firestore Database) وتعديل الـ Rules.");
      setLoading(false);
      clearTimeout(timeoutId);
    };

    const unsubEmployees = listenEmployees(branchId, (emps) => {
      setEmployees(emps);
      if (emps.length > 0 && !selectedEmp) setSelectedEmp(emps[0].id);
      setLoading(false);
      clearTimeout(timeoutId);
    }, handleFirebaseError);

    const unsubTransactions = listenTransactions(branchId, (trans) => {
      setTransactions(trans);
    }, handleFirebaseError);

    return () => {
      unsubEmployees();
      unsubTransactions();
      clearTimeout(timeoutId);
    };
  }, [branchId]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpName) return;
    setErrorMsg('');
    try {
      const newEmp = await addEmployee(branchId, newEmpName);
      setEmployees([...employees, newEmp]);
      if (!selectedEmp) setSelectedEmp(newEmp.id);
      setNewEmpName('');
    } catch (error) {
      console.error("Firebase Error:", error);
      setErrorMsg("فشل إضافة الموظف! يرجى التأكد من تفعيل قاعدة البيانات وتعديل الـ Rules كما هو موضح.");
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!selectedEmp || !value) return;
    setErrorMsg('');
    try {
      const newTrans = await addTransaction(branchId, {
        employeeId: selectedEmp,
        type,
        value,
        notes
      });
      setTransactions([newTrans, ...transactions]);
      setNotes('');
      setValue('1:00');
    } catch (error) {
      console.error("Firebase Error:", error);
      setErrorMsg("فشل إضافة العملية! يرجى التأكد من تفعيل قاعدة البيانات وتعديل الـ Rules.");
    }
  };

  const handleExport = () => {
    exportToExcel(branchId, employees, transactions);
  };

  if (loading) return <div className="text-center py-10">جاري التحميل...</div>;

  return (
    <div>
      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fca5a5' }}>
          <strong>تنبيه: </strong> {errorMsg}
        </div>
      )}
      <div className="dashboard-header">
        <h2>{branchName}</h2>
        <button onClick={handleExport} className="btn btn-success">
          <Download size={20} /> تصدير إلى Excel
        </button>
      </div>

      <div className="grid-2">
        {/* Add Employee Form */}
        <div className="card">
          <div className="card-header">
            <Users className="card-icon" size={24}/>
            <h3>إضافة موظف جديد</h3>
          </div>
          <form onSubmit={handleAddEmployee}>
            <div className="form-group">
              <label>اسم الموظف</label>
              <input 
                type="text" 
                className="form-control" 
                value={newEmpName}
                onChange={e => setNewEmpName(e.target.value)}
                placeholder="أدخل اسم الموظف"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              <Plus size={20} /> إضافة الموظف
            </button>
          </form>
        </div>

        {/* Add Transaction Form */}
        <div className="card">
          <div className="card-header">
            <Save className="card-icon" size={24}/>
            <h3>إضافة عملية</h3>
          </div>

          <form onSubmit={handleAddTransaction}>
            <div className="form-group">
              <label>اسم الموظف</label>
              <select className="form-control" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>نوع الإضافة</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                {typeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>عدد الساعات / المبلغ</label>
              <select className="form-control" value={value} onChange={e => setValue(e.target.value)}>
                {valueOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>الملاحظات (اختياري)</label>
              <input 
                type="text" 
                className="form-control" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="اكتب ملاحظاتك هنا"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={employees.length === 0}>
              <Save size={20} /> حفظ العملية
            </button>
          </form>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h3>سجل العمليات</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>اسم الموظف</th>
                <th>النوع</th>
                <th>القيمة</th>
                <th>الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan="4" className="text-center">لا توجد عمليات مضافة</td></tr>
              ) : (
                transactions.map((t, idx) => {
                  const emp = employees.find(e => e.id === t.employeeId);
                  return (
                    <tr key={idx}>
                      <td>{emp ? emp.name : 'غير معروف'}</td>
                      <td>
                        <span className={`badge ${t.type === 'مكافأة' ? 'badge-reward' : t.type === 'خصم' ? 'badge-discount' : 'badge-other'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td>{t.value}</td>
                      <td>{t.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BranchDashboard;
