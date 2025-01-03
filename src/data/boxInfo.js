
const boxInfo = [
  {
    path: require("../../assets/Lisboa/praia no parquee.jpg"),
    title: "Praia No Parque",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:30 PM - 12:00 AM",
      Martes: "12:30 PM - 12:00 AM",
      Miércoles: "12:30 PM - 12:00 AM",
      Jueves: "12:30 PM - 02:00 AM",
      Viernes: "12:30 PM - 03:00 AM",
      Sábado: "12:30 PM - 12:00 AM",
      Domingo: "12:30 PM - 12:00 AM",
    },
    number: "968 842 888",
    coordinates: {
      latitude: 38.7283001,
      longitude: -9.1526828,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/palacio Chaiado.jpg"),
    title: "Palacio Chiado",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:30 PM - 12:00 AM",
      Martes: "12:30 PM - 12:00 AM",
      Miércoles: "12:30 PM - 12:00 AM",
      Jueves: "12:30 PM - 02:00 AM",
      Viernes: "12:30 PM - 02:00 AM",
      Sábado: "12:30 PM - 12:00 AM",
      Domingo: "12:30 PM - 12:00 AM",
    },
    number: "21 010 1184",
    coordinates: {
      latitude: 38.7096823,
      longitude: -9.143029,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },

  {
    path: require("../../assets/Lisboa/mama shelter.jpg"),
    title: "Mama Shelter",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "21 054 9899",
    coordinates: {
      latitude: 38.7208955,
      longitude: -9.1523714,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/corner2.jpg"),
    title: "Corner",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:00 PM - 12:00 AM",
      Martes: "12:00 PM - 12:00 AM",
      Miércoles: "12:00 PM - 2:00 AM",
      Jueves: "12:00 PM - 2:00 AM",
      Viernes: "12:00 PM - 2:00 AM",
      Sábado: "12:00 PM - 2:00 AM",
      Domingo: "Cerrado",
    },
    number: "1160419607",
    coordinates: {
      latitude: 38.7253583,
      longitude: -9.1535022,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Praca dąs flores.jpg"),
    title: "Praça das Flores",
    category: "Bars & Clubs",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "1160419607",
    coordinates: {
      latitude: 38.714855,
      longitude: -9.1516277,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },

  {
    path: require("../../assets/Lisboa/Rumu.jpg"),
    title: "Rumu",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "Cerrado",
      Viernes: "8:00 PM - 4:00 AM",
      Sábado: "8:00 PM - 4:00 AM",
      Domingo: "Cerrado",
    },
    number: "914 023 304",
    coordinates: {
      latitude: 38.7203755,
      longitude: -9.1491488,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },

  {
    path: require("../../assets/Lisboa/Mona Verde.jpg"),
    title: "Mona Verde",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "07:00 PM - 01:00 AM",
      Martes: "07:00 PM - 01:00 AM",
      Miércoles: "07:00 PM - 01:00 AM",
      Jueves: "07:00 PM - 02:00 AM",
      Viernes: "07:00 PM - 02:00 AM",
      Sábado: "04:00 PM - 01:00 AM",
      Domingo: "07:00 PM - 01:00 AM",
    },
    number: "914 023 304",
    coordinates: {
      latitude: 38.7203755,
      longitude: -9.1491488,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Jncquoi club.jpg"),
    title: "Jncquoi Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:00 PM - 12:00 AM",
      Martes: "12:00 PM - 12:00 AM",
      Miércoles: "12:00 PM - 12:00 AM",
      Jueves: "12:00 PM - 02:00 AM",
      Viernes: "12:00 PM - 02:00 AM",
      Sábado: "12:00 PM - 02:00 AM",
      Domingo: "12:00 PM - 12:00 AM",
    },
    number: "21 936 9900",
    coordinates: {
      latitude: 38.719472,
      longitude: -9.1441149,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Jncquoi Avenida.jpg"),
    title: "Jncquoi Avenida",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 PM - 12:00 AM",
      Martes: "12:00 PM - 12:00 AM",
      Miércoles: "12:00 PM - 12:00 AM",
      Jueves: "12:00 PM - 02:00 AM",
      Viernes: "12:00 PM - 02:00 AM",
      Sábado: "12:00 PM - 02:00 AM",
      Domingo: "12:00 PM - 12:00 AM",
    },
    number: "21 936 9900",
    coordinates: {
      latitude: 38.72028,
      longitude: -9.1449959,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Brilhante.jpg"),
    title: "Brilhante",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "19:00 PM - 12:00 AM",
      Martes: "19:00 PM - 12:00 AM",
      Miércoles: "19:00 PM - 12:00 AM",
      Jueves: "19:00 PM - 12:00 AM",
      Viernes: "19:00 PM - 12:00 AM",
      Sábado: "12:00 PM - 01:00 AM",
      Domingo: "19:00 PM - 12:00 AM",
    },
    number: "21 054 7981",
    coordinates: {
      latitude: 38.7078843,
      longitude: -9.1470788,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/lux Fragil.jpg"),
    title: "Lux Frágil",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "11:00 PM - 12:00 AM",
      Viernes: "11:00 PM - 12:00 AM",
      Sábado: "11:00 PM - 12:00 AM",
      Domingo: "12:00 AM - 06:00 AM",
    },
    number: "21 882 0890",
    coordinates: {
      latitude: 38.7148909,
      longitude: -9.1205341,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/lust in rio.jpg"),
    title: "Lust in rio",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "8:00 PM - 12:00 AM",
      Jueves: "8:00 PM - 12:00 AM",
      Viernes: "8:00 PM - 12:00 AM",
      Sábado: "8:00 PM - 12:00 AM",
      Domingo: "12:00 AM - 6:00 AM",
    },
    number: "913 795 242",
    coordinates: {
      latitude: 38.706027,
      longitude: -9.1499039,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Mome.jpg"),
    title: "MOME",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:00 AM - 6:00 AM",
      Martes: "Cerrado",
      Miércoles: "12:00 AM - 6:00 AM",
      Jueves: "Abierto las 24 horas",
      Viernes: "12:00 AM - 7:00 AM",
      Sábado: "12:00 AM - 6:00 AM",
      Domingo: "12:00 AM - 6:00 AM",
    },
    number: "21 151 0734",
    coordinates: {
      latitude: 38.7059725,
      longitude: -9.1574549,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Rive Rouge.jpg"),
    title: "Rive Rouge",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:00 AM - 2:00 AM",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "Cerrado",
      Viernes: "11:00 PM - 12:00 AM",
      Sábado: "11:00 PM - 12:00 AM",
      Domingo: "8:00 PM - 12:00 AM",
    },    
    number: "21 346 1117",
    coordinates: {
      latitude: 38.7074149,
      longitude: -9.1461322,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Plateau.jpg"),
    title: "Plateau",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
  Martes: "Cerrado",
  Miércoles: "11:59 PM - 12:00 AM",
  Jueves: "12:00 AM - 6:00 AM",
  Viernes: "11:59 PM - 12:00 AM",
  Sábado: "11:59 PM - 12:00 AM",
  Domingo: "12:00 AM - 6:00 AM",
    },
    number: "911 126 402",
    coordinates: {
      latitude: 38.7063889,
      longitude: -9.1575,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },

  {
    path: require("../../assets/Lisboa/nav.jpg"),
    title: "NAV",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "Cerrado",
      Viernes: "8:00 PM - 12:00 AM",
      Sábado: "10:00 PM - 12:00 AM",
      Domingo: "12:00 AM - 4:00 AM",
    },
    number: "-",
    coordinates: {
      latitude: 38.7411311,
      longitude: -9.145745,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/jamaica.jpg"),
    title: "Jamaica",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "11:59 PM - 12:00 AM",
      Jueves: "11:59 PM - 12:00 AM",
      Viernes: "11:59 PM - 12:00 AM",
      Sábado: "11:59 PM - 12:00 AM",
      Domingo: "12:00 AM - 7:00 AM",
    },
    number: "21 346 2265",
    coordinates: {
      latitude: 38.7053888,
      longitude: -9.1467954,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Casa Santi.jpg"),
    title: "Casa Santi",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "12:00 PM - 2:00 AM",
      Miércoles: "12:00 PM - 2:00 AM",
      Jueves: "12:00 PM - 2:00 AM",
      Viernes: "12:00 PM - 2:00 AM",
      Sábado: "12:00 PM - 2:00 AM",
      Domingo: "Cerrado",
    },
    number: "926 286 634",
    coordinates: {
      latitude: 38.7071959,
      longitude: -9.1538892,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Beca Beca.jpg"),
    title: "Beca Beca",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "19:00 PM - 12:00 AM",
      Martes: "19:00 PM - 12:00 AM",
      Miércoles: "19:00 PM - 12:00 AM",
      Jueves: "19:00 PM - 12:00 AM",
      Viernes: "19:00 PM - 12:00 AM",
      Sábado: "12:00 PM - 01:00 AM",
      Domingo: "19:00 PM - 12:00 AM",
    },
    number: "21 054 7981",
    coordinates: {
      latitude: 38.7078843,
      longitude: -9.1470788,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Bairro alto.webp"),
    title: "Bairro Alto",
    category: "Bars & Clubs",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "1160419607",
    coordinates: {
      latitude: 38.7128331,
      longitude: -9.1450582,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/SKY BAR.jpg"),
    title: "Sky Bar",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:30 PM - 1:00 AM",
      Martes: "12:30 PM - 1:00 AM",
      Miércoles: "12:30 PM - 1:00 AM",
      Jueves: "12:30 PM - 1:00 AM",
      Viernes: "12:30 PM - 2:00 AM",
      Sábado: "12:30 PM - 2:00 AM",
      Domingo: "12:30 PM - 1:00 AM",
    },
    
    number: "21 096 5775",
    coordinates: {
      latitude: 38.7209984,
      longitude: -9.147139,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Mini Bar Avillez.jpg"),
    title: "Mini Bar Avillez",
    category: "Bars & Clubs",
    hours: {
      Lunes: "7:00 PM - 2:00 AM",
      Martes: "7:00 PM - 2:00 AM",
      Miércoles: "7:00 PM - 2:00 AM",
      Jueves: "7:00 PM - 3:00 AM",
      Viernes: "7:00 PM - 3:00 AM",
      Sábado: "7:00 PM - 3:00 AM",
      Domingo: "7:00 PM - 2:00 AM",
    },
    number: "21 130 5393",
    coordinates: {
      latitude: 38.7122647,
      longitude: -9.1423781,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Sud Lisboa.jpg"),
    title: "SUD Lisboa",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 PM - 1:00 AM",
      Martes: "12:00 PM - 1:00 AM",
      Miércoles: "12:00 PM - 1:00 AM",
      Jueves: "12:00 PM - 1:00 AM",
      Viernes: "12:00 PM - 2:00 AM",
      Sábado: "12:00 PM - 2:00 AM",
      Domingo: "12:00 PM - 1:00 AM",
    },
    number: "21 159 2700",
    coordinates: {
      latitude: 38.6963541,
      longitude: -9.1917573,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Java Rooftop.jpg"),
    title: "Java Rooftop",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 PM - 1:00 AM",
      Martes: "12:00 PM - 1:00 AM",
      Miércoles: "12:00 PM - 1:00 AM",
      Jueves: "12:00 PM - 1:00 AM",
      Viernes: "12:00 PM - 1:00 AM",
      Sábado: "12:00 PM - 1:00 AM",
      Domingo: "12:00 PM - 1:00 AM",
    },    
    number: "935 945 545",
    coordinates: {
      latitude: 38.7076621,
      longitude: -9.1468819,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/hangar.jpg"),
    title: "HANGAR",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "21 887 1481",
    coordinates: {
      latitude: 38.4625994,
      longitude: -9.1917603,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/okha.jpg"),
    title: "OKHA",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "5:00 PM - 12:00 AM",
      Miércoles: "5:00 PM - 12:00 AM",
      Jueves: "5:00 PM - 12:00 AM",
      Viernes: "5:00 PM - 12:00 AM",
      Sábado: "5:00 PM - 12:00 AM",
      Domingo: "5:00 PM - 12:00 AM",
    },    
    number: "914 110 791",
    coordinates: {
      latitude: 38.7031048,
      longitude: -9.1620528,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },

  {
    path: require("../../assets/Lisboa/cinco Lounge.jpg"),
    title: "Cinco Lounge",
    category: "Bars & Clubs",
    hours: {
      Lunes: "8:00 PM - 2:00 AM",
      Martes: "8:00 PM - 2:00 AM",
      Miércoles: "8:00 PM - 2:00 AM",
      Jueves: "8:00 PM - 2:00 AM",
      Viernes: "8:00 PM - 2:00 AM",
      Sábado: "8:00 PM - 2:00 AM",
      Domingo: "8:00 PM - 2:00 AM",
    },
    number: "21 342 4033",
    coordinates: {
      latitude: 38.7141649,
      longitude: -9.1497258,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/faz frio.jpg"),
    title: "Faz Frio",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "1160419607",
    coordinates: {
      latitude: 38.7160092,
      longitude: -9.1469233,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Lx Factory.jpg"),
    title: "Lx Factory",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "1160419607",
    coordinates: {
      latitude: 38.7034979,
      longitude: -9.178873,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Docas.jpg"),
    title: "Docas de Santo Amaro",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "7:00 PM - 12:00 AM",
      Martes: "7:00 PM - 12:00 AM",
      Miércoles: "7:00 PM - 12:00 AM",
      Jueves: "7:00 PM - 12:00 AM",
      Viernes: "7:00 PM - 12:00 AM",
      Sábado: "7:00 PM - 12:00 AM",
      Domingo: "7:00 PM - 12:00 AM",
    },
    number: "21 396 3535",
    coordinates: {
      latitude: 38.6994781,
      longitude: -9.1774925,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Go A Lisboa Rooftop.jpg"),
    title: "Go A Lisboa Rooftop",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "21 594 1117",
    coordinates: {
      latitude: 38.6994781,
      longitude: -9.1774925,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Golden.jpg"),
    title: "Golden Vista",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "6:00 PM - 2:00 AM",
      Miércoles: "6:00 PM - 2:00 AM",
      Jueves: "6:00 PM - 2:00 AM",
      Viernes: "6:00 PM - 4:00 AM",
      Sábado: "6:00 PM - 4:00 AM",
      Domingo: "Cerrado",
    },
    number: "935 190 438",
    coordinates: {
      latitude: 38.6997337,
      longitude: -9.1785392,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Bom o mau e o vilão.jpg"),
    title: "O bom o mau e o vilão",
    category: "Bars & Clubs",
    hours: {
      Lunes: "7:00 PM - 1:00 AM",
      Martes: "7:00 PM - 1:00 AM",
      Miércoles: "7:00 PM - 1:00 AM",
      Jueves: "7:00 PM - 2:00 AM",
      Viernes: "7:00 PM - 3:00 AM",
      Sábado: "7:00 PM - 3:00 AM",
      Domingo: "7:00 PM - 1:00 AM",
    },
    number: "963 982 094",
    coordinates: {
      latitude: 38.7073563,
      longitude: -9.1435333,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Collect.jpg"),
    title: "Collect",
    category: "Bars & Clubs",
    hours: {
      Lunes: "5:00 PM - 2:00 AM",
      Martes: "5:00 PM - 2:00 AM",
      Miércoles: "5:00 PM - 2:00 AM",
      Jueves: "5:00 PM - 2:00 AM",
      Viernes: "12:00 PM - 3:00 AM",
      Sábado: "12:00 PM - 3:00 AM",
      Domingo: "12:00 PM - 2:00 AM",
    },
    number: "913 808 371",
    coordinates: {
      latitude: 38.6982479,
      longitude: -9.4217619,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/malacopa.jpg"),
    title: "Malacopa",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "5:00 PM - 12:00 AM",
      Martes: "12:00 PM - 12:00 AM",
      Miércoles: "12:00 PM - 12:00 AM",
      Jueves: "12:00 PM - 12:00 AM",
      Viernes: "12:00 PM - 2:00 AM",
      Sábado: "12:00 PM - 2:00 AM",
      Domingo: "12:00 PM - 12:00 AM",
    },    
    number: "967 643 319",
    coordinates: {
      latitude: 38.6982479,
      longitude: -9.4217619,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/hifen.jpg"),
    title: "Hífen",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:30 PM - 12:00 AM",
      Martes: "12:30 PM - 12:00 AM",
      Miércoles: "12:30 PM - 12:00 AM",
      Jueves: "12:30 PM - 12:00 AM",
      Viernes: "12:30 PM - 2:00 AM",
      Sábado: "12:30 PM - 2:00 AM",
      Domingo: "12:30 PM - 12:00 AM",
    },
    number: "915 546 537",
    coordinates: {
      latitude: 38.6962004,
      longitude: -9.42026,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },

  // MADRID

  {
    path: require("../../assets/Madrid/Istar.jpg"),
    title: "Istar",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "12:30 AM - 5:30 AM",
      Miércoles: "12:30 AM - 5:30 AM",
      Jueves: "12:30 AM - 5:30 AM",
      Viernes: "12:30 AM - 6:00 AM",
      Sábado: "12:30 AM - 6:00 AM",
      Domingo: "Cerrado",
    },
    number: "661 785 374",
    coordinates: {
      latitude: 40.428745,
      longitude: -3.6875565,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
    isPrivate: false, // Evento general
  },
  
  {
    path: require("../../assets/Madrid/Giselle.jpg"),
    title: "Giselle",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "8:00 PM - 3:30 AM",
      Jueves: "8:00 PM - 5:00 AM",
      Viernes: "8:00 PM - 5:00 AM",
      Sábado: "8:00 PM - 5:00 AM",
      Domingo: "Cerrado",
    },
    number: "621 146 274",
    coordinates: {
      latitude: 40.4225554,
      longitude: -3.6908309,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
    isPrivate: false, // Evento general
  },
  {
    path: require("../../assets/Madrid/Amazonico.jpg"),
    title: "Amazonico",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 12:00 AM",
      Martes: "1:00 PM - 12:00 AM",
      Miércoles: "1:00 PM - 12:00 AM",
      Jueves: "1:00 PM - 1:00 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "1:00 PM - 2:00 AM",
      Domingo: "1:00 PM - 12:00 AM",
    },    
    number: "915 154 332",
    coordinates: {
      latitude: 40.423715,
      longitude: -3.6850997,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Jungle Jazz Club.jpg"),
    title: "Jungle Jazz Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "8:00 PM - 4:00 AM",
      Martes: "8:00 PM - 4:00 AM",
      Miércoles: "8:00 PM - 4:00 AM",
      Jueves: "8:00 PM - 4:00 AM",
      Viernes: "8:00 PM - 4:00 AM",
      Sábado: "8:00 PM - 4:00 AM",
      Domingo: "8:00 PM - 4:00 AM",
    },    
    number: "915 154 332",
    coordinates: {
      latitude: 40.423715,
      longitude: -3.6850997,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Los 33.jpg"),
    title: "Los 33",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 2:00 AM",
      Martes: "1:00 PM - 2:00 AM",
      Miércoles: "1:00 PM - 2:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:30 AM",
      Sábado: "11:30 AM - 2:30 AM",
      Domingo: "12:30 PM - 7:00 PM",
    },
    number: "914 997 258",
    coordinates: {
      latitude: 40.4238428,
      longitude: -3.6948365,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Castellana 8.jpg"),
    title: "Castellana 8",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "671 334 996",
    coordinates: {
      latitude: 40.4274487,
      longitude: -3.6893616,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Panthera.jpg"),
    title: "Panthera",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 PM - 2:00 AM",
      Martes: "8:00 PM - 2:00 AM",
      Miércoles: "8:00 PM - 2:00 AM",
      Jueves: "8:00 PM - 3:00 AM",
      Viernes: "8:00 PM - 3:00 AM",
      Sábado: "8:00 PM - 3:00 AM",
      Domingo: "8:30 PM - 3:30 AM",
    },
    number: "689 879 114",
    coordinates: {
      latitude: 40.4361839,
      longitude: -3.6916115,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Nomada.jpg"),
    title: "Nômâda",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "8:00 PM - 2:00 AM",
      Miércoles: "8:00 PM - 2:00 AM",
      Jueves: "8:00 PM - 2:00 AM",
      Viernes: "8:00 PM - 2:00 AM",
      Sábado: "1:00 PM - 2:00 AM",
      Domingo: "Cerrado",
    },
    number: "630 656 961",
    coordinates: {
      latitude: 40.4288166,
      longitude: -3.687976,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/La Flaca.jpg"),
    title: "La Flaca",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "9:00 AM - 12:00 AM",
      Martes: "9:00 AM - 12:00 AM",
      Miércoles: "9:00 AM - 1:00 AM",
      Jueves: "9:00 AM - 1:00 AM",
      Viernes: "9:00 AM - 2:00 AM",
      Sábado: "12:00 PM - 2:00 AM",
      Domingo: "12:00 PM - 12:00 AM",
    },
    number: "609 089 494",
    coordinates: {
      latitude: 40.4288828,
      longitude: -3.6874267,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/marieta.jpg"),
    title: "Marieta",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 1:00 AM",
      Martes: "1:00 PM - 2:00 AM",
      Miércoles: "1:00 PM - 2:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:30 AM",
      Sábado: "11:00 AM - 2:30 AM",
      Domingo: "11:00 AM - 2:30 AM",
    },
    number: "915 757 553",
    coordinates: {
      latitude: 40.4338889,
      longitude: -3.6877778,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Chambao Madrid.jpg"),
    title: "Chambao Madrid",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 2:00 AM",
      Martes: "1:00 PM - 2:00 AM",
      Miércoles: "1:00 PM - 2:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "1:00 PM - 2:00 AM",
      Domingo: "1:00 PM - 2:00 AM",
    },
    number: "916 009 647",
    coordinates: {
      latitude: 40.4268248,
      longitude: -3.6894579,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Fanatico.jpg"),
    title: "Fanatico",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:30 PM - 12:00 AM",
      Martes: "1:30 PM - 12:00 AM",
      Miércoles: "1:30 PM - 12:00 AM",
      Jueves: "1:30 PM - 12:00 AM",
      Viernes: "2:00 PM - 12:00 AM",
      Sábado: "1:30 PM - 12:00 AM",
      Domingo: "1:30 PM - 12:00 AM",
    },
    number: "910 888 840",
    coordinates: {
      latitude: 40.4354529,
      longitude: -3.6896221,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/slvj2.jpg"),
    title: "SLVJ",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:30 PM - 4:00 AM",
      Martes: "1:30 PM - 4:00 AM",
      Miércoles: "1:30 PM - 4:00 AM",
      Jueves: "1:30 PM - 4:00 AM",
      Viernes: "1:30 PM - 4:00 AM",
      Sábado: "1:30 PM - 4:00 AM",
      Domingo: "1:30 PM - 4:00 AM",
    },
    number: "911 088 818",
    coordinates: {
      latitude: 40.42821500,
      longitude: -3.68321820,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Aarde.jpg"),
    title: "Aarde",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:30 PM - 2:00 AM",
      Martes: "12:30 PM - 2:00 AM",
      Miércoles: "12:30 PM - 2:00 AM",
      Jueves: "12:30 PM - 2:00 AM",
      Viernes: "12:30 PM - 2:00 AM",
      Sábado: "12:30 PM - 2:00 AM",
      Domingo: "12:30 PM - 2:00 AM",
    },
    number: "910 889 330",
    coordinates: {
      latitude: 40.41952930,
      longitude: -3.68959320,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Tuetano.jpg"),
    title: "Tuétano",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "5:00 PM - 12:00 AM",
      Miércoles: "5:00 PM - 12:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "12:30 PM - 2:00 AM",
      Domingo: "12:30 PM - 5:00 PM",
    },
    number: "919 900 299",
    coordinates: {
      latitude: 40.43656050,
      longitude: -3.69921030,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Casa Suecia.jpg"),
    title: "Casa Suecia",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 1:00 AM",
      Martes: "8:00 AM - 1:00 AM",
      Miércoles: "8:00 AM - 1:00 AM",
      Jueves: "8:00 AM - 3:30 AM",
      Viernes: "8:00 AM - 3:30 AM",
      Sábado: "8:00 AM - 3:30 AM",
      Domingo: "8:00 AM - 1:00 AM",
    },
    number: "910 513 592",
    coordinates: {
      latitude: 40.41790180,
      longitude: -3.69626770,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Habanera.jpg"),
    title: "Habanera",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 1:00 AM",
      Martes: "1:00 PM - 2:00 AM",
      Miércoles: "1:00 PM - 2:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:30 AM",
      Sábado: "11:00 AM - 2:30 AM",
      Domingo: "11:00 AM - 2:30 AM",
    },
    number: "917 372 017",
    coordinates: {
      latitude: 40.42536040,
      longitude: -3.69177440,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Gaston.jpg"),
    title: "Gaston",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "8:00 PM - 2:00 AM",
      Miércoles: "8:00 PM - 2:00 AM",
      Jueves: "8:00 PM - 2:00 AM",
      Viernes: "8:00 PM - 3:00 AM",
      Sábado: "2:00 PM - 3:00 AM",
      Domingo: "6:00 PM - 11:00 PM",
    },
    number: "-",
    coordinates: {
      latitude: 40.42205980,
      longitude: -3.68591640,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Toni 2 piano Bar.jpg"),
    title: "Toni 2 piano Bar",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "11:30 PM - 12:00 AM",
      Martes: "11:30 PM - 12:00 AM",
      Miércoles: "11:30 PM - 12:00 AM",
      Jueves: "11:30 PM - 12:00 AM",
      Viernes: "10:00 PM - 12:00 AM",
      Sábado: "10:00 PM - 12:00 AM",
      Domingo: "11:30 PM - 12:00 AM",
    },
    number: "915 320 011",
    coordinates: {
      latitude: 40.42263390,
      longitude: -3.69476750,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Vandido.jpg"),
    title: "Vandido",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "12:00 AM - 6:00 AM",
      Jueves: "12:00 AM - 6:00 AM",
      Viernes: "12:00 AM - 6:00 AM",
      Sábado: "12:00 AM - 6:00 AM",
      Domingo: "Cerrado",
    },
    number: "919 930 385",
    coordinates: {
      latitude: 40.42519220,
      longitude: -3.67791260,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/victoria.jpg"),
    title: "Victoria",
    category: "Bars & Clubs",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "603 482 073",
    coordinates: {
      latitude: 40.42904970,
      longitude: -3.68733600,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Morris Club.jpg"),
    title: "Morris Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:00 AM - 3:00 AM",
      Martes: "12:00 AM - 3:00 AM",
      Miércoles: "12:00 AM - 4:00 AM",
      Jueves: "12:00 AM - 6:00 AM",
      Viernes: "12:00 AM - 6:00 AM",
      Sábado: "12:00 AM - 6:00 AM",
      Domingo: "12:00 AM - 6:00 AM",
    },    
    number: "913 192 651",
    coordinates: {
      latitude: 40.43442440,
      longitude: -3.68995410,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Rubicon.jpg"),
    title: "Rubicon",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "12:00 AM - 5:30 AM",
      Jueves: "12:00 AM - 5:30 AM",
      Viernes: "12:00 AM - 6:00 AM",
      Sábado: "12:00 AM - 6:00 AM",
      Domingo: "Cerrado",
    },
    number: "682 182 405",
    coordinates: {
      latitude: 40.42251370,
      longitude: -3.68984400,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
    
  },
  {
    path: require("../../assets/Madrid/Gabana.jpg"),
    title: "Gabana",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "12:00 AM - 5:30 AM",
      Jueves: "12:00 AM - 5:30 AM",
      Viernes: "12:00 AM - 6:00 AM",
      Sábado: "12:00 AM - 6:00 AM",
      Domingo: "Cerrado",
    },
    number: "919 992 323",
    coordinates: {
      latitude: 40.43765590,
      longitude: -3.67967240,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Gunilla.jpg"),
    title: "Gunilla",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "12:00 AM - 5:30 AM",
      Jueves: "12:00 AM - 5:30 AM",
      Viernes: "12:00 AM - 5:30 AM",
      Sábado: "12:00 AM - 5:30 AM",
      Domingo: "Cerrado",
    },
    number: "910 562 953",
    coordinates: {
      latitude: 40.42260660,
      longitude: -3.69100730,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Lula Club.jpg"),
    title: "Lula Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "12:00 AM - 6:00 AM",
      Viernes: "12:00 AM - 6:00 AM",
      Sábado: "12:00 AM - 6:00 AM",
      Domingo: "Cerrado",
    },
    number: "917 37 80 40",
    coordinates: {
      latitude: 40.42137890,
      longitude: -3.70714200,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/almagro.jpg"),
    title: "Almagro Café & Bar Restaurante",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 12:00 AM",
      Martes: "8:00 AM - 12:00 AM",
      Miércoles: "8:00 AM - 12:00 AM",
      Jueves: "8:00 AM - 12:00 AM",
      Viernes: "8:00 AM - 1:00 AM",
      Sábado: "8:00 AM - 1:00 AM",
      Domingo: "10:00 AM - 12:00 AM",
    },
    number: "913 082 931",
    coordinates: {
      latitude: 40.42864490,
      longitude: -3.69443380,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Numa pompilio.jpg"),
    title: "Numa Pompilio",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 1:30 AM",
      Martes: "1:00 PM - 1:30 AM",
      Miércoles: "1:00 PM - 1:30 AM",
      Jueves: "1:00 PM - 1:30 AM",
      Viernes: "1:00 PM - 1:30 AM",
      Sábado: "1:00 PM - 1:30 AM",
      Domingo: "1:00 PM - 1:30 AM",
    },
    number: "916 859 719",
    coordinates: {
      latitude: 40.42335210,
      longitude: -3.68399740,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Zuma.jpg"),
    title: "Zuma",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 2:00 AM",
      Martes: "1:00 PM - 2:00 AM",
      Miércoles: "1:00 PM - 2:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "1:00 PM - 2:00 AM",
      Domingo: "1:00 PM - 2:00 AM",
    },    
    number: " 911 988 880",
    coordinates: {
      latitude: 40.42642390,
      longitude: -3.68954750,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/picalagartos.jpg"),
    title: "Picalagartos Sky Bar & Restaurant",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 8:00 PM",
      Martes: "8:00 AM - 8:00 PM",
      Miércoles: "8:00 AM - 8:00 PM",
      Jueves: "8:00 AM - 8:00 PM",
      Viernes: "8:00 AM - 10:00 PM",
      Sábado: "10:00 AM - 10:00 PM",
      Domingo: "Cerrado",
    },
    number: "915 301 761",
    coordinates: {
      latitude: 40.41977910,
      longitude: -3.70122130,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Tatel.jpg"),
    title: "Tatel",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 1:00 AM",
      Martes: "1:00 PM - 1:00 AM",
      Miércoles: "1:00 PM - 1:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "1:00 PM - 2:00 AM",
      Domingo: "1:00 PM - 1:00 AM",
    },
    number: "911 721 841",
    coordinates: {
      latitude: 40.43246180,
      longitude: -3.68780340,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/margarita.jpg"),
    title: "Margarita",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "9:00 PM - 2:30 AM",
      Miércoles: "9:00 PM - 2:30 AM",
      Jueves: "7:00 PM - 1:00 AM",
      Viernes: "7:00 PM - 1:00 AM",
      Sábado: "1:30 PM - 1:00 AM",
      Domingo: "Cerrado",
    },
    number: "616 844 224",
    coordinates: {
      latitude: 40.43703870,
      longitude: -3.68090160,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Terraza abc Sky.jpg"),
    title: "Terraza abc Sky",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "7:00 PM - 3:00 AM",
      Martes: "7:00 PM - 3:00 AM",
      Miércoles: "7:00 PM - 3:00 AM",
      Jueves: "7:00 PM - 3:00 AM",
      Viernes: "7:00 PM - 3:00 AM",
      Sábado: "7:00 PM - 3:00 AM",
      Domingo: "7:00 PM - 3:00 AM",
    },
    number: "910 881 541",
    coordinates: {
      latitude: 40.43235760,
      longitude: -3.68703190,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Red Project Sushi.jpg"),
    title: "Red Project Sushi",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 PM - 11:30 PM",
      Martes: "8:00 PM - 11:30 PM",
      Miércoles: "8:00 PM - 12:30 AM",
      Jueves: "8:00 PM - 12:30 AM",
      Viernes: "8:00 PM - 12:30 AM",
      Sábado: "8:00 PM - 12:30 AM",
      Domingo: "8:00 PM - 11:30 PM",
    },
    number: "619 585 012",
    coordinates: {
      latitude: 40.42126500,
      longitude: -3.69015710,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Kuu Kuu.jpg"),
    title: "Kuikku Handroll Bar",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 PM - 11:00 PM",
      Martes: "8:00 PM - 11:00 PM",
      Miércoles: "8:00 PM - 11:00 PM",
      Jueves: "1:00 PM - 12:00 AM",
      Viernes: "1:00 PM - 12:00 AM",
      Sábado: "1:00 PM - 12:00 AM",
      Domingo: "1:00 PM - 6:00 PM",
    },
    number: "-",
    coordinates: {
      latitude: 40.42839530,
      longitude: -3.68407410,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/ten con ten.jpg"),
    title: "Ten con Ten",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 2:00 AM",
      Martes: "1:00 PM - 2:00 AM",
      Miércoles: "1:00 PM - 2:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "1:00 PM - 2:00 AM",
      Domingo: "1:00 PM - 2:00 AM",
    },
    number: "915 759 254",
    coordinates: {
      latitude: 40.42784550,
      longitude: -3.68850960,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Perrachica.jpg"),
    title: "Perrachica",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 2:00 AM",
      Martes: "1:00 PM - 2:00 AM",
      Miércoles: "1:00 PM - 2:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:30 AM",
      Sábado: "11:00 AM - 2:30 AM",
      Domingo: "11:00 AM - 2:00 AM",
    },
    number: "917 377 775",
    coordinates: {
      latitude: 40.43373430,
      longitude: -3.70279220,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/La fonda lironda.jpg"),
    title: "La Fonda Lironda",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 1:00 AM",
      Martes: "1:00 PM - 1:00 AM",
      Miércoles: "1:00 PM - 1:00 AM",
      Jueves: "1:00 PM - 2:00 AM",
      Viernes: "1:00 PM - 2:30 AM",
      Sábado: "1:00 PM - 2:30 AM",
      Domingo: "1:00 PM - 1:00 AM",
    },    
    number: "911 088 881",
    coordinates: {
      latitude: 40.42609180,
      longitude: -3.69226320,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Inclan Brutal Bar.jpg"),
    title: "Inclan Brutal Bar",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:00 PM - 1:30 AM",
      Martes: "1:00 PM - 1:30 AM",
      Miércoles: "1:00 PM - 1:30 AM",
      Jueves: "1:00 PM - 1:30 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "1:00 PM - 2:00 AM",
      Domingo: "1:00 PM - 1:30 AM",
    },
    number: "910 238 038",
    coordinates: {
      latitude: 40.41506230,
      longitude: -3.70191350,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Inclan Brutal Bar.jpg"),
    title: "Inclan Brutal Baaaar",
    category: "Eventos",
    hours: {
      Lunes: "1:00 PM - 1:30 AM",
      Martes: "1:00 PM - 1:30 AM",
      Miércoles: "1:00 PM - 1:30 AM",
      Jueves: "1:00 PM - 1:30 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "1:00 PM - 2:00 AM",
      Domingo: "1:00 PM - 1:30 AM",
    },
    number: "910 238 038",
    coordinates: {
      latitude: 40.4225554,
      longitude: -3.6908309,
    },
    availableDates: ["15 Jan", "16 Jan", "17 Jan"],
    DaySpecial: "Evento Especial",
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },

];

export default boxInfo;
