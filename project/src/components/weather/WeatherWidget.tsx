import { useState, useEffect, useRef } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  Navigation,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import {
  fetchWeatherData,
  searchLocations,
  getBrowserLocationWeather,
  getStoredWeatherLocation,
  setStoredWeatherLocation,
  POPULAR_AGRI_REGIONS,
  type WeatherData,
  type LocationData,
  type DailyForecast,
} from '@/services/weather';

interface WeatherWidgetProps {
  /**
   * 'compact': Contextual card for the diagnosis Results page alongside action plan
   * 'full': Comprehensive view for the dedicated Weather section/page
   */
  variant?: 'compact' | 'full';
  className?: string;
  defaultLocation?: LocationData;
}

export function WeatherWidget({
  variant = 'full',
  className = '',
  defaultLocation,
}: WeatherWidgetProps) {
  const { t } = useLanguage();
  const [location, setLocation] = useState<LocationData>(() => defaultLocation || getStoredWeatherLocation());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for locations
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error searching locations:', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch live weather data whenever location changes
  const loadWeatherData = async (targetLoc: LocationData) => {
    setLoading(true);
    setError(null);
    try {
      const locLabel = targetLoc.region
        ? `${targetLoc.name}, ${targetLoc.region}`
        : `${targetLoc.name}, ${targetLoc.country}`;
      const data = await fetchWeatherData(targetLoc.latitude, targetLoc.longitude, locLabel);
      setWeather(data);
      setStoredWeatherLocation(targetLoc);
    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError(t.weather.fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherData(location);
  }, [location.latitude, location.longitude]);

  // Handle location selection
  const handleSelectLocation = (loc: LocationData) => {
    setLocation(loc);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Handle browser GPS geolocation
  const handleUseMyLocation = async () => {
    setGeoLocating(true);
    setError(null);
    try {
      const geoWeather = await getBrowserLocationWeather();
      setWeather(geoWeather);
      const newLoc: LocationData = {
        name: geoWeather.current.locationName,
        region: '',
        country: '',
        latitude: geoWeather.current.latitude,
        longitude: geoWeather.current.longitude,
      };
      setLocation(newLoc);
      setStoredWeatherLocation(newLoc);
    } catch (err) {
      console.error('Geolocation error:', err);
      setError(t.weather.locationDenied);
    } finally {
      setGeoLocating(false);
    }
  };

  // Helper to render weather icon
  const renderConditionIcon = (iconName: DailyForecast['iconName'], classNameStr: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={`${classNameStr} text-amber-500`} />;
      case 'CloudSun':
        return <CloudSun className={`${classNameStr} text-amber-400`} />;
      case 'Cloud':
        return <Cloud className={`${classNameStr} text-neutral-400`} />;
      case 'CloudFog':
        return <CloudFog className={`${classNameStr} text-neutral-400`} />;
      case 'CloudDrizzle':
        return <CloudDrizzle className={`${classNameStr} text-sky-400`} />;
      case 'CloudRain':
        return <CloudRain className={`${classNameStr} text-sky-500`} />;
      case 'CloudLightning':
        return <CloudLightning className={`${classNameStr} text-indigo-500`} />;
      case 'Snowflake':
        return <Snowflake className={`${classNameStr} text-cyan-400`} />;
      default:
        return <CloudSun className={`${classNameStr} text-amber-400`} />;
    }
  };

  // Loading Skeleton State
  if (loading && !weather) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-neutral-200 rounded w-48 animate-pulse" />
          <div className="h-6 bg-neutral-200 rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-32 bg-neutral-100 rounded-xl animate-pulse" />
      </Card>
    );
  }

  // Error State
  if (error && !weather) {
    return (
      <Card className={`p-6 border-error-200 bg-error-50/50 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-error-900">{t.weather.weatherUnavailable}</h3>
            <p className="text-sm text-error-700 mt-1">{error}</p>
            <Button size="sm" variant="outline" onClick={() => loadWeatherData(location)} className="mt-3">
              <RefreshCw className="w-4 h-4" /> {t.weather.retryFetch}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!weather) return null;

  const { current, forecast, advisory } = weather;

  // Determine rain risk style
  const rainColor =
    current.rainChance >= 50
      ? 'bg-error-50 text-error-700 border-error-200'
      : current.rainChance >= 25
      ? 'bg-warning-50 text-warning-700 border-warning-200'
      : 'bg-primary-50 text-primary-700 border-primary-200';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search & Location Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input with autocomplete dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder={t.weather.searchPlaceholder}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-sm border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600 animate-spin" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-fade-in-down">
              {searchResults.map((res, i) => (
                <button
                  key={res.id || i}
                  type="button"
                  onClick={() => handleSelectLocation(res)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-primary-50/60 flex items-center justify-between transition-colors border-b border-neutral-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span className="font-semibold text-neutral-800">{res.name}</span>
                    {res.region && <span className="text-xs text-neutral-500">({res.region})</span>}
                  </div>
                  <span className="text-xs text-neutral-400">{res.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS location and refresh buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUseMyLocation}
            disabled={geoLocating}
            className="text-xs"
          >
            {geoLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-primary-600" />
            )}
            {t.weather.useMyLocation}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadWeatherData(location)}
            disabled={loading}
            className="px-2.5 text-neutral-500 hover:text-primary-700"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Preset Region Chips (shown in full variant) */}
      {variant === 'full' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-neutral-400 font-medium whitespace-nowrap">{t.weather.agriHubs}</span>
          {POPULAR_AGRI_REGIONS.map((preset) => {
            const isSelected = location.name.toLowerCase() === preset.name.toLowerCase();
            return (
              <button
                key={preset.name}
                onClick={() => handleSelectLocation(preset)}
                className={`px-3 py-1 rounded-full whitespace-nowrap border transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm font-semibold'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50'
                }`}
              >
                {preset.name} ({preset.region})
              </button>
            );
          })}
        </div>
      )}

      {/* Main Weather Overview Card */}
      <Card className="overflow-hidden border border-primary-900/10 shadow-md">
        <div className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white p-6 relative overflow-hidden">
          {/* Subtle nature glow rings */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Location & Current Temperature */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary-200 text-xs font-semibold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-primary-300" />
                <span>{current.locationName}</span>
                <span className="text-primary-300/60">• {t.weather.liveOpenMeteo}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl md:text-6xl font-extrabold tracking-tight">
                  {current.temperature}°C
                </span>
                <span className="text-sm text-primary-200 font-medium">
                  {t.weather.feelsLike} {current.apparentTemperature}°C
                </span>
              </div>
              <p className="text-primary-100 font-semibold text-base flex items-center gap-2">
                {renderConditionIcon(current.iconName, 'w-5 h-5')}
                {current.condition}
              </p>
            </div>

            {/* Right: Key Farm Micro-climate Indicators */}
            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 md:min-w-[340px]">
              {/* Humidity */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary-200 text-xs font-medium mb-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-300" />
                  <span>{t.weather.humidityLabel}</span>
                </div>
                <div className="text-xl md:text-2xl font-extrabold text-white">
                  {current.humidity}%
                </div>
                <span className="text-[10px] text-primary-200/90 font-medium">
                  {current.humidity > 75 ? t.weather.moistRisk : t.weather.balanced}
                </span>
              </div>

              {/* Rain Chance */}
              <div className="text-center border-x border-white/15 px-2">
                <div className="flex items-center justify-center gap-1 text-primary-200 text-xs font-medium mb-1">
                  <CloudRain className="w-3.5 h-3.5 text-sky-300" />
                  <span>{t.weather.rainChanceLabel}</span>
                </div>
                <div className="text-xl md:text-2xl font-extrabold text-white">
                  {current.rainChance}%
                </div>
                <span className="text-[10px] text-primary-200/90 font-medium">
                  {current.rainChance >= 50 ? t.weather.precipitationExpected : t.weather.lowRainChance}
                </span>
              </div>

              {/* Wind Speed */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary-200 text-xs font-medium mb-1">
                  <Wind className="w-3.5 h-3.5 text-teal-300" />
                  <span>{t.weather.windLabel}</span>
                </div>
                <div className="text-xl md:text-2xl font-extrabold text-white">
                  {current.windSpeed}
                </div>
                <span className="text-[10px] text-primary-200/90 font-medium">{t.weather.windUnit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agronomic Crop Advisory Banner */}
        <div className="p-4 md:p-5 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                advisory.status === 'warning'
                  ? 'bg-error-100 text-error-700'
                  : advisory.status === 'caution'
                  ? 'bg-warning-100 text-warning-700'
                  : 'bg-success-100 text-success-700'
              }`}
            >
              {advisory.status === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : advisory.status === 'caution' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="font-bold text-neutral-900 text-sm">{advisory.headline}</h4>
                <Badge
                  variant={
                    advisory.status === 'warning'
                      ? 'error'
                      : advisory.status === 'caution'
                      ? 'warning'
                      : 'success'
                  }
                >
                  {advisory.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed mb-1.5">
                <strong className="text-neutral-700">{t.weather.sprayAdvisory}</strong> {advisory.sprayAdvice}
              </p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                <strong className="text-neutral-600">{t.weather.diseasePressure}</strong> {advisory.diseaseRisk}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 7-Day Forecast: Horizontal Scrollable Card Row */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-700" />
            <h3 className="font-bold text-neutral-900 text-sm">{t.weather.forecastTitle}</h3>
          </div>
          <span className="text-xs text-neutral-400 font-medium">{t.weather.scrollHorizontally}</span>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-200">
          <div className="flex gap-3 min-w-max">
            {forecast.map((day, idx) => {
              const isToday = idx === 0;
              return (
                <div
                  key={day.date}
                  className={`w-36 rounded-2xl p-3.5 border transition-all duration-200 flex flex-col items-center text-center ${
                    isToday
                      ? 'bg-gradient-to-b from-primary-50 to-white border-primary-300 shadow-sm ring-1 ring-primary-400/30'
                      : 'bg-white border-neutral-200 hover:border-primary-200 hover:shadow-sm'
                  }`}
                >
                  {/* Day Label */}
                  <div className="mb-2">
                    <span
                      className={`block font-bold text-sm ${
                        isToday ? 'text-primary-700' : 'text-neutral-800'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span className="block text-[11px] text-neutral-400 font-medium">
                      {day.formattedDate}
                    </span>
                  </div>

                  {/* Condition Icon */}
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center my-1.5 shadow-inner">
                    {renderConditionIcon(day.iconName, 'w-6 h-6')}
                  </div>

                  {/* Condition Text */}
                  <span className="text-[11px] font-medium text-neutral-600 line-clamp-1 mb-2">
                    {day.condition}
                  </span>

                  {/* Temp High / Low */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 mb-2">
                    <span>{day.tempMax}°</span>
                    <span className="text-neutral-400 font-normal">/</span>
                    <span className="text-neutral-400 font-normal">{day.tempMin}°</span>
                  </div>

                  {/* Rain Probability Pill */}
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      day.rainChance >= 50
                        ? 'bg-error-50 text-error-700 border-error-200'
                        : day.rainChance >= 20
                        ? 'bg-warning-50 text-warning-700 border-warning-200'
                        : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}
                  >
                    <CloudRain className="w-3 h-3 shrink-0" />
                    <span>{day.rainChance}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
