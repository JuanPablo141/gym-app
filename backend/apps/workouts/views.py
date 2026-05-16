from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from .models import WorkoutTemplate, WorkoutSession
from .serializers import WorkoutTemplateSerializer, WorkoutSessionSerializer


class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutTemplate.objects.filter(user=self.request.user)

    def perform_create(self, serializer: WorkoutTemplateSerializer) -> None:
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance: WorkoutTemplate) -> None:
        instance.delete()

    @action(detail=True, methods=["post"], url_path="restore", url_name="restore")
    def restore(self, request: Request, pk=None) -> Response:
        instance = WorkoutTemplate.all_objects.filter(
            pk=pk, user=request.user
        ).first()
        if instance is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        instance.restore()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            WorkoutSession.objects.filter(user=self.request.user)
            .prefetch_related("set_logs__exercise")
            .select_related("template")
        )
