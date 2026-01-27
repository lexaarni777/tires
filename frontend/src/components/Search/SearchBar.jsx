'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchBar.module.scss';
import { getThumbnailPath } from '../../utils/thumb';
import Input from '../ui/Input';

const DEBOUNCE_MS = 300;

const SearchBar = () => {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef(null);
  const cacheRef = useRef(new Map());

  const canSearch = term.trim().length >= 2;

  useEffect(() => {
    if (!canSearch) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const id = setTimeout(async () => {
      const key = term.trim().toLowerCase();
      if (cacheRef.current.has(key)) {
        setItems(cacheRef.current.get(key));
        setOpen(true);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
        const url = `${apiBase}/products/catalog?q=${encodeURIComponent(term)}&limit=10`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Ошибка загрузки');
        const data = await resp.json();
        if (!cancelled) {
          cacheRef.current.set(key, data);
          setItems(data);
          setOpen(true);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Ошибка');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(id);
      cancelled = true;
    };
  }, [term, canSearch]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && items[highlight]) {
        e.preventDefault();
        const slug = items[highlight].article || items[highlight].id;
        router.push(`/productdetailed/${slug}`);
        setOpen(false);
        setHighlight(-1);
      } else if (term.trim()) {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(term.trim())}`);
        setOpen(false);
        setHighlight(-1);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
    }
  };

  const API_URL = useMemo(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';
    return apiBase.replace('/api', '');
  }, []);

  const getThumbUrl = (p) => {
    const rel = (p.images && p.images[0]?.image_path) || (p.model_images && p.model_images[0]?.image_path) || '';
    if (!rel) return '';
    const full = `${API_URL}${rel}`;
    return getThumbnailPath(full) || full;
  };

  const renderItem = (p, idx) => {
    const isActive = idx === highlight;
    const thumbUrl = getThumbUrl(p);
    return (
      <li
        key={p.id}
        role="option"
        aria-selected={isActive}
        className={`${styles.item} ${isActive ? styles.active : ''}`}
        onMouseEnter={() => setHighlight(idx)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const slug = p.article || p.id;
          router.push(`/productdetailed/${slug}`);
          setOpen(false);
          setHighlight(-1);
        }}
      >
        {thumbUrl ? (
          <img className={styles.thumb} src={thumbUrl} alt="" />
        ) : (
          <div className={styles.thumbPlaceholder} aria-hidden="true" />)
        }
        <div className={styles.meta}>
          <div className={styles.title}>{[p.brand, p.model].filter(Boolean).join(' ')}</div>
          <div className={styles.sub}>{[p.size, p.load_index && `LI ${p.load_index}`, p.speed_index && `SI ${p.speed_index}`].filter(Boolean).join(' · ')}</div>
        </div>
      </li>
    );
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <Input
        type="search"
        placeholder="Поиск по каталогу..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => canSearch && setOpen(true)}
        onKeyDown={onKeyDown}
        aria-expanded={open}
        aria-controls="search-suggest"
        aria-autocomplete="list"
        className={styles.input}
        fullWidth
        depth="sunkeninp"
      />
      {open && (
        <div className={styles.dropdown} role="listbox" id="search-suggest">
          {loading && <div className={styles.state}>Поиск…</div>}
          {!loading && error && <div className={styles.stateError}>{error}</div>}
          {!loading && !error && items.length === 0 && canSearch && (
            <div className={styles.state}>Ничего не найдено</div>
          )}
          {!loading && !error && items.length > 0 && (
            <ul className={styles.list}>
              {items.map((p, idx) => renderItem(p, idx))}
              <li
                className={`${styles.item} ${styles.all}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(term.trim())}`);
                  setOpen(false);
                  setHighlight(-1);
                }}
              >
                Показать все результаты
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
