import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const LocationContext = createContext(null);

const STORAGE_KEY = 'mini_dmart_location';

export const SERVICEABLE_CITIES = ['mumbai', 'pune', 'thane', 'navi mumbai', 'pimpri-chinchwad', 'kalyan', 'dombivli'];

export const DEFAULT_LOCATION = {
  label: 'Downtown Mumbai',
  fullAddress: 'Fort, M.G. Road, Downtown Mumbai, Maharashtra - 400001',
  pincode: '400001',
  city: 'Mumbai',
  slotText: 'Today, 4 PM - 6 PM',
  lat: 19.076,
  lng: 72.8777,
  storeName: 'Downtown Mumbai Flagship Store',
  isServiceable: true,
};

export const POPULAR_LOCATIONS = [
  {
    label: 'Downtown Mumbai',
    fullAddress: 'Fort, M.G. Road, Downtown Mumbai, Maharashtra - 400001',
    pincode: '400001',
    city: 'Mumbai',
    slotText: 'Today, 4 PM - 6 PM',
    lat: 19.076,
    lng: 72.8777,
    storeName: 'Downtown Mumbai Flagship Store',
    isServiceable: true,
  },
  {
    label: 'Bandra West',
    fullAddress: 'Hill Road, Bandra West, Mumbai, Maharashtra - 400050',
    pincode: '400050',
    city: 'Mumbai',
    slotText: 'Today, 5 PM - 7 PM',
    lat: 19.0596,
    lng: 72.8295,
    storeName: 'Bandra West Express Store',
    isServiceable: true,
  },
  {
    label: 'Andheri East',
    fullAddress: 'MIDC Road, Andheri East, Mumbai, Maharashtra - 400069',
    pincode: '400069',
    city: 'Mumbai',
    slotText: 'Today, 6 PM - 8 PM',
    lat: 19.1136,
    lng: 72.8697,
    storeName: 'Andheri East Hub',
    isServiceable: true,
  },
  {
    label: 'Vashi Sector 17',
    fullAddress: 'Sector 17, Vashi, Navi Mumbai, Maharashtra - 400703',
    pincode: '400703',
    city: 'Navi Mumbai',
    slotText: 'Today, 5 PM - 7 PM',
    lat: 19.0771,
    lng: 72.9986,
    storeName: 'Vashi Supercenter',
    isServiceable: true,
  },
  {
    label: 'Thane West',
    fullAddress: 'Gokhale Road, Thane West, Thane, Maharashtra - 400601',
    pincode: '400601',
    city: 'Thane',
    slotText: 'Tomorrow, 9 AM - 11 AM',
    lat: 19.2183,
    lng: 72.9781,
    storeName: 'Thane West Branch',
    isServiceable: true,
  },
  {
    label: 'Kothrud',
    fullAddress: 'Paud Road, Kothrud, Pune, Maharashtra - 411038',
    pincode: '411038',
    city: 'Pune',
    slotText: 'Today, 4 PM - 6 PM',
    lat: 18.5074,
    lng: 73.8077,
    storeName: 'Pune K.K. Market Branch',
    isServiceable: true,
  },
  {
    label: 'Hinjewadi Phase 1',
    fullAddress: 'Infotech Park, Hinjewadi, Pune, Maharashtra - 411057',
    pincode: '411057',
    city: 'Pune',
    slotText: 'Today, 6 PM - 8 PM',
    lat: 18.5913,
    lng: 73.7389,
    storeName: 'Hinjewadi Tech-Zone Store',
    isServiceable: true,
  },
  {
    label: 'Viman Nagar',
    fullAddress: 'Datta Mandir Chowk, Viman Nagar, Pune, Maharashtra - 411014',
    pincode: '411014',
    city: 'Pune',
    slotText: 'Tomorrow, 10 AM - 12 PM',
    lat: 18.5679,
    lng: 73.9143,
    storeName: 'Viman Nagar Express Hub',
    isServiceable: true,
  },
];

export const checkIsServiceable = (city = '', pincode = '') => {
  const cleanCity = (city || '').toLowerCase().trim();
  const isCityServiceable = SERVICEABLE_CITIES.some((sc) => cleanCity.includes(sc));
  const isPincodeServiceable = /^(400|410|411|421)\d{3}$/.test(pincode?.trim() || '');
  return isCityServiceable || isPincodeServiceable;
};

