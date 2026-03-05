import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock, FaPhone, FaUser, FaStore, FaMotorcycle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [selectedRole, setSelectedRole] = useState('client');
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};

    if (!isLoginMode) {
      if (!formData.name || formData.name.length < 2) {
        newErrors.name = 'الاسم يجب أن يكون على الأقل حرفين';
      }
    }

    if (!formData.phone && !formData.email) {
      newErrors.phone = 'رقم الهاتف أو البريد الإلكتروني مطلوب';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صالح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // مسح الخطأ عند التعديل
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleLogin = async () => {
    // محاولة الدخول بالهاتف أولاً ثم بالبريد
    const credentials = formData.phone 
      ? { phone: formData.phone, password: formData.password }
      : { email: formData.email, password: formData.password };
    
    const result = await login(credentials);
    
    if (result.success) {
      // ✅ توجيه المستخدم حسب دوره
      const role = result.user?.role;
      
      switch(role) {
        case 'admin':
          navigate('/admin/dashboard');
          toast.success('مرحباً بك في لوحة تحكم الأدمن');
          break;
        case 'restaurant_owner':
          navigate('/restaurant/dashboard');
          toast.success('مرحباً بك في لوحة تحكم المطعم');
          break;
        case 'driver':
          navigate('/driver/dashboard');
          toast.success('مرحباً بك في لوحة تحكم المندوب');
          break;
        default:
          navigate('/');
          toast.success('تم تسجيل الدخول بنجاح');
      }
    } else {
      toast.error(result.message || 'فشل تسجيل الدخول');
    }
  };

  const handleRegister = async () => {
    // ✅ استخدام المسار الصحيح للتسجيل
    const registerEndpoint = `${API_URL}/api/auth/register/complete`;
    
    const response = await fetch(registerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
        role: selectedRole, // ✅ استخدام الدور المختار
      }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success('تم التسجيل بنجاح! يمكنك تسجيل الدخول الآن');
      setIsLoginMode(true);
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
      
      // ✅ إذا كان الباك اند يرسل توكن مباشرة بعد التسجيل
      if (data.token) {
        // تخزين التوكن وتسجيل الدخول مباشرة
        localStorage.setItem('token', data.token);
        // إعادة تحميل الصفحة أو التوجيه
        window.location.href = `/${selectedRole}/dashboard`;
      }
    } else {
      toast.error(data.message || 'فشل التسجيل');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setLoading(true);

    try {
      if (isLoginMode) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      toast.error(error.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // الحصول على الصور من الباك اند مع fallback
  const getImageUrl = (imageName) => {
    return `${API_URL}/images/${imageName}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          {/* ✅ استخدام الصور من الباك اند */}
          <img 
            src={getImageUrl('logo.png')} 
            alt="Logo" 
            className="auth-logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150x150?text=Logo';
            }}
          />
          <h1>نظام التوصيل</h1>
          <p>{isLoginMode ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}</p>
        </div>

        {!isLoginMode && (
          <div className="role-selector">
            <p>اختر نوع الحساب:</p>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${selectedRole === 'client' ? 'active' : ''}`}
                onClick={() => setSelectedRole('client')}
              >
                <FaUser /> عميل
              </button>
              <button
                type="button"
                className={`role-btn ${selectedRole === 'restaurant_owner' ? 'active' : ''}`}
                onClick={() => setSelectedRole('restaurant_owner')}
              >
                <FaStore /> صاحب مطعم
              </button>
              <button
                type="button"
                className={`role-btn ${selectedRole === 'driver' ? 'active' : ''}`}
                onClick={() => setSelectedRole('driver')}
              >
                <FaMotorcycle /> مندوب
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLoginMode && (
            <div className="form-group">
              <div className="input-icon">
                <FaUser />
                <input
                  type="text"
                  name="name"
                  placeholder="الاسم الكامل"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`form-control ${errors.name ? 'error' : ''}`}
                />
              </div>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <div className="input-icon">
              <FaPhone />
              <input
                type="tel"
                name="phone"
                placeholder="رقم الهاتف (مثال: +22712345678)"
                value={formData.phone}
                onChange={handleChange}
                required={!formData.email}
                className={`form-control ${errors.phone ? 'error' : ''}`}
              />
            </div>
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <div className="input-icon">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder="البريد الإلكتروني (اختياري)"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? 'error' : ''}`}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type="password"
                name="password"
                placeholder="كلمة المرور"
                value={formData.password}
                onChange={handleChange}
                required
                className={`form-control ${errors.password ? 'error' : ''}`}
              />
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {!isLoginMode && (
            <div className="form-group">
              <div className="input-icon">
                <FaLock />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="تأكيد كلمة المرور"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                />
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                جاري المعالجة...
              </>
            ) : isLoginMode ? (
              'تسجيل الدخول'
            ) : (
              'إنشاء حساب'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrors({});
              setFormData({
                phone: '',
                email: '',
                password: '',
                name: '',
                confirmPassword: '',
              });
            }}
            className="btn-link"
          >
            {isLoginMode ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخول'}
          </button>
        </div>

        {/* ✅ رابط للصور المتاحة (مساعدة للمطورين) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-info">
            <small>
              <a href={`${API_URL}/api/assets/images`} target="_blank" rel="noreferrer">
                عرض الصور المتاحة
              </a>
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;