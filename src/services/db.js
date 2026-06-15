const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const loginUser = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'فشل تسجيل الدخول');
  }
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
};

export const fetchBranches = async () => {
  const response = await fetch(`${API_URL}/branches`, { headers: getHeaders() });
  if (!response.ok) throw new Error('فشل جلب الفروع');
  return await response.json();
};

export const addBranch = async (name, type) => {
  const response = await fetch(`${API_URL}/branches`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, type })
  });
  if (!response.ok) throw new Error('فشل إضافة الفرع');
  return await response.json();
};

export const listenEmployees = (branchId, callback, onError) => {
  let isCancelled = false;
  
  const fetchEmps = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/${branchId}`, { headers: getHeaders() });
      if (!response.ok) throw new Error('فشل جلب الموظفين');
      const data = await response.json();
      if (!isCancelled) callback(data);
    } catch (error) {
      if (!isCancelled && onError) onError(error);
    }
  };

  fetchEmps();
  const intervalId = setInterval(fetchEmps, 10000);

  return () => {
    isCancelled = true;
    clearInterval(intervalId);
  };
};

export const listenTransactions = (branchId, callback, onError) => {
  let isCancelled = false;
  
  const fetchTrans = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/${branchId}`, { headers: getHeaders() });
      if (!response.ok) throw new Error('فشل جلب العمليات');
      const data = await response.json();
      if (!isCancelled) callback(data);
    } catch (error) {
      if (!isCancelled && onError) onError(error);
    }
  };

  fetchTrans();
  const intervalId = setInterval(fetchTrans, 10000);

  return () => {
    isCancelled = true;
    clearInterval(intervalId);
  };
};

export const addEmployee = async (branchId, name) => {
  const response = await fetch(`${API_URL}/employees/${branchId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name })
  });
  if (!response.ok) throw new Error('فشل إضافة الموظف');
  return await response.json();
};

export const addTransaction = async (branchId, data) => {
  const response = await fetch(`${API_URL}/transactions/${branchId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('فشل تسجيل العملية');
  return await response.json();
};

export const updateTransaction = async (transactionId, data) => {
  const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('فشل تعديل العملية');
  return await response.json();
};

export const deleteTransaction = async (transactionId) => {
  const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('فشل حذف العملية');
  return await response.json();
};
