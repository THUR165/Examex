from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Questao, Topico, Disciplina, Simulado

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

class SimuladoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Simulado
        fields = ['id', 'titulo', 'data_criacao', 'finalizado', 'nota_final', 'questoes']
        depth = 1

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['is_professor'] = self.user.is_professor
        data['username'] = self.user.username
        
        return data