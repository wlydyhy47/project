import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaEnvelope,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaGlobe,
  FaBars,
  FaSearch,
  FaChevronDown,
  FaUserCircle,
  FaHistory,
  FaWifi,
  FaExclamationCircle,
  FaShoppingBag,
  FaStore,
  FaLock,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const Header = ({ toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { onlineUsers, notifications, isConnected } = useSocket();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Refs للقوائم المنسدلة
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const languageRef = useRef(null);

  // تحديث الوقت كل دقيقة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // عدد الإشعارات غير المقروءة
  const unreadNotifications = notifications?.filter(n => !n.read)?.length || 0;

  // تبديل اللغة
  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', lang);
    setShowLanguageMenu(false);
    
    // إعادة تحميل الصفحة لتطبيق التغييرات على المكونات الخارجية
    if (lang !== i18n.language) {
      window.location.reload();
    }
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // البحث
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowProfileMenu(false);
    }
  };

  // تنسيق التاريخ والوقت حسب اللغة
  const formattedDate = currentDateTime.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // حساب الوقت المنقضي
  const timeAgo = (date) => {
    if (!date) return '';
    
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return i18n.language === 'ar' ? 'الآن' : 'now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return i18n.language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes} minutes ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return i18n.language === 'ar' ? `منذ ${hours} ساعة` : `${hours} hours ago`;
    }
    
    const days = Math.floor(hours / 24);
    return i18n.language === 'ar' ? `منذ ${days} يوم` : `${days} days ago`;
  };

  // أيقونة الإشعار حسب النوع
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'order': return <FaShoppingBag />;
      case 'restaurant': return <FaStore />;
      case 'user': return <FaUser />;
      case 'system': return <FaLock />;
      default: return <FaBell />;
    }
  };

  // لون الإشعار حسب النوع
  const getNotificationColor = (type) => {
    switch(type) {
      case 'order': return 'rgba(52, 152, 219, 0.1)';
      case 'restaurant': return 'rgba(46, 204, 113, 0.1)';
      case 'user': return 'rgba(155, 89, 182, 0.1)';
      case 'system': return 'rgba(241, 196, 15, 0.1)';
      default: return 'rgba(52, 152, 219, 0.1)';
    }
  };

  // عرض الإشعارات
  const renderNotifications = () => {
    if (!notifications || notifications.length === 0) {
      return (
        <div className="empty-state">
          <FaBell className="icon" />
          <p>{t('no_notifications')}</p>
        </div>
      );
    }

    return notifications.slice(0, 5).map((notification, index) => (
      <div 
        key={notification.id || index} 
        className={`notification-item ${!notification.read ? 'unread' : ''}`}
        onClick={() => {
          if (notification.link) {
            navigate(notification.link);
          }
          setShowNotifications(false);
        }}
      >
        <div className="notification-icon" style={{ background: getNotificationColor(notification.type) }}>
          {getNotificationIcon(notification.type)}
        </div>
        <div className="notification-content">
          <p className="notification-title">{notification.title || t('notification')}</p>
          <p className="notification-message">{notification.message || notification.content}</p>
          <span className="notification-time">
            {timeAgo(notification.createdAt)}
          </span>
        </div>
      </div>
    ));
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
          <FaBars />
        </button>
        
        <div className="header-greeting">
          <h2>
            {t('welcome_back')}, <span>{user?.name?.split(' ')[0] || 'Admin'}</span>
          </h2>
          <span className="header-date">
            {formattedDate} | {formattedTime}
          </span>
        </div>
      </div>

      <div className="header-right">
        {/* Search Bar - سطح المكتب فقط */}
        <form className="header-search" onSubmit={handleSearch}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            aria-label="Search"
          />
        </form>

        {/* Online Users Indicator */}
        <div className="online-indicator" title={t('online_users')}>
          <span className="online-dot"></span>
          <span className="online-count">{onlineUsers?.length || 0}</span>
          <span className="online-label">{t('online')}</span>
        </div>

        {/* Socket Connection Status - استخدام FaExclamationCircle بدلاً من FaWifiSlash */}
        <div 
          className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
          title={isConnected ? t('connected') : t('disconnected')}
        >
          {isConnected ? <FaWifi /> : <FaExclamationCircle />}
        </div>

        {/* Language Selector */}
        <div className="dropdown" ref={languageRef}>
          <button
            className="dropdown-toggle"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            aria-label="Change language"
            aria-expanded={showLanguageMenu}
          >
            <FaGlobe />
            <span className="dropdown-label">
              {i18n.language === 'ar' ? 'العربية' : 'English'}
            </span>
            <FaChevronDown className="dropdown-arrow" />
          </button>
          
          {showLanguageMenu && (
            <div className="dropdown-menu">
              <button
                className={`dropdown-item ${i18n.language === 'ar' ? 'active' : ''}`}
                onClick={() => toggleLanguage('ar')}
              >
                <span className="flag">🇸🇦</span>
                العربية
              </button>
              <button
                className={`dropdown-item ${i18n.language === 'en' ? 'active' : ''}`}
                onClick={() => toggleLanguage('en')}
              >
                <span className="flag">🇺🇸</span>
                English
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="dropdown" ref={notificationRef}>
          <button
            className="dropdown-toggle notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <FaBell />
            {unreadNotifications > 0 && (
              <span className="badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="dropdown-menu notifications-menu">
              <div className="dropdown-header">
                <h4>{t('notifications')}</h4>
                <Link to="/admin/notifications" onClick={() => setShowNotifications(false)}>
                  {t('view_all')}
                </Link>
              </div>
              
              <div className="notifications-list">
                {renderNotifications()}
              </div>
              
              {notifications && notifications.length > 5 && (
                <div className="dropdown-footer">
                  <Link to="/admin/notifications" onClick={() => setShowNotifications(false)}>
                    {t('view_all_notifications')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="dropdown">
          <button 
            className="dropdown-toggle message-btn"
            onClick={() => navigate('/admin/support')}
            aria-label="Messages"
          >
            <FaEnvelope />
            {unreadMessages > 0 && (
              <span className="badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="dropdown" ref={profileRef}>
          <button
            className="dropdown-toggle user-menu"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="User menu"
            aria-expanded={showProfileMenu}
          >
            <div className="user-avatar-wrapper">
              <img
                src={user?.image || '/default-avatar.png'}
                alt={user?.name || 'User avatar'}
                className="user-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
              <span className={`user-status ${isConnected ? 'online' : 'offline'}`}></span>
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Admin User'}</span>
              <span className="user-role">{t(user?.role || 'admin')}</span>
            </div>
            <FaChevronDown className="dropdown-arrow" />
          </button>
          
          {showProfileMenu && (
            <div className="dropdown-menu profile-menu">
              <div className="user-info-header">
                <img
                  src={user?.image || '/default-avatar.png'}
                  alt={user?.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div>
                  <h4>{user?.name || 'Admin User'}</h4>
                  <p>{user?.email || 'admin@delivery.com'}</p>
                  <span className={`role-badge role-${user?.role || 'admin'}`}>
                    {t(user?.role || 'admin')}
                  </span>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <Link to="/admin/profile" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                <FaUserCircle />
                <span>{t('profile')}</span>
              </Link>
              
              <Link to="/admin/settings" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                <FaCog />
                <span>{t('settings')}</span>
              </Link>
              
              <Link to="/admin/activity" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                <FaHistory />
                <span>{t('activity_log')}</span>
              </Link>
              
              <div className="dropdown-divider"></div>
              
              <button onClick={handleLogout} className="dropdown-item text-danger">
                <FaSignOutAlt />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar للجوال - يظهر فقط في الشاشات الصغيرة */}
      <form className="mobile-search" onSubmit={handleSearch}>
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-control"
          aria-label="Search"
        />
      </form>
    </header>
  );
};

export default Header;