import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DashboardProfessor() {
    const navigate = useNavigate();
    const [exibirForm, setExibirForm] = useState(false);

    // Estados da Questão
    const [enunciado, setEnunciado] = useState('');
    const [peso, setPeso] = useState(1);
    const [topicoId, setTopicoId] = useState(1);
    
    // NOVO: Estado para guardar qual a letra correta (A, B, C ou D)
    const [respostaCorreta, setRespostaCorreta] = useState('A'); 
    
    // Estado das Alternativas adequados ao seu Banco de Dados
    const [alternativas, setAlternativas] = useState([
        { letra: 'A', texto: '' },
        { letra: 'B', texto: '' },
        { letra: 'C', texto: '' },
        { letra: 'D', texto: '' },
    ]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            // O pacote agora está IDÊNTICO ao seu models.py!
            const payload = {
                enunciado: enunciado,
                peso: peso,
                tipo: 'ME',
                topico: topicoId,
                resposta_correta: respostaCorreta, // Manda a letra correta para a Questão
                alternativas: alternativas // Manda a lista de letras e textos
            };

            await api.post('questoes/', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Questão cadastrada com sucesso no banco de dados!');
            setEnunciado('');
            setExibirForm(false);
            
        } catch (error) {
            console.error(error);
            alert('Erro ao cadastrar a questão. Verifique o terminal do Django.');
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
                    <button 
                        onClick={() => setExibirForm(!exibirForm)}
                        className={`${exibirForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold py-2 px-6 rounded-lg transition shadow-md`}
                    >
                        {exibirForm ? 'Cancelar' : '+ Nova Questão'}
                    </button>
                </div>

                {exibirForm ? (
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Cadastrar Nova Questão</h3>
                        
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enunciado da Questão</label>
                                <textarea 
                                    required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" rows="3"
                                    value={enunciado} onChange={(e) => setEnunciado(e.target.value)}
                                    placeholder="Digite o texto da questão aqui..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID do Tópico</label>
                                    <input type="number" required min="1" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={topicoId} onChange={(e) => setTopicoId(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso da Questão</label>
                                    <input type="number" required min="1" step="0.5" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={peso} onChange={(e) => setPeso(e.target.value)} />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Alternativas (Marque a correta)</label>
                                <div className="space-y-3">
                                    {alternativas.map((alt, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
                                            <input 
                                                type="radio" 
                                                name="alternativa_correta"
                                                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                                                // Verifica se essa é a letra selecionada
                                                checked={respostaCorreta === alt.letra} 
                                                // Ao clicar, muda a resposta correta para a letra atual
                                                onChange={() => setRespostaCorreta(alt.letra)}
                                            />
                                            <span className="font-bold text-gray-500">{alt.letra})</span>
                                            <input 
                                                type="text" required
                                                className="w-full bg-transparent border-b border-gray-300 focus:border-emerald-500 outline-none px-2 py-1"
                                                placeholder={`Texto da alternativa ${alt.letra}`}
                                                value={alt.texto}
                                                onChange={(e) => handleTextoAlternativa(index, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="mt-4 bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition">
                                Salvar Questão no Banco de Dados
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-sm font-medium">Tópicos e Disciplinas</h3>
                            <p className="text-sm text-gray-400 mt-1">Gerenciados via Admin Django</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-sm font-medium">Provas Montadas</h3>
                            <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}