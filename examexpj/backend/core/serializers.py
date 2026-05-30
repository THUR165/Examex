from rest_framework import serializers
from .models import Questao, Topico, Disciplina

class DisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = ['id', 'nome']

class TopicoSerializer(serializers.ModelSerializer):
    disciplina = DisciplinaSerializer(read_only=True)

    class Meta:
        model = Topico
        fields = ['id', 'nome', 'disciplina']

class QuestaoSerializer(serializers.ModelSerializer):
    # Opcional: traz os dados do tópico aninhados na resposta
    topico = TopicoSerializer(read_only=True) 

    class Meta:
        model = Questao
        fields = ['id', 'topico', 'enunciado', 'tipo', 'resposta_correta', 'peso']