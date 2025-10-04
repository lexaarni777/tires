import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser, sendSmsCode, sendResetCode, resetPassword, sendEmailCode, verifyEmail  } from '../../slices/authSlice';
import styles from './AuthForm.module.scss';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { mergeLocalCartWithServer, clearGuestCart } from '../../slices/cartSlice';
import { validatePhone, validateEmail } from '../../utils/validators';
import { MdVisibility, MdVisibilityOff } from "react-icons/md";


const AuthForm = () => {
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
   
  
    const [isRegistering, setIsRegistering] = useState(false);
   
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [form, setForm] = useState({
      phone: '+7',
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
    const [resetMethod, setResetMethod] = useState('phone'); // 'phone' | 'email'
    const [showPwdRegPhone, setShowPwdRegPhone] = useState(false);
    const [showPwdRegEmail, setShowPwdRegEmail] = useState(false);
    const [showPwdLogin, setShowPwdLogin] = useState(false);
    const [showPwdNew, setShowPwdNew] = useState(false);
    const [showPwdRepeat, setShowPwdRepeat] = useState(false);
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





    const errId = (name) => `${name}-error`;
    const errorProps = (name) => ({
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': errors[name] ? errId(name) : undefined,
    });

    return (
<div className={styles.authForm}>
  <h2 className={styles.title}>{isRegistering ? 'Регистрация' : 'Авторизация'}</h2>
  

  
{!isResetting && (
<form className={styles.form}>
  {/* Чекбокс выбора email/телефон */}
  <div className={styles.toggleEmailRow}>
    <div className={styles.segmented} role="tablist" aria-label="Способ входа">
      <button
        type="button"
        className={`${styles.segmentedBtn} ${authMode === 'phone' ? styles.active : ''}`}
        aria-pressed={authMode === 'phone'}
        onClick={() => {
          if (authMode !== 'phone') {
            setAuthMode('phone');
            setRegisterStep('start');
            setForm({
              ...form,
              phone: '+7',
              email: '',
              code: '',
              password: '',
              emailCode: ''
            });
            setErrors({});
          }
        }}
        data-qa="auth_mode_phone"
      >Телефон</button>
      <button
        type="button"
        className={`${styles.segmentedBtn} ${authMode === 'email' ? styles.active : ''}`}
        aria-pressed={authMode === 'email'}
        onClick={() => {
          if (authMode !== 'email') {
            setAuthMode('email');
            setRegisterStep('start');
            setForm({
              ...form,
              phone: '+7',
              email: '',
              code: '',
              password: '',
              emailCode: ''
            });
            setErrors({});
          }
        }}
        data-qa="auth_mode_email"
      >Email</button>
    </div>
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
          className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
          placeholder="+7..."
          autoFocus
          inputMode="tel"
          autoComplete="tel"
          {...errorProps('phone')}
        />
        {errors.phone && <div id={errId('phone')} role="alert" className={styles.error}>{errors.phone}</div>}
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
          className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          {...errorProps('code')}
        />
        {errors.code && <div id={errId('code')} role="alert" className={styles.error}>{errors.code}</div>}
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Пароль:</label>
        <div className={styles.inputWrap}>
          <input
            type={showPwdRegPhone ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            autoComplete="new-password"
            {...errorProps('password')}
          />
          <button
            type="button"
            className={styles.eyeBtn}
            aria-label={showPwdRegPhone ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPwdRegPhone}
            onClick={() => setShowPwdRegPhone(v => !v)}
            data-qa="auth_pwd_toggle_register_phone"
          >          <button
            type="button"
            className={styles.eyeBtn}
            aria-label={showPwdRegPhone ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPwdRegPhone}
            onClick={() => setShowPwdRegPhone(v => !v)}
            data-qa="auth_pwd_toggle_register_phone"
          >{showPwdRegPhone ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}</button></button>
        </div>
        {errors.password && <div id={errId('password')} role="alert" className={styles.error}>{errors.password}</div>}
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={handleRegister}
        disabled={status === 'loading'}
        data-qa="auth_register_submit_phone"
      >
        Зарегистрироваться
      </Button>
      <Button type="button" variant="tertiary" onClick={() => setRegisterStep('start')} data-qa="auth_back">
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
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          autoFocus
          placeholder="you@example.com"
          autoComplete="email"
          {...errorProps('email')}
        />
        {errors.email && <div id={errId('email')} role="alert" className={styles.error}>{errors.email}</div>}
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
        data-qa="auth_register_send_code_email"
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
          className={`${styles.input} ${errors.emailCode ? styles.inputError : ''}`}
          placeholder="4-значный код"
          inputMode="numeric"
          autoComplete="one-time-code"
          {...errorProps('emailCode')}
        />
        {errors.emailCode && <div id={errId('emailCode')} role="alert" className={styles.error}>{errors.emailCode}</div>}
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Пароль:</label>
        <div className={styles.inputWrap}>
          <input
            type={showPwdRegEmail ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            placeholder="Придумайте пароль"
            autoComplete="new-password"
            {...errorProps('password')}
          />
          <button
            type="button"
            className={styles.eyeBtn}
            aria-label={showPwdRegEmail ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPwdRegEmail}
            onClick={() => setShowPwdRegEmail(v => !v)}
            data-qa="auth_pwd_toggle_register_email"
          >{showPwdRegEmail ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}</button>
        </div>
        {errors.password && <div id={errId('password')} role="alert" className={styles.error}>{errors.password}</div>}
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={handleVerifyEmail}
        disabled={status === 'loading'}
        data-qa="auth_register_submit_email"
      >
        Завершить регистрацию
      </Button>
      <Button
        type="button"
        variant="tertiary"
        onClick={() => setRegisterStep('start')}
        data-qa="auth_back"
      >
        Назад
      </Button>
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
            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            autoFocus
            inputMode="tel"
            autoComplete="tel"
            {...errorProps('phone')}
          />
          {errors.phone && <div id={errId('phone')} role="alert" className={styles.error}>{errors.phone}</div>}
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
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            autoFocus
            autoComplete="email"
            {...errorProps('email')}
          />
          {errors.email && <div id={errId('email')} role="alert" className={styles.error}>{errors.email}</div>}
        </div>
      )}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Пароль:</label>
        <div className={styles.inputWrap}>
          <input
            type={showPwdLogin ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            autoComplete="current-password"
            {...errorProps('password')}
          />
          <button
            type="button"
            className={styles.eyeBtn}
            aria-label={showPwdLogin ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPwdLogin}
            onClick={() => setShowPwdLogin(v => !v)}
            data-qa="auth_pwd_toggle_login"
          >{showPwdLogin ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}</button>
        </div>
        {errors.password && <div id={errId('password')} role="alert" className={styles.error}>{errors.password}</div>}
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={handleLogin}
        disabled={status === 'loading'}
        data-qa="auth_login_submit"
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
      phone: '+7',
      email: '',
      code: '',
      password: '',
      emailCode: '',
    }); // Очищаем значения формы (или нужные поля)
    setErrors({});
  }}
  data-qa="auth_switch_mode"
  className={styles.buttonBorder}
>
  {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
</Button>



  
</form>
)}

  {!isResetting && (
    <div className={styles.formActionsRow}>
  <Button
    type="button"
    variant="tertiary"
    onClick={() => {
      setIsResetting(true);
      setResetStep('request');
      setForm({
        ...form,
        resetPhone: '+7',
        resetEmail: '',
        resetCode: '',
        newPassword: '',
        repeatPassword: '',
      });
      setErrors({});
    }}
    data-qa="auth_reset_open"
    className={styles.buttonBorderPass}
  >
    Забыли пароль?
  </Button>
  </div>
)}
{isResetting && (
  <div className={styles.resetBlock}>
    {resetStep === 'request' && (
      <>
        <h3>Восстановление пароля</h3>
        <div className={styles.segmented} role="tablist" aria-label="Способ восстановления">
          <button
            type="button"
            className={`${styles.segmentedBtn} ${resetMethod === 'phone' ? styles.active : ''}`}
            aria-pressed={resetMethod === 'phone'}
            onClick={() => { setResetMethod('phone'); setErrors({}); }}
            data-qa="auth_reset_method_phone"
          >Телефон</button>
          <button
            type="button"
            className={`${styles.segmentedBtn} ${resetMethod === 'email' ? styles.active : ''}`}
            aria-pressed={resetMethod === 'email'}
            onClick={() => { setResetMethod('email'); setErrors({}); }}
            data-qa="auth_reset_method_email"
          >Email</button>
        </div>

        {resetMethod === 'phone' ? (
          <>
            <input
              type="tel"
              name='resetPhone'
              value={form.resetPhone}
              onChange={handleChange}
              placeholder="Телефон (+7...)"
              className={`${styles.input} ${errors.resetPhone ? styles.inputError : ''}`}
              inputMode="tel"
              autoComplete="tel"
              {...errorProps('resetPhone')}
              autoFocus
            />
            {errors.resetPhone && <div id={errId('resetPhone')} role="alert" className={styles.error}>{errors.resetPhone}</div>}
          </>
        ) : (
          <>
            <input
              type="email"
              name='resetEmail' 
              value={form.resetEmail}
              onChange={handleChange}
              placeholder="Email"
              className={`${styles.input} ${errors.resetEmail ? styles.inputError : ''}`}
              autoComplete="email"
              {...errorProps('resetEmail')}
              autoFocus
            />
            {errors.resetEmail && <div id={errId('resetEmail')} role="alert" className={styles.error}>{errors.resetEmail}</div>}
          </>
        )}

        <Button
          className={styles.buttonMarginTop}
          onClick={async () => {
            const errs = {};
            if (resetMethod === 'phone') {
              if (!form.resetPhone) errs.resetPhone = 'Введите телефон';
              else if (!validatePhone(form.resetPhone)) errs.resetPhone = 'Некорректный номер';
            } else {
              if (!form.resetEmail) errs.resetEmail = 'Введите email';
              else if (!validateEmail(form.resetEmail)) errs.resetEmail = 'Некорректный email';
            }
            if (Object.keys(errs).length > 0) {
              setErrors(errs);
              return;
            }
            const payload = resetMethod === 'phone'
              ? { phone: form.resetPhone, email: undefined }
              : { phone: undefined, email: form.resetEmail };
            const res = await dispatch(sendResetCode(payload));
            if (res.meta.requestStatus === 'fulfilled') setResetStep('verify');
            else if (resetMethod === 'phone') setErrors({ resetPhone: res.payload || 'Ошибка отправки кода на телефон' });
            else setErrors({ resetEmail: res.payload || 'Ошибка отправки кода на Email' });
          }}
          variant="primary"
          data-qa="auth_reset_request"
        >
          Получить код
        </Button>
        <Button  className={styles.buttonBorder} variant="tertiary" onClick={() => setIsResetting(false)} data-qa="auth_back">Назад</Button>
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
          className={`${styles.input} ${errors.resetCode ? styles.inputError : ''} ${styles.inputMargBot}`}
          placeholder="Код из SMS/email"
          inputMode="numeric"
          autoComplete="one-time-code"
          {...errorProps('resetCode')}
        />
        {errors.resetCode && <div id={errId('resetCode')} role="alert" className={styles.error}>{errors.resetCode}</div>}
        <Button variant="primary" onClick={() => setResetStep('change')} data-qa="auth_reset_verify">
          Проверить код
        </Button>
        <Button variant="tertiary" onClick={() => setResetStep('request')} data-qa="auth_back">Назад</Button>
      </>
    )}

    {resetStep === 'change' && (
      <>
        <h3>Смена пароля</h3>
        <div className={styles.inputWrap}>
          <input
            type={showPwdNew ? 'text' : 'password'}
            name='newPassword'
            value={form.newPassword}
            onChange={handleChange}
            className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
            placeholder="Новый пароль"
            autoComplete="new-password"
            {...errorProps('newPassword')}
          />
          <button
            type="button"
            className={styles.eyeBtn}
            aria-label={showPwdNew ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPwdNew}
            onClick={() => setShowPwdNew(v => !v)}
            data-qa="auth_pwd_toggle_new"
          >{showPwdNew ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}</button>
        </div>
        {errors.newPassword && <div id={errId('newPassword')} role="alert" className={styles.error}>{errors.newPassword}</div>}
        <div className={styles.inputWrap}>
          <input
            type={showPwdRepeat ? 'text' : 'password'}
            name='repeatPassword'
            value={form.repeatPassword}
            onChange={handleChange}
            className={`${styles.input} ${errors.repeatPassword ? styles.inputError : ''}`}
            placeholder="Повторите пароль"
            autoComplete="new-password"
            {...errorProps('repeatPassword')}
          />
          <button
            type="button"
            className={styles.eyeBtn}
            aria-label={showPwdRepeat ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPwdRepeat}
            onClick={() => setShowPwdRepeat(v => !v)}
            data-qa="auth_pwd_toggle_repeat"
          >{showPwdRepeat ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}</button>
        </div>
        {errors.repeatPassword && <div id={errId('repeatPassword')} role="alert" className={styles.error}>{errors.repeatPassword}</div>}
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
                resetPhone: '+7',
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
          data-qa="auth_reset_change"
        >
          Сменить пароль и войти
        </Button>
        <Button variant="tertiary" onClick={() => setResetStep('verify')} data-qa="auth_back">Назад</Button>
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
