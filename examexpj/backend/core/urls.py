from django.urls import path
from .views import QuestaoListView
from .views import GerarSimuladoView

urlpatterns = [
    path('questoes/', QuestaoListView.as_view(), name='listar-questoes'),
    path('simulados/gerar/', GerarSimuladoView.as_view(), name='gerar_simulado'),
]