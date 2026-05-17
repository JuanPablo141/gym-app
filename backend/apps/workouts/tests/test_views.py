from datetime import timedelta
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from apps.exercises.tests.factories import ExerciseFactory
from apps.workouts.tests.factories import (
    WorkoutTemplateFactory,
    WorkoutSessionFactory,
    SetLogFactory,
)


# ---------------------------------------------------------------------------
# WorkoutSession endpoints
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_create_session_with_nested_sets_via_api(authed_client):
    bench = ExerciseFactory()
    payload = {
        "started_at": timezone.now().isoformat(),
        "finished_at": (timezone.now() + timedelta(hours=1)).isoformat(),
        "set_logs": [
            {"exercise": str(bench.id), "set_number": 1, "weight_kg": "80.00", "reps": 8, "rpe": "7.5"},
        ],
    }

    response = authed_client.post(
        reverse("workout-session-list"), data=payload, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert len(response.data["set_logs"]) == 1


@pytest.mark.django_db
def test_cannot_access_another_users_session(authed_client, other_user):
    foreign_session = WorkoutSessionFactory(user=other_user)

    url = reverse("workout-session-detail", kwargs={"pk": foreign_session.id})
    response = authed_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_session_summary_endpoint_smoke(authed_client, user):
    session = WorkoutSessionFactory(user=user)
    SetLogFactory(session=session, exercise=ExerciseFactory())

    url = reverse("workout-session-summary", kwargs={"pk": session.id})
    response = authed_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["total_sets"] == 1
    assert len(response.data["exercises"]) == 1


# ---------------------------------------------------------------------------
# WorkoutTemplate — soft delete e restore via API
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_delete_template_is_soft_delete(authed_client, user):
    template = WorkoutTemplateFactory(user=user)

    url = reverse("workout-template-detail", kwargs={"pk": template.id})
    response = authed_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Não aparece mais no list
    list_resp = authed_client.get(reverse("workout-template-list"))
    assert list_resp.data["count"] == 0

    # Mas ainda existe no banco com deleted_at preenchido
    template.refresh_from_db()
    assert template.deleted_at is not None


@pytest.mark.django_db
def test_restore_template_brings_it_back(authed_client, user):
    template = WorkoutTemplateFactory(user=user)
    template.delete()  # soft delete

    url = reverse("workout-template-restore", kwargs={"pk": template.id})
    response = authed_client.post(url)

    assert response.status_code == status.HTTP_200_OK
    template.refresh_from_db()
    assert template.deleted_at is None
