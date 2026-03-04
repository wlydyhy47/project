import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const DashboardCharts = ({ data }) => {
  const { t } = useTranslation();

  const ordersChartData = {
    labels: data?.dailyOrders?.map(item => item.date) || [],
    datasets: [
      {
        label: t('orders'),
        data: data?.dailyOrders?.map(item => item.count) || [],
        backgroundColor: 'rgba(52, 152, 219, 0.5)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1,
      },
    ],
  };

  const revenueChartData = {
    labels: data?.dailyRevenue?.map(item => item.date) || [],
    datasets: [
      {
        label: t('revenue'),
        data: data?.dailyRevenue?.map(item => item.amount) || [],
        backgroundColor: 'rgba(46, 204, 113, 0.5)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1,
      },
    ],
  };

  const statusChartData = {
    labels: data?.orderStatus?.map(item => t(item.status)) || [],
    datasets: [
      {
        data: data?.orderStatus?.map(item => item.count) || [],
        backgroundColor: [
          'rgba(243, 156, 18, 0.8)',
          'rgba(52, 152, 219, 0.8)',
          'rgba(155, 89, 182, 0.8)',
          'rgba(46, 204, 113, 0.8)',
          'rgba(231, 76, 60, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        rtl: true,
        labels: {
          font: {
            family: 'Cairo',
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        rtl: true,
        labels: {
          font: {
            family: 'Cairo',
          },
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="dashboard-charts-grid">
      <div className="chart-card">
        <div className="chart-header">
          <h3>{t('daily_orders')}</h3>
        </div>
        <div className="chart-wrapper">
          <Bar data={ordersChartData} options={chartOptions} />
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3>{t('daily_revenue')}</h3>
        </div>
        <div className="chart-wrapper">
          <Line data={revenueChartData} options={chartOptions} />
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3>{t('orders_status')}</h3>
        </div>
        <div className="chart-wrapper doughnut-wrapper">
          <Doughnut data={statusChartData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;