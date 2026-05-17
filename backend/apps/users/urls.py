from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, MeView, ProgressPhotoViewSet

router = DefaultRouter()
router.register(r"me/progress-photos", ProgressPhotoViewSet, basename="progress-photo")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="user-register"),
    path("me/", MeView.as_view(), name="user-me"),
    path("", include(router.urls)),
]