export const LocationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [initialStep, setInitialStep] = useState(1);
  const [detectedLocationCandidate, setDetectedLocationCandidate] = useState(null);
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);
  const syncedRef = useRef(false);

  // Auto-detect location on first visit if no location is stored
  useEffect(() => {
    const initLocation = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSelectedLocation(parsed);
          setHasCheckedInitial(true);
          return;
        }

        if (user?.preferredLocation?.pincode) {
          const userLoc = {
            label: user.preferredLocation.label || `${user.preferredLocation.city} ${user.preferredLocation.pincode}`,
            fullAddress: user.preferredLocation.label || `${user.preferredLocation.city} - ${user.preferredLocation.pincode}`,
            pincode: user.preferredLocation.pincode,
            city: user.preferredLocation.city || 'Mumbai',
            slotText: 'Today, 4 PM - 6 PM',
            lat: user.preferredLocation.lat || 19.076,
            lng: user.preferredLocation.lng || 72.8777,
            isServiceable: checkIsServiceable(user.preferredLocation.city, user.preferredLocation.pincode),
            storeName: 'Mini D-Mart Store',
          };
          setSelectedLocation(userLoc);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userLoc));
          setHasCheckedInitial(true);
          return;
        }

        // First visit with no saved location -> Attempt auto-detection via GPS
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              try {
                // Reverse geocode using OpenStreetMap Nominatim with required User-Agent
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                  {
                    headers: {
                      'User-Agent': 'MiniDMart-Web/1.0 (info@minidmart.com)',
                      'Accept-Language': 'en',
                    },
                  }
                );
                const data = await res.json();
                const address = data?.address || {};

                const area =
                  address.suburb ||
                  address.neighbourhood ||
                  address.residential ||
                  address.city_district ||
                  address.town ||
                  'My Location';
                const city = address.city || address.town || address.state_district || 'Mumbai';
                const pincode = address.postcode || '400001';
                const isServ = checkIsServiceable(city, pincode);

                const detected = {
                  label: area,
                  fullAddress: data?.display_name || `${area}, ${city} - ${pincode}`,
                  city,
                  pincode,
                  lat: latitude,
                  lng: longitude,
                  slotText: 'Today, 4 PM - 6 PM',
                  isServiceable: isServ,
                  storeName: isServ ? `${area} Express Store` : 'Outside Service Zone',
                };

                // Skip straight to Step 2 pre-filled with this result
                setDetectedLocationCandidate(detected);
                setInitialStep(2);
                setIsLocationModalOpen(true);
              } catch (geoErr) {
                console.warn('Reverse geocoding failed:', geoErr.message);
                setInitialStep(1);
                setIsLocationModalOpen(true);
              }
            },
            () => {
              // Denied or unavailable -> Open Step 1 Search Modal
              setInitialStep(1);
              setIsLocationModalOpen(true);
            },
            { timeout: 6000 }
          );
        } else {
          setInitialStep(1);
          setIsLocationModalOpen(true);
        }
      } catch (e) {
        console.warn('Failed to parse stored location:', e);
        setInitialStep(1);
        setIsLocationModalOpen(true);
      } finally {
        setHasCheckedInitial(true);
      }
    };

    initLocation();
  }, []);

  // When user logs in with saved preferredLocation, sync if not set
  useEffect(() => {
    if (isAuthenticated && user?.preferredLocation?.pincode && !syncedRef.current) {
      syncedRef.current = true;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const userLoc = {
          label: user.preferredLocation.label || `${user.preferredLocation.city} ${user.preferredLocation.pincode}`,
          fullAddress: user.preferredLocation.label || `${user.preferredLocation.city} - ${user.preferredLocation.pincode}`,
          pincode: user.preferredLocation.pincode,
          city: user.preferredLocation.city || 'Mumbai',
          slotText: 'Today, 4 PM - 6 PM',
          lat: user.preferredLocation.lat,
          lng: user.preferredLocation.lng,
          isServiceable: checkIsServiceable(user.preferredLocation.city, user.preferredLocation.pincode),
          storeName: 'Mini D-Mart Store',
        };
        setSelectedLocation(userLoc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userLoc));
      }
    }
  }, [isAuthenticated, user]);

  const selectLocation = async (locationData) => {
    const isServ = locationData.isServiceable !== undefined
      ? locationData.isServiceable
      : checkIsServiceable(locationData.city, locationData.pincode);

    const fullLoc = {
      label: locationData.label || `${locationData.city} ${locationData.pincode}`,
      fullAddress: locationData.fullAddress || `${locationData.label || ''}, ${locationData.city || 'Mumbai'} - ${locationData.pincode || '400001'}`,
      pincode: locationData.pincode || '400001',
      city: locationData.city || 'Mumbai',
      slotText: locationData.slotText || 'Today, 4 PM - 6 PM',
      lat: locationData.lat,
      lng: locationData.lng,
      storeName: locationData.storeName || (isServ ? `${locationData.city} Store` : 'Outside Delivery Zone'),
      isServiceable: isServ,
    };

    setSelectedLocation(fullLoc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullLoc));
    } catch (e) {
      console.warn('Failed to write location to localStorage:', e);
    }

    // Sync to user profile if logged in
    if (isAuthenticated) {
      try {
        await api.patch('/auth/location', {
          label: fullLoc.label,
          pincode: fullLoc.pincode,
          city: fullLoc.city,
          lat: fullLoc.lat,
          lng: fullLoc.lng,
        });
      } catch (err) {
        console.warn('Failed to sync location to profile:', err.message);
      }
    }

    setIsLocationModalOpen(false);
    setDetectedLocationCandidate(null);
  };

  const openLocationModal = (step = 1) => {
    setInitialStep(step);
    setIsLocationModalOpen(true);
  };

  const closeLocationModal = () => {
    setIsLocationModalOpen(false);
    setDetectedLocationCandidate(null);
  };

  const value = {
    selectedLocation: selectedLocation || DEFAULT_LOCATION,
    hasChosenLocation: !!selectedLocation,
    isLocationModalOpen,
    initialStep,
    detectedLocationCandidate,
    setDetectedLocationCandidate,
    openLocationModal,
    closeLocationModal,
    selectLocation,
    popularLocations: POPULAR_LOCATIONS,
    checkIsServiceable,
    hasCheckedInitial,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;
