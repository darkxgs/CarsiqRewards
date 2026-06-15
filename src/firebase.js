import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxRf8DW4HDGzOTPGni3kPvxNNlOzwgMnw",
  authDomain: "reward-1fc02.firebaseapp.com",
  projectId: "reward-1fc02",
  storageBucket: "reward-1fc02.firebasestorage.app",
  messagingSenderId: "315804631544",
  appId: "1:315804631544:web:b32e29cdd3e1f55037160d",
  measurementId: "G-8ZVD9H19HX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
