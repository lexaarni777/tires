import Contacts from '../../src/components/Contacts/Contacts';
import Link from 'next/link';
import styles from './page.module.scss';

export const metadata = {
  title: 'Контакты – MSKTires',
  description: 'Контактная информация MSKTires.',
};

export default function ContactsPage() {
  return (
    <>
      <Contacts />
      <section className={styles.locations} aria-label="Страницы точек MSKTires">
        <h2>Точки MSKTires</h2>
        <div>
          <Link href="/contacts/moscow">Шины и самовывоз в Москве</Link>
          <Link href="/contacts/volgograd">Шины и самовывоз в Волгограде</Link>
        </div>
      </section>
    </>
  );
}
