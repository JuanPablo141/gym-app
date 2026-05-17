from datetime import timedelta
import pytest
from django.db.models import ProtectedError
from django.utils import timezone
from apps.workouts.models import WorkoutTemplate, SetLog
from apps.exercises.models import Exercise
from apps.exercises.tests.factories import ExerciseFactory
from apps.workouts.tests.factories import (
    WorkoutTemplateFactory,
    WorkoutSessionFactory,
    SetLogFactory,
)


# ---------------------------------------------------------------------------
# WorkoutTemplate — soft delete
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_delete_template_sets_deleted_at_instead_of_removing():
    template = WorkoutTemplateFactory()

    template.delete()

    template.refresh_from_db()
    assert template.deleted_at is not None
    assert template.is_deleted is True


@pytest.mark.django_db
def test_default_manager_hides_soft_deleted_templates():
    visible = WorkoutTemplateFactory()
    hidden = WorkoutTemplateFactory()
    hidden.delete()

    ids = set(WorkoutTemplate.objects.values_list("id", flat=True))

    assert visible.id in ids
    assert hidden.id not in ids


@pytest.mark.django_db
def test_all_objects_manager_includes_soft_deleted():
    visible = WorkoutTemplateFactory()
    hidden = WorkoutTemplateFactory()
    hidden.delete()

    ids = set(WorkoutTemplate.all_objects.values_list("id", flat=True))

    assert {visible.id, hidden.id} <= ids


@pytest.mark.django_db
def test_restore_clears_deleted_at():
    template = WorkoutTemplateFactory()
    template.delete()
    assert template.deleted_at is not None

    template.restore()

    template.refresh_from_db()
    assert template.deleted_at is None
    assert template.is_deleted is False


@pytest.mark.django_db
def test_queryset_delete_soft_deletes_all_matched():
    WorkoutTemplateFactory.create_batch(3)

    WorkoutTemplate.objects.all().delete()

    assert WorkoutTemplate.objects.count() == 0
    assert WorkoutTemplate.all_objects.count() == 3


# ---------------------------------------------------------------------------
# WorkoutSession — duration property
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_duration_minutes_is_none_when_not_finished():
    session = WorkoutSessionFactory(finished_at=None)
    assert session.duration_minutes is None


@pytest.mark.django_db
def test_duration_minutes_calculates_from_started_finished():
    start = timezone.now()
    session = WorkoutSessionFactory(
        started_at=start,
        finished_at=start + timedelta(minutes=45),
    )
    assert session.duration_minutes == 45.0


# ---------------------------------------------------------------------------
# SetLog — PROTECT on exercise FK
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_cannot_delete_exercise_with_existing_set_logs():
    exercise = ExerciseFactory()
    SetLogFactory(exercise=exercise)

    with pytest.raises(ProtectedError):
        exercise.delete()
