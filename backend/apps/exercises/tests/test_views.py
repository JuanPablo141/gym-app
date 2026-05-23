from datetime import timedelta
from decimal import Decimal
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from apps.exercises.models import MuscleGroup
from apps.exercises.tests.factories import ExerciseFactory
from apps.workouts.tests.factories import WorkoutSessionFactory, SetLogFactory


@pytest.mark.django_db
def test_list_exercises_returns_200_when_authenticated(authed_client):
    ExerciseFactory.create_batch(3)

    response = authed_client.get(reverse("exercise-list"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 3


@pytest.mark.django_db
def test_list_exercises_returns_401_without_auth(api_client):
    response = api_client.get(reverse("exercise-list"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_filter_exercises_by_muscle_group(authed_client):
    ExerciseFactory(name="Bench", muscle_group=MuscleGroup.CHEST)
    ExerciseFactory(name="Row", muscle_group=MuscleGroup.BACK)

    response = authed_client.get(reverse("exercise-list"), {"muscle_group": "chest"})

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["name"] == "Bench"


@pytest.mark.django_db
def test_history_only_includes_authenticated_user_sessions(authed_client, user, other_user):
    bench = ExerciseFactory(name="Bench")

    # Sessão do user autenticado
    own_session = WorkoutSessionFactory(user=user)
    SetLogFactory(session=own_session, exercise=bench)

    # Sessão de outro usuário com o mesmo exercício — não deve aparecer
    other_session = WorkoutSessionFactory(user=other_user)
    SetLogFactory(session=other_session, exercise=bench)

    url = reverse("exercise-history", kwargs={"pk": bench.id})
    response = authed_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1


@pytest.mark.django_db
def test_progression_returns_suggestion_after_history(authed_client, user):
    bench = ExerciseFactory(name="Bench")
    session = WorkoutSessionFactory(user=user)
    SetLogFactory(
        session=session, exercise=bench,
        weight_kg=Decimal("80"), reps=8, rpe=Decimal("7.0"),
    )

    url = reverse("exercise-progression", kwargs={"pk": bench.id})
    response = authed_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["suggestion"] is not None
    assert Decimal(response.data["suggestion"]["weight_kg"]) == Decimal("82.50")


@pytest.mark.django_db
def test_progression_empty_when_no_history(authed_client):
    bench = ExerciseFactory(name="Bench")

    url = reverse("exercise-progression", kwargs={"pk": bench.id})
    response = authed_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["suggestion"] is None
    assert response.data["trend"] == []


@pytest.mark.django_db
def test_volume_trend_returns_last_n_sessions_chronologically(authed_client, user):
    bench = ExerciseFactory(name="Bench")
    now = timezone.now()
    # 3 sessões cronológicas: hoje, ontem, anteontem
    for days_ago, weight in [(2, 70), (1, 75), (0, 80)]:
        session = WorkoutSessionFactory(
            user=user, started_at=now - timedelta(days=days_ago)
        )
        SetLogFactory(
            session=session, exercise=bench,
            weight_kg=Decimal(str(weight)), reps=10, set_number=1,
        )
        SetLogFactory(
            session=session, exercise=bench,
            weight_kg=Decimal(str(weight)), reps=8, set_number=2,
        )

    url = reverse("exercise-volume-trend", kwargs={"pk": bench.id})
    response = authed_client.get(url, {"sessions": 5})

    assert response.status_code == status.HTTP_200_OK
    points = response.data["points"]
    assert len(points) == 3
    # Ordem cronológica: mais antigo primeiro
    assert Decimal(points[0]["top_weight_kg"]) == Decimal("70.00")
    assert Decimal(points[2]["top_weight_kg"]) == Decimal("80.00")
    # Volume: 70*10 + 70*8 = 1260
    assert Decimal(points[0]["volume_kg"]) == Decimal("1260.00")
    assert points[0]["sets_count"] == 2


@pytest.mark.django_db
def test_volume_trend_isolated_by_user(authed_client, user, other_user):
    bench = ExerciseFactory(name="Bench")
    own = WorkoutSessionFactory(user=user)
    SetLogFactory(session=own, exercise=bench, weight_kg=Decimal("60"), reps=5)
    foreign = WorkoutSessionFactory(user=other_user)
    SetLogFactory(session=foreign, exercise=bench, weight_kg=Decimal("100"), reps=5)

    url = reverse("exercise-volume-trend", kwargs={"pk": bench.id})
    response = authed_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["points"]) == 1
    assert Decimal(response.data["points"][0]["top_weight_kg"]) == Decimal("60.00")


@pytest.mark.django_db
def test_volume_trend_empty_for_new_exercise(authed_client):
    bench = ExerciseFactory(name="Bench")

    url = reverse("exercise-volume-trend", kwargs={"pk": bench.id})
    response = authed_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["points"] == []
