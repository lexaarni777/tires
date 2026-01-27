import Cart from '../../src/components/Cart/Cart';

export const metadata = {
  title: 'Корзина – MSKTires',
  description: 'Корзина покупок.',
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <main style={{ padding: 24 }}>
      <Cart />
    </main>
  );
}

