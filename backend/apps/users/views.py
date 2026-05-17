from rest_framework import generics, permissions, viewsets
from .models import User, ProgressPhoto
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    ProgressPhotoSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self) -> User:
        return self.request.user  # type: ignore[return-value]


class ProgressPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProgressPhoto.objects.filter(user=self.request.user)

    def perform_create(self, serializer: ProgressPhotoSerializer) -> None:
        serializer.save(user=self.request.user)
