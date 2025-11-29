import React from 'react';
import styles from './Account.module.scss'; // Импортируем стили
import { useDispatch, useSelector } from 'react-redux'; // Импортируем хуки для работы с Redux
import { NavLink, useNavigate} from 'react-router-dom'; // Импортируем NavLink для навигации между страницами
import { logout } from '../../slices/authSlice'; // Импортируем действие для выхода из аккаунта
import Button from '../ui/Button';

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
        <div className={styles.account}>
            <h1>Личный кабинет</h1>
            {/* Информация о пользователе */}
            {console.log('user.',user)}
            <div className={styles.userInfo}>
                <p><strong>Имя:</strong> {user.name || 'Имя не указано'}</p>
                <p><strong>Email:</strong> {user.email || 'Email не указан'}</p>
                <p><strong>Телефон:</strong> {user.phone || 'Phone не указан'}</p>
                <p><strong>Роли:</strong> {roles.join(', ')}</p>
            </div>
            {/* Действия пользователя */}
            <div className={styles.actions}>
                <Button
                    type="button"
                    variant="primary"
                    className={styles.actionButton}
                    onClick={() => navigate('/account/edit')}
                >
                    Редактировать профиль
                </Button>
                <Button
                    as={NavLink}
                    to="/addproduct"
                    variant="secondary"
                    className={styles.actionButton}
                >
                    Добавить продукт
                </Button>
                <Button
                    as={NavLink}
                    to="/usermanagement"
                    variant="secondary"
                    className={styles.actionButton}
                >
                    Менеджер пользователей
                </Button>
                <Button
                    as={NavLink}
                    to="/orders"
                    variant="secondary"
                    className={styles.actionButton}
                >
                    Мои заказы
                </Button>
                <Button
                    as={NavLink}
                    to="/account/bookings"
                    variant="secondary"
                    className={styles.actionButton}
                >
                    Записи шиномонтажа
                </Button>
                {roles.includes('admin') && (
                  <>
                    <Button
                      as={NavLink}
                      to="/admin/orders"
                      variant="secondary"
                      className={styles.actionButton}
                    >
                      Админ: заказы
                    </Button>
                    <Button
                      as={NavLink}
                      to="/admin/tyre-booking"
                      variant="secondary"
                      className={styles.actionButton}
                    >
                      Админ: шиномонтаж
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="danger"
                  className={styles.actionButton}
                  onClick={() => dispatch(logout())}
                >
                  Выйти
                </Button>
            </div>
        </div>
    );
};

export default Account;
