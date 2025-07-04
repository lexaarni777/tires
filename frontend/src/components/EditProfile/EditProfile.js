import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classes from './EditProfile.module.scss';
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


  const [phoneStep, setPhoneStep] = useState(1);
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  const [emailStep, setEmailStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  const [newAddress, setNewAddress] = useState({ address: '' });



  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchAddresses());
  }, [dispatch]);

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

const handleAddressChange = (e) => {
  setNewAddress({ address: e.target.value });
  if (error) dispatch(resetProfileState());
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
    if (!newPhone.match(/^[0-9\-\+\s\(\)]{10,}$/)) {
      setSuccessMsg('Некорректный номер');
      return;
    }
    dispatch(requestPhoneChange({ newPhone })).then((res) => {
      if (!res.error) setPhoneStep(2);
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
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setSuccessMsg('Некорректный email');
      return;
    }
    dispatch(requestEmailChange({ newEmail })).then((res) => {
      if (!res.error) setEmailStep(2);
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

  return (
    <div className={classes.editProfile}>
      <h2 className={classes.sectionTitle}>Редактирование профиля</h2>
      {successMsg && <div className={classes.successMsg}>{successMsg}</div>}
      {error && <div className={classes.errorMsg}>{error}</div>}

      <form onSubmit={handleSaveProfile} className={classes.profileForm}>
        <label className={classes.formLabel}>
          Имя:
          <input type="text" name="name" value={form.name} onChange={handleFormChange} className={classes.inputField} />
        </label>
        <button type="submit" className={classes.button}>Сохранить имя</button>
      </form>

      <div className={classes.emailBlock}>
        <label className={classes.formLabel}>
          Email:
          <input type="text" name="email" value={form.email} disabled className={classes.inputField} />
        </label>
        {emailStep === 1 ? (
          <div className={classes.inlineGroup}>
            <input
              type="text"
              placeholder="Новый email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={classes.inputField}
            />
            <button onClick={handleRequestEmailCode} className={classes.button}>Изменить email</button>
          </div>
        ) : (
          <div className={classes.inlineGroup}>
            <input
              type="text"
              placeholder="Код с email"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              className={classes.inputField}
            />
            <button onClick={handleConfirmEmailCode} className={classes.button}>Подтвердить email</button>
          </div>
        )}
      </div>

      <div className={classes.phoneBlock}>
        <label className={classes.formLabel}>
          Телефон:
          <input type="text" name="phone" value={form.phone} disabled className={classes.inputField} />
        </label>
        {phoneStep === 1 ? (
          <div className={classes.inlineGroup}>
            <input
              type="text"
              placeholder="Новый телефон"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className={classes.inputField}
            />
            <button onClick={handleRequestPhoneCode} className={classes.button}>Изменить телефон</button>
          </div>
        ) : (
          <div className={classes.inlineGroup}>
            <input
              type="text"
              placeholder="Код из SMS"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              className={classes.inputField}
            />
            <button onClick={handleConfirmPhoneCode} className={classes.button}>Подтвердить телефон</button>
          </div>
        )}
      </div>

      <form onSubmit={handleChangePassword} className={classes.passwordBlock}>
        <h3 className={classes.sectionSubtitle}>Смена пароля</h3>
        <input
          type="password"
          name="old"
          value={passwords.old}
          onChange={handlePasswordChange}
          placeholder="Старый пароль"
          className={classes.inputField}
        />
        <input
          type="password"
          name="new"
          value={passwords.new}
          onChange={handlePasswordChange}
          placeholder="Новый пароль"
          className={classes.inputField}
        />
        <input
          type="password"
          name="repeat"
          value={passwords.repeat}
          onChange={handlePasswordChange}
          placeholder="Повторить новый пароль"
          className={classes.inputField}
        />
        <button type="submit" className={classes.button}>Изменить пароль</button>
      </form>

      <div className={classes.addressesBlock}>
        <h3 className={classes.sectionSubtitle}>Ваши адреса доставки</h3>
        <ul className={classes.addressList}>
          {addresses.map((a) => (
            <li key={a.id} className={classes.addressItem}>
            {a.address}
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddAddress} className={classes.addressForm}>
          <input
                type="text"
                name="address"
                value={newAddress.address}
                onChange={(e) => setNewAddress({ address: e.target.value })}
                placeholder="Введите полный адрес"
                className={classes.inputField}
            />
          <button type="submit" className={classes.button}
>Добавить адрес</button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
