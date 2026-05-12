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

const STORAGE_KEY_NUMBERS = 'raffle_numbers';
const STORAGE_KEY_PRIZES = 'raffle_prizes';
const STORAGE_KEY_CONFIG = 'raffle_config';
const STORAGE_KEY_HISTORY = 'raffle_history';

export const getRaffleConfig = (): RaffleConfig | null => {
  const data = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (data) {
    const parsed = JSON.parse(data);
    // Backward compatibility for old configs
    if (parsed.showCountdown === undefined) {
      parsed.showCountdown = !!parsed.drawDate;
      parsed.drawDateMessage = "Cuando se vendan todos los números";
    }
    if (parsed.ticketPrice === undefined) {
      parsed.ticketPrice = 2000;
    }
    if (parsed.status === undefined) {
      parsed.status = 'active';
    }
    return parsed;
  }
  
  return null;
};

export const createNewRaffle = () => {
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
  saveRaffleConfig(newConfig);
};

export const saveRaffleConfig = (config: RaffleConfig) => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  // Adjust numbers if total changes
  const numbers = getNumbers();
  if (numbers.length < config.totalNumbers) {
    const newNumbers = Array.from({ length: config.totalNumbers - numbers.length }, (_, i) => ({
      id: numbers.length + i + 1,
      status: 'available' as const
    }));
    saveNumbers([...numbers, ...newNumbers]);
  } else if (numbers.length > config.totalNumbers) {
    saveNumbers(numbers.slice(0, config.totalNumbers));
  }
};

export const getNumbers = (): RaffleNumber[] => {
  const data = localStorage.getItem(STORAGE_KEY_NUMBERS);
  if (data) return JSON.parse(data);
  
  // Default numbers based on config
  const config = getRaffleConfig();
  if (!config) return [];
  
  const defaultNumbers = Array.from({ length: config.totalNumbers }, (_, i) => ({
    id: i + 1,
    status: 'available' as const
  }));
  localStorage.setItem(STORAGE_KEY_NUMBERS, JSON.stringify(defaultNumbers));
  return defaultNumbers;
};

export const saveNumbers = (numbers: RaffleNumber[]) => {
  localStorage.setItem(STORAGE_KEY_NUMBERS, JSON.stringify(numbers));
};

export const updateNumber = (updatedNumber: RaffleNumber) => {
  const numbers = getNumbers();
  const newNumbers = numbers.map(n => n.id === updatedNumber.id ? updatedNumber : n);
  saveNumbers(newNumbers);
};

export const getPrizes = (): Prize[] => {
  const data = localStorage.getItem(STORAGE_KEY_PRIZES);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Validate old schema
      if (parsed.length > 0 && typeof parsed[0].value === 'number') {
        return parsed;
      }
    } catch(e) {}
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
  localStorage.setItem(STORAGE_KEY_PRIZES, JSON.stringify(defaultPrizes));
  return defaultPrizes;
};

export const savePrizes = (prizes: Prize[]) => {
  localStorage.setItem(STORAGE_KEY_PRIZES, JSON.stringify(prizes));
};

export type RaffleHistoryItem = {
  id: string;
  config: RaffleConfig;
  numbers: RaffleNumber[];
  prizes: Prize[];
};

export const getRaffleHistory = (): RaffleHistoryItem[] => {
  const data = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (data) return JSON.parse(data);
  return [];
};

export const finishCurrentRaffle = () => {
  const config = getRaffleConfig();
  if (!config) return;

  const numbers = getNumbers();
  const prizes = getPrizes();

  config.status = 'finished';
  config.finishedAt = new Date().toISOString();

  const historyItem: RaffleHistoryItem = {
    id: Date.now().toString(),
    config,
    numbers,
    prizes
  };

  const history = getRaffleHistory();
  history.push(historyItem);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));

  // Reset current raffle keys
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  localStorage.removeItem(STORAGE_KEY_NUMBERS);
  localStorage.removeItem(STORAGE_KEY_PRIZES);
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
