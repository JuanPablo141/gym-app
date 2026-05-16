from __future__ import annotations
from django.db import models
from django.utils import timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import WorkoutTemplate


class SoftDeleteQuerySet(models.QuerySet["WorkoutTemplate"]):
    def delete(self) -> tuple[int, dict[str, int]]:
        count = self.update(deleted_at=timezone.now())
        return count, {"workouts.WorkoutTemplate": count}

    def hard_delete(self) -> tuple[int, dict[str, int]]:
        return super().delete()

    def restore(self) -> int:
        return self.update(deleted_at=None)

    def only_deleted(self) -> "SoftDeleteQuerySet":
        return self.model.all_objects.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager["WorkoutTemplate"]):
    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db).filter(
            deleted_at__isnull=True
        )


class AllObjectsManager(models.Manager["WorkoutTemplate"]):
    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db)
