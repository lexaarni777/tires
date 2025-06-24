// Header.jsx
import React from 'react';
import { FaShoppingCart } from 'react-icons/fa'; // Иконка корзины
import { FaUser } from "react-icons/fa";
import { NavLink, useNavigate } from 'react-router-dom'; // Для навигации
import classes from './Header.module.scss';
import { warehouseList } from '../../constants/warehouseList';
import { setCity } from '../../slices/citySlice';
import { useDispatch, useSelector } from 'react-redux';

const Header = () => {
    const navigate = useNavigate(); // Хук для программной навигации
    const cities = Array.from(new Set(warehouseList.map(w => w.city)));
    const dispatch = useDispatch();
    const selectedCity = useSelector(state => state.city.selectedCity);
    // Обработчик клика на иконку пользователя
    const handleUserClick = () => {
        navigate('/account'); // Переход на страницу Личного кабинета
    };

    const handleCartClick = () => {
        navigate('/cart'); // Переход на страницу корзщины
    };



    return (
        <header className={classes.header}>
            {/* Верхний блок */}
            <div className={classes.headerTop}>
                <div className={classes.storeInfo}>
                    <h1>Магазин шин</h1>
                    <p>Телефон: +7 (123) 456-78-90</p>
                    <div className={classes.socialLinks}>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                    </div>
                </div>
                <div className={classes.IconHeader}>
                    <select
                        value={selectedCity}
                        onChange={e => dispatch(setCity(e.target.value))}
                        >
                        {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                <div className={classes.cartIcon}>
                        <FaShoppingCart size={24} 
                        onClick={handleCartClick}
                        />
                    </div>
                    <div className={classes.cartIcon}>
                        <FaUser size={24} 
                        onClick={handleUserClick}/>
                    </div>
    
                </div>
            </div>

            {/* Нижний блок */}
            <nav className={classes.headerBottom}>
                <ul className={classes.menu}>
                    <li><NavLink to="/">Главная</NavLink></li>
                    <li><NavLink to="/productlist">Шины</NavLink></li>
                    <li><NavLink to="/wheels">Диски</NavLink></li>
                    <li className={classes.submenuHead}>
                        Услуги
                        <ul className={classes.submenu}>
                            <li><NavLink to="/services/delivery">Доставка</NavLink></li>
                            <li><NavLink to="/services/wheel-repair">Ремонт дисков</NavLink></li>
                            <li><NavLink to="/services/tire-fitting">Шиномонтаж</NavLink></li>
                        </ul>
                    </li>
                    <li><NavLink to="/contacts">Контакты</NavLink></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;