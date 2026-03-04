import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import {
  FaStore,
  FaTrash,
  FaPlus,
  FaMapMarkerAlt,
  FaClock,
  FaTag,
  FaStar,
  FaSearch,
  FaExclamationCircle,
  FaSyncAlt,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const RestaurantsManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['restaurants', page, search],
    queryFn: () => adminAPI.getRestaurants({
      page,
      limit: 10,
      search,
    }),
    keepPreviousData: true, // الاحتفاظ بالبيانات السابقة أثناء التحميل
  });

  // ✅ استخراج البيانات بشكل آمن
  const restaurantsData = data?.data?.data || {};
  const restaurants = restaurantsData.restaurants || [];
  const totalPages = restaurantsData.totalPages || 1;
  const totalRestaurants = restaurantsData.total || 0;

  const deleteRestaurantMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurants']);
      toast.success(t('restaurant_deleted_success'));
      setShowDeleteModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error_deleting_restaurant'));
    },
  });

  // ✅ معالجة حالة التحميل
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('loading_restaurants')}</p>
      </div>
    );
  }

  // ✅ معالجة حالة الخطأ
  if (error) {
    return (
      <div className="error-container">
        <FaExclamationCircle className="error-icon" />
        <h3>{t('error_loading_restaurants')}</h3>
        <p>{error.response?.data?.message || error.message || t('try_again_later')}</p>
        <button onClick={() => refetch()} className="btn btn-primary" disabled={isFetching}>
          <FaSyncAlt className={isFetching ? 'spin' : ''} /> {t('retry')}
        </button>
      </div>
    );
  }

  const handleDelete = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedRestaurant) {
      deleteRestaurantMutation.mutate(selectedRestaurant.id);
    }
  };

  return (
    <div className="restaurants-management">
      <div className="page-header">
        <div>
          <h1>{t('restaurants_management')}</h1>
          {totalRestaurants > 0 && (
            <p className="total-count">{t('total_restaurants')}: {totalRestaurants}</p>
          )}
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <FaPlus /> {t('add_restaurant')}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('search_restaurants')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="filter-actions">
          <button 
            onClick={() => refetch()} 
            className="btn btn-secondary"
            disabled={isFetching}
          >
            <FaSyncAlt className={isFetching ? 'spin' : ''} /> {t('refresh')}
          </button>
        </div>
      </div>

      {restaurants.length === 0 ? (
        <div className="empty-state">
          <FaStore className="icon" />
          <h3>{t('no_restaurants_found')}</h3>
          <p>{search ? t('try_different_search') : t('add_first_restaurant')}</p>
          {!search && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <FaPlus /> {t('add_restaurant')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="restaurants-grid">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="restaurant-card">
                <div className="restaurant-image">
                  <img 
                    src={restaurant.image || '/default-restaurant.jpg'} 
                    alt={restaurant.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-restaurant.jpg';
                    }}
                  />
                  <div className="restaurant-status">
                    <span className={`status-badge ${restaurant.isOpen ? 'status-open' : 'status-closed'}`}>
                      {restaurant.isOpen ? t('open') : t('closed')}
                    </span>
                  </div>
                </div>
                
                <div className="restaurant-info">
                  <h3>{restaurant.name}</h3>
                  <div className="restaurant-meta">
                    <span className="restaurant-type">
                      <FaTag /> {t(restaurant.type || 'restaurant')}
                    </span>
                    <span className="restaurant-rating">
                      <FaStar className="star" /> {restaurant.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  
                  <div className="restaurant-details">
                    <p className="restaurant-address">
                      <FaMapMarkerAlt /> {restaurant.addresses?.[0]?.addressLine || t('no_address')}
                    </p>
                    <p className="restaurant-delivery">
                      <FaClock /> {t('delivery_time')}: {restaurant.estimatedDeliveryTime || '30-45'} {t('min')}
                    </p>
                  </div>

                  <div className="restaurant-actions">
                    <button
                      onClick={() => handleDelete(restaurant)}
                      className="btn-icon delete"
                      title={t('delete')}
                      disabled={deleteRestaurantMutation.isLoading}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="btn btn-secondary"
              >
                {t('previous')}
              </button>
              <span className="page-info">
                {t('page')} {page} {t('of')} {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages || isFetching}
                className="btn btn-secondary"
              >
                {t('next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title={t('delete_restaurant')}
          onClose={() => setShowDeleteModal(false)}
        >
          <div className="delete-confirmation">
            <FaExclamationCircle className="warning-icon" />
            <p>{t('delete_restaurant_confirmation', { name: selectedRestaurant?.name })}</p>
            <p className="warning-text">{t('delete_restaurant_warning')}</p>
          </div>
          <div className="modal-actions">
            <button
              onClick={confirmDelete}
              className="btn btn-danger"
              disabled={deleteRestaurantMutation.isLoading}
            >
              {deleteRestaurantMutation.isLoading ? (
                <>
                  <span className="spinner-small"></span>
                  {t('deleting')}
                </>
              ) : (
                t('confirm_delete')
              )}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-secondary"
              disabled={deleteRestaurantMutation.isLoading}
            >
              {t('cancel')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RestaurantsManagement;