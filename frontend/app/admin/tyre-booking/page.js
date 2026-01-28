import AdminGate from '../../../src/components/AdminGate/AdminGate';
import AdminTyreBooking from '../../../src/components/AdminTyreBooking/AdminTyreBooking';

export const metadata = {
  title: 'Админ: шиномонтаж – MSKTires',
  description: 'Админ: управление записью на шиномонтаж.',
  robots: { index: false, follow: false },
};

export default function AdminTyreBookingPage() {
  return (
    <main style={{ padding: 24 }}>
      <AdminGate>
        <AdminTyreBooking />
      </AdminGate>
    </main>
  );
}
