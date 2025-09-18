import React, { useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiMapPin,
  FiMenu,
  FiPhone,
  FiTruck,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { FaInstagram, FaShoppingCart, FaTelegramPlane, FaVk } from 'react-icons/fa';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import classes from './Header.module.scss';
import { warehouseList } from '../../constants/warehouseList';
import { setCity } from '../../slices/citySlice';

const navItems = [
  { label: 'Главная', path: '/', qa: 'nav_home' },
  { label: 'Шины', path: '/productlist', qa: 'nav_tires' },
  { label: 'Диски', path: '/wheels', qa: 'nav_wheels' },
];

const servicesItems = [
  { label: 'Доставка', path: '/services/delivery', qa: 'nav_services_delivery' },
  { label: 'Ремонт дисков', path: '/services/wheel-repair', qa: 'nav_services_repair' },
  { label: 'Шиномонтаж', path: '/services/tire-fitting', qa: 'nav_services_tire-fitting' },
];

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
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

  useEffect(() => {
    setIsNavOpen(false);
    setIsServicesOpen(false);
  }, [location.pathname]);

  const handleNavToggle = () => {
    setIsNavOpen((prev) => !prev);
  };

  const handleServicesToggle = () => {
    setIsServicesOpen((prev) => !prev);
  };

  const handleServicesClose = () => {
    setIsServicesOpen(false);
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
    <li key={item.path} className={classes.menuItem}>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `${classes.menuLink} ${isActive ? classes.menuLinkActive : ''}`
        }
        end={item.path === '/'}
        data-qa={item.qa}
      >
        {item.label}
      </NavLink>
    </li>
  );

  return (
    <header className={classes.header} data-qa="header">
      <div className={classes.utilityBar}>
        <div className={classes.utilityGroup}>
          <span className={classes.utilityText}>
            <FiTruck aria-hidden="true" />
            <span>Отгрузим сегодня при заказе до 18:00</span>
          </span>
          <span className={classes.utilityText}>
            <FiMapPin aria-hidden="true" />
            <span>Доставляем по всей Росси</span>
          </span>
        </div>
        <div className={classes.utilityGroup}>
          <a
            className={classes.contactLink}
            href="tel:+79999143009"
            data-qa="header_phone"
          >
            <FiPhone aria-hidden="true" />
            <span>+7 (999) 914-30-09</span>
          </a>
          <div className={classes.social}>
            <a
              href="https://vk.com/msktires"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Мы во ВКонтакте"
              data-qa="header_social_vk"
            >
              <FaVk aria-hidden="true" />
            </a>
            <a
              href="https://t.me/msktires"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Мы в Telegram"
              data-qa="header_social_telegram"
            >
              <FaTelegramPlane aria-hidden="true" />
            </a>
            <a
              href="https://instagram.com/msktires"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Мы в Instagram"
              data-qa="header_social_instagram"
            >
              <FaInstagram aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className={classes.brandRow}>
        <div className={classes.brandBlock}>
          <button
            type="button"
            className={classes.navToggle}
            aria-expanded={isNavOpen}
            aria-controls="main-navigation"
            onClick={handleNavToggle}
            data-qa="nav_toggle"
          >
            <span className={classes.srOnly}>
              {isNavOpen ? 'Закрыть меню' : 'Открыть меню'}
            </span>
            {isNavOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
          <NavLink to="/" className={classes.logo} data-qa="nav_logo">
            <span className={classes.logoTitle}>MskTires</span>
            <span className={classes.logoSubtitle}>Интернет-магазин шин и дисков</span>
          </NavLink>
        </div>

        <div className={classes.actions}>
          <label htmlFor="city-select" className={classes.srOnly}>
            Выберите город
          </label>
          <div className={classes.citySelector}>
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
          <button
            type="button"
            className={classes.iconButton}
            onClick={handleCartClick}
            data-qa="nav_cart"
            aria-label={`Корзина, товаров: ${cartQuantity}`}
          >
            <FaShoppingCart aria-hidden="true" />
            {cartQuantity > 0 && <span className={classes.badge}>{formattedCartQuantity}</span>}
            <span className={classes.iconLabel}>Корзина</span>
          </button>
          <button
            type="button"
            className={classes.iconButton}
            onClick={handleAccountClick}
            data-qa="nav_account"
            aria-label={`Личный кабинет: ${userLabel}`}
          >
            <FiUser aria-hidden="true" />
            {user && <span className={classes.badgeDot} aria-hidden="true" />}
            <span className={classes.iconLabel}>{user ? 'Профиль' : 'Войти'}</span>
          </button>
        </div>
      </div>

      <nav
        id="main-navigation"
        className={`${classes.nav} ${isNavOpen ? classes.navOpen : ''}`}
        aria-label="Основное меню"
      >
        <ul className={classes.menu}>
          {navItems.map(renderNavLink)}
          <li
            className={`${classes.menuItem} ${classes.menuItemWithChildren} ${
              isServicesOpen ? classes.menuItemExpanded : ''
            }`}
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={handleServicesClose}
          >
            <button
              type="button"
              className={classes.menuButton}
              onClick={handleServicesToggle}
              aria-expanded={isServicesOpen}
              aria-haspopup="true"
              data-qa="nav_services"
            >
              Услуги
              <FiChevronDown aria-hidden="true" />
            </button>
            <ul className={`${classes.submenu} ${isServicesOpen ? classes.submenuOpen : ''}`}>
              {servicesItems.map((item) => (
                <li key={item.path} className={classes.submenuItem}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `${classes.submenuLink} ${isActive ? classes.submenuLinkActive : ''}`
                    }
                    onClick={handleServicesClose}
                    data-qa={item.qa}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
          <li className={classes.menuItem}>
            <NavLink
              to="/contacts"
              className={({ isActive }) =>
                `${classes.menuLink} ${isActive ? classes.menuLinkActive : ''}`
              }
              data-qa="nav_contacts"
            >
              Контакты
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
