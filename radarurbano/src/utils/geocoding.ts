const GOOGLE_MAPS_KEY = 'AIzaSyBfexe8CKmwJdTTSo61gOCDy7ftO2GSKsI';
const cache: { [key: string]: string } = {};

export const getAddress = async (lat: number, lng: number): Promise<string> => {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${GOOGLE_MAPS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const route = data.results.find((r: any) => r.types.includes('route'));
      const address = route
        ? route.formatted_address
        : data.results[0].formatted_address;

      const short = address.split(',').slice(0, 2).join(',');
      cache[cacheKey] = short;
      return short;
    }

    return 'Cerca de esta zona';
  } catch (error) {
    console.error('Error en geocoding:', error);
    return 'Cerca de esta zona';
  }
};
