import EditProfile from '../../../src/components/EditProfile/EditProfile';

export const metadata = {
  title: 'Редактирование профиля – MSKTires',
  description: 'Редактирование профиля.',
  robots: { index: false, follow: false },
};

export default function AccountEditPage() {
  return (
    <main style={{ padding: 24 }}>
      <EditProfile />
    </main>
  );
}

