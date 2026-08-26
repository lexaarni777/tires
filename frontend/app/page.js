import TyreSelector from '../src/components/TyreSelector/TyreSelector';

export const metadata = {
  title: 'Шины в Москве и Волгограде — MSKTires',
  description: 'Подбор и продажа автомобильных шин с наличием по городам и записью на шиномонтаж.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <main><TyreSelector /></main>
  );
}
