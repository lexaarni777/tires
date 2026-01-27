import ProductList from '../../src/components/ProductList/ProductList';

export const metadata = {
  title: 'Каталог шин – MSKTires',
  description: 'Каталог шин MSKTires: бренды, размеры, сезонность и наличие.',
};

export default function ProductListPage() {
  return (
    <main style={{ padding: 24 }}>
      <ProductList />
    </main>
  );
}
