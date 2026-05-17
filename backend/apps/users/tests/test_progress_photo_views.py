import io
import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from apps.users.models import ProgressPhoto
from apps.users.tests.factories import ProgressPhotoFactory


def _make_image_file(name: str = "test.png") -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/png")


@pytest.mark.django_db
def test_upload_progress_photo_returns_201(authed_client, user):
    payload = {
        "image": _make_image_file(),
        "taken_at": "2026-05-17",
        "notes": "Primeira foto",
    }

    response = authed_client.post(
        reverse("progress-photo-list"), data=payload, format="multipart"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert ProgressPhoto.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_list_only_returns_own_photos(authed_client, user, other_user):
    ProgressPhotoFactory.create_batch(2, user=user)
    ProgressPhotoFactory.create_batch(3, user=other_user)

    response = authed_client.get(reverse("progress-photo-list"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 2


@pytest.mark.django_db
def test_get_other_users_photo_returns_404(authed_client, other_user):
    foreign = ProgressPhotoFactory(user=other_user)

    url = reverse("progress-photo-detail", kwargs={"pk": foreign.id})
    response = authed_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_delete_own_photo(authed_client, user):
    photo = ProgressPhotoFactory(user=user)

    url = reverse("progress-photo-detail", kwargs={"pk": photo.id})
    response = authed_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not ProgressPhoto.objects.filter(id=photo.id).exists()


@pytest.mark.django_db
def test_unauthenticated_returns_401(api_client):
    response = api_client.get(reverse("progress-photo-list"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
