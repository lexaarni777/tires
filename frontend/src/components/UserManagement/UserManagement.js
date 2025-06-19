import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './UserManagement.module.scss'; // SCSS с модулями

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/roles', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Ошибка при загрузке пользователей');

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Ошибка:', error);
      }
    };

    fetchUsers();
  }, [token]);

  return (
    <div className={styles.userManagement__container}>
      <h2 className={styles.userManagement__title}>Управление пользователями</h2>
      <table className={styles.userManagement__table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Роли</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button className={styles['userManagement__btn--assign']}>Назначить роль</button>
                <button className={styles['userManagement__btn--delete']}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
