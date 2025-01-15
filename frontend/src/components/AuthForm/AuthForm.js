import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Импортируем хуки Redux
import { registerUser, loginUser } from '../../slices/authSlice'; // Импортируем действия для авторизации и регистрации
import styles from './AuthForm.module.css';

const AuthForm = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [login, setLogin] = useState(''); // Логин (email или телефон)
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState(''); // Проверочный код для Telegram
    const [registrationMethod, setRegistrationMethod] = useState('telegram'); // Способ регистрации: по умолчанию Telegram
    const [isCodeSent, setIsCodeSent] = useState(false); // Состояние отправки проверочного кода

    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.auth); // Получаем статус и ошибки из Redux

    const handleSendCode = async () => {
        try {
            // Отправляем запрос на сервер для отправки проверочного кода в Telegram
            const response = await fetch('http://localhost:5000/api/auth/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ telegramChatId: login }),
            });

            if (!response.ok) {
                throw new Error('Не удалось отправить проверочный код');
            }

            setIsCodeSent(true);
            alert('Проверочный код успешно отправлен. Пожалуйста, проверьте ваш Telegram.');
        } catch (err) {
            console.error('Ошибка при отправке проверочного кода:', err);
            alert('Не удалось отправить проверочный код. Пожалуйста, попробуйте снова.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isRegistering) {
            if (registrationMethod === 'telegram') {
                // Регистрация через Telegram с проверочным кодом
                dispatch(registerUser({ login, password, verificationCode }));
            } else {
                // Регистрация через Email
                dispatch(registerUser({ email: login, password }));
            }
        } else {
            dispatch(loginUser({ email: login, password }));
        }
    };

    return (
        <div className={styles.authForm}>
            <h2 className={styles.title}>{isRegistering ? 'Регистрация' : 'Авторизация'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                {isRegistering && (
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Способ регистрации:</label>
                        <select
                            value={registrationMethod}
                            onChange={(e) => setRegistrationMethod(e.target.value)}
                            className={styles.select}
                        >
                            <option value="telegram">Telegram</option>
                            <option value="email">Email</option>
                        </select>
                    </div>
                )}
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Логин (Email или Телефон):</label>
                    <input
                        type="text"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                {registrationMethod === 'telegram' && isRegistering && !isCodeSent && (
                    <div className={styles.fieldGroup}>
                        <button type="button" onClick={handleSendCode} disabled={!login} className={styles.button}>
                            Отправить проверочный код
                        </button>
                    </div>
                )}
                {registrationMethod === 'telegram' && isRegistering && isCodeSent && (
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Проверочный код из Telegram:</label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                )}
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

                {/* Добавляем индикатор загрузки */}
                {status === 'loading' && <p className={styles.loading}>Загрузка...</p>}

                {/* Отображаем ошибки при наличии */}
                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" disabled={status === 'loading'} className={styles.button}>
                    {isRegistering ? 'Зарегистрироваться' : 'Войти'}
                </button>
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className={styles.toggleButton}>
                    {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                </button>
            </form>
        </div>
    );
};

export default AuthForm;
