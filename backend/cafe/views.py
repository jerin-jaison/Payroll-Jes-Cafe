from django.http import HttpResponse, FileResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta, date
import csv
import io
import os

from .models import (
    Category, MenuItem, Table, Employee, Order, OrderItem,
    Transaction, Expense, MonthlyReport
)
from .serializers import (
    CategorySerializer, MenuItemSerializer, TableSerializer, EmployeeSerializer,
    OrderSerializer, CreateOrderSerializer, TransactionSerializer,
    ExpenseSerializer, MonthlyReportSerializer, UserSerializer
)


# ─── AUTH ───────────────────────────────────────────────────────────────────

class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user and user.is_superuser:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials or not an admin'}, status=401)


class AdminCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            return Response(UserSerializer(request.user).data)
        return Response({'error': 'Not an admin'}, status=403)


# ─── DASHBOARD ──────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.localdate()
        now = timezone.now()
        month_start = today.replace(day=1)

        # Today's stats
        today_transactions = Transaction.objects.filter(timestamp__date=today)
        today_revenue = today_transactions.aggregate(total=Sum('amount'))['total'] or 0
        today_orders = Order.objects.filter(created_at__date=today).count()

        # This month
        month_transactions = Transaction.objects.filter(
            timestamp__date__gte=month_start,
            timestamp__date__lte=today
        )
        month_revenue = month_transactions.aggregate(total=Sum('amount'))['total'] or 0

        # Active tables
        active_tables = Table.objects.filter(status='occupied').count()
        total_tables = Table.objects.count()

        # Category sales (all time for pie chart)
        cat_sales = []
        for cat in Category.objects.all():
            revenue = Transaction.objects.filter(
                order__items__menu_item__category=cat
            ).aggregate(total=Sum('amount'))['total'] or 0
            cat_sales.append({'name': cat.name, 'value': float(revenue)})

        # Top 5 selling items
        top_items = OrderItem.objects.values(
            'menu_item__name'
        ).annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_qty')[:5]

        top_items_list = [
            {
                'name': item['menu_item__name'],
                'quantity': item['total_qty'],
                'revenue': float(item['total_revenue'] or 0)
            }
            for item in top_items
        ]

        # Daily revenue for past 30 days
        daily_revenue = []
        for i in range(29, -1, -1):
            d = today - timedelta(days=i)
            rev = Transaction.objects.filter(timestamp__date=d).aggregate(
                total=Sum('amount')
            )['total'] or 0
            daily_revenue.append({
                'date': d.strftime('%d %b'),
                'revenue': float(rev)
            })

        # Recent transactions
        recent = Transaction.objects.select_related('order__table', 'order__employee').order_by('-timestamp')[:10]
        recent_list = [
            {
                'id': t.id,
                'table': t.order.table.number if t.order.table else '-',
                'amount': float(t.amount),
                'payment_method': t.payment_method,
                'timestamp': t.timestamp.strftime('%d %b %Y %I:%M %p'),
                'employee': t.order.employee.name if t.order.employee else '-'
            }
            for t in recent
        ]

        # Low stock items count
        low_stock_count = MenuItem.objects.filter(
            stock_qty__lte=10, is_available=True
        ).count()

        return Response({
            'today_revenue': float(today_revenue),
            'month_revenue': float(month_revenue),
            'today_orders': today_orders,
            'active_tables': active_tables,
            'total_tables': total_tables,
            'category_sales': cat_sales,
            'top_items': top_items_list,
            'daily_revenue': daily_revenue,
            'recent_transactions': recent_list,
            'low_stock_count': low_stock_count,
        })


# ─── CATEGORY ───────────────────────────────────────────────────────────────

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# ─── MENU ITEMS ─────────────────────────────────────────────────────────────

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related('category').all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        available_only = self.request.query_params.get('available')

        if category:
            qs = qs.filter(category__id=category)
        if search:
            qs = qs.filter(name__icontains=search)
        if available_only == 'true':
            qs = qs.filter(is_available=True)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


# ─── TABLES ─────────────────────────────────────────────────────────────────

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        table = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['available', 'occupied', 'reserved']:
            return Response({'error': 'Invalid status'}, status=400)
        table.status = new_status
        table.save()
        return Response(TableSerializer(table).data)


# ─── EMPLOYEES ──────────────────────────────────────────────────────────────

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['patch'])
    def update_hours(self, request, pk=None):
        employee = self.get_object()
        hours = request.data.get('worked_hours')
        if hours is not None:
            employee.worked_hours = hours
            employee.save()
        return Response(EmployeeSerializer(employee).data)


