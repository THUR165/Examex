from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Questao, Simulado
from .serializers import QuestaoSerializer, SimuladoSerializer, CustomTokenObtainPairSerializer
from .services import MotorDeSimulados, GeracaoAleatoriaStrategy
from .permissions import IsProfessorOrReadOnly

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