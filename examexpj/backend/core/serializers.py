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

class QuestaoSerializer(serializers.ModelSerializer):
    alternativas = AlternativaSerializer(many=True, source='alternativa_set')

    class Meta:
        model = Questao
        fields = ['id', 'enunciado', 'topico', 'tipo', 'peso', 'alternativas']

    def create(self, validated_data):
        alternativas_data = validated_data.pop('alternativa_set', [])
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
    
class AlternativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alternativa
        # Não incluímos 'questao' aqui porque ela será preenchida automaticamente
        fields = ['id', 'texto', 'is_correta']