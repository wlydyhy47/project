import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import {
  FaShoppingBag,
  FaTruck,
  FaUser,
  FaStore,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaFilter,
  FaSearch,
  FaDownload,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const OrdersManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    restaurant: '',
    driver: '',
    minDate: '',
    maxDate: '',
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, filters],
    queryFn: () => adminAPI.getOrders({
      page,
      limit: 10,
      search,
      filter: filters,
    }),
  });

  const { data: drivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: () => adminAPI.getUsers({ filter: { role: 'driver', isActive: true } }),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success(t('order_status_updated'));
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ orderId, driverId }) => adminAPI.reassignDriver(orderId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success(t('driver_assigned_success'));
      setShowAssignDriverModal(false);
    },
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      accepted: 'info',
      picked: 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return colors[status] || 'secondary';
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleAssignDriver = (order) => {
    setSelectedOrder(order);
    setShowAssignDriverModal(true);
  };

  return (
    <div className="orders-management">
      <div className="page-header">
        <h1>{t('orders_management')}</h1>
        <button className="btn btn-secondary">
          <FaDownload /> {t('export_orders')}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('search_orders')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="form-control"
          >
            <option value="">{t('all_status')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="accepted">{t('accepted')}</option>
            <option value="picked">{t('picked')}</option>
            <option value="delivered">{t('delivered')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>

          <input
            type="date"
            value={filters.minDate}
            onChange={(e) => setFilters({ ...filters, minDate: e.target.value })}
            className="form-control"
            placeholder={t('from_date')}
          />

          <input
            type="date"
            value={filters.maxDate}
            onChange={(e) => setFilters({ ...filters, maxDate: e.target.value })}
            className="form-control"
            placeholder={t('to_date')}
          />
        </div>
      </div>

      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaShoppingBag />
          </div>
          <div className="stat-details">
            <h3>{t('pending_orders')}</h3>
            <p>{data?.data?.stats?.pending || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accepted">
            <FaCheckCircle />
          </div>
          <div className="stat-details">
            <h3>{t('accepted_orders')}</h3>
            <p>{data?.data?.stats?.accepted || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon delivered">
            <FaTruck />
          </div>
          <div className="stat-details">
            <h3>{t('delivered_orders')}</h3>
            <p>{data?.data?.stats?.delivered || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cancelled">
            <FaTimesCircle />
          </div>
          <div className="stat-details">
            <h3>{t('cancelled_orders')}</h3>
            <p>{data?.data?.stats?.cancelled || 0}</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('order_id')}</th>
              <th>{t('customer')}</th>
              <th>{t('restaurant')}</th>
              <th>{t('driver')}</th>
              <th>{t('amount')}</th>
              <th>{t('status')}</th>
              <th>{t('date')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.orders?.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>
                  <div className="user-cell">
                    <img src={order.user?.image || '/default-avatar.png'} alt="" />
                    <span>{order.user?.name}</span>
                  </div>
                </td>
                <td>{order.restaurant?.name}</td>
                <td>
                  {order.driver ? (
                    <div className="user-cell">
                      <img src={order.driver?.image || '/default-avatar.png'} alt="" />
                      <span>{order.driver?.name}</span>
                    </div>
                  ) : (
                    <span className="not-assigned">{t('not_assigned')}</span>
                  )}
                </td>
                <td>${order.totalPrice}</td>
                <td>
                  <span className={`badge badge-${getStatusColor(order.status)}`}>
                    {t(order.status)}
                  </span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="btn-icon info"
                      title={t('view_details')}
                    >
                      <FaEye />
                    </button>
                    {(!order.driver || order.status === 'pending') && (
                      <button
                        onClick={() => handleAssignDriver(order)}
                        className="btn-icon success"
                        title={t('assign_driver')}
                      >
                        <FaTruck />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onStatusChange={(status) => 
            updateOrderStatusMutation.mutate({ id: selectedOrder.id, status })
          }
        />
      )}

      {/* Assign Driver Modal */}
      {showAssignDriverModal && selectedOrder && (
        <Modal
          title={t('assign_driver')}
          onClose={() => setShowAssignDriverModal(false)}
        >
          <div className="assign-driver-form">
            <h3>{t('order')} #{selectedOrder.id}</h3>
            <div className="form-group">
              <label>{t('select_driver')}</label>
              <select
                id="driverSelect"
                className="form-control"
                onChange={(e) => {
                  assignDriverMutation.mutate({
                    orderId: selectedOrder.id,
                    driverId: e.target.value,
                  });
                }}
              >
                <option value="">{t('choose_driver')}</option>
                {drivers?.data?.users?.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn btn-secondary"
        >
          {t('previous')}
        </button>
        <span className="page-info">
          {t('page')} {page} {t('of')} {data?.data?.totalPages || 1}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === data?.data?.totalPages}
          className="btn btn-secondary"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onStatusChange }) => {
  const { t } = useTranslation();

  return (
    <Modal title={t('order_details')} onClose={onClose} size="large">
      <div className="order-details">
        <div className="order-header">
          <h2>{t('order')} #{order.id}</h2>
          <span className={`badge badge-${order.status}`}>
            {t(order.status)}
          </span>
        </div>

        <div className="order-timeline">
          <h3>{t('order_timeline')}</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-icon">
                <FaShoppingBag />
              </div>
              <div className="timeline-content">
                <h4>{t('order_placed')}</h4>
                <p>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {order.acceptedAt && (
              <div className="timeline-item">
                <div className="timeline-icon">
                  <FaCheckCircle />
                </div>
                <div className="timeline-content">
                  <h4>{t('order_accepted')}</h4>
                  <p>{new Date(order.acceptedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
            {order.pickedAt && (
              <div className="timeline-item">
                <div className="timeline-icon">
                  <FaTruck />
                </div>
                <div className="timeline-content">
                  <h4>{t('order_picked')}</h4>
                  <p>{new Date(order.pickedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
            {order.deliveredAt && (
              <div className="timeline-item">
                <div className="timeline-icon">
                  <FaCheckCircle />
                </div>
                <div className="timeline-content">
                  <h4>{t('order_delivered')}</h4>
                  <p>{new Date(order.deliveredAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="order-sections">
          <div className="order-section">
            <h3>
              <FaUser /> {t('customer_info')}
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">{t('name')}:</span>
                <span className="value">{order.user?.name}</span>
              </div>
              <div className="info-item">
                <span className="label">{t('phone')}:</span>
                <span className="value">{order.user?.phone}</span>
              </div>
              <div className="info-item">
                <span className="label">{t('email')}:</span>
                <span className="value">{order.user?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="order-section">
            <h3>
              <FaStore /> {t('restaurant_info')}
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">{t('name')}:</span>
                <span className="value">{order.restaurant?.name}</span>
              </div>
              <div className="info-item">
                <span className="label">{t('phone')}:</span>
                <span className="value">{order.restaurant?.phone}</span>
              </div>
              <div className="info-item">
                <span className="label">{t('address')}:</span>
                <span className="value">{order.restaurant?.address?.addressLine}</span>
              </div>
            </div>
          </div>

          {order.driver && (
            <div className="order-section">
              <h3>
                <FaTruck /> {t('driver_info')}
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('name')}:</span>
                  <span className="value">{order.driver.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('phone')}:</span>
                  <span className="value">{order.driver.phone}</span>
                </div>
              </div>
            </div>
          )}

          <div className="order-section">
            <h3>
              <FaMapMarkerAlt /> {t('delivery_address')}
            </h3>
            <div className="info-grid">
              <div className="info-item full-width">
                <span className="label">{t('address')}:</span>
                <span className="value">{order.deliveryAddress?.addressLine}</span>
              </div>
              <div className="info-item">
                <span className="label">{t('city')}:</span>
                <span className="value">{order.deliveryAddress?.city}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="order-items">
          <h3>{t('order_items')}</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>{t('item')}</th>
                <th>{t('quantity')}</th>
                <th>{t('price')}</th>
                <th>{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price}</td>
                  <td>${item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right">{t('subtotal')}:</td>
                <td>${order.subtotal}</td>
              </tr>
              <tr>
                <td colSpan="3" className="text-right">{t('delivery_fee')}:</td>
                <td>${order.deliveryFee}</td>
              </tr>
              <tr>
                <td colSpan="3" className="text-right"><strong>{t('total')}:</strong></td>
                <td><strong>${order.totalPrice}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="order-actions">
            <h3>{t('update_status')}</h3>
            <div className="status-buttons">
              {order.status === 'pending' && (
                <button
                  onClick={() => onStatusChange('accepted')}
                  className="btn btn-success"
                >
                  {t('accept_order')}
                </button>
              )}
              {order.status === 'accepted' && (
                <button
                  onClick={() => onStatusChange('picked')}
                  className="btn btn-primary"
                >
                  {t('mark_as_picked')}
                </button>
              )}
              {order.status === 'picked' && (
                <button
                  onClick={() => onStatusChange('delivered')}
                  className="btn btn-success"
                >
                  {t('mark_as_delivered')}
                </button>
              )}
              <button
                onClick={() => onStatusChange('cancelled')}
                className="btn btn-danger"
              >
                {t('cancel_order')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrdersManagement;