import React, { useState, useEffect, useCallback } from 'react';
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
  Radio
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
  destination: string;
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

interface QuickStop {
  code: string;
  name: string;
  lat: number;
  lng: number;
  hint: string;
}

const POPULAR_QUICK_STOPS: QuickStop[] = [
  { code: '77009', name: 'Pasir Ris Int', lat: 1.3801, lng: 103.9493, hint: 'Shelter Hub' },
  { code: '77031', name: 'Opp Pasir Ris Stn', lat: 1.3734, lng: 103.9482, hint: 'MRT Exit B' },
  { code: '75009', name: 'Tampines Int', lat: 1.3533, lng: 103.9452, hint: 'Direct Hub' },
  { code: '84009', name: 'Bedok Int', lat: 1.3243, lng: 103.9304, hint: 'East Coast' },
  { code: '98011', name: 'Loyang Pt', lat: 1.3705, lng: 103.9658, hint: 'Near Loyang' }
];

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

  // Geolocation & Quick Stops State
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Favourites state (stored in localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('paws_fav_stops');
      return saved ? JSON.parse(saved) : ['77009'];
    } catch {
      return ['77009'];
    }
  });

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

  // Perform route and arrival search
  const performSearch = async (code: string, isBackgroundRefresh = false) => {
    const cleanCode = code.trim();
    if (!cleanCode) {
      setRoutesError('Please enter a 5-digit bus stop code.');
      return;
    }

    if (!/^\d{5}$/.test(cleanCode)) {
      setRoutesError('A Singapore stop code must be exactly 5 digits (e.g. 04121).');
      return;
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
    performSearch(stopCodeInput);
  };

  const handleSelectQuickStop = (code: string) => {
    setStopCodeInput(code);
    performSearch(code);
  };

  // Nearby Stops Geolocation
  const handleLocateNearbyStops = () => {
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
          setLocationMessage('Location access was denied. Enter a 5-digit stop code below or choose a quick stop.');
        } else {
          setLocationMessage('Unable to determine location. Please select a quick stop or enter a 5-digit code.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Toggle Favourites
  const toggleFavorite = (code: string) => {
    if (!code || !/^\d{5}$/.test(code)) return;
    setFavorites((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      try {
        localStorage.setItem('paws_fav_stops', JSON.stringify(next));
      } catch {
        // ignore local storage errors
      }
      return next;
    });
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
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white shadow-xs transition-all">
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
                <div className="flex items-center gap-2">
                  {locationStatus === 'locating' && (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                  )}
                  {locationStatus === 'success' && (
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {locationStatus === 'error' && (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-medium">{locationMessage}</span>
                </div>
                {locationStatus !== 'locating' && (
                  <button
                    type="button"
                    onClick={() => setLocationStatus('idle')}
                    className="text-warmgray-400 hover:text-warmgray-700 text-xs px-1 font-bold"
                    aria-label="Dismiss location message"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Stop code input form with Location Button */}
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
                    pattern="[0-9]*"
                    maxLength={5}
                    value={stopCodeInput}
                    onChange={(e) => setStopCodeInput(e.target.value)}
                    placeholder="e.g. 04121"
                    aria-describedby="stop-code-instruction-note"
                    className="w-full h-12 sm:h-14 pl-4 pr-10 rounded-2xl border-2 border-[#D6CBC0] bg-[#FAF8F5] text-base sm:text-lg text-warmgray-900 placeholder:text-warmgray-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500 font-mono tracking-widest shadow-inner"
                  />
                  {stopCodeInput && /^\d{5}$/.test(stopCodeInput.trim()) && (
                    <button
                      type="button"
                      onClick={() => toggleFavorite(stopCodeInput.trim())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warmgray-400 hover:text-amber-500 transition-colors"
                      title={favorites.includes(stopCodeInput.trim()) ? 'Remove from saved' : 'Save as favourite stop'}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          favorites.includes(stopCodeInput.trim())
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-warmgray-300'
                        }`}
                      />
                    </button>
                  )}
                </div>

                <button
                  id="btn-search-shelter-routes"
                  type="submit"
                  disabled={routesLoading || isRefreshing}
                  className="h-12 sm:h-14 px-5 sm:px-7 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white font-bold text-sm sm:text-base transition-colors shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-60"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>

              {/* Quick Transit Stop Pills */}
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-warmgray-400 font-medium flex items-center gap-1 mr-1">
                  <Radio className="w-3 h-3" /> Quick stops:
                </span>
                {POPULAR_QUICK_STOPS.map((qs) => (
                  <button
                    key={qs.code}
                    type="button"
                    onClick={() => handleSelectQuickStop(qs.code)}
                    className={`px-2.5 py-1 rounded-full font-medium transition-colors border ${
                      stopCodeInput === qs.code
                        ? 'bg-terracotta-50 border-terracotta-400 text-terracotta-800 font-bold'
                        : 'bg-[#FAF8F5] border-[#E5DDD4] text-warmgray-600 hover:bg-warmgray-100 hover:text-warmgray-900'
                    }`}
                  >
                    {qs.name} <span className="font-mono text-[10px] text-warmgray-400">({qs.code})</span>
                  </button>
                ))}
              </div>

              <p id="stop-code-instruction-note" className="text-xs text-warmgray-500 leading-relaxed">
                Note: A Singapore stop code is 5 digits and the leading zero counts, so <strong>04121</strong> not 4121.
              </p>
            </form>

            {/* SKELETON LOADING STATE: Nielsen Heuristic #1 Visibility of System Status
                Shows active retrieval with skeleton layout and exact cold-start note */}
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
                {/* Results Header: Stop name/code and Refresh Button */}
                <div className="flex items-center justify-between pb-1 border-b border-[#F2EDE8]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-warmgray-500">
                      From Stop: <strong className="font-mono text-warmgray-900">{routeResult.from}</strong>
                    </span>
                    {favorites.includes(routeResult.from) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ★ Saved
                      </span>
                    )}
                  </div>

                  {/* Refresh arrivals action */}
                  <button
                    type="button"
                    onClick={() => performSearch(routeResult.from, true)}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-600 hover:text-terracotta-700 active:text-terracotta-800 disabled:opacity-60 transition-colors focus:outline-none"
                    title="Refresh live bus arrival minutes"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh arrivals'}</span>
                  </button>
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
