import React, { useEffect, useMemo, useState } from 'react';
import { FiMapPin, FiMenu, FiPhone, FiTruck, FiUser, FiX } from 'react-icons/fi';
import { FaInstagram, FaShoppingCart, FaTelegramPlane, FaVk } from 'react-icons/fa';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import styles from './Header.module.scss';
import { warehouseList } from '../../constants/warehouseList';
import { setCity } from '../../slices/citySlice';
import Button from '../ui/Button';
import SearchBar from '../Search/SearchBar';

const navItems = [
  { label: 'Главная', path: '/', qa: 'nav_home' },
  { label: 'Шины', path: '/productlist', qa: 'nav_tires' },
  { label: 'Диски', path: '/wheels', qa: 'nav_wheels' },
];

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const selectedCity = useSelector((state) => state.city?.selectedCity);
  const cartItems = useSelector((state) => state.cart?.items) || [];
  const user = useSelector((state) => state.auth?.user);

  const cities = useMemo(
    () => Array.from(new Set(warehouseList.map((warehouse) => warehouse.city))).sort(),
    []
  );

  const currentCity = useMemo(() => {
    if (selectedCity && cities.includes(selectedCity)) {
      return selectedCity;
    }
    return cities[0] || '';
  }, [cities, selectedCity]);

  const cartQuantity = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  const formattedCartQuantity = cartQuantity > 99 ? '99+' : cartQuantity;
  const userLabel = user?.first_name || user?.name || user?.email || 'Войти';
  const logoSrc = `${process.env.PUBLIC_URL || ''}/logo.png`;

  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  const handleNavToggle = () => {
    setIsNavOpen((prev) => !prev);
  };

  const handleCityChange = (event) => {
    dispatch(setCity(event.target.value));
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleAccountClick = () => {
    if (user) {
      navigate('/account');
    } else {
      navigate('/authform', { state: { from: 'header_account' } });
    }
  };

  const renderNavLink = (item) => (
    <li key={item.path} className={styles.menuItem}>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `${styles.menuLink} ${isActive ? styles.menuLinkActive : ''}`
        }
        end={item.path === '/'}
        data-qa={item.qa}
      >
        {item.label}
      </NavLink>
    </li>
  );

  const isTireServiceAvailable = currentCity === 'Москва';

  return (
    <header className={styles.header} data-qa="header">
      <div className={styles.utilityBar}>
        <div className={styles.utilityGroup}>
          <span className={styles.utilityText}>
            <FiTruck aria-hidden="true" />
            <span className={styles.utilityTextSend}>Отгрузим сегодня при заказе до 18:00</span>
          </span>
         <span className={`${styles.utilityText} ${styles.utilityTextFerst}`}>
            <FiMapPin aria-hidden="true" />
            <span className={styles.utilityText}>Доставляем по всей России</span>
          </span>
        </div>
        <div className={styles.utilityGroup}>
          <a
            className={styles.contactLink}
            href="tel:+79999143009"
            data-qa="header_phone"
          >
            <FiPhone aria-hidden="true" />
            <span>+7 (999) 914-30-09</span>
          </a>
          <div className={styles.social}>
            <Button
              as="a"
              href="https://t.me/+79999143009"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Мы в Telegram"
              data-qa="header_social_telegram"
              variant="tertiary"
              size="sm"
              icon={<FaTelegramPlane aria-hidden="true" />}
              className={styles.socialBtn}
            />
            <Button
              as="a"
              href="https://instagram.com/msktires"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Мы в Instagram"
              data-qa="header_social_instagram"
              variant="tertiary"
              size="sm"
              icon={<FaInstagram aria-hidden="true" />}
              className={`${styles.socialBtn} ${styles.socialBtnIns}`}
            />
            <Button
              as="a"
              href="https://vk.com/msktires"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Мы во ВКонтакте"
              data-qa="header_social_vk"
              variant="tertiary"
              size="sm"
              icon={<FaVk aria-hidden="true" />}
              className={`${styles.socialBtn} ${styles.socialBtnVk}`}
            />
          </div>
        </div>
      </div>

      <div className={styles.brandRow}>
        <div className={styles.brandBlock}>
          <Button
            variant="ghost"
            size="sm"
            icon={isNavOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
            aria-expanded={isNavOpen}
            aria-controls="main-navigation"
            onClick={handleNavToggle}
            className={styles.navToggle}
            aria-label={isNavOpen ? 'Закрыть меню' : 'Открыть меню'}
            data-qa="nav_toggle"
          />
          <NavLink to="/" className={styles.logo} data-qa="nav_logo">
            <img className={styles.logoTitle} src={logoSrc} alt="MSK Tires" />
          </NavLink>
        </div>
        
      <div className={styles.searchDesktop}>
        <SearchBar />
      </div>

        <div className={styles.actions}>
          <label htmlFor="city-select" className={styles.srOnly}>
            Выберите город
          </label>
          <div className={styles.citySelectorDesc}>
            <FiMapPin aria-hidden="true" />
            <select
              id="city-select"
              value={currentCity}
              onChange={handleCityChange}
              data-qa="select_city"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleCartClick}
            data-qa="nav_cart"
            aria-label={`Корзина, товаров: ${cartQuantity}`}
            icon={<FaShoppingCart aria-hidden="true" />}
            className={styles.iconButton}
            depth="raised"

          >
            <span className={styles.iconLabel}>Корзина</span>
            {cartQuantity > 0 && <span className={styles.badge}>{formattedCartQuantity}</span>}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAccountClick}
            data-qa="nav_account"
            aria-label={`Личный кабинет: ${userLabel}`}
            icon={<FiUser aria-hidden="true" />}
            className={styles.iconButton}
            depth="raised"
          >
            <span className={styles.iconLabel}>{user ? 'Профиль' : 'Войти'}</span>
            {user && <span className={styles.badgeDot} aria-hidden="true" />}
          </Button>

        </div>
          
      </div>

      <nav
        id="main-navigation"
        className={`${styles.nav} ${isNavOpen ? styles.navOpen : ''}`}
        aria-label="Основное меню"
      >
        <ul className={styles.menu}>
            <div className={styles.citySelectorMob}>
            <FiMapPin aria-hidden="true" />
            <select
              id="city-select"
              value={currentCity}
              onChange={handleCityChange}
              data-qa="select_city"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          {navItems.map(renderNavLink)}
          <li className={styles.menuItem}>
            {isTireServiceAvailable ? (
              <NavLink
                to="/booking"
                className={({ isActive }) =>
                  `${styles.menuLink} ${isActive ? styles.menuLinkActive : ''}`
                }
                data-qa="nav_tire_service"
              >
                Шиномонтаж
              </NavLink>
            ) : (
              <span className={styles.menuLinkDisabled} title="Доступно только в Москве">
                Шиномонтаж
              </span>
            )}
          </li>
          <li className={styles.menuItem}>
            <NavLink
              to="/contacts"
              className={({ isActive }) =>
                `${styles.menuLink} ${isActive ? styles.menuLinkActive : ''}`
              }
              data-qa="nav_contacts"
            >
              Контакты
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className={styles.searchMobile}>
        <SearchBar />
      </div>
    </header>
  );
};

export default Header;
