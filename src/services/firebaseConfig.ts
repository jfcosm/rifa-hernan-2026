import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyClu8n485Ieg9tMCdMKdgAVdWx-SvxRlL4",
  authDomain: "rifa-hernan-2026.firebaseapp.com",
  projectId: "rifa-hernan-2026",
  storageBucket: "rifa-hernan-2026.firebasestorage.app",
  messagingSenderId: "276086986017",
  appId: "1:276086986017:web:fb2ef533197cfb02151a60",
  measurementId: "G-3196XF0G2K"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
