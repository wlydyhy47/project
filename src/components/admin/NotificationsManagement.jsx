import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import {
  FaBell,
  FaUsers,
  FaStore,
  FaTruck,
  FaStar,
  FaFilter,
  FaPaperPlane,
  FaHistory,
  FaChartBar,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const NotificationsManagement = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [showSendModal, setShowSendModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    targetUsers: 'all',
    specificUsers: [],
    link: '',
    icon: '',
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => adminAPI.getNotifications({ limit: 50 }),
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (data) => adminAPI.sendNotification(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['notifications']);
      toast.success(t('notification_sent_success'));
      setShowSendModal(false);
      
      // إرسال إشعار فوري عبر Socket
      if (socket) {
        socket.emit('send-notification', response.data);
      }
    },
  });

  const handleSendNotification = () => {
    let userIds = [];
    
    switch (notificationForm.targetUsers) {
      case 'all':
        // سيتم إرساله لجميع المستخدمين
        break;
      case 'clients':
        userIds = notifications?.data?.clients?.map(u => u.id) || [];
        break;
      case 'drivers':
        userIds = notifications?.data?.drivers?.map(u => u.id) || [];
        break;
      case 'restaurant_owners':
        userIds = notifications?.data?.restaurantOwners?.map(u => u.id) || [];
        break;
      case 'specific':
        userIds = notificationForm.specificUsers;
        break;
    }

    sendNotificationMutation.mutate({
      ...notificationForm,
      userIds,
    });
  };

  const notificationTypes = [
    { value: 'general', label: t('general'), icon: <FaBell /> },
    { value: 'order', label: t('order'), icon: <FaStore /> },
    { value: 'promotion', label: t('promotion'), icon: <FaStar /> },
    { value: 'system', label: t('system'), icon: <FaHistory /> },
  ];

  return (
    <div className="notifications-management">
      <div className="page-header">
        <h1>{t('notifications_management')}</h1>
        <button
          onClick={() => setShowSendModal(true)}
          className="btn btn-primary"
        >
          <FaPaperPlane /> {t('send_notification')}
        </button>
      </div>

      <div className="notifications-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaBell />
          </div>
          <div className="stat-details">
            <h3>{t('total_sent')}</h3>
            <p>{notifications?.data?.total || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-details">
            <h3>{t('delivered')}</h3>
            <p>{notifications?.data?.delivered || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaChartBar />
          </div>
          <div className="stat-details">
            <h3>{t('open_rate')}</h3>
            <p>{notifications?.data?.openRate || 0}%</p>
          </div>
        </div>
      </div>

      <div className="notifications-list">
        <h2>{t('recent_notifications')}</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('title')}</th>
                <th>{t('content')}</th>
                <th>{t('type')}</th>
                <th>{t('priority')}</th>
                <th>{t('target')}</th>
                <th>{t('sent_at')}</th>
                <th>{t('stats')}</th>
              </tr>
            </thead>
            <tbody>
              {notifications?.data?.items?.map((notification) => (
                <tr key={notification.id}>
                  <td>{notification.title}</td>
                  <td className="content-cell">{notification.content}</td>
                  <td>
                    <span className={`type-badge type-${notification.type}`}>
                      {t(notification.type)}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${notification.priority}`}>
                      {t(notification.priority)}
                    </span>
                  </td>
                  <td>{notification.targetCount || t('all_users')}</td>
                  <td>{new Date(notification.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="notification-stats">
                      <span title={t('delivered')}>
                        📨 {notification.deliveredCount || 0}
                      </span>
                      <span title={t('read')}>
                        👁️ {notification.readCount || 0}
                      </span>
                      <span title={t('clicked')}>
                        🖱️ {notification.clickedCount || 0}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <Modal
          title={t('send_new_notification')}
          onClose={() => setShowSendModal(false)}
          size="large"
        >
          <div className="notification-form">
            <div className="form-group">
              <label>{t('notification_title')}</label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({
                  ...notificationForm,
                  title: e.target.value
                })}
                className="form-control"
                placeholder={t('enter_title')}
              />
            </div>

            <div className="form-group">
              <label>{t('notification_content')}</label>
              <textarea
                value={notificationForm.content}
                onChange={(e) => setNotificationForm({
                  ...notificationForm,
                  content: e.target.value
                })}
                className="form-control"
                rows="4"
                placeholder={t('enter_content')}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('notification_type')}</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({
                    ...notificationForm,
                    type: e.target.value
                  })}
                  className="form-control"
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('priority')}</label>
                <select
                  value={notificationForm.priority}
                  onChange={(e) => setNotificationForm({
                    ...notificationForm,
                    priority: e.target.value
                  })}
                  className="form-control"
                >
                  <option value="low">{t('low')}</option>
                  <option value="medium">{t('medium')}</option>
                  <option value="high">{t('high')}</option>
                  <option value="urgent">{t('urgent')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>{t('target_users')}</label>
              <select
                value={notificationForm.targetUsers}
                onChange={(e) => setNotificationForm({
                  ...notificationForm,
                  targetUsers: e.target.value
                })}
                className="form-control"
              >
                <option value="all">{t('all_users')}</option>
                <option value="clients">{t('clients_only')}</option>
                <option value="drivers">{t('drivers_only')}</option>
                <option value="restaurant_owners">{t('restaurant_owners_only')}</option>
                <option value="specific">{t('specific_users')}</option>
              </select>
            </div>

            {notificationForm.targetUsers === 'specific' && (
              <div className="form-group">
                <label>{t('select_users')}</label>
                <select
                  multiple
                  value={notificationForm.specificUsers}
                  onChange={(e) => setNotificationForm({
                    ...notificationForm,
                    specificUsers: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="form-control"
                  size="5"
                >
                  {notifications?.data?.allUsers?.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {t(user.role)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>{t('link')} ({t('optional')})</label>
              <input
                type="text"
                value={notificationForm.link}
                onChange={(e) => setNotificationForm({
                  ...notificationForm,
                  link: e.target.value
                })}
                className="form-control"
                placeholder="https://..."
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={handleSendNotification}
                className="btn btn-primary"
                disabled={!notificationForm.title || !notificationForm.content}
              >
                <FaPaperPlane /> {t('send')}
              </button>
              <button
                onClick={() => setShowSendModal(false)}
                className="btn btn-secondary"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NotificationsManagement;