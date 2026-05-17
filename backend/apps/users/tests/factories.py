import factory
from factory.django import DjangoModelFactory, ImageField
from apps.users.models import User, ProgressPhoto


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ("email",)

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "testpass123")
        user = model_class.objects.create_user(password=password, **kwargs)
        return user


class ProgressPhotoFactory(DjangoModelFactory):
    class Meta:
        model = ProgressPhoto

    user = factory.SubFactory(UserFactory)
    image = ImageField(color="blue")
    notes = ""
