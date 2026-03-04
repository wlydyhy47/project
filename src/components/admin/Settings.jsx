import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import {
    FaCog,
    FaGlobe,
    FaBell,
    FaShieldAlt,
    FaDatabase,
    FaPalette,
    FaLanguage,
    FaSave,
    FaTrash,
    FaHistory,
    FaUserShield,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const Settings = () => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        general: {
            siteName: 'Delivery Admin',
            siteUrl: 'https://delivery-admin.com',
            supportEmail: 'support@delivery.com',
            supportPhone: '+966500000000',
            timezone: 'Asia/Riyadh',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
        },
        notifications: {
            emailNotifications: true,
            pushNotifications: true,
            orderUpdates: true,
            driverUpdates: true,
            userRegistrations: true,
            reports: true,
            marketingEmails: false,
        },
        security: {
            twoFactorAuth: false,
            sessionTimeout: '30',
            maxLoginAttempts: '5',
            passwordExpiry: '90',
            ipWhitelist: '',
            allowedDomains: '',
        },
        system: {
            maintenanceMode: false,
            cacheEnabled: true,
            cacheTTL: '3600',
            maxUploadSize: '10',
            allowedFileTypes: 'jpg,png,pdf',
            apiRateLimit: '100',
        },
        localization: {
            language: 'ar',
            currency: 'SAR',
            currencyFormat: 'symbol',
            distanceUnit: 'km',
            weightUnit: 'kg',
        },
        appearance: {
            theme: 'light',
            primaryColor: '#2c3e50',
            sidebarCollapsed: false,
            animations: true,
            denseMode: false,
        },
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (data) => adminAPI.updateSettings(data),
        onSuccess: () => {
            toast.success(t('settings_updated'));
            queryClient.invalidateQueries(['settings']);
        },
    });

    const clearCacheMutation = useMutation({
        mutationFn: () => adminAPI.clearCache(),
        onSuccess: () => {
            toast.success(t('cache_cleared'));
        },
    });

    const handleSettingChange = (section, field, value) => {
        setSettings({
            ...settings,
            [section]: {
                ...settings[section],
                [field]: value,
            },
        });
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        handleSettingChange('localization', 'language', lang);
    };

    const handleSaveSettings = () => {
        updateSettingsMutation.mutate(settings);
    };

    const tabs = [
        { id: 'general', label: t('general'), icon: <FaCog /> },
        { id: 'notifications', label: t('notifications'), icon: <FaBell /> },
        { id: 'security', label: t('security'), icon: <FaShieldAlt /> },
        { id: 'system', label: t('system'), icon: <FaDatabase /> },
        { id: 'localization', label: t('localization'), icon: <FaLanguage /> },
        { id: 'appearance', label: t('appearance'), icon: <FaPalette /> },
    ];

    return (
        <div className="settings">
            <div className="page-header">
                <h1>{t('settings')}</h1>
                <button onClick={handleSaveSettings} className="btn btn-primary">
                    <FaSave /> {t('save_settings')}
                </button>
            </div>

            <div className="settings-container">
                <div className="settings-sidebar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="settings-content">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="settings-section">
                            <h2>{t('general_settings')}</h2>

                            <div className="form-group">
                                <label>{t('site_name')}</label>
                                <input
                                    type="text"
                                    value={settings.general.siteName}
                                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('site_url')}</label>
                                <input
                                    type="url"
                                    value={settings.general.siteUrl}
                                    onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
                                    className="form-control"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('support_email')}</label>
                                    <input
                                        type="email"
                                        value={settings.general.supportEmail}
                                        onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                                        className="form-control"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t('support_phone')}</label>
                                    <input
                                        type="tel"
                                        value={settings.general.supportPhone}
                                        onChange={(e) => handleSettingChange('general', 'supportPhone', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('timezone')}</label>
                                    <select
                                        value={settings.general.timezone}
                                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="Asia/Riyadh">Riyadh</option>
                                        <option value="Asia/Dubai">Dubai</option>
                                        <option value="Asia/Kuwait">Kuwait</option>
                                        <option value="Asia/Qatar">Qatar</option>
                                        <option value="Asia/Bahrain">Bahrain</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>{t('date_format')}</label>
                                    <select
                                        value={settings.general.dateFormat}
                                        onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <h2>{t('notification_settings')}</h2>

                            <div className="settings-group">
                                <h3>{t('channels')}</h3>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.emailNotifications}
                                        onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                                    />
                                    {t('email_notifications')}
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.pushNotifications}
                                        onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                                    />
                                    {t('push_notifications')}
                                </label>
                            </div>

                            <div className="settings-group">
                                <h3>{t('events')}</h3>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.orderUpdates}
                                        onChange={(e) => handleSettingChange('notifications', 'orderUpdates', e.target.checked)}
                                    />
                                    {t('order_updates')}
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.driverUpdates}
                                        onChange={(e) => handleSettingChange('notifications', 'driverUpdates', e.target.checked)}
                                    />
                                    {t('driver_updates')}
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.userRegistrations}
                                        onChange={(e) => handleSettingChange('notifications', 'userRegistrations', e.target.checked)}
                                    />
                                    {t('user_registrations')}
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.reports}
                                        onChange={(e) => handleSettingChange('notifications', 'reports', e.target.checked)}
                                    />
                                    {t('reports')}
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <h2>{t('security_settings')}</h2>

                            <div className="settings-group">
                                <h3>{t('authentication')}</h3>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.security.twoFactorAuth}
                                        onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                                    />
                                    {t('two_factor_auth')}
                                </label>

                                <div className="form-group">
                                    <label>{t('session_timeout')} ({t('minutes')})</label>
                                    <input
                                        type="number"
                                        value={settings.security.sessionTimeout}
                                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                                        className="form-control"
                                        min="5"
                                        max="120"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t('max_login_attempts')}</label>
                                    <input
                                        type="number"
                                        value={settings.security.maxLoginAttempts}
                                        onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', e.target.value)}
                                        className="form-control"
                                        min="3"
                                        max="10"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t('password_expiry')} ({t('days')})</label>
                                    <input
                                        type="number"
                                        value={settings.security.passwordExpiry}
                                        onChange={(e) => handleSettingChange('security', 'passwordExpiry', e.target.value)}
                                        className="form-control"
                                        min="30"
                                        max="365"
                                    />
                                </div>
                            </div>

                            <div className="settings-group">
                                <h3>{t('access_control')}</h3>

                                <div className="form-group">
                                    <label>{t('ip_whitelist')}</label>
                                    <textarea
                                        value={settings.security.ipWhitelist}
                                        onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.value)}
                                        className="form-control"
                                        rows="3"
                                        placeholder="192.168.1.1, 10.0.0.1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t('allowed_domains')}</label>
                                    <input
                                        type="text"
                                        value={settings.security.allowedDomains}
                                        onChange={(e) => handleSettingChange('security', 'allowedDomains', e.target.value)}
                                        className="form-control"
                                        placeholder="example.com, domain.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Settings */}
                    {activeTab === 'system' && (
                        <div className="settings-section">
                            <h2>{t('system_settings')}</h2>

                            <div className="settings-group">
                                <h3>{t('maintenance')}</h3>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.system.maintenanceMode}
                                        onChange={(e) => handleSettingChange('system', 'maintenanceMode', e.target.checked)}
                                    />
                                    {t('maintenance_mode')}
                                </label>
                            </div>

                            <div className="settings-group">
                                <h3>{t('cache_settings')}</h3>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.system.cacheEnabled}
                                        onChange={(e) => handleSettingChange('system', 'cacheEnabled', e.target.checked)}
                                    />
                                    {t('enable_cache')}
                                </label>

                                <div className="form-group">
                                    <label>{t('cache_ttl')} ({t('seconds')})</label>
                                    <input
                                        type="number"
                                        value={settings.system.cacheTTL}
                                        onChange={(e) => handleSettingChange('system', 'cacheTTL', e.target.value)}
                                        className="form-control"
                                        min="60"
                                        max="86400"
                                    />
                                </div>

                                <button
                                    onClick={() => clearCacheMutation.mutate()}
                                    className="btn btn-warning"
                                >
                                    <FaTrash /> {t('clear_cache')}
                                </button>
                            </div>

                            <div className="settings-group">
                                <h3>{t('file_uploads')}</h3>

                                <div className="form-group">
                                    <label>{t('max_upload_size')} (MB)</label>
                                    <input
                                        type="number"
                                        value={settings.system.maxUploadSize}
                                        onChange={(e) => handleSettingChange('system', 'maxUploadSize', e.target.value)}
                                        className="form-control"
                                        min="1"
                                        max="100"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t('allowed_file_types')}</label>
                                    <input
                                        type="text"
                                        value={settings.system.allowedFileTypes}
                                        onChange={(e) => handleSettingChange('system', 'allowedFileTypes', e.target.value)}
                                        className="form-control"
                                        placeholder="jpg,png,pdf"
                                    />
                                </div>
                            </div>

                            <div className="settings-group">
                                <h3>{t('api_settings')}</h3>

                                <div className="form-group">
                                    <label>{t('api_rate_limit')} ({t('requests_per_minute')})</label>
                                    <input
                                        type="number"
                                        value={settings.system.apiRateLimit}
                                        onChange={(e) => handleSettingChange('system', 'apiRateLimit', e.target.value)}
                                        className="form-control"
                                        min="10"
                                        max="1000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Localization Settings */}
                    {activeTab === 'localization' && (
                        <div className="settings-section">
                            <h2>{t('localization_settings')}</h2>

                            <div className="form-group">
                                <label>{t('language')}</label>
                                <select
                                    value={settings.localization.language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="form-control"
                                >
                                    <option value="ar">العربية</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('currency')}</label>
                                <select
                                    value={settings.localization.currency}
                                    onChange={(e) => handleSettingChange('localization', 'currency', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="SAR">SAR - ريال سعودي</option>
                                    <option value="AED">AED - درهم إماراتي</option>
                                    <option value="KWD">KWD - دينار كويتي</option>
                                    <option value="QAR">QAR - ريال قطري</option>
                                    <option value="BHD">BHD - دينار بحريني</option>
                                    <option value="USD">USD - دولار أمريكي</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('distance_unit')}</label>
                                    <select
                                        value={settings.localization.distanceUnit}
                                        onChange={(e) => handleSettingChange('localization', 'distanceUnit', e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="km">km - كيلومتر</option>
                                        <option value="mi">mi - ميل</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>{t('weight_unit')}</label>
                                    <select
                                        value={settings.localization.weightUnit}
                                        onChange={(e) => handleSettingChange('localization', 'weightUnit', e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="kg">kg - كيلوجرام</option>
                                        <option value="lb">lb - باوند</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t('currency_format')}</label>
                                <select
                                    value={settings.localization.currencyFormat}
                                    onChange={(e) => handleSettingChange('localization', 'currencyFormat', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="symbol">{t('symbol')} (SAR 100)</option>
                                    <option value="code">{t('code')} (100 SAR)</option>
                                    <option value="both">{t('both')} (SAR 100)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Appearance Settings */}
                    {activeTab === 'appearance' && (
                        <div className="settings-section">
                            <h2>{t('appearance_settings')}</h2>

                            <div className="form-group">
                                <label>{t('theme')}</label>
                                <select
                                    value={settings.appearance.theme}
                                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="light">{t('light')}</option>
                                    <option value="dark">{t('dark')}</option>
                                    <option value="system">{t('system_default')}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('primary_color')}</label>
                                <div className="color-picker">
                                    <input
                                        type="color"
                                        value={settings.appearance.primaryColor}
                                        onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                                    />
                                    <span>{settings.appearance.primaryColor}</span>
                                </div>
                            </div>

                            <div className="settings-group">
                                <h3>{t('layout')}</h3>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.appearance.sidebarCollapsed}
                                        onChange={(e) => handleSettingChange('appearance', 'sidebarCollapsed', e.target.checked)}
                                    />
                                    {t('collapse_sidebar')}
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.appearance.animations}
                                        onChange={(e) => handleSettingChange('appearance', 'animations', e.target.checked)}
                                    />
                                    {t('enable_animations')}
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.appearance.denseMode}
                                        onChange={(e) => handleSettingChange('appearance', 'denseMode', e.target.checked)}
                                    />
                                    {t('dense_mode')}
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;