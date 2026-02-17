import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface LoginPageProps {
    onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const user = await DatabaseService.login(username, password);
            if (user) {
                localStorage.setItem('cardio_user', JSON.stringify(user));
                onLogin();
            } else {
                setError('Utilisateur ou mot de passe incorrect.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Erreur de connexion à la base de données.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)]">
            <Card
                className="max-w-[480px]"
                title="CardioMed"
                subtitle="Portail de Gestion Cardiologique Sécurisé"
                headerIcon="cardiology"
            >
                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl text-[var(--color-danger)] text-xs font-bold text-center animate-in fade-in zoom-in duration-300">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Nom d'utilisateur"
                        placeholder="Entrez votre nom d'utilisateur"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <Input
                        label="Mot de passe"
                        placeholder="Entrez votre mot de passe"
                        type={showPassword ? 'text' : 'password'}
                        icon={showPassword ? 'visibility_off' : 'visibility'}
                        onIconClick={() => setShowPassword(!showPassword)}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className="flex items-center justify-between py-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="rounded border-[var(--color-border)] dark:border-white/10 text-[var(--color-primary)] focus:ring-[var(--color-primary)] size-4 accent-[var(--color-primary)]"
                            />
                            <span className="text-[var(--color-text-muted)] dark:text-gray-400 text-sm group-hover:text-[var(--color-primary)] transition-colors">
                                Se souvenir de moi
                            </span>
                        </label>
                        <a href="#" className="text-[var(--color-primary)] hover:underline text-sm font-semibold">
                            Mot de passe oublié ?
                        </a>
                    </div>

                    <Button
                        className="w-full h-12"
                        icon="lock"
                        isLoading={isLoading}
                        type="submit"
                    >
                        Connexion Sécurisée
                    </Button>

                    <div className="flex flex-col items-center gap-4 pt-4 border-t border-[var(--color-border)] dark:border-white/5">
                        <div className="flex items-center gap-2 bg-[var(--color-primary-light)] dark:bg-[var(--color-primary)]/5 px-4 py-1.5 rounded-full border border-[var(--color-primary)]/20">
                            <span className="material-symbols-outlined text-[var(--color-primary)] text-sm font-bold">verified_user</span>
                            <span className="text-[var(--color-primary)] text-[10px] font-bold tracking-widest uppercase">
                                Connexion Chiffrée
                            </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-muted)] dark:text-gray-500 text-center leading-relaxed">
                            Personnel médical autorisé uniquement. <br />
                            L'accès au système est enregistré et surveillé pour la sécurité.
                        </p>
                    </div>
                </form>
            </Card>

            <div className="mt-8 text-center text-[var(--color-text-muted)] dark:text-gray-500 text-[10px] space-y-1">
                <p>© 2024 CardioMed. CARDIOMED v2.4.0</p>
            </div>

            <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)]/10 via-[var(--color-primary)] to-[var(--color-primary)]/10"></div>
        </div>
    );
};
