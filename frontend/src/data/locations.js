export const locations = {
  moscow: {
    city: 'Москва',
    cityPrepositional: 'Москве',
    address: 'Территория Торговый Комплекс Автомастер, М69-70',
    latitude: 55.625559,
    longitude: 37.436271,
    phone: '+7 (999) 914-30-09',
    phoneLink: '+79999143009',
    schedule: 'Пн–Сб 09:00–17:00',
    openingHours: 'Mo-Sa 09:00-17:00',
    photo: '/moscow-workshop.webp',
    photoAlt: 'Вход в шинный центр MskTires в Москве',
    services: ['Продажа шин', 'Самовывоз заказов', 'Шиномонтаж по предварительной записи'],
  },
  volgograd: {
    city: 'Волгоград',
    cityPrepositional: 'Волгограде',
    address: 'ул. Землячки, 47Г',
    latitude: 48.758023,
    longitude: 44.523404,
    phone: '+7 (905) 434-30-09',
    phoneLink: '+79054343009',
    schedule: 'Пн–Пт 09:00–17:00',
    openingHours: 'Mo-Fr 09:00-17:00',
    photo: '/volgograd-workshop.webp',
    photoAlt: 'Фасад магазина и шиномонтажа MskTires в Волгограде',
    services: ['Продажа шин', 'Самовывоз заказов'],
  },
};

export const locationSlugs = Object.keys(locations);
