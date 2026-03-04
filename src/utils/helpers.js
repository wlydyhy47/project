import { format, formatDistance, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// تنسيق التاريخ
export const formatDate = (date, formatStr = 'DD/MM/YYYY', locale = 'ar') => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const dateLocale = locale === 'ar' ? ar : enUS;
    
    switch (formatStr) {
      case 'DD/MM/YYYY':
        return format(dateObj, 'dd/MM/yyyy', { locale: dateLocale });
      case 'YYYY-MM-DD':
        return format(dateObj, 'yyyy-MM-dd', { locale: dateLocale });
      case 'DD/MM/YYYY HH:mm:ss':
        return format(dateObj, 'dd/MM/yyyy HH:mm:ss', { locale: dateLocale });
      case 'HH:mm:ss':
        return format(dateObj, 'HH:mm:ss', { locale: dateLocale });
      default:
        return format(dateObj, formatStr, { locale: dateLocale });
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

// الوقت المنقضي
export const timeAgo = (date, locale = 'ar') => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const dateLocale = locale === 'ar' ? ar : enUS;
    
    return formatDistance(dateObj, new Date(), {
      addSuffix: true,
      locale: dateLocale,
    });
  } catch (error) {
    console.error('Time ago error:', error);
    return '-';
  }
};

// تنسيق العملة
export const formatCurrency = (amount, currency = 'SAR', locale = 'ar') => {
  if (amount === undefined || amount === null) return '-';
  
  try {
    const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${currency} ${amount.toFixed(2)}`;
  }
};

// تنسيق الأرقام
export const formatNumber = (number, locale = 'ar') => {
  if (number === undefined || number === null) return '-';
  
  try {
    const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US');
    return formatter.format(number);
  } catch (error) {
    console.error('Number formatting error:', error);
    return number.toString();
  }
};

// تنسيق الهاتف
export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  
  // تنظيف رقم الهاتف
  const cleaned = phone.replace(/\D/g, '');
  
  // تنسيق للأرقام السعودية
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    return `+966 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('966')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  return phone;
};

// التحقق من البريد الإلكتروني
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// التحقق من رقم الهاتف
export const isValidPhone = (phone) => {
  const re = /^(009665|9665|\+9665|05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
  return re.test(phone);
};

// إنشاء معرف فريد
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// تقليم النص
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// تحويل حجم الملف
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// استخراج المعلمات من URL
export const getQueryParams = (url) => {
  const params = {};
  const searchParams = new URLSearchParams(url.split('?')[1] || '');
  
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  
  return params;
};

// بناء URL مع المعلمات
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  
  return url.toString();
};

// تجميع البيانات
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {});
};

// حساب الإجماليات
export const calculateSum = (array, key) => {
  return array.reduce((sum, item) => sum + (item[key] || 0), 0);
};

// حساب المتوسط
export const calculateAverage = (array, key) => {
  if (array.length === 0) return 0;
  const sum = calculateSum(array, key);
  return sum / array.length;
};

// ترتيب البيانات
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
};

// تصفية البيانات
export const filterBy = (array, key, value) => {
  return array.filter(item => item[key] === value);
};

// البحث في البيانات
export const searchInArray = (array, searchTerm, keys = []) => {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key];
      if (!value) return false;
      return value.toString().toLowerCase().includes(term);
    });
  });
};

// تحويل الألوان
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// التحقق من الصلاحيات
export const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    'admin': 4,
    'restaurant_owner': 3,
    'driver': 2,
    'client': 1,
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};

// حفظ في localStorage مع وقت انتهاء
export const setWithExpiry = (key, value, ttl) => {
  const now = new Date();
  
  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  };
  
  localStorage.setItem(key, JSON.stringify(item));
};

// قراءة من localStorage مع التحقق من وقت الانتهاء
export const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  
  if (!itemStr) {
    return null;
  }
  
  try {
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.value;
  } catch (error) {
    return null;
  }
};

// إنشاء CSV من البيانات
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  const csvRows = [];
  
  // إضافة رؤوس الأعمدة
  csvRows.push(headers.map(header => `"${header}"`).join(','));
  
  // إضافة البيانات
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

// تحميل ملف CSV
export const downloadCSV = (data, filename) => {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  a.click();
  
  window.URL.revokeObjectURL(url);
};

// نسخ النص إلى الحافظة
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
};

// تأخير التنفيذ (Debounce)
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// تنفيذ مرة واحدة (Throttle)
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = setTimeout(() => inThrottle = false, limit);
    }
  };
};