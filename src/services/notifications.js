class NotificationService {
  constructor() {
    this.permission = null;
    this.swRegistration = null;
  }

  async init() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
        return this.swRegistration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }

  async subscribeToPush() {
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY
        ),
      });

      // إرسال الاشتراك إلى الخادم
      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/notifications/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          subscription,
          platform: 'web',
          deviceId: this.getDeviceId(),
        }),
      });
      return response.json();
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  showNotification(title, options = {}) {
    if (this.permission === 'granted') {
      if (this.swRegistration) {
        this.swRegistration.showNotification(title, {
          icon: '/logo192.png',
          badge: '/badge.png',
          vibrate: [200, 100, 200],
          ...options,
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  // تحويل مفتاح VAPID من Base64 إلى Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'web_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  // أنواع الإشعارات المختلفة
  notifyNewOrder(order) {
    this.showNotification('طلب جديد', {
      body: `تم استلام طلب جديد #${order.id} من ${order.user.name}`,
      tag: `order-${order.id}`,
      data: { url: `/admin/orders/${order.id}` },
    });
  }

  notifyDriverAssigned(order, driver) {
    this.showNotification('تم تعيين مندوب', {
      body: `تم تعيين ${driver.name} للطلب #${order.id}`,
      tag: `driver-${order.id}`,
      data: { url: `/admin/orders/${order.id}` },
    });
  }

  notifyOrderDelivered(order) {
    this.showNotification('تم التوصيل', {
      body: `تم توصيل الطلب #${order.id} بنجاح`,
      tag: `delivered-${order.id}`,
      data: { url: `/admin/orders/${order.id}` },
    });
  }

  notifyNewMessage(message, sender) {
    this.showNotification('رسالة جديدة', {
      body: `${sender.name}: ${message.content}`,
      tag: `message-${message.id}`,
      data: { url: `/admin/support/${message.conversationId}` },
    });
  }

  notifySystemAlert(alert) {
    this.showNotification('تنبيه النظام', {
      body: alert.message,
      tag: `alert-${alert.id}`,
      icon: '/warning.png',
      data: { url: alert.url },
    });
  }
}

export default new NotificationService();