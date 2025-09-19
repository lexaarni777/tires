import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser, sendSmsCode, sendResetCode, resetPassword, sendEmailCode, verifyEmail  } from '../../slices/authSlice';
import styles from './AuthForm.module.scss';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { mergeLocalCartWithServer, clearGuestCart } from '../../slices/cartSlice';
import { validatePhone, validateEmail } from '../../utils/validators';



const AuthForm = () => {
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
   
  
    const [isRegistering, setIsRegistering] = useState(false);
   
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [form, setForm] = useState({
      phone: '',
      email: '',
      password: '',
      code: '',
      newPassword: '',
      repeatPassword: '',
      emailCode: '',
      resetPhone: '',
      resetEmail: '',
      resetCode: '',
    });
    const [errors, setErrors] = useState({});
    const [authMode, setAuthMode] = useState('phone'); // 'phone' или 'email'
    const [registerStep, setRegisterStep] = useState('start'); // 'start' | 'code' | 'finish'





    const [isResetting, setIsResetting] = useState(false);
    const [resetStep, setResetStep] = useState('request'); // request, verify, change
    const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    };


    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.auth);

    const auth = useSelector((state) => state.auth);
    const previousUserRef = useRef(user);

    useEffect(() => {
    // Только при смене пользователя перенаправляем в корзину, если нет гостевой корзины
      if (
        user &&
        previousUserRef.current !== user &&
        !localStorage.getItem('guestCart')
      ) {
        navigate('/cart');
      }
      previousUserRef.current = user;
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
      if (!form.phone) return;
      const res = await dispatch(sendSmsCode({ phone: form.phone }));
      // Если нужен переход шага, делай через setForm или setErrors, а не setIsCodeSent.
    };


    // Регистрация пользователя (телефон/код/пароль/или email)
    const handleRegister = (e) => {
        e.preventDefault();
        const errors = {};
        if (!form.phone && !form.email) errors.phone = 'Укажите телефон или email';
        if (form.phone && !validatePhone(form.phone)) errors.phone = 'Некорректный номер';
        if (form.email && !validateEmail(form.email)) errors.email = 'Некорректный email';
        if (!form.code) errors.code = 'Введите код';
        if (!form.password) errors.password = 'Введите пароль';
        if (Object.keys(errors).length > 0) {
          setErrors(errors);
          return;
        }
        dispatch(registerUser({
          phone: form.phone,
          email: form.email,
          password: form.password,
          code: form.code
        }));
      };

    // Логин (можно по телефону или email)
    const handleLogin = (e) => {
        e.preventDefault();
        const errors = {};
        if (!form.phone && !form.email) errors.email = 'Укажите телефон или email';
        if (form.phone && !validatePhone(form.phone)) errors.phone = 'Некорректный номер';
        if (form.email && !validateEmail(form.email)) errors.email = 'Некорректный email';
        if (!form.password) errors.form = 'Введите пароль';
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        dispatch(loginUser({ 
          phone: form.phone, 
          email: form.email, 
          password: form.password
        }));
    };

      const handleSendEmailCode = async (e) => {
        e.preventDefault();
        if (!form.email) {
          setErrors({ email: 'Введите email' });
          return;
        }
        const res = await dispatch(sendEmailCode({ email: form.email }));
        // Для переключения шага используй дополнительный стейт или form (например, form.emailCodeStep = true)
      };


const handleVerifyEmail = async (e) => {
  e.preventDefault();
  const errors = {};
  if (!form.email) errors.email = 'Введите email';
  if (!form.emailCode) errors.emailCode = 'Введите код';
  if (!form.password) errors.password = 'Введите пароль';
  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }
  const res = await dispatch(verifyEmail({ email: form.email, code: form.emailCode, password: form.password }));
  if (res.meta.requestStatus === 'fulfilled') {
    await dispatch(loginUser({ email: form.email, password: form.password }));
  }
};





    return (
<div className={styles.authForm}>
  <h2 className={styles.title}>{isRegistering ? 'Регистрация' : 'Авторизация'}</h2>
  

  
<form className={styles.form}>
  {/* Чекбокс выбора email/телефон */}
  <div className={styles.toggleEmailRow}>
    <label className={styles.toggleEmailLabel}>
      <input
        type="checkbox"
        checked={authMode === 'email'}
        onChange={() => {
          setAuthMode(authMode === 'email' ? 'phone' : 'email');
          setRegisterStep('start');
          setForm({
            ...form,
            phone: '',
            email: '',
            code: '',
            password: '',
            emailCode: ''
          });
          setErrors({});
        }}
      />
      Использовать Email вместо телефона
    </label>
  </div>

  {/* Регистрация — телефон */}
  {isRegistering && authMode === 'phone' && registerStep === 'start' && (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Телефон:</label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className={styles.input}
          placeholder="+7..."
          autoFocus
        />
        {errors.phone && <div className={styles.error}>{errors.phone}</div>}
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={async () => {
          if (!form.phone) return setErrors({ phone: 'Введите телефон' });
          if (!validatePhone(form.phone)) return setErrors({ phone: 'Некорректный номер' });
          const res = await dispatch(sendSmsCode({ phone: form.phone }));
          if (res.meta.requestStatus === 'fulfilled') setRegisterStep('code');
        }}
        disabled={status === 'loading'}
      >
        Получить код
      </Button>
    </>
  )}

  {isRegistering && authMode === 'phone' && registerStep === 'code' && (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Код из SMS:</label>
        <input
          type="text"
          name="code"
          value={form.code}
          onChange={handleChange}
          className={styles.input}
        />
        {errors.code && <div className={styles.error}>{errors.code}</div>}
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Пароль:</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className={styles.input}
        />
        {errors.password && <div className={styles.error}>{errors.password}</div>}
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={handleRegister}
        disabled={status === 'loading'}
      >
        Зарегистрироваться
      </Button>
      <Button type="button" variant="tertiary" onClick={() => setRegisterStep('start')}>
        Назад
      </Button>
    </>
  )}

  {/* Регистрация — email */}
  {isRegistering && authMode === 'email' && registerStep === 'start' && (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Email:</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className={styles.input}
          autoFocus
          placeholder="you@example.com"
        />
        {errors.email && <div className={styles.error}>{errors.email}</div>}
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={async () => {
          if (!form.email) return setErrors({ email: 'Введите email' });
          if (!validateEmail(form.email)) return setErrors({ email: 'Некорректный email' });
          const res = await dispatch(sendEmailCode({ email: form.email }));
          if (res.meta.requestStatus === 'fulfilled') setRegisterStep('code');
        }}
        disabled={status === 'loading'}
      >
        Получить код на email
      </Button>
    </>
  )}

  {isRegistering && authMode === 'email' && registerStep === 'code' && (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Код из email:</label>
        <input
          type="text"
          name="emailCode"
          value={form.emailCode}
          onChange={handleChange}
          className={styles.input}
          placeholder="4-значный код"
        />
        {errors.emailCode && <div className={styles.error}>{errors.emailCode}</div>}
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Пароль:</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className={styles.input}
          placeholder="Придумайте пароль"
        />
        {errors.password && <div className={styles.error}>{errors.password}</div>}
      </div>
      <button
        type="button"
        className={styles.button}
        onClick={handleVerifyEmail}
        disabled={status === 'loading'}
      >
        Завершить регистрацию
      </button>
      <button
        type="button"
        onClick={() => setRegisterStep('start')}
        className={styles.toggleButton}
      >
        Назад
      </button>
    </>
  )}

  {/* Вход (логин) */}
  {!isRegistering && (
    <>
      {authMode === 'phone' && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Телефон:</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={styles.input}
            autoFocus
          />
          {errors.phone && <div className={styles.error}>{errors.phone}</div>}
        </div>
      )}
      {authMode === 'email' && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Email:</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={styles.input}
            autoFocus
          />
          {errors.email && <div className={styles.error}>{errors.email}</div>}
        </div>
      )}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Пароль:</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className={styles.input}
        />
        {errors.password && <div className={styles.error}>{errors.password}</div>}
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={handleLogin}
        disabled={status === 'loading'}
      >
        Войти
      </Button>
    </>
  )}

  <Button
  type="button"
  variant="tertiary"
  onClick={() => {
    setIsRegistering(!isRegistering); // Переключаем режим формы
    setRegisterStep('start'); // Всегда возвращаемся на начальный шаг регистрации
    setForm({
      ...form,
      phone: '',
      email: '',
      code: '',
      password: '',
      emailCode: '',
    }); // Очищаем значения формы (или нужные поля)
    setErrors({});
  }}
