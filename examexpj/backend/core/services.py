import random
from abc import ABC, abstractmethod
from .models import Questao, Simulado

class GeracaoSimuladoStrategy(ABC):
    @abstractmethod
    def gerar(self, aluno, quantidade_questoes):
        pass

class GeracaoAleatoriaStrategy(GeracaoSimuladoStrategy):
    def gerar(self, aluno, quantidade_questoes=5):
        todas_questoes = list(Questao.objects.all())
        
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

class MotorDeSimulados:
    def __init__(self, strategy: GeracaoSimuladoStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: GeracaoSimuladoStrategy):
        self._strategy = strategy

    def criar_prova(self, aluno, quantidade_questoes):
        return self._strategy.gerar(aluno, quantidade_questoes)