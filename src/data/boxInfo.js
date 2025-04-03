const boxInfo = [
  {
    path: require("../../assets/Lisboa/Tagide.jpg"),
    title: "Tágide Gastrobar",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "18:30 - 23:00",
      Miércoles: "18:30 - 23:00",
      Jueves: "18:30 - 23:00",
      Viernes: "18:30 - 23:00",
      Sábado: "18:30 - 23:00",
      Domingo: "Cerrado"
    },
    number: "+351 968 842 888",
    coordinates: {
      latitude: 38.70831910,
      longitude: -9.13998250,
    },
    country: "Portugal",
    city: "Lisboa",
    priority: true, // Esto hace que aparezca en la sección de priorida


  },
  {
    path: require("../../assets/Lisboa/SonarLisboa.jpg"),
    title: "Sónar Lisboa 2025",
    category: "Festivities",
    details: {
      es: "El Sónar regresa a Lisboa los días 11, 12 y 13 de abril de 2025 para dos días y dos noches de música, creatividad y tecnología en el Parque Eduardo VII",
      en: "Sónar returns to Lisbon on April 11, 12 and 13, 2025 for two days and two nights of music, creativity, and technology at Parque Eduardo VII.",
      pt: "O Sónar regressa a Lisboa nos dias 11, 12 e 13 de abril de 2025 para dois dias e duas noites de música, criatividade e tecnologia no Parque Eduardo VII",
    },  
      number: "",
    coordinates: {
      latitude: 38.72830010,
      longitude: -9.15268280,
    },
    country: "Portugal",
    city: "Lisboa",
    availableDates: ["11 Apr", "12 Apr", "13 Apr"],
    
  },
  {
    path: require("../../assets/Lisboa/moga.jpg"),
    title: "MOGA CAPARICA 2025",
    category: "Festivities",
    details: {
      es: "El MOGA regresa a la deslumbrante Costa da Caparica, en Portugal (a 20 minutos al sur de Lisboa), del 28 de mayo al 1 de junio de 2025.",
      en: "MOGA returns to the stunning Costa da Caparica in Portugal (20 minutes south of Lisbon), from May 28 to June 1, 2025.",
      pt: "O MOGA retorna à deslumbrante Costa da Caparica, em Portugal (20 min ao sul de Lisboa), de 28 de maio a 1 de junho de 2025.",
    },    
    number: "",
    coordinates: {
      latitude: 38.60324800,
      longitude: -9.21120900,
    },
    country: "Portugal",
    city: "Lisboa",
    availableDates: ["28 May", "29 May", "30 May","31 May", "1 Jun",],
    
  },
  {
    path: require("../../assets/Lisboa/lisbon.jpg"),
    title: "LISB-ON",
    category: "Festivities",
    details: {
      es: "Lisb-On es un festival vibrante al aire libre que transforma Lisboa en un jardín sonoro, combinando música electrónica, arte y naturaleza. Con una vibra única y un lineup de artistas de renombre, es el evento ideal para vivir Lisboa al ritmo de la mejor música.",
      en: "Lisb-On is a vibrant open-air festival that transforms Lisbon into a sound garden, blending electronic music, art, and nature. With a unique vibe and a lineup of renowned artists, it's the perfect event to experience Lisbon to the sound of the best music.",
      pt: "O Lisb-On é um festival vibrante ao ar livre que transforma Lisboa num jardim sonoro, combinando música eletrónica, arte e natureza. Com uma vibe única e um lineup de artistas de renome, é o evento ideal para viver Lisboa ao som da melhor música!",
    },  
    number: "",
    coordinates: {
      latitude: 38.70728280,
      longitude: -9.13636130,
    },
    country: "Portugal",
    city: "Lisboa",
    availableDates: ["27 Jun", "28 Jun", "29 Jun"],
    
  },
  {
    path: require("../../assets/Lisboa/praia_no_parquee.jpg"),
    title: "Praia No Parque",
    category: "Restaurants & Rooftops",
    hours: {
      Sábado: "12:30 - 03:00",
      Domingo: "12:30 - 00:00",
      Lunes: "12:30 - 00:00",
      Martes: "12:30 - 00:00",
      Miércoles: "12:30 - 00:00",
      Jueves: "12:30 - 02:00",
      Viernes: "12:30 - 03:00"
    },
    number: "+351 968 842 888",
    coordinates: {
      latitude: 38.7301071,
      longitude: -9.1532305,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/palacio_Chaiado.jpg"),
    title: "Palacio Chiado",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:30 - 00:00",
      Martes: "12:30 - 00:00",
      Miércoles: "12:30 - 00:00",
      Jueves: "12:30 - 02:00",
      Viernes: "12:30 - 02:00",
      Sábado: "12:30 - 02:00",
      Domingo: "12:30 - 00:00"
    },
    number: "+351 210 101 184",
    coordinates: {
      latitude: 38.7096823,
      longitude: -9.143029,
    },
    country: "Portugal",
    city: "Lisboa",
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
    number: "",
    coordinates: {
      latitude: 38.714855,
      longitude: -9.1516277,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Rumu.jpg"),
    title: "Rumu",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 04:00",
      Viernes: "20:00 - 04:00",
      Sábado: "20:00 - 04:00",
      Domingo: "Cerrado"
    },
    number: "+351 963 048 787",
    coordinates: {
      latitude: 38.7113519,
      longitude: -9.1424033,
    },
    country: "Portugal",
    city: "Lisboa",
  },
  {
    path: require("../../assets/Lisboa/Jncquoi_club.jpg"),
    title: "Jncquoi Club",
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
    number: "+351 219 369 900",
    coordinates: {
      latitude: 38.72028,
      longitude: -9.1449959,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/mama_shelter1.jpg"),
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
    number: "+351 210 549 899",
    coordinates: {
      latitude: 38.7208955,
      longitude: -9.1523714,
    },
    country: "Portugal",
    city: "Lisboa",
  },
  {
    path: require("../../assets/Lisboa/Skizzo.jpg"),
    title: "Skizzo",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "18:00 - 01:00",
      Martes: "18:00 - 01:00",
      Miércoles: "18:00 - 01:00",
      Jueves: "18:00 - 01:00",
      Viernes: "18:00 - 01:00",
      Sábado: "18:00 - 01:00",
      Domingo: "Cerrado"
    },
    number: "+351 213 902 315",
    coordinates: {
      latitude: 38.70855390,
      longitude: -9.15696750,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Danoi.jpg"),
    title: "Da Noi",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "18:00 - 01:00",
      Martes: "18:00 - 01:00",
      Miércoles: "18:00 - 01:00",
      Jueves: "18:00 - 01:00",
      Viernes: "18:00 - 01:00",
      Sábado: "18:00 - 01:00",
      Domingo: "Cerrado"
    },
    number: "+351 213 900 802",
    coordinates: {
      latitude: 38.70880950,
      longitude: -9.15618590,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/corner2.jpg"),
    title: "Corner",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:00 - 00:00",
      Martes: "12:00 - 00:00",
      Miércoles: "12:00 - 02:00",
      Jueves: "12:00 - 02:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "Cerrado"
    },
    number: "",
    coordinates: {
      latitude: 38.7253583,
      longitude: -9.1535022,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Collect4.jpg"),
    title: "Collect",
    category: "Bars & Clubs",
    hours: {
      Lunes: "17:00 - 02:00",
      Martes: "17:00 - 02:00",
      Miércoles: "17:00 - 02:00",
      Jueves: "17:00 - 02:00",
      Viernes: "12:00 - 03:00",
      Sábado: "12:00 - 03:00",
      Domingo: "12:00 - 02:00"
    },
    number: "+351 913 808 371",
    coordinates: {
      latitude: 38.70742840,
      longitude: -9.14410890,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Java_Rooftop.jpg"),
    title: "Java",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 - 01:00",
      Martes: "12:00 - 01:00",
      Miércoles: "12:00 - 01:00",
      Jueves: "12:00 - 01:00",
      Viernes: "12:00 - 01:00",
      Sábado: "12:00 - 01:00",
      Domingo: "12:00 - 01:00"
    },
    number: "+351 935 945 545",
    coordinates: {
      latitude: 38.7076621,
      longitude: -9.1468819,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/lux_Fragil1.jpg"),
    title: "Lux Frágil",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves:  "-",
      Viernes: "23:00 - 06:00",
      Sábado: "23:00 - 06:00",
      Domingo: "00:00 - 06:00"
    },    
    number: "+351 218 820 890",
    coordinates: {
      latitude: 38.7148909,
      longitude: -9.1205341,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Jncquoi_Avenida2.jpg"),
    title: "Jncquoi Avenida",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 - 00:00",
      Martes: "12:00 - 00:00",
      Miércoles: "12:00 - 00:00",
      Jueves: "12:00 - 02:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 00:00"
    },
    number: "+351 219 369 900",
    coordinates: {
      latitude: 38.72028,
      longitude: -9.1449959,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/SEEN.jpg"),
    title: "SEEN",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "18:30 - 01:00",
      Martes: "18:30 - 01:00",
      Miércoles: "18:30 - 01:00",
      Jueves: "18:30 - 01:00",
      Viernes: "18:30 - 02:00",
      Sábado: "18:30 - 02:00",
      Domingo: "18:30 - 01:00"
    },
    number: "+351 210 965 775",
    coordinates: {
      latitude: 38.72105140,
      longitude: -9.14728440,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Rocco.jpg"),
    title: "Rocco",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "08:00 - 01:00",
      Martes: "08:00 - 01:00",
      Miércoles: "08:00 - 01:00",
      Jueves: "08:00 - 01:00",
      Viernes: "08:00 - 01:00",
      Sábado: "08:00 - 01:00",
      Domingo: "08:00 - 01:00"
    },
    number: "+351 210 543 168",
    coordinates: {
      latitude: 38.70955470,
      longitude: -9.14018130,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Sud_Lisboa2.jpg"),
    title: "SUD",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 - 01:00",
      Martes: "12:00 - 01:00",
      Miércoles: "12:00 - 01:00",
      Jueves: "12:00 - 01:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 01:00"
    },
    number: "+351 211 592 700",
    coordinates: {
      latitude: 38.6963541,
      longitude: -9.1917573,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/8_marvila.jpg"),
    title: "8 marvila",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "12:00 - 00:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 22:00"
    },    
    number: "",
    coordinates: {
      latitude: 38.74228450,
      longitude: -9.10209180,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Bairro_alto.webp"),
    title: "Bairro Alto",
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
    number: "",
    coordinates: {
      latitude: 38.7128331,
      longitude: -9.1450582,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Bar_Alimentar.jpg"),
    title: "Bar Alimentar",
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
    number: "+351 927 932 885",
    coordinates: {
      latitude: 38.71423350,
      longitude: -9.15305580,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Meceiria.jpg"),
    title: "Mercearia Pachecas",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "08:00 - 22:00",
      Miércoles: "08:00 - 22:00",
      Jueves: "08:00 - 22:00",
      Viernes: "08:00 - 22:00",
      Sábado: "08:00 - 22:00",
      Domingo: "Cerrado"
    },
    number: "+351 915 394 817",
    coordinates: {
      latitude: 38.72447670,
      longitude: -9.15598330,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/faz_frio.jpg"),
    title: "Faz Frio",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 - 00:00",
      Martes: "12:00 - 00:00",
      Miércoles: "12:00 - 00:00",
      Jueves: "12:00 - 00:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 00:00"
    },
    number: "+351 215 814 296",
    coordinates: {
      latitude: 38.7160092,
      longitude: -9.1469233,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Bom_o_mau_e_o_vilao.jpg"),
    title: "O bom o mau e o vilão",
    category: "Bars & Clubs",
    hours: {
      Lunes: "19:00 - 02:00",
      Martes: "19:00 - 02:00",
      Miércoles: "19:00 - 02:00",
      Jueves: "19:00 - 02:00",
      Viernes: "19:00 - 03:00",
      Sábado: "19:00 - 03:00",
      Domingo: "19:00 - 02:00"
    },
    number: "+351 963 982 094",
    coordinates: {
      latitude: 38.7073563,
      longitude: -9.1435333,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/SKY_BAR.jpg"),
    title: "Sky Bar",
    category: "Bars & Clubs",
    hours: {
      Lunes: "12:30 - 01:00",
      Martes: "12:30 - 01:00",
      Miércoles: "12:30 - 01:00",
      Jueves: "12:30 - 01:00",
      Viernes: "12:30 - 02:00",
      Sábado: "12:30 - 02:00",
      Domingo: "12:30 - 01:00"
    },    
    number: "+351 210 965 775",
    coordinates: {
      latitude: 38.7209984,
      longitude: -9.147139,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Mini_Bar_Avillez.jpg"),
    title: "Mini Bar Avillez",
    category: "Bars & Clubs",
    hours: {
      Lunes: "19:00 - 02:00",
      Martes: "19:00 - 02:00",
      Miércoles: "19:00 - 02:00",
      Jueves: "19:00 - 03:00",
      Viernes: "19:00 - 03:00",
      Sábado: "19:00 - 03:00",
      Domingo: "19:00 - 02:00"
    },
    number: "+351 211 305 393",
    coordinates: {
      latitude: 38.7122668,
      longitude: -9.1424025,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Brilhante.jpg"),
    title: "Brilhante",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "19:00 - 00:00",
      Martes: "19:00 - 00:00",
      Miércoles: "19:00 - 00:00",
      Jueves: "19:00 - 01:00",
      Viernes: "19:00 - 01:00",
      Sábado: "12:00 - 00:00",
      Domingo: "12:00 - 00:00"
    },
    number: "+351 210 547 981",
    coordinates: {
      latitude: 38.7078843,
      longitude: -9.1470788,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/cerbejaria_liberdade.jpg"),
    title: "Cervejaria Liberdade",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:30 - 23:30",
      Martes: "12:30 - 23:30",
      Miércoles: "12:30 - 23:30",
      Jueves: "12:30 - 23:30",
      Viernes: "12:30 - 23:30",
      Sábado: "12:30 - 23:30",
      Domingo: "12:30 - 23:30"
    },
    number: "+351 213 198 620",
    coordinates: {
      latitude: 38.72102950,
      longitude: -9.14693150,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Cabal.jpg"),
    title: "Cabal",
    category: "Bars & Clubs",
    hours: {
      Lunes: "18:00 - 00:00",
      Martes: "18:00 - 00:00",
      Miércoles: "18:00 - 00:00",
      Jueves: "18:00 - 00:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 00:00",
    },
    number: "+351 964 057 333",
    coordinates: {
      latitude: 38.71515280,
      longitude: -9.13865350,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/douro.jpg"),
    title: "Duro",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "12:00 - 00:00",
      Miércoles: "12:00 - 00:00",
      Jueves: "12:00 - 00:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 00:00"
    },
    number: "+351 968 842 888",
    coordinates: {
      latitude: 38.7301071,
      longitude: -9.1532305,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/hangar.jpg"),
    title: "HANGAR",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "15:00 - 19:00",
      Jueves: "15:00 - 19:00",
      Viernes: "15:00 - 19:00",
      Sábado: "15:00 - 19:00",
      Domingo: "Cerrado"
    },
    number: "+351 910 271 177",
    coordinates: {
      latitude: 38.718489,
      longitude: -9.1322327,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/tuttopassa.jpg"),
    title: "TUTTO PASSA",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:30 - 01:00",
      Martes: "12:30 - 01:00",
      Miércoles: "12:30 - 01:00",
      Jueves: "12:30 - 02:00",
      Viernes: "12:30 - 03:00",
      Sábado: "12:30 - 03:00",
      Domingo: "12:30 - 01:00"
    },
    number: "+351 914 110 791",
    coordinates: {
      latitude: 38.7030827,
      longitude: -9.162038,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Mome.jpg"),
    title: "MOME",
    category: "Bars & Clubs",
    hours: {
      Lunes: "00:00 - 06:00",
      Martes: "Cerrado",
      Miércoles: "00:00 - 06:00",
      Jueves: "00:00 - 06:00",
      Viernes: "00:00 - 07:00",
      Sábado: "00:00 - 06:00",
      Domingo: "00:00 - 06:00"
    },
    number: "+351 211 510 734",
    coordinates: {
      latitude: 38.7059725,
      longitude: -9.1574549,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Rive_Rouge.jpg"),
    title: "Rive Rouge",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves:  "-",
      Viernes: "23:30 - 06:00",
      Sábado: "23:30 - 06:00",
      Domingo: "00:00 - 06:00"
    },
    number: "+351 213 461 117",
    coordinates: {
      latitude: 38.7074149,
      longitude: -9.1461322,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Plateau.jpg"),
    title: "Plateau",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "00:00 - 06:00",
      Jueves: "00:00 - 06:00",
      Viernes: "00:00 - 06:00",
      Sábado: "00:00 - 06:00",
      Domingo: "00:00 - 06:00"
    },
    number: "+351 911 126 402",
    coordinates: {
      latitude: 38.7063889,
      longitude: -9.1575,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/lust_in_rio.jpg"),
    title: "Lust in rio",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "00:00 - 06:00",
      Jueves: "00:00 - 06:00",
      Viernes: "00:00 - 06:00",
      Sábado: "00:00 - 06:00",
      Domingo: "Cerrado"
    },
    number: "+351 913 795 242",
    coordinates: {
      latitude: 38.706027,
      longitude: -9.1499039,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/K Urban Beachh.jpg"),
    title: "K Urban Beach",
    category: "Bars & Clubs",
    hours: {
      Lunes: "23:30 - 05:30",
      Martes: "23:30 - 05:30",
      Miércoles: "23:30 - 05:30",
      Jueves: "23:30 - 05:30",
      Viernes: "23:30 - 05:30",
      Sábado: "23:30 - 06:00",
      Domingo: "23:30 - 06:00",
    },
    number: "+351 961 312 719",
    coordinates: {
      latitude: 38.70487280,
      longitude: -9.15498770,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/MInisterium.jpg"),
    title: "Ministerium Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves:  "-",
      Viernes: "23:30 - 08:00",
      Sábado: "23:30 - 08:00",
      Domingo: "00:00 - 08:00"
    },
    number: "",
    coordinates: {
      latitude: 38.70716500,
      longitude: -9.13718600,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/Casa_Santi.jpg"),
    title: "Casa Santi",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "12:00 - 02:00",
      Miércoles: "12:00 - 02:00",
      Jueves: "12:00 - 02:00",
      Viernes: "12:00 - 02:00",
      Sábado: "18:00 - 02:00",
      Domingo: "Cerrado"
    },
    number: "+351 926 286 634",
    coordinates: {
      latitude: 38.7071959,
      longitude: -9.1538892,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/jamaica.jpg"),
    title: "Jamaica",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "00:00 - 07:00",
      Jueves: "00:00 - 07:00",
      Viernes: "00:00 - 07:00",
      Sábado: "00:00 - 07:00",
      Domingo: "00:00 - 07:00",
    },
    number: "+351 213 462 265",
    coordinates: {
      latitude: 38.7053888,
      longitude: -9.1467954,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/cinco_Lounge.jpg"),
    title: "Cinco Lounge",
    category: "Bars & Clubs",
    hours: {
      Lunes: "20:00 - 02:00",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "20:00 - 02:00",
      Sábado: "20:00 - 02:00",
      Domingo: "20:00 - 02:00"
    },
    number: "+351 213 424 033",
    coordinates: {
      latitude: 38.7141649,
      longitude: -9.1497258,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/hifen.jpg"),
    title: "Hífen",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "18:30 - 00:00",
      Martes: "12:30 - 00:00",
      Miércoles: "12:30 - 00:00",
      Jueves: "12:30 - 00:00",
      Viernes: "12:30 - 02:00",
      Sábado: "12:30 - 02:00",
      Domingo: "12:30 - 00:00"
    },
    number: "+351 915 546 537",
    coordinates: {
      latitude: 38.6962004,
      longitude: -9.42026,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Lisboa/malacopa.jpg"),
    title: "Malacopa",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "18:00 - 00:00",
      Martes: "12:00 - 00:00",
      Miércoles: "12:00 - 00:00",
      Jueves: "12:00 - 00:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 00:00"
    },    
    number: "+351 967 643 319",
    coordinates: {
      latitude: 38.6982578,
      longitude: -9.4217543,
    },
    country: "Portugal",
    city: "Lisboa",
    
  },
  {
    path: require("../../assets/Madrid/Gaston.jpg"),
    title: "Gaston",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "",
    coordinates: {
      latitude: 40.4220598,
      longitude: -3.6859164,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Tuetano.jpg"),
    title: "Tuétano",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "17:00 - 00:00",
      Miércoles: "17:00 - 00:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:00",
      Sábado: "12:30 - 02:00",
      Domingo: "12:30 - 17:00"
    },
    number: "+34 919 900 299",
    coordinates: {
      latitude: 40.4365605,
      longitude: -3.6992103,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Istar.jpg"),
    title: "Istar",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "00:00 - 05:00",
      Miércoles: "00:00 - 05:00",
      Jueves: "00:00 - 05:30",
      Viernes: "00:30 - 06:00",
      Sábado: "00:30 - 06:00",
      Domingo: "Cerrado"
    },
    number: "+34 661 785 374",
    coordinates: {
      latitude: 40.428745,
      longitude: -3.6875565,
    },
    country: "España",
    city: "Madrid",
    
  },
  {
    path: require("../../assets/Madrid/Giselle.jpg"),
    title: "Giselle",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "20:00 - 03:30",
      Jueves: "20:00 - 05:00",
      Viernes: "20:00 - 05:00",
      Sábado: "20:00 - 05:00",
      Domingo: "Cerrado"
    },    
    number: "+34 621 146 274",
    coordinates: {
      latitude: 40.4225554,
      longitude: -3.6908309,
    },
    country: "España",
    city: "Madrid",
    
  },
  {
    path: require("../../assets/Madrid/Charrua.jpg"),
    title: "Charrúa Madrid",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "19:30 - 00:00",
      Martes: "19:30 - 00:00",
      Miércoles: "19:30 - 00:00",
      Jueves: "19:30 - 00:00",
      Viernes: "19:30 - 00:00",
      Sábado: "19:30 - 00:00",
      Domingo: "19:30 - 00:00"
    },
    number: "+34 912 791 601",
    coordinates: {
      latitude: 40.42230760,
      longitude: -3.69407760,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Blondie.jpg"),
    title: "Blondie Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "23:00 - 5:30",
      Viernes: "23:00 - 5:30",
      Sábado: "23:00 - 5:30",
      Domingo: "Cerrado"
    },
    number: "+34 917 373 837",
    coordinates: {
      latitude: 40.42549240,
      longitude: -3.68546890,
    },
    country: "España",
    city: "Madrid",
    
  },



  {
    path: require("../../assets/Madrid/slvj2.jpg"),
    title: "SLVJ",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:30 - 04:00",
      Martes: "13:30 - 04:00",
      Miércoles: "13:30 - 04:00",
      Jueves: "13:30 - 04:00",
      Viernes: "13:30 - 04:00",
      Sábado: "13:30 - 04:00",
      Domingo: "13:30 - 04:00"
    },
    number: "+34 911 088 818",
    coordinates: {
      latitude: 40.428215,
      longitude: -3.6832182,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Amazonico.jpg"),
    title: "Amazonico",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 02:30",
      Martes: "13:00 - 02:30",
      Miércoles: "13:00 - 02:30",
      Jueves: "13:00 - 02:30",
      Viernes: "13:00 - 02:30",
      Sábado: "13:00 - 02:30",
      Domingo: "13:00 - 02:30"
    },
    number: "+34 915 154 332",
    coordinates: {
      latitude: 40.423715,
      longitude: -3.6850997,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Jungle_Jazz_Club.jpg"),
    title: "Jungle Jazz Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "20:00 - 04:00",
      Martes: "20:00 - 04:00",
      Miércoles: "20:00 - 04:00",
      Jueves: "20:00 - 04:00",
      Viernes: "20:00 - 04:00",
      Sábado: "20:00 - 04:00",
      Domingo: "20:00 - 04:00"
    },
    number: "+34 915 154 332",
    coordinates: {
      latitude: 40.423715,
      longitude: -3.6850997,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Los_33.jpg"),
    title: "Los 33",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "18:00 - 02:00",
      Martes: "13:00 - 02:00",
      Miércoles: "13:00 - 02:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:30",
      Sábado: "11:30 - 02:30",
      Domingo: "12:30 - 19:00"
    },    
    number: "+34 914 997 258",
    coordinates: {
      latitude: 40.4238428,
      longitude: -3.6948365,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Castellana_8.jpg"),
    title: "Castellana 8",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 01:30",
      Miércoles: "20:00 - 03:00",
      Jueves: "20:00 - 04:00",
      Viernes: "20:00 - 04:00",
      Sábado: "18:00 - 04:00",
      Domingo: "Cerrado"
    }
    ,
    number: "+34 671 334 996",
    coordinates: {
      latitude: 40.4274487,
      longitude: -3.6893616,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Panthera.jpg"),
    title: "Panthera",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "20:00 - 02:00",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 03:00",
      Viernes: "20:00 - 03:00",
      Sábado: "20:00 - 03:00",
      Domingo: "20:30 - 03:30"
    },    
    number: "+34 689 879 114",
    coordinates: {
      latitude: 40.4361839,
      longitude: -3.6916115,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Nomada.jpg"),
    title: "Nômâda",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "20:00 - 02:00",
      Sábado: "20:00 - 02:00",
      Domingo: "Cerrado"
    },
    number: "+34 630 656 961",
    coordinates: {
      latitude: 40.4288166,
      longitude: -3.687976,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Arrogante.jpg"),
    title: "Arrogante",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "20:00 - 01:00",
      Martes: "20:00 - 01:00",
      Miércoles: "20:00 - 01:00",
      Jueves: "20:00 - 01:00",
      Viernes: "14:00 - 02:00",
      Sábado: "13:30 - 02:00",
      Domingo: "13:30 - 01:00"
    },    
    number: "+34 917 37 69 70",
    coordinates: {
      latitude: 40.43326880,
      longitude: -3.68328290,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/La_Flaca.jpg"),
    title: "La Flaca",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "09:00 - 00:00",
      Martes: "09:00 - 00:00",
      Miércoles: "09:00 - 01:00",
      Jueves: "09:00 - 01:00",
      Viernes: "09:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 00:00"
    },
    number: "+34 609 089 494",
    coordinates: {
      latitude: 40.4288828,
      longitude: -3.6874267,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Chambao_Madrid.jpg"),
    title: "Chambao Madrid",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 02:00",
      Martes: "13:00 - 02:00",
      Miércoles: "13:00 - 02:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:00",
      Sábado: "13:00 - 02:00",
      Domingo: "13:00 - 02:00"
    },
    number: "+34 916 009 647",
    coordinates: {
      latitude: 40.4268248,
      longitude: -3.6894579,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Fanatico.jpg"),
    title: "Fanatico",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:30 - 00:00",
      Martes: "13:30 - 00:00",
      Miércoles: "13:30 - 00:00",
      Jueves: "13:30 - 00:00",
      Viernes: "14:00 - 00:00",
      Sábado: "13:30 - 00:00",
      Domingo: "13:30 - 00:00"
    },
    number: "+34 910 888 840",
    coordinates: {
      latitude: 40.4354529,
      longitude: -3.6896221,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Aarde.jpg"),
    title: "Aarde",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 02:00",
      Martes: "13:00 - 02:00",
      Miércoles: "13:00 - 02:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:00",
      Sábado: "13:00 - 02:00",
      Domingo: "13:00 - 02:00"
    },
    number: "+34 910 889 330",
    coordinates: {
      latitude: 40.4195293,
      longitude: -3.6895932,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Casa_Suecia.jpg"),
    title: "Casa Suecia",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "08:00 - 01:00",
      Martes: "08:00 - 01:00",
      Miércoles: "08:00 - 01:00",
      Jueves: "08:00 - 03:30",
      Viernes: "08:00 - 03:30",
      Sábado: "08:00 - 03:30",
      Domingo: "08:00 - 01:00"
    },
    number: "+34 910 513 592",
    coordinates: {
      latitude: 40.4179018,
      longitude: -3.6962677,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Habanera.jpg"),
    title: "Habanera",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 01:00",
      Martes: "13:00 - 02:00",
      Miércoles: "13:00 - 02:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:30",
      Sábado: "11:00 - 02:30",
      Domingo: "11:00 - 02:30"
    },
    number: "+34 917 372 017",
    coordinates: {
      latitude: 40.4253604,
      longitude: -3.6917744,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Toni_2_piano_Bar.jpg"),
    title: "Toni 2 piano Bar",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "23:30 - 05:30",
      Martes: "23:30 - 05:30",
      Miércoles: "23:30 - 05:30",
      Jueves: "23:30 - 05:30",
      Viernes: "22:00 - 06:00",
      Sábado: "22:00 - 06:00",
      Domingo: "23:30 - 05:30"
    },
    number: "+34 915 320 011",
    coordinates: {
      latitude: 40.4226339,
      longitude: -3.6947675,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Vandido.jpg"),
    title: "Vandido",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "00:00 - 06:00",
      Jueves: "00:00 - 06:00",
      Viernes: "00:00 - 06:00",
      Sábado: "00:00 - 06:00",
      Domingo: "Cerrado"
    },    
    number: "+34 919 930 385",
    coordinates: {
      latitude: 40.4251922,
      longitude: -3.6779126,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/victoria.jpg"),
    title: "Victoria",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "00:00 - 05:00",
      Viernes: "00:00 - 06:00",
      Sábado: "00:00 - 06:00",
      Domingo: "Cerrado"
    },
    number: "+34 603 482 073",
    coordinates: {
      latitude: 40.4290497,
      longitude: -3.687336,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Morris_Club.jpg"),
    title: "Morris Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "00:00 - 03:00",
      Martes: "00:00 - 03:00",
      Miércoles: "00:00 - 04:00",
      Jueves: "00:00 - 06:00",
      Viernes: "00:00 - 06:00",
      Sábado: "00:00 - 06:00",
      Domingo: "00:00 - 06:00"
    },
    number: "+34 913 192 651",
    coordinates: {
      latitude: 40.4344244,
      longitude: -3.6899541,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Rubicon.jpg"),
    title: "Rubicon",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "00:00 - 05:30",
      Jueves: "00:00 - 05:30",
      Viernes: "00:00 - 06:00",
      Sábado: "00:00 - 06:00",
      Domingo: "Cerrado"
    }
    ,
    number: "+34 682 182 405",
    coordinates: {
      latitude: 40.4225137,
      longitude: -3.689844,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Gabana.jpg"),
    title: "Gabana",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "00:00 - 05:30",
      Jueves: "00:00 - 05:30",
      Viernes: "00:00 - 06:00",
      Sábado: "00:00 - 06:00",
      Domingo: "Cerrado"
    },    
    number: "+34 919 992 323",
    coordinates: {
      latitude: 40.4376559,
      longitude: -3.6796724,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Gunilla.jpg"),
    title: "Gunilla",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "00:00 - 05:30",
      Jueves: "00:00 - 05:30",
      Viernes: "00:00 - 05:30",
      Sábado: "00:00 - 05:30",
      Domingo: "Cerrado"
    },
    number: "+34 910 562 953",
    coordinates: {
      latitude: 40.4226066,
      longitude: -3.6910073,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Lula_Club.jpg"),
    title: "Lula Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "00:00 - 06:00",
      Viernes: "00:00 - 06:00",
      Sábado: "00:00 - 06:00",
      Domingo: "Cerrado"
    },
    number: "+34 917 37 80 40",
    coordinates: {
      latitude: 40.4213789,
      longitude: -3.707142,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Numa_pompilio.jpg"),
    title: "Numa Pompilio",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 01:30",
      Martes: "13:00 - 01:30",
      Miércoles: "13:00 - 01:30",
      Jueves: "13:00 - 01:30",
      Viernes: "13:00 - 01:30",
      Sábado: "13:00 - 01:30",
      Domingo: "13:00 - 01:30"
    }
    ,
    number: "+34 916 859 719",
    coordinates: {
      latitude: 40.4233521,
      longitude: -3.6839974,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Zuma.jpg"),
    title: "Zuma",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 02:00",
      Martes: "13:00 - 02:00",
      Miércoles: "13:00 - 02:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:00",
      Sábado: "13:00 - 02:00",
      Domingo: "13:00 - 02:00"
    },
    number: "+34 911 988 880",
    coordinates: {
      latitude: 40.4264239,
      longitude: -3.6895475,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/picalagartos.jpg"),
    title: "Picalagartos Sky Bar & Restaurant",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 01:00",
      Martes: "13:00 - 01:00",
      Miércoles: "13:00 - 01:00",
      Jueves: "13:00 - 01:00",
      Viernes: "13:00 - 02:00",
      Sábado: "12:15 - 02:00",
      Domingo: "12:15 - 01:00"
    },
    number: "+34 915 301 761",
    coordinates: {
      latitude: 40.4197791,
      longitude: -3.7012213,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Tatel.jpg"),
    title: "Tatel",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 01:00",
      Martes: "13:00 - 01:00",
      Miércoles: "13:00 - 01:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:00",
      Sábado: "13:00 - 02:00",
      Domingo: "13:00 - 01:00"
    },    
    number: "+34 911 721 841",
    coordinates: {
      latitude: 40.4324618,
      longitude: -3.6878034,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/margarita.jpg"),
    title: "Margarita",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "21:00 - 02:30",
      Miércoles: "21:00 - 02:30",
      Jueves: "19:00 - 01:00",
      Viernes: "19:00 - 01:00",
      Sábado: "13:30 - 01:00",
      Domingo: "Cerrado"
    },
    number: "+34 616 844 224",
    coordinates: {
      latitude: 40.4370387,
      longitude: -3.6809016,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Terraza_abc_Sky.jpg"),
    title: "Terraza abc Sky",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:30 - 01:00",
      Martes: "13:30 - 01:00",
      Miércoles: "13:30 - 01:00",
      Jueves: "13:30 - 00:00",
      Viernes: "13:30 - 01:00",
      Sábado: "13:30 - 01:00",
      Domingo: "13:30 - 01:00"
    },
    number: "+34 910 881 541",
    coordinates: {
      latitude: 40.4323576,
      longitude: -3.6870319,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Red_Project_Sushi.jpg"),
    title: "Red Project Sushi",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "20:00 - 23:30",
      Martes: "20:00 - 23:30",
      Miércoles: "20:00 - 00:30",
      Jueves: "20:00 - 00:30",
      Viernes: "20:00 - 00:30",
      Sábado: "20:00 - 00:30",
      Domingo: "20:00 - 23:30"
    },    
    number: "+34 619 585 012",
    coordinates: {
      latitude: 40.421265,
      longitude: -3.6901571,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/ten_con_ten.jpg"),
    title: "Ten con Ten",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 02:00",
      Martes: "13:00 - 02:00",
      Miércoles: "13:00 - 02:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:00",
      Sábado: "13:00 - 02:00",
      Domingo: "13:00 - 02:00"
    },
    number: "+34 915 759 254",
    coordinates: {
      latitude: 40.4278455,
      longitude: -3.6885096,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Perrachica.jpg"),
    title: "Perrachica",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 - 02:00",
      Martes: "12:00 - 02:00",
      Miércoles: "12:00 - 02:00",
      Jueves: "12:00 - 02:00",
      Viernes: "12:00 - 02:00",
      Sábado: "11:00 - 02:30",
      Domingo: "11:00 - 02:00"
    },
    number: "+34 917 377 775",
    coordinates: {
      latitude: 40.4337343,
      longitude: -3.7027922,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/La_fonda_lironda.jpg"),
    title: "La Fonda Lironda",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 01:00",
      Martes: "13:00 - 01:00",
      Miércoles: "13:00 - 01:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:30",
      Sábado: "13:00 - 02:30",
      Domingo: "13:00 - 01:00"
    },
    number: "+34 911 088 881",
    coordinates: {
      latitude: 40.4260918,
      longitude: -3.6922632,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Inclan_Brutal_Bar.jpg"),
    title: "Inclan Brutal Bar",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 01:30",
      Martes: "13:00 - 01:30",
      Miércoles: "13:00 - 01:30",
      Jueves: "13:00 - 01:30",
      Viernes: "13:00 - 02:00",
      Sábado: "13:00 - 02:00",
      Domingo: "13:00 - 01:30"
    },
    number: "+34 910 238 038",
    coordinates: {
      latitude: 40.4150623,
      longitude: -3.7019135,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/Manero.jpg"),
    title: "Manero",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "13:00 - 01:00",
      Martes: "13:00 - 01:00",
      Miércoles: "13:00 - 01:00",
      Jueves: "13:00 - 02:00",
      Viernes: "13:00 - 02:00",
      Sábado: "13:00 - 02:00",
      Domingo: "13:00 - 01:00"
    },
    number: "+34 911 042 760",
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/TheLibraryWineBoutique.jpg"),
    title: "The Library Wine Boutique",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "10:00 - 02:00",
      Martes: "10:00 - 02:00",
      Miércoles: "10:00 - 02:00",
      Jueves: "10:00 - 02:00",
      Viernes: "10:00 - 02:30",
      Sábado: "10:00 - 02:30",
      Domingo: "10:00 - 02:00"
    },    
    number: "+34 913 304 262",
    coordinates: {
      latitude: 40.42074380,
      longitude: -3.68837000,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/ClubMatador.jpg"),
    title: "Club Matador",
    category: "Bars & Clubs",
    hours: {
      Lunes: "08:30 - 01:00",
      Martes: "08:30 - 01:00",
      Miércoles: "08:30 - 01:00",
      Jueves: "08:30 - 01:00",
      Viernes: "08:30 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 18:00"
    },    
    number: "+34 918 057 277",
    coordinates: {
      latitude: 40.42417700,
      longitude: -3.68734340,
    },
    country: "España",
    city: "Madrid",
    membersClub: true,
  },
  {
    path: require("../../assets/Madrid/ForbesHouse.jpg"),
    title: "Forbes House",
    category: "Bars & Clubs",
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-"
    },
    number: "+34 911 263 744",
    coordinates: {
      latitude: 40.42717870,
      longitude: -3.69153510,
    },
    country: "España",
    city: "Madrid",
    membersClub: true,
  },
  {
    path: require("../../assets/Madrid/FITZ.jpg"),
    title: "FITZ",
    category: "Bars & Clubs",
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-"
    },
    number: "+34 919 93 03 85",
    coordinates: {
      latitude: 40.42452900,
      longitude: -3.71207100,
    },
    country: "España",
    city: "Madrid",
  },
  {
    path: require("../../assets/Madrid/PunchRoom.jpg"),
    title: "Punch Room - TME",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "08:00 - 02:00",
      Jueves: "08:00 - 02:00",
      Viernes: "08:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "Cerrado"
    },
    number: "+34 919 54 54 88",
    coordinates: {
      latitude: 40.41766980,
      longitude: -3.70626980,
    },
    country: "España",
    city: "Madrid",
  },


  {
    path: require("../../assets/Londres/34_mayfair.jpg"),
    title: "34 Mayfair",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 - 23:00",
      Martes: "12:00 - 23:00",
      Miércoles: "12:00 - 23:00",
      Jueves: "12:00 - 23:00",
      Viernes: "12:00 - 23:00",
      Sábado: "11:00 - 23:00",
      Domingo: "11:00 - 22:00"
    },
    number: "020 3350 3434",
    coordinates: {
      latitude: 51.50945060,
      longitude: -0.15172310,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/The_aqua_Shard.jpg"),
    title: "The aqua Shard",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "17:30 - 22:30",
      Martes: "17:30 - 22:30",
      Miércoles: "17:30 - 22:30",
      Jueves: "17:30 - 22:30",
      Viernes: "Cerrado",
      Sábado: "Cerrado",
      Domingo: "17:30 - 22:30"
    },
    number: "020 3011 1256",
    coordinates: {
      latitude: 51.50423110,
      longitude: -0.08656240,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Dear_Darling_Mayfair.jpg"),
    title: "Dear Darling Mayfair",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "23:00 - 03:30",
      Viernes: "23:00 - 03:30",
      Sábado: "23:00 - 03:30",
      Domingo: "23:00 - 03:30"
    },
    number: "020 3740 6936",
    coordinates: {
      latitude: 51.50828830,
      longitude: -0.13708580,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/HUMO.jpg"),
    title: "HUMO",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "18:00 - 22:00",
      Martes: "18:00 - 22:00",
      Miércoles: "18:00 - 22:00",
      Jueves: "18:00 - 22:00",
      Viernes: "18:00 - 22:00",
      Sábado: "18:00 - 22:00",
      Domingo: "Cerrado"
    },
    number: "020 3327 3690",
    coordinates: {
      latitude: 51.51249320,
      longitude: -0.14308650,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Sushisamba.jpg"),
    title: "Sushisamba",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 - 01:30",
      Martes: "12:00 - 01:30",
      Miércoles: "12:00 - 01:30",
      Jueves: "12:00 - 01:30",
      Viernes: "12:00 - 01:30",
      Sábado: "12:00 - 01:30",
      Domingo: "12:00 - 01:30"
    },    
    number: "020 3640 7330",
    coordinates: {
      latitude: 51.51625290,
      longitude: -0.08094490,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/The_Cukoo_Club.jpg"),
    title: "The Cukoo Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "23:00 - 03:30",
      Jueves: "23:00 - 03:30",
      Viernes: "23:00 - 03:30",
      Sábado: "23:00 - 03:30",
      Domingo: "Cerrado"
    },    
    number: "",
    coordinates: {
      latitude: 51.50996320,
      longitude: -0.13792690,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/B_London.jpg"),
    title: "B London",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "22:00 - 02:00",
      Jueves: "22:00 - 03:00",
      Viernes: "22:00 - 03:00",
      Sábado: "22:00 - 03:00",
      Domingo: "Cerrado"
    },    
    number: "020 7584 2000",
    coordinates: {
      latitude: 51.49238460,
      longitude: -0.17799800,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Soho_House.jpg"),
    title: "Soho House",
    category: ["Restaurants & Rooftops", "Bars & Clubs"],
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "020 7734 5188",
    coordinates: {
      latitude: 40.4220598,
      longitude: -3.6859164,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/maison_estelle.jpg"),
    title: "Maison Estelle",
    category: "Bars & Clubs",
    hours: {
      Lunes: "07:30 - 01:30",
      Martes: "07:30 - 01:30",
      Miércoles: "07:30 - 03:00",
      Jueves: "07:30 - 03:00",
      Viernes: "07:30 - 03:00",
      Sábado: "11:00 - 03:00",
      Domingo: "11:00 - 19:00"
    },    
    number: "",
    coordinates: {
      latitude: 51.50986000,
      longitude: -0.14360450,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/the_scotch_of_st_james.jpg"),
    title: "The scotch of St James",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "Cerrado",
      Jueves: "23:00 - 05:00",
      Viernes: "23:00 - 05:00",
      Sábado: "23:00 - 05:00",
      Domingo: "Cerrado"
    },
    number: "020 7930 7031",
    coordinates: {
      latitude: 51.50773500,
      longitude: -0.13695250,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/the_twenty_two.jpg"),
    title: "The Twenty Two",
    category: ["Restaurants & Rooftops", "Bars & Clubs"],
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-"
    },
    number: "020 3988 5022",
    coordinates: {
      latitude: 51.51132600,
      longitude: -0.14992190 ,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/the_box_soho.jpg"),
    title: "The Box Soho",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "23:00 - 04:00",
      Jueves: "23:00 - 04:00",
      Viernes: "23:00 - 04:00",
      Sábado: "23:00 - 04:00",
      Domingo: "Cerrado"
    },    
    number: "020 7434 4374",
    coordinates: {
      latitude: 51.51259740,
      longitude: -0.13402690,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/bagatelle_london.jpg"),
    title: "Bagatelle London",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "18:30 - 00:30",
      Jueves: "18:30 - 01:00",
      Viernes: "18:30 - 01:00",
      Sábado: "18:30 - 01:00",
      Domingo: "19:30 - 00:30"
    },
    number: "",
    coordinates: {
      latitude: 51.50886440,
      longitude: -0.14262860,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Tramp.jpg"),
    title: "Tramp",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "Cerrado",
      Miércoles: "19:00 - 03:00",
      Jueves: "19:00 - 03:00",
      Viernes: "19:00 - 03:00",
      Sábado: "19:00 - 03:00",
      Domingo: "Cerrado"
    },
    number: "020 7629 8888",
    coordinates: {
      latitude: 51.50781150,
      longitude: -0.13852020,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/100_wardour_street.jpg"),
    title: "100 Wardour Street",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "12:00 - 01:00",
      Miércoles: "12:00 - 01:00",
      Jueves: "12:00 - 01:00",
      Viernes: "12:00 - 03:00",
      Sábado: "12:00 - 03:00",
      Domingo: "Cerrado"
    },    
    number: "020 7314 4000",
    coordinates: {
      latitude: 51.51346390,
      longitude: -0.13384150,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Cache_cache.jpg"),
    title: "Cache Cache",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "18:00 - 23:30",
      Miércoles: "18:00 - 23:30",
      Jueves: "18:00 - 00:00",
      Viernes: "18:00 - 00:30",
      Sábado: "18:00 - 00:30",
      Domingo: "Cerrado"
    },
    number: "07555 031010",
    coordinates: {
      latitude: 51.51227370,
      longitude: -0.12344920,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Madison.jpg"),
    title: "Madison",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "12:00 - 22:00",
      Martes: "12:00 - 22:00",
      Miércoles: "12:00 - 22:00",
      Jueves: "12:00 - 22:00",
      Viernes: "12:00 - 22:30",
      Sábado: "12:00 - 22:30",
      Domingo: "12:00 - 21:30"
    },
    number: "020 3693 5160",
    coordinates: {
      latitude: 51.51387130,
      longitude: -0.09545930,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Annabels.jpg"),
    title: "Annabel’s",
    category: ["Restaurants & Rooftops", "Bars & Clubs"],
    hours: {
      Lunes: "07:30 - 01:00",
      Martes: "07:30 - 01:00",
      Miércoles: "07:30 - 03:00",
      Jueves: "07:30 - 03:00",
      Viernes: "07:30 - 03:00",
      Sábado: "11:30 - 03:00",
      Domingo: "11:30 - 00:00"
    },    
    number: "020 3915 4046",
    coordinates: {
      latitude: 51.50953280,
      longitude: -0.14490400,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Cirque_Le_Soir.jpg"),
    title: "Cirque Le Soir",
    category: "Bars & Clubs",
    hours: {
      Lunes: "23:00 - 03:00",
      Martes: "Cerrado",
      Miércoles: "23:00 - 03:00",
      Jueves: "Cerrado",
      Viernes: "23:00 - 03:00",
      Sábado: "23:00 - 03:00",
      Domingo: "Cerrado"
    },    
    number: "020 7287 8771",
    coordinates: {
      latitude: 51.51339660,
      longitude: -0.13858630,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/KOKO.jpg"),
    title: "KOKO",
    category: "Bars & Clubs",
    hours: {
      Lunes: "19:00 - 23:30",
      Martes: "19:00 - 23:30",
      Miércoles: "19:00 - 23:30",
      Jueves: "19:00 - 23:30",
      Viernes: "18:00 - 05:00",
      Sábado: "18:00 - 05:00",
      Domingo: "19:00 - 23:30"
    },    
    number: "020 7388 3222",
    coordinates: {
      latitude: 51.53475890,
      longitude: -0.13813610,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Maddox_London.jpg"),
    title: "Maddox London",
    category: "Bars & Clubs",
    hours: {
      Lunes: "-",
      Martes: "-",
      Miércoles: "-",
      Jueves: "-",
      Viernes: "-",
      Sábado: "-",
      Domingo: "-"
    },    
    number: "020 7629 8877",
    coordinates: {
      latitude: 51.51265750,
      longitude: -0.14249950,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/ParkChinois.jpg"),
    title: "Park Chinois",
    category: ["Restaurants & Rooftops", "Bars & Clubs"],
    hours: {
      Lunes: "12:00 - 00:00",
      Martes: "12:00 - 00:00",
      Miércoles: "12:00 - 00:00",
      Jueves: "12:00 - 02:00",
      Viernes: "12:00 - 02:00",
      Sábado: "12:00 - 02:00",
      Domingo: "12:00 - 00:00"
    },    
    number: "020 3327 8888",
    coordinates: {
      latitude: 51.50858060,
      longitude: -0.14371030,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Stereo.jpg"),
    title: "Stereo",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "17:30 - 01:00",
      Miércoles: "17:30 - 03:00",
      Jueves: "17:30 - 03:00",
      Viernes: "17:30 - 03:00",
      Sábado: "15:00 - 03:00",
      Domingo: "Cerrado"
    },    
    number: "020 3146 9637",
    coordinates: {
      latitude: 51.51172370,
      longitude: -0.12213360,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/fabric_London.jpg"),
    title: "Fabric London",
    category: "Bars & Clubs",
    hours: {
      Lunes: "00:00 - 04:00",
      Martes: "10:00 - 17:00",
      Miércoles: "10:00 - 17:00",
      Jueves: "10:00 - 17:00",
      Viernes: "23:00 - 00:00",
      Sábado: "12:00 - 06:00",
      Domingo: "00:00 - 07:00"
    },
    number: "",
    coordinates: {
      latitude: 51.51951740,
      longitude: -0.10275890,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/tape_london.jpg"),
    title: "Tape London",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "23:00 - 03:30",
      Miércoles: "Cerrado",
      Jueves: "Cerrado",
      Viernes: "23:00 - 03:30",
      Sábado: "23:00 - 03:30",
      Domingo: "23:00 - 03:30"
    },    
    number: "",
    coordinates: {
      latitude: 51.51433090,
      longitude: -0.14468680,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Isabel.jpg"),
    title: "Isabel",
    category: ["Restaurants & Rooftops", "Bars & Clubs"],
    hours: {
      Lunes: "12:00 - 03:00",
      Martes: "12:00 - 03:00",
      Miércoles: "12:00 - 03:00",
      Jueves: "12:00 - 03:00",
      Viernes: "12:00 - 03:00",
      Sábado: "12:00 - 03:00",
      Domingo: "12:00 - 00:00"
    },    
    number: "",
    coordinates: {
      latitude: 51.50968360,
      longitude:  -0.14253800,
    },
    country: "Inglaterra",
    city: "Londres",
  },

  {
    path: require("../../assets/Londres/SOMOSoho.jpg"),
    title: "SOMA Soho",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "020 3675 1933",
    coordinates: {
      latitude: 51.51072390,
      longitude:  -0.13537880 ,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/LaBodegaNegra.jpg"),
    title: "La Bodega Negra",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "020 4580 1186",
    coordinates: {
      latitude: 51.51365000,
      longitude: -0.12986560,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/zuma_barbarossa.jpg"),
    title: "Zuma Barbarossa",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "",
    coordinates: {
      latitude: 51.51502960,
      longitude: -0.13341290 ,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/ExperimentalCocktailClubChinatown.jpg"),
    title: "Experimental Cocktail Club",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "020 7434 3559",
    coordinates: {
      latitude: 51.51182810,
      longitude: -0.13094680,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/NighjarCarnaby.jpg"),
    title: "Nighjar Carnaby",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "",
    coordinates: {
      latitude: 51.51274740,
      longitude: -0.13851050 ,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Boneca.jpg"),
    title: "Boneca",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "",
    coordinates: {
      latitude: 51.50882470,
      longitude: -0.22301030,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/HouseofKOKO.jpg"),
    title: "House of KOKO",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "",
    coordinates: {
      latitude: 51.53466580,
      longitude: -0.13770630,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/MNKYHSE.jpg"),
    title: "MNKY HSE",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "020 3870 4880",
    coordinates: {
      latitude: 51.50817020,
      longitude: -0.14192050,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/BeatzLondon.jpg"),
    title: "Beatz London",
    category: "Bars & Clubs",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "07496 978396",
    coordinates: {
      latitude: 51.51362530,
      longitude:  -0.08286450,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/Buddah_BarLondon.jpg"),
    title: "Buddah-Bar London",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "020 3667 5222",
    coordinates: {
      latitude: 51.50159140,
      longitude: -0.16203340,
    },
    country: "Inglaterra",
    city: "Londres",
  },
  {
    path: require("../../assets/Londres/HakkasanMayfair.jpg"),
    title: "Hakkasan Mayfair",
    category: "Restaurants & Rooftops",
    hours: {
      Lunes: "Cerrado",
      Martes: "20:00 - 02:00",
      Miércoles: "20:00 - 02:00",
      Jueves: "20:00 - 02:00",
      Viernes: "18:00 - 03:00",
      Sábado: "18:00 - 03:00",
      Domingo: "18:00 - 23:00"
    },
    number: "020 7907 1888",
    coordinates: {
      latitude: 51.51018040,
      longitude: -0.14544430,
    },
    country: "Inglaterra",
    city: "Londres",
  },
];

export default boxInfo;
