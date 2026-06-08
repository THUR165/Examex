from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Questao, Simulado
from .serializers import QuestaoSerializer, SimuladoSerializer, CustomTokenObtainPairSerializer
from .permissions import IsProfessorOrReadOnly
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

class MontarProvaManualView(APIView):
    # Apenas professores podem montar provas oficiais
    permission_classes = [IsProfessorOrReadOnly]

    def post(self, request):
        titulo = request.data.get('titulo')
        questoes_ids = request.data.get('questoes_ids', [])

        if not questoes_ids:
            return Response({"erro": "Selecione ao menos uma questão."}, status=status.HTTP_400_BAD_REQUEST)

        # Instancia o motor injetando a nova Estratégia!
        motor = MotorDeSimulados(MontagemManualStrategy())
        
        # Cria a prova
        prova = motor.criar_prova(
            aluno=request.user, 
            titulo=titulo, 
            questoes_ids=questoes_ids
        )

        serializer = SimuladoSerializer(prova)
        return Response(serializer.data, status=status.HTTP_201_CREATED)