import React, { useEffect, useState } from "react";
import styles from "./Contacts.module.scss";

const socialLinks = [
  { label: "VK", href: "https://vk.com/msktires" },
  { label: "Telegram", href: "https://t.me/msktires" },
  { label: "YouTube", href: "https://www.youtube.com/@msktires" },
];

const mapLocations = [
  {
    city: "Москва",
    latitude: 55.625559,
    longitude: 37.436271,
    coordinates: "55.625559, 37.436271",
    address: "Территория Торговый Комплекс Автомастер, М69-70",
    schedule: "Пн–Сб 09:00–17:00",
    markerPreset: "pm2gnl",
    zoom: 16,
    hint: "Навигатор: координаты 55.625559, 37.436271.",
    display: "+7 (999) 914-30-09",
    link: "+79999143009",
    photo: "moscow-workshop.webp",
    photoAlt: "Вход в шинный центр MskTires в Москве",
  },
  {
    city: "Волгоград",
    latitude: 48.758023,
    longitude: 44.523404,
    coordinates: "48.758023, 44.523404",
    address: "ул. Землячки, 47Г",
    schedule: "Пн–Пт 09:00–17:00",
    markerPreset: "pm2gnl",
    zoom: 16,
    hint: "Навигатор: координаты 48.758023, 44.523404.",
    display: "+7 (905) 434-30-09",
    link: "+79054343009",
    photo: "volgograd-workshop.webp",
    photoAlt: "Фасад магазина и шиномонтажа MskTires в Волгограде",
  },
];

const Contacts = () => {
  const [copiedCity, setCopiedCity] = useState(null);

  useEffect(() => {
    if (!copiedCity) {
      return undefined;
    }

    const timer = setTimeout(() => setCopiedCity(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedCity]);

  const handleCopyCoordinates = (city, coordinates) => async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(coordinates);
      } else {
        window.prompt("Скопируйте координаты", coordinates);
      }
      setCopiedCity(city);
    } catch (error) {
      console.error("Не удалось скопировать координаты", error);
      window.prompt("Скопируйте координаты", coordinates);
    }
  };

  const handleOpenNavigator = (latitude, longitude) => () => {
    const routeUrl = `https://yandex.ru/maps/?rtext=~${latitude}%2C${longitude}`;
    window.open(routeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className={styles.contactsPage}>
      <h2>Контакты</h2>

      <div className={styles.sectionStack}>
        <div className={`${styles.contactsBlock} ${styles.socialBlock}`}>
          <h3>Мы в социальных сетях</h3>
          <p>Следите за новостями, акциями и обзорами.</p>
          <ul className={styles.socialList}>
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${styles.contactsBlock} ${styles.locationsBlock}`}>
          <h3>Как нас найти</h3>
          <div className={styles.mapItems}>
            {mapLocations.map((location) => {
              const {
                city,
                latitude,
                longitude,
                coordinates,
                address,
                schedule,
                markerPreset,
                zoom,
                hint,
                link,
                display,
                photo,
                photoAlt,
              } = location;
              const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${longitude}%2C${latitude}&pt=${longitude},${latitude},${markerPreset}&z=${zoom}`;

              return (
                <div key={city} className={styles.mapItem}>
                  <h4>{city}</h4>
                  <div className={styles.mapTop}>
                    <div className={styles.mapDetails}>
                      <p className={styles.mapPhone}>
                        <a href={`tel:${link}`}>{display}</a>
                      </p>
                      <address>{address}</address>
                      <span className={styles.schedule}>{schedule}</span>
                      <p className={styles.mapHint}>{hint}</p>
                      <div className={styles.mapActions}>
                        <button
                          type="button"
                          className={styles.mapButton}
                          onClick={handleCopyCoordinates(city, coordinates)}
                        >
                          {copiedCity === city ? "Скопировано" : "Скопировать координаты"}
                        </button>
                        <button
                          type="button"
                          className={styles.mapButton}
                          onClick={handleOpenNavigator(latitude, longitude)}
                        >
                          Построить маршрут
                        </button>
                      </div>
                    </div>
                    {photo && (
                      <div className={styles.mapPhoto}>
                        <img src={photo} alt={photoAlt} loading="lazy" />
                      </div>
                    )}
                  </div>
                  <div className={styles.mapWrapper}>
                    <iframe
                      title={`Магазин MskTires в городе ${city}`}
                      src={mapSrc}
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.note}>
            Перед визитом уточните наличие шин у менеджера.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contacts;
