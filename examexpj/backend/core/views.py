from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Questao
from .serializers import QuestaoSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Simulado
from .services import MotorDeSimulados, GeracaoAleatoriaStrategy
from .serializers import QuestaoSerializer, SimuladoSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class QuestaoListView(generics.ListAPIView):
    queryset = Questao.objects.all()
    serializer_class = QuestaoSerializer
    
    # Essa linha protege a rota: só quem tem o Token JWT consegue ver as questões
    permission_classes = [IsAuthenticated] 

    # Opcional: Filtro rápido para buscar questões por tópico na URL
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