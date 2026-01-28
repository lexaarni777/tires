import AddProduct from '../../src/components/AddProduct/AddProduct';

export const metadata = {
  title: 'Добавить продукт – MSKTires',
  description: 'Админ: добавление товара.',
  robots: { index: false, follow: false },
};

export default function AddProductPage() {
  return (
    <main style={{ padding: 24 }}>
      <AddProduct />
    </main>
  );
}
