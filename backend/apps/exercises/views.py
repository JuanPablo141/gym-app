from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Exercise
from .serializers import ExerciseSerializer


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["muscle_group"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "muscle_group", "created_at"]

    def get_permissions(self) -> list:
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
