export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-walid-yahaya.onrender.com/api';

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  DRIVER: 'driver',
  RESTAURANT_OWNER: 'restaurant_owner',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PICKED: 'picked',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.ACCEPTED]: 'info',
  [ORDER_STATUS.PICKED]: 'primary',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'danger',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet',
};

export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
  CHAT: 'chat',
  DRIVER: 'driver',
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const RESTAURANT_TYPES = {
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  FAST_FOOD: 'fast_food',
  BAKERY: 'bakery',
};

export const ITEM_CATEGORIES = {
  BURGER: 'burger',
  PIZZA: 'pizza',
  DRINK: 'drink',
  DESSERT: 'dessert',
  APPETIZER: 'appetizer',
  MAIN: 'main',
};

export const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
};

export const ADDRESS_TYPES = {
  HOME: 'home',
  WORK: 'work',
  OFFICE: 'office',
  OTHER: 'other',
};

export const SUPPORT_TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const CHAT_MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
};

export const CACHE_KEYS = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  ORDERS: 'orders',
  ITEMS: 'items',
  DASHBOARD: 'dashboard',
  STATISTICS: 'statistics',
};

export const CACHE_TTL = {
  SHORT: 300, // 5 دقائق
  MEDIUM: 1800, // 30 دقيقة
  LONG: 3600, // ساعة
  VERY_LONG: 86400, // 24 ساعة
};

export const DATE_FORMATS = {
  DEFAULT: 'DD/MM/YYYY',
  ISO: 'YYYY-MM-DD',
  FULL: 'DD/MM/YYYY HH:mm:ss',
  TIME: 'HH:mm:ss',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 20, 50, 100],
};

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
};

export const MAP_CONFIG = {
  DEFAULT_CENTER: [24.7136, 46.6753], // الرياض
  DEFAULT_ZOOM: 12,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const THEME_CONFIG = {
  LIGHT: {
    primary: '#2c3e50',
    secondary: '#34495e',
    success: '#27ae60',
    danger: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
    background: '#f5f7fa',
    card: '#ffffff',
    text: '#2c3e50',
    border: '#ecf0f1',
  },
  DARK: {
    primary: '#3498db',
    secondary: '#2980b9',
    success: '#2ecc71',
    danger: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
    background: '#1a1a1a',
    card: '#2c2c2c',
    text: '#ffffff',
    border: '#404040',
  },
};

export const CHART_COLORS = [
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#e74c3c',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#95a5a6',
];