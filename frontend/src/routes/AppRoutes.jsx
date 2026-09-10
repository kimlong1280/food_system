import { Routes, Route, Navigate } from 'react-router-dom'
import CustomerLayout from '../layouts/CustomerLayout'
import AdminLayout from '../layouts/AdminLayout'

// Customer Pages
import Menu from '../pages/customer/Menu'
import FoodDetails from '../pages/customer/FoodDetails'
import Cart from '../pages/customer/Cart'
import Checkout from '../pages/customer/Checkout'
import OrderSuccess from '../pages/customer/OrderSuccess'
import TableError from '../pages/customer/TableError'

// Admin Pages
import Login from '../pages/admin/Login'
import Dashboard from '../pages/admin/Dashboard'
import Orders from '../pages/admin/Orders'
import Categories from '../pages/admin/Categories'
import MenuItems from '../pages/admin/MenuItems'
import Tables from '../pages/admin/Tables'
import Posters from '../pages/admin/Posters'
import Users from '../pages/admin/Users'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Customer Routes (Public & Table-Driven) */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Navigate to="/menu" replace />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/food/:id" element={<FoodDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/order-status/:orderNumber" element={<OrderSuccess />} />
        <Route path="/orders/:orderNumber" element={<OrderSuccess />} />
        <Route path="/table-error" element={<TableError />} />
      </Route>

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />

      {/* Protected Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="categories" element={<Categories />} />
        <Route path="menu-items" element={<MenuItems />} />
        <Route path="tables" element={<Tables />} />
        <Route path="posters" element={<Posters />} />
        <Route path="users" element={<Users />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  )
}

export default AppRoutes
