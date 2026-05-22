from datetime import timedelta
import pytest
from django.db import IntegrityError
from django.db.models import ProtectedError
from django.utils import timezone
from apps.workouts.models import WorkoutTemplate, SetLog, TemplateExercise, ScheduledWorkout
from apps.exercises.models import Exercise
from apps.exercises.tests.factories import ExerciseFactory
from apps.users.tests.factories import UserFactory
from apps.workouts.tests.factories import (
    WorkoutTemplateFactory,
    WorkoutSessionFactory,
    SetLogFactory,
    TemplateExerciseFactory,
    ScheduledWorkoutFactory,
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


# ---------------------------------------------------------------------------
# TemplateExercise
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_template_exercises_ordered_by_order():
    template = WorkoutTemplateFactory()
    third = TemplateExerciseFactory(template=template, order=3)
    first = TemplateExerciseFactory(template=template, order=1)
    second = TemplateExerciseFactory(template=template, order=2)

    ids = list(template.exercises.values_list("id", flat=True))

    assert ids == [first.id, second.id, third.id]


@pytest.mark.django_db
def test_template_exercise_unique_together_per_template():
    template = WorkoutTemplateFactory()
    TemplateExerciseFactory(template=template, order=1)

    with pytest.raises(IntegrityError):
        TemplateExerciseFactory(template=template, order=1)


@pytest.mark.django_db
def test_template_hard_delete_cascades_to_exercises():
    template = WorkoutTemplateFactory()
    TemplateExerciseFactory.create_batch(3, template=template)
    assert TemplateExercise.objects.filter(template=template).count() == 3

    # Bypass soft delete usando o queryset hard_delete
    WorkoutTemplate.all_objects.filter(pk=template.pk).hard_delete()

    assert TemplateExercise.objects.filter(template_id=template.pk).count() == 0


@pytest.mark.django_db
def test_cannot_delete_exercise_used_in_template():
    exercise = ExerciseFactory()
    TemplateExerciseFactory(exercise=exercise)

    with pytest.raises(ProtectedError):
        exercise.delete()


# ---------------------------------------------------------------------------
# ScheduledWorkout
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_scheduled_workout_unique_template_per_day():
    template = WorkoutTemplateFactory()
    ScheduledWorkoutFactory(user=template.user, template=template, day_of_week=0)

    with pytest.raises(IntegrityError):
        ScheduledWorkoutFactory(user=template.user, template=template, day_of_week=0)


@pytest.mark.django_db
def test_scheduled_workout_ordering_by_day_and_order():
    user = UserFactory()
    t1 = WorkoutTemplateFactory(user=user)
    t2 = WorkoutTemplateFactory(user=user)
    later = ScheduledWorkoutFactory(user=user, template=t1, day_of_week=2, order=2)
    earlier = ScheduledWorkoutFactory(user=user, template=t2, day_of_week=2, order=1)

    ids = list(
        ScheduledWorkout.objects.filter(user=user, day_of_week=2).values_list(
            "id", flat=True
        )
    )

    assert ids == [earlier.id, later.id]


@pytest.mark.django_db
def test_template_hard_delete_cascades_to_schedule():
    template = WorkoutTemplateFactory()
    ScheduledWorkoutFactory(user=template.user, template=template, day_of_week=3)
    template_id = template.id
    assert ScheduledWorkout.objects.filter(template_id=template_id).count() == 1

    WorkoutTemplate.all_objects.filter(pk=template_id).hard_delete()

    assert ScheduledWorkout.objects.filter(template_id=template_id).count() == 0
