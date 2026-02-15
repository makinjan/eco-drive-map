export const GOOGLE_MAPS_API_KEY = 'AIzaSyCKMbvFYaQrSEH5PFWxCv4lbZCHj7pN8FU';

export const SPAIN_CENTER = { lat: 40.4168, lng: -3.7038 };
export const INITIAL_ZOOM = 6;

export const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  restriction: {
    latLngBounds: {
      north: 44.0,
      south: 27.5,
      west: -18.5,
      east: 5.5,
    },
    strictBounds: false,
  },
};
