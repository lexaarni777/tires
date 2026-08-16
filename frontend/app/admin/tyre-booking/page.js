import AdminGate from '../../../src/components/AdminGate/AdminGate';
import AdminTyreBooking from '../../../src/components/AdminTyreBooking/AdminTyreBooking';

export const metadata = {
  title: 'Админ: шиномонтаж – MSKTires',
  description: 'Админ: управление записью на шиномонтаж.',
  robots: { index: false, follow: false },
};

export default function AdminTyreBookingPage() {
  return (
      <AdminGate>
        <AdminTyreBooking />
      </AdminGate>
  );
}
