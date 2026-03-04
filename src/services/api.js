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

// إضافة token للتخزين المؤقت للتجنب القراءة المتكررة من localStorage
let cachedToken = null;
let tokenRefreshPromise = null;

// ✅ دالة للحصول على التوكن مع التخزين المؤقت
const getToken = () => {
  if (!cachedToken) {
    cachedToken = localStorage.getItem('accessToken');
  }
  return cachedToken;
};

// ✅ دالة لتحديث التوكن المخزن مؤقتاً
const updateToken = (token) => {
  cachedToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

// ✅ Interceptor للطلب - إرسال Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Interceptor للرد مع معالجة محسنة للـ refresh token
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 ${response.config.method.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        dataStructure: response.data ? Object.keys(response.data) : 'no data'
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // تجنب التكرار في حالة فشل الـ refresh نفسه
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      
      if (tokenRefreshPromise) {
        // إذا كان هناك طلب تحديث قيد التنفيذ، انتظر حتى يكتمل
        try {
          await tokenRefreshPromise;
          // أعد المحاولة بالتوكن الجديد
          originalRequest.headers.Authorization = `Bearer ${getToken()}`;
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      originalRequest._retry = true;
      
      // إنشاء وعد جديد لتحديث التوكن
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

          return accessToken;
        } catch (refreshError) {
          // فشل التحديث - تسجيل الخروج
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

    // معالجة الأخطاء الأخرى
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'حدث خطأ في الاتصال';
    
    // لا نظهر toast للأخطاء 401 لأننا نعالجها بالفعل
    if (error.response?.status !== 401) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// ✅ دالة مساعدة متطورة لاستخراج البيانات من مختلف هياكل الردود
const extractData = (response, defaultData = null) => {
  if (!response || !response.data) return defaultData;
  
  const res = response.data;
  
  // هيكل السيرفر: { success: true, data: [], pagination: {}, timestamp: {}, metadata: {} }
  if (res.success === true && res.data !== undefined) {
    return res.data;
  }
  
  // هيكل قديم: { data: { ... } }
  if (res.data !== undefined) {
    return res.data;
  }
  
  // إذا كان الرد نفسه هو المصفوفة
  if (Array.isArray(res)) {
    return res;
  }
  
  // إذا كان الكائن نفسه هو البيانات
  if (res && typeof res === 'object' && !res.success && !res.data) {
    return res;
  }
  
  return res;
};

// ✅ دالة مساعدة متطورة لاستخراج الباجينيشن
const extractPagination = (response) => {
  if (!response || !response.data) return null;
  
  const res = response.data;
  
  // هيكل السيرفر: { pagination: { ... } }
  if (res.pagination) {
    return res.pagination;
  }
  
  // هيكل آخر: { data: { pagination: { ... } } }
  if (res.data && res.data.pagination) {
    return res.data.pagination;
  }
  
  // استخراج من البيانات المغلفة
  if (res.data && typeof res.data === 'object') {
    const dataObj = res.data;
    if (dataObj.totalPages !== undefined || dataObj.page !== undefined) {
      return {
        page: dataObj.page || 1,
        totalPages: dataObj.totalPages || 1,
        total: dataObj.total || 0,
        limit: dataObj.limit || 10
      };
    }
  }
  
  return null;
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
    console.error('❌ Token validation failed:', error);
    if (error.response?.status === 401) {
      return false;
    }
    if (error.message === 'Network Error') {
      console.log('⚠️ Network error during token validation, assuming valid');
      return true;
    }
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

    const data = extractData(response);
    const { accessToken, refreshToken: newRefreshToken } = data;

    updateToken(accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    return accessToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    throw error;
  }
};

// ✅ دوال API مع معالجة موحدة للبيانات
export const adminAPI = {
  // ✅ لوحة التحكم الرئيسية
  getDashboardStats: async () => {
    try {
      const response = await api.get('/aggregate/admin/dashboard');
      const data = extractData(response, {});
      return {
        data: {
          data: data || {
            totalUsers: 0,
            totalRestaurants: 0,
            totalOrders: 0,
            totalRevenue: 0,
            activeDrivers: 0,
            recentOrders: [],
            topRestaurants: []
          }
        }
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },

  // ✅ إدارة المطاعم - مُحسنة بشكل كبير
  getRestaurants: async (params) => {
    try {
      const response = await api.get('/restaurants', { params });
      
      // استخراج البيانات الأساسية
      const restaurantsData = extractData(response);
      const pagination = extractPagination(response);
      
      console.log('📦 Restaurants API Response:', { 
        raw: response.data,
        extracted: restaurantsData,
        pagination 
      });
      
      // معالجة ذكية للبيانات
      let restaurants = [];
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(restaurantsData)) {
        // الحالة 1: البيانات هي مصفوفة مباشرة
        restaurants = restaurantsData;
        total = restaurantsData.length;
      } else if (restaurantsData && typeof restaurantsData === 'object') {
        // الحالة 2: البيانات هي كائن يحتوي على المصفوفة
        if (Array.isArray(restaurantsData.restaurants)) {
          restaurants = restaurantsData.restaurants;
        } else if (Array.isArray(restaurantsData.data)) {
          restaurants = restaurantsData.data;
        } else if (Array.isArray(restaurantsData.items)) {
          restaurants = restaurantsData.items;
        }
        
        total = restaurantsData.total || restaurants.length;
      }
      
      // استخدام معلومات الباجينيشن إن وجدت
      if (pagination) {
        totalPages = pagination.totalPages || pagination.pageCount || 1;
        total = pagination.total || total;
      } else if (restaurantsData && restaurantsData.totalPages) {
        totalPages = restaurantsData.totalPages;
      }
      
      return {
        data: {
          data: {
            restaurants,
            totalPages,
            currentPage: pagination?.page || params?.page || 1,
            total
          }
        }
      };
    } catch (error) {
      console.error('Get restaurants error:', error);
      throw error;
    }
  },

  getRestaurantDetails: async (id) => {
    try {
      const response = await api.get(`/aggregate/restaurants/${id}/full`);
      const data = extractData(response);
      return { data: { data: data || {} } };
    } catch (error) {
      console.error('Get restaurant details error:', error);
      throw error;
    }
  },

  // ✅ إدارة المستخدمين - مُحسنة
  getUsers: async (params) => {
    try {
      const response = await api.get('/complete/admin/users', { params });
      
      const usersData = extractData(response);
      const pagination = extractPagination(response);
      
      let users = [];
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(usersData)) {
        users = usersData;
        total = usersData.length;
      } else if (usersData && typeof usersData === 'object') {
        users = usersData.users || usersData.data || usersData.items || [];
        total = usersData.total || users.length;
        totalPages = usersData.totalPages || pagination?.totalPages || 1;
      }
      
      return {
        data: {
          data: {
            users,
            totalPages,
            total
          }
        }
      };
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  getUserDetails: async (id) => {
    try {
      const response = await api.get(`/complete/admin/users/${id}`);
      const data = extractData(response);
      return { data: { data: data || {} } };
    } catch (error) {
      console.error('Get user details error:', error);
      throw error;
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await api.put(`/complete/admin/users/${id}`, data);
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  deleteUser: async (id, reason) => {
    try {
      const response = await api.delete(`/complete/admin/users/${id}`, { data: { reason } });
      return response;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  // ✅ إدارة الطلبات - مُحسنة
  getOrders: async (params) => {
    try {
      const response = await api.get('/aggregate/orders/admin', { params });
      
      const ordersData = extractData(response);
      const pagination = extractPagination(response);
      
      let orders = [];
      let stats = {};
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(ordersData)) {
        orders = ordersData;
        total = ordersData.length;
      } else if (ordersData && typeof ordersData === 'object') {
        orders = ordersData.orders || ordersData.data || ordersData.items || [];
        stats = ordersData.stats || {};
        total = ordersData.total || orders.length;
        totalPages = ordersData.totalPages || pagination?.totalPages || 1;
      }
      
      return {
        data: {
          data: {
            orders,
            stats,
            totalPages,
            total
          }
        }
      };
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  getOrderDetails: async (id) => {
    try {
      const response = await api.get(`/aggregate/orders/${id}/full`);
      const data = extractData(response);
      return { data: { data: data || {} } };
    } catch (error) {
      console.error('Get order details error:', error);
      throw error;
    }
  },

  reassignDriver: async (orderId, driverId) => {
    try {
      const response = await api.put(`/orders/${orderId}/reassign`, { driverId });
      return response;
    } catch (error) {
      console.error('Reassign driver error:', error);
      throw error;
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const response = await api.put(`/orders/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },

  // ✅ إدارة العناصر - مُحسنة
  getItems: async (params) => {
    try {
      const response = await api.get('/items', { params });
      
      const itemsData = extractData(response);
      const pagination = extractPagination(response);
      
      let items = [];
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(itemsData)) {
        items = itemsData;
        total = itemsData.length;
      } else if (itemsData && typeof itemsData === 'object') {
        items = itemsData.items || itemsData.data || [];
        total = itemsData.total || items.length;
        totalPages = itemsData.totalPages || pagination?.totalPages || 1;
      }
      
      return {
        data: {
          data: {
            items,
            totalPages,
            total
          }
        }
      };
    } catch (error) {
      console.error('Get items error:', error);
      throw error;
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
      return response;
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
      return response;
    } catch (error) {
      console.error('Update item error:', error);
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      const response = await api.delete(`/items/${id}`);
      return response;
    } catch (error) {
      console.error('Delete item error:', error);
      throw error;
    }
  },

  // ✅ إدارة الإشعارات - مُحسنة
  getNotifications: async (params) => {
    try {
      const response = await api.get('/notifications', { params });
      
      const notificationsData = extractData(response);
      const pagination = extractPagination(response);
      
      let items = [];
      let total = 0;
      
      if (Array.isArray(notificationsData)) {
        items = notificationsData;
        total = notificationsData.length;
      } else if (notificationsData && typeof notificationsData === 'object') {
        items = notificationsData.items || notificationsData.data || [];
        total = notificationsData.total || items.length;
      }
      
      return {
        data: {
          data: {
            items,
            total,
            delivered: notificationsData?.delivered || 0,
            openRate: notificationsData?.openRate || 0,
            clients: notificationsData?.clients || [],
            drivers: notificationsData?.drivers || [],
            restaurantOwners: notificationsData?.restaurantOwners || [],
            allUsers: notificationsData?.allUsers || []
          }
        }
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  sendNotification: async (data) => {
    try {
      const response = await api.post('/notifications/send', data);
      return response;
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  },

  getNotificationStats: async (campaignId) => {
    try {
      const response = await api.get(`/notifications/campaign/${campaignId}/stats`);
      return response;
    } catch (error) {
      console.error('Get notification stats error:', error);
      throw error;
    }
  },

  // ✅ إدارة المراجعات - مُحسنة
  getReviews: async (params) => {
    try {
      const response = await api.get('/reviews', { params });
      
      const reviewsData = extractData(response);
      const pagination = extractPagination(response);
      
      let reviews = [];
      let stats = {};
      let totalPages = 1;
      let total = 0;
      
      if (Array.isArray(reviewsData)) {
        reviews = reviewsData;
        total = reviewsData.length;
      } else if (reviewsData && typeof reviewsData === 'object') {
        reviews = reviewsData.reviews || reviewsData.data || reviewsData.items || [];
        stats = reviewsData.stats || {};
        total = reviewsData.total || reviews.length;
        totalPages = reviewsData.totalPages || pagination?.totalPages || 1;
      }
      
      return {
        data: {
          data: {
            reviews,
            stats,
            totalPages,
            total
          }
        }
      };
    } catch (error) {
      console.error('Get reviews error:', error);
      throw error;
    }
  },

  deleteReview: async (id) => {
    try {
      const response = await api.delete(`/reviews/${id}`);
      return response;
    } catch (error) {
      console.error('Delete review error:', error);
      throw error;
    }
  },

  moderateReview: async (id, data) => {
    try {
      const response = await api.put(`/reviews/${id}/moderate`, data);
      return response;
    } catch (error) {
      console.error('Moderate review error:', error);
      throw error;
    }
  },

  // ✅ الدعم الفني - مُحسن
  getSupportConversations: async (params) => {
    try {
      const response = await api.get('/chat/admin/support-conversations', { params });
      
      const conversationsData = extractData(response);
      
      let conversations = [];
      
      if (Array.isArray(conversationsData)) {
        conversations = conversationsData;
      } else if (conversationsData && typeof conversationsData === 'object') {
        conversations = conversationsData.conversations || 
                       conversationsData.data || 
                       conversationsData.items || [];
      }
      
      return { data: { data: conversations } };
    } catch (error) {
      console.error('Failed to fetch support conversations:', error);
      throw error;
    }
  },

  assignSupportConversation: async (id, userId) => {
    try {
      const response = await api.put(`/chat/admin/conversations/${id}/assign`, { assignedTo: userId });
      return response;
    } catch (error) {
      console.error('Assign conversation error:', error);
      throw error;
    }
  },

  // ✅ تتبع المندوبين
  getDriverLocation: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/location`);
      return response;
    } catch (error) {
      console.error('Get driver location error:', error);
      throw error;
    }
  },

  // ✅ إحصائيات الطلبات - مُحسنة
  getOrdersStats: async (params) => {
    try {
      const response = await api.get('/orders/stats', { params });
      
      const statsData = extractData(response);
      
      return {
        data: {
          data: statsData || {
            dailyStats: [],
            statusDistribution: [],
            userGrowth: [],
            topRestaurants: []
          }
        }
      };
    } catch (error) {
      console.log('Orders stats endpoint not available');
      return {
        data: {
          data: {
            dailyStats: [],
            statusDistribution: [],
            userGrowth: [],
            topRestaurants: []
          }
        }
      };
    }
  },

  // ✅ الإعدادات
  updateSettings: async (data) => {
    try {
      const response = await api.put('/admin/settings', data);
      return response;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  },

  clearCache: async () => {
    try {
      const response = await api.post('/aggregate/cache/clear');
      return response;
    } catch (error) {
      console.error('Clear cache error:', error);
      throw error;
    }
  },
};

export default api;