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
      <BookingWizard />
  );
}
