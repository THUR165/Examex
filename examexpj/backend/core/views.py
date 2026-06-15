from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Questao, Simulado, Alternativa, RespostaAluno, Usuario, Turma
from .serializers import QuestaoSerializer, SimuladoSerializer, CustomTokenObtainPairSerializer, TurmaSerializer, RespostaPendenteSerializer, SimuladoDetalheSerializer, AlunoSerializer
from .permissions import IsProfessorOrReadOnly
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from .services import MotorDeSimulados, GeracaoAleatoriaStrategy, MontagemManualStrategy

class RespostasPendentesListView(generics.ListAPIView):
    permission_classes = [IsProfessorOrReadOnly]
    serializer_class = RespostaPendenteSerializer

    def get_queryset(self):
        return RespostaAluno.objects.filter(
            questao__tipo='DI',
            nota_atribuida__isnull=True,
            simulado__finalizado=True,
            simulado__turma__professor=self.request.user
        )

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


class TurmaListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TurmaSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_professor:
            return Turma.objects.filter(professor=user)
        return Turma.objects.filter(alunos=user)

    def perform_create(self, serializer):
        serializer.save(professor=self.request.user)

class AlunoListView(generics.ListAPIView):
    permission_classes = [IsProfessorOrReadOnly]
    serializer_class = AlunoSerializer # O serializer que acabámos de criar

    def get_queryset(self):
        # Devolve apenas os utilizadores que são alunos
        return Usuario.objects.filter(is_aluno=True)

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
        tem_discursiva = False # Flag para avisar o aluno que a nota não é definitiva
        
        for questao in simulado.questoes.all():
            soma_pesos_total += questao.peso
            resposta_aluno = respostas_enviadas.get(str(questao.id))
            
            alternativa_marcada = None
            texto_resposta = None
            correta = False
            
            if questao.tipo == 'ME':
                if resposta_aluno:
                    alternativa_marcada = get_object_or_404(Alternativa, pk=int(resposta_aluno), questao=questao)
                    if alternativa_marcada.letra == questao.resposta_correta:
                        correta = True
                        soma_pesos_certas += questao.peso

            elif questao.tipo == 'DI':
                tem_discursiva = True
                texto_resposta = resposta_aluno

            RespostaAluno.objects.create(
                simulado=simulado,
                questao=questao,
                alternativa_marcada=alternativa_marcada,
                texto_resposta=texto_resposta,
                esta_correta=correta
            )
            
        if soma_pesos_total > 0:
            nota_calculada = (soma_pesos_certas / soma_pesos_total) * 10
        else:
            nota_calculada = 0

        simulado.finalizado = True
        simulado.nota_final = nota_calculada
        simulado.save()

        resultado = {
            "mensagem": "Simulado finalizado com sucesso!",
            "nota_final": simulado.nota_final
        }
        
        if tem_discursiva:
            resultado["aviso"] = "Sua prova possui questões discursivas. A sua nota atual é parcial e está aguardando a correção manual do professor."

        return Response(resultado, status=status.HTTP_200_OK)


class CorrigirRespostaView(APIView):
    permission_classes = [IsProfessorOrReadOnly]

    def post(self, request, pk):
        resposta = get_object_or_404(RespostaAluno, pk=pk, simulado__turma__professor=request.user)
        nota_dada = float(request.data.get('nota', 0))
        
        if nota_dada < 0 or nota_dada > resposta.questao.peso:
            return Response({"erro": f"A nota deve estar entre 0 e {resposta.questao.peso}"}, status=status.HTTP_400_BAD_REQUEST)
        
        resposta.nota_atribuida = nota_dada
        resposta.esta_correta = (nota_dada > 0)
        resposta.save()

        simulado = resposta.simulado
        soma_pesos_certas = 0.0
        soma_pesos_total = 0.0
        
        for r in simulado.respostas.all():
            soma_pesos_total += r.questao.peso
            
            if r.questao.tipo == 'ME' and r.esta_correta:
                soma_pesos_certas += r.questao.peso
            elif r.questao.tipo == 'DI' and r.nota_atribuida is not None:
                soma_pesos_certas += r.nota_atribuida # Soma a nota fracionada do professor

        if soma_pesos_total > 0:
            simulado.nota_final = (soma_pesos_certas / soma_pesos_total) * 10
        else:
            simulado.nota_final = 0
        
        simulado.save()

        return Response({"mensagem": "Correção aplicada e nota final da prova recalculada!"}, status=status.HTTP_200_OK)
    
class SimuladoDetalheView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SimuladoDetalheSerializer

    def get_queryset(self):
        return Simulado.objects.filter(aluno=self.request.user)

class EstatisticasProfessorView(APIView):
    permission_classes = [IsProfessorOrReadOnly]

    def get(self, request):
        turmas = Turma.objects.filter(professor=request.user)
        dados = []
        for turma in turmas:
            media = Simulado.objects.filter(turma=turma, finalizado=True).aggregate(Avg('nota_final'))['nota_final__avg']
            dados.append({
                "nome": turma.nome,
                "media": round(media, 2) if media else 0
            })
        return Response(dados)
    
class ExcluirSimuladoAleatorioView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        # Busca o simulado garantindo que é do aluno logado
        simulado = get_object_or_404(Simulado, pk=pk, aluno=request.user)
        
        # Trava de Segurança: Se tiver turma, é prova oficial e não pode apagar!
        if simulado.turma is not None:
            return Response(
                {"erro": "Você não pode excluir provas oficiais do professor."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        simulado.delete()
        return Response({"mensagem": "Simulado de treino excluído com sucesso!"}, status=status.HTTP_204_NO_CONTENT)