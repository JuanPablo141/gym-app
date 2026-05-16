from django.contrib import admin
from .models import WorkoutTemplate, WorkoutSession, SetLog


class SetLogInline(admin.TabularInline):
    model = SetLog
    extra = 0
    readonly_fields = ["id", "created_at"]


@admin.register(WorkoutTemplate)
class WorkoutTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "is_deleted", "deleted_at", "created_at"]
    list_filter = ["deleted_at"]
    search_fields = ["name", "user__email"]

    def get_queryset(self, request):
        return WorkoutTemplate.all_objects.all()


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "template", "started_at", "finished_at"]
    list_filter = ["started_at"]
    inlines = [SetLogInline]


@admin.register(SetLog)
class SetLogAdmin(admin.ModelAdmin):
    list_display = ["session", "exercise", "set_number", "weight_kg", "reps", "rpe"]
