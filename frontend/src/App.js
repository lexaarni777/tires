import './App.css';
import AddProduct from './components/AddProduct/AddProduct';
import Layout from './components/Layout';
import ProductList from './components/ProductList/ProductList';
import { Route, Routes } from 'react-router-dom';
import AuthForm from './components/AuthForm/AuthForm';
import Account from './components/Account/Account';
import EditProduct from './components/EditProduct/EditProduct';
import PrivateRoute from './components/PrivateRoute/PrivateRoute'; // Импортируем компонент для защиты маршрутов
import UserManagement from './components/UserManagement/UserManagement'; // Импортируем компонент для управления пользователями (новый)
import Orders from './components/Orders/Orders'; // Импортируем компонент для управления пользователями (новый)
import Cart from './components/Cart/Cart';
import ProductDetailed from './components/ProductDetailed/ProductDetailed'; // Импортируем компонент для управления пользователями (новый)

function App() {

  let routes = (
    <Routes>
      {/* Маршрут для добавления продукта - доступен только администраторам */}
      <Route path='/addproduct' element={
        <PrivateRoute rolesRequired={['admin']}>
          <AddProduct />
        </PrivateRoute>
      }/>

      {/* Маршрут для списка заказов */}
      <Route path='/orders' element={
        <PrivateRoute rolesRequired={['buyer', 'admin']}>
          <Orders />
        </PrivateRoute>
      }/>

      {/* Маршрут для датализированной карточки продукта - доступен всем пользователям*/}
      <Route path='/productdetailed/:id' element={<ProductDetailed/>
      }/>
      
      {/* Маршрут для списка продуктов - доступен всем пользователям */}
      <Route path='/productlist' element={<ProductList/>}/>

      {/* Маршрут для формы авторизации - доступен всем пользователям */}
      <Route path='/authform' element={<AuthForm/>}/>

      {/* Маршрут для личного кабинета - доступен только авторизованным пользователям */}
      <Route path='/account' element={
        <PrivateRoute rolesRequired={['buyer', 'admin']}>
          <Account />
        </PrivateRoute>
      }/>

      {/* Маршрут для редактирования продукта - доступен только администраторам */}
      <Route path='/edit/:id' element={
        <PrivateRoute rolesRequired={['admin']}>
          <EditProduct />
        </PrivateRoute>
      }/>

      {/* Новый маршрут для управления пользователями - доступен только администраторам */}
      <Route path='/usermanagement' element={
        <PrivateRoute rolesRequired={['admin']}>
          <UserManagement />
        </PrivateRoute>
      }/>

      {/* Новый маршрут для управления пользователями - доступен только администраторам */}
      <Route path='/cart' element={
        <PrivateRoute rolesRequired={['buyer', 'admin']}>
          <Cart />
        </PrivateRoute>
      }/>
    </Routes>
  )

  return (
    <Layout>
      {routes}
    </Layout>
  );
}

export default App;
