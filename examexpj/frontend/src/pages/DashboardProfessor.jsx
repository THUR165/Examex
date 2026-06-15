import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
// --- NOVA IMPORTAÇÃO DOS GRÁFICOS ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardProfessor() {
    const navigate = useNavigate();
    const [abaAtiva, setAbaAtiva] = useState('estatisticas');

    // Estados Gerais
    const [todasQuestoes, setTodasQuestoes] = useState([]);
    const [turmas, setTurmas] = useState([]);
    
    // Estados de Correção e Gráficos
    const [correcoesPendentes, setCorrecoesPendentes] = useState([]);
    const [notasAtribuidas, setNotasAtribuidas] = useState({});
    const [dadosGrafico, setDadosGrafico] = useState([]); // <-- NOVO: Estado do Gráfico

    // Estados do Formulário de Questão
    const [enunciado, setEnunciado] = useState('');
    const [peso, setPeso] = useState(1);
    const [topicoId, setTopicoId] = useState(1);
    const [tipoQuestao, setTipoQuestao] = useState('ME'); 
    const [isPublica, setIsPublica] = useState(true); 
    const [respostaDiscursiva, setRespostaDiscursiva] = useState(''); 
    const [respostaCorretaME, setRespostaCorretaME] = useState('A'); 
    const [alternativas, setAlternativas] = useState([
        { letra: 'A', texto: '' }, { letra: 'B', texto: '' },
        { letra: 'C', texto: '' }, { letra: 'D', texto: '' },
    ]);

    // Estados da Montagem de Prova
    const [tituloProva, setTituloProva] = useState('');
    const [questoesSelecionadas, setQuestoesSelecionadas] = useState([]);
    const [turmaSelecionada, setTurmaSelecionada] = useState('');
    const [criandoQuestaoNaProva, setCriandoQuestaoNaProva] = useState(false);

    const fetchDados = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const resQuestoes = await api.get('questoes/', { headers });
            setTodasQuestoes(resQuestoes.data);
            
            const resTurmas = await api.get('turmas/', { headers });
            setTurmas(resTurmas.data);
            
            const resCorrecoes = await api.get('correcoes/pendentes/', { headers });
            setCorrecoesPendentes(resCorrecoes.data);

            // --- NOVO: Busca os dados das turmas para o gráfico ---
            const resEstatisticas = await api.get('estatisticas/turmas/', { headers });
            setDadosGrafico(resEstatisticas.data);
            
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        }
    };

    useEffect(() => {
        fetchDados();
    }, [abaAtiva]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('is_professor');
        navigate('/');
    };

    const handleTextoAlternativa = (index, novoTexto) => {
        const novasAlternativas = [...alternativas];
        novasAlternativas[index].texto = novoTexto;
        setAlternativas(novasAlternativas);
    };

    const salvarQuestaoNoBanco = async (forcarSigilosa = false) => {
        const token = localStorage.getItem('token');
        const payload = {
            enunciado,
            peso: parseFloat(peso),
            tipo: tipoQuestao,
            topico: topicoId,
            is_publica: forcarSigilosa ? false : isPublica,
            resposta_correta: tipoQuestao === 'ME' ? respostaCorretaME : respostaDiscursiva,
            alternativas: tipoQuestao === 'ME' ? alternativas : []
        };

        const response = await api.post('questoes/', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setEnunciado('');
        setRespostaDiscursiva('');
        setPeso(1);
        
        return response.data;
    };

    const handleSalvarQuestaoAbaPropria = async (e) => {
        e.preventDefault();
        try {
            await salvarQuestaoNoBanco();
            alert('Questão cadastrada com sucesso!');
            setAbaAtiva('estatisticas');
        } catch (error) {
            alert('Erro ao cadastrar a questão.');
        }
    };

    const handleCriarQuestaoCriacaoProva = async (e) => {
        e.preventDefault();
        try {
            const novaQuestao = await salvarQuestaoNoBanco(true);
            alert('Questão sigilosa criada e adicionada à lista!');
            setTodasQuestoes(prev => [novaQuestao, ...prev]);
            setQuestoesSelecionadas(prev => [...prev, novaQuestao.id]);
            setCriandoQuestaoNaProva(false);
        } catch (error) {
            alert('Erro ao criar questão na prova.');
        }
    };

    const toggleQuestao = (id) => {
        setQuestoesSelecionadas(prev => 
            prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
        );
    };

    const handleSalvarProva = async (e) => {
        e.preventDefault();
        if (questoesSelecionadas.length === 0) return alert("Selecione ao menos uma questão!");
        if (!turmaSelecionada) return alert("Selecione uma turma para enviar a prova!");
        
        try {
            const token = localStorage.getItem('token');
            const payload = { titulo: tituloProva, questoes_ids: questoesSelecionadas, turma_id: turmaSelecionada };
            
            const response = await api.post('provas/montar/', payload, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            alert(response.data.mensagem);
            setTituloProva('');
            setQuestoesSelecionadas([]);
            setTurmaSelecionada('');
            setAbaAtiva('estatisticas');
        } catch (error) {
            alert('Erro ao salvar a prova.');
        }
    };

    const handleSalvarCorrecao = async (idResposta, pesoMaximo) => {
        const notaStr = notasAtribuidas[idResposta];
        const nota = parseFloat(notaStr);
        
        if (isNaN(nota) || nota < 0 || nota > pesoMaximo) {
            alert(`Por favor, insira uma nota válida entre 0 e ${pesoMaximo}.`);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await api.post(`correcoes/${idResposta}/salvar/`, { nota: nota }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert(response.data.mensagem);
            setNotasAtribuidas(prev => { const novas = {...prev}; delete novas[idResposta]; return novas; });
            fetchDados();
        } catch (error) {
            alert('Erro ao salvar a correção. Verifique se o valor está correto.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-slate-800 shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Examex <span className="text-gray-400 text-sm font-normal">| Painel do Professor</span></h1>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-medium text-sm">Sair</button>
            </nav>

            <main className="max-w-5xl mx-auto mt-8 p-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Administração de Conteúdo</h2>
                        <p className="text-gray-500">Gerencie suas questões, monte provas e avalie alunos.</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setAbaAtiva(abaAtiva === 'correcoes' ? 'estatisticas' : 'correcoes')} 
                            className={`relative ${abaAtiva === 'correcoes' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-amber-500 hover:bg-amber-600'} text-white font-bold py-2 px-4 rounded-lg transition shadow-md`}
                        >
                            {abaAtiva === 'correcoes' ? 'Cancelar' : 'Corrigir Provas'}
                            {correcoesPendentes.length > 0 && abaAtiva !== 'correcoes' && (
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                                    {correcoesPendentes.length}
                                </span>
                            )}
                        </button>

                        <button 
                            onClick={() => { setAbaAtiva(abaAtiva === 'montar_prova' ? 'estatisticas' : 'montar_prova'); setCriandoQuestaoNaProva(false); }} 
                            className={`${abaAtiva === 'montar_prova' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-2 px-4 rounded-lg transition shadow-md`}
                        >
                            {abaAtiva === 'montar_prova' ? 'Cancelar' : 'Montar Prova'}
                        </button>
                        
                        <button 
                            onClick={() => setAbaAtiva(abaAtiva === 'nova_questao' ? 'estatisticas' : 'nova_questao')} 
                            className={`${abaAtiva === 'nova_questao' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold py-2 px-4 rounded-lg transition shadow-md`}
                        >
                            {abaAtiva === 'nova_questao' ? 'Cancelar' : '+ Nova Questão'}
                        </button>
                    </div>
                </div>

                {/* --- ABA DE ESTATÍSTICAS COM GRÁFICO --- */}
                {abaAtiva === 'estatisticas' && (
                    <div className="space-y-6 mb-8">
                        {/* Cards Superiores */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <h3 className="text-gray-500 text-sm font-medium">Minhas Turmas</h3>
                                <p className="text-3xl font-bold text-indigo-600 mt-2">{turmas.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <h3 className="text-gray-500 text-sm font-medium">Questões no Banco</h3>
                                <p className="text-3xl font-bold text-emerald-600 mt-2">{todasQuestoes.length}</p>
                            </div>
                            <div className="bg-amber-50 p-6 rounded-lg shadow-sm border border-amber-200">
                                <h3 className="text-amber-800 text-sm font-medium">Aguardando Correção</h3>
                                <p className="text-3xl font-bold text-amber-600 mt-2">{correcoesPendentes.length}</p>
                            </div>
                        </div>

                        {/* Novo Bloco: Gráfico de Desempenho */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Desempenho por Turma (Média)</h3>
                            {dadosGrafico.length > 0 ? (
                                <div className="h-72 mt-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="nome" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 10]} tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar dataKey="media" name="Média Final da Turma" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <p className="text-gray-400 italic mb-2">Ainda não há dados suficientes para gerar o gráfico.</p>
                                    <p className="text-sm text-gray-400">As turmas precisam ter simulados finalizados e corrigidos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ABA: CORREÇÕES PENDENTES */}
                {abaAtiva === 'correcoes' && (
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-lg font-bold text-amber-600 mb-6 border-b pb-2">Central de Avaliação Manual</h3>
                        
                        {correcoesPendentes.length === 0 ? (
                            <p className="text-gray-500 italic text-center py-8">Nenhuma resposta pendente de correção no momento. Excelente trabalho!</p>
                        ) : (
                            <div className="space-y-6">
                                {correcoesPendentes.map((resp) => (
                                    <div key={resp.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800">{resp.aluno_nome} <span className="text-sm font-normal text-gray-500">- {resp.simulado_titulo}</span></h4>
                                                <p className="text-gray-700 font-medium mt-2">P: {resp.questao_enunciado}</p>
                                            </div>
                                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded">
                                                Valendo: {resp.peso_maximo} pts
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-white p-3 rounded border border-gray-200">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gabarito do Professor</p>
                                                <p className="text-sm text-gray-600 italic">{resp.questao_gabarito}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded border border-blue-200 shadow-sm">
                                                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Resposta do Aluno</p>
                                                <p className="text-sm text-gray-800">{resp.texto_resposta || "(Deixou em branco)"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 justify-end border-t border-gray-200 pt-4 mt-2">
                                            <label className="text-sm font-bold text-gray-700">Atribuir Nota:</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max={resp.peso_maximo} 
                                                step="0.1" 
                                                placeholder={`Ex: ${resp.peso_maximo}`}
                                                className="w-24 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                                                value={notasAtribuidas[resp.id] || ''}
                                                onChange={(e) => setNotasAtribuidas({...notasAtribuidas, [resp.id]: e.target.value})}
                                            />
                                            <button 
                                                onClick={() => handleSalvarCorrecao(resp.id, resp.peso_maximo)}
                                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-4 rounded transition"
                                            >
                                                Salvar Nota
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ABA: NOVA QUESTÃO */}
                {abaAtiva === 'nova_questao' && (
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Cadastrar Nova Questão</h3>
                        <form onSubmit={handleSalvarQuestaoAbaPropria} className="flex flex-col gap-5">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Questão</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white" value={tipoQuestao} onChange={(e) => setTipoQuestao(e.target.value)}>
                                        <option value="ME">Múltipla Escolha</option>
                                        <option value="DI">Discursiva (Texto)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidade / Sigilo</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white" value={isPublica ? "true" : "false"} onChange={(e) => setIsPublica(e.target.value === "true")}>
                                        <option value="true">Pública (Disponível para Treinos)</option>
                                        <option value="false">Sigilosa (Apenas Provas Oficiais)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso da Questão</label>
                                    <input type="number" required min="0.1" step="0.1" className="w-full px-3 py-2 border rounded-lg" value={peso} onChange={(e) => setPeso(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Tópico</label>
                                <input type="number" required min="1" className="w-full px-3 py-2 border rounded-lg" value={topicoId} onChange={(e) => setTopicoId(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enunciado da Questão</label>
                                <textarea required className="w-full px-4 py-2 border rounded-lg" rows="3" value={enunciado} onChange={(e) => setEnunciado(e.target.value)} placeholder="Digite o enunciado..."/>
                            </div>

                            {tipoQuestao === 'ME' ? (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Alternativas</label>
                                    {alternativas.map((alt, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border mb-2">
                                            <input type="radio" name="correta_aba" className="w-5 h-5 text-emerald-600" checked={respostaCorretaME === alt.letra} onChange={() => setRespostaCorretaME(alt.letra)}/>
                                            <span className="font-bold">{alt.letra})</span>
                                            <input type="text" required={tipoQuestao === 'ME'} className="w-full bg-transparent border-b px-2" value={alt.texto} onChange={(e) => handleTextoAlternativa(index, e.target.value)}/>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gabarito / Resposta de Texto Esperada</label>
                                    <textarea required={tipoQuestao === 'DI'} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" rows="3" value={respostaDiscursiva} onChange={(e) => setRespostaDiscursiva(e.target.value)} placeholder="Ex: A derivada de 2x² é 4x obtida através da regra do tombo."/>
                                </div>
                            )}
                            <button type="submit" className="bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition">Salvar Questão no Banco</button>
                        </form>
                    </div>
                )}

                {/* ABA: MONTAR PROVA MANUAL */}
                {abaAtiva === 'montar_prova' && (
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b pb-2">
                            <h3 className="text-lg font-bold text-indigo-700">Montar Nova Prova Oficial</h3>
                            <button type="button" onClick={() => setCriandoQuestaoNaProva(!criandoQuestaoNaProva)} className="text-xs bg-slate-800 text-white font-semibold py-1.5 px-3 rounded hover:bg-slate-900 transition">
                                {criandoQuestaoNaProva ? '← Voltar para a Seleção' : '+ Criar Nova Questão Sigilosa aqui'}
                            </button>
                        </div>

                        {criandoQuestaoNaProva ? (
                            <div className="bg-slate-50 p-6 rounded-lg border border-dashed border-slate-300 mb-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-4">Nova Questão Direta (Nascerá Oculta/Sigilosa)</h4>
                                <form onSubmit={handleCriarQuestaoCriacaoProva} className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                            <select className="w-full px-3 py-1.5 border rounded bg-white text-sm" value={tipoQuestao} onChange={(e) => setTipoQuestao(e.target.value)}>
                                                <option value="ME">Múltipla Escolha</option>
                                                <option value="DI">Discursiva (Texto)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Peso (Aceita decimais)</label>
                                            <input type="number" required min="0.1" step="0.1" className="w-full px-3 py-1.5 border rounded text-sm" value={peso} onChange={(e) => setPeso(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">ID do Tópico</label>
                                        <input type="number" required min="1" className="w-full px-3 py-1.5 border rounded text-sm" value={topicoId} onChange={(e) => setTopicoId(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Enunciado</label>
                                        <textarea required className="w-full px-3 py-1.5 border rounded text-sm" rows="2" value={enunciado} onChange={(e) => setEnunciado(e.target.value)} placeholder="Texto da questão da prova..."/>
                                    </div>

                                    {tipoQuestao === 'ME' ? (
                                        <div className="space-y-2">
                                            {alternativas.map((alt, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                                                    <input type="radio" name="correta_inline" checked={respostaCorretaME === alt.letra} onChange={() => setRespostaCorretaME(alt.letra)}/>
                                                    <span className="font-bold">{alt.letra})</span>
                                                    <input type="text" required={tipoQuestao === 'ME'} className="w-full border-b outline-none text-xs" value={alt.texto} onChange={(e) => handleTextoAlternativa(index, e.target.value)}/>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Gabarito de Texto</label>
                                            <textarea required={tipoQuestao === 'DI'} className="w-full px-3 py-1.5 border rounded text-sm" rows="2" value={respostaDiscursiva} onChange={(e) => setRespostaDiscursiva(e.target.value)} placeholder="Diretriz de correção..."/>
                                        </div>
                                    )}
                                    <button type="submit" className="bg-slate-800 text-white font-bold py-2 rounded text-sm hover:bg-slate-900 transition">Inserir Questão Oculta na Prova</button>
                                </form>
                            </div>
                        ) : (
                            <form onSubmit={handleSalvarProva} className="flex flex-col gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título da Prova</label>
                                        <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={tituloProva} onChange={(e) => setTituloProva(e.target.value)} placeholder="Ex: Prova Oficial de BD"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Turma Destino</label>
                                        <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={turmaSelecionada} onChange={(e) => setTurmaSelecionada(e.target.value)}>
                                            <option value="" disabled>Selecione uma turma...</option>
                                            {turmas.map((turma) => (
                                                <option key={turma.id} value={turma.id}>{turma.nome} ({turma.codigo})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Selecione as Questões ({questoesSelecionadas.length} marcadas)</label>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {todasQuestoes.map((questao) => (
                                            <label key={questao.id} className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition ${questoesSelecionadas.includes(questao.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                                <input type="checkbox" className="w-5 h-5 mt-1 text-indigo-600 rounded" checked={questoesSelecionadas.includes(questao.id)} onChange={() => toggleQuestao(questao.id)}/>
                                                <div className="w-full">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-gray-800 font-medium">{questao.enunciado}</p>
                                                        <div className="flex gap-1.5">
                                                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                                                {questao.tipo === 'ME' ? 'Múltipla Escolha' : 'Discursiva'}
                                                            </span>
                                                            {!questao.is_publica && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Sigilosa</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-1 inline-block">Peso: {questao.peso}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="mt-4 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md">Salvar e Publicar para a Turma</button>
                            </form>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}