import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FaCalendarAlt,
  FaDownload,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaUsers,
  FaStore,
  FaShoppingBag,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/helpers';

const Statistics = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('month');
  const [chartType, setChartType] = useState('line');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-statistics', period],
    queryFn: () => adminAPI.getDashboardStats(),
  });

  const { data: ordersStats } = useQuery({
    queryKey: ['orders-statistics', period],
    queryFn: () => adminAPI.getOrdersStats({ period }),
  });

  const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];

  const renderChart = () => {
    const data = ordersStats?.data?.dailyStats || [];

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="orders"
                stroke="#3498db"
                name={t('orders_count')}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#2ecc71"
                name={t('revenue')}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#3498db" name={t('orders_count')} />
              <Bar dataKey="revenue" fill="#2ecc71" name={t('revenue')} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="orders"
                stackId="1"
                stroke="#3498db"
                fill="#3498db"
                name={t('orders_count')}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="2"
                stroke="#2ecc71"
                fill="#2ecc71"
                name={t('revenue')}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="statistics">
      <div className="page-header">
        <h1>{t('statistics_and_analytics')}</h1>
        <div className="header-actions">
          <div className="period-selector">
            <FaCalendarAlt />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="form-control"
            >
              <option value="day">{t('today')}</option>
              <option value="week">{t('this_week')}</option>
              <option value="month">{t('this_month')}</option>
              <option value="year">{t('this_year')}</option>
            </select>
          </div>
          <button className="btn btn-secondary">
            <FaDownload /> {t('export_report')}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3498db20', color: '#3498db' }}>
            <FaUsers />
          </div>
          <div className="stat-details">
            <h3>{t('total_users')}</h3>
            <p className="stat-value">{stats?.data?.totalUsers || 0}</p>
            <span className="stat-change positive">+12%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#2ecc7120', color: '#2ecc71' }}>
            <FaStore />
          </div>
          <div className="stat-details">
            <h3>{t('total_restaurants')}</h3>
            <p className="stat-value">{stats?.data?.totalRestaurants || 0}</p>
            <span className="stat-change positive">+5%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f39c1220', color: '#f39c12' }}>
            <FaShoppingBag />
          </div>
          <div className="stat-details">
            <h3>{t('total_orders')}</h3>
            <p className="stat-value">{stats?.data?.totalOrders || 0}</p>
            <span className="stat-change positive">+8%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e74c3c20', color: '#e74c3c' }}>
            <FaMoneyBillWave />
          </div>
          <div className="stat-details">
            <h3>{t('total_revenue')}</h3>
            <p className="stat-value">{formatCurrency(stats?.data?.totalRevenue || 0)}</p>
            <span className="stat-change positive">+15%</span>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-header">
          <h2>{t('orders_and_revenue')}</h2>
          <div className="chart-type-selector">
            <button
              className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
            >
              <FaChartLine />
            </button>
            <button
              className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
            >
              <FaChartBar />
            </button>
            <button
              className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
              onClick={() => setChartType('area')}
            >
              <FaChartPie />
            </button>
          </div>
        </div>
        <div className="chart-wrapper">
          {renderChart()}
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>{t('orders_by_status')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ordersStats?.data?.statusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${t(entry.name)}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ordersStats?.data?.statusDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('top_restaurants')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={stats?.data?.topRestaurants || []}
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="orders" fill="#3498db" name={t('orders')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('user_growth')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.data?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="clients"
                stackId="1"
                stroke="#3498db"
                fill="#3498db"
                name={t('clients')}
              />
              <Area
                type="monotone"
                dataKey="drivers"
                stackId="1"
                stroke="#2ecc71"
                fill="#2ecc71"
                name={t('drivers')}
              />
              <Area
                type="monotone"
                dataKey="restaurants"
                stackId="1"
                stroke="#f39c12"
                fill="#f39c12"
                name={t('restaurants')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Statistics;