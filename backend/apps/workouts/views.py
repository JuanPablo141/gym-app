from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from .models import WorkoutTemplate, WorkoutSession, ScheduledWorkout
from .serializers import (
    WorkoutTemplateSerializer,
    WorkoutSessionSerializer,
    SessionSummaryResponseSerializer,
    ScheduledWorkoutSerializer,
    ActivityStatsResponseSerializer,
    HeatmapResponseSerializer,
    SetLogSerializer,
)
from .services import (
    compute_session_summary,
    compute_activity_stats,
    compute_workout_heatmap,
)

ACTIVITY_STATS_ALLOWED_DAYS = {7, 30, 90, 180, 365}
HEATMAP_ALLOWED_DAYS = {90, 180, 365}


class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutTemplate.objects.filter(user=self.request.user)

    def perform_create(self, serializer: WorkoutTemplateSerializer) -> None:
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance: WorkoutTemplate) -> None:
        instance.delete()

    @action(detail=True, methods=["post"], url_path="restore", url_name="restore")
    def restore(self, request: Request, pk=None) -> Response:
        instance = WorkoutTemplate.all_objects.filter(
            pk=pk, user=request.user
        ).first()
        if instance is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        instance.restore()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            WorkoutSession.objects.filter(user=self.request.user)
            .prefetch_related("set_logs__exercise")
            .select_related("template")
        )

    @action(detail=True, methods=["get"], url_path="summary", url_name="summary")
    def summary(self, request: Request, pk=None) -> Response:
        """
        GET /api/workouts/sessions/{id}/summary/

        Returns aggregated metrics for the session: total volume, sets,
        per-exercise breakdown with top set and new-PR detection, plus
        the list of muscle groups trained.
        """
        session = self.get_object()
        payload = compute_session_summary(session)
        serializer = SessionSummaryResponseSerializer(payload)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="activity-stats", url_name="activity-stats")
    def activity_stats(self, request: Request) -> Response:
        """
        GET /api/workouts/sessions/activity-stats/?days=30

        Returns the authenticated user's workout activity over the last N
        days. Granularity (day/week/month) is picked automatically: ≤30d
        per day, ≤180d per week, otherwise per month. Allowed values for
        `days`: 7, 30, 90, 180, 365.
        """
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            days = 30
        if days not in ACTIVITY_STATS_ALLOWED_DAYS:
            days = 30

        payload = compute_activity_stats(request.user, days)
        serializer = ActivityStatsResponseSerializer(payload)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="heatmap", url_name="heatmap")
    def heatmap(self, request: Request) -> Response:
        """
        GET /api/workouts/sessions/heatmap/?days=365

        Returns one cell per day for the last N days (90/180/365) with the
        session count, so the mobile client can render a GitHub-style
        contribution heatmap. Days with no workout are filled with 0.
        """
        try:
            days = int(request.query_params.get("days", 365))
        except (TypeError, ValueError):
            days = 365
        if days not in HEATMAP_ALLOWED_DAYS:
            days = 365

        payload = compute_workout_heatmap(request.user, days)
        serializer = HeatmapResponseSerializer(payload)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["patch"],
        url_path=r"set-logs/(?P<set_log_id>[^/.]+)",
        url_name="set-log-update",
    )
    def update_set_log(self, request: Request, pk=None, set_log_id=None) -> Response:
        """
        PATCH /api/workouts/sessions/{id}/set-logs/{set_log_id}/

        Atualiza apenas o campo `notes` de uma série de uma sessão do próprio
        usuário (isolamento garantido pelo `get_object()`).
        """
        session = self.get_object()
        set_log = session.set_logs.filter(pk=set_log_id).first()
        if set_log is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        notes = request.data.get("notes")
        if notes is None:
            return Response(
                {"notes": ["Required."]}, status=status.HTTP_400_BAD_REQUEST
            )
        if len(notes) > 200:
            return Response(
                {"notes": ["Max 200 chars."]}, status=status.HTTP_400_BAD_REQUEST
            )
        set_log.notes = notes
        set_log.save(update_fields=["notes"])
        return Response(SetLogSerializer(set_log).data)


class ScheduledWorkoutViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduledWorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["day_of_week"]

    def get_queryset(self):
        return (
            ScheduledWorkout.objects.filter(user=self.request.user)
            .select_related("template")
            .prefetch_related("template__exercises__exercise")
        )

    def perform_create(self, serializer: ScheduledWorkoutSerializer) -> None:
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="today", url_name="today")
    def today(self, request: Request) -> Response:
        weekday = timezone.localtime().weekday()
        qs = self.get_queryset().filter(day_of_week=weekday)
        serializer = self.get_serializer(qs, many=True)
        return Response({"day_of_week": weekday, "results": serializer.data})
