from django.contrib import admin
from .models import Category, MenuItem, Table, Employee, Order, OrderItem, Transaction, Expense, MonthlyReport


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price_inr', 'is_available', 'stock_qty']
    list_filter = ['category', 'is_available']
    search_fields = ['name']


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['number', 'capacity', 'status', 'location']
    list_filter = ['status']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['name', 'role', 'contact', 'salary', 'shift', 'is_active']
    list_filter = ['role', 'shift', 'is_active']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'table', 'employee', 'status', 'payment_method', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_method']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'menu_item', 'quantity', 'subtotal']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'amount', 'payment_method', 'timestamp']
    list_filter = ['payment_method']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['category', 'amount', 'month', 'year', 'description']
    list_filter = ['category', 'year']


@admin.register(MonthlyReport)
class MonthlyReportAdmin(admin.ModelAdmin):
    list_display = ['month', 'year', 'total_revenue', 'net_profit', 'generated_at']
