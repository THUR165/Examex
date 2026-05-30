from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Questao
from .serializers import QuestaoSerializer

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