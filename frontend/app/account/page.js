import Account from '../../src/components/Account/Account';

export const metadata = {
  title: 'Личный кабинет – MSKTires',
  description: 'Личный кабинет.',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <main style={{ padding: 24 }}>
      <Account />
    </main>
  );
}

