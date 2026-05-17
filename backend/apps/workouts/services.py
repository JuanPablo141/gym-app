from __future__ import annotations
from decimal import Decimal
from typing import Any
from django.db.models import Max
from .models import SetLog, WorkoutSession

WEIGHT_INCREMENT_KG = Decimal("2.5")
RPE_LOW_THRESHOLD = Decimal("7.0")
RPE_HIGH_THRESHOLD = Decimal("9.5")


def suggest_next_load(
    last_top_set: SetLog | None,
    prev_top_set: SetLog | None,
) -> dict[str, Any] | None:
    """
    Pure function: given the user's last top set (and optionally the one before),
    returns a suggestion for the next training session.

    Returns None when there's no history to base a suggestion on.
    """
    if last_top_set is None:
        return None

    weight = last_top_set.weight_kg
    reps = last_top_set.reps
    rpe = last_top_set.rpe

    if weight is None:
        return {
            "weight_kg": None,
            "reps": reps + 1,
            "rationale": "Exercício de peso corporal. Tente +1 rep.",
        }

    if rpe is not None:
        if rpe <= RPE_LOW_THRESHOLD:
            return {
                "weight_kg": weight + WEIGHT_INCREMENT_KG,
                "reps": reps,
                "rationale": f"Última série com RPE baixo ({rpe}). Aumente {WEIGHT_INCREMENT_KG}kg.",
            }
        if rpe >= RPE_HIGH_THRESHOLD:
            return {
                "weight_kg": weight - WEIGHT_INCREMENT_KG,
                "reps": reps,
                "rationale": f"Última série com RPE muito alto ({rpe}). Reduza {WEIGHT_INCREMENT_KG}kg.",
            }
        return {
            "weight_kg": weight,
            "reps": reps + 1,
            "rationale": f"Última série com RPE moderado ({rpe}). Mantenha o peso e busque +1 rep.",
        }

    # No RPE — fallback to comparing with previous session
    if prev_top_set is None or prev_top_set.weight_kg is None or prev_top_set.weight_kg < weight:
        return {
            "weight_kg": weight + WEIGHT_INCREMENT_KG,
            "reps": reps,
            "rationale": f"Progrediu na última sessão. Continue subindo {WEIGHT_INCREMENT_KG}kg.",
        }
    if prev_top_set.weight_kg == weight and reps >= prev_top_set.reps:
        return {
            "weight_kg": weight + WEIGHT_INCREMENT_KG,
            "reps": reps,
            "rationale": f"Bateu os reps anteriores. Aumente {WEIGHT_INCREMENT_KG}kg.",
        }
    return {
        "weight_kg": weight,
        "reps": reps,
        "rationale": "Mantenha o peso e tente bater os reps anteriores.",
    }


def compute_session_summary(session: WorkoutSession) -> dict[str, Any]:
    """
    Aggregates metrics for a completed workout session: total volume, sets,
    per-exercise breakdown (with top set and new-PR detection), and the list
    of muscle groups trained.

    Assumes session.set_logs is prefetched with related exercise.
    """
    grouped: dict[Any, dict[str, Any]] = {}
    for set_log in session.set_logs.all():
        bucket = grouped.setdefault(
            set_log.exercise_id,
            {"exercise": set_log.exercise, "sets": []},
        )
        bucket["sets"].append(set_log)

    exercises_out: list[dict[str, Any]] = []
    total_volume = Decimal("0")
    total_sets = 0
    muscle_groups: set[str] = set()
    new_prs_count = 0

    for bucket in grouped.values():
        exercise = bucket["exercise"]
        sets: list[SetLog] = bucket["sets"]

        volume_kg = sum(
            (s.weight_kg * s.reps for s in sets if s.weight_kg is not None),
            Decimal("0"),
        )
        top_set = max(sets, key=lambda s: (s.weight_kg or Decimal("0"), s.reps))

        is_new_pr = False
        if top_set.weight_kg is not None:
            prev_max = (
                SetLog.objects.filter(
                    session__user=session.user,
                    exercise=exercise,
                    weight_kg__isnull=False,
                )
                .exclude(session=session)
                .aggregate(Max("weight_kg"))["weight_kg__max"]
            )
            is_new_pr = prev_max is None or top_set.weight_kg > prev_max

        if is_new_pr:
            new_prs_count += 1

        muscle_groups.add(exercise.muscle_group)
        total_volume += volume_kg
        total_sets += len(sets)

        exercises_out.append({
            "exercise_id": exercise.id,
            "exercise_name": exercise.name,
            "muscle_group": exercise.muscle_group,
            "sets_count": len(sets),
            "volume_kg": volume_kg,
            "top_set": {
                "weight_kg": top_set.weight_kg,
                "reps": top_set.reps,
                "rpe": top_set.rpe,
            },
            "is_new_pr": is_new_pr,
        })

    return {
        "session_id": session.id,
        "started_at": session.started_at,
        "finished_at": session.finished_at,
        "duration_minutes": session.duration_minutes,
        "total_volume_kg": total_volume,
        "total_sets": total_sets,
        "exercises": exercises_out,
        "muscle_groups_trained": sorted(muscle_groups),
        "new_prs_count": new_prs_count,
    }
