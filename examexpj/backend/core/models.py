from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. Usuário Customizado (Separação de Perfis)
class Usuario(AbstractUser):
    is_professor = models.BooleanField(default=False)
    is_aluno = models.BooleanField(default=True)

    def __str__(self):
        tipo = "Professor" if self.is_professor else "Aluno"
        return f"{self.username} ({tipo})"


# --- NOVA ENTIDADE DA FASE 1: CONTROLE DE TURMAS ---
class Turma(models.Model):
    nome = models.CharField(max_length=100) # Ex: Banco de Dados I - 2026.1
    codigo = models.CharField(max_length=20, unique=True) # Ex: BDI-20261
    
    # Associa o professor responsável pela gestão da sala
    professor = models.ForeignKey(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name='turmas_como_professor',
        limit_choices_to={'is_professor': True} # Restringe a seleção apenas a professores no painel admin
    )
    
    # Relação ManyToMany para matricular múltiplos alunos na turma
    alunos = models.ManyToManyField(
        Usuario, 
        related_name='turmas_como_aluno', 
        blank=True
    )

    def __str__(self):
        return f"{self.nome} ({self.codigo})"


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
    
class Simulado(models.Model):
    aluno = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='simulados')
    titulo = models.CharField(max_length=200, default="Simulado Gerado")
    data_criacao = models.DateTimeField(auto_now_add=True)
    questoes = models.ManyToManyField(Questao, related_name='simulados_presentes')
    finalizado = models.BooleanField(default=False)
    nota_final = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    

class RespostaAluno(models.Model):
    simulado = models.ForeignKey(Simulado, on_delete=models.CASCADE, related_name='respostas')
    questao = models.ForeignKey(Questao, on_delete=models.CASCADE)
    alternativa_marcada = models.ForeignKey(Alternativa, on_delete=models.CASCADE, null=True, blank=True)
    texto_resposta = models.TextField(null=True, blank=True) # Caso a questão seja discursiva
    esta_correta = models.BooleanField(default=False)

    def __str__(self):
        return f"Resposta de {self.simulado.aluno.username} - Questão {self.questao.id}"