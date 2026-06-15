import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
    const navigate = useNavigate();
    
    const [simulados, setSimulados] = useState([]);
    const [simuladoAtivo, setSimuladoAtivo] = useState(null);
    const [respostas, setRespostas] = useState({});
    
    // --- ESTADO PARA O GABARITO ---
    const [gabaritoAtivo, setGabaritoAtivo] = useState(null);

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
            await api.post('simulados/gerar/', {}, { headers: { Authorization: `Bearer ${token}` } });
            alert('Novo simulado aleatório gerado com sucesso!');
            fetchSimulados();
        } catch (error) {
            alert('Erro ao gerar simulado aleatório.');
        }
    };

    const handleResposta = (questaoId, valor) => {
        setRespostas(prev => ({ ...prev, [questaoId]: valor }));
    };

    const handleFinalizarProva = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { respostas: respostas };
            const response = await api.post(`simulados/${simuladoAtivo.id}/finalizar/`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.aviso) {
                alert(`${response.data.mensagem}\n\n${response.data.aviso}`);
            } else {
                alert(`Prova finalizada! A sua nota final foi: ${Number(response.data.nota_final).toFixed(2)}/10`);
            }
            
            setSimuladoAtivo(null);
            setRespostas({});
            fetchSimulados();
        } catch (error) {
            alert('Erro ao submeter a prova.');
        }
    };

    const handleVerGabarito = async (simuladoId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`simulados/${simuladoId}/detalhes/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGabaritoAtivo(response.data);
        } catch (error) {
            alert("Erro ao buscar os detalhes da prova.");
        }
    };

    const handleExcluirSimulado = async (simuladoId) => {
        const confirmar = window.confirm("Tem certeza que deseja excluir este treino? O histórico será perdido.");
        if (!confirmar) return;

        try {
            const token = localStorage.getItem('token');
            await api.delete(`simulados/${simuladoId}/excluir/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSimulados(); // Recarrega a lista para a prova sumir da tela
        } catch (error) {
            alert("Erro ao excluir. Provas oficiais não podem ser apagadas.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">Examex <span className="text-gray-400 text-sm font-normal">| Painel do Aluno</span></h1>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium text-sm">Sair</button>
            </nav>

            <main className="max-w-4xl mx-auto mt-8 p-4">
                {/* --- TELA DE GABARITO --- */}
                {gabaritoAtivo ? (
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Resultado: {gabaritoAtivo.titulo}</h2>
                                <p className="text-gray-500 font-medium mt-1">Sua nota atual: <span className="text-blue-600 font-bold">{Number(gabaritoAtivo.nota_final).toFixed(2)}</span> / 10</p>
                            </div>
                            <button onClick={() => setGabaritoAtivo(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold py-2 px-4 rounded-lg transition">
                                Voltar para Home
                            </button>
                        </div>

                        <div className="space-y-6">
                            {gabaritoAtivo.respostas.map((resp, index) => (
                                <div key={index} className={`p-5 rounded-lg border-l-4 ${resp.esta_correta ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-800">Questão {index + 1}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${resp.esta_correta ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {resp.esta_correta ? 'Acertou' : 'Errou'}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mb-4">{resp.questao_enunciado}</p>

                                    {resp.questao_tipo === 'ME' ? (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-white p-3 rounded border">
                                                <span className="text-gray-500 block text-xs font-bold uppercase mb-1">Você marcou</span>
                                                <span className="font-bold text-gray-800">{resp.alternativa_marcada_letra || 'Deixou em branco'}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded border border-green-200">
                                                <span className="text-green-600 block text-xs font-bold uppercase mb-1">Gabarito Correto</span>
                                                <span className="font-bold text-green-800">{resp.questao_gabarito}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 text-sm">
                                            <div className="bg-white p-3 rounded border">
                                                <span className="text-gray-500 block text-xs font-bold uppercase mb-1">Sua Resposta Escrita</span>
                                                <p className="text-gray-800">{resp.texto_resposta}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded border">
                                                <span className="text-blue-600 block text-xs font-bold uppercase mb-1">Nota Atribuída pelo Professor</span>
                                                <span className="font-bold text-lg text-blue-800">
                                                    {resp.nota_atribuida !== null ? `${resp.nota_atribuida} de ${resp.questao_peso}` : 'Aguardando Correção'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : simuladoAtivo ? (
                    /* --- TELA DE FAZER A PROVA --- */
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">{simuladoAtivo.titulo}</h2>
                            <button onClick={() => { setSimuladoAtivo(null); setRespostas({}); }} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Abandonar Prova</button>
                        </div>

                        <form onSubmit={handleFinalizarProva} className="space-y-8">
                            {simuladoAtivo.questoes.map((questao, qIndex) => (
                                <div key={questao.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-blue-600 text-sm">Questão {qIndex + 1}</span>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs uppercase font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{questao.tipo === 'ME' ? 'Múltipla Escolha' : 'Discursiva'}</span>
                                            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Peso: {questao.peso}</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-800 text-lg font-medium mb-4">{questao.enunciado}</p>
                                    
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
                                        <textarea required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="4" placeholder="Digite a sua resposta aqui..." value={respostas[questao.id] || ''} onChange={(e) => handleResposta(questao.id, e.target.value)}/>
                                    )}
                                </div>
                            ))}
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-md">Entregar e Finalizar Prova</button>
                        </form>
                    </div>
                ) : (
                    /* --- TELA INICIAL COM LISTA DE PROVAS --- */
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Minhas Provas e Simulados</h2>
                                <p className="text-gray-500">Realize os seus exames oficiais ou gere treinos rápidos.</p>
                            </div>
                            <button onClick={handleGerarSimuladoAleatorio} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition shadow-md">
                                + Gerar Treino Aleatório
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {simulados.map((simulado) => {
                                // Verifica se é um treino gerado pelo aluno (geralmente tem "Aleatório" no título)
                                const isTreino = simulado.titulo.includes("Aleatório");
                                
                                return (
                                    <div key={simulado.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{simulado.titulo}</h3>
                                            <p className="text-sm text-gray-400 mt-1">Criado em: {new Date(simulado.data_criacao).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            {simulado.finalizado ? (
                                                <>
                                                    <div className="text-right">
                                                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">Concluído</span>
                                                        <p className="text-xl font-black text-gray-800 mt-1">Nota: {Number(simulado.nota_final).toFixed(2)}</p>
                                                    </div>
                                                    <button onClick={() => handleVerGabarito(simulado.id)} className="bg-gray-100 hover:bg-gray-200 text-blue-600 text-sm font-bold py-2 px-4 rounded-lg transition border border-gray-300">
                                                        Ver Gabarito
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => setSimuladoAtivo(simulado)} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-lg transition">
                                                    Iniciar Prova
                                                </button>
                                            )}
                                            
                                            {/* BOTÃO EXCLUIR APARECE APENAS SE FOR TREINO */}
                                            {isTreino && (
                                                <button 
                                                    onClick={() => handleExcluirSimulado(simulado.id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 text-sm font-bold py-2 px-3 rounded-lg transition border border-red-200 ml-2"
                                                    title="Excluir este treino"
                                                >
                                                    🗑️ Excluir
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {simulados.length === 0 && (
                                <p className="text-gray-500 italic text-center py-8 bg-white rounded-lg border">
                                    Nenhuma prova atribuída no momento.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}