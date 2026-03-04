import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaUser,
  FaStore,
  FaTrash,
  FaFlag,
  FaCheckCircle,
  FaSearch,
  FaFilter,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const ReviewsManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    restaurant: '',
    minRating: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants-list'],
    queryFn: () => adminAPI.getRestaurants({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, search, filters],
    queryFn: () => adminAPI.getReviews({ 
      page, 
      limit: 10,
      search,
      ...filters 
    }),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews']);
      toast.success(t('review_deleted_success'));
      setShowDeleteModal(false);
    },
  });

  const moderateReviewMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.moderateReview(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews']);
      toast.success(t('review_updated_success'));
    },
  });

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-filled" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-filled" />);
    }
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-empty" />);
    }
    return stars;
  };

  return (
    <div className="reviews-management">
      <div className="page-header">
        <h1>{t('reviews_management')}</h1>
      </div>

      <div className="reviews-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-details">
            <h3>{t('average_rating')}</h3>
            <p>{data?.data?.stats?.averageRating || '0.0'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-details">
            <h3>{t('approved_reviews')}</h3>
            <p>{data?.data?.stats?.approved || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaFlag />
          </div>
          <div className="stat-details">
            <h3>{t('pending_reviews')}</h3>
            <p>{data?.data?.stats?.pending || 0}</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('search_reviews')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="filters">
          <select
            value={filters.restaurant}
            onChange={(e) => setFilters({ ...filters, restaurant: e.target.value })}
            className="form-control"
          >
            <option value="">{t('all_restaurants')}</option>
            {restaurants?.data?.restaurants?.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>

          <select
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
            className="form-control"
          >
            <option value="">{t('all_ratings')}</option>
            <option value="5">5 {t('stars')}</option>
            <option value="4">4+ {t('stars')}</option>
            <option value="3">3+ {t('stars')}</option>
            <option value="2">2+ {t('stars')}</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="form-control"
          >
            <option value="">{t('all_status')}</option>
            <option value="approved">{t('approved')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="rejected">{t('rejected')}</option>
          </select>
        </div>
      </div>

      <div className="reviews-list">
        {data?.data?.reviews?.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <div className="reviewer-info">
                <img 
                  src={review.user?.image || '/default-avatar.png'} 
                  alt={review.user?.name}
                  className="reviewer-avatar"
                />
                <div>
                  <h4>{review.user?.name}</h4>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="review-rating">
                <div className="stars">
                  {renderStars(review.rating)}
                </div>
                <span className="rating-value">{review.rating}</span>
              </div>
            </div>

            <div className="review-restaurant">
              <FaStore />
              <span>{review.restaurant?.name}</span>
            </div>

            <div className="review-content">
              <p>{review.comment}</p>
              {review.reply && (
                <div className="review-reply">
                  <strong>{t('restaurant_reply')}:</strong>
                  <p>{review.reply}</p>
                </div>
              )}
            </div>

            {review.images && review.images.length > 0 && (
              <div className="review-images">
                {review.images.map((image, index) => (
                  <img 
                    key={index} 
                    src={image} 
                    alt={`review-${index}`}
                    className="review-image-thumb"
                  />
                ))}
              </div>
            )}

            <div className="review-footer">
              <div className="review-status">
                <span className={`status-badge status-${review.status}`}>
                  {t(review.status)}
                </span>
              </div>
              
              <div className="review-actions">
                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => moderateReviewMutation.mutate({ 
                        id: review.id, 
                        status: 'approved' 
                      })}
                      className="btn-icon success"
                      title={t('approve')}
                    >
                      <FaCheckCircle />
                    </button>
                    <button
                      onClick={() => moderateReviewMutation.mutate({ 
                        id: review.id, 
                        status: 'rejected' 
                      })}
                      className="btn-icon warning"
                      title={t('reject')}
                    >
                      <FaFlag />
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedReview(review);
                    setShowDeleteModal(true);
                  }}
                  className="btn-icon delete"
                  title={t('delete')}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title={t('delete_review')}
          onClose={() => setShowDeleteModal(false)}
        >
          <p>{t('delete_review_confirmation')}</p>
          <div className="modal-actions">
            <button
              onClick={() => deleteReviewMutation.mutate(selectedReview.id)}
              className="btn btn-danger"
            >
              {t('confirm_delete')}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-secondary"
            >
              {t('cancel')}
            </button>
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

export default ReviewsManagement;