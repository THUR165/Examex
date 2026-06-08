import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DashboardProfessor() {
    const navigate = useNavigate();
    
    // Controle das abas: 'estatisticas', 'nova_questao', 'montar_prova'
    const [abaAtiva, setAbaAtiva] = useState('estatisticas');

    // Estados para Criar Questão
    const [enunciado, setEnunciado] = useState('');
    const [peso, setPeso] = useState(1);
    const [topicoId, setTopicoId] = useState(1);
    const [respostaCorreta, setRespostaCorreta] = useState('A'); 
    const [alternativas, setAlternativas] = useState([
        { letra: 'A', texto: '' }, { letra: 'B', texto: '' },
        { letra: 'C', texto: '' }, { letra: 'D', texto: '' },
    ]);

    // Estados para Montar Prova Manual
    const [todasQuestoes, setTodasQuestoes] = useState([]);
    const [tituloProva, setTituloProva] = useState('');
    const [questoesSelecionadas, setQuestoesSelecionadas] = useState([]);

    // Busca as questões assim que o painel carrega
    useEffect(() => {
        const fetchQuestoes = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get('questoes/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTodasQuestoes(response.data);
            } catch (error) {
                console.error("Erro ao buscar questões:", error);
            }
        };
        fetchQuestoes();
    }, [abaAtiva]); // Recarrega sempre que mudar de aba

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('is_professor');
        navigate('/');
    };

    // --- FUNÇÕES DE CRIAÇÃO DE QUESTÃO ---
    const handleTextoAlternativa = (index, novoTexto) => {
        const novasAlternativas = [...alternativas];
        novasAlternativas[index].texto = novoTexto;
        setAlternativas(novasAlternativas);
    };

    const handleSalvarQuestao = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { enunciado, peso, tipo: 'ME', topico: topicoId, resposta_correta: respostaCorreta, alternativas };
            await api.post('questoes/', payload, { headers: { Authorization: `Bearer ${token}` } });
            alert('Questão cadastrada com sucesso!');
            setEnunciado('');
            setAbaAtiva('estatisticas');
        } catch (error) {
            alert('Erro ao cadastrar a questão.');
        }
    };

    // --- FUNÇÕES DE MONTAGEM DE PROVA ---
    const toggleQuestao = (id) => {
        setQuestoesSelecionadas(prev => 
            prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
        );
    };

    const handleSalvarProva = async (e) => {
        e.preventDefault();
        if (questoesSelecionadas.length === 0) {
            alert("Selecione ao menos uma questão!");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const payload = { titulo: tituloProva, questoes_ids: questoesSelecionadas };
            
            await api.post('provas/montar/', payload, { headers: { Authorization: `Bearer ${token}` } });
            alert('Prova Oficial montada e salva com sucesso!');
            setTituloProva('');
            setQuestoesSelecionadas([]);
            setAbaAtiva('estatisticas');
        } catch (error) {
            alert('Erro ao salvar a prova.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-slate-800 shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Examex <span className="text-gray-400 text-sm font-normal">| Painel do Professor</span></h1>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-medium text-sm">Sair</button>
            </nav>

            <main className="max-w-4xl mx-auto mt-8 p-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Administração de Conteúdo</h2>
                        <p className="text-gray-500">Gerencie suas questões e monte novas provas.</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                        onClick={() => setAbaAtiva(abaAtiva === 'montar_prova' ? 'estatisticas' : 'montar_prova')}
                        className={`${abaAtiva === 'montar_prova' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-2 px-4 rounded-lg transition shadow-md`}>
                            {abaAtiva === 'montar_prova' ? 'Cancelar' : 'Montar Prova'}
                        </button>
                        <button onClick={() => setAbaAtiva(abaAtiva === 'nova_questao' ? 'estatisticas' : 'nova_questao')} className={`${abaAtiva === 'nova_questao' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold py-2 px-4 rounded-lg transition shadow-md`}>
                            {abaAtiva === 'nova_questao' ? 'Cancelar' : '+ Nova Questão'}
                        </button>
                    </div>
                </div>

                {/* ABA: ESTATÍSTICAS */}
                {abaAtiva === 'estatisticas' && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-sm font-medium">Questões no Banco</h3>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{todasQuestoes.length}</p>
                        </div>
                    </div>
                )}

                {/* ABA: NOVA QUESTÃO */}
                {abaAtiva === 'nova_questao' && (
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        {/* ... Código do formulário de questão que criamos antes ... */}
                        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Cadastrar Nova Questão</h3>
                        <form onSubmit={handleSalvarQuestao} className="flex flex-col gap-6">
                            <div><textarea required className="w-full px-4 py-2 border rounded-lg" rows="3" value={enunciado} onChange={(e) => setEnunciado(e.target.value)} placeholder="Enunciado..."/></div>
                            <div className="mt-4">
                                {alternativas.map((alt, index) => (
                                    <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border mb-2">
                                        <input type="radio" name="correta" className="w-5 h-5 text-emerald-600" checked={respostaCorreta === alt.letra} onChange={() => setRespostaCorreta(alt.letra)}/>
                                        <span className="font-bold">{alt.letra})</span>
                                        <input type="text" required className="w-full bg-transparent border-b px-2" value={alt.texto} onChange={(e) => handleTextoAlternativa(index, e.target.value)}/>
                                    </div>
                                ))}
                            </div>
                            <button type="submit" className="bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition">Salvar Questão</button>
                        </form>
                    </div>
                )}

                {/* ABA: MONTAR PROVA MANUAL */}
                {abaAtiva === 'montar_prova' && (
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-lg font-bold text-indigo-700 mb-6 border-b pb-2">Montar Nova Prova</h3>
                        <form onSubmit={handleSalvarProva} className="flex flex-col gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Prova</label>
                                <input 
                                    type="text" required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={tituloProva} onChange={(e) => setTituloProva(e.target.value)}
                                    placeholder="Ex: Prova 1 - Estrutura de Dados"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Selecione as Questões ({questoesSelecionadas.length} marcadas)</label>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {todasQuestoes.map((questao) => (
                                        <label key={questao.id} className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition ${questoesSelecionadas.includes(questao.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 mt-1 text-indigo-600 rounded"
                                                checked={questoesSelecionadas.includes(questao.id)}
                                                onChange={() => toggleQuestao(questao.id)}
                                            />
                                            <div>
                                                <p className="text-gray-800 font-medium">{questao.enunciado}</p>
                                                <span className="text-xs text-gray-500 mt-1 inline-block bg-gray-200 px-2 py-1 rounded">Peso: {questao.peso}</span>
                                            </div>
                                        </label>
                                    ))}
                                    {todasQuestoes.length === 0 && <p className="text-gray-500 italic">Nenhuma questão cadastrada no banco.</p>}
                                </div>
                            </div>

                            <button type="submit" className="mt-4 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md">
                                Salvar e Publicar Prova
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}