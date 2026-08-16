import UserTyreBookings from '../../../src/components/UserTyreBookings/UserTyreBookings';

export const metadata = {
  title: 'Мои записи – MSKTires',
  description: 'Записи шиномонтажа.',
  robots: { index: false, follow: false },
};

export default function AccountBookingsPage() {
  return (
      <UserTyreBookings />
  );
}
