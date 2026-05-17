from decimal import Decimal
import pytest
from apps.workouts.services import suggest_next_load, compute_session_summary
from apps.workouts.models import SetLog
from apps.exercises.tests.factories import ExerciseFactory
from apps.workouts.tests.factories import WorkoutSessionFactory, SetLogFactory


# ---------------------------------------------------------------------------
# suggest_next_load — 7 ramos de decisão
# ---------------------------------------------------------------------------


class FakeSet:
    """Stub leve para evitar hit no banco em testes de função pura."""

    def __init__(self, weight_kg, reps, rpe):
        self.weight_kg = weight_kg
        self.reps = reps
        self.rpe = rpe


def test_suggest_returns_none_when_no_history():
    assert suggest_next_load(None, None) is None


def test_suggest_rpe_low_increases_weight():
    last = FakeSet(Decimal("80"), 8, Decimal("7.0"))
    result = suggest_next_load(last, None)
    assert result["weight_kg"] == Decimal("82.5")
    assert result["reps"] == 8
    assert "RPE baixo" in result["rationale"]


def test_suggest_rpe_moderate_keeps_weight_increases_reps():
    last = FakeSet(Decimal("80"), 8, Decimal("8.5"))
    result = suggest_next_load(last, None)
    assert result["weight_kg"] == Decimal("80")
    assert result["reps"] == 9
    assert "RPE moderado" in result["rationale"]


def test_suggest_rpe_high_decreases_weight():
    last = FakeSet(Decimal("80"), 8, Decimal("9.5"))
    result = suggest_next_load(last, None)
    assert result["weight_kg"] == Decimal("77.5")
    assert result["reps"] == 8
    assert "RPE muito alto" in result["rationale"]


def test_suggest_no_rpe_progressed_vs_previous():
    last = FakeSet(Decimal("80"), 8, None)
    prev = FakeSet(Decimal("75"), 8, None)
    result = suggest_next_load(last, prev)
    assert result["weight_kg"] == Decimal("82.5")
    assert "Progrediu" in result["rationale"]


def test_suggest_no_rpe_hit_reps_at_same_weight():
    last = FakeSet(Decimal("80"), 8, None)
    prev = FakeSet(Decimal("80"), 8, None)
    result = suggest_next_load(last, prev)
    assert result["weight_kg"] == Decimal("82.5")
    assert "Bateu os reps" in result["rationale"]


def test_suggest_no_rpe_stalled():
    last = FakeSet(Decimal("80"), 6, None)
    prev = FakeSet(Decimal("80"), 8, None)
    result = suggest_next_load(last, prev)
    assert result["weight_kg"] == Decimal("80")
    assert result["reps"] == 6


def test_suggest_bodyweight_exercise_increases_reps():
    last = FakeSet(None, 10, Decimal("8.0"))
    result = suggest_next_load(last, None)
    assert result["weight_kg"] is None
    assert result["reps"] == 11
    assert "peso corporal" in result["rationale"]


# ---------------------------------------------------------------------------
# compute_session_summary
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_summary_empty_session_returns_zeros():
    session = WorkoutSessionFactory()

    summary = compute_session_summary(session)

    assert summary["total_volume_kg"] == Decimal("0")
    assert summary["total_sets"] == 0
    assert summary["exercises"] == []
    assert summary["muscle_groups_trained"] == []
    assert summary["new_prs_count"] == 0


@pytest.mark.django_db
def test_summary_aggregates_single_exercise():
    session = WorkoutSessionFactory()
    bench = ExerciseFactory(name="Bench")
    SetLogFactory(session=session, exercise=bench, set_number=1, weight_kg=Decimal("80"), reps=8, rpe=Decimal("7"))
    SetLogFactory(session=session, exercise=bench, set_number=2, weight_kg=Decimal("82.5"), reps=6, rpe=Decimal("8.5"))

    summary = compute_session_summary(session)

    assert summary["total_volume_kg"] == Decimal("80") * 8 + Decimal("82.5") * 6
    assert summary["total_sets"] == 2
    assert len(summary["exercises"]) == 1
    ex = summary["exercises"][0]
    assert ex["sets_count"] == 2
    assert ex["top_set"]["weight_kg"] == Decimal("82.5")
    assert ex["top_set"]["reps"] == 6


@pytest.mark.django_db
def test_summary_detects_new_pr_on_first_session():
    session = WorkoutSessionFactory()
    bench = ExerciseFactory(name="Bench")
    SetLogFactory(session=session, exercise=bench, weight_kg=Decimal("80"), reps=5)

    summary = compute_session_summary(session)

    assert summary["new_prs_count"] == 1
    assert summary["exercises"][0]["is_new_pr"] is True


@pytest.mark.django_db
def test_summary_no_pr_when_older_session_lifted_more():
    user = WorkoutSessionFactory().user
    bench = ExerciseFactory(name="Bench")

    # Sessão antiga com peso maior
    old_session = WorkoutSessionFactory(user=user)
    SetLogFactory(session=old_session, exercise=bench, weight_kg=Decimal("100"), reps=5)

    # Sessão atual com peso menor → não é PR
    new_session = WorkoutSessionFactory(user=user)
    SetLogFactory(session=new_session, exercise=bench, weight_kg=Decimal("90"), reps=5)

    summary = compute_session_summary(new_session)

    assert summary["new_prs_count"] == 0
    assert summary["exercises"][0]["is_new_pr"] is False


@pytest.mark.django_db
def test_summary_bodyweight_never_counts_as_pr():
    session = WorkoutSessionFactory()
    pullup = ExerciseFactory(name="Pull-up")
    SetLogFactory(session=session, exercise=pullup, weight_kg=None, reps=10, rpe=None)

    summary = compute_session_summary(session)

    assert summary["exercises"][0]["is_new_pr"] is False
    assert summary["new_prs_count"] == 0


@pytest.mark.django_db
def test_summary_muscle_groups_are_unique_and_sorted():
    from apps.exercises.models import MuscleGroup
    session = WorkoutSessionFactory()
    bench = ExerciseFactory(name="Bench", muscle_group=MuscleGroup.CHEST)
    rows = ExerciseFactory(name="Row", muscle_group=MuscleGroup.BACK)
    fly = ExerciseFactory(name="Fly", muscle_group=MuscleGroup.CHEST)

    SetLogFactory(session=session, exercise=bench)
    SetLogFactory(session=session, exercise=rows)
    SetLogFactory(session=session, exercise=fly)

    summary = compute_session_summary(session)

    assert summary["muscle_groups_trained"] == ["back", "chest"]
