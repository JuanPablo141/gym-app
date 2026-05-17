from __future__ import annotations
from typing import Any
from django.db import transaction
from rest_framework import serializers
from apps.exercises.serializers import ExerciseSerializer
from .models import WorkoutTemplate, WorkoutSession, SetLog


class WorkoutTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutTemplate
        fields = (
            "id", "name", "description",
            "is_deleted", "deleted_at",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "is_deleted", "deleted_at", "created_at", "updated_at")


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

    class Meta:
        model = WorkoutSession
        fields = (
            "id",
            "template",
            "started_at",
            "finished_at",
            "notes",
            "duration_minutes",
            "set_logs",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

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
        fields = ("set_number", "weight_kg", "reps", "rpe")


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
