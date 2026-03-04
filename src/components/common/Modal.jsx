import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ title, children, onClose, size = 'medium' }) => {
  useEffect(() => {
    // منع التمرير عند فتح المودال
    document.body.style.overflow = 'hidden';
    
    // إغلاق المودال عند الضغط على ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // إغلاق المودال عند الضغط على الخلفية
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-content modal-${size}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;