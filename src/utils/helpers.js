// src/utils/helpers.js
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

// ✅ تنسيق الهاتف - أكثر مرونة
export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  
  // تنظيف رقم الهاتف من المسافات والرموز
  const cleaned = phone.replace(/\D/g, '');
  
  // تنسيق للأرقام السعودية
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    return `+966 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('966')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  // تنسيق عام للأرقام الدولية
  if (cleaned.length > 7) {
    // إضافة + إذا كان الرقم يبدأ بـ 00
    if (phone.startsWith('00')) {
      return `+${cleaned.slice(2)}`;
    }
    // إضافة + إذا كان الرقم لا يحتوي على +
    if (!phone.startsWith('+') && cleaned.length > 7) {
      return `+${cleaned}`;
    }
  }
  
  return phone;
};

// ✅ التحقق من البريد الإلكتروني - مع دعم النطاقات العربية
export const isValidEmail = (email) => {
  if (!email) return false;
  // دعم البريد الإلكتروني مع نطاقات مثل .com, .net, .org, .sa, إلخ
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// ✅ التحقق من رقم الهاتف - مرن جداً
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // تنظيف الرقم من المسافات والرموز
  const cleaned = phone.replace(/\D/g, '');
  
  // التحقق من الطول المناسب (بين 8 و 15 رقم)
  if (cleaned.length < 8 || cleaned.length > 15) {
    return false;
  }
  
  return true;
};

// ✅ استخراج رمز الدولة من رقم الهاتف
export const getCountryCode = (phone) => {
  if (!phone) return null;
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('966')) return 'SA';
  if (cleaned.startsWith('971')) return 'AE';
  if (cleaned.startsWith('974')) return 'QA';
  if (cleaned.startsWith('965')) return 'KW';
  if (cleaned.startsWith('973')) return 'BH';
  if (cleaned.startsWith('968')) return 'OM';
  if (cleaned.startsWith('20')) return 'EG';
  if (cleaned.startsWith('212')) return 'MA';
  if (cleaned.startsWith('213')) return 'DZ';
  if (cleaned.startsWith('216')) return 'TN';
  if (cleaned.startsWith('218')) return 'LY';
  
  return 'OTHER';
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
  if (!bytes) return '-';
  
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
  const url = new URL(baseUrl, window.location.origin);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  
  return url.toString();
};

// تجميع البيانات
export const groupBy = (array, key) => {
  if (!array || !Array.isArray(array)) return {};
  
  return array.reduce((result, item) => {
    const groupKey = item[key];
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {});
};

// حساب الإجماليات
export const calculateSum = (array, key) => {
  if (!array || !Array.isArray(array)) return 0;
  return array.reduce((sum, item) => sum + (item[key] || 0), 0);
};

// حساب المتوسط
export const calculateAverage = (array, key) => {
  if (!array || !Array.isArray(array) || array.length === 0) return 0;
  const sum = calculateSum(array, key);
  return sum / array.length;
};

// ترتيب البيانات
export const sortBy = (array, key, order = 'asc') => {
  if (!array || !Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const valA = a[key] || 0;
    const valB = b[key] || 0;
    
    if (order === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });
};

// تصفية البيانات
export const filterBy = (array, key, value) => {
  if (!array || !Array.isArray(array)) return [];
  return array.filter(item => item[key] === value);
};

// البحث في البيانات
export const searchInArray = (array, searchTerm, keys = []) => {
  if (!array || !Array.isArray(array)) return [];
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase().trim();
  
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
  if (!hex) return `rgba(0,0,0,${alpha})`;
  
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    return `rgba(0,0,0,${alpha})`;
  }
};

// التحقق من الصلاحيات
export const hasPermission = (userRole, requiredRole) => {
  if (!userRole) return false;
  
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
  if (!data || !Array.isArray(data) || data.length === 0) return '';
  
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
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
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

// ✅ التحقق من كائن فارغ
export const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

// ✅ تنظيف الكائن من القيم الفارغة
export const cleanObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => 
      v !== null && v !== undefined && v !== ''
    )
  );
};

// ✅ إنشاء خطأ قابل للقراءة
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  return error?.response?.data?.message || 
         error?.response?.data?.error || 
         error?.message || 
         'حدث خطأ غير متوقع';
};