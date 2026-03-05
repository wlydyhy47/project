// src/contexts/SocketContext.jsx (نسخة محسنة بالكامل)
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
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const listenersRef = useRef(new Map()); // ✅ تخزين المستمعين لإزالتهم بسهولة
  const maxReconnectAttempts = 5;

  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://backend-walid-yahaya.onrender.com';

  // ✅ دالة لإزالة جميع المستمعين
  const removeAllListeners = useCallback(() => {
    if (socketRef.current) {
      listenersRef.current.forEach((_, eventName) => {
        socketRef.current.off(eventName);
      });
      listenersRef.current.clear();
    }
  }, []);

  // ✅ دالة لإضافة مستمع مع تتبعه
  const addSocketListener = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      listenersRef.current.set(event, handler);
    }
  }, []);

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

    console.log('🔌 Attempting to connect socket to:', SOCKET_URL);
    
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      forceNew: true,
    });

    return newSocket;
  }, [isAuthenticated, user, SOCKET_URL]);

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
        removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const newSocket = connectSocket();
      if (newSocket) {
        setupSocketListeners(newSocket);
        socketRef.current = newSocket;
      }
    }, Math.min(1000 * Math.pow(2, reconnectAttempts), 10000));
  }, [reconnectAttempts, connectSocket, removeAllListeners]);

  // معالجة أخطاء التوكن
  const handleTokenError = useCallback(async () => {
    try {
      console.log('🔄 Attempting to refresh token...');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const API_URL = SOCKET_URL.replace(/\/socket$/, '');
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
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

        if (socketRef.current) {
          removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        const newSocket = connectSocket();
        if (newSocket) {
          setupSocketListeners(newSocket);
          socketRef.current = newSocket;
        }
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      localStorage.clear();
      window.location.href = '/login';
      toast.error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
    }
  }, [connectSocket, SOCKET_URL, removeAllListeners]);

  // ✅ إعداد مستمعي الأحداث - نسخة محسنة
  const setupSocketListeners = useCallback((socketInstance) => {
    if (!socketInstance) return;

    // إزالة أي مستمعين سابقين
    removeAllListeners();

    // إضافة المستمعين الجدد مع التتبع
    addSocketListener('connect', () => {
      console.log('✅ Socket connected successfully:', socketInstance.id);
      setIsConnected(true);
      setReconnectAttempts(0);
      
      if (user?.id) {
        socketInstance.emit('user-online', user.id);
      }
      
      toast.success('تم الاتصال بالخادم', { duration: 2000 });
    });

    addSocketListener('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', socketInstance.id, 'reason:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        reconnect();
      }
    });

    addSocketListener('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      
      if (error.message.includes('Invalid token') || error.message.includes('unauthorized')) {
        handleTokenError();
      } else {
        reconnect();
      }
    });

    addSocketListener('notification', (notification) => {
      console.log('📬 New notification:', notification);
      setNotifications((prev) => {
        // ✅ منع التكرار
        const exists = prev.some(n => n.id === notification.id);
        if (exists) return prev;
        return [notification, ...prev].slice(0, 50); // حفظ آخر 50 إشعار فقط
      });
      
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        toast.success(notification.title || notification.message, {
          duration: 5000,
          icon: '🔔',
        });
      }
    });

    addSocketListener('order-update', (order) => {
      console.log('📦 Order update:', order);
      toast.success(`تحديث الطلب #${order.id}: ${order.status}`, {
        duration: 4000,
      });
    });

    addSocketListener('driver-location', (data) => {
      window.dispatchEvent(new CustomEvent('driver-location-update', { 
        detail: data 
      }));
    });

    addSocketListener('users-online', (users) => {
      console.log('👥 Online users:', users.length);
      setOnlineUsers(users);
    });

    addSocketListener('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setReconnectAttempts(0);
      
      if (user?.id) {
        socketInstance.emit('user-online', user.id);
      }
    });

    addSocketListener('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    addSocketListener('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    addSocketListener('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      toast.error('فشل الاتصال بالخادم، يرجى تحديث الصفحة');
    });

  }, [user?.id, reconnect, handleTokenError, addSocketListener, removeAllListeners]);

  // تأثير لإنشاء الاتصال عند المصادقة
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔌 Creating socket connection...');
      
      if (socketRef.current) {
        removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const newSocket = connectSocket();
      if (newSocket) {
        setupSocketListeners(newSocket);
        socketRef.current = newSocket;
      }
    }

    return () => {
      console.log('🧹 Cleaning up socket connection...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (socketRef.current) {
        removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // ✅ تنظيف الحالة
      setIsConnected(false);
      setOnlineUsers([]);
      setNotifications([]);
      setReconnectAttempts(0);
      listenersRef.current.clear();
    };
  }, [isAuthenticated, user, connectSocket, setupSocketListeners, removeAllListeners]);

  // دوال التفاعل مع السوكيت
  const sendMessage = useCallback((conversationId, message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-message', {
        conversationId,
        message,
        sender: user?.id,
        timestamp: new Date(),
      });
      return true;
    } else {
      console.warn('⚠️ Socket not connected, message not sent');
      toast.error('غير متصل بالخادم، سيتم إرسال الرسالة لاحقاً');
      return false;
    }
  }, [user?.id, isConnected]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-conversation', conversationId);
      return true;
    }
    return false;
  }, [isConnected]);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-conversation', conversationId);
      return true;
    }
    return false;
  }, [isConnected]);

  // ✅ دالة لإرسال حدث مخصص
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
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
    emit, // ✅ إضافة دالة emit
    setNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};