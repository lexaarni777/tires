import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser, sendSmsCode, sendResetCode, resetPassword } from '../../slices/authSlice';
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

    const [isResetting, setIsResetting] = useState(false);
    const [resetStep, setResetStep] = useState('request'); // request, verify, change
    const [resetPhone, setResetPhone] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPass1, setNewPass1] = useState('');
    const [newPass2, setNewPass2] = useState('');
    const [resetError, setResetError] = useState('');




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
  {!isResetting && (
  <button
    type="button"
    className={styles.forgotButton}
    onClick={() => {
      setIsResetting(true);
      setResetStep('request');
      setResetPhone('');
      setResetEmail('');
      setResetCode('');
      setNewPass1('');
      setNewPass2('');
      setResetError('');
    }}
  >
    Забыли пароль?
  </button>
)}
{isResetting && (
  <div className={styles.resetBlock}>
    {resetStep === 'request' && (
      <>
        <h3>Восстановление пароля</h3>
        <input
          type="tel"
          value={resetPhone}
          onChange={e => setResetPhone(e.target.value)}
          placeholder="Телефон (+7...)"
          className={styles.input}
          disabled={!!resetEmail}
        />
        <input
          type="email"
          value={resetEmail}
          onChange={e => setResetEmail(e.target.value)}
          placeholder="Email"
          className={styles.input}
          disabled={!!resetPhone}
        />
        <button
          onClick={async () => {
            setResetError('');
            if (!resetPhone && !resetEmail) return setResetError('Введите телефон или email');
            const res = await dispatch(sendResetCode({ phone: resetPhone, email: resetEmail }));
            if (res.meta.requestStatus === 'fulfilled') setResetStep('verify');
            else setResetError(res.payload || 'Ошибка отправки кода');
          }}
          className={styles.button}
        >
          Получить код
        </button>
        <button className={styles.toggleButton} onClick={() => setIsResetting(false)}>Назад</button>
        {resetError && <div className={styles.error}>{resetError}</div>}
      </>
    )}

    {resetStep === 'verify' && (
      <>
        <h3>Введите код</h3>
        <input
          type="text"
          value={resetCode}
          onChange={e => setResetCode(e.target.value)}
          className={styles.input}
          placeholder="Код из SMS/email"
        />
        <button
          onClick={() => setResetStep('change')}
          className={styles.button}
        >
          Проверить код
        </button>
        <button className={styles.toggleButton} onClick={() => setResetStep('request')}>Назад</button>
      </>
    )}

    {resetStep === 'change' && (
      <>
        <h3>Смена пароля</h3>
        <input
          type="password"
          value={newPass1}
          onChange={e => setNewPass1(e.target.value)}
          className={styles.input}
          placeholder="Новый пароль"
        />
        <input
          type="password"
          value={newPass2}
          onChange={e => setNewPass2(e.target.value)}
          className={styles.input}
          placeholder="Повторите пароль"
        />
        <button
          onClick={async () => {
            setResetError('');
            if (newPass1 !== newPass2) return setResetError('Пароли не совпадают');
            const res = await dispatch(resetPassword({
              phone: resetPhone || undefined,
              email: resetEmail || undefined,
              code: resetCode,
              newPassword: newPass1,
            }));
            if (res.meta.requestStatus === 'fulfilled') {
              setIsResetting(false);
              setResetStep('request');
              setResetError('');
              // Можно сразу вызвать loginUser
              dispatch(loginUser({
                phone: resetPhone || undefined,
                email: resetEmail || undefined,
                password: newPass1
              }));
            } else {
              setResetError(res.payload || 'Ошибка сброса пароля');
            }
          }}
          className={styles.button}
        >
          Сменить пароль и войти
        </button>
        <button className={styles.toggleButton} onClick={() => setResetStep('verify')}>Назад</button>
        {resetError && <div className={styles.error}>{resetError}</div>}
      </>
    )}
  </div>
)}

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
