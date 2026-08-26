import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { locations, locationSlugs } from '../../../src/data/locations';
import styles from './page.module.scss';

export const dynamicParams = false;
export const dynamic = 'force-dynamic';

const getSiteBase = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');

  const requestHeaders = headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  if (!host) return '';
  const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProtocol || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  return `${protocol}://${host}`;
};

export function generateStaticParams() {
  return locationSlugs.map((city) => ({ city }));
}

export function generateMetadata({ params }) {
  const location = locations[params.city];
  if (!location) return {};

  return {
    title: `Шины и самовывоз в ${location.cityPrepositional} — MSKTires`,
    description: `MSKTires в ${location.cityPrepositional}: ${location.address}. Телефон ${location.phone}, график работы: ${location.schedule}.`,
    alternates: { canonical: `/contacts/${params.city}` },
  };
}

export default function LocationPage({ params }) {
  const location = locations[params.city];
  if (!location) notFound();

  const mapUrl = `https://yandex.ru/map-widget/v1/?ll=${location.longitude}%2C${location.latitude}&pt=${location.longitude},${location.latitude},pm2gnl&z=16`;
  const routeUrl = `https://yandex.ru/maps/?rtext=~${location.latitude}%2C${location.longitude}`;
  const siteBase = getSiteBase();
  const locationUrl = siteBase ? `${siteBase}/contacts/${params.city}` : undefined;
  const imageUrl = siteBase ? `${siteBase}${location.photo}` : undefined;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    name: `MSKTires — ${location.city}`,
    ...(locationUrl ? { url: locationUrl } : {}),
    telephone: location.phone,
    ...(imageUrl ? { image: imageUrl } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.city,
      streetAddress: location.address,
      addressCountry: 'RU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.latitude,
      longitude: location.longitude,
    },
    openingHours: location.openingHours,
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.container}>
        <p className={styles.eyebrow}>Контакты MSKTires</p>
        <h1>Шины и самовывоз в {location.cityPrepositional}</h1>
        <p className={styles.intro}>
          Перед визитом уточните наличие нужных шин у менеджера и зарезервируйте заказ.
        </p>
        <section className={styles.card} aria-label={`Контакты MSKTires в ${location.city}`}>
          <div className={styles.details}>
            <h2>Как нас найти</h2>
            <dl>
              <div><dt>Адрес</dt><dd><address>{location.address}</address></dd></div>
              <div><dt>Телефон</dt><dd><a href={`tel:${location.phoneLink}`}>{location.phone}</a></dd></div>
              <div><dt>График работы</dt><dd>{location.schedule}</dd></div>
            </dl>
            <h2>Услуги точки</h2>
            <ul>{location.services.map((service) => <li key={service}>{service}</li>)}</ul>
            <a className={styles.routeButton} href={routeUrl} target="_blank" rel="noopener noreferrer">Построить маршрут</a>
          </div>
          <div className={styles.visuals}>
            <img src={location.photo} alt={location.photoAlt} />
            <iframe title={`Карта MSKTires в ${location.city}`} src={mapUrl} loading="lazy" />
          </div>
        </section>
      </div>
    </main>
  );
}
