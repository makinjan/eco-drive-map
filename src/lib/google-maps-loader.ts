import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from './google-maps-config';

const LIBRARIES: ('places')[] = ['places'];

/**
 * Singleton hook for loading the Google Maps JS API.
 * Using useJsApiLoader instead of LoadScript avoids remounting the entire
 * component tree on re-renders, which was causing slow initial loads.
 */
export function useGoogleMapsLoader() {
  return useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    language: 'es',
  });
}
