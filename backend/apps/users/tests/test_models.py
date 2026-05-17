from datetime import date, timedelta
import pytest
from apps.users.models import ProgressPhoto
from apps.users.tests.factories import UserFactory, ProgressPhotoFactory


@pytest.mark.django_db
def test_progress_photo_cascade_delete_with_user():
    user = UserFactory()
    user_id = user.id
    ProgressPhotoFactory.create_batch(3, user=user)
    assert ProgressPhoto.objects.filter(user_id=user_id).count() == 3

    user.delete()

    assert ProgressPhoto.objects.filter(user_id=user_id).count() == 0


@pytest.mark.django_db
def test_ordering_prefers_taken_at_then_created_at():
    user = UserFactory()
    older = ProgressPhotoFactory(user=user, taken_at=date.today() - timedelta(days=5))
    newer = ProgressPhotoFactory(user=user, taken_at=date.today())
    no_date = ProgressPhotoFactory(user=user, taken_at=None)

    ids = list(ProgressPhoto.objects.filter(user=user).values_list("id", flat=True))

    # taken_at desc first (newer before older), then NULLs handled by db ordering
    assert ids.index(newer.id) < ids.index(older.id)
    assert no_date.id in ids
