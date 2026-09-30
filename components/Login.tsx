import { isDemo, resetPassword } from '../services/session';
import React, { useState } from 'react';
import { TruckIcon } from './icons/TruckIcon';
import { LogIn } from 'lucide-react';

interface LoginProps {
    onLogin: (username: string, password: string) => void;
    error: string;
    busy?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, busy }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetBusy, setResetBusy] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onLogin(username, password);
    };

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setResetError(''); setResetBusy(true);
        try { await resetPassword(emailOrPhone); setResetSent(true); }
        catch (error) { setResetError(error instanceof Error ? error.message : 'Não foi possível solicitar a recuperação.'); }
        finally { setResetBusy(false); }
    };
    if (isForgotPassword) {
        return (
            <div className="login-page">
                <div className="login-card w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl text-center">
                    <TruckIcon className="h-16 w-16 text-brand-600 mx-auto" />
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">Recuperar Senha</h2>
                    
                    {resetSent ? (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg">
                            <p className="font-bold">Solicitação recebida</p>
                            <p className="text-sm mt-1">Se o endereço estiver cadastrado, você receberá instruções em <strong>{emailOrPhone}</strong>.</p>
                            <button 
                                onClick={() => { setIsForgotPassword(false); setResetSent(false); setEmailOrPhone(''); }}
                                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 w-full"
                            >
                                Voltar ao Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600">
                                Digite seu e-mail cadastrado para receber um link de recuperação.
                            </p>
                            {resetError && <p role="alert" className="text-sm text-red-700">{resetError}</p>}
                            <form className="mt-4 space-y-4" onSubmit={handleResetPassword}>
                                <input
                                    type="text"
                                    required
                                    value={emailOrPhone}
                                    onChange={(e) => setEmailOrPhone(e.target.value)}
                                    className="block w-full px-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                                    placeholder="seu@email.com" aria-label="E-mail de recuperação"
                                />
                                <button type="submit" disabled={resetBusy} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none">
                                    Enviar Link
                                </button>
                                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-sm text-gray-600 hover:text-brand-600">
                                    Voltar
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <section className="login-story" aria-label="Grupo Irmãos Andrade">
                <img className="login-company-logo" src="/logo-irmaos-andrade.png" alt="Grupo Irmãos Andrade" />
                <div><span className="login-kicker">ERP GIA</span><h1>Uma gestão forte.<br />Em cada caminho.</h1><p>Controle sua frota, acompanhe despesas e tenha uma visão clara da sua operação.</p></div>
                <div className="login-features"><span>01 &nbsp; Frota</span><span>02 &nbsp; Financeiro</span><span>03 &nbsp; Manutenção</span></div>
            </section>
            <div className="login-card w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl">
                <div className="flex flex-col items-center">
                    <img className="h-20 w-auto object-contain" src="/logo-irmaos-andrade.png" alt="Grupo Irmãos Andrade" />
                    <h2 className="mt-6 text-3xl font-bold text-center text-gray-900">
                        Bem-vindo de volta
                    </h2>
                    <p className="mt-2 text-sm text-center text-gray-600">
                        Entre com suas credenciais para acessar o ERP GIA.
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                        <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">{isDemo ? 'Usuário' : 'E-mail'}</label>
                            <input
                                id="username"
                                name="username"
                                autoComplete="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="relative block w-full px-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                                placeholder={isDemo ? "admin" : "nome@empresa.com.br"}
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
                            <input
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full px-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                                placeholder="Senha"
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <div className="p-3 text-sm text-center text-red-700 bg-red-100 rounded-md">
                            {error}
                        </div>
                    )}

                    <div>
                        <button type="submit" disabled={busy} className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md group hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                            {busy ? 'Entrando…' : 'Acessar o sistema'}
                        </button>
                    </div>
                    <div className="text-center mt-4">
                        <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm text-brand-600 hover:text-brand-500 font-medium">
                            Esqueci minha senha
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
