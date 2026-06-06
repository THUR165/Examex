from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Questao, Topico, Disciplina, Simulado, Alternativa

class DisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = ['id', 'nome']

class TopicoSerializer(serializers.ModelSerializer):
    disciplina = DisciplinaSerializer(read_only=True)

    class Meta:
        model = Topico
        fields = ['id', 'nome', 'disciplina']

# 1. Movido para cima! O Python agora lê isso aqui primeiro.
class AlternativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alternativa
        # Usando os campos exatos do seu model
        fields = ['id', 'letra', 'texto']

# 2. Agora o QuestaoSerializer pode usar o AlternativaSerializer sem problemas.
class QuestaoSerializer(serializers.ModelSerializer):
    # O nome da variável é igual ao related_name do seu models.py
    alternativas = AlternativaSerializer(many=True)

    class Meta:
        model = Questao
        # Adicionamos o 'resposta_correta' aqui!
        fields = ['id', 'enunciado', 'topico', 'tipo', 'peso', 'resposta_correta', 'alternativas']

    def create(self, validated_data):
        alternativas_data = validated_data.pop('alternativas', [])
        questao = Questao.objects.create(**validated_data)
        
        for alt_data in alternativas_data:
            Alternativa.objects.create(questao=questao, **alt_data) 
            
        return questao

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