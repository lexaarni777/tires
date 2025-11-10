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
import Delivery from './components/Delivery/Delivery';
import EditProfile from './components/EditProfile/EditProfile';
import TyreSelector from './components/TyreSelector/TyreSelector';
import AdminOrders from './components/AdminOrders/AdminOrders';
import Contacts from './components/Contacts/Contacts';
import SearchResults from './components/Search/SearchResults';
import BookingWizard from './components/Booking/BookingWizard';
import AdminTyreBooking from './components/AdminTyreBooking/AdminTyreBooking';
import UserTyreBookings from './components/UserTyreBookings/UserTyreBookings';

function App() {

  let routes = (
    <Routes>
      <Route path='/' element={<TyreSelector />} />
      {/* Маршрут для добавления продукта - доступен только администраторам */}
      <Route path='/addproduct' element={
        <PrivateRoute rolesRequired={['admin']}>
          <AddProduct />
        </PrivateRoute>
      }/>

    <Route path='/admin/orders' element={
      <PrivateRoute rolesRequired={['admin']}>
        <AdminOrders />
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

      {/* Поиск по каталогу */}
      <Route path='/search' element={<SearchResults/>}/>

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
          <Cart />
      }/>
        {/* Новый маршрут для управления пользователями - доступен только администраторам */}
      <Route path='services/delivery' element={
          <Delivery />
      }/>
      {/* Контакты */}
      <Route path='/contacts' element={
          <Contacts />
      }/>
      {/* Онлайн-запись на шиномонтаж */}
      <Route path='/booking' element={<BookingWizard/>} />
      {/* Мои записи шиномонтажа */}
      <Route path='/account/bookings' element={
        <PrivateRoute rolesRequired={['buyer','admin']}>
          <UserTyreBookings />
        </PrivateRoute>
      }/>
      {/* Админ: шиномонтаж */}
      <Route path='/admin/tyre-booking' element={
        <PrivateRoute rolesRequired={['admin']}>
          <AdminTyreBooking />
        </PrivateRoute>
      }/>
      <Route path='/account/edit' element={
      <PrivateRoute rolesRequired={['buyer', 'admin']}>
        <EditProfile />
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
