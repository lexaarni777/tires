import dynamic from 'next/dynamic';

export const metadata = {
  title: 'Онлайн‑запись на шиномонтаж – MSKTires',
  description: 'Запишитесь на шиномонтаж онлайн: выберите радиус, услуги и удобное время.',
};

const BookingWizard = dynamic(() => import('../../src/components/Booking/BookingWizard'), {
  ssr: false,
});

export default function BookingPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Онлайн‑запись на шиномонтаж</h1>
      <p style={{ maxWidth: 720 }}>
        Выберите радиус, услуги и удобное время. Запись доступна для города Москва (можно переключить город в шапке).
      </p>
      <BookingWizard />
    </main>
  );
}

