from __future__ import annotations
from decimal import Decimal
from typing import Any
from .models import SetLog

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
