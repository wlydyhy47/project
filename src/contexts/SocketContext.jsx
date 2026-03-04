import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;

  // دالة إنشاء اتصال السوكيت
  const connectSocket = useCallback(() => {
    if (!isAuthenticated || !user) {
      console.log('⏳ User not authenticated, skipping socket connection');
      return null;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('⏳ No token available for socket connection');
      return null;
    }

    console.log('🔌 Attempting to connect socket...');
    
    const newSocket = io('https://backend-walid-yahaya.onrender.com', {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'], // إضافة polling كخيار احتياطي
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      forceNew: true,
    });

    return newSocket;
  }, [isAuthenticated, user]);

  // دالة إعادة الاتصال
  const reconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      toast.error('فقد الاتصال بالخادم، يرجى تحديث الصفحة');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Reconnection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
      setReconnectAttempts(prev => prev + 1);
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const newSocket = connectSocket();
      if (newSocket) {
        setupSocketListeners(newSocket);
        setSocket(newSocket);
        socketRef.current = newSocket;
      }
    }, Math.min(1000 * Math.pow(2, reconnectAttempts), 10000)); // تأخير تصاعدي
  }, [reconnectAttempts, connectSocket]);

  // إعداد مستمعي الأحداث للسوكيت
  const setupSocketListeners = useCallback((socketInstance) => {
    if (!socketInstance) return;

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully:', socketInstance.id);
      setIsConnected(true);
      setReconnectAttempts(0);
      
      if (user?.id) {
        socketInstance.emit('user-online', user.id);
      }
      
      toast.success('تم الاتصال بالخادم', { duration: 2000 });
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', socketInstance.id, 'reason:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // محاولة إعادة الاتصال
        reconnect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      
      // إذا كان خطأ المصادقة، حاول تجديد التوكن
      if (error.message.includes('Invalid token') || error.message.includes('unauthorized')) {
        handleTokenError();
      } else {
        reconnect();
      }
    });

    socketInstance.on('notification', (notification) => {
      console.log('📬 New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      
      // عرض إشعار للمستخدم حسب الأولوية
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        toast.success(notification.title || notification.message, {
          duration: 5000,
          icon: '🔔',
        });
      }
    });

    socketInstance.on('order-update', (order) => {
      console.log('📦 Order update:', order);
      toast.success(`تحديث الطلب #${order.id}: ${order.status}`, {
        duration: 4000,
      });
    });

    socketInstance.on('driver-location', (data) => {
      // تحديث موقع المندوب على الخريطة
      window.dispatchEvent(new CustomEvent('driver-location-update', { 
        detail: data 
      }));
    });

    socketInstance.on('users-online', (users) => {
      console.log('👥 Online users:', users.length);
      setOnlineUsers(users);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setReconnectAttempts(0);
      
      if (user?.id) {
        socketInstance.emit('user-online', user.id);
      }
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      toast.error('فشل الاتصال بالخادم، يرجى تحديث الصفحة');
    });
  }, [user?.id, reconnect]);

  // معالجة أخطاء التوكن
  const handleTokenError = useCallback(async () => {
    try {
      console.log('🔄 Attempting to refresh token...');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch('https://backend-walid-yahaya.onrender.com/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = data.data || data;
        
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // إعادة الاتصال بالتوكن الجديد
        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        const newSocket = connectSocket();
        if (newSocket) {
          setupSocketListeners(newSocket);
          setSocket(newSocket);
          socketRef.current = newSocket;
        }
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // تسجيل الخروج إذا فشل تجديد التوكن
      localStorage.clear();
      window.location.href = '/login';
      toast.error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
    }
  }, [connectSocket, setupSocketListeners]);

  // تأثير لإنشاء الاتصال عند المصادقة
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔌 Creating socket connection...');
      
      // تنظيف الاتصال القديم إن وجد
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
      }

      const newSocket = connectSocket();
      if (newSocket) {
        setupSocketListeners(newSocket);
        setSocket(newSocket);
        socketRef.current = newSocket;
      }
    }

    // تنظيف عند إلغاء التثبيت
    return () => {
      console.log('🧹 Cleaning up socket connection...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [isAuthenticated, user, connectSocket, setupSocketListeners]);

  // دوال التفاعل مع السوكيت
  const sendMessage = useCallback((conversationId, message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-message', {
        conversationId,
        message,
        sender: user?.id,
        timestamp: new Date(),
      });
    } else {
      console.warn('⚠️ Socket not connected, message not sent');
      toast.error('غير متصل بالخادم، سيتم إرسال الرسالة لاحقاً');
      // يمكن تخزين الرسالة لإرسالها لاحقاً
    }
  }, [user?.id, isConnected]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-conversation', conversationId);
    }
  }, [isConnected]);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-conversation', conversationId);
    }
  }, [isConnected]);

  const value = {
    socket: socketRef.current,
    onlineUsers,
    notifications,
    isConnected,
    reconnectAttempts,
    sendMessage,
    joinConversation,
    leaveConversation,
    setNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};