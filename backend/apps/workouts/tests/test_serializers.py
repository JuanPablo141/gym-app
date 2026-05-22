from datetime import timedelta
import uuid
import pytest
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory
from apps.workouts.serializers import (
    WorkoutSessionSerializer,
    WorkoutTemplateSerializer,
    ScheduledWorkoutSerializer,
)
from apps.workouts.models import (
    WorkoutSession,
    SetLog,
    TemplateExercise,
    WorkoutTemplate,
    ScheduledWorkout,
)
from apps.exercises.tests.factories import ExerciseFactory
from apps.workouts.tests.factories import (
    WorkoutTemplateFactory,
    TemplateExerciseFactory,
)


def _context_for(user):
    request = APIRequestFactory().post("/")
    request.user = user
    return {"request": request}


@pytest.mark.django_db
def test_create_session_with_nested_sets_persists_both(user):
    bench = ExerciseFactory()
    payload = {
        "started_at": timezone.now().isoformat(),
        "finished_at": (timezone.now() + timedelta(hours=1)).isoformat(),
        "set_logs": [
            {"exercise": str(bench.id), "set_number": 1, "weight_kg": "80.00", "reps": 8, "rpe": "7.0"},
            {"exercise": str(bench.id), "set_number": 2, "weight_kg": "82.50", "reps": 6, "rpe": "8.5"},
        ],
    }
    serializer = WorkoutSessionSerializer(data=payload, context=_context_for(user))
    assert serializer.is_valid(), serializer.errors

    session = serializer.save()

    assert WorkoutSession.objects.count() == 1
    assert SetLog.objects.filter(session=session).count() == 2
    assert session.user == user


@pytest.mark.django_db
def test_create_session_with_invalid_exercise_uuid_raises(user):
    payload = {
        "started_at": timezone.now().isoformat(),
        "set_logs": [
            {"exercise": str(uuid.uuid4()), "set_number": 1, "weight_kg": "80.00", "reps": 8},
        ],
    }
    serializer = WorkoutSessionSerializer(data=payload, context=_context_for(user))
    assert serializer.is_valid(), serializer.errors

    from apps.exercises.models import Exercise
    with pytest.raises(Exercise.DoesNotExist):
        serializer.save()

    # Atomicidade: nenhuma sessão deve ter sido persistida
    assert WorkoutSession.objects.count() == 0


@pytest.mark.django_db
def test_update_session_replaces_set_logs(user):
    bench = ExerciseFactory(name="Bench")
    squat = ExerciseFactory(name="Squat")

    # Cria sessão inicial com 2 sets de bench
    create_payload = {
        "started_at": timezone.now().isoformat(),
        "set_logs": [
            {"exercise": str(bench.id), "set_number": 1, "weight_kg": "80.00", "reps": 8},
            {"exercise": str(bench.id), "set_number": 2, "weight_kg": "80.00", "reps": 8},
        ],
    }
    create_ser = WorkoutSessionSerializer(data=create_payload, context=_context_for(user))
    create_ser.is_valid(raise_exception=True)
    session = create_ser.save()
    assert session.set_logs.count() == 2

    # Atualiza com apenas 1 set de squat
    update_payload = {
        "started_at": timezone.now().isoformat(),
        "set_logs": [
            {"exercise": str(squat.id), "set_number": 1, "weight_kg": "100.00", "reps": 5},
        ],
    }
    update_ser = WorkoutSessionSerializer(
        instance=session, data=update_payload, context=_context_for(user)
    )
    update_ser.is_valid(raise_exception=True)
    update_ser.save()

    session.refresh_from_db()
    assert session.set_logs.count() == 1
    assert session.set_logs.first().exercise == squat


# ---------------------------------------------------------------------------
# route_data — validação leve
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_create_session_with_route_data_persists(user):
    payload = {
        "started_at": timezone.now().isoformat(),
        "route_data": [
            {"lat": -23.5505, "lng": -46.6333, "timestamp": "2026-05-17T08:00:00Z"},
            {"lat": -23.5510, "lng": -46.6340},
        ],
    }
    serializer = WorkoutSessionSerializer(data=payload, context=_context_for(user))
    assert serializer.is_valid(), serializer.errors

    session = serializer.save()

    session.refresh_from_db()
    assert session.route_data is not None
    assert len(session.route_data) == 2
    assert session.route_data[0]["lat"] == -23.5505


