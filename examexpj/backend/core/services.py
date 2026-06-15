import random
from abc import ABC, abstractmethod
from .models import Questao, Simulado

class GeracaoSimuladoStrategy(ABC):
    @abstractmethod
    def gerar(self, aluno, **kwargs):
        pass

class GeracaoAleatoriaStrategy(GeracaoSimuladoStrategy):
    def gerar(self, aluno, quantidade_questoes=5, **kwargs):
        todas_questoes = list(Questao.objects.filter(is_publica=True))
        
        if len(todas_questoes) < quantidade_questoes:
            questoes_sorteadas = todas_questoes
        else:
            questoes_sorteadas = random.sample(todas_questoes, quantidade_questoes)

        simulado = Simulado.objects.create(
            aluno=aluno,
            titulo=f"Simulado Aleatório - {len(questoes_sorteadas)} Questões"
        )
        simulado.questoes.set(questoes_sorteadas)
        return simulado

class MontagemManualStrategy(GeracaoSimuladoStrategy):
    def gerar(self, aluno, **kwargs):
        questoes_ids = kwargs.get('questoes_ids', [])
        titulo = kwargs.get('titulo', "Prova Oficial")
        turma = kwargs.get('turma')

        questoes = Questao.objects.filter(id__in=questoes_ids)

        simulado = Simulado.objects.create(
            aluno=aluno,
            titulo=titulo,
            turma=turma
        )

        simulado.questoes.set(questoes)
        return simulado

class MotorDeSimulados:
    def __init__(self, strategy: GeracaoSimuladoStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: GeracaoSimuladoStrategy):
        self._strategy = strategy

    def criar_prova(self, aluno, **kwargs):
        return self._strategy.gerar(aluno, **kwargs)