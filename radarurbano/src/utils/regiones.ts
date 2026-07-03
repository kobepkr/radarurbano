export interface RegionChile {
  nombre: string;
  lat: number;
  lng: number;
  radio: number;
}

export const regionesChile: RegionChile[] = [
  { nombre: 'Mi ubicación', lat: 0, lng: 0, radio: 50 },
  { nombre: 'Arica y Parinacota', lat: -18.4783, lng: -70.3211, radio: 100 },
  { nombre: 'Tarapacá', lat: -20.2111, lng: -70.1333, radio: 120 },
  { nombre: 'Antofagasta', lat: -23.6509, lng: -70.3975, radio: 200 },
  { nombre: 'Atacama', lat: -27.3666, lng: -70.3333, radio: 150 },
  { nombre: 'Coquimbo', lat: -29.9533, lng: -71.3386, radio: 120 },
  { nombre: 'Valparaíso', lat: -33.0472, lng: -71.6127, radio: 80 },
  { nombre: 'Metropolitana', lat: -33.4489, lng: -70.6693, radio: 70 },
  { nombre: "O'Higgins", lat: -34.1708, lng: -70.7406, radio: 70 },
  { nombre: 'Maule', lat: -35.4264, lng: -71.6712, radio: 100 },
  { nombre: 'Ñuble', lat: -36.6066, lng: -72.1033, radio: 60 },
  { nombre: 'Biobío', lat: -36.8269, lng: -73.0503, radio: 90 },
  { nombre: 'Araucanía', lat: -38.739, lng: -72.5907, radio: 80 },
  { nombre: 'Los Ríos', lat: -39.8196, lng: -73.2452, radio: 70 },
  { nombre: 'Los Lagos', lat: -41.4711, lng: -72.9356, radio: 150 },
  { nombre: 'Aysén', lat: -45.5698, lng: -72.066, radio: 250 },
  { nombre: 'Magallanes', lat: -53.1548, lng: -70.9173, radio: 300 },
];
