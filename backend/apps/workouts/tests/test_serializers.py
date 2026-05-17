from datetime import timedelta
import uuid
import pytest
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory
from apps.workouts.serializers import WorkoutSessionSerializer
from apps.workouts.models import WorkoutSession, SetLog
from apps.exercises.tests.factories import ExerciseFactory


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
