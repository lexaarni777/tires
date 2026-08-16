import '../src/index.css';
import '../src/styles/_typography.scss';
import Layout from '../src/components/Layout';
import Providers from './providers';

const metadataBase = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : undefined;

export const metadata = {
  metadataBase,
  title: 'MSKTires',
  description: 'MSKTires - Шины и Диски',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
