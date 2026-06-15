from django.urls import path
from .views import (
    QuestaoListView, GerarSimuladoView, MontarProvaManualView,
    AlunoSimuladosListView, FinalizarSimuladoView, TurmaListView, RespostasPendentesListView, CorrigirRespostaView
)

urlpatterns = [
    path('questoes/', QuestaoListView.as_view(), name='listar-questoes'),
    path('simulados/gerar/', GerarSimuladoView.as_view(), name='gerar_simulado'),
    path('provas/montar/', MontarProvaManualView.as_view(), name='montar_prova_manual'),
    path('simulados/', AlunoSimuladosListView.as_view(), name='aluno_listar_simulados'),
    path('simulados/<int:pk>/finalizar/', FinalizarSimuladoView.as_view(), name='finalizar_simulado'),
    path('turmas/', TurmaListView.as_view(), name='listar_turmas'),
    path('correcoes/pendentes/', RespostasPendentesListView.as_view(), name='listar_correcoes_pendentes'),
    path('correcoes/<int:pk>/salvar/', CorrigirRespostaView.as_view(), name='salvar_correcao'),
]