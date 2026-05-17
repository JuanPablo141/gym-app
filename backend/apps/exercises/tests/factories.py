import factory
from factory.django import DjangoModelFactory
from apps.exercises.models import Exercise, MuscleGroup


class ExerciseFactory(DjangoModelFactory):
    class Meta:
        model = Exercise
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"Exercise {n}")
    muscle_group = MuscleGroup.CHEST
    description = ""
