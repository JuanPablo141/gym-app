from datetime import timedelta
from decimal import Decimal
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from apps.exercises.tests.factories import ExerciseFactory
from apps.workouts.tests.factories import (
    WorkoutTemplateFactory,
    WorkoutSessionFactory,
    SetLogFactory,
    ScheduledWorkoutFactory,
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


# ---------------------------------------------------------------------------
# ScheduledWorkout endpoints
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_today_returns_only_current_day(authed_client, user):
    # Cria schedules em todos os 7 dias
    for dow in range(7):
        template = WorkoutTemplateFactory(user=user)
        ScheduledWorkoutFactory(user=user, template=template, day_of_week=dow)

    response = authed_client.get(reverse("scheduled-workout-today"))

    assert response.status_code == status.HTTP_200_OK
    today_dow = timezone.localtime().weekday()
    assert response.data["day_of_week"] == today_dow
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["day_of_week"] == today_dow


@pytest.mark.django_db
def test_today_only_returns_own_schedules(authed_client, user, other_user):
    today_dow = timezone.localtime().weekday()
    own = WorkoutTemplateFactory(user=user)
    foreign = WorkoutTemplateFactory(user=other_user)
    ScheduledWorkoutFactory(user=user, template=own, day_of_week=today_dow)
    ScheduledWorkoutFactory(user=other_user, template=foreign, day_of_week=today_dow)

    response = authed_client.get(reverse("scheduled-workout-today"))

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1


# ---------------------------------------------------------------------------
# Activity stats endpoint
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_activity_stats_7d_uses_daily_granularity(authed_client, user):
    bench = ExerciseFactory()
    now = timezone.localtime()
    session = WorkoutSessionFactory(user=user, started_at=now - timedelta(hours=1))
    SetLogFactory(session=session, exercise=bench, weight_kg=Decimal("80"), reps=10)

    response = authed_client.get(
        reverse("workout-session-activity-stats"), {"days": 7}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["granularity"] == "day"
    assert len(response.data["buckets"]) == 7
    assert response.data["total_sessions"] == 1
    assert Decimal(response.data["total_volume_kg"]) == Decimal("800.00")


@pytest.mark.django_db
def test_activity_stats_90d_uses_weekly_granularity(authed_client, user):
    response = authed_client.get(
        reverse("workout-session-activity-stats"), {"days": 90}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["granularity"] == "week"
    # ~13 semanas em 90 dias (depende de quando hoje cai na semana)
    assert 12 <= len(response.data["buckets"]) <= 14


@pytest.mark.django_db
def test_activity_stats_365d_uses_monthly_granularity(authed_client, user):
    response = authed_client.get(
        reverse("workout-session-activity-stats"), {"days": 365}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["granularity"] == "month"
    # ~12 meses
    assert 12 <= len(response.data["buckets"]) <= 13


@pytest.mark.django_db
def test_activity_stats_rejects_invalid_days_and_uses_default(authed_client):
    response = authed_client.get(
        reverse("workout-session-activity-stats"), {"days": 99}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["days"] == 30


@pytest.mark.django_db
def test_activity_stats_isolated_by_user(authed_client, user, other_user):
    bench = ExerciseFactory()
    now = timezone.localtime()
    foreign = WorkoutSessionFactory(user=other_user, started_at=now - timedelta(hours=1))
    SetLogFactory(session=foreign, exercise=bench, weight_kg=Decimal("100"), reps=10)

    response = authed_client.get(
        reverse("workout-session-activity-stats"), {"days": 7}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["total_sessions"] == 0
    assert all(b["session_count"] == 0 for b in response.data["buckets"])


@pytest.mark.django_db
def test_activity_stats_templates_breakdown(authed_client, user):
    bench = ExerciseFactory()
    peito = WorkoutTemplateFactory(user=user, name="Peito")
    costas = WorkoutTemplateFactory(user=user, name="Costas")
    now = timezone.localtime()
    # 2 sessões de Peito, 1 de Costas, 1 sem template (treino livre)
    for tmpl in [peito, peito, costas]:
        s = WorkoutSessionFactory(
            user=user, template=tmpl, started_at=now - timedelta(hours=1)
        )
        SetLogFactory(session=s, exercise=bench)
    free = WorkoutSessionFactory(user=user, template=None, started_at=now - timedelta(hours=2))
    SetLogFactory(session=free, exercise=bench)

    response = authed_client.get(
        reverse("workout-session-activity-stats"), {"days": 7}
    )

    assert response.status_code == status.HTTP_200_OK
    breakdown = response.data["templates_breakdown"]
    assert len(breakdown) == 3
    # Ordenado por contagem decrescente
    assert breakdown[0]["template_name"] == "Peito"
    assert breakdown[0]["session_count"] == 2
    # Treino sem template aparece com template_name=None
    free_row = next(b for b in breakdown if b["template_name"] is None)
    assert free_row["session_count"] == 1


@pytest.mark.django_db
def test_activity_stats_streak_counts_consecutive_weeks(authed_client, user):
    bench = ExerciseFactory()
    now = timezone.localtime()
    # 3 semanas consecutivas com treino + um gap + 1 isolado
    for weeks_ago in [0, 1, 2, 5]:
        s = WorkoutSessionFactory(
            user=user, started_at=now - timedelta(weeks=weeks_ago, hours=1)
        )
        SetLogFactory(session=s, exercise=bench)

    response = authed_client.get(
        reverse("workout-session-activity-stats"), {"days": 90}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["longest_streak_weeks"] == 3


# ---------------------------------------------------------------------------
# Heatmap endpoint
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_heatmap_returns_one_cell_per_day(authed_client):
    response = authed_client.get(
        reverse("workout-session-heatmap"), {"days": 365}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["days"] == 365
    assert len(response.data["cells"]) == 365


@pytest.mark.django_db
def test_heatmap_counts_sessions_per_day(authed_client, user):
    bench = ExerciseFactory()
    now = timezone.localtime()
    # Duas sessões hoje
    for _ in range(2):
        s = WorkoutSessionFactory(user=user, started_at=now - timedelta(hours=1))
        SetLogFactory(session=s, exercise=bench)

    response = authed_client.get(
        reverse("workout-session-heatmap"), {"days": 90}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["max_sessions_in_day"] >= 2
    assert response.data["days_with_workout"] >= 1
    today = timezone.localtime().date()
    today_cell = response.data["cells"][-1]
    assert today_cell["date"] == today.isoformat()
    assert today_cell["session_count"] == 2


@pytest.mark.django_db
def test_heatmap_isolated_by_user(authed_client, other_user):
    now = timezone.localtime()
    WorkoutSessionFactory(user=other_user, started_at=now - timedelta(hours=1))

    response = authed_client.get(
        reverse("workout-session-heatmap"), {"days": 90}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["days_with_workout"] == 0
    assert response.data["max_sessions_in_day"] == 0


@pytest.mark.django_db
def test_heatmap_rejects_invalid_days_and_uses_default(authed_client):
    response = authed_client.get(
        reverse("workout-session-heatmap"), {"days": 42}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["days"] == 365


@pytest.mark.django_db
def test_filter_scheduled_workouts_by_day(authed_client, user):
    t1 = WorkoutTemplateFactory(user=user)
    t2 = WorkoutTemplateFactory(user=user)
    ScheduledWorkoutFactory(user=user, template=t1, day_of_week=0)
    ScheduledWorkoutFactory(user=user, template=t2, day_of_week=2)

    response = authed_client.get(reverse("scheduled-workout-list"), {"day_of_week": 2})

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["day_of_week"] == 2
