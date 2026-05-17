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

    @action(detail=True, methods=["get"], url_path="progression", url_name="progression")
    def progression(self, request: Request, pk=None) -> Response:
        """
        GET /api/exercises/{id}/progression/

        Returns the authenticated user's load progression for this exercise:
        last top set, all-time PR, trend of last 10 sessions, and a suggested
        weight/reps for the next session based on RPE.
        """
        from django.db.models import Prefetch
        from apps.workouts.models import WorkoutSession, SetLog
        from apps.workouts.serializers import ProgressionResponseSerializer
        from apps.workouts.services import suggest_next_load

        exercise = self.get_object()

        sessions = list(
            WorkoutSession.objects.filter(
                user=request.user,
                set_logs__exercise=exercise,
            )
            .distinct()
            .order_by("-started_at")
            .prefetch_related(
                Prefetch(
                    "set_logs",
                    queryset=SetLog.objects.filter(exercise=exercise).order_by(
                        "-weight_kg", "-reps"
                    ),
                    to_attr="exercise_sets",
                )
            )[:10]
        )

        last_top_set = sessions[0].exercise_sets[0] if sessions else None
        prev_top_set = sessions[1].exercise_sets[0] if len(sessions) > 1 else None

        pr = (
            SetLog.objects.filter(
                session__user=request.user,
                exercise=exercise,
                weight_kg__isnull=False,
            )
            .select_related("session")
            .order_by("-weight_kg", "-reps")
            .first()
        )

        trend = [
            {
                "date": session.started_at,
                "top_weight_kg": session.exercise_sets[0].weight_kg,
                "top_reps": session.exercise_sets[0].reps,
                "top_rpe": session.exercise_sets[0].rpe,
            }
            for session in sessions
        ]

        payload = {
            "exercise_id": exercise.id,
            "last_top_set": (
                {
                    "session_id": sessions[0].id,
                    "date": sessions[0].started_at,
                    "weight_kg": last_top_set.weight_kg,
                    "reps": last_top_set.reps,
                    "rpe": last_top_set.rpe,
                }
                if last_top_set
                else None
            ),
            "personal_record": (
                {
                    "weight_kg": pr.weight_kg,
                    "reps": pr.reps,
                    "date": pr.session.started_at,
                }
                if pr
                else None
            ),
            "trend": trend,
            "suggestion": suggest_next_load(last_top_set, prev_top_set),
        }

        serializer = ProgressionResponseSerializer(payload)
        return Response(serializer.data)
