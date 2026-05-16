from rest_framework import serializers
from .models import Exercise


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = (
            "id", "name", "muscle_group", "description",
            "image", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
