from __future__ import annotations
from typing import Any
from django.db import transaction
from rest_framework import serializers
from apps.exercises.serializers import ExerciseSerializer
from .models import (
    WorkoutTemplate,
    WorkoutSession,
    SetLog,
    TemplateExercise,
    ScheduledWorkout,
)


class TemplateExerciseSerializer(serializers.ModelSerializer):
    exercise_detail = ExerciseSerializer(source="exercise", read_only=True)
    exercise = serializers.UUIDField(write_only=True)

    class Meta:
        model = TemplateExercise
        fields = (
            "id",
            "exercise",
            "exercise_detail",
            "order",
            "target_sets",
            "target_reps",
            "rest_seconds",
            "notes",
        )
        read_only_fields = ("id",)


class WorkoutTemplateSerializer(serializers.ModelSerializer):
    exercises = TemplateExerciseSerializer(many=True, required=False)

    class Meta:
        model = WorkoutTemplate
        fields = (
            "id", "name", "description",
            "is_deleted", "deleted_at",
            "created_at", "updated_at",
            "exercises",
        )
        read_only_fields = ("id", "is_deleted", "deleted_at", "created_at", "updated_at")

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> WorkoutTemplate:
        exercises_data: list[dict[str, Any]] = validated_data.pop("exercises", [])
        template = WorkoutTemplate.objects.create(**validated_data)
        self._create_exercises(template, exercises_data)
        return template

    @transaction.atomic
    def update(
        self, instance: WorkoutTemplate, validated_data: dict[str, Any]
    ) -> WorkoutTemplate:
        exercises_data: list[dict[str, Any]] | None = validated_data.pop("exercises", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if exercises_data is not None:
            instance.exercises.all().delete()
            self._create_exercises(instance, exercises_data)
        return instance

    @staticmethod
    def _create_exercises(
        template: WorkoutTemplate, exercises_data: list[dict[str, Any]]
    ) -> None:
        from apps.exercises.models import Exercise

        items: list[TemplateExercise] = []
        for data in exercises_data:
            exercise_id = data.pop("exercise")
            exercise = Exercise.objects.get(pk=exercise_id)
            items.append(TemplateExercise(template=template, exercise=exercise, **data))
        TemplateExercise.objects.bulk_create(items)


class SetLogSerializer(serializers.ModelSerializer):
    exercise_detail = ExerciseSerializer(source="exercise", read_only=True)
    exercise = serializers.UUIDField(write_only=True)

    class Meta:
        model = SetLog
        fields = (
            "id",
            "exercise",
            "exercise_detail",
            "set_number",
            "weight_kg",
            "reps",
            "rpe",
            "notes",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class WorkoutSessionSerializer(serializers.ModelSerializer):
    """
    POST body example:
    {
        "template": "uuid-or-null",
        "started_at": "2025-05-15T08:00:00Z",
        "finished_at": "2025-05-15T09:00:00Z",
        "set_logs": [
            {"exercise": "uuid", "set_number": 1, "weight_kg": "80.00", "reps": 8, "rpe": "7.5"}
        ]
    }
    """
    set_logs = SetLogSerializer(many=True, required=False)
    duration_minutes = serializers.ReadOnlyField()
    template_name = serializers.CharField(source="template.name", read_only=True, default=None)

    class Meta:
        model = WorkoutSession
        fields = (
            "id",
            "template",
            "template_name",
            "started_at",
            "finished_at",
            "notes",
            "duration_minutes",
            "set_logs",
            "route_data",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_route_data(self, value):
        if value is None:
            return value
        if not isinstance(value, list):
            raise serializers.ValidationError("route_data deve ser uma lista.")
        for i, point in enumerate(value):
            if not isinstance(point, dict):
                raise serializers.ValidationError(f"Ponto {i} deve ser um objeto.")
            lat = point.get("lat")
            lng = point.get("lng")
            if not isinstance(lat, (int, float)) or isinstance(lat, bool) or not -90 <= lat <= 90:
                raise serializers.ValidationError(f"Ponto {i}: lat inválido.")
            if not isinstance(lng, (int, float)) or isinstance(lng, bool) or not -180 <= lng <= 180:
                raise serializers.ValidationError(f"Ponto {i}: lng inválido.")
        return value

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> WorkoutSession:
        set_logs_data: list[dict[str, Any]] = validated_data.pop("set_logs", [])
        user = self.context["request"].user
        session = WorkoutSession.objects.create(user=user, **validated_data)
        self._create_set_logs(session, set_logs_data)
        return session

    @transaction.atomic
    def update(
        self, instance: WorkoutSession, validated_data: dict[str, Any]
    ) -> WorkoutSession:
        set_logs_data: list[dict[str, Any]] | None = validated_data.pop("set_logs", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if set_logs_data is not None:
            instance.set_logs.all().delete()
            self._create_set_logs(instance, set_logs_data)
        return instance

    @staticmethod
    def _create_set_logs(
        session: WorkoutSession, set_logs_data: list[dict[str, Any]]
    ) -> None:
        from apps.exercises.models import Exercise

        set_log_objects: list[SetLog] = []
        for data in set_logs_data:
            exercise_id = data.pop("exercise")
            exercise = Exercise.objects.get(pk=exercise_id)
            set_log_objects.append(SetLog(session=session, exercise=exercise, **data))
        SetLog.objects.bulk_create(set_log_objects)


class HistorySetSerializer(serializers.ModelSerializer):
    class Meta:
        model = SetLog
        fields = ("set_number", "weight_kg", "reps", "rpe", "notes")


class ExerciseHistorySessionSerializer(serializers.ModelSerializer):
    sets = HistorySetSerializer(source="exercise_sets", many=True, read_only=True)
    total_volume_kg = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutSession
        fields = (
            "id",
            "started_at",
            "finished_at",
            "notes",
            "sets",
            "total_volume_kg",
        )

    def get_total_volume_kg(self, obj: WorkoutSession) -> float:
        """Soma de (weight_kg * reps) — métrica clássica de volume de treino."""
        total = 0.0
        for s in obj.exercise_sets:  # type: ignore[attr-defined]
            if s.weight_kg is not None:
                total += float(s.weight_kg) * s.reps
        return round(total, 2)


class ProgressionTopSetSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    date = serializers.DateTimeField()
    weight_kg = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    reps = serializers.IntegerField()
    rpe = serializers.DecimalField(max_digits=3, decimal_places=1, allow_null=True)


class ProgressionPRSerializer(serializers.Serializer):
    weight_kg = serializers.DecimalField(max_digits=6, decimal_places=2)
    reps = serializers.IntegerField()
    date = serializers.DateTimeField()


class ProgressionTrendPointSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    top_weight_kg = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    top_reps = serializers.IntegerField()
    top_rpe = serializers.DecimalField(max_digits=3, decimal_places=1, allow_null=True)


class ProgressionSuggestionSerializer(serializers.Serializer):
    weight_kg = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    reps = serializers.IntegerField()
    rationale = serializers.CharField()


class ProgressionResponseSerializer(serializers.Serializer):
    exercise_id = serializers.UUIDField()
    last_top_set = ProgressionTopSetSerializer(allow_null=True)
    personal_record = ProgressionPRSerializer(allow_null=True)
    trend = ProgressionTrendPointSerializer(many=True)
    suggestion = ProgressionSuggestionSerializer(allow_null=True)


class SessionSummaryTopSetSerializer(serializers.Serializer):
    weight_kg = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    reps = serializers.IntegerField()
    rpe = serializers.DecimalField(max_digits=3, decimal_places=1, allow_null=True)


class SessionSummaryExerciseSerializer(serializers.Serializer):
    exercise_id = serializers.UUIDField()
    exercise_name = serializers.CharField()
    muscle_group = serializers.CharField()
    sets_count = serializers.IntegerField()
    volume_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    top_set = SessionSummaryTopSetSerializer()
    is_new_pr = serializers.BooleanField()


class SessionSummaryResponseSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    started_at = serializers.DateTimeField()
    finished_at = serializers.DateTimeField(allow_null=True)
    duration_minutes = serializers.FloatField(allow_null=True)
    total_volume_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_sets = serializers.IntegerField()
    exercises = SessionSummaryExerciseSerializer(many=True)
    muscle_groups_trained = serializers.ListField(child=serializers.CharField())
    new_prs_count = serializers.IntegerField()


class VolumeTrendPointSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    session_id = serializers.UUIDField()
    volume_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
    top_weight_kg = serializers.DecimalField(
        max_digits=6, decimal_places=2, allow_null=True
    )
    sets_count = serializers.IntegerField()


class VolumeTrendResponseSerializer(serializers.Serializer):
    exercise_id = serializers.UUIDField()
    points = VolumeTrendPointSerializer(many=True)


class ActivityBucketSerializer(serializers.Serializer):
    bucket_start = serializers.DateField()
    session_count = serializers.IntegerField()
    total_volume_kg = serializers.DecimalField(max_digits=14, decimal_places=2)


class ActivityTemplateBreakdownSerializer(serializers.Serializer):
    template_id = serializers.UUIDField(allow_null=True)
    template_name = serializers.CharField(allow_null=True)
    session_count = serializers.IntegerField()


class ActivityStatsResponseSerializer(serializers.Serializer):
    days = serializers.IntegerField()
    granularity = serializers.ChoiceField(choices=["day", "week", "month"])
    total_sessions = serializers.IntegerField()
    total_volume_kg = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_sessions_per_week = serializers.FloatField()
    longest_streak_weeks = serializers.IntegerField()
    buckets = ActivityBucketSerializer(many=True)
    templates_breakdown = ActivityTemplateBreakdownSerializer(many=True)


class HeatmapCellSerializer(serializers.Serializer):
    date = serializers.DateField()
    session_count = serializers.IntegerField()


class HeatmapResponseSerializer(serializers.Serializer):
    days = serializers.IntegerField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    max_sessions_in_day = serializers.IntegerField()
    days_with_workout = serializers.IntegerField()
    cells = HeatmapCellSerializer(many=True)


class ScheduledWorkoutSerializer(serializers.ModelSerializer):
    template_detail = WorkoutTemplateSerializer(source="template", read_only=True)
    template = serializers.UUIDField(write_only=True)

    class Meta:
        model = ScheduledWorkout
        fields = (
            "id",
            "template",
            "template_detail",
            "day_of_week",
            "order",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def create(self, validated_data: dict[str, Any]) -> ScheduledWorkout:
        template_id = validated_data.pop("template")
        template = WorkoutTemplate.objects.get(pk=template_id)
        return ScheduledWorkout.objects.create(template=template, **validated_data)

    def update(
        self, instance: ScheduledWorkout, validated_data: dict[str, Any]
    ) -> ScheduledWorkout:
        if "template" in validated_data:
            template_id = validated_data.pop("template")
            instance.template = WorkoutTemplate.objects.get(pk=template_id)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
