import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from .managers import SoftDeleteManager, AllObjectsManager


class WorkoutTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workout_templates",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Workout Template"
        verbose_name_plural = "Workout Templates"

    def __str__(self) -> str:
        return f"{self.name} ({self.user})"

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def delete(self, using=None, keep_parents: bool = False) -> tuple[int, dict[str, int]]:
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])
        return 1, {"workouts.WorkoutTemplate": 1}

    def restore(self) -> None:
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])


class TemplateExercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        WorkoutTemplate,
        on_delete=models.CASCADE,
        related_name="exercises",
    )
    exercise = models.ForeignKey(
        "exercises.Exercise",
        on_delete=models.PROTECT,
        related_name="+",
    )
    order = models.PositiveSmallIntegerField()
    target_sets = models.PositiveSmallIntegerField(default=3)
    target_reps = models.CharField(
        max_length=20,
        default="",
        help_text="Notação livre: '10', '8-12', 'AMRAP', '30s', etc.",
    )
    rest_seconds = models.PositiveSmallIntegerField(default=90)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["order"]
        unique_together = [("template", "order")]
        verbose_name = "Template Exercise"
        verbose_name_plural = "Template Exercises"

    def __str__(self) -> str:
        return f"{self.template.name} · {self.order}. {self.exercise.name}"


class WorkoutSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workout_sessions",
    )
    template = models.ForeignKey(
        WorkoutTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sessions",
    )
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    route_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "Workout Session"
        verbose_name_plural = "Workout Sessions"

    def __str__(self) -> str:
        return f"Session {self.id} — {self.user} @ {self.started_at:%Y-%m-%d}"

    @property
    def duration_minutes(self) -> float | None:
        if self.finished_at and self.started_at:
            delta = self.finished_at - self.started_at
            return round(delta.total_seconds() / 60, 1)
        return None


class SetLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name="set_logs",
    )
    exercise = models.ForeignKey(
        "exercises.Exercise",
        on_delete=models.PROTECT,
        related_name="set_logs",
    )
    set_number = models.PositiveSmallIntegerField(default=1)
    weight_kg = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        help_text="Weight in kilograms. Null = bodyweight exercise.",
    )
    reps = models.PositiveSmallIntegerField()
    rpe = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True,
        help_text="Rate of Perceived Exertion (1–10 scale).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["set_number"]
        verbose_name = "Set Log"
        verbose_name_plural = "Set Logs"
        unique_together = [("session", "exercise", "set_number")]

    def __str__(self) -> str:
        return (
            f"Set {self.set_number} — {self.exercise.name} "
            f"{self.weight_kg}kg x {self.reps} @ RPE {self.rpe}"
        )
