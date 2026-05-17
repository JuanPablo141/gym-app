import pytest
from django.urls import reverse
from rest_framework import status
from apps.users.models import User


@pytest.mark.django_db
def test_register_creates_user(api_client):
    payload = {"email": "new@example.com", "password": "strongpass123"}

    response = api_client.post(reverse("user-register"), data=payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.filter(email="new@example.com").exists()


@pytest.mark.django_db
def test_me_endpoint_returns_authenticated_user(authed_client, user):
    response = authed_client.get(reverse("user-me"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["email"] == user.email


@pytest.mark.django_db
def test_me_endpoint_returns_401_without_auth(api_client):
    response = api_client.get(reverse("user-me"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_jwt_token_obtain_with_valid_credentials(api_client, user):
    # UserFactory uses password='testpass123'
    response = api_client.post(
        reverse("token_obtain_pair"),
        data={"email": user.email, "password": "testpass123"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_jwt_token_obtain_with_invalid_credentials_returns_401(api_client, user):
    response = api_client.post(
        reverse("token_obtain_pair"),
        data={"email": user.email, "password": "wrong"},
        format="json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
