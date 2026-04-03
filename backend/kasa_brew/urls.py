from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import os


def serve_react(request, *args, **kwargs):
    """Serve React app index.html for all non-API routes."""
    index_path = settings.BASE_DIR / 'staticfiles' / 'frontend' / 'index.html'
    if index_path.exists():
        with open(index_path, 'rb') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse(
        '<h1>KASA BREW</h1><p>Frontend not built yet. Run: cd frontend && npm run build</p>',
        status=200
    )


urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('cafe.urls')),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all: serve React frontend
urlpatterns += [
    re_path(r'^.*$', serve_react),
]
