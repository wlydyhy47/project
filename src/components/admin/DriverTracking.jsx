import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { FaTruck, FaMapMarkerAlt, FaRoute } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// إصلاح أيقونات Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// أيقونة مخصصة للمندوب
const driverIcon = new L.Icon({
  iconUrl: '/driver-marker.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// أيقونة مخصصة للمطعم
const restaurantIcon = new L.Icon({
  iconUrl: '/restaurant-marker.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const DriverTracking = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [driverLocations, setDriverLocations] = useState({});
  const mapRef = useRef();

  const { data: activeOrders } = useQuery({
    queryKey: ['activeOrders'],
    queryFn: () => adminAPI.getOrders({ 
      filter: { status: ['accepted', 'picked'] } 
    }),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (socket) {
      socket.on('driver-location', (data) => {
        setDriverLocations(prev => ({
          ...prev,
          [data.driverId]: {
            ...data,
            timestamp: new Date(),
          },
        }));
      });

      return () => {
        socket.off('driver-location');
      };
    }
  }, [socket]);

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);
    try {
      const location = await adminAPI.getDriverLocation(order.id);
      if (location.data) {
        setDriverLocations(prev => ({
          ...prev,
          [order.driver?.id]: location.data,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch driver location:', error);
    }
  };

  const calculateRoute = (driverLocation, restaurantLocation, destinationLocation) => {
    if (!driverLocation || !restaurantLocation || !destinationLocation) return null;
    
    return [
      [driverLocation.latitude, driverLocation.longitude],
      [restaurantLocation.latitude, restaurantLocation.longitude],
      [destinationLocation.latitude, destinationLocation.longitude],
    ];
  };

  return (
    <div className="driver-tracking">
      <div className="tracking-header">
        <h1>{t('driver_tracking')}</h1>
        <div className="stats">
          <div className="stat-item">
            <FaTruck />
            <span>{t('active_drivers')}: {Object.keys(driverLocations).length}</span>
          </div>
          <div className="stat-item">
            <FaRoute />
            <span>{t('active_deliveries')}: {activeOrders?.data?.orders?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="tracking-container">
        <div className="orders-list">
          <h3>{t('active_orders')}</h3>
          <div className="orders-scroll">
            {activeOrders?.data?.orders?.map((order) => (
              <div
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                onClick={() => handleOrderSelect(order)}
              >
                <div className="order-header">
                  <span className="order-id">#{order.id}</span>
                  <span className={`status-badge status-${order.status}`}>
                    {t(order.status)}
                  </span>
                </div>
                <div className="order-info">
                  <div className="restaurant-info">
                    <strong>{order.restaurant?.name}</strong>
                    <small>{order.restaurant?.address?.addressLine}</small>
                  </div>
                  <div className="driver-info">
                    <strong>{t('driver')}:</strong>
                    <span>{order.driver?.name || t('not_assigned')}</span>
                  </div>
                  <div className="customer-info">
                    <strong>{t('customer')}:</strong>
                    <span>{order.user?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="map-container">
          <MapContainer
            center={[24.7136, 46.6753]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* عرض مواقع المندوبين */}
            {Object.values(driverLocations).map((location) => (
              <Marker
                key={location.driverId}
                position={[location.latitude, location.longitude]}
                icon={driverIcon}
              >
                <Popup>
                  <div className="driver-popup">
                    <h4>{location.driverName}</h4>
                    <p>{t('last_update')}: {location.timestamp?.toLocaleTimeString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* عرض مسار الطلب المحدد */}
            {selectedOrder && (
              <>
                <Marker
                  position={[
                    selectedOrder.restaurant?.address?.latitude,
                    selectedOrder.restaurant?.address?.longitude,
                  ]}
                  icon={restaurantIcon}
                >
                  <Popup>{selectedOrder.restaurant?.name}</Popup>
                </Marker>

                <Marker
                  position={[
                    selectedOrder.deliveryAddress?.latitude,
                    selectedOrder.deliveryAddress?.longitude,
                  ]}
                >
                  <Popup>{t('delivery_location')}</Popup>
                </Marker>

                {driverLocations[selectedOrder.driver?.id] && (
                  <Polyline
                    positions={calculateRoute(
                      driverLocations[selectedOrder.driver?.id],
                      selectedOrder.restaurant?.address,
                      selectedOrder.deliveryAddress
                    )}
                    color="blue"
                    weight={3}
                    opacity={0.6}
                  />
                )}
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default DriverTracking;