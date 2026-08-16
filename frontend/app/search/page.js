import SearchResultsClient from './SearchResultsClient';

export const metadata = {
  title: 'Поиск – MSKTires',
  description: 'Поиск по каталогу шин MSKTires.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
      <SearchResultsClient />
  );
}

