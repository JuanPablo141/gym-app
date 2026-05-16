from __future__ import annotations
from django.contrib.auth.models import UserManager as DjangoUserManager
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import User


class UserManager(DjangoUserManager["User"]):
    """Custom manager: email is the unique identifier, not username."""

    def _create_user(
        self, email: str, password: str | None, **extra_fields
    ) -> "User":
        if not email:
            raise ValueError("The Email field must be set.")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(
        self, email: str, password: str | None = None, **extra_fields
    ) -> "User":
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(
        self, email: str, password: str | None = None, **extra_fields
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create_user(email, password, **extra_fields)
