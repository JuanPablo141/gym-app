from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
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

    @action(detail=True, methods=["get"], url_path="history", url_name="history")
    def history(self, request: Request, pk=None) -> Response:
        """
        GET /api/exercises/{id}/history/

        Returns the authenticated user's history for this exercise: each past
        session that included it, with all sets performed and total volume.
        Ordered by most recent session first.
        """
        from django.db.models import Prefetch
        from apps.workouts.models import WorkoutSession, SetLog
        from apps.workouts.serializers import ExerciseHistorySessionSerializer

        exercise = self.get_object()

        sessions = (
            WorkoutSession.objects.filter(
                user=request.user,
                set_logs__exercise=exercise,
            )
            .distinct()
            .order_by("-started_at")
            .prefetch_related(
                Prefetch(
                    "set_logs",
                    queryset=SetLog.objects.filter(exercise=exercise).order_by("set_number"),
                    to_attr="exercise_sets",
                )
            )
        )

        page = self.paginate_queryset(sessions)
        if page is not None:
            serializer = ExerciseHistorySessionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ExerciseHistorySessionSerializer(sessions, many=True)
        return Response(serializer.data)
