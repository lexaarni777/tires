import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './EditProfile.module.scss';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import {
  fetchProfile,
  updateProfile,
  changePassword,
  fetchAddresses,
  addAddress,
  requestPhoneChange,
  confirmPhoneChange,
  requestEmailChange,
  confirmEmailChange,
  resetProfileState,
} from '../../slices/profileSlice';

const EditProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.profile.user) || {};
  const addresses = useSelector((state) => state.profile.addresses) || [];
  const error = useSelector((state) => state.profile.error);
  const status = useSelector((state) => state.profile.status);


  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwords, setPasswords] = useState({
    old: '',
    new: '',
    repeat: '',
  });

  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showRepeatPwd, setShowRepeatPwd] = useState(false);


  const [phoneStep, setPhoneStep] = useState(1);
  const [newPhone, setNewPhone] = useState('+7');
  const [phoneCode, setPhoneCode] = useState('');

  const [emailStep, setEmailStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneTimer, setPhoneTimer] = useState(0);

  const [successMsg, setSuccessMsg] = useState('');

  const [newAddress, setNewAddress] = useState({ address: '' });
  const nameInputRef = useRef(null);



  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // simple timers for resend code
  useEffect(() => {
    if (emailTimer <= 0) return;
    const id = setInterval(() => setEmailTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [emailTimer]);

  useEffect(() => {
    if (phoneTimer <= 0) return;
    const id = setInterval(() => setPhoneTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [phoneTimer]);

useEffect(() => {
  if (user) {
    setForm(prev => {
      if (
        prev.name === (user.name || '') &&
        prev.email === (user.email || '') &&
        prev.phone === (user.phone || '')
      ) {
        return prev;
      }
      return {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      };
    });
  }
}, [user]);

useEffect(() => {
  return () => {
    dispatch(resetProfileState());
  };
}, [dispatch]);



  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) dispatch(resetProfileState());
};

  const handleSaveProfile = (e) => {
    e.preventDefault();
    dispatch(updateProfile({ name: form.name })).then((res) => {
      if (!res.error) setSuccessMsg('Профиль обновлен');
    });
  };

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  if (error) dispatch(resetProfileState());
};

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.repeat) {
      setSuccessMsg('Пароли не совпадают!');
      return;
    }
    dispatch(changePassword({ oldPassword: passwords.old, newPassword: passwords.new })).then((res) => {
      if (!res.error) setSuccessMsg('Пароль изменен');
    });
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    dispatch(addAddress(newAddress)).then((res) => {
  if (!res.error) {
    setSuccessMsg('Адрес добавлен');
    setNewAddress({ address: '' });
    }
    });
 };

  const handleRequestPhoneCode = (e) => {
    e.preventDefault();
    dispatch(requestPhoneChange({ newPhone })).then((res) => {
      if (!res.error) {
        setPhoneStep(2);
        setPhoneTimer(60);
      }
    });
  };

  const handleConfirmPhoneCode = (e) => {
    e.preventDefault();
    dispatch(confirmPhoneChange({ code: phoneCode, newPhone })).then((res) => {
      if (!res.error) {
        setSuccessMsg('Телефон изменён');
        setPhoneStep(1);
        setNewPhone('');
        setPhoneCode('');
      }
    });
  };

  const handleRequestEmailCode = (e) => {
    e.preventDefault();
    dispatch(requestEmailChange({ newEmail })).then((res) => {
      if (!res.error) {
        setEmailStep(2);
        setEmailTimer(60);
      }
    });
  };

  const handleConfirmEmailCode = (e) => {
    e.preventDefault();
    dispatch(confirmEmailChange({ code: emailCode, newEmail })).then((res) => {
      if (!res.error) {
        setSuccessMsg('Email изменён');
        setEmailStep(1);
        setNewEmail('');
        setEmailCode('');
      }
    });
  };

  const maskPhone = (p) => (p ? p.replace(/(\+?\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1******$4$5') : '');
  const hasName = Boolean((user?.name || '').trim());
  const nameDirty = form.name !== (user?.name || '');
  const nameCta = hasName ? 'Обновить имя' : 'Сохранить имя';
  const nameTitle = hasName ? 'Ваше имя' : 'Давайте познакомимся';

  return (
    <div className={styles.editProfile}>
      <h2 className={styles.sectionTitle}>Редактирование профиля</h2>
      {successMsg && (
        <div className={styles.successMsg} role="status" aria-live="polite">{successMsg}</div>
      )}
      {error && (
        <div className={styles.errorMsg} role="alert" aria-live="assertive">{error}</div>
      )}

      <div className={styles.grid}>
        <div className={styles.colLeft}>
          <form onSubmit={handleSaveProfile} className={styles.profileForm}>
            <h3 className={styles.sectionSubtitle}>{nameTitle}</h3>
            {!hasName && (
              <div className={styles.fieldHint}>Имя нужно для обращения в заказах.</div>
            )}
            <Input
              label="Имя"
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Ваше имя"
              autoComplete="name"
              ref={nameInputRef}
              depth="sunkeninp"
            />
            {nameDirty ? (
              <Button type="submit" variant="accent" data-qa="profile_update" disabled={!form.name.trim()}>
                {nameCta}
              </Button>
            ) : (
              hasName && (
                <Button
                  variant="primary-low"
                  depth="raised"
                  onClick={() => nameInputRef.current?.focus()}
                  data-qa="profile_edit_name"
                >
                  Изменить
                </Button>
              )
            )}
          </form>

          <form onSubmit={handleChangePassword} className={styles.passwordBlock}>
            <h3 className={styles.sectionSubtitle}>Смена пароля</h3>
            <Input
              type={showOldPwd ? 'text' : 'password'}
              name="old"
              value={passwords.old}
              onChange={handlePasswordChange}
              placeholder="Старый пароль"
              autoComplete="current-password"
              depth="sunkeninp"
              endIcon={
                <button
                  type="button"
                  className={styles.eyeBtn}
                  aria-label={showOldPwd ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={showOldPwd}
                  onClick={() => setShowOldPwd((v) => !v)}
                >
                  {showOldPwd ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              }
            />
            <Input
              type={showNewPwd ? 'text' : 'password'}
              name="new"
              value={passwords.new}
              onChange={handlePasswordChange}
              placeholder="Новый пароль"
              autoComplete="new-password"
              depth="sunkeninp"
              endIcon={
                <button
                  type="button"
                  className={styles.eyeBtn}
                  aria-label={showNewPwd ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={showNewPwd}
                  onClick={() => setShowNewPwd((v) => !v)}
                >
                  {showNewPwd ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              }
            />
            <Input
              type={showRepeatPwd ? 'text' : 'password'}
              name="repeat"
              value={passwords.repeat}
              onChange={handlePasswordChange}
              placeholder="Повторить новый пароль"
              autoComplete="new-password"
              depth="sunkeninp"
              endIcon={
                <button
                  type="button"
                  className={styles.eyeBtn}
                  aria-label={showRepeatPwd ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={showRepeatPwd}
                  onClick={() => setShowRepeatPwd((v) => !v)}
                >
                  {showRepeatPwd ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              }
            />
            <Button 
              variant="primary-low"
              depth="raised"
              data-qa="password_change"
              >Изменить пароль</Button>
          </form>
        </div>

        <div className={styles.colRight}>
          <div className={styles.emailBlock}>
            <h3 className={styles.sectionSubtitle}>{form.email ? 'Ваш email' : 'Добавьте email'}</h3>
            {form.email ? (
              <>
                <Input type="email" name="email" value={form.email} disabled depth="sunkeninp" />
                <div className={styles.fieldHint}>Измените при необходимости — подтвердим кодом.</div>
              </>
            ) : (
              <div className={styles.fieldHint}>Для чеков и уведомлений об отправке.</div>
            )}
            {emailStep === 1 ? (
              <div className={styles.inlineGroup}>
                <Input
                  type="email"
                  placeholder="Новый email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="email"
                  depth="sunkeninp"
                />
                <Button 
                  variant="primary-low"
                  depth="raised"
                  onClick={handleRequestEmailCode} 
                  data-qa="request_email_change"
                >
                  {form.email ? 'Изменить email' : 'Добавить email'}
                </Button>
              </div>
            ) : (
              <div className={styles.inlineGroup}>
                <div className={styles.fieldHint}>Шаг 2/2: Мы отправили код на {newEmail || form.email}</div>
                <Input
                  type="text"
                  placeholder="Код с email"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  depth="sunkeninp"
                />
                <Button variant="accent" onClick={handleConfirmEmailCode} data-qa="confirm_email_change">Подтвердить email</Button>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => setEmailStep(1)}
                  data-qa="email_back"
                >
                  Назад
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={handleRequestEmailCode}
                  disabled={emailTimer > 0}
                  data-qa="resend_email_code"
                >
                  {emailTimer > 0 ? `Отправить код повторно (00:${String(emailTimer).padStart(2,'0')})` : 'Отправить код повторно'}
                </Button>
              </div>
            )}
          </div>

          <div className={styles.phoneBlock}>
            <h3 className={styles.sectionSubtitle}>{form.phone ? 'Ваш телефон' : 'Добавьте телефон'}</h3>
            {form.phone ? (
              <>
                <Input type="tel" name="phone" value={form.phone} disabled depth="sunkeninp" />
                <div className={styles.fieldHint}>Измените при необходимости — подтвердим кодом.</div>
              </>
            ) : (
              <div className={styles.fieldHint}>Будем присылать статусы и коды подтверждения.</div>
            )}
            {phoneStep === 1 ? (
              <div className={styles.inlineGroup}>
                <Input
                  type="tel"
                  placeholder="Новый телефон"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  depth="sunkeninp"
                />
                <Button 
                  variant="primary-low"
                  depth="raised" 
                  onClick={handleRequestPhoneCode} 
                  data-qa="request_phone_change">
                  {form.phone ? 'Изменить телефон' : 'Добавить телефон'}
                </Button>
              </div>
            ) : (
              <div className={styles.inlineGroup}>
                <div className={styles.fieldHint}>Шаг 2/2: Мы отправили код на {maskPhone(newPhone || form.phone)}</div>
                <Input
                  type="text"
                  placeholder="Код из SMS"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  depth="sunkeninp"
                />
                <Button variant="accent" onClick={handleConfirmPhoneCode} data-qa="confirm_phone_change">Подтвердить телефон</Button>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => setPhoneStep(1)}
                  data-qa="phone_back"
                >
                  Назад
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={handleRequestPhoneCode}
                  disabled={phoneTimer > 0}
                  data-qa="resend_phone_code"
                >
                  {phoneTimer > 0 ? `Отправить код повторно (00:${String(phoneTimer).padStart(2,'0')})` : 'Отправить код повторно'}
                </Button>
              </div>
            )}
          </div>

          <div className={styles.addressesBlock}>
            <h3 className={styles.sectionSubtitle}>Ваши адреса доставки</h3>
            {status === 'loading' && (
              <ul className={styles.addressList}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className={styles.addressItem}>
                    <Skeleton style={{ width: '70%', height: 16, borderRadius: 8 }} />
                  </li>
                ))}
              </ul>
            )}
            {status !== 'loading' && addresses.length === 0 && (
              <EmptyState title="Адресов пока нет" description="Добавьте адрес доставки, чтобы ускорить оформление заказа." />
            )}
            {status !== 'loading' && addresses.length > 0 && (
              <ul className={styles.addressList}>
                {addresses.map((a) => (
                  <li key={a.id} className={styles.addressItem}>
                    <span className={styles.addressText}>{a.address}</span>
                    <div className={styles.addressActions}>
                      <Button size="sm" variant="ghost" data-qa="address_set_default">По умолчанию</Button>
                      <Button size="sm" variant="ghost" data-qa="address_remove">Удалить</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddAddress} className={styles.addressForm}>
              <Input
                type="text"
                name="address"
                value={newAddress.address}
                onChange={(e) => setNewAddress({ address: e.target.value })}
                placeholder="Введите полный адрес"
                depth="sunkeninp"
              />
              <Button
                variant="primary-low"
                depth="raised" 
                data-qa="address_add"
              >Добавить адрес</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
