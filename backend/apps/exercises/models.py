import uuid
from django.db import models


class MuscleGroup(models.TextChoices):
    CHEST = "chest", "Chest"
    BACK = "back", "Back"
    SHOULDERS = "shoulders", "Shoulders"
    BICEPS = "biceps", "Biceps"
    TRICEPS = "triceps", "Triceps"
    LEGS = "legs", "Legs"
    GLUTES = "glutes", "Glutes"
    CORE = "core", "Core"
    CARDIO = "cardio", "Cardio"
    FULL_BODY = "full_body", "Full Body"


class Exercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    muscle_group = models.CharField(
        max_length=50, choices=MuscleGroup.choices, db_index=True
    )
    description = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to="exercises/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Exercise"
        verbose_name_plural = "Exercises"

    def __str__(self) -> str:
        return f"{self.name} ({self.muscle_group})"
