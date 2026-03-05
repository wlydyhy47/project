import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock, FaPhone, FaUser } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginMode) {
        // تسجيل الدخول
        const credentials = formData.email 
          ? { email: formData.email, password: formData.password }
          : { phone: formData.phone, password: formData.password };
        
        const result = await login(credentials);
        
        if (result.success) {
          // ✅ التأكد من وجود user والـ role
          if (result.user && result.user.role === 'admin') {
            navigate('/admin/dashboard');
            toast.success(t('login_success'));
          } else {
            toast.error(t('unauthorized_access'));
            // تسجيل الخروج لأن المستخدم ليس أدمن
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
        }
      } else {
        // تسجيل جديد
        if (formData.password !== formData.confirmPassword) {
          toast.error(t('passwords_dont_match'));
          setLoading(false);
          return;
        }

        const response = await fetch('https://backend-walid-yahaya.onrender.com/api/auth/register/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined,
            password: formData.password,
            role: 'admin', // ✅ محاولة تسجيل كأدمن
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(t('registration_success'));
          setIsLoginMode(true);
          // ✅ تعبئة رقم الهاتف تلقائياً
          setFormData({
            ...formData,
            password: '',
            confirmPassword: '',
          });
        } else {
          toast.error(data.message || t('registration_failed'));
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(t('auth_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={`${API_URL}/images/logo.png`} alt="Logo" className="auth-logo" />
          <h1>{t('delivery_admin')}</h1>
          <p>{isLoginMode ? t('welcome_back') : t('create_account')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLoginMode && (
            <div className="form-group">
              <div className="input-icon">
                <FaUser />
                <input
                  type="text"
                  name="name"
                  placeholder={t('full_name')}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <div className="input-icon">
              <FaPhone />
              <input
                type="tel"
                name="phone"
                placeholder={t('phone_number')}
                value={formData.phone}
                onChange={handleChange}
                required={!formData.email}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder={t('email_optional')}
                value={formData.email}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type="password"
                name="password"
                placeholder={t('password')}
                value={formData.password}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
          </div>

          {!isLoginMode && (
            <div className="form-group">
              <div className="input-icon">
                <FaLock />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder={t('confirm_password')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-small"></span>
            ) : isLoginMode ? (
              t('login')
            ) : (
              t('register')
            )}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="btn-link"
          >
            {isLoginMode ? t('need_account') : t('have_account')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;