import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaUsers,
  FaStore,
  FaShoppingBag,
  FaHamburger,
  FaBell,
  FaStar,
  FaHeadset,
  FaMapMarkedAlt,
  FaChartBar,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ user, collapsed, toggleSidebar }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  const menuItems = [
    {
      title: t('dashboard'),
      icon: <FaTachometerAlt />,
      path: '/admin/dashboard',
      roles: ['admin'],
    },
    {
      title: t('users_management'),
      icon: <FaUsers />,
      path: '/admin/users',
      roles: ['admin'],
    },
    {
      title: t('restaurants_management'),
      icon: <FaStore />,
      path: '/admin/restaurants',
      roles: ['admin'],
    },
    {
      title: t('orders_management'),
      icon: <FaShoppingBag />,
      path: '/admin/orders',
      roles: ['admin'],
    },
    {
      title: t('menu_items'),
      icon: <FaHamburger />,
      path: '/admin/items',
      roles: ['admin'],
    },
    {
      title: t('notifications'),
      icon: <FaBell />,
      path: '/admin/notifications',
      roles: ['admin'],
    },
    {
      title: t('reviews'),
      icon: <FaStar />,
      path: '/admin/reviews',
      roles: ['admin'],
    },
    {
      title: t('support_chat'),
      icon: <FaHeadset />,
      path: '/admin/support',
      roles: ['admin'],
    },
    {
      title: t('driver_tracking'),
      icon: <FaMapMarkedAlt />,
      path: '/admin/tracking',
      roles: ['admin'],
    },
    {
      title: t('statistics'),
      icon: <FaChartBar />,
      path: '/admin/statistics',
      roles: ['admin'],
    },
    {
      title: t('settings'),
      icon: <FaCog />,
      path: '/admin/settings',
      roles: ['admin'],
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img src="/logo.png" alt="Logo" className="logo" />
        {!collapsed && <h3>Delivery Admin</h3>}
        <button className="collapse-btn" onClick={toggleSidebar}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      <div className="sidebar-user">
        <img 
          src={user?.image || '/default-avatar.png'} 
          alt={user?.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-avatar.png';
          }}
        />
        {!collapsed && (
          <div>
            <h4>{user?.name || 'Admin User'}</h4>
            <span className={`role-badge role-${user?.role || 'admin'}`}>
              {t(user?.role || 'admin')}
            </span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-title">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <button onClick={logout} className="nav-item logout-btn">
            <span className="nav-icon"><FaSignOutAlt /></span>
            <span className="nav-title">{t('logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;