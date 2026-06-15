from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Questao, Topico, Disciplina, Simulado, Alternativa, Turma, RespostaAluno

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
    alternativas = AlternativaSerializer(many=True)

    class Meta:
        model = Questao
        fields = ['id', 'enunciado', 'topico', 'tipo', 'peso', 'resposta_correta', 'is_publica', 'alternativas']

    def create(self, validated_data):
        alternativas_data = validated_data.pop('alternativas', [])
        questao = Questao.objects.create(**validated_data)
        
        for alt_data in alternativas_data:
            Alternativa.objects.create(questao=questao, **alt_data) 
            
        return questao

class SimuladoSerializer(serializers.ModelSerializer):
    questoes = QuestaoSerializer(many=True, read_only=True) 

    class Meta:
        model = Simulado
        fields = ['id', 'titulo', 'data_criacao', 'finalizado', 'nota_final', 'questoes']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['is_professor'] = self.user.is_professor
        data['username'] = self.user.username
        return data

class TurmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turma
        fields = ['id', 'nome', 'codigo']


class RespostaPendenteSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source='simulado.aluno.username', read_only=True)
    simulado_titulo = serializers.CharField(source='simulado.titulo', read_only=True)
    questao_enunciado = serializers.CharField(source='questao.enunciado', read_only=True)
    questao_gabarito = serializers.CharField(source='questao.resposta_correta', read_only=True)
    peso_maximo = serializers.FloatField(source='questao.peso', read_only=True)

    class Meta:
        model = RespostaAluno
        fields = [
            'id', 'aluno_nome', 'simulado_titulo', 
            'questao_enunciado', 'questao_gabarito', 
            'peso_maximo', 'texto_resposta'
        ]