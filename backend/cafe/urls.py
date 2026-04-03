from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('categories', views.CategoryViewSet)
router.register('menu', views.MenuItemViewSet)
router.register('tables', views.TableViewSet)
router.register('employees', views.EmployeeViewSet)
router.register('orders', views.OrderViewSet)
router.register('expenses', views.ExpenseViewSet)
router.register('reports', views.MonthlyReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', views.AdminLoginView.as_view(), name='admin-login'),
    path('auth/me/', views.AdminCheckView.as_view(), name='admin-me'),
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard'),
    path('transactions/', views.TransactionListView.as_view(), name='transactions'),
    path('transactions/export/', views.TransactionExportView.as_view(), name='transactions-export'),
    path('profit/', views.ProfitCalculatorView.as_view(), name='profit'),
    path('reports/generate/', views.GenerateMonthlyReportView.as_view(), name='generate-report'),
    path('inventory/', views.InventoryView.as_view(), name='inventory'),
]
