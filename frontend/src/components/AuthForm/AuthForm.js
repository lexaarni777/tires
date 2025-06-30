import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser, sendSmsCode } from '../../slices/authSlice';
import styles from './AuthForm.module.scss';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { mergeLocalCartWithServer, clearGuestCart } from '../../slices/cartSlice';


const AuthForm = () => {
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
   

    const [isRegistering, setIsRegistering] = useState(false);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [useEmail, setUseEmail] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);

    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.auth);

    const auth = useSelector((state) => state.auth);
    useEffect(() => {
    // Только если нет guestCart, сразу переходим на /cart
        if (user && !localStorage.getItem('guestCart')) {
            navigate('/cart');
        }
    }, [user, navigate]);
    useEffect(() => {
    // Если появился токен и в localStorage есть guestCart, показываем модалку
    if (auth.token && localStorage.getItem('guestCart')) {
        setShowMergeModal(true);
    }
    }, [auth.token]);


    const handleMerge = () => {
        dispatch(mergeLocalCartWithServer());
        setShowMergeModal(false);
        navigate('/cart');
    };
    const handleClear = () => {
        dispatch(clearGuestCart());
        setShowMergeModal(false);
        navigate('/cart');
    };


    // Отправка кода на телефон (регистрация)
    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!phone) return;
        const res = await dispatch(sendSmsCode({ phone }));
        if (res.meta.requestStatus === 'fulfilled') setIsCodeSent(true);
    };

    // Регистрация пользователя (телефон/код/пароль/или email)
    const handleRegister = (e) => {
        e.preventDefault();
        // Требуется хотя бы телефон или email!
        if (!phone && !email) return alert('Укажите телефон или email');
        // Если телефон и код — flow по SMS
        if (phone && isCodeSent) {
            dispatch(registerUser({ phone, email, password, code }));
        } else if (email && !phone) {
            // Классическая регистрация по email
            dispatch(registerUser({ email, password }));
        }
    };

    // Логин (можно по телефону или email)
    const handleLogin = (e) => {
        e.preventDefault();
        if (!phone && !email) return alert('Укажите телефон или email');
        dispatch(loginUser({ phone, email, password }));
    };

    return (
<div className={styles.authForm}>
  <h2 className={styles.title}>{isRegistering ? 'Регистрация' : 'Авторизация'}</h2>
  
  {/* Чекбокс выбора email */}
  <div className={styles.toggleEmailRow}>
    <label className={styles.toggleEmailLabel}>
      <input
        type="checkbox"
        checked={useEmail}
        onChange={() => {
          setUseEmail((prev) => !prev);
          setEmail('');
          setPhone('');
          setIsCodeSent(false);
        }}
      />
      Использовать Email вместо телефона
    </label>
  </div>
  
  <form
    onSubmit={isRegistering
      ? (!useEmail && phone && !isCodeSent ? handleSendCode : handleRegister)
      : handleLogin}
    className={styles.form}
  >
    {/* Телефон */}
    {!useEmail && (
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Телефон:</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className={styles.input}
          placeholder="+7..."
          disabled={isCodeSent && isRegistering}
          autoFocus={!useEmail}
        />
      </div>
    )}
    {/* Email */}
    {useEmail && (
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Email:</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={styles.input}
          placeholder="you@example.com"
          autoFocus={useEmail}
        />
      </div>
    )}

    {/* Только для регистрации с телефоном: код и пароль */}
    {isRegistering && !useEmail && phone && isCodeSent && (
      <>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Код из SMS:</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={styles.input}
          />
        </div>
      </>
    )}

    {/* Регистрация по email или телефон (до получения кода): только пароль */}
    {isRegistering && (useEmail || (!useEmail && (!phone || !isCodeSent))) && (
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Пароль:</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className={styles.input}
        />
      </div>
    )}

    {/* Вход — телефон/email + пароль */}
    {!isRegistering && (
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Пароль:</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className={styles.input}
        />
      </div>
    )}

    {status === 'loading' && <p className={styles.loading}>Загрузка...</p>}
    {error && <p className={styles.error}>{error}</p>}
    <button
      type="submit"
      disabled={status === 'loading'}
      className={styles.button}
    >
      {isRegistering
        ? (!useEmail && phone && !isCodeSent ? 'Получить код' : 'Зарегистрироваться')
        : 'Войти'}
    </button>
    <button
      type="button"
      onClick={() => {
        setIsRegistering(!isRegistering);
        setIsCodeSent(false);
        setPassword('');
        setCode('');
        setPhone('');
        setEmail('');
      }}
      className={styles.toggleButton}
    >
      {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
    </button>
  </form>
  {showMergeModal && (
  <div className={styles.modal}>
    <div className={styles.modalContent}>
      <p>У вас осталась корзина гостя. Объединить с корзиной аккаунта?</p>
      <button onClick={handleMerge}>Объединить</button>
      <button onClick={handleClear}>Очистить гостевую корзину</button>
    </div>
  </div>
)}

</div>

    );
};

export default AuthForm;
