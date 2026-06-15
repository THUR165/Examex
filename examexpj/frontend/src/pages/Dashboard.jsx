import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
    const navigate = useNavigate();
    
    const [simulados, setSimulados] = useState([]);
    const [simuladoAtivo, setSimuladoAtivo] = useState(null);
    const [respostas, setRespostas] = useState({});

    const fetchSimulados = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('simulados/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSimulados(response.data);
        } catch (error) {
            console.error("Erro ao buscar simulados:", error);
            navigate('/');
        }
    };

    useEffect(() => {
        fetchSimulados();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleGerarSimuladoAleatorio = async () => {
        try {
            const token = localStorage.getItem('token');
            await api.post('simulados/gerar/', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Novo simulado aleatório gerado com sucesso!');
            fetchSimulados();
        } catch (error) {
            alert('Erro ao gerar simulado aleatório.');
        }
    };

    // Guarda ID (ME) ou Texto (DI)
    const handleResposta = (questaoId, valor) => {
        setRespostas(prev => ({
            ...prev,
            [questaoId]: valor
        }));
    };

    const handleFinalizarProva = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { respostas: respostas };

            const response = await api.post(`simulados/${simuladoAtivo.id}/finalizar/`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Verifica se tem aviso de correção pendente
            if (response.data.aviso) {
                alert(`${response.data.mensagem}\n\n${response.data.aviso}`);
            } else {
                alert(`Prova finalizada! A sua nota final foi: ${Number(response.data.nota_final).toFixed(2)}/10`);
            }
            
            setSimuladoAtivo(null);
            setRespostas({});
            fetchSimulados();
        } catch (error) {
            console.error(error);
            alert('Erro ao submeter a prova.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">Examex <span className="text-gray-400 text-sm font-normal">| Painel do Aluno</span></h1>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium text-sm">Sair</button>
            </nav>

            <main className="max-w-4xl mx-auto mt-8 p-4">
                {simuladoAtivo ? (
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">{simuladoAtivo.titulo}</h2>
                            <button onClick={() => { setSimuladoAtivo(null); setRespostas({}); }} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                                Abandonar Prova
                            </button>
                        </div>

                        <form onSubmit={handleFinalizarProva} className="space-y-8">
                            {simuladoAtivo.questoes.map((questao, qIndex) => (
                                <div key={questao.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-blue-600 text-sm">Questão {qIndex + 1}</span>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs uppercase font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                                {questao.tipo === 'ME' ? 'Múltipla Escolha' : 'Discursiva'}
                                            </span>
                                            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Peso: {questao.peso}</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-800 text-lg font-medium mb-4">{questao.enunciado}</p>
                                    
                                    {/* SE FOR MÚLTIPLA ESCOLHA: MOSTRA OS RADIOS */}
                                    {questao.tipo === 'ME' ? (
                                        <div className="space-y-2">
                                            {questao.alternativas.map((alt) => (
                                                <label key={alt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${respostas[questao.id] === alt.id ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-100'}`}>
                                                    <input type="radio" name={`questao_${questao.id}`} className="w-4 h-4 text-blue-600" checked={respostas[questao.id] === alt.id} onChange={() => handleResposta(questao.id, alt.id)}/>
                                                    <span className="font-bold text-gray-500">{alt.letra})</span>
                                                    <span className="text-gray-700">{alt.texto}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        /* SE FOR DISCURSIVA: MOSTRA CAMPO DE TEXTO */
                                        <textarea 
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                            rows="4" 
                                            placeholder="Digite a sua resposta aqui..."
                                            value={respostas[questao.id] || ''}
                                            onChange={(e) => handleResposta(questao.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}

                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-md">
                                Entregar e Finalizar Prova
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Minhas Provas e Simulados</h2>
                                <p className="text-gray-500">Realiza os teus exames oficiais ou gera treinos rápidos.</p>
                            </div>
                            <button onClick={handleGerarSimuladoAleatorio} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition shadow-md">
                                + Gerar Treino Aleatório
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {simulados.map((simulado) => (
                                <div key={simulado.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{simulado.titulo}</h3>
                                        <p className="text-sm text-gray-400 mt-1">Criado em: {new Date(simulado.data_criacao).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    
                                    <div>
                                        {simulado.finalizado ? (
                                            <div className="text-right">
                                                <span className="text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">Concluído</span>
                                                <p className="text-xl font-black text-gray-800 mt-1">Nota Atual: {Number(simulado.nota_final).toFixed(2)}</p>
                                            </div>
                                        ) : (
                                            <button onClick={() => setSimuladoAtivo(simulado)} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-lg transition">
                                                Iniciar Prova
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {simulados.length === 0 && <p className="text-gray-500 italic text-center py-8 bg-white rounded-lg border">Nenhuma prova atribuída de momento.</p>}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}