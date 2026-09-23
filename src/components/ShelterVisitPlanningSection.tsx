import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CloudSun,
  Search,
  AlertCircle,
  RefreshCw,
  Compass,
  Umbrella,
  Sun,
  Navigation,
  Clock,
  CheckCircle2,
  Star,
  MapPin,
  X,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

interface DirectService {
  type?: 'direct';
  ServiceNo: string;
  stopsAway: number;
  distanceKm: number;
  lastBus: string;
  nextBuses?: number[];
}

interface OneChangeLeg1 {
  ServiceNo: string;
  stops: number;
  distanceKm: number;
  nextBuses?: number[];
}

interface OneChangeInterchange {
  code: string;
  description?: string;
  roadName?: string;
}

interface OneChangeLeg2 {
  ServiceNo: string;
  stops: number;
  distanceKm: number;
}

interface OneChangeOption {
  type: 'one_change';
  totalStops: number;
  leg1: OneChangeLeg1;
  interchange: OneChangeInterchange;
  leg2: OneChangeLeg2;
}

interface RouteSearchResponse {
  from: string;
  fromDescription?: string;
  fromRoadName?: string;
  destination: string;
  destinationDescription?: string;
  type?: 'direct' | 'one_change' | 'none';
  services?: DirectService[];
  directServices?: DirectService[];
  oneChangeServices?: OneChangeOption[];
  message?: string;
  error?: string;
}

interface WeatherData {
  area: string;
  forecast: string;
  valid_period: string;
}

interface KnownStop {
  code: string;
  name: string;
  road?: string;
  hint?: string;
  lat: number;
  lng: number;
}

// Curated Singapore Transit Hubs for instant recognition & nearby geolocation
const POPULAR_QUICK_STOPS: KnownStop[] = [
  { code: '77009', name: 'Pasir Ris Int', road: 'Pasir Ris Dr 3', hint: 'Shelter Hub', lat: 1.3801, lng: 103.9493 },
  { code: '77031', name: 'Opp Pasir Ris Stn', road: 'Pasir Ris Ctrl', hint: 'MRT Exit B', lat: 1.3734, lng: 103.9482 },
  { code: '75009', name: 'Tampines Int', road: 'Tampines Ctrl 1', hint: 'Direct Hub', lat: 1.3533, lng: 103.9452 },
  { code: '84009', name: 'Bedok Int', road: 'Bedok North Ave 1', hint: 'East Coast', lat: 1.3243, lng: 103.9304 },
  { code: '98011', name: 'Loyang Pt', road: 'Loyang Ave', hint: 'Loyang Hub', lat: 1.3705, lng: 103.9658 },
  { code: '65009', name: 'Punggol Temp Int', road: 'Punggol Pl', hint: 'Northeast', lat: 1.4042, lng: 103.9022 }
];

// Offline fallback dictionary of known Singapore transit stops for instant recognition
const KNOWN_STOP_NAMES: Record<string, { name: string; road?: string }> = {
  '77009': { name: 'Pasir Ris Interchange', road: 'Pasir Ris Dr 3' },
  '77031': { name: 'Opposite Pasir Ris Station', road: 'Pasir Ris Ctrl' },
  '77039': { name: 'Pasir Ris Station', road: 'Pasir Ris Ctrl' },
  '75009': { name: 'Tampines Bus Interchange', road: 'Tampines Ctrl 1' },
  '84009': { name: 'Bedok Bus Interchange', road: 'Bedok North Ave 1' },
  '98011': { name: 'Loyang Point', road: 'Loyang Ave' },
  '98019': { name: 'Opposite Loyang Point', road: 'Loyang Ave' },
  '65009': { name: 'Punggol Temporary Interchange', road: 'Punggol Place' },
  '67009': { name: 'Sengkang Bus Interchange', road: 'Sengkang Sq' },
  '04121': { name: 'Opposite The Treasury', road: 'North Bridge Rd' },
  '04111': { name: 'Grand Park City Hall', road: 'Coleman St' },
  '03019': { name: 'Apollo Centre', road: 'Havelock Rd' },
  '08057': { name: 'Dhoby Ghaut Station', road: 'Orchard Rd' },
  '09048': { name: 'Orchard Station / Lucky Plaza', road: 'Orchard Rd' },
  '28009': { name: 'Jurong East Bus Interchange', road: 'Jurong Gateway Rd' },
  '46009': { name: 'Woodlands Temporary Interchange', road: 'Woodlands Sq' },
  '59009': { name: 'Yishun Bus Interchange', road: 'Yishun Ave 2' },
  '53009': { name: 'Bishan Bus Interchange', road: 'Bishan Place' },
  '52009': { name: 'Ang Mo Kio Interchange', road: 'Ang Mo Kio Ave 8' },
  '76009': { name: 'Tampines Concourse Interchange', road: 'Tampines Concourse' }
};

