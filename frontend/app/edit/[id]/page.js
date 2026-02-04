import AdminGate from '../../../src/components/AdminGate/AdminGate';
import EditProduct from '../../../src/components/EditProduct/EditProduct';

export const metadata = {
  title: 'Редактирование товара – MSKTires',
  description: 'Админ: редактирование товара.',
  robots: { index: false, follow: false },
};

export default function EditProductPage({ params }) {
  return (
    <main style={{ padding: 24 }}>
      <AdminGate>
        <EditProduct id={params.id} />
      </AdminGate>
    </main>
  );
}
