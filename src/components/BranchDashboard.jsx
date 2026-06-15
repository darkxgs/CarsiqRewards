import React, { useState, useEffect } from 'react';
import { Download, Plus, Users, Save, Edit, Trash2 } from 'lucide-react';
import { addEmployee, listenEmployees, addTransaction, listenTransactions, updateTransaction, deleteTransaction } from '../services/db';
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
  const [editTransactionId, setEditTransactionId] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

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

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!selectedEmp || !value) return;
    setErrorMsg('');
    try {
      if (editTransactionId) {
        const updated = await updateTransaction(editTransactionId, {
          employeeId: selectedEmp,
          type,
          value,
          notes
        });
        setTransactions(transactions.map(t => t.id === editTransactionId ? updated : t));
        setEditTransactionId(null);
      } else {
        const newTrans = await addTransaction(branchId, {
          employeeId: selectedEmp,
          type,
          value,
          notes
        });
        setTransactions([newTrans, ...transactions]);
      }
      setNotes('');
      setValue(branchType === 'money' ? '1000' : '1:00');
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("حدث خطأ أثناء حفظ العملية.");
    }
  };

  const handleEditClick = (t) => {
    setEditTransactionId(t.id);
    setSelectedEmp(t.employeeId);
    setType(t.type);
    setValue(t.value);
    setNotes(t.notes || '');
    // Scroll the main content container to top
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteClick = (tId) => {
    setTransactionToDelete(tId);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete);
      setTransactions(transactions.filter(t => t.id !== transactionToDelete));
      setTransactionToDelete(null);
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("حدث خطأ أثناء حذف العملية.");
      setTransactionToDelete(null);
    }
  };

  return (
    <div>
      <div className="branch-header">
        <div className="branch-title">
          <div className="branch-title-icon">
            <Users size={32} />
          </div>
          {branchName}
        </div>
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
        <div className="dashboard-grid" id="form-section">
          {/* Sidebar Forms */}
          <div className="forms-container">
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
              <h2><Save size={24} /> {editTransactionId ? 'تعديل العملية' : 'تسجيل عملية'}</h2>
              <form onSubmit={handleSubmitTransaction}>
                <div className="form-row-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
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

                  <div className="form-group" style={{ marginBottom: 0 }}>
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

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>القيمة ({branchType === 'hours' ? 'ساعات' : branchType === 'money' ? 'مبالغ' : 'ساعات/مبالغ'})</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder={branchType === 'hours' ? '1:00' : '5000'}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>ملاحظات</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="اختياري"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary w-full" disabled={!selectedEmp}>
                      <Save size={20} /> {editTransactionId ? 'حفظ التعديل' : 'حفظ'}
                    </button>
                    {editTransactionId && (
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: '100%' }} 
                        onClick={() => {
                          setEditTransactionId(null);
                          setNotes('');
                          setValue(branchType === 'money' ? '1000' : '1:00');
                        }}
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
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
                  <th>إجراءات</th>
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
                        <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="btn" 
                            style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)' }}
                            onClick={() => handleEditClick(t)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn" 
                            style={{ padding: '0.5rem', background: 'rgba(244,63,94,0.1)', color: '#fb7185' }}
                            onClick={() => handleDeleteClick(t.id)}
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setTransactionToDelete(null)}
              >
                إلغاء
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDelete}
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchDashboard;
