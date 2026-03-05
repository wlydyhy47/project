// src/components/admin/Dashboard.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import DashboardCharts from '../charts/DashboardCharts';
import { useSocket } from '../../contexts/SocketContext';
import {
  FaUsers,
  FaStore,
  FaShoppingBag,
  FaMoneyBillWave,
  FaTruck,
  FaStar,
  FaChartLine,
} from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const { onlineUsers } = useSocket();
  const [timeRange, setTimeRange] = useState('today');

  // ✅ البيانات نظيفة ومباشرة الآن
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: adminAPI.getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: ordersStats } = useQuery({
    queryKey: ['ordersStats', timeRange],
    queryFn: () => adminAPI.getOrdersStats({ period: timeRange }),
  });

  // ✅ stats نفسه هو البيانات - بدون الحاجة لـ data?.data?.data
  const statsCards = [
    {
      title: t('total_users'),
      value: stats?.totalUsers || 0,
      icon: <FaUsers />,
      color: '#3498db',
      change: stats?.userGrowth || 0,
    },
    {
      title: t('total_restaurants'),
      value: stats?.totalRestaurants || 0,
      icon: <FaStore />,
      color: '#27ae60',
      change: stats?.restaurantGrowth || 0,
    },
    {
      title: t('total_orders'),
      value: stats?.totalOrders || 0,
      icon: <FaShoppingBag />,
      color: '#f39c12',
      change: stats?.orderGrowth || 0,
    },
    {
      title: t('total_revenue'),
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: <FaMoneyBillWave />,
      color: '#9b59b6',
      change: stats?.revenueGrowth || 0,
    },
    {
      title: t('active_drivers'),
      value: stats?.activeDrivers || 0,
      icon: <FaTruck />,
      color: '#e74c3c',
      change: null,
    },
    {
      title: t('online_users'),
      value: onlineUsers?.length || 0,
      icon: <FaChartLine />,
      color: '#2c3e50',
      change: null,
    },
  ];

  const recentOrders = stats?.recentOrders || [];
  const topRestaurants = stats?.topRestaurants || [];

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('admin_dashboard')}</h1>
        <div className="time-range-selector">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-control"
          >
            <option value="today">{t('today')}</option>
            <option value="week">{t('this_week')}</option>
            <option value="month">{t('this_month')}</option>
            <option value="year">{t('this_year')}</option>
          </select>
          <button onClick={() => refetch()} className="btn btn-primary">
            {t('refresh')}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statsCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ background: `${card.color}20`, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-details">
              <h3>{card.title}</h3>
              <p className="stat-value">{card.value}</p>
              {card.change !== null && (
                <span className={`stat-change ${card.change >= 0 ? 'positive' : 'negative'}`}>
                  {card.change >= 0 ? '+' : ''}{card.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <DashboardCharts data={ordersStats} />
      </div>

      <div className="dashboard-grid">
        <div className="recent-orders card">
          <h2>{t('recent_orders')}</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('order_id')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('restaurant')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.user?.name}</td>
                    <td>{order.restaurant?.name}</td>
                    <td>{formatCurrency(order.totalPrice)}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {t(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center">
                      {t('no_orders')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="top-restaurants card">
          <h2>{t('top_restaurants')}</h2>
          <div className="restaurants-list">
            {topRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="restaurant-item">
                <img src={restaurant.image || '/default-restaurant.jpg'} alt={restaurant.name} />
                <div className="restaurant-info">
                  <h4>{restaurant.name}</h4>
                  <div className="rating">
                    <FaStar className="star" />
                    <span>{restaurant.rating || '0.0'}</span>
                    <span className="orders-count">
                      ({restaurant.totalOrders || 0} {t('orders')})
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {topRestaurants.length === 0 && (
              <p className="text-center">{t('no_restaurants')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;