import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Хуки для взаимодействия с Redux
import { registerUser, loginUser } from '../../slices/authSlice'; // Действия (thunks) для регистрации и входа
import styles from './AuthForm.module.scss'; // Импорт CSS-модуля для стилизации
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AuthForm = () => {
    
    const user = useSelector((state) => state.auth.user); // Данные текущего пользователя
    const navigate = useNavigate();

        useEffect(() => {
            if (user) {
                navigate('/cart'); // или на другой маршрут, например /dashboard
            }
        }, [user, navigate]);



    // Локальные состояния для управления формой
    const [isRegistering, setIsRegistering] = useState(false); // true — регистрация, false — авторизация
    const [login, setLogin] = useState(''); // Email пользователя
    const [password, setPassword] = useState(''); // Пароль пользователя

    const dispatch = useDispatch(); // Получаем функцию dispatch из Redux
    const { status, error } = useSelector((state) => state.auth); // Достаём статус и ошибку из auth-слайса

    // Обработчик отправки формы
    const handleSubmit = (e) => {
        e.preventDefault(); // Отменяем перезагрузку страницы

        if (isRegistering) {
            // Отправляем данные для регистрации через email
            dispatch(registerUser({ email: login, password }));
        } else {
            // Отправляем данные для входа
            dispatch(loginUser({ email: login, password }));
        }
    };

    return (
        <div className={styles.authForm}>
            {/* Заголовок формы: Регистрация или Авторизация */}
            <h2 className={styles.title}>{isRegistering ? 'Регистрация' : 'Авторизация'}</h2>
            
            {/* Форма входа/регистрации */}
            <form onSubmit={handleSubmit} className={styles.form}>
                
                {/* Поле для логина (email) */}
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Email:</label>
                    <input
                        type="email"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                {/* Поле для пароля */}
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Пароль:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                {/* Отображение индикатора загрузки */}
                {status === 'loading' && (
                    <p className={styles.loading}>Загрузка...</p>
                )}

                {/* Отображение ошибки при наличии */}
                {error && (
                    <p className={styles.error}>{error}</p>
                )}

                {/* Кнопка отправки формы */}
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={styles.button}
                >
                    {isRegistering ? 'Зарегистрироваться' : 'Войти'}
                </button>

                {/* Кнопка-переключатель между режимами */}
                <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className={styles.toggleButton}
                >
                    {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                </button>
            </form>
        </div>
    );
};

export default AuthForm;
