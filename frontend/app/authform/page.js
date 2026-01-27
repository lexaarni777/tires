import AuthForm from '../../src/components/AuthForm/AuthForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Вход / Регистрация – MSKTires',
  description: 'Авторизация и регистрация в MSKTires.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function AuthFormPage() {
  return (
    <main style={{ padding: 24 }}>
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
