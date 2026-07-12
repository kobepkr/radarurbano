const iconos: { [key: string]: any } = {
  incendio: require('../../assets/markers/incendio.png'),
  manifestacion: require('../../assets/markers/manifestacion.png'),
  choque: require('../../assets/markers/choque.png'),
  calleCortada: require('../../assets/markers/calleCortada.png'),
  obrasEnVia: require('../../assets/markers/obras.png'),
  corteLuz: require('../../assets/markers/CorteLuz.png'),
  actitudSospechosa: require('../../assets/markers/actividadSospechosa.png'),
  accidenteGrave: require('../../assets/markers/emergenciaMedica.png'),
  ambulanciaLugar: require('../../assets/markers/emergenciaMedica.png'),
  personaHerida: require('../../assets/markers/emergenciaMedica.png'),
  carabinerosLugar: require('../../assets/markers/carabinerosEnellugar.png'),
  controlCarabineros: require('../../assets/markers/carabinerosEnellugar.png'),
  bomberosLugar: require('../../assets/markers/bomberoLugar.png'),
  perroPerdido: require('../../assets/markers/perroPerdido.png'),
  gatoPerdido: require('../../assets/markers/gatoPerdido.png'),
};

export const getIconoMarker = (tipo: string) => iconos[tipo] || null;
