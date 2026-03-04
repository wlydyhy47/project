import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserPlus,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const UsersManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => adminAPI.getUsers({
      page,
      limit: 10,
      search,
    }),
  });

  // ✅ استخراج البيانات بشكل آمن
  const usersData = data?.data?.data || {};
  const users = usersData.users || [];
  const totalPages = usersData.totalPages || 1;

  const deleteUserMutation = useMutation({
    mutationFn: ({ id, reason }) => adminAPI.deleteUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success(t('user_deleted_success'));
      setShowDeleteModal(false);
    },
  });

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>{t('users_management')}</h1>
        <button className="btn btn-primary">
          <FaUserPlus /> {t('add_user')}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('search_users')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('user')}</th>
              <th>{t('phone')}</th>
              <th>{t('email')}</th>
              <th>{t('role')}</th>
              <th>{t('status')}</th>
              <th>{t('verification')}</th>
              <th>{t('joined')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <img src={user.image || '/default-avatar.png'} alt={user.name} />
                    <span>{user.name}</span>
                  </div>
                </td>
                <td>{user.phone}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {t(user.role)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                    {user.isActive ? t('active') : t('inactive')}
                  </span>
                </td>
                <td>
                  {user.isVerified ? (
                    <FaCheckCircle className="verified-icon" />
                  ) : (
                    <FaExclamationCircle className="unverified-icon" />
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteModal(true);
                      }}
                      className="btn-icon delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center">
                  {t('no_users_found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title={t('delete_user')}
          onClose={() => setShowDeleteModal(false)}
        >
          <p>{t('delete_user_confirmation', { name: selectedUser?.name })}</p>
          <textarea
            placeholder={t('delete_reason_optional')}
            id="deleteReason"
            className="form-control"
            rows="3"
          />
          <div className="modal-actions">
            <button
              onClick={() => deleteUserMutation.mutate({ 
                id: selectedUser.id, 
                reason: document.getElementById('deleteReason')?.value 
              })}
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
          {t('page')} {page} {t('of')} {totalPages}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
          className="btn btn-secondary"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
};

export default UsersManagement;