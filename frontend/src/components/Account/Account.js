import React from 'react';
import classes from './Account.module.scss'; // Импортируем стили
import { useDispatch, useSelector } from 'react-redux'; // Импортируем хуки для работы с Redux
import { NavLink, useNavigate} from 'react-router-dom'; // Импортируем NavLink для навигации между страницами
import { logout } from '../../slices/authSlice'; // Импортируем действие для выхода из аккаунта
import { clearCart } from '../../slices/cartSlice'; // Импортируем действие для очистки корзины

const Account = () => {
    // Получаем данные пользователя из состояния Redux
    const user = useSelector((state) => state.auth.user); // Данные текущего пользователя
    const roles = useSelector((state) => state.auth.roles); // Роли текущего пользователя
    const dispatch = useDispatch(); // Хук для отправки действий в Redux
    const navigate = useNavigate(); // Хук для навигации между страницами

    // Если пользователь не авторизован, отображаем сообщение
    if (!user) {
        return <p>Пожалуйста, авторизуйтесь для доступа к личному кабинету.</p>;
    }

    return (
        <div className={classes.account}>
            <h1>Личный кабинет</h1>
            {/* Информация о пользователе */}
            <div className={classes.userInfo}>
                <p><strong>Имя:</strong> {user.name || 'Имя не указано'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Роли:</strong> {roles.join(', ')}</p>
            </div>
            {/* Действия пользователя */}
            <div className={classes.actions}>
                <button 
                    className={classes.button}
                    onClick={() => navigate('/account/edit')}
                >Редактировать профиль</button>
                {/* Ссылки на другие страницы */}
                <NavLink to="/addproduct">Добавить продукт</NavLink>
                <NavLink to="/usermanagement">Менеджер пользователей</NavLink>
                <NavLink to="/orders">Мои заказы</NavLink>
                {/* Кнопка для выхода из аккаунта */}
                <button className={classes.button} onClick={() => dispatch(logout())}>Выйти</button>
            </div>
        </div>
    );
};

export default Account;
