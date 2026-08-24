import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  X,
  Navigation as LocateIcon,
  Check,
  Sparkles,
  Clock,
  ChevronRight,
  Pencil,
  AlertCircle,
  Truck,
  ArrowLeft,
  Store,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export default function LocationModal() {
  const {
    isLocationModalOpen,
    closeLocationModal,
    selectedLocation,
    selectLocation,
    popularLocations,
    hasChosenLocation,
    initialStep,
    detectedLocationCandidate,
    checkIsServiceable,
  } = useLocation();

  // Current Modal Step: 1 = Search & Select, 2 = Confirm Location
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [candidateLocation, setCandidateLocation] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState('');

  // Sync initial step & detected location when modal opens
  useEffect(() => {
    if (isLocationModalOpen) {
      if (initialStep === 2 && detectedLocationCandidate) {
        setCandidateLocation(detectedLocationCandidate);
        setStep(2);
      } else {
        setCandidateLocation(selectedLocation || popularLocations[0]);
        setStep(1);
      }
      setSearchTerm('');
      setDetectError('');
    }
  }, [isLocationModalOpen, initialStep, detectedLocationCandidate, selectedLocation, popularLocations]);

  // Close on Escape key press (only if a location has already been chosen)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLocationModalOpen && hasChosenLocation) {
        closeLocationModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocationModalOpen, closeLocationModal, hasChosenLocation]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isLocationModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLocationModalOpen]);

  if (!isLocationModalOpen) return null;

  const filteredLocations = popularLocations.filter((loc) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      loc.label.toLowerCase().includes(query) ||
      loc.pincode.includes(query) ||
      loc.city.toLowerCase().includes(query) ||
      (loc.fullAddress && loc.fullAddress.toLowerCase().includes(query))
    );
  });

  // Step 1 GPS Action: OpenStreetMap Nominatim reverse geocode -> Jump to Step 2
  const handleUseCurrentLocation = () => {
    setIsDetecting(true);
    setDetectError('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
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
              'My Current Location';
            const city = address.city || address.town || address.state_district || 'Mumbai';
            const pincode = address.postcode || '400001';
            const isServ = checkIsServiceable(city, pincode);

            const detected = {
              label: area,
              fullAddress: data?.display_name || `${area}, ${city}, Maharashtra - ${pincode}`,
              city,
              pincode,
              lat: latitude,
              lng: longitude,
              slotText: 'Today, 4 PM - 6 PM',
              isServiceable: isServ,
              storeName: isServ ? `${area} Express Store` : 'Outside Delivery Zone',
            };

            setIsDetecting(false);
            setCandidateLocation(detected);
            setStep(2);
          } catch (err) {
            console.warn('Reverse geocode error:', err.message);
            setIsDetecting(false);
            // Fallback candidate
            const fallback = {
              label: 'Downtown Mumbai (Detected)',
              fullAddress: 'Fort, M.G. Road, Downtown Mumbai, Maharashtra - 400001',
              city: 'Mumbai',
              pincode: '400001',
              lat: latitude,
              lng: longitude,
              slotText: 'Today, 4 PM - 6 PM',
              isServiceable: true,
              storeName: 'Downtown Mumbai Flagship Store',
            };
            setCandidateLocation(fallback);
            setStep(2);
          }
        },
        (err) => {
          setIsDetecting(false);
          setDetectError('Location access was denied. Please pick your area below.');
        },
        { timeout: 8000 }
      );
    } else {
      setIsDetecting(false);
      setDetectError('Geolocation is not supported by your browser.');
    }
  };

  // Step 1 Custom Search Submit
  const handleCustomSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    if (filteredLocations.length > 0) {
      setCandidateLocation(filteredLocations[0]);
      setStep(2);
    } else {
      const isPin = /^\d{6}$/.test(searchTerm.trim());
      const customLoc = {
        label: searchTerm.trim(),
        fullAddress: `${searchTerm.trim()}, Maharashtra - ${isPin ? searchTerm.trim() : '400001'}`,
        city: 'Mumbai',
        pincode: isPin ? searchTerm.trim() : '400001',
        slotText: 'Today, 4 PM - 6 PM',
        lat: 19.076,
        lng: 72.8777,
        storeName: 'Mini D-Mart Store',
        isServiceable: checkIsServiceable('Mumbai', isPin ? searchTerm.trim() : '400001'),
      };
      setCandidateLocation(customLoc);
      setStep(2);
    }
  };

  // Step 2 Confirm Action
  const handleConfirmLocation = () => {
    if (!candidateLocation) return;
    selectLocation(candidateLocation);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-0 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      {/* Dimmed backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => {
          if (hasChosenLocation) closeLocationModal();
        }}
        aria-hidden="true"
      />

      {/* Modal Container: Full Screen on Mobile, Centered on Tablet/Desktop */}
      <div className="relative bg-white rounded-none sm:rounded-2xl border-0 sm:border border-border shadow-2xl w-full h-full sm:h-auto sm:max-w-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between">
        {/* ========================================================================= */}
        {/* STEP 1: Search & Choose Delivery Location                                */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="flex flex-col h-full sm:h-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-bg/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 id="location-modal-title" className="font-bold text-base sm:text-lg text-text">
                    Choose delivery location
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    Step 1 of 2: Select your area to see store slots & availability
                  </p>
                </div>
              </div>

              {hasChosenLocation && (
                <button
                  type="button"
                  onClick={closeLocationModal}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-400 hover:text-text flex items-center justify-center transition-colors cursor-pointer border border-border"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body Content */}
            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto max-h-[60vh] sm:max-h-[62vh]">
              {/* Search Bar */}
              <form onSubmit={handleCustomSearchSubmit} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="location-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for area, street name or 6-digit pincode..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-bg text-text text-xs sm:text-sm focus:outline-none focus:border-primary focus:bg-white transition-all shadow-2xs"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Use Current GPS Location Button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetecting}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <LocateIcon className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-primary">
                      {isDetecting ? 'Detecting GPS Coordinates via OpenStreetMap...' : 'Use current location'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {detectError || 'Auto-detect using GPS for instant 2-hr delivery'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Available Store Locations List with Explicit SELECT Buttons */}
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  {searchTerm ? 'Matching Delivery Hubs' : 'Available Store Locations'}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => {
                      const isSelected =
                        candidateLocation?.pincode === loc.pincode &&
                        candidateLocation?.label?.toLowerCase() === loc.label.toLowerCase();

                      return (
                        <div
                          key={`${loc.label}-${loc.pincode}`}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-xs'
                              : 'border-border bg-white hover:border-primary/40 hover:bg-bg/50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-text flex items-center gap-1.5">
                              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                              <span className="truncate">{loc.label}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                              PIN: {loc.pincode} • {loc.city}
                            </div>
                            <div className="text-[10px] text-primary flex items-center gap-1 mt-1 font-medium">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <span>{loc.slotText}</span>
                            </div>
                          </div>

                          {/* Explicit Select Button */}
                          <button
                            type="button"
                            onClick={() => setCandidateLocation(loc)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                              isSelected
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-bg text-text hover:bg-primary/10 hover:text-primary border border-border'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select</span>
                            )}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-500 space-y-2">
                      <p>No predefined hub matching "{searchTerm}".</p>
                      <button
                        type="button"
                        onClick={handleCustomSearchSubmit}
                        className="px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg text-xs hover:bg-primary/20 cursor-pointer"
                      >
                        Use "{searchTerm}" as custom location
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Persistent Primary CTA Button at Bottom */}
            <div className="p-4 sm:p-5 border-t border-border bg-white shrink-0 space-y-2">
              <button
                type="button"
                disabled={!candidateLocation}
                onClick={() => setStep(2)}
                className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-2"
              >
                <span>Continue to Confirm</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Confirm Location Screen                                         */}
        {/* ========================================================================= */}
        {step === 2 && candidateLocation && (
          <div className="flex flex-col h-full sm:h-auto justify-between">
            {/* Header with Back Button & Close */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-bg/40 shrink-0">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Search</span>
              </button>

              {hasChosenLocation && (
                <button
                  type="button"
                  onClick={closeLocationModal}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-400 hover:text-text flex items-center justify-center transition-colors cursor-pointer border border-border"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body: Location Confirmation Details & Visual Status */}
            <div className="p-5 sm:p-6 space-y-5 text-center flex-1 overflow-y-auto">
              {/* Illustration / Graphic */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-emerald-100 via-primary/15 to-teal-100 flex items-center justify-center text-4xl shadow-inner border border-primary/20 animate-in zoom-in-75 duration-300">
                  {candidateLocation.isServiceable ? '🛵' : '📍'}
                </div>
              </div>

              {/* Status Heading & Subtext */}
              {candidateLocation.isServiceable ? (
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>Serviceable Area</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-text tracking-tight">
                    Great, we are available here!
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Express 2-hour doorstep delivery & store pickup available in your zone.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/10 text-error font-bold text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Outside Current Delivery Radius</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-text tracking-tight">
                    We don't deliver here yet
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    We are expanding rapidly. Please select one of our active store branches to browse available catalog items.
                  </p>
                </div>
              )}

              {/* Formatted Address Box with Pencil Edit Button */}
              <div className="bg-bg rounded-2xl border border-border p-4 text-left relative group">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                      <Store className="w-3 h-3 text-primary" />
                      <span>{candidateLocation.storeName || 'Assigned Store Branch'}</span>
                    </div>
                    <div className="font-extrabold text-sm sm:text-base text-text">
                      {candidateLocation.label}
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed font-medium">
                      {candidateLocation.fullAddress}
                    </div>
                    <div className="text-[11px] text-gray-500 pt-1">
                      City: <strong>{candidateLocation.city}</strong> • PIN Code: <strong>{candidateLocation.pincode}</strong>
                    </div>
                  </div>

                  {/* Small Pencil Edit Icon to go back to Step 1 */}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    title="Change location"
                    aria-label="Edit location"
                    className="w-8 h-8 rounded-xl bg-white hover:bg-primary hover:text-white text-gray-500 border border-border flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {candidateLocation.isServiceable && (
                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-bold">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Earliest Slot</span>
                    </span>
                    <span>{candidateLocation.slotText || 'Today, 4 PM - 6 PM'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="p-4 sm:p-5 border-t border-border bg-white shrink-0 space-y-2">
              {candidateLocation.isServiceable ? (
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  className="w-full py-3.5 px-4 bg-primary text-white font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>CONFIRM LOCATION</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-3.5 px-4 bg-accent text-text font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>CHOOSE ANOTHER LOCATION</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
