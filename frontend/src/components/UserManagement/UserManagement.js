import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './UserManagement.module.css'; // Создайте стили для компонента

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const token = useSelector((state) => state.auth.token); // Получаем токен пользователя из Redux
    console.log(users)
    useEffect(() => {
        // Загружаем список пользователей
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/roles', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Ошибка при загрузке пользователей');
                }

                const data = await response.json();
                console.log(data)
                setUsers(data);
            } catch (error) {
                console.error('Ошибка:', error);
            }
        };

        fetchUsers();
    }, [token]);

    return (
        <div className={styles.userManagement}>
            <h2>Управление пользователями</h2>
            <table className={styles.userTable}>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Роли</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>
                                {/* Добавить действия, например, назначение ролей или удаление */}
                                <button>Назначить роль</button>
                                <button>Удалить пользователя</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;
