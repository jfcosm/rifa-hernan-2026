export type Buyer = {
  name: string;
  lastName: string;
  phone: string;
};

export type RaffleNumber = {
  id: number;
  status: 'available' | 'sold';
  buyer?: Buyer;
};

export type Prize = {
  id: string;
  title: string;
  description: string;
  value: number;
  image: string;
  isActive: boolean;
};

export const formatCLP = (value: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(value);
};

export type RaffleConfig = {
  totalNumbers: number;
  drawDate: string; // ISO string
  showCountdown: boolean;
  drawDateMessage: string;
  ticketPrice: number;
  status: 'active' | 'paused' | 'finished';
  finishedAt?: string;
};

import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const DOC_CONFIG = 'current';
const DOC_NUMBERS = 'current';
const DOC_PRIZES = 'current';

export const getRaffleConfig = async (): Promise<RaffleConfig | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'config', DOC_CONFIG));
    if (docSnap.exists()) {
      return docSnap.data() as RaffleConfig;
    }
  } catch (e) {
    console.error("Error getting config", e);
  }
  return null;
};

export const subscribeToConfig = (callback: (config: RaffleConfig | null) => void) => {
  return onSnapshot(doc(db, 'config', DOC_CONFIG), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as RaffleConfig);
    } else {
      callback(null);
    }
  });
};

export const createNewRaffle = async () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const newConfig: RaffleConfig = {
    totalNumbers: 150,
    drawDate: date.toISOString(),
    showCountdown: true,
    drawDateMessage: "Cuando se vendan todos los números",
    ticketPrice: 2000,
    status: 'active'
  };
  await saveRaffleConfig(newConfig);
};

export const saveRaffleConfig = async (config: RaffleConfig) => {
  await setDoc(doc(db, 'config', DOC_CONFIG), config);
  
  // Adjust numbers if total changes
  const numbers = await getNumbers();
  if (numbers.length < config.totalNumbers) {
    const newNumbers = Array.from({ length: config.totalNumbers - numbers.length }, (_, i) => ({
      id: numbers.length + i + 1,
      status: 'available' as const
    }));
    await saveNumbers([...numbers, ...newNumbers]);
  } else if (numbers.length > config.totalNumbers) {
    await saveNumbers(numbers.slice(0, config.totalNumbers));
  }
};

export const getNumbers = async (): Promise<RaffleNumber[]> => {
  const docSnap = await getDoc(doc(db, 'numbers', DOC_NUMBERS));
  if (docSnap.exists()) {
    return docSnap.data().items as RaffleNumber[];
  }
  
  // Default numbers based on config
  const config = await getRaffleConfig();
  if (!config) return [];
  
  const defaultNumbers = Array.from({ length: config.totalNumbers }, (_, i) => ({
    id: i + 1,
    status: 'available' as const
  }));
  await setDoc(doc(db, 'numbers', DOC_NUMBERS), { items: defaultNumbers });
  return defaultNumbers;
};

export const subscribeToNumbers = (callback: (numbers: RaffleNumber[]) => void) => {
  return onSnapshot(doc(db, 'numbers', DOC_NUMBERS), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().items as RaffleNumber[]);
    } else {
      callback([]);
    }
  });
};

export const saveNumbers = async (numbers: RaffleNumber[]) => {
  await setDoc(doc(db, 'numbers', DOC_NUMBERS), { items: numbers });
};

export const updateNumber = async (updatedNumber: RaffleNumber) => {
  const numbers = await getNumbers();
  const newNumbers = numbers.map(n => n.id === updatedNumber.id ? updatedNumber : n);
  await saveNumbers(newNumbers);
};

export const getPrizes = async (): Promise<Prize[]> => {
  const docSnap = await getDoc(doc(db, 'prizes', DOC_PRIZES));
  if (docSnap.exists()) {
    return docSnap.data().items as Prize[];
  }
  
  // Default prizes
  const defaultPrizes: Prize[] = [
    {
      id: '1',
      title: 'Primer Premio',
      description: 'El premio mayor de la rifa.',
      value: 50000,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1000&auto=format&fit=crop',
      isActive: true
    },
    {
      id: '2',
      title: 'Segundo Premio',
      description: 'Un excelente segundo lugar.',
      value: 25000,
      image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1000&auto=format&fit=crop',
      isActive: true
    },
    {
      id: '3',
      title: 'Tercer Premio',
      description: 'Un detalle especial.',
      value: 10000,
      image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=1000&auto=format&fit=crop',
      isActive: true
    },
    {
      id: '4',
      title: 'Premio Sorpresa',
      description: '¡Nadie sabe qué es!',
      value: 5000,
      image: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=1000&auto=format&fit=crop',
      isActive: true
    }
  ];
  await setDoc(doc(db, 'prizes', DOC_PRIZES), { items: defaultPrizes });
  return defaultPrizes;
};

export const subscribeToPrizes = (callback: (prizes: Prize[]) => void) => {
  return onSnapshot(doc(db, 'prizes', DOC_PRIZES), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().items as Prize[]);
    } else {
      callback([]);
    }
  });
};

export const savePrizes = async (prizes: Prize[]) => {
  await setDoc(doc(db, 'prizes', DOC_PRIZES), { items: prizes });
};

export type RaffleHistoryItem = {
  id: string;
  config: RaffleConfig;
  numbers: RaffleNumber[];
  prizes: Prize[];
};

export const getRaffleHistory = async (): Promise<RaffleHistoryItem[]> => {
  const querySnapshot = await getDocs(collection(db, 'history'));
  return querySnapshot.docs.map(doc => doc.data() as RaffleHistoryItem);
};

export const finishCurrentRaffle = async () => {
  const config = await getRaffleConfig();
  if (!config) return;

  const numbers = await getNumbers();
  const prizes = await getPrizes();

  config.status = 'finished';
  config.finishedAt = new Date().toISOString();

  const historyItem: RaffleHistoryItem = {
    id: Date.now().toString(),
    config,
    numbers,
    prizes
  };

  // Guardar en el historial
  await setDoc(doc(db, 'history', historyItem.id), historyItem);

  // Limpiar la rifa actual
  await deleteDoc(doc(db, 'config', DOC_CONFIG));
  await deleteDoc(doc(db, 'numbers', DOC_NUMBERS));
  await deleteDoc(doc(db, 'prizes', DOC_PRIZES));
};

// Admin Auth Mock
export const isAdminLoggedIn = () => {
  return localStorage.getItem('admin_logged_in') === 'true';
};

export const loginAdmin = (username: string, password: string) => {
  // Simple mock login
  if (username === 'Lechuzon1981$' && password === 'Lechuzon1981$') {
    localStorage.setItem('admin_logged_in', 'true');
    return true;
  }
  return false;
};

export const logoutAdmin = () => {
  localStorage.removeItem('admin_logged_in');
};