@pytest.mark.django_db
def test_route_data_rejects_invalid_lat(user):
    payload = {
        "started_at": timezone.now().isoformat(),
        "route_data": [{"lat": 91, "lng": 0}],
    }
    serializer = WorkoutSessionSerializer(data=payload, context=_context_for(user))

    assert not serializer.is_valid()
    assert "route_data" in serializer.errors


@pytest.mark.django_db
def test_route_data_rejects_non_list(user):
    payload = {
        "started_at": timezone.now().isoformat(),
        "route_data": {"foo": "bar"},
    }
    serializer = WorkoutSessionSerializer(data=payload, context=_context_for(user))

    assert not serializer.is_valid()
    assert "route_data" in serializer.errors


# ---------------------------------------------------------------------------
# WorkoutTemplate nested writable (TemplateExercise)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_create_template_with_exercises(user):
    bench = ExerciseFactory(name="Bench")
    squat = ExerciseFactory(name="Squat")
    payload = {
        "name": "Push Day",
        "description": "Peito + tríceps",
        "exercises": [
            {"exercise": str(bench.id), "order": 1, "target_sets": 4, "target_reps": "8-12", "rest_seconds": 120},
            {"exercise": str(squat.id), "order": 2, "target_sets": 3, "target_reps": "5", "rest_seconds": 180},
        ],
    }
    serializer = WorkoutTemplateSerializer(data=payload, context=_context_for(user))
    assert serializer.is_valid(), serializer.errors

    template = serializer.save(user=user)

    assert WorkoutTemplate.objects.count() == 1
    assert TemplateExercise.objects.filter(template=template).count() == 2
    first = template.exercises.first()
    assert first.exercise == bench
    assert first.target_reps == "8-12"


@pytest.mark.django_db
def test_create_template_without_exercises_still_works(user):
    payload = {"name": "Empty", "description": ""}
    serializer = WorkoutTemplateSerializer(data=payload, context=_context_for(user))
    assert serializer.is_valid(), serializer.errors

    template = serializer.save(user=user)

    assert template.exercises.count() == 0


@pytest.mark.django_db
def test_update_template_replaces_exercises(user):
    template = WorkoutTemplateFactory(user=user)
    bench = ExerciseFactory(name="Bench")
    TemplateExerciseFactory(template=template, exercise=bench, order=1)
    TemplateExerciseFactory(template=template, exercise=bench, order=2)
    assert template.exercises.count() == 2

    squat = ExerciseFactory(name="Squat")
    payload = {
        "name": template.name,
        "exercises": [
            {"exercise": str(squat.id), "order": 1, "target_sets": 3, "target_reps": "5", "rest_seconds": 180},
        ],
    }
    serializer = WorkoutTemplateSerializer(
        instance=template, data=payload, context=_context_for(user)
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    template.refresh_from_db()
    assert template.exercises.count() == 1
    assert template.exercises.first().exercise == squat


@pytest.mark.django_db
def test_create_template_with_invalid_exercise_uuid_raises(user):
    import uuid

    payload = {
        "name": "X",
        "exercises": [
            {"exercise": str(uuid.uuid4()), "order": 1, "target_sets": 3, "target_reps": "10"},
        ],
    }
    serializer = WorkoutTemplateSerializer(data=payload, context=_context_for(user))
    assert serializer.is_valid(), serializer.errors

    from apps.exercises.models import Exercise
    with pytest.raises(Exercise.DoesNotExist):
        serializer.save(user=user)

    # Atomicidade — nada persiste
    assert WorkoutTemplate.objects.count() == 0
    assert TemplateExercise.objects.count() == 0


# ---------------------------------------------------------------------------
# ScheduledWorkout
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_create_scheduled_workout_resolves_template(user):
    template = WorkoutTemplateFactory(user=user)
    payload = {"template": str(template.id), "day_of_week": 2, "order": 1}
    serializer = ScheduledWorkoutSerializer(data=payload, context=_context_for(user))
    assert serializer.is_valid(), serializer.errors

    schedule = serializer.save(user=user)

    assert schedule.template == template
    assert schedule.day_of_week == 2


@pytest.mark.django_db
def test_create_scheduled_workout_with_invalid_template_uuid_raises(user):
    import uuid
    payload = {"template": str(uuid.uuid4()), "day_of_week": 1, "order": 1}
    serializer = ScheduledWorkoutSerializer(data=payload, context=_context_for(user))
    assert serializer.is_valid(), serializer.errors

    with pytest.raises(WorkoutTemplate.DoesNotExist):
        serializer.save(user=user)

    assert ScheduledWorkout.objects.count() == 0
