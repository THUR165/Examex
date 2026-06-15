from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Questao, Simulado, Alternativa, RespostaAluno, Usuario, Turma
from .serializers import QuestaoSerializer, SimuladoSerializer, CustomTokenObtainPairSerializer, TurmaSerializer
from .permissions import IsProfessorOrReadOnly
from django.shortcuts import get_object_or_404
from .services import MotorDeSimulados, GeracaoAleatoriaStrategy, MontagemManualStrategy

class QuestaoListView(generics.ListCreateAPIView):
    queryset = Questao.objects.all()
    serializer_class = QuestaoSerializer
    permission_classes = [IsProfessorOrReadOnly] 

    def get_queryset(self):
        queryset = super().get_queryset()
        topico_id = self.request.query_params.get('topico')
        if topico_id:
            queryset = queryset.filter(topico_id=topico_id)
        return queryset
    
class GerarSimuladoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        motor = MotorDeSimulados(GeracaoAleatoriaStrategy())
        aluno = request.user
        simulado = motor.criar_prova(aluno=aluno, quantidade_questoes=5)
        serializer = SimuladoSerializer(simulado)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class TurmaListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TurmaSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_professor:
            return Turma.objects.filter(professor=user)
        return Turma.objects.filter(alunos=user)


class MontarProvaManualView(APIView):
    permission_classes = [IsProfessorOrReadOnly]

    def post(self, request):
        titulo = request.data.get('titulo')
        questoes_ids = request.data.get('questoes_ids', [])
        turma_id = request.data.get('turma_id')

        if not questoes_ids:
            return Response({"erro": "Selecione ao menos uma questão."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not turma_id:
            return Response({"erro": "Selecione uma turma para publicar a prova."}, status=status.HTTP_400_BAD_REQUEST)

        turma = get_object_or_404(Turma, pk=turma_id, professor=request.user)

        motor = MotorDeSimulados(MontagemManualStrategy())
        alunos = turma.alunos.all()
        
        for aluno in alunos:
            motor.criar_prova(
                aluno=aluno, 
                titulo=titulo, 
                questoes_ids=questoes_ids,
                turma=turma
            )

        return Response({
            "mensagem": f"Prova distribuída com sucesso para {alunos.count()} alunos da turma {turma.nome}!"
        }, status=status.HTTP_201_CREATED)


class AlunoSimuladosListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SimuladoSerializer

    def get_queryset(self):
        return Simulado.objects.filter(aluno=self.request.user).order_by("-data_criacao")


class FinalizarSimuladoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        simulado = get_object_or_404(Simulado, pk=pk, aluno=request.user)
        
        if simulado.finalizado:
            return Response({"erro": "Este simulado já foi finalizado."}, status=status.HTTP_400_BAD_REQUEST)
            
        respostas_enviadas = request.data.get('respostas', {})
        
        soma_pesos_certas = 0.0
        soma_pesos_total = 0.0
        
        for questao in simulado.questoes.all():
            soma_pesos_total += questao.peso
            
            alternativa_id = respostas_enviadas.get(str(questao.id))
            alternativa_marcada = None
            correta = False
            
            if alternativa_id:
                alternativa_marcada = get_object_or_404(Alternativa, pk=alternativa_id, questao=questao)
                if alternativa_marcada.letra == questao.resposta_correta:
                    correta = True
                    soma_pesos_certas += questao.peso

            RespostaAluno.objects.create(
                simulado=simulado,
                questao=questao,
                alternativa_marcada=alternativa_marcada,
                esta_correta=correta
            )
            
        if soma_pesos_total > 0:
            nota_calculada = (soma_pesos_certas / soma_pesos_total) * 10
        else:
            nota_calculada = 0

        simulado.finalizado = True
        simulado.nota_final = nota_calculada
        simulado.save()

        return Response({
            "mensagem": "Simulado finalizado com sucesso!",
            "nota_final": simulado.nota_final
        }, status=status.HTTP_200_OK)