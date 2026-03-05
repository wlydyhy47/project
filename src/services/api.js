// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-walid-yahaya.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة token للتخزين المؤقت
let cachedToken = null;
let tokenRefreshPromise = null;
let failedQueue = []; // ✅ قائمة الطلبات المعلقة

// ✅ دالة معالجة قائمة الانتظار
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// دالة للحصول على التوكن
const getToken = () => {
  if (!cachedToken) {
    cachedToken = localStorage.getItem('accessToken');
  }
  return cachedToken;
};

// دالة لتحديث التوكن
const updateToken = (token) => {
  cachedToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

// Interceptor للطلب
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor للرد - نسخة محسنة
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ✅ تجنب التكرار للطلبات التي فشلت بسبب 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // ✅ إذا كان الطلب هو نفسه refresh token وفشل
      if (originalRequest.url.includes('/auth/refresh')) {
        localStorage.clear();
        cachedToken = null;
        window.location.href = '/login';
        toast.error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
        return Promise.reject(error);
      }

      // ✅ إذا كان هناك طلب refresh قيد التنفيذ
      if (tokenRefreshPromise) {
        try {
          // إضافة الطلب إلى قائمة الانتظار
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      
      // ✅ إنشاء طلب refresh جديد
      tokenRefreshPromise = (async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');

          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;

          updateToken(accessToken);
          
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // ✅ معالجة قائمة الانتظار
          processQueue(null, accessToken);
          
          return accessToken;
        } catch (refreshError) {
          // ✅ فشل refresh - تنظيف كل شيء
          processQueue(refreshError, null);
          localStorage.clear();
          cachedToken = null;
          window.location.href = '/login';
          toast.error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
          throw refreshError;
        } finally {
          tokenRefreshPromise = null;
        }
      })();

      try {
        const newToken = await tokenRefreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // ✅ معالجة الأخطاء الأخرى
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'حدث خطأ في الاتصال';
    
    if (error.response?.status !== 401) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// ✅ دالة استخراج البيانات
const extractData = (response) => {
  if (!response || !response.data) return null;
  
  const res = response.data;
  
  if (res.success === true && res.data !== undefined) {
    return res.data;
  }
  
  if (res && typeof res === 'object' && !res.success) {
    return res;
  }
  
  return res;
};

// ✅ دوال API مع معالجة موحدة للبيانات
export const adminAPI = {
  // لوحة التحكم الرئيسية
  getDashboardStats: async () => {
    try {
      const response = await api.get('/aggregate/admin/dashboard');
      const data = extractData(response);
      return {
        totalUsers: data?.totalUsers || 0,
        totalRestaurants: data?.totalRestaurants || 0,
        totalOrders: data?.totalOrders || 0,
        totalRevenue: data?.totalRevenue || 0,
        activeDrivers: data?.activeDrivers || 0,
        recentOrders: data?.recentOrders || [],
        topRestaurants: data?.topRestaurants || [],
        userGrowth: data?.userGrowth || 0,
        restaurantGrowth: data?.restaurantGrowth || 0,
        orderGrowth: data?.orderGrowth || 0,
        revenueGrowth: data?.revenueGrowth || 0,
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return {
        totalUsers: 0,
        totalRestaurants: 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeDrivers: 0,
        recentOrders: [],
        topRestaurants: [],
        userGrowth: 0,
        restaurantGrowth: 0,
        orderGrowth: 0,
        revenueGrowth: 0,
      };
    }
  },

  // إدارة المطاعم
  getRestaurants: async (params) => {
    try {
      const response = await api.get('/restaurants', { params });
      const data = extractData(response);
      
      let restaurants = [];
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(data)) {
        restaurants = data;
        total = data.length;
      } else if (data && typeof data === 'object') {
        restaurants = data.restaurants || data.data || data.items || [];
        total = data.total || restaurants.length;
        totalPages = data.totalPages || data.pageCount || 1;
      }
      
      return {
        restaurants,
        totalPages,
        currentPage: params?.page || 1,
        total,
      };
    } catch (error) {
      console.error('Get restaurants error:', error);
      return {
        restaurants: [],
        totalPages: 1,
        currentPage: 1,
        total: 0,
      };
    }
  },

  getRestaurantDetails: async (id) => {
    try {
      const response = await api.get(`/aggregate/restaurants/${id}/full`);
      return extractData(response) || {};
    } catch (error) {
      console.error('Get restaurant details error:', error);
      return {};
    }
  },

  deleteRestaurant: async (id) => {
    try {
      const response = await api.delete(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete restaurant error:', error);
      throw error;
    }
  },

  // إدارة المستخدمين
  getUsers: async (params) => {
    try {
      const response = await api.get('/complete/admin/users', { params });
      const data = extractData(response);
      
      let users = [];
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(data)) {
        users = data;
        total = data.length;
      } else if (data && typeof data === 'object') {
        users = data.users || data.data || data.items || [];
        total = data.total || users.length;
        totalPages = data.totalPages || 1;
      }
      
      return {
        users,
        totalPages,
        total,
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        users: [],
        totalPages: 1,
        total: 0,
      };
    }
  },

  getUserDetails: async (id) => {
    try {
      const response = await api.get(`/complete/admin/users/${id}`);
      return extractData(response) || {};
    } catch (error) {
      console.error('Get user details error:', error);
      return {};
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await api.put(`/complete/admin/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  deleteUser: async (id, reason) => {
    try {
      const response = await api.delete(`/complete/admin/users/${id}`, { data: { reason } });
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  // إدارة الطلبات
  getOrders: async (params) => {
    try {
      const response = await api.get('/aggregate/orders/admin', { params });
      const data = extractData(response);
      
      let orders = [];
      let stats = {};
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(data)) {
        orders = data;
        total = data.length;
      } else if (data && typeof data === 'object') {
        orders = data.orders || data.data || data.items || [];
        stats = data.stats || {};
        total = data.total || orders.length;
        totalPages = data.totalPages || 1;
      }
      
      return {
        orders,
        stats,
        totalPages,
        total,
      };
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        orders: [],
        stats: {},
        totalPages: 1,
        total: 0,
      };
    }
  },

  getOrderDetails: async (id) => {
    try {
      const response = await api.get(`/aggregate/orders/${id}/full`);
      return extractData(response) || {};
    } catch (error) {
      console.error('Get order details error:', error);
      return {};
    }
  },

  reassignDriver: async (orderId, driverId) => {
    try {
      const response = await api.put(`/orders/${orderId}/reassign`, { driverId });
      return response.data;
    } catch (error) {
      console.error('Reassign driver error:', error);
      throw error;
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const response = await api.put(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },

  // إدارة العناصر
  getItems: async (params) => {
    try {
      const response = await api.get('/items', { params });
      const data = extractData(response);
      
      let items = [];
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(data)) {
        items = data;
        total = data.length;
      } else if (data && typeof data === 'object') {
        items = data.items || data.data || [];
        total = data.total || items.length;
        totalPages = data.totalPages || 1;
      }
      
      return {
        items,
        totalPages,
        total,
      };
    } catch (error) {
      console.error('Get items error:', error);
      return {
        items: [],
        totalPages: 1,
        total: 0,
      };
    }
  },

  createItem: async (data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'image' && data[key]) {
          formData.append(key, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      });

      const response = await api.post('/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Create item error:', error);
      throw error;
    }
  },

  updateItem: async (id, data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'image' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      });

      const response = await api.put(`/items/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Update item error:', error);
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      const response = await api.delete(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete item error:', error);
      throw error;
    }
  },

  // إدارة الإشعارات
  getNotifications: async (params) => {
    try {
      const response = await api.get('/notifications', { params });
      const data = extractData(response);
      
      let items = [];
      let total = 0;
      
      if (Array.isArray(data)) {
        items = data;
        total = data.length;
      } else if (data && typeof data === 'object') {
        items = data.items || data.data || [];
        total = data.total || items.length;
      }
      
      return {
        items,
        total,
        delivered: data?.delivered || 0,
        openRate: data?.openRate || 0,
        clients: data?.clients || [],
        drivers: data?.drivers || [],
        restaurantOwners: data?.restaurantOwners || [],
        allUsers: data?.allUsers || [],
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      return {
        items: [],
        total: 0,
        delivered: 0,
        openRate: 0,
        clients: [],
        drivers: [],
        restaurantOwners: [],
        allUsers: [],
      };
    }
  },

  sendNotification: async (data) => {
    try {
      const response = await api.post('/notifications/send', data);
      return response.data;
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  },

  // إدارة المراجعات
  getReviews: async (params) => {
    try {
      const response = await api.get('/reviews', { params });
      const data = extractData(response);
      
      let reviews = [];
      let stats = {};
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(data)) {
        reviews = data;
        total = data.length;
      } else if (data && typeof data === 'object') {
        reviews = data.reviews || data.data || data.items || [];
        stats = data.stats || {};
        total = data.total || reviews.length;
        totalPages = data.totalPages || 1;
      }
      
      return {
        reviews,
        stats,
        totalPages,
        total,
      };
    } catch (error) {
      console.error('Get reviews error:', error);
      return {
        reviews: [],
        stats: {},
        totalPages: 1,
        total: 0,
      };
    }
  },

  deleteReview: async (id) => {
    try {
      const response = await api.delete(`/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete review error:', error);
      throw error;
    }
  },

  moderateReview: async (id, data) => {
    try {
      const response = await api.put(`/reviews/${id}/moderate`, data);
      return response.data;
    } catch (error) {
      console.error('Moderate review error:', error);
      throw error;
    }
  },

  // الدعم الفني
  getSupportConversations: async (params) => {
    try {
      const response = await api.get('/chat/admin/support-conversations', { params });
      const data = extractData(response);
      
      let conversations = [];
      
      if (Array.isArray(data)) {
        conversations = data;
      } else if (data && typeof data === 'object') {
        conversations = data.conversations || data.data || data.items || [];
      }
      
      return conversations;
    } catch (error) {
      console.error('Failed to fetch support conversations:', error);
      return [];
    }
  },

  assignSupportConversation: async (id, userId) => {
    try {
      const response = await api.put(`/chat/admin/conversations/${id}/assign`, { assignedTo: userId });
      return response.data;
    } catch (error) {
      console.error('Assign conversation error:', error);
      throw error;
    }
  },

  // تتبع المندوبين
  getDriverLocation: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/location`);
      return extractData(response);
    } catch (error) {
      console.error('Get driver location error:', error);
      return null;
    }
  },

  // إحصائيات الطلبات
  getOrdersStats: async (params) => {
    try {
      const response = await api.get('/orders/stats', { params });
      const data = extractData(response);
      
      return {
        dailyStats: data?.dailyStats || [],
        statusDistribution: data?.statusDistribution || [],
        userGrowth: data?.userGrowth || [],
        topRestaurants: data?.topRestaurants || [],
      };
    } catch (error) {
      console.log('Orders stats endpoint not available');
      return {
        dailyStats: [],
        statusDistribution: [],
        userGrowth: [],
        topRestaurants: [],
      };
    }
  },

  // الإعدادات
  updateSettings: async (data) => {
    try {
      const response = await api.put('/admin/settings', data);
      return response.data;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  },

  clearCache: async () => {
    try {
      const response = await api.post('/aggregate/cache/clear');
      return response.data;
    } catch (error) {
      console.error('Clear cache error:', error);
      throw error;
    }
  },
};

// ✅ دالة التحقق من صحة التوكن
export const validateToken = async () => {
  try {
    const token = getToken();
    if (!token) {
      return false;
    }

    const response = await api.get('/auth/validate');
    const data = extractData(response);
    return data?.valid || data?.success || false;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

// ✅ دالة تجديد التوكن
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const data = extractData({ data: response.data });
    const { accessToken, refreshToken: newRefreshToken } = data;

    updateToken(accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

export default api;