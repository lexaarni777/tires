import AdminGate from '../../../src/components/AdminGate/AdminGate';
import AdminOrders from '../../../src/components/AdminOrders/AdminOrders';

export const metadata = {
  title: 'Админ: заказы – MSKTires',
  description: 'Админ: управление заказами.',
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return (
    <main style={{ padding: 24 }}>
      <AdminGate>
        <AdminOrders />
      </AdminGate>
    </main>
  );
}
