import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
    const [questoes, setQuestoes] = useState([]);

    useEffect(() => {
        const fetchQuestoes = async () => {
            const token = localStorage.getItem('token');
            
            try {
                const response = await api.get('questoes/', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setQuestoes(response.data);
            } catch (error) {
                console.error("Erro ao buscar questões. Token inválido ou expirado.", error);
            }
        };

        fetchQuestoes();
    }, []);

    return (
        <div style={{ padding: '50px' }}>
            <h2>Painel de Estudos</h2>
            <p>Questões cadastradas no banco de dados:</p>
            <ul>
                {questoes.map((questao) => (
                    <li key={questao.id}>
                        <strong>{questao.enunciado}</strong> (Peso: {questao.peso})
                    </li>
                ))}
            </ul>
        </div>
    );
}