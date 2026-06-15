const API_URL = 'http://localhost:3001/api';

export const listenEmployees = (branch, callback, onError) => {
  let isCancelled = false;
  
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/${branch}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (!isCancelled) callback(data);
    } catch (error) {
      if (!isCancelled && onError) onError(error);
    }
  };

  fetchEmployees();
  
  // Minimal polling just to keep the dashboard feel
  const intervalId = setInterval(fetchEmployees, 10000);

  return () => {
    isCancelled = true;
    clearInterval(intervalId);
  };
};

export const listenTransactions = (branch, callback, onError) => {
  let isCancelled = false;
  
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/${branch}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (!isCancelled) callback(data);
    } catch (error) {
      if (!isCancelled && onError) onError(error);
    }
  };

  fetchTransactions();
  
  const intervalId = setInterval(fetchTransactions, 10000);

  return () => {
    isCancelled = true;
    clearInterval(intervalId);
  };
};

export const addEmployee = async (branch, name) => {
  try {
    const response = await fetch(`${API_URL}/employees/${branch}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Failed to add employee');
    return await response.json();
  } catch (e) {
    console.error("Error adding employee: ", e);
    throw e;
  }
};

export const addTransaction = async (branch, data) => {
  try {
    const response = await fetch(`${API_URL}/transactions/${branch}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to add transaction');
    return await response.json();
  } catch (e) {
    console.error("Error adding transaction: ", e);
    throw e;
  }
};