export const ShelterVisitPlanningSection: React.FC = () => {
  // Panel A: Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Panel B: Route Finder State
  const [stopCodeInput, setStopCodeInput] = useState<string>('');
  const [routesLoading, setRoutesLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [justRefreshed, setJustRefreshed] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatedTimeText, setUpdatedTimeText] = useState<string>('');
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RouteSearchResponse | null>(null);

  // Category view for Quick Stops / Favourites / Recent
  const [stopsCategory, setStopsCategory] = useState<'quick' | 'favorites' | 'recent'>('quick');

  // Geolocation & Quick Stops State
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Favourites state (stored in localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('paws_fav_stops');
      return saved ? JSON.parse(saved) : ['77009', '75009'];
    } catch {
      return ['77009', '75009'];
    }
  });

  // Recent stops (stored in localStorage)
  const [recentStops, setRecentStops] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('paws_recent_stops');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Undo accidental removal of favorite
  const [undoRemoval, setUndoRemoval] = useState<{ code: string; name: string } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get prominent stop name and secondary detail
  const getStopDisplay = (code: string, desc?: string, road?: string): { name: string; roadInfo: string } => {
    if (desc && desc.trim()) {
      return {
        name: desc.trim(),
        roadInfo: road && road.trim() ? road.trim() : ''
      };
    }
    if (KNOWN_STOP_NAMES[code]) {
      const k = KNOWN_STOP_NAMES[code];
      return {
        name: k.name,
        roadInfo: k.road || ''
      };
    }
    return {
      name: `Bus Stop ${code}`,
      roadInfo: ''
    };
  };

  // Relative timestamp calculation for last updated
  const calculateRelativeTime = (date: Date | null): string => {
    if (!date) return '';
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 45) return 'Updated just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin <= 1) return 'Updated 1 min ago';
    if (diffMin < 60) return `Updated ${diffMin} mins ago`;
    return `Updated at ${date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Periodic ticker to keep timestamp relative representation fresh
  useEffect(() => {
    if (!lastUpdated) return;
    setUpdatedTimeText(calculateRelativeTime(lastUpdated));
    const interval = setInterval(() => {
      setUpdatedTimeText(calculateRelativeTime(lastUpdated));
    }, 15000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Fetch Weather once and poll every 5 minutes (data.gov.sg rate limit friendly)
  const fetchWeather = useCallback(async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      const res = await fetch('/api/weather');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Weather status ${res.status}`);
      }
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load weather';
      setWeatherError(msg);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const weatherInterval = setInterval(() => {
      fetchWeather();
    }, 300000);
    return () => clearInterval(weatherInterval);
  }, [fetchWeather]);

  // Perform route and arrival search with duplicate prevention and error prevention
  const performSearch = async (code: string, isBackgroundRefresh = false) => {
    const cleanCode = code.trim();

    // Error Prevention: Ensure input is exactly 5 numeric digits
    if (!cleanCode) {
      setRoutesError('Please enter a 5-digit bus stop code.');
      return;
    }

    if (!/^\d{5}$/.test(cleanCode)) {
      setRoutesError('A Singapore bus stop code must be exactly 5 digits (e.g. 04121).');
      return;
    }

    // Prevent duplicate action: If already displaying this stop with current data and user taps search, refresh instead
    if (!isBackgroundRefresh && routeResult && routeResult.from === cleanCode && !routesError) {
      isBackgroundRefresh = true;
    }

    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setRoutesLoading(true);
      setRouteResult(null);
    }
    setRoutesError(null);

    try {
      const res = await fetch(`/api/routes-to-shelter?from=${encodeURIComponent(cleanCode)}`);
      const data: RouteSearchResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      setRouteResult(data);
      const updateDate = new Date();
      setLastUpdated(updateDate);
      setUpdatedTimeText('Updated just now');

      // Save to recent searches (Recognition rather than recall)
      setRecentStops((prev) => {
        const next = [cleanCode, ...prev.filter((c) => c !== cleanCode)].slice(0, 4);
        try {
          localStorage.setItem('paws_recent_stops', JSON.stringify(next));
        } catch {
          // ignore localStorage failure
        }
        return next;
      });

      if (isBackgroundRefresh) {
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load live bus arrivals. Try again.';
      setRoutesError(msg);
    } finally {
      setRoutesLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearchRoutes = (e: React.FormEvent) => {
    e.preventDefault();
    if (routesLoading || isRefreshing) return;
    performSearch(stopCodeInput);
  };

  // Error Prevention: Strict input sanitation (digits only, max 5)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 5);
    setStopCodeInput(digitsOnly);
    if (routesError) setRoutesError(null);
  };

  const handleClearInput = () => {
    setStopCodeInput('');
    setRoutesError(null);
  };

  const handleSelectQuickStop = (code: string) => {
    if (routesLoading || isRefreshing) return;
    setStopCodeInput(code);
    performSearch(code);
  };

  // Nearby Stops Geolocation
  const handleLocateNearbyStops = () => {
    if (locationStatus === 'locating') return;

    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationMessage('Location access is not supported by your browser. Please enter a 5-digit stop code below.');
      return;
    }

    setLocationStatus('locating');
    setLocationMessage('Finding nearby bus stops...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest = POPULAR_QUICK_STOPS[0];
        let minDistanceKm = Infinity;

        for (const stop of POPULAR_QUICK_STOPS) {
          const dLat = (stop.lat - latitude) * 111;
          const dLng = (stop.lng - longitude) * 111 * Math.cos((latitude * Math.PI) / 180);
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          if (dist < minDistanceKm) {
            minDistanceKm = dist;
            nearest = stop;
          }
        }

        const distanceText = minDistanceKm < 1 ? `${Math.round(minDistanceKm * 1000)}m` : `${minDistanceKm.toFixed(1)}km`;
        setLocationStatus('success');
        setLocationMessage(`Located nearest hub: ${nearest.name} (${nearest.code}) • ~${distanceText} away`);
        setStopCodeInput(nearest.code);
        performSearch(nearest.code);
      },
      (err) => {
        setLocationStatus('error');
        if (err.code === 1) {
          setLocationMessage('Location permission denied. Enter a 5-digit stop code below or choose from quick stops.');
        } else if (err.code === 2) {
          setLocationMessage('Location unavailable. Check GPS connection or select a quick stop below.');
        } else {
          setLocationMessage('Location request timed out. Select a quick stop below or enter a 5-digit code.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Toggle Favourites with Duplicate Prevention & Undo Capability
  const toggleFavorite = (code: string) => {
    if (!code || !/^\d{5}$/.test(code)) return;
    const isFav = favorites.includes(code);
    const stopInfo = getStopDisplay(code);

    if (isFav) {
      // Remove from favorites and provide undo
      setFavorites((prev) => {
        const next = prev.filter((c) => c !== code);
        try {
          localStorage.setItem('paws_fav_stops', JSON.stringify(next));
        } catch {
          // ignore localStorage error
        }
        return next;
      });

      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoRemoval({ code, name: stopInfo.name });
      undoTimeoutRef.current = setTimeout(() => {
        setUndoRemoval(null);
      }, 6000);
    } else {
      // Add to favorites (strictly unique)
      setFavorites((prev) => {
        const next = Array.from(new Set([...prev, code]));
        try {
          localStorage.setItem('paws_fav_stops', JSON.stringify(next));
        } catch {
          // ignore localStorage error
        }
        return next;
      });
      if (undoRemoval?.code === code) {
        setUndoRemoval(null);
      }
    }
  };

  const handleUndoRemoval = () => {
    if (!undoRemoval) return;
    const code = undoRemoval.code;
    setFavorites((prev) => {
      const next = Array.from(new Set([...prev, code]));
      try {
        localStorage.setItem('paws_fav_stops', JSON.stringify(next));
      } catch {
        // ignore localStorage error
      }
      return next;
    });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoRemoval(null);
  };

  // Derive plain advice from the actual forecast string
  const getForecastAdvice = (forecast: string): { text: string; isRain: boolean } => {
    const text = (forecast || '').toLowerCase();
    if (text.includes('rain') || text.includes('shower') || text.includes('thundery')) {
      return { text: 'Rain about — bring an umbrella', isRain: true };
    }
    return { text: 'Fine for a shelter visit', isRain: false };
  };

  const formatValidPeriodSentence = (period?: string) => {
    if (!period) return '';
    const clean = period.trim();
    const withPeriod = clean.endsWith('.') ? clean : `${clean}.`;
    return `Forecast for ${withPeriod}`;
  };

  // Formatting live bus arrivals:
  // - 0 means arriving
  // - > 0 means minutes
  // - empty means no buses running currently
  const formatRouteNextBuses = (nextBuses?: number[]) => {
    if (!nextBuses || nextBuses.length === 0) {
      return 'no buses running currently';
    }

    const formatted = nextBuses.map((m) => (m < 1 ? 'arriving' : `${m} min`));
    if (formatted.length === 1) {
      return formatted[0] === 'arriving' ? 'next bus arriving' : `next bus in ${formatted[0]}`;
    }
    if (formatted[0] === 'arriving') {
      return `next bus arriving and another in ${formatted[1]}`;
    }
    return `next buses in ${formatted[0]} and ${formatted[1]}`;
  };

  // Sentence formatter for one-change journeys:
  const formatOneChangeSentence = (opt: OneChangeOption): string => {
    const leg1StopText = `${opt.leg1.stops} ${opt.leg1.stops === 1 ? 'stop' : 'stops'}`;
    const leg2StopText = `${opt.leg2.stops} ${opt.leg2.stops === 1 ? 'stop' : 'stops'}`;
    const totalStopText = `${opt.totalStops} ${opt.totalStops === 1 ? 'stop' : 'stops'}`;

    const interchangeText = opt.interchange.description && opt.interchange.description.trim().length > 0
      ? `${opt.interchange.description.trim()} (${opt.interchange.code})`
      : opt.interchange.code;

    let arrivalSentence = `No ${opt.leg1.ServiceNo} running currently.`;
    if (opt.leg1.nextBuses && opt.leg1.nextBuses.length > 0) {
      const firstBus = opt.leg1.nextBuses[0];
      if (firstBus < 1) {
        arrivalSentence = `Next ${opt.leg1.ServiceNo} arriving.`;
      } else {
        arrivalSentence = `Next ${opt.leg1.ServiceNo} in ${firstBus} min.`;
      }
    }

    return `Take ${opt.leg1.ServiceNo} for ${leg1StopText} to ${interchangeText}, then ${opt.leg2.ServiceNo} for ${leg2StopText} to Pasir Ris Interchange. ${totalStopText} in total. ${arrivalSentence}`;
  };

  // Determine which results exist
  const directList = routeResult?.directServices || (routeResult?.type === 'direct' ? routeResult.services : []) || [];
  const oneChangeList = routeResult?.oneChangeServices || [];
  const hasDirect = directList.length > 0;
  const hasOneChange = !hasDirect && oneChangeList.length > 0;
  const hasNeither = routeResult && !hasDirect && !hasOneChange;

  // Check if all available services have no buses currently running (e.g. late night)
  const isNoBusesRunningCurrently = () => {
    if (hasDirect) {
      return directList.every((svc) => !svc.nextBuses || svc.nextBuses.length === 0);
    }
    if (hasOneChange) {
      return oneChangeList.every((opt) => !opt.leg1.nextBuses || opt.leg1.nextBuses.length === 0);
    }
    return false;
  };

  // Active searched stop details
  const currentStopDisplay = routeResult
    ? getStopDisplay(routeResult.from, routeResult.fromDescription, routeResult.fromRoadName)
    : null;

  // Real-time input validation message
  const getInputValidationNote = () => {
    if (stopCodeInput.length === 0) {
      return { text: 'Singapore stop codes are 5 digits and leading zeroes count (e.g. 04121).', type: 'info' };
    }
    if (stopCodeInput.length < 5) {
      const remaining = 5 - stopCodeInput.length;
      return {
        text: `5 digits required — enter ${remaining} more digit${remaining > 1 ? 's' : ''}.`,
        type: 'warning'
      };
    }
    const known = KNOWN_STOP_NAMES[stopCodeInput];
    if (known) {
      return { text: `✓ Ready to search: ${known.name}`, type: 'success' };
    }
    return { text: '✓ Valid 5-digit format ready to search', type: 'success' };
  };

  const validationNote = getInputValidationNote();

  return (
    <section
      id="planning-visit-section"
      aria-label="Planning a visit to the shelter"
      className="space-y-5 sm:space-y-6"
    >
      {/* Section Header */}
      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-warmgray-900 tracking-tight">
          Planning a visit to the shelter
        </h2>
        <p className="text-sm sm:text-base text-warmgray-600 font-medium">
          Two things worth checking before you come — the weather, and how to get here. Both are live.
        </p>
      </div>

      {/* Two Live Panels: Side by Side on Desktop, Stacked on Mobile with Route Finder first */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* PANEL A: How's the weather at Pasir Ris?
            On mobile: order-2 (rendered below Route Finder).
            On desktop: order-1 (left column). */}
        <div
          id="weather-panel"
          className="order-2 lg:order-1 bg-white border-2 border-[#DDD2C6] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-md flex flex-col justify-between space-y-6"
        >
          <div className="space-y-5">
            {/* Header & Live Data Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE8]">
              <div className="flex items-center gap-2">
                <CloudSun className="w-6 h-6 text-amber-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-warmgray-500">
                  Pasir Ris Weather
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                LIVE DATA
              </span>
            </div>

            {/* Panel Heading */}
            <h3 className="text-2xl sm:text-3xl font-extrabold text-warmgray-900 tracking-tight leading-snug">
              How&apos;s the weather at Pasir Ris?
            </h3>

            {/* Weather Content Area */}
            {weatherLoading && !weather && (
              <div className="py-8 text-center space-y-2 text-warmgray-500 animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                <p className="text-sm font-medium">Checking live Singapore weather forecast...</p>
              </div>
            )}

            {weatherError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Weather data temporarily unavailable</p>
                  <p className="text-xs text-amber-800">{weatherError}</p>
                </div>
              </div>
            )}

            {weather && (
              <div className="space-y-4">
                <div className="pt-2">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-warmgray-900 tracking-tight leading-none">
                    {weather.forecast}
                  </div>
                </div>

                <p className="text-sm sm:text-base text-warmgray-600 font-medium">
                  {formatValidPeriodSentence(weather.valid_period)}
                </p>

                {(() => {
                  const advice = getForecastAdvice(weather.forecast);
                  return (
                    <div
                      className={`p-4 rounded-2xl border flex items-center gap-3 ${
                        advice.isRain
                          ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950'
                      }`}
                    >
                      {advice.isRain ? (
                        <Umbrella className="w-5 h-5 text-blue-600 shrink-0" />
                      ) : (
                        <Sun className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                      <span className="text-sm sm:text-base font-bold">
                        {advice.text}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F2EDE8] text-xs text-warmgray-400 font-medium flex items-center justify-between">
            <span>Source: data.gov.sg 2-hour forecast</span>
            <span>Station: Pasir Ris</span>
          </div>
        </div>

        {/* PANEL B: How do I get to the shelter?
            On mobile: order-1 (rendered first).
            On desktop: order-2 (right column). */}
        <div
          id="how-do-i-get-there-panel"
          className="order-1 lg:order-2 bg-white border-2 border-[#DDD2C6] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-md flex flex-col justify-between space-y-6"
        >
          <div className="space-y-5">
            {/* Header & Status Badges */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE8] gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-6 h-6 text-terracotta-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-warmgray-500">
                  BUS ROUTE FINDER
                </span>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-2">
                {justRefreshed ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-xs transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Updated just now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    LIVE DATA
                  </span>
                )}
              </div>
            </div>

            {/* Panel Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-warmgray-900 tracking-tight leading-snug">
                How do I get to the shelter?
              </h3>
              {lastUpdated && (
                <span className="inline-flex items-center gap-1 text-xs text-warmgray-500 font-medium shrink-0">
                  <Clock className="w-3.5 h-3.5 text-warmgray-400" />
                  <span>{updatedTimeText}</span>
                </span>
              )}
            </div>

            {/* Location Status Feedback Banner */}
            {locationStatus !== 'idle' && (
              <div
                className={`p-3 rounded-2xl text-xs sm:text-sm flex items-start justify-between gap-2 transition-all ${
                  locationStatus === 'locating'
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : locationStatus === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  {locationStatus === 'locating' && (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                  )}
                  {locationStatus === 'success' && (
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {locationStatus === 'error' && (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-medium leading-tight">{locationMessage}</span>
                </div>
                {locationStatus !== 'locating' && (
                  <button
                    type="button"
                    onClick={() => setLocationStatus('idle')}
                    className="text-warmgray-400 hover:text-warmgray-700 text-xs px-1 font-bold shrink-0"
                    aria-label="Dismiss location message"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Undo Removal Notification (Error Prevention: Allows quick recovery without modal dialogs) */}
            {undoRemoval && (
              <div className="p-3 rounded-2xl bg-warmgray-900 text-white text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="leading-snug truncate">
                  Removed <strong>{undoRemoval.name}</strong> from favourites
                </span>
                <button
                  type="button"
                  onClick={handleUndoRemoval}
                  className="px-2.5 py-1 rounded-lg bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              </div>
            )}

            {/* Stop code input form with Error Prevention (Strict 5-digit validation, Clear action, Disabled state) */}
            <form onSubmit={handleSearchRoutes} className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="bus-stop-code-hero-input" className="block text-sm font-bold text-warmgray-800">
                  Enter the bus stop code nearest you
                </label>

                {/* Location Detection Button */}
                <button
                  type="button"
                  onClick={handleLocateNearbyStops}
                  disabled={locationStatus === 'locating'}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 hover:text-terracotta-700 active:text-terracotta-800 transition-colors focus:outline-none focus:ring-1 focus:ring-terracotta-500 rounded px-1.5 py-0.5 disabled:opacity-50"
                  title="Find nearest bus stop to my current location"
                >
                  <Navigation className={`w-3.5 h-3.5 ${locationStatus === 'locating' ? 'animate-spin' : ''}`} />
                  <span>{locationStatus === 'locating' ? 'Finding nearby bus stops...' : 'Find nearby stops'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="relative flex-1">
                  <input
                    id="bus-stop-code-hero-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    value={stopCodeInput}
                    onChange={handleInputChange}
                    placeholder="e.g. 04121"
                    aria-describedby="stop-code-instruction-note"
                    className="w-full h-12 sm:h-14 pl-4 pr-16 rounded-2xl border-2 border-[#D6CBC0] bg-[#FAF8F5] text-base sm:text-lg text-warmgray-900 placeholder:text-warmgray-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500 font-mono tracking-widest shadow-inner"
                  />

                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Clear Button */}
                    {stopCodeInput.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearInput}
                        className="p-1 rounded-full text-warmgray-400 hover:text-warmgray-700 transition-colors focus:outline-none"
                        title="Clear input"
                        aria-label="Clear stop code"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Favourite Star Toggle for Active Input */}
                    {stopCodeInput.length === 5 && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(stopCodeInput)}
                        className="p-1 text-warmgray-400 hover:text-amber-500 transition-colors focus:outline-none"
                        title={
                          favorites.includes(stopCodeInput)
                            ? 'Saved to favourites (tap to remove)'
                            : 'Save as favourite stop'
                        }
                        aria-label={
                          favorites.includes(stopCodeInput)
                            ? 'Remove from favourite stops'
                            : 'Save as favourite stop'
                        }
                      >
                        <Star
                          className={`w-5 h-5 ${
                            favorites.includes(stopCodeInput)
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-warmgray-300'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Search Button: Disabled if invalid length or currently loading */}
                <button
                  id="btn-search-shelter-routes"
                  type="submit"
                  disabled={routesLoading || isRefreshing || stopCodeInput.trim().length !== 5}
                  className="h-12 sm:h-14 px-5 sm:px-7 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white font-bold text-sm sm:text-base transition-colors shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>

              {/* Real-time Inline Validation Note (Error Prevention) */}
              <div className="flex items-center justify-between text-xs">
                <p
                  id="stop-code-instruction-note"
                  className={`font-medium transition-colors ${
                    validationNote.type === 'warning'
                      ? 'text-amber-700'
                      : validationNote.type === 'success'
                      ? 'text-emerald-700'
                      : 'text-warmgray-500'
                  }`}
                >
                  {validationNote.text}
                </p>
                <span className="font-mono text-warmgray-400 text-[11px]">
                  {stopCodeInput.length}/5 digits
                </span>
              </div>

              {/* RECOGNITION RATHER THAN RECALL: Segmented Navigation for Quick Stops, Favourites, and Recent */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-1 border-b border-[#EDE6DF] pb-1.5 text-xs font-semibold text-warmgray-500">
                  <button
                    type="button"
                    onClick={() => setStopsCategory('quick')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      stopsCategory === 'quick'
                        ? 'bg-warmgray-200/80 text-warmgray-900 font-bold'
                        : 'text-warmgray-500 hover:text-warmgray-800'
                    }`}
                  >
                    Quick Stops
                  </button>

                  <button
                    type="button"
                    onClick={() => setStopsCategory('favorites')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      stopsCategory === 'favorites'
                        ? 'bg-amber-100/90 text-amber-900 font-bold'
                        : 'text-warmgray-500 hover:text-warmgray-800'
                    }`}
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>Favourites ({favorites.length})</span>
                  </button>

                  {recentStops.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStopsCategory('recent')}
                      className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        stopsCategory === 'recent'
                          ? 'bg-warmgray-200/80 text-warmgray-900 font-bold'
                          : 'text-warmgray-500 hover:text-warmgray-800'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-warmgray-500" />
                      <span>Recent ({recentStops.length})</span>
                    </button>
                  )}
                </div>

                {/* Category 1: Quick Transit Interchanges */}
                {stopsCategory === 'quick' && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {POPULAR_QUICK_STOPS.map((qs) => {
                      const isSelected = stopCodeInput === qs.code || routeResult?.from === qs.code;
                      return (
                        <button
                          key={qs.code}
                          type="button"
                          onClick={() => handleSelectQuickStop(qs.code)}
                          disabled={routesLoading || isRefreshing}
                          className={`px-3 py-1.5 rounded-xl font-medium transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
                            isSelected
                              ? 'bg-terracotta-100 border-terracotta-500 text-terracotta-900 font-bold ring-2 ring-terracotta-400/30'
                              : 'bg-[#FAF8F5] border-[#E5DDD4] text-warmgray-700 hover:bg-warmgray-100 hover:text-warmgray-900'
                          }`}
                        >
                          <span className="font-bold">{qs.name}</span>
                          <span className="font-mono text-[11px] opacity-70">({qs.code})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Category 2: Favourites */}
                {stopsCategory === 'favorites' && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {favorites.length === 0 ? (
                      <p className="text-xs text-warmgray-400 italic py-1">
                        No saved favourite stops yet. Tap the star icon beside any stop code to save it here.
                      </p>
                    ) : (
                      favorites.map((favCode) => {
                        const display = getStopDisplay(favCode);
                        const isSelected = stopCodeInput === favCode || routeResult?.from === favCode;
                        return (
                          <div
                            key={favCode}
                            className={`inline-flex items-center rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-300/40'
                                : 'bg-[#FAF8F5] border-[#E5DDD4] text-warmgray-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectQuickStop(favCode)}
                              disabled={routesLoading || isRefreshing}
                              className="px-3 py-1.5 flex items-center gap-1.5 text-left disabled:opacity-50"
                            >
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                              <span className="font-bold">{display.name}</span>
                              <span className="font-mono text-[11px] opacity-70">({favCode})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleFavorite(favCode)}
                              className="px-2 py-1.5 text-warmgray-400 hover:text-rose-600 transition-colors border-l border-[#E5DDD4]"
                              title={`Remove ${display.name} from favourites`}
                              aria-label={`Remove ${display.name} from favourites`}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Category 3: Recent Searches */}
                {stopsCategory === 'recent' && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {recentStops.map((recCode) => {
                      const display = getStopDisplay(recCode);
                      const isSelected = stopCodeInput === recCode || routeResult?.from === recCode;
                      return (
                        <button
                          key={recCode}
                          type="button"
                          onClick={() => handleSelectQuickStop(recCode)}
                          disabled={routesLoading || isRefreshing}
                          className={`px-3 py-1.5 rounded-xl font-medium transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
                            isSelected
                              ? 'bg-warmgray-200 border-warmgray-400 text-warmgray-900 font-bold ring-2 ring-warmgray-300/40'
                              : 'bg-[#FAF8F5] border-[#E5DDD4] text-warmgray-700 hover:bg-warmgray-100 hover:text-warmgray-900'
                          }`}
                        >
                          <Clock className="w-3 h-3 text-warmgray-400 shrink-0" />
                          <span className="font-bold">{display.name}</span>
                          <span className="font-mono text-[11px] opacity-70">({recCode})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </form>

            {/* SKELETON LOADING STATE: Nielsen Heuristic #1 Visibility of System Status */}
            {routesLoading && (
              <div id="routes-loading-state" className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1 text-xs sm:text-sm">
                  <p className="font-bold text-amber-900 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-terracotta-600" />
                    Loading bus arrivals...
                  </p>
                  <p className="text-amber-800 leading-relaxed text-xs">
                    The first search may take up to a minute while route data loads, and later searches are instant.
                  </p>
                </div>

                {/* Skeleton placeholders so the content area is never left blank */}
                <div className="space-y-2.5 animate-pulse">
                  <div className="h-16 bg-warmgray-100 border border-[#EAE3DC] rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-2 w-3/4">
                      <div className="h-4 bg-warmgray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-warmgray-200/70 rounded w-2/3"></div>
                    </div>
                    <div className="h-6 w-16 bg-warmgray-200 rounded-full"></div>
                  </div>
                  <div className="h-16 bg-warmgray-100 border border-[#EAE3DC] rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-2 w-3/4">
                      <div className="h-4 bg-warmgray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-warmgray-200/70 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 w-16 bg-warmgray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}

            {/* TECHNICAL ERROR STATE: Clear explanation + visible retry action */}
            {routesError && !routesLoading && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-900 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                  <div className="space-y-0.5 flex-1">
                    <p className="font-bold text-rose-950">Unable to load live bus arrivals. Try again.</p>
                    <p className="text-rose-700 text-xs">{routesError}</p>
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => performSearch(stopCodeInput.trim())}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry search</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectQuickStop('77009')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-medium hover:bg-rose-100/50"
                  >
                    Try Pasir Ris Int (77009)
                  </button>
                </div>
              </div>
            )}

            {/* RESULTS VIEW */}
            {routeResult && !routesLoading && (
              <div id="route-results-container" className="space-y-4 pt-2">
                {/* PROMINENT STOP RECOGNITION CARD: Bus stop name made more prominent than code */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DDD2C6] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EFE8E0]">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Bus stop name is prominent */}
                        <h4 className="text-base sm:text-lg font-extrabold text-warmgray-900">
                          {currentStopDisplay?.name || `Bus Stop ${routeResult.from}`}
                        </h4>
                        {/* Bus stop code as secondary badge */}
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-warmgray-200/80 text-warmgray-800">
                          #{routeResult.from}
                        </span>
                      </div>
                      {currentStopDisplay?.roadInfo && (
                        <p className="text-xs text-warmgray-500 font-medium mt-0.5">
                          {currentStopDisplay.roadInfo}
                        </p>
                      )}
                    </div>

                    {/* Actions: Refresh & Favourite */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(routeResult.from)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                          favorites.includes(routeResult.from)
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-white border-[#D6CBC0] text-warmgray-700 hover:bg-warmgray-100'
                        }`}
                        title={
                          favorites.includes(routeResult.from)
                            ? 'Remove from favourites'
                            : 'Save as favourite stop'
                        }
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            favorites.includes(routeResult.from)
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-warmgray-400'
                          }`}
                        />
                        <span>{favorites.includes(routeResult.from) ? 'Saved' : 'Save'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => performSearch(routeResult.from, true)}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 border border-terracotta-200 active:bg-terracotta-200 disabled:opacity-60 transition-colors focus:outline-none"
                        title="Refresh live bus arrivals"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Destination Guidance */}
                  <div className="flex items-center gap-1.5 text-xs text-warmgray-600 font-medium">
                    <span>Route towards:</span>
                    <strong className="text-warmgray-900 font-bold flex items-center gap-1">
                      Pasir Ris Interchange (77009)
                      <ArrowRight className="w-3 h-3 text-terracotta-500 inline" />
                    </strong>
                    <span className="text-warmgray-400">Shelter Hub</span>
                  </div>
                </div>

                {/* NO BUSES CURRENTLY OPERATING (e.g. late night) */}
                {isNoBusesRunningCurrently() && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">No buses currently operating</p>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Routes were found, but services are not currently active. Most buses run daily between 05:30 and 23:30.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. Direct Buses */}
                {hasDirect && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-warmgray-500 uppercase tracking-wider pb-1">
                      Direct buses
                    </div>
                    {directList.map((svc) => (
                      <div
                        key={svc.ServiceNo}
                        id={`direct-service-${svc.ServiceNo}`}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E0] hover:border-terracotta-300 transition-colors"
                      >
                        <p className="text-sm sm:text-base font-semibold text-warmgray-900 leading-relaxed">
                          Service {svc.ServiceNo} &mdash; {svc.stopsAway} stops, {svc.distanceKm} km &mdash; {formatRouteNextBuses(svc.nextBuses)} &mdash; last bus {svc.lastBus}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. One-Change Options */}
                {hasOneChange && (
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-warmgray-800">
                      No direct bus &mdash; here are journeys with one change
                    </div>
                    <div className="space-y-2.5">
                      {oneChangeList.map((opt, idx) => (
                        <div
                          key={`one-change-${opt.leg1.ServiceNo}-${opt.interchange.code}-${opt.leg2.ServiceNo}-${idx}`}
                          id={`one-change-journey-${idx}`}
                          className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E0] hover:border-terracotta-300 transition-colors"
                        >
                          <p className="text-sm sm:text-base font-semibold text-warmgray-900 leading-relaxed">
                            {formatOneChangeSentence(opt)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Limits text beneath one-change results */}
                    <div
                      id="one-change-limits-text"
                      className="p-5 rounded-2xl bg-[#F7F4EF] border border-[#DDD2C6] text-sm sm:text-base text-warmgray-800 space-y-2.5 leading-relaxed"
                    >
                      <p>
                        These journeys change buses at the same stop only &mdash; a shorter route may exist if you are willing to walk to a nearby stop.
                      </p>
                      <p>
                        Stop counts come from LTA route data. This page does not estimate journey time and cannot tell you whether you will make the connection.
                      </p>
                      <p className="font-bold text-warmgray-900">
                        Buses only. The MRT may well be faster.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. No Results Found */}
                {hasNeither && (
                  <div className="p-4 rounded-2xl bg-warmgray-50 border border-warmgray-200 text-xs sm:text-sm text-warmgray-700 space-y-2 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <Compass className="w-4 h-4 text-warmgray-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-warmgray-900">
                          No bus journey to Pasir Ris Interchange with one change or fewer was found from that stop.
                        </p>
                        <p className="text-xs text-warmgray-500 mt-1">
                          You may consider traveling via a nearby major transit interchange such as Tampines (75009) or Bedok (84009).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F2EDE8] text-xs text-warmgray-400 font-medium flex items-center justify-between">
            <span>Destination: Pasir Ris Interchange (77009)</span>
            <span>Source: LTA DataMall</span>
          </div>
        </div>
      </div>
    </section>
  );
};
