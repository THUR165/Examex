import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
    const [questoes, setQuestoes] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuestoes = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await api.get('questoes/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQuestoes(response.data);
            } catch (error) {
                console.error("Erro", error);
                navigate('/'); // Se o token for inválido, volta pro login
            }
        };
        fetchQuestoes();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // --- NOVA FUNÇÃO: O gatilho do Motor de Simulados ---
    const handleGerarSimulado = async () => {
        try {
            const token = localStorage.getItem('token');
            // Fazemos um POST vazio ({}) apenas para dar a "ordem" de geração para o back-end
            const response = await api.post('simulados/gerar/', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert(`Sucesso! Simulado "${response.data.titulo}" gerado.`);
            console.log("JSON DA PROVA GERADA:", response.data); // Exibe o resultado no F12
            
        } catch (error) {
            console.error("Erro ao acionar o motor:", error);
            alert("Erro ao gerar o simulado. Verifique o terminal do Django.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">Examex <span className="text-gray-400 text-sm font-normal">| Painel do Aluno</span></h1>
                <button 
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-700 font-medium text-sm"
                >
                    Sair
                </button>
            </nav>

            {/* Conteúdo Principal */}
            <main className="max-w-4xl mx-auto mt-8 p-4">
                {/* Alteramos a div de cabeçalho para "flex justify-between" para alinhar o botão à direita */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Banco de Questões</h2>
                        <p className="text-gray-500">Questões disponíveis para os próximos simulados.</p>
                    </div>
                    
                    {/* --- NOVO BOTÃO --- */}
                    <button 
                        onClick={handleGerarSimulado}
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                        + Gerar Simulado Aleatório
                    </button>
                </div>

                <div className="grid gap-4">
                    {questoes.map((questao) => (
                        <div key={questao.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                    {questao.tipo === 'ME' ? 'Múltipla Escolha' : 'Discursiva'}
                                </span>
                                <span className="text-gray-400 text-sm">Peso: {questao.peso}</span>
                            </div>
                            <h3 className="text-lg text-gray-800 font-medium">{questao.enunciado}</h3>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}