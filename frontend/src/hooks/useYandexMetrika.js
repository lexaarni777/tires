import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const COUNTER_ID = 105571982;

const useYandexMetrika = () => {
  const { pathname, search, hash } = useLocation();
  const previousUrlRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.ym !== 'function') {
      return;
    }

    const url = `${window.location.origin}${pathname}${search}${hash}`;
    const referer =
      previousUrlRef.current || document.referrer || undefined;

    window.ym(COUNTER_ID, 'hit', url, {
      title: document.title,
      referer
    });

    previousUrlRef.current = url;
  }, [pathname, search, hash]);
};

export default useYandexMetrika;
