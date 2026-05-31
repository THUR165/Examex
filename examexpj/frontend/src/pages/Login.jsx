import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('token/', {
                username,
                password
            });
            
            // Salva o token "access" no navegador
            localStorage.setItem('token', response.data.access);
            alert("Login realizado com sucesso!");
            
            navigate('/dashboard');
        } catch (error) {
            alert("Erro ao fazer login. Verifique as credenciais.");
            console.error(error);
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Login - Examex</h1>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', margin: '0 auto', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Usuário" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input 
                    type="password" 
                    placeholder="Senha" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Entrar</button>
            </form>
        </div>
    );
}