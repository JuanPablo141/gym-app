from decimal import Decimal
import pytest
from django.urls import reverse
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
