import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import {
  FaHamburger,
  FaPizzaSlice,
  FaCoffee,
  FaIceCream,
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaSearch,
  FaFilter,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const ItemsManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    restaurant: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants-list'],
    queryFn: () => adminAPI.getRestaurants({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['items', page, search, filters],
    queryFn: () => adminAPI.getItems({
      page,
      limit: 20,
      search,
      filter: filters,
    }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
      toast.success(t('item_deleted_success'));
      setShowDeleteModal(false);
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => adminAPI.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
      toast.success(t('item_created_success'));
      setShowAddModal(false);
    },
  });

  const getCategoryIcon = (category) => {
    const icons = {
      burger: <FaHamburger />,
      pizza: <FaPizzaSlice />,
      drink: <FaCoffee />,
      dessert: <FaIceCream />,
    };
    return icons[category] || <FaHamburger />;
  };

  return (
    <div className="items-management">
      <div className="page-header">
        <h1>{t('menu_items_management')}</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <FaPlus /> {t('add_item')}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('search_items')}
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
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="form-control"
          >
            <option value="">{t('all_categories')}</option>
            <option value="burger">{t('burgers')}</option>
            <option value="pizza">{t('pizza')}</option>
            <option value="drink">{t('drinks')}</option>
            <option value="dessert">{t('desserts')}</option>
            <option value="appetizer">{t('appetizers')}</option>
            <option value="main">{t('main_dishes')}</option>
          </select>

          <div className="price-range">
            <input
              type="number"
              placeholder={t('min_price')}
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="form-control"
            />
            <span>-</span>
            <input
              type="number"
              placeholder={t('max_price')}
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="form-control"
            />
          </div>
        </div>
      </div>

      <div className="items-grid">
        {data?.data?.items?.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-image">
              <img src={item.image || '/default-item.jpg'} alt={item.name} />
              <div className="item-category">
                {getCategoryIcon(item.category)}
                <span>{t(item.category)}</span>
              </div>
            </div>
            
            <div className="item-info">
              <h3>{item.name}</h3>
              <p className="item-restaurant">{item.restaurant?.name}</p>
              <p className="item-description">{item.description}</p>
              
              <div className="item-footer">
                <span className="item-price">${item.price}</span>
                <div className="item-actions">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setShowEditModal(true);
                    }}
                    className="btn-icon edit"
                    title={t('edit')}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
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
          </div>
        ))}
      </div>

      {/* Add/Edit Item Modal */}
      {(showAddModal || showEditModal) && (
        <ItemFormModal
          item={selectedItem}
          restaurants={restaurants?.data?.restaurants}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSubmit={(data) => {
            if (showEditModal) {
              // updateItemMutation.mutate({ id: selectedItem.id, data });
            } else {
              createItemMutation.mutate(data);
            }
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title={t('delete_item')}
          onClose={() => setShowDeleteModal(false)}
        >
          <p>{t('delete_item_confirmation', { name: selectedItem?.name })}</p>
          <div className="modal-actions">
            <button
              onClick={() => deleteItemMutation.mutate(selectedItem.id)}
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

// Item Form Modal Component
const ItemFormModal = ({ item, restaurants, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    category: item?.category || 'burger',
    restaurant: item?.restaurant?.id || '',
    image: null,
    isAvailable: item?.isAvailable ?? true,
    isVegetarian: item?.isVegetarian || false,
    isVegan: item?.isVegan || false,
    preparationTime: item?.preparationTime || '15-20',
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      title={item ? t('edit_item') : t('add_item')}
      onClose={onClose}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="item-form">
        <div className="form-group">
          <label>{t('item_name')} *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-control"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('category')} *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="form-control"
              required
            >
              <option value="burger">{t('burgers')}</option>
              <option value="pizza">{t('pizza')}</option>
              <option value="drink">{t('drinks')}</option>
              <option value="dessert">{t('desserts')}</option>
              <option value="appetizer">{t('appetizers')}</option>
              <option value="main">{t('main_dishes')}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('price')} *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="form-control"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>{t('restaurant')} *</label>
          <select
            value={formData.restaurant}
            onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
            className="form-control"
            required
          >
            <option value="">{t('select_restaurant')}</option>
            {restaurants?.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{t('description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-control"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('preparation_time')}</label>
            <input
              type="text"
              value={formData.preparationTime}
              onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
              className="form-control"
              placeholder="15-20"
            />
          </div>

          <div className="form-group">
            <label>{t('item_image')}</label>
            <div className="file-upload">
              <input
                type="file"
                id="item-image"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="item-image" className="file-label">
                <FaImage /> {formData.image ? formData.image.name : t('choose_image')}
              </label>
            </div>
          </div>
        </div>

        <div className="form-checkboxes">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            />
            {t('available')}
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isVegetarian}
              onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
            />
            {t('vegetarian')}
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isVegan}
              onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
            />
            {t('vegan')}
          </label>
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn btn-primary">
            {item ? t('update') : t('create')}
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            {t('cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ItemsManagement;