const boxInfo = [
  {
    path: require("../../assets/Lisboa/praia_no_parquee.jpg"),
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
      latitude: 38.7301071,
      longitude: -9.1532305,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/palacio_Chaiado.jpg"),
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
    priority: false, // Add this property
  },

  {
    path: require("../../assets/Lisboa/mama_shelter.jpg"),
    title: "Mama Shelter",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-",
    },
    number: "21 054 9899",
    coordinates: {
      latitude: 38.7208955,
      longitude: -9.1523714,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
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
    number: "-",
    coordinates: {
      latitude: 38.7253583,
      longitude: -9.1535022,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Praca_das_flores.jpg"),
    title: "Praça das Flores",
    category: "Bars & Clubs",
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-",
    },
    number: "-",
    coordinates: {
      latitude: 38.714855,
      longitude: -9.1516277,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },

  {
    path: require("../../assets/Lisboa/Rumu.jpg"),
    title: "Rumu",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "8:00 PM - 3:00 AM",
      Viernes: "8:00 PM - 4:00 AM",
      Sábado: "8:00 PM - 4:00 AM",
      Domingo: "Cerrado",
    },
    number: "963 048 787",
    coordinates: {
      latitude: 38.7113519,
      longitude: -9.1424033,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },

  {
    path: require("../../assets/Lisboa/Mona_Verde.jpg"),
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/SEEN.jpg"),
    title: "SEEN",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "06:30 PM - 01:00 AM",
      Martes: "06:30 PM - 01:00 AM",
      Miércoles: "06:30 PM - 01:00 AM",
      Jueves: "06:30 PM - 01:00 AM",
      Viernes: "06:30 PM - 02:00 AM",
      Sábado: "06:30 PM - 02:00 AM",
      Domingo: "06:30 PM - 01:00 AM",
    },
    number: "210 965 775",
    coordinates: {
      latitude: 38.72105140,
      longitude: -9.14728440,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: true, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Jncquoi_club.jpg"),
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
      latitude: 38.72028,
      longitude: -9.1449959,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Jncquoi_Avenida.jpg"),
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
    priority: false, // Add this property
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/lux_Fragil.jpg"),
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
    priority: false, // Add this property
  },
 
  {
    path: require("../../assets/Lisboa/Mome.jpg"),
    title: "MOME",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:00 AM - 6:00 AM",
      Martes: "Cerrado",
      Miércoles: "12:00 AM - 6:00 AM",
      Jueves: "12:00 AM - 11:59 PM",
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Rive_Rouge.jpg"),
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
    priority: false, // Add this property
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/lust_in_rio.jpg"),
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
    priority: false, // Add this property
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
    priority: false, // Add this property
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Casa_Santi.jpg"),
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Beca_Beca_2.jpg"),
    title: "Beca Beca",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "11:00 AM - 9:00 PM",
      Martes: "11:00 AM - 9:00 PM",
      Miércoles: "11:00 AM - 9:00 PM",
      Jueves: "11:00 AM - 9:00 PM",
      Viernes: "11:00 AM - 9:00 PM",
      Sábado: "11:00 AM - 9:00 PM",
      Domingo: "11:00 AM - 9:00 PM",
    },
    number: "914 103 112",
    coordinates: {
      latitude: 38.7283001,
      longitude: -9.1526828,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Bairro_alto.webp"),
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
    number: "-",
    coordinates: {
      latitude: 38.7128331,
      longitude: -9.1450582,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/SKY_BAR.jpg"),
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
    priority: true,
  },
  {
    path: require("../../assets/Lisboa/Mini_Bar_Avillez.jpg"),
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
      latitude: 38.7122668,
      longitude: -9.1424025,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Sud_Lisboa.jpg"),
    title: "SUD_Lisboa",
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Java_Rooftop.jpg"),
    title: "Java Rooftop",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-",
    },
    number: "935 945 545",
    coordinates: {
      latitude: 38.7076621,
      longitude: -9.1468819,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
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
    number: "910 271 177",
    coordinates: {
      latitude: 38.718489,
      longitude: -9.1322327,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
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
      latitude: 38.7030827,
      longitude: -9.162038,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/cerbejaria_liberdade.jpg"),
    title: "Cervejaria Liberdade",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:30 PM - 11:30 PM",
      Martes: "12:30 PM - 11:30 PM",
      Miércoles: "12:30 PM - 11:30 PM",
      Jueves: "12:30 PM - 11:30 PM",
      Viernes: "12:30 PM - 11:30 PM",
      Sábado: "12:30 PM - 11:30 PM",
      Domingo: "12:30 PM - 11:30 PM",
    },
    number: "213 198 620",
    coordinates: {
      latitude: 38.72102950,
      longitude: -9.14693150,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },

  {
    path: require("../../assets/Lisboa/cinco_Lounge.jpg"),
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/faz_frio.jpg"),
    title: "Faz Frio",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 PM - 12:00 AM",
      Martes: "12:00 PM - 12:00 AM",
      Miércoles: "12:00 PM - 12:00 AM",
      Jueves: "12:00 PM - 12:00 AM",
      Viernes: "12:00 PM - 2:00 AM",
      Sábado: "12:00 PM - 2:00 AM",
      Domingo: "12:00 PM - 12:00 AM",
    },
    number: "21 581 4296",
    coordinates: {
      latitude: 38.7160092,
      longitude: -9.1469233,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Lx_Factory.jpg"),
    title: "Lx Factory",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-",
    },
    number: "-",
    coordinates: {
      latitude: 38.7034979,
      longitude: -9.178873,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
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
      Domingo: "12:00 PM - 5:00 PM",
    },
    number: "213 963 535",
    coordinates: {
      latitude: 38.6994781,
      longitude: -9.1774925,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Go A Lisboa Rooftop.jpg"),
    title: "Go A Lisboa Rooftop",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-",
    },
    number: "21 594 1117",
    coordinates: {
      latitude: 38.7065681,
      longitude: -9.1723879,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
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
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Bom_o_mau_e_o_vilao.jpg"),
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
    priority: false, // Add this property
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
      latitude: 38.7074284,
      longitude: -9.1441089,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
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
      latitude: 38.6982578,
      longitude: -9.4217543,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
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
    priority: false, // Add this property
  },

  {
    path: require("../../assets/Lisboa/K Urban Beach.jpg"),
    title: "K Urban Beach",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "11:00 PM - 12:00 AM",
      Viernes: "11:00 PM - 12:00 AM",
      Sábado: "11:00 PM - 12:00 AM",
      Domingo: "12:00 AM - 6:00 AM",
    },
    number: "961 312 719",
    coordinates: {
      latitude: 38.70487280,
      longitude: -9.15498770,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
  },
  {
    path: require("../../assets/Lisboa/Ministerium Club.jpg"),
    title: "Ministerium Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "11:30 PM - 12:00 AM",
      Viernes: "11:30 PM - 12:00 AM",
      Sábado: "11:30 PM - 12:00 AM",
      Domingo: "12:00 AM - 8:00 AM",
    },
    number: "-",
    coordinates: {
      latitude: 38.70716500,
      longitude: -9.13718600,
    },
    country: "Portugal", // Agregar esta propiedad
    city: "Lisboa", // Agregado el campo de ciuda
    priority: false, // Add this property
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
      Lunes: "1:00 PM - 2:30 AM",
      Martes: "1:00 PM - 2:30 AM",
      Miércoles: "1:00 PM - 2:30 AM",
      Jueves: "1:00 PM - 2:30 AM",
      Viernes: "1:00 PM - 2:30 AM",
      Sábado: "1:00 PM - 2:30 AM",
      Domingo: "1:00 PM - 2:30 AM",
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
      Lunes: "Cerrado",
      Martes: "8:00 PM - 1:30 AM",
      Miércoles: "8:00 PM - 3:00 AM",
      Jueves: "8:00 PM - 4:00 AM",
      Viernes: "8:00 PM - 4:00 AM",
      Sábado: "6:00 PM - 4:00 AM",
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
      latitude: 40.4195293,
      longitude: -3.6895932,
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
      latitude: 40.4179018,
      longitude: -3.6962677,
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
      latitude: 40.4253604,
      longitude: -3.6917744,
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
      latitude: 40.4220598,
      longitude: -3.6859164,
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
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "12:00 AM - 5:00 AM",
      Viernes: "12:00 AM - 6:00 AM",
      Sábado: "12:00 AM - 6:00 AM",
      Domingo: "Cerrado",
    },
    number: "603 482 073",
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
      latitude: 40.4213789,
      longitude: -3.707142,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
  {
    path: require("../../assets/Madrid/almagro.jpg"),
    title: "Almagro Café & Bar Restaurante",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "8:00 AM - 2:00 AM",
      Martes: "8:00 AM - 2:00 AM",
      Miércoles: "8:00 AM - 2:00 AM",
      Jueves: "8:00 AM - 2:00 AM",
      Viernes: "8:00 AM - 2:00 AM",
      Sábado: "8:00 AM - 2:00 AM",
      Domingo: "10:00 AM - 1:00 AM",
    },
    number: "913 082 931",
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
      Lunes: "1:00 PM - 1:00 AM",
      Martes: "1:00 PM - 1:00 AM",
      Miércoles: "1:00 PM - 1:00 AM",
      Jueves: "1:00 PM - 1:00 AM",
      Viernes: "1:00 PM - 2:00 AM",
      Sábado: "12:15 PM - 2:00 AM",
      Domingo: "12:15 PM - 1:00 AM",
    },
    number: "915 301 761",
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
      latitude: 40.4324618,
      longitude: -3.6878034,
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
      latitude: 40.4370387,
      longitude: -3.6809016,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },

  {
    path: require("../../assets/Madrid/Terraza abc Sky.jpg"),
    title: "Terraza abc Sky",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "1:30 PM - 1:00 AM",
      Martes: "1:30 PM - 1:00 AM",
      Miércoles: "1:30 PM - 1:00 AM",
      Jueves: "1:30 PM - 12:00 AM",
      Viernes: "1:30 PM - 1:00 AM",
      Sábado: "1:30 PM - 1:00 AM",
      Domingo: "1:30 PM - 1:00 AM",
    },
    number: "910 881 541",
    coordinates: {
      latitude: 40.4323576,
      longitude: -3.6870319,
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
      latitude: 40.4337343,
      longitude: -3.7027922,
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
      latitude: 40.4260918,
      longitude: -3.6922632,
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
      latitude: 40.4150623,
      longitude: -3.7019135,
    },
    country: "España", // Cambiado a España
    city: "Madrid", // Cambiado a Madrid
  },
];

export default boxInfo;