# ─── ORDERS ─────────────────────────────────────────────────────────────────

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('table', 'employee').prefetch_related('items__menu_item').all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        table = self.request.query_params.get('table')
        status_filter = self.request.query_params.get('status')
        today_only = self.request.query_params.get('today')
        payment = self.request.query_params.get('payment')

        if table:
            qs = qs.filter(table__id=table)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if today_only == 'true':
            qs = qs.filter(created_at__date=timezone.localdate())
        if payment:
            qs = qs.filter(payment_method=payment)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response(OrderSerializer(order).data, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['pending', 'in_progress', 'served', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=400)
        order.status = new_status
        order.save()
        # If served or cancelled, free the table
        if new_status in ['served', 'cancelled']:
            active_orders = Order.objects.filter(
                table=order.table,
                status__in=['pending', 'in_progress']
            ).exclude(id=order.id)
            if not active_orders.exists() and order.table:
                order.table.status = 'available'
                order.table.save()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        order = self.get_object()
        payment_method = request.data.get('payment_method', 'cash')
        cash_given = request.data.get('cash_given')
        balance = None

        if payment_method == 'cash' and cash_given:
            cash_given = float(cash_given)
            balance = cash_given - float(order.total_amount)

        order.payment_method = payment_method
        order.status = 'served'
        order.save()

        # Create transaction
        txn = Transaction.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method=payment_method,
            cash_given=cash_given,
            balance=balance
        )

        # Free the table
        if order.table:
            active = Order.objects.filter(
                table=order.table,
                status__in=['pending', 'in_progress']
            ).exclude(id=order.id)
            if not active.exists():
                order.table.status = 'available'
                order.table.save()

        return Response({
            'order': OrderSerializer(order).data,
            'transaction': TransactionSerializer(txn).data,
            'balance': balance
        })

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Generate PDF receipt for an order."""
        order = self.get_object()
        pdf_buffer = generate_receipt_pdf(order)
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt_order_{order.id}.pdf"'
        return response


# ─── TRANSACTIONS ───────────────────────────────────────────────────────────

class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Transaction.objects.select_related(
            'order__table', 'order__employee'
        ).order_by('-timestamp')

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        payment = self.request.query_params.get('payment')
        table = self.request.query_params.get('table')

        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)
        if payment:
            qs = qs.filter(payment_method=payment)
        if table:
            qs = qs.filter(order__table__number=table)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = int(request.query_params.get('page', 1))
        per_page = 10
        total = qs.count()
        start = (page - 1) * per_page
        end = start + per_page
        serializer = self.get_serializer(qs[start:end], many=True)
        return Response({
            'results': serializer.data,
            'total': total,
            'page': page,
            'pages': (total + per_page - 1) // per_page
        })


class TransactionExportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        export_format = request.query_params.get('format', 'csv')
        qs = Transaction.objects.select_related(
            'order__table', 'order__employee'
        ).order_by('-timestamp')

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)

        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
            writer = csv.writer(response)
            writer.writerow(['ID', 'Table', 'Employee', 'Amount', 'Payment Method',
                            'Cash Given', 'Balance', 'Timestamp'])
            for t in qs:
                writer.writerow([
                    t.id,
                    t.order.table.number if t.order.table else '-',
                    t.order.employee.name if t.order.employee else '-',
                    t.amount,
                    t.payment_method,
                    t.cash_given or '-',
                    t.balance or '-',
                    t.timestamp.strftime('%Y-%m-%d %H:%M:%S')
                ])
            return response
        else:
            # PDF export
            pdf = generate_transactions_pdf(qs)
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="transactions.pdf"'
            return response


# ─── EXPENSES ───────────────────────────────────────────────────────────────

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month:
            qs = qs.filter(month=month)
        if year:
            qs = qs.filter(year=year)
        return qs


# ─── PROFIT CALCULATOR ──────────────────────────────────────────────────────

class ProfitCalculatorView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        month = int(request.query_params.get('month', timezone.localdate().month))
        year = int(request.query_params.get('year', timezone.localdate().year))

        # Total revenue from transactions this month
        transactions = Transaction.objects.filter(
            timestamp__month=month,
            timestamp__year=year
        )
        total_revenue = transactions.aggregate(total=Sum('amount'))['total'] or 0

        # Total salaries of all active employees
        total_salaries = Employee.objects.filter(
            is_active=True
        ).aggregate(total=Sum('salary'))['total'] or 0

        # Manual expenses this month
        expenses = Expense.objects.filter(month=month, year=year)
        expense_serializer = ExpenseSerializer(expenses, many=True)
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0

        # Net profit
        net_profit = float(total_revenue) - float(total_salaries) - float(total_expenses)

        # Breakdown by expense category
        expense_breakdown = list(
            expenses.values('category').annotate(total=Sum('amount'))
        )

        return Response({
            'month': month,
            'year': year,
            'total_revenue': float(total_revenue),
            'total_salaries': float(total_salaries),
            'total_expenses': float(total_expenses),
            'net_profit': net_profit,
            'expenses': expense_serializer.data,
            'expense_breakdown': expense_breakdown,
        })


# ─── MONTHLY REPORT ─────────────────────────────────────────────────────────

class MonthlyReportViewSet(viewsets.ModelViewSet):
    queryset = MonthlyReport.objects.all()
    serializer_class = MonthlyReportSerializer
    permission_classes = [AllowAny]


class GenerateMonthlyReportView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        month = int(request.data.get('month', timezone.localdate().month))
        year = int(request.data.get('year', timezone.localdate().year))

        # Calculate profit
        transactions = Transaction.objects.filter(timestamp__month=month, timestamp__year=year)
        total_revenue = transactions.aggregate(total=Sum('amount'))['total'] or 0
        total_salaries = Employee.objects.filter(is_active=True).aggregate(total=Sum('salary'))['total'] or 0
        expenses = Expense.objects.filter(month=month, year=year)
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        net_profit = float(total_revenue) - float(total_salaries) - float(total_expenses)

        # Top items this month
        top_items = OrderItem.objects.filter(
            order__created_at__month=month,
            order__created_at__year=year
        ).values('menu_item__name').annotate(
            qty=Sum('quantity'), revenue=Sum('subtotal')
        ).order_by('-qty')[:10]

        # Generate PDF
        pdf_buffer = generate_monthly_report_pdf(
            month, year, float(total_revenue), float(total_salaries),
            float(total_expenses), net_profit, list(top_items), list(expenses)
        )

        # Save report
        report, _ = MonthlyReport.objects.update_or_create(
            month=month, year=year,
            defaults={
                'total_revenue': total_revenue,
                'total_expenses': total_expenses,
                'total_salaries': total_salaries,
                'net_profit': net_profit,
            }
        )

        # Save PDF file
        from django.core.files.base import ContentFile
        month_name = datetime(year, month, 1).strftime('%B_%Y')
        report.pdf_file.save(
            f'report_{month_name}.pdf',
            ContentFile(pdf_buffer.getvalue()),
            save=True
        )

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="kasa_brew_report_{month_name}.pdf"'
        return response


# ─── INVENTORY ──────────────────────────────────────────────────────────────

class InventoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        items = MenuItem.objects.select_related('category').all()
        low_stock = items.filter(stock_qty__lte=10)
        out_of_stock = items.filter(stock_qty=0)
        return Response({
            'items': MenuItemSerializer(items, many=True, context={'request': request}).data,
            'low_stock_count': low_stock.count(),
            'out_of_stock_count': out_of_stock.count(),
        })

    def patch(self, request):
        item_id = request.data.get('id')
        stock_qty = request.data.get('stock_qty')
        threshold = request.data.get('low_stock_threshold')
        try:
            item = MenuItem.objects.get(id=item_id)
            if stock_qty is not None:
                item.stock_qty = stock_qty
            if threshold is not None:
                item.low_stock_threshold = threshold
            item.save()
            return Response(MenuItemSerializer(item, context={'request': request}).data)
        except MenuItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=404)


# ─── PDF GENERATORS ─────────────────────────────────────────────────────────

def generate_receipt_pdf(order):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
    from reportlab.lib.units import cm

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    gold = colors.HexColor('#FFD700')
    black = colors.HexColor('#0a0a0a')

    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  fontSize=24, textColor=gold, spaceAfter=6)
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'],
                                     fontSize=10, textColor=colors.grey, spaceAfter=4)
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=10)

    elements = []
    elements.append(Paragraph('☕ KASA BREW', title_style))
    elements.append(Paragraph('Premium Cafe Experience', subtitle_style))
    elements.append(Spacer(1, 0.3*cm))

    # Order info
    table_num = order.table.number if order.table else '-'
    emp_name = order.employee.name if order.employee else '-'
    created_at = order.created_at.strftime('%d %B %Y, %I:%M %p')
    elements.append(Paragraph(f'<b>Table:</b> {table_num} &nbsp;&nbsp; <b>Order #</b>{order.id}', normal_style))
    elements.append(Paragraph(f'<b>Date:</b> {created_at}', normal_style))
    elements.append(Paragraph(f'<b>Served by:</b> {emp_name}', normal_style))
    elements.append(Paragraph(f'<b>Payment:</b> {order.payment_method.upper()}', normal_style))
    elements.append(Spacer(1, 0.4*cm))

    # Items table
    data = [['Item', 'Qty', 'Unit Price', 'Subtotal']]
    for item in order.items.all():
        data.append([
            item.menu_item.name if item.menu_item else 'Unknown',
            str(item.quantity),
            f'₹{item.unit_price}',
            f'₹{item.subtotal}'
        ])
    data.append(['', '', 'TOTAL', f'₹{order.total_amount}'])

    t = Table(data, colWidths=[8*cm, 2*cm, 3.5*cm, 3.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), gold),
        ('TEXTCOLOR', (0, 0), (-1, 0), black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f9f9f9')]),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0f0f0')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph('Thank you for visiting KASA BREW! ☕', subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_transactions_pdf(transactions):
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
    from reportlab.lib.units import cm

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                            leftMargin=1.5*cm, rightMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()
    gold = colors.HexColor('#FFD700')
    black = colors.HexColor('#0a0a0a')

    elements = []
    elements.append(Paragraph('KASA BREW – Transaction Report', ParagraphStyle(
        'T', parent=styles['Title'], fontSize=18, textColor=gold
    )))
    elements.append(Spacer(1, 0.3*cm))

    data = [['#', 'Table', 'Employee', 'Amount', 'Method', 'Cash Given', 'Balance', 'Time']]
    for t in transactions:
        data.append([
            str(t.id),
            t.order.table.number if t.order.table else '-',
            t.order.employee.name if t.order.employee else '-',
            f'₹{t.amount}',
            t.payment_method.upper(),
            f'₹{t.cash_given}' if t.cash_given else '-',
            f'₹{t.balance}' if t.balance else '-',
            t.timestamp.strftime('%d/%m/%y %H:%M')
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), gold),
        ('TEXTCOLOR', (0, 0), (-1, 0), black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_monthly_report_pdf(month, year, revenue, salaries, expenses, profit, top_items, expense_list):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, HRFlowable
    from reportlab.lib.units import cm

    month_name = datetime(year, month, 1).strftime('%B %Y')
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    gold = colors.HexColor('#FFD700')
    black = colors.HexColor('#0a0a0a')
    green = colors.HexColor('#00C853')
    red = colors.Color(0.8, 0, 0)

    elements = []
    elements.append(Paragraph('☕ KASA BREW', ParagraphStyle(
        'T', parent=styles['Title'], fontSize=26, textColor=gold
    )))
    elements.append(Paragraph(f'Monthly Report – {month_name}', ParagraphStyle(
        'S', parent=styles['Normal'], fontSize=13, textColor=colors.grey
    )))
    elements.append(HRFlowable(width='100%', thickness=1, color=gold, spaceAfter=10))

    # Financial Summary
    elements.append(Paragraph('Financial Summary', ParagraphStyle(
        'H', parent=styles['Heading2'], textColor=gold
    )))
    profit_color = green if profit >= 0 else red
    summary_data = [
        ['Total Revenue', f'₹{revenue:,.2f}'],
        ['Total Salaries', f'-₹{salaries:,.2f}'],
        ['Total Expenses', f'-₹{expenses:,.2f}'],
        ['Net Profit / Loss', f'₹{profit:,.2f}'],
    ]
    t = Table(summary_data, colWidths=[8*cm, 8*cm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, -1), (1, -1), profit_color),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.HexColor('#f9f9f9'), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Top Items
    if top_items:
        elements.append(Paragraph('Top Selling Items', ParagraphStyle(
            'H', parent=styles['Heading2'], textColor=gold
        )))
        item_data = [['Item', 'Qty Sold', 'Revenue']]
        for item in top_items:
            item_data.append([
                item['menu_item__name'],
                str(item['qty']),
                f"₹{float(item['revenue'] or 0):,.2f}"
            ])
        t2 = Table(item_data, colWidths=[8*cm, 4*cm, 5*cm])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), gold),
            ('TEXTCOLOR', (0, 0), (-1, 0), black),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 0.5*cm))

    # Expenses breakdown
    if expense_list:
        elements.append(Paragraph('Expense Breakdown', ParagraphStyle(
            'H', parent=styles['Heading2'], textColor=gold
        )))
        exp_data = [['Category', 'Description', 'Amount']]
        for e in expense_list:
            exp_data.append([e.category, e.description[:50], f'₹{e.amount:,.2f}'])
        t3 = Table(exp_data, colWidths=[5*cm, 8*cm, 4*cm])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), gold),
            ('TEXTCOLOR', (0, 0), (-1, 0), black),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t3)

    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph(
        f'Generated on {datetime.now().strftime("%d %B %Y at %I:%M %p")} | KASA BREW Management System',
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
    ))
    doc.build(elements)
    buffer.seek(0)
    return buffer
