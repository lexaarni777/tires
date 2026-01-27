 'use client';

import React from 'react';
import styles from './Account.module.scss'; // Импортируем стили
import { useDispatch, useSelector } from 'react-redux'; // Импортируем хуки для работы с Redux
import { useRouter } from 'next/navigation';
import { logout } from '../../slices/authSlice'; // Импортируем действие для выхода из аккаунта
import Button from '../ui/Button';

const Account = () => {
    // Получаем данные пользователя из состояния Redux
    const user = useSelector((state) => state.auth.user); // Данные текущего пользователя
    const roles = useSelector((state) => state.auth.roles); // Роли текущего пользователя
    const dispatch = useDispatch(); // Хук для отправки действий в Redux
    const router = useRouter(); // Навигация Next

    // Если пользователь не авторизован, отображаем сообщение
    if (!user) {
        return <p>Пожалуйста, авторизуйтесь для доступа к личному кабинету.</p>;
    }

    return (
        <div className={styles.account}>
            <h1>Личный кабинет</h1>
            {/* Информация о пользователе */}
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
                    variant="primary-low"
                    className={styles.actionButton}
                    onClick={() => router.push('/account/edit')}
                    depth="raised"

                >
                    Редактировать профиль
                </Button>
                <Button
                    type="button"
                    onClick={() => router.push('/addproduct')}
                    //variant="secondary-low"
                    depth="raised"
                >
                    Добавить продукт
                </Button>
                <Button
                    type="button"
                    onClick={() => router.push('/usermanagement')}
                    //variant="secondary-low"
                    className={styles.actionButton}
                    depth="raised"
                >
                    Менеджер пользователей
                </Button>
                <Button
                    type="button"
                    onClick={() => router.push('/orders')}
                    //variant="secondary-low"
                    className={styles.actionButton}
                    depth="raised"
                >
                    Мои заказы
                </Button>
                <Button
                    type="button"
                    onClick={() => router.push('/account/bookings')}
                    //variant="secondary-low"
                    className={styles.actionButton}
                    depth="raised"
                >
                    Записи шиномонтажа
                </Button>
                {roles.includes('admin') && (
                  <>
                    <Button
                      type="button"
                      onClick={() => router.push('/admin/orders')}
                      //variant="secondary-low"
                      className={styles.actionButton}
                      depth="raised"
                    >
                      Админ: заказы
                    </Button>
                    <Button
                      type="button"
                      onClick={() => router.push('/admin/tyre-booking')}
                      //variant="secondary-low"
                      className={styles.actionButton}
                      depth="raised"
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
                  depth="raised"
                >
                  Выйти
                </Button>
            </div>
        </div>
    );
};

export default Account;
