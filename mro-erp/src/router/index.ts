import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/ProductList.vue')
      },
      {
        path: 'products/new',
        name: 'ProductNew',
        component: () => import('@/views/products/ProductForm.vue')
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import('@/views/products/ProductForm.vue')
      },
      {
        path: 'products/:id/stock',
        name: 'ProductStock',
        component: () => import('@/views/products/ProductStock.vue')
      },
      {
        path: 'products/import',
        name: 'ProductImport',
        component: () => import('@/views/products/ProductImport.vue')
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/customers/CustomerList.vue')
      },
      {
        path: 'customers/new',
        name: 'CustomerNew',
        component: () => import('@/views/customers/CustomerForm.vue')
      },
      {
        path: 'customers/:id',
        name: 'CustomerEdit',
        component: () => import('@/views/customers/CustomerForm.vue')
      },
      {
        path: 'customers/:id/pricing',
        name: 'CustomerPricing',
        component: () => import('@/views/customers/CustomerPricing.vue')
      },
      {
        path: 'customers/import',
        name: 'CustomerImport',
        component: () => import('@/views/customers/CustomerImport.vue')
      },
      {
        path: 'sales',
        name: 'Sales',
        component: () => import('@/views/sales/SaleList.vue')
      },
      {
        path: 'sales/quick',
        name: 'SaleQuick',
        component: () => import('@/views/sales/SaleQuick.vue')
      },
      {
        path: 'sales/new',
        name: 'SaleNew',
        component: () => import('@/views/sales/SaleForm.vue')
      },
      {
        path: 'sales/:id',
        name: 'SaleDetail',
        component: () => import('@/views/sales/SaleForm.vue')
      },
      {
        path: 'sales-returns',
        name: 'SaleReturns',
        component: () => import('@/views/sales/SaleReturnList.vue')
      },
      {
        path: 'sales-returns/new',
        name: 'SaleReturnNew',
        component: () => import('@/views/sales/SaleReturnForm.vue')
      },
      {
        path: 'sales-returns/:id',
        name: 'SaleReturnDetail',
        component: () => import('@/views/sales/SaleReturnForm.vue')
      },
      {
        path: 'reports/customer-statement',
        name: 'ReportCustomerStatement',
        component: () => import('@/views/reports/CustomerStatement.vue')
      },
      {
        path: 'reports/sales',
        name: 'ReportSales',
        component: () => import('@/views/reports/SalesReport.vue')
      },
      {
        path: 'reports/inventory',
        name: 'ReportInventory',
        component: () => import('@/views/reports/InventoryReport.vue')
      },
      {
        path: 'reports/profit',
        name: 'ReportProfit',
        component: () => import('@/views/reports/ProfitReport.vue')
      },
      {
        path: 'settings',
        component: () => import('@/views/settings/SettingsLayout.vue'),
        redirect: '/settings/warehouses',
        children: [
          {
            path: 'warehouses',
            name: 'SettingsWarehouses',
            component: () => import('@/views/warehouses/WarehouseList.vue')
          },
          {
            path: 'warehouses/new',
            name: 'SettingsWarehouseNew',
            component: () => import('@/views/warehouses/WarehouseForm.vue')
          },
          {
            path: 'warehouses/:id',
            name: 'SettingsWarehouseEdit',
            component: () => import('@/views/warehouses/WarehouseForm.vue')
          },
          {
            path: 'warehouses/:id/stock',
            name: 'SettingsWarehouseStock',
            component: () => import('@/views/warehouses/WarehouseStock.vue')
          },
          {
            path: 'warehouses/import-stock',
            name: 'SettingsStockImport',
            component: () => import('@/views/warehouses/StockImport.vue')
          },
          {
            path: 'warehouses/transactions',
            name: 'SettingsWarehouseTransactions',
            component: () => import('@/views/warehouses/WarehouseTransactions.vue')
          },
          {
            path: 'categories',
            name: 'SettingsCategories',
            component: () => import('@/views/products/CategoryList.vue')
          },
          {
            path: 'units',
            name: 'SettingsUnits',
            component: () => import('@/views/settings/UnitList.vue')
          },
          {
            path: 'security',
            name: 'SettingsSecurity',
            component: () => import('@/views/settings/SecuritySettings.vue')
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.meta.requiresAuth !== false
  const auth = useAuthStore()

  // Ensure auth is initialized before checking login state
  if (!auth.initialized) {
    await auth.initialize()
  }

  if (requiresAuth && !auth.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && auth.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