>
  {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
></Button>



</form>

  {!isResetting && (
  <button
    type="button"
    className={styles.forgotButton}
    onClick={() => {
      setIsResetting(true);
      setResetStep('request');
      setForm({
        ...form,
        resetPhone: '',
        resetEmail: '',
        resetCode: '',
        newPassword: '',
        repeatPassword: '',
      });
      setErrors({});
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
          name='resetPhone'
          value={form.resetPhone}
          onChange={handleChange}
          placeholder="Телефон (+7...)"
          className={styles.input}
          disabled={!!form.resetEmail}
        />
        {errors.resetPhone && <div className={styles.error}>{errors.resetPhone}</div>}
        <input
          type="email"
          name='resetEmail' 
          value={form.resetEmail}
          onChange={handleChange}
          placeholder="Email"
          className={styles.input}
          disabled={!!form.resetPhone}
        />
        {errors.resetEmail && <div className={styles.error}>{errors.resetEmail}</div>}

        <Button
          onClick={async () => {
            const errors = {};
            if (!form.resetPhone && !form.resetEmail) errors.resetPhone = 'Введите телефон или email';
            if (form.resetPhone && !validatePhone(form.resetPhone)) errors.resetPhone = 'Некорректный номер';
            if (form.resetEmail && !validateEmail(form.resetEmail)) errors.resetEmail = 'Некорректный email';
            if (Object.keys(errors).length > 0) {
              setErrors(errors);
              return;
            }
            const res = await dispatch(sendResetCode({ phone: form.resetPhone, email: form.resetEmail }));
            if (res.meta.requestStatus === 'fulfilled') setResetStep('verify');
            else if (form.resetPhone)
              setErrors({ resetPhone: res.payload || 'Ошибка отправки кода на телефон' });
            else
              setErrors({ resetEmail: res.payload || 'Ошибка отправки кода на Email' });
          }}
          variant="primary"
        >
          Получить код
        </Button>
        <Button variant="tertiary" onClick={() => setIsResetting(false)}>Назад</Button>
        {errors.resetPhone && <div className={styles.error}>{errors.resetPhone}</div>}
        {errors.resetEmail && <div className={styles.error}>{errors.resetEmail}</div>}
      </>
    )}

    {resetStep === 'verify' && (
      <>
        <h3>Введите код</h3>
        <input
          type="text"
          name='resetCode'
          value={form.resetCode}
          onChange={handleChange}
          className={styles.input}
          placeholder="Код из SMS/email"
        />
        {errors.resetCode && <div className={styles.error}>{errors.resetCode}</div>}
        <Button variant="primary" onClick={() => setResetStep('change')}>
          Проверить код
        </Button>
        <Button variant="tertiary" onClick={() => setResetStep('request')}>Назад</Button>
      </>
    )}

    {resetStep === 'change' && (
      <>
        <h3>Смена пароля</h3>
        <input
          type="password"
          name='newPassword'
          value={form.newPassword}
          onChange={handleChange}
          className={styles.input}
          placeholder="Новый пароль"
        />
        {errors.newPassword && <div className={styles.error}>{errors.newPassword}</div>}
        <input
          type="password"
          name='repeatPassword'
          value={form.repeatPassword}
          onChange={handleChange}
          className={styles.input}
          placeholder="Повторите пароль"
        />
        {errors.repeatPassword && <div className={styles.error}>{errors.repeatPassword}</div>}
        <Button
          onClick={async () => {
            const errors = {};
            if (!form.newPassword) errors.newPassword = 'Введите новый пароль';
            if (!form.repeatPassword) errors.repeatPassword = 'Повторите пароль';
            if (form.newPassword !== form.repeatPassword) errors.repeatPassword = 'Пароли не совпадают';
            if (Object.keys(errors).length > 0) {
              setErrors(errors); 
              return;
            }
            const res = await dispatch(resetPassword({
              phone: form.resetPhone || undefined,
              email: form.resetEmail || undefined,
              code: form.resetCode,
              newPassword: form.newPassword,
            }));
            if (res.meta.requestStatus === 'fulfilled') {
              setIsResetting(false);
              setResetStep('request');
              setErrors({});
              setForm({
                ...form,
                resetPhone: '',
                resetEmail: '',
                resetCode: '',
                newPassword: '',
                repeatPassword: ''
              });
              dispatch(loginUser({
                phone: form.resetPhone || undefined,
                email: form.resetEmail || undefined,
                password: form.newPassword
              }));
            } else {
              setErrors({ repeatPassword: res.payload || 'Ошибка сброса пароля' });
            }
          }}
          variant="primary"
        >
          Сменить пароль и войти
        </Button>
        <Button variant="tertiary" onClick={() => setResetStep('verify')}>Назад</Button>
      </>
    )}
  </div>
)}

  {showMergeModal && (
  <div className={styles.modal}>
    <div className={styles.modalContent}>
      <p>У вас осталась корзина гостя. Объединить с корзиной аккаунта?</p>
      <Button variant="primary" onClick={handleMerge}>Объединить</Button>
      <Button variant="secondary" onClick={handleClear}>Очистить гостевую корзину</Button>
    </div>
  </div>
)}

</div>

    );
};

export default AuthForm;
