from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category, MenuItem, Table, Employee, Order, OrderItem,
    Transaction, Expense, MonthlyReport
)


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'item_count', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'category', 'category_name', 'price_inr',
            'image', 'image_url', 'is_available', 'stock_qty',
            'low_stock_threshold', 'is_low_stock', 'created_at', 'updated_at'
        ]

    def get_is_low_stock(self, obj):
        return obj.is_low_stock

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class TableSerializer(serializers.ModelSerializer):
    active_order_id = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = ['id', 'number', 'capacity', 'status', 'location', 'active_order_id', 'created_at']

    def get_active_order_id(self, obj):
        active = obj.orders.filter(status__in=['pending', 'in_progress']).first()
        return active.id if active else None


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'id', 'name', 'role', 'contact', 'salary',
            'worked_hours', 'shift', 'joining_date', 'is_active', 'created_at'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_price = serializers.DecimalField(
        source='menu_item.price_inr', max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'menu_item_price', 'quantity', 'unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    employee_name = serializers.CharField(source='employee.name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'table', 'table_number', 'employee', 'employee_name',
            'status', 'payment_method', 'total_amount', 'notes',
            'items', 'created_at', 'updated_at'
        ]


class CreateOrderSerializer(serializers.Serializer):
    table_id = serializers.IntegerField()
    employee_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField()
    )

    def create(self, validated_data):
        from django.db import transaction
        with transaction.atomic():
            table = Table.objects.get(id=validated_data['table_id'])
            employee = None
            if validated_data.get('employee_id'):
                employee = Employee.objects.get(id=validated_data['employee_id'])

            order = Order.objects.create(
                table=table,
                employee=employee,
                notes=validated_data.get('notes', '')
            )

            for item_data in validated_data['items']:
                menu_item = MenuItem.objects.get(id=item_data['menu_item_id'])
                qty = int(item_data['quantity'])
                OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    quantity=qty,
                    unit_price=menu_item.price_inr,
                    subtotal=menu_item.price_inr * qty
                )
                # Deduct stock
                if menu_item.stock_qty > 0:
                    menu_item.stock_qty = max(0, menu_item.stock_qty - qty)
                    menu_item.save(update_fields=['stock_qty'])

            order.calculate_total()
            table.status = 'occupied'
            table.save(update_fields=['status'])
            return order


class TransactionSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    table_number = serializers.CharField(source='order.table.number', read_only=True)
    employee_name = serializers.CharField(source='order.employee.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'order_id', 'table_number', 'employee_name',
            'amount', 'payment_method', 'cash_given', 'balance', 'timestamp'
        ]


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'month', 'year', 'category', 'amount', 'description', 'created_at']


class MonthlyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyReport
        fields = [
            'id', 'month', 'year', 'total_revenue', 'total_expenses',
            'total_salaries', 'net_profit', 'pdf_file', 'generated_at'
        ]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser']
