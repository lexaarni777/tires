import AdminGate from '../../src/components/AdminGate/AdminGate';
import UserManagement from '../../src/components/UserManagement/UserManagement';

export const metadata = {
  title: 'Менеджер пользователей – MSKTires',
  description: 'Админ: управление пользователями.',
  robots: { index: false, follow: false },
};

export default function UserManagementPage() {
  return (
      <AdminGate>
        <UserManagement />
      </AdminGate>
  );
}
