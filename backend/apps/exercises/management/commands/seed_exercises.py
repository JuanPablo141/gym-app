from django.core.management.base import BaseCommand
from apps.exercises.models import Exercise, MuscleGroup

EXERCISES: list[dict[str, str]] = [
    # Chest
    {"name": "Bench Press", "muscle_group": MuscleGroup.CHEST},
    {"name": "Incline Bench Press", "muscle_group": MuscleGroup.CHEST},
    {"name": "Decline Bench Press", "muscle_group": MuscleGroup.CHEST},
    {"name": "Cable Fly", "muscle_group": MuscleGroup.CHEST},
    {"name": "Push-Up", "muscle_group": MuscleGroup.CHEST},
    {"name": "Dumbbell Fly", "muscle_group": MuscleGroup.CHEST},
    # Back
    {"name": "Pull-Up", "muscle_group": MuscleGroup.BACK},
    {"name": "Lat Pulldown", "muscle_group": MuscleGroup.BACK},
    {"name": "Seated Cable Row", "muscle_group": MuscleGroup.BACK},
    {"name": "Bent-Over Row", "muscle_group": MuscleGroup.BACK},
    {"name": "T-Bar Row", "muscle_group": MuscleGroup.BACK},
    {"name": "Face Pull", "muscle_group": MuscleGroup.BACK},
    # Shoulders
    {"name": "Overhead Press", "muscle_group": MuscleGroup.SHOULDERS},
    {"name": "Lateral Raise", "muscle_group": MuscleGroup.SHOULDERS},
    {"name": "Front Raise", "muscle_group": MuscleGroup.SHOULDERS},
    {"name": "Reverse Fly", "muscle_group": MuscleGroup.SHOULDERS},
    {"name": "Arnold Press", "muscle_group": MuscleGroup.SHOULDERS},
    # Biceps
    {"name": "Barbell Curl", "muscle_group": MuscleGroup.BICEPS},
    {"name": "Dumbbell Curl", "muscle_group": MuscleGroup.BICEPS},
    {"name": "Hammer Curl", "muscle_group": MuscleGroup.BICEPS},
    {"name": "Concentration Curl", "muscle_group": MuscleGroup.BICEPS},
    {"name": "Preacher Curl", "muscle_group": MuscleGroup.BICEPS},
    # Triceps
    {"name": "Triceps Pushdown", "muscle_group": MuscleGroup.TRICEPS},
    {"name": "Skull Crusher", "muscle_group": MuscleGroup.TRICEPS},
    {"name": "Overhead Triceps Extension", "muscle_group": MuscleGroup.TRICEPS},
    {"name": "Close-Grip Bench Press", "muscle_group": MuscleGroup.TRICEPS},
    {"name": "Dips", "muscle_group": MuscleGroup.TRICEPS},
    # Legs
    {"name": "Squat", "muscle_group": MuscleGroup.LEGS},
    {"name": "Leg Press", "muscle_group": MuscleGroup.LEGS},
    {"name": "Romanian Deadlift", "muscle_group": MuscleGroup.LEGS},
    {"name": "Leg Extension", "muscle_group": MuscleGroup.LEGS},
    {"name": "Leg Curl", "muscle_group": MuscleGroup.LEGS},
    {"name": "Calf Raise", "muscle_group": MuscleGroup.LEGS},
    # Glutes
    {"name": "Hip Thrust", "muscle_group": MuscleGroup.GLUTES},
    {"name": "Glute Bridge", "muscle_group": MuscleGroup.GLUTES},
    {"name": "Cable Kickback", "muscle_group": MuscleGroup.GLUTES},
    {"name": "Bulgarian Split Squat", "muscle_group": MuscleGroup.GLUTES},
    # Core
    {"name": "Plank", "muscle_group": MuscleGroup.CORE},
    {"name": "Crunch", "muscle_group": MuscleGroup.CORE},
    {"name": "Leg Raise", "muscle_group": MuscleGroup.CORE},
    {"name": "Russian Twist", "muscle_group": MuscleGroup.CORE},
    {"name": "Dead Bug", "muscle_group": MuscleGroup.CORE},
    # Cardio
    {"name": "Running", "muscle_group": MuscleGroup.CARDIO},
    {"name": "Rowing Machine", "muscle_group": MuscleGroup.CARDIO},
    {"name": "Jump Rope", "muscle_group": MuscleGroup.CARDIO},
    {"name": "Cycling", "muscle_group": MuscleGroup.CARDIO},
    # Full Body
    {"name": "Deadlift", "muscle_group": MuscleGroup.FULL_BODY},
    {"name": "Burpee", "muscle_group": MuscleGroup.FULL_BODY},
    {"name": "Clean and Press", "muscle_group": MuscleGroup.FULL_BODY},
    {"name": "Kettlebell Swing", "muscle_group": MuscleGroup.FULL_BODY},
]


class Command(BaseCommand):
    help = "Seeds the database with a base exercise catalog."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing exercises before seeding.",
        )

    def handle(self, *args, **options) -> None:
        if options["clear"]:
            count, _ = Exercise.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {count} existing exercises."))

        created_count = 0
        skipped_count = 0

        for data in EXERCISES:
            _, created = Exercise.objects.get_or_create(
                name=data["name"],
                defaults={"muscle_group": data["muscle_group"]},
            )
            if created:
                self.stdout.write(f"  Created  → {data['name']}")
                created_count += 1
            else:
                self.stdout.write(f"  Exists   → {data['name']}")
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_count} created, {skipped_count} already existed."
            )
        )
