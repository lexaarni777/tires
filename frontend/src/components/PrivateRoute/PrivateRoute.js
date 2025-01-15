import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, rolesRequired }) => {
    const user = useSelector((state) => state.auth.user);
    const roles = useSelector((state) => state.auth.roles);

    // Проверяем, авторизован ли пользователь и есть ли у него нужные роли
    if (!user || !rolesRequired.some(role => roles.includes(role))) {
        return <Navigate to="/authform" replace />;
    }

    return children;
};

export default PrivateRoute;
