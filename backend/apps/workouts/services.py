from __future__ import annotations
from datetime import timedelta
from decimal import Decimal
from typing import Any
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Max, Prefetch, Sum
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.utils import timezone
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


def compute_volume_trend(user, exercise, limit: int) -> dict[str, Any]:
    """
    Returns the user's last N sessions that included `exercise`, with volume
    (sum of weight_kg × reps) and top weight per session. Points are ordered
    chronologically (oldest first) so the mobile chart renders left-to-right.
    """
    sessions = list(
        WorkoutSession.objects.filter(user=user, set_logs__exercise=exercise)
        .distinct()
        .order_by("-started_at")
        .prefetch_related(
            Prefetch(
                "set_logs",
                queryset=SetLog.objects.filter(exercise=exercise).order_by("set_number"),
                to_attr="exercise_sets",
            )
        )[:limit]
    )

    points: list[dict[str, Any]] = []
    for session in sessions:
        sets: list[SetLog] = session.exercise_sets  # type: ignore[attr-defined]
        volume = sum(
            (s.weight_kg * s.reps for s in sets if s.weight_kg is not None),
            Decimal("0"),
        )
        top = max(
            sets,
            key=lambda s: (s.weight_kg or Decimal("0"), s.reps),
            default=None,
        )
        points.append({
            "date": session.started_at,
            "session_id": session.id,
            "volume_kg": volume,
            "top_weight_kg": top.weight_kg if top else None,
            "sets_count": len(sets),
        })

    points.reverse()  # mais antigo → mais recente

    return {"exercise_id": exercise.id, "points": points}


def _longest_streak_weeks(user) -> int:
    """
    Returns the longest run of consecutive ISO weeks (Monday-starting) in
    which the user logged at least one workout session. Considers the user's
    entire history.
    """
    timestamps = list(
        WorkoutSession.objects.filter(user=user).values_list("started_at", flat=True)
    )
    if not timestamps:
        return 0

    weeks_with_workout: set = set()
    for ts in timestamps:
        local = timezone.localtime(ts)
        monday = (local - timedelta(days=local.weekday())).date()
        weeks_with_workout.add(monday)

    sorted_weeks = sorted(weeks_with_workout)
    longest = current = 1
    for i in range(1, len(sorted_weeks)):
        if (sorted_weeks[i] - sorted_weeks[i - 1]).days == 7:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    return longest


def compute_workout_heatmap(user, days: int) -> dict[str, Any]:
    """
    Returns one cell per day for the last `days` days (inclusive of today).
    Each cell has the date and the number of sessions logged that day,
    filling missing days with 0 so the client receives a fixed-size grid.
    """
    now_local = timezone.localtime()
    today = now_local.date()
    start_date = today - timedelta(days=days - 1)
    cutoff_dt = now_local.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(
        days=days - 1
    )

    counts_rows = (
        WorkoutSession.objects.filter(user=user, started_at__gte=cutoff_dt)
        .annotate(day=TruncDay("started_at"))
        .values("day")
        .annotate(session_count=Count("id"))
    )
    counts_map = {row["day"].date(): row["session_count"] for row in counts_rows}

    cells: list[dict[str, Any]] = []
    max_sessions = 0
    days_with_workout = 0
    for offset in range(days):
        d = start_date + timedelta(days=offset)
        count = counts_map.get(d, 0)
        cells.append({"date": d, "session_count": count})
        if count > 0:
            days_with_workout += 1
            if count > max_sessions:
                max_sessions = count

    return {
        "days": days,
        "start_date": start_date,
        "end_date": today,
        "max_sessions_in_day": max_sessions,
        "days_with_workout": days_with_workout,
        "cells": cells,
    }


def compute_activity_stats(user, days: int) -> dict[str, Any]:
    """
    Aggregates the user's workout activity over the last `days` days. Picks
    bucket granularity (day/week/month) adaptively based on the period so the
    chart stays readable. Returns summary metrics plus per-bucket counts and
    volume.
    """
    now_local = timezone.localtime()
    today = now_local.date()
    cutoff_date = today - timedelta(days=days - 1)
    cutoff_dt = now_local.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(
        days=days - 1
    )

    sessions_qs = WorkoutSession.objects.filter(user=user, started_at__gte=cutoff_dt)
    total_sessions = sessions_qs.count()

    total_volume = (
        SetLog.objects.filter(
            session__user=user,
            session__started_at__gte=cutoff_dt,
            weight_kg__isnull=False,
        ).aggregate(
            total=Sum(
                ExpressionWrapper(
                    F("weight_kg") * F("reps"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )["total"]
        or Decimal("0")
    )

    avg_sessions_per_week = round(total_sessions / (days / 7), 1) if days > 0 else 0.0

    if days <= 30:
        granularity = "day"
        trunc, sql_trunc = TruncDay, TruncDay
        step = timedelta(days=1)
        bucket_count = days
        first_bucket = cutoff_date
    elif days <= 180:
        granularity = "week"
        trunc, sql_trunc = TruncWeek, TruncWeek
        step = timedelta(weeks=1)
        this_monday = today - timedelta(days=today.weekday())
        first_monday = this_monday - timedelta(weeks=(days - 1) // 7)
        first_bucket = first_monday
        bucket_count = ((this_monday - first_monday).days // 7) + 1
    else:
        granularity = "month"
        trunc, sql_trunc = TruncMonth, TruncMonth
        step = None  # months têm tamanho variável; gerado manualmente
        first_bucket = cutoff_date.replace(day=1)
        bucket_count = (today.year - first_bucket.year) * 12 + (today.month - first_bucket.month) + 1

    counts_rows = (
        sessions_qs
        .annotate(bucket=sql_trunc("started_at"))
        .values("bucket")
        .annotate(session_count=Count("id"))
    )
    counts_map = {row["bucket"].date(): row["session_count"] for row in counts_rows}

    volume_rows = (
        SetLog.objects.filter(
            session__user=user,
            session__started_at__gte=cutoff_dt,
            weight_kg__isnull=False,
        )
        .annotate(bucket=sql_trunc("session__started_at"))
        .values("bucket")
        .annotate(
            volume=Sum(
                ExpressionWrapper(
                    F("weight_kg") * F("reps"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )
    )
    volume_map = {row["bucket"].date(): (row["volume"] or Decimal("0")) for row in volume_rows}

    buckets: list[dict[str, Any]] = []
    cursor = first_bucket
    for _ in range(bucket_count):
        buckets.append({
            "bucket_start": cursor,
            "session_count": counts_map.get(cursor, 0),
            "total_volume_kg": volume_map.get(cursor, Decimal("0")),
        })
        if granularity == "month":
            year, month = cursor.year, cursor.month
            if month == 12:
                cursor = cursor.replace(year=year + 1, month=1)
            else:
                cursor = cursor.replace(month=month + 1)
        else:
            cursor = cursor + step

    templates_rows = (
        sessions_qs
        .values("template_id", "template__name")
        .annotate(session_count=Count("id"))
        .order_by("-session_count")
    )
    templates_breakdown = [
        {
            "template_id": row["template_id"],
            "template_name": row["template__name"],
            "session_count": row["session_count"],
        }
        for row in templates_rows
    ]

    return {
        "days": days,
        "granularity": granularity,
        "total_sessions": total_sessions,
        "total_volume_kg": total_volume,
        "avg_sessions_per_week": avg_sessions_per_week,
        "longest_streak_weeks": _longest_streak_weeks(user),
        "buckets": buckets,
        "templates_breakdown": templates_breakdown,
    }
