from django.urls import path
from .views import QuestaoListView, GerarSimuladoView, MontarProvaManualView

urlpatterns = [
    path('questoes/', QuestaoListView.as_view(), name='listar-questoes'),
    path('simulados/gerar/', GerarSimuladoView.as_view(), name='gerar_simulado'),
    path('provas/montar/', MontarProvaManualView.as_view(), name='montar_prova_manual'),
]