from datetime import timedelta
import factory
from django.utils import timezone
from factory.django import DjangoModelFactory
from apps.users.tests.factories import UserFactory
from apps.exercises.tests.factories import ExerciseFactory
from apps.workouts.models import WorkoutTemplate, WorkoutSession, SetLog


class WorkoutTemplateFactory(DjangoModelFactory):
    class Meta:
        model = WorkoutTemplate

    user = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda n: f"Treino {n}")
    description = ""


class WorkoutSessionFactory(DjangoModelFactory):
    class Meta:
        model = WorkoutSession

    user = factory.SubFactory(UserFactory)
    template = None
    started_at = factory.LazyFunction(lambda: timezone.now() - timedelta(hours=1))
    finished_at = factory.LazyFunction(timezone.now)
    notes = ""


class SetLogFactory(DjangoModelFactory):
    class Meta:
        model = SetLog

    session = factory.SubFactory(WorkoutSessionFactory)
    exercise = factory.SubFactory(ExerciseFactory)
    set_number = 1
    weight_kg = "80.00"
    reps = 8
    rpe = "7.5"
