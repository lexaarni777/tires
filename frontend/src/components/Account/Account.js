import React from 'react';
import classes from './Account.module.css'; // Импортируем стили
import { useDispatch, useSelector } from 'react-redux'; // Импортируем хук для получения состояния
import { NavLink } from 'react-router-dom'; // Для навигации
import { logout } from '../../slices/authSlice';

const Account = () => {
    // Получаем данные пользователя из состояния Redux
    const user = useSelector((state) => state.auth.user);
    const roles = useSelector((state) => state.auth.roles);
    const dispatch = useDispatch()

    if (!user) {
        return <p>Пожалуйста, авторизуйтесь для доступа к личному кабинету.</p>;
    }

    return (
        <div className={classes.account}>
            <h1>Личный кабинет</h1>
            <div className={classes.userInfo}>
                <p><strong>Имя:</strong> {user.name || 'Имя не указано'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Роли:</strong> {roles.join(', ')}</p>
            </div>
            <div className={classes.actions}>
                <button className={classes.button}>Редактировать профиль</button>
                <NavLink to="/addproduct">Добавить продукт</NavLink>
                <NavLink to="/usermanagement">Менеджер пользователей</NavLink>
                <NavLink to="/orders">Мои заказы</NavLink>
                <button className={classes.button} onClick={() => dispatch(logout())}>Выйти</button>
            </div>
        </div>
    );
};

export default Account;
