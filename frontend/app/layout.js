import '../src/index.css';
import '../src/styles/_typography.scss';
import '../src/styles/theme-ai.scss';
import Layout from '../src/components/Layout';
import Providers from './providers';

export const metadata = {
  title: 'MSKTires',
  description: 'MSKTires - Шины и Диски',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="theme-ai">
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
