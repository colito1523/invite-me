const boxInfo = [
  {
    path: require("../../assets/Lisboa/Praia No Parque.jpg"),
    title: "Praia No Parque",
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
      latitude: 38.7283001,
      longitude: -9.1526828,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    isPrivate: false, // Evento general
  },
  {
    path: require("../../assets/Lisboa/palacio Chaiado.jpg"),
    title: "Palacio Chiado",
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
      latitude: 38.7096823,
      longitude: -9.143029,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    isPrivate: false, // Evento general
  },

  // {
  //   path: require("../../assets/Lisboa/palacio Chaiado.jpg"),
  //   title: "Palacio Chiado",
  //   category: "Eventos",  SI QUEREMOS AGREGAR UN EVENTO PONEMOS AQUI
  //   hours: {
  //     Lunes: "8:00 AM - 8:00 PM",
  //     Martes: "8:00 AM - 8:00 PM",
  //     Miércoles: "8:00 AM - 8:00 PM",
  //     Jueves: "8:00 AM - 8:00 PM",
  //     Viernes: "8:00 AM - 10:00 PM",
  //     Sábado: "10:00 AM - 10:00 PM",
  //     Domingo: "Cerrado",
  //   },
  //   number: "1160419607",
  //   coordinates: {
  //     latitude: 38.7096823,
  //     longitude: -9.143029,
  //   },
  //   country: "Portugal", // Agregar esta propiedad
  //   city: "Lisboa", // Agregado el campo de ciuda
  //   isPrivate: false, // Evento general
  // },
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
    number: "1160419607",
    coordinates: {
      latitude: 38.7208955,
      longitude: -9.1523714,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  // {
  //   path: require("../../assets/Lisboa/corner.webp"),
  //   title: "Corner",
  //   category: "Bars & Clubs",
  //   hours: {
  //     Lunes: "8:00 AM - 8:00 PM",
  //     Martes: "8:00 AM - 8:00 PM",
  //     Miércoles: "8:00 AM - 8:00 PM",
  //     Jueves: "8:00 AM - 8:00 PM",
  //     Viernes: "8:00 AM - 10:00 PM",
  //     Sábado: "10:00 AM - 10:00 PM",
  //     Domingo: "Cerrado",
  //   },
  //   number: "1160419607",
  //   coordinates: {
  //     latitude: 38.7253583,
  //     longitude: -9.1535022,
  //   },
  //   country: "Portugal", // Agregar esta propiedad
  //   city: "Lisboa", // Agregado el campo de ciuda
  // },
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
    path: require("../../assets/Lisboa/Mona Verde.jpg"),
    title: "Mona Verde",
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
      latitude: 38.7071959,
      longitude: -9.1538892,
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
      Lunes: "11:00 AM - 01:00 AM",
      Martes: "11:00 AM - 01:00 AM",
      Miércoles: "11:00 AM - 01:00 AM",
      Jueves: "11:00 AM - 01:00 AM",
      Viernes: "11:00 AM - 01:00 AM",
      Sábado: "11:00 AM - 01:00 AM",
      Domingo: "11:00 AM - 01:00 PM",
    },
    number: "935945545",
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
    number: "1160419607",
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
      latitude: 38.7141649,
      longitude: -9.1497258,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  // {
  //   path: require("../../assets/Lisboa/faz-frio.webp"),
  //   title: "Faz Frio",
  //   category: "Restaurants & Rooftops",
  //   hours: {
  //     Lunes: "8:00 AM - 8:00 PM",
  //     Martes: "8:00 AM - 8:00 PM",
  //     Miércoles: "8:00 AM - 8:00 PM",
  //     Jueves: "8:00 AM - 8:00 PM",
  //     Viernes: "8:00 AM - 10:00 PM",
  //     Sábado: "10:00 AM - 10:00 PM",
  //     Domingo: "Cerrado",
  //   },
  //   number: "1160419607",
  //   coordinates: {
  //     latitude: 38.7160092,
  //     longitude: -9.1469233,
  //   },
  //   country: "Portugal", // Agregar esta propiedad
  //   city: "Lisboa", // Agregado el campo de ciuda
  // },
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
      latitude: 38.6994781,
      longitude: -9.1774925,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Ponto Final.jpg"),
    title: "Ponto Final",
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
      latitude: 38.6849737,
      longitude: -9.1577017,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
  },
  {
    path: require("../../assets/Lisboa/Golden.jpg"),
    title: "Golden Vista",
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
    number: "1160419607",
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
      latitude: 40.4354529,
      longitude: -3.6896221,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/SLVJ.jpg"),
    title: "SLVJ",
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
      latitude: 40.428215,
      longitude: -3.6832182,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Aarde.jpg"),
    title: "Aarde",
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
      latitude: 40.4195293,
      longitude: -3.6895932,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Tuétano.jpg"),
    title: "Tuétano",
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
      latitude: 40.4365605,
      longitude: -3.6992103,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Casa Suecia.jpg"),
    title: "Casa Suecia",
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
      latitude: 40.4225554,
      longitude: -3.6908309,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Habanera.jpg"),
    title: "Habanera",
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
      latitude: 40.4253604,
      longitude: -3.6917744,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Toni 2 piano Bar.jpg"),
    title: "Toni 2 piano Bar",
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
      latitude: 40.4226339,
      longitude: -3.6947675,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Vandido.jpg"),
    title: "Vandido",
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
      latitude: 40.4251922,
      longitude: -3.6779126,
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
    number: "1160419607",
    coordinates: {
      latitude: 40.4290497,
      longitude: -3.687336,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Morris Club.jpg"),
    title: "Morris Club",
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
      latitude: 40.4344244,
      longitude: -3.6899541,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Rubicon.jpg"),
    title: "Rubicon",
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
      latitude: 40.4225137,
      longitude: -3.689844,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
    
  },
  {
    path: require("../../assets/Madrid/Gabana.jpg"),
    title: "Gabana",
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
      latitude: 40.4376559,
      longitude: -3.6796724,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Gunilla.jpg"),
    title: "Gunilla",
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
      latitude: 40.4226066,
      longitude: -3.6910073,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Lula Club.jpg"),
    title: "Lula Club",
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
      latitude: 40.4213789,
      longitude: -3.707142,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Istar.jpg"),
    title: "Almagro Café & Bar Restaurante",
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
      latitude: 40.4286449,
      longitude: -3.6944338,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Numa pompilio.jpg"),
    title: "Numa Pompilio",
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
      latitude: 40.4233521,
      longitude: -3.6839974,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Zuma.jpg"),
    title: "Zuma",
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
      latitude: 40.4264239,
      longitude: -3.6895475,
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
    number: "1160419607",
    coordinates: {
      latitude: 40.4197791,
      longitude: -3.7012213,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Tatel.jpg"),
    title: "Tatel",
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
      latitude: 40.4324618,
      longitude: -3.6878034,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Terraza abc Sky.jpg"),
    title: "Terraza abc Sky",
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
      latitude: 40.4324618,
      longitude: -3.6878034,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Red Project Sushi.jpg"),
    title: "Red Project Sushi",
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
      latitude: 40.421265,
      longitude: -3.6901571,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Kuu Kuu.jpg"),
    title: "Kuikku Handroll Bar",
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
      latitude: 40.4283953,
      longitude: -3.6840741,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/ten con ten.jpg"),
    title: "Ten con Ten",
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
      latitude: 40.4278455,
      longitude: -3.6885096,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/Perrachica.jpg"),
    title: "Perrachica",
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
      latitude: 40.4225554,
      longitude: -3.6908309,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/La fonda lironda.jpg"),
    title: "La Fonda Lironda",
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
      latitude: 40.4225554,
      longitude: -3.6908309,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Inclan Brutal Bar.jpg"),
    title: "Inclan Brutal Bar",
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
      latitude: 40.4225554,
      longitude: -3.6908309,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
];

export default boxInfo;
