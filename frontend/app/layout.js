import '../src/index.css';

export const metadata = {
  title: 'MSKTires',
  description: 'MSKTires - Шины и Диски',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

