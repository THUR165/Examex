import { useNavigate } from 'react-router-dom';

export default function DashboardProfessor() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('is_professor');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar Escura para diferenciar do painel do aluno */}
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
                    <button className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-emerald-700 transition shadow-md">
                        + Nova Questão
                    </button>
                </div>

                {/* Área de estatísticas rápidas */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Questões Cadastradas</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">1</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Provas Montadas</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
                    </div>
                </div>
            </main>
        </div>
    );
}