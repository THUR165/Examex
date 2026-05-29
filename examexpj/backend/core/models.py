from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. Usuário Customizado (Separação de Perfis)
class Usuario(AbstractUser):
    is_professor = models.BooleanField(default=False)
    is_aluno = models.BooleanField(default=True)

# 2. Estrutura de Matérias (1FN, 2FN, 3FN para evitar duplicidade)
class Disciplina(models.Model):
    nome = models.CharField(max_length=100, unique=True) # Ex: Cálculo I, Estatística

    def __str__(self):
        return self.nome

class Topico(models.Model):
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE, related_name='topicos')
    nome = models.CharField(max_length=100) # Ex: Derivadas Parciais, Probabilidade Condicional

    def __str__(self):
        return f"{self.disciplina.nome} - {self.nome}"

# 3. Componente Base para o Padrão Composite futuro
class Questao(models.Model):
    TIPO_CHOICES = [
        ('ME', 'Múltipla Escolha'),
        ('DI', 'Discursiva/Numérica'),
    ]
    topico = models.ForeignKey(Topico, on_delete=models.PROTECT, related_name='questoes')
    enunciado = models.TextField()
    tipo = models.CharField(max_length=2, choices=TIPO_CHOICES, default='ME')
    resposta_correta = models.CharField(max_length=255) # Texto exato ou letra da alternativa
    peso = models.FloatField(default=1.0)

    def __str__(self):
        return f"[{self.topico.nome}] {self.enunciado[:50]}..."

class Alternativa(models.Model):
    questao = models.ForeignKey(Questao, on_delete=models.CASCADE, related_name='alternativas')
    letra = models.CharField(max_length=1) # A, B, C, D...
    texto = models.TextField()

    def __str__(self):
        return f"{self.letra}) {self.texto[:30]}"