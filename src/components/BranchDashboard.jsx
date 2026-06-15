import React, { useState, useEffect } from 'react';
import { Download, Plus, Users, Save } from 'lucide-react';
import { addEmployee, listenEmployees, addTransaction, listenTransactions } from '../services/db';
import { exportToExcel } from '../utils/excelExport';

const BranchDashboard = ({ branchName, branchId, branchType }) => {
  const [employees, setEmployees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [type, setType] = useState('خصم');
  const [value, setValue] = useState(branchType === 'money' ? '1000' : '1:00');
  const [notes, setNotes] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const typeOptions = ['خصم', 'مكافأة', 'أخرى'];

  useEffect(() => {
    setLoading(true);
    setErrorMsg('');
    
    const timeoutId = setTimeout(() => {
      if (employees.length === 0 && transactions.length === 0) {
        setLoading(false);
      }
    }, 3000);

    const handleAPIError = (error) => {
      console.error("API Error:", error);
      setErrorMsg("لم نتمكن من الاتصال بالخادم.");
      setLoading(false);
      clearTimeout(timeoutId);
    };

    const unsubEmployees = listenEmployees(branchId, (emps) => {
      setEmployees(emps);
      if (emps.length > 0 && !selectedEmp) setSelectedEmp(emps[0].id);
      setLoading(false);
      clearTimeout(timeoutId);
    }, handleAPIError);

    const unsubTransactions = listenTransactions(branchId, (trans) => {
      setTransactions(trans);
    }, handleAPIError);

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
      console.error("Error:", error);
      setErrorMsg("حدث خطأ أثناء إضافة الموظف.");
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
      setValue(branchType === 'money' ? '1000' : '1:00');
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("حدث خطأ أثناء حفظ العملية.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{branchName}</h2>
        <button 
          className="btn btn-success"
          onClick={() => exportToExcel(branchName, branchType, employees, transactions)}
          disabled={employees.length === 0}
        >
          <Download size={20} /> تصدير إكسل
        </button>
      </div>

      {errorMsg && (
        <div className="error-banner">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          جاري التحميل...
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Sidebar Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card">
              <h2><Users size={24} /> إضافة موظف جديد</h2>
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

            <div className="glass-card">
              <h2><Save size={24} /> تسجيل عملية</h2>
              <form onSubmit={handleAddTransaction}>
                <div className="form-group">
                  <label>الموظف</label>
                  <select 
                    className="form-control" 
                    value={selectedEmp}
                    onChange={e => setSelectedEmp(e.target.value)}
                    required
                  >
                    <option value="" disabled>اختر الموظف</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>نوع العملية</label>
                  <select 
                    className="form-control"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    {typeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>القيمة ({branchType === 'hours' ? 'ساعات' : branchType === 'money' ? 'مبالغ نقدية' : 'ساعات أو مبالغ'})</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={branchType === 'hours' ? 'مثال: 1:00' : 'مثال: 5000'}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                    أدخل القيمة يدوياً لتكون أكثر مرونة (مثال: 1:30 أو 2500)
                  </small>
                </div>

                <div className="form-group">
                  <label>ملاحظات (اختياري)</label>
                  <textarea 
                    className="form-control"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows="2"
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={!selectedEmp}>
                  <Save size={20} /> حفظ العملية
                </button>
              </form>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass-card table-container">
            <table>
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>النوع</th>
                  <th>القيمة</th>
                  <th>الملاحظات</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لا توجد عمليات مسجلة</td>
                  </tr>
                ) : (
                  transactions.map((t, idx) => {
                    const emp = employees.find(e => e.id === t.employeeId);
                    return (
                      <tr key={idx}>
                        <td>{emp ? emp.name : 'غير معروف'}</td>
                        <td>
                          <span className={`badge ${t.type === 'خصم' ? 'خصم' : t.type === 'مكافأة' ? 'مكافأة' : 'other'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#e2e8f0' }}>
                          {t.value} {t.value.includes(':') ? 'ساعة' : 'د.ع'}
                        </td>
                        <td>{t.notes || '-'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          {new Date(t.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute:'2-digit'
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchDashboard;
