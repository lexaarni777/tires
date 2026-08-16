import Orders from '../../src/components/Orders/Orders';

export const metadata = {
  title: 'Мои заказы – MSKTires',
  description: 'История заказов.',
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
      <Orders />
  );
}
