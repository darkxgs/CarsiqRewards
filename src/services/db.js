import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const addEmployee = async (branch, name) => {
  try {
    const docRef = await addDoc(collection(db, `branches/${branch}/employees`), {
      name,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, name };
  } catch (e) {
    console.error("Error adding employee: ", e);
    throw e;
  }
};

export const getEmployees = async (branch) => {
  try {
    const q = query(collection(db, `branches/${branch}/employees`), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching employees: ", e);
    throw e;
  }
};

export const addTransaction = async (branch, data) => {
  try {
    const docRef = await addDoc(collection(db, `branches/${branch}/transactions`), {
      ...data,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...data };
  } catch (e) {
    console.error("Error adding transaction: ", e);
    throw e;
  }
};

export const getTransactions = async (branch) => {
  try {
    const q = query(collection(db, `branches/${branch}/transactions`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching transactions: ", e);
    throw e;
  }
};
