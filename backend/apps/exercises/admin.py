from django.contrib import admin
from .models import Exercise


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ["name", "muscle_group", "created_at"]
    list_filter = ["muscle_group"]
    search_fields = ["name"]
