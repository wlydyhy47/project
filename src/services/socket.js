import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://backend-walid-yahaya.onrender.com';
    this.isConnected = false;
    this.messageQueue = []; // تخزين الرسائل المؤقتة
  }

  connect() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('❌ No token available for socket connection');
      return null;
    }

    if (this.socket) {
      console.log('⚠️ Socket already exists, disconnecting first...');
      this.disconnect();
    }

    console.log('🔌 Connecting to socket server...');
    
    this.socket = io(this.socketUrl, {
      auth: { 
        token: `Bearer ${token}`
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

    this.setupDefaultListeners();
    return this.socket;
  }

  setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      const userId = this.getUserId();
      if (userId) {
        this.emit('user-online', userId);
      }

      // إرسال الرسائل المعلقة
      this.flushMessageQueue();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      
      if (error.message === 'Invalid token' || error.message.includes('unauthorized')) {
        this.handleTokenError();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // disconnected by server, reconnect manually
        setTimeout(() => this.connect(), 1000);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  async handleTokenError() {
    console.log('🔄 Attempting to refresh token for socket...');
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
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
        
        // تحديث توكن السوكيت
        if (this.socket) {
          this.socket.auth.token = `Bearer ${accessToken}`;
          this.socket.connect();
        }
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('❌ Failed to refresh token for socket:', error);
      localStorage.clear();
      window.location.href = '/login';
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ Socket not connected, queueing event: ${event}`);
      this.messageQueue.push({ event, data, timestamp: Date.now() });
      
      // محاولة إعادة الاتصال
      if (!this.socket) {
        this.connect();
      }
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  flushMessageQueue() {
    if (this.messageQueue.length > 0 && this.isConnected) {
      console.log(`📨 Flushing ${this.messageQueue.length} queued messages`);
      
      this.messageQueue.forEach(({ event, data }) => {
        this.socket.emit(event, data);
      });
      
      this.messageQueue = [];
    }
  }

  getUserId() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).id : null;
  }

  // ✅ أحداث خاصة بالإدارة
  subscribeToOrders() {
    this.emit('subscribe-orders');
  }

  subscribeToDrivers() {
    this.emit('subscribe-drivers');
  }

  subscribeToNotifications() {
    const userId = this.getUserId();
    if (userId) {
      this.emit('subscribe-notifications', userId);
    }
  }

  sendNotification(notification) {
    this.emit('send-notification', notification);
  }

  updateDriverLocation(driverId, location) {
    this.emit('driver-location-update', { driverId, ...location });
  }

  joinChatRoom(conversationId) {
    this.emit('join-conversation', conversationId);
  }

  leaveChatRoom(conversationId) {
    this.emit('leave-conversation', conversationId);
  }

  sendChatMessage(message) {
    this.emit('send-message', message);
  }

  markMessageRead(messageId) {
    this.emit('mark-read', messageId);
  }

  userTyping(conversationId, isTyping) {
    this.emit('typing', { conversationId, isTyping });
  }

  // حالة الاتصال
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    };
  }
}

export default new SocketService();