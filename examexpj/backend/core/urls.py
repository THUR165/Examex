from django.urls import path
from .views import QuestaoListView

urlpatterns = [
    path('questoes/', QuestaoListView.as_view(), name='listar-questoes'),
]