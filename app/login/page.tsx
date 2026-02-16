'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Eye, EyeOff, Cpu, Zap, Terminal, Sparkles } from 'lucide-react';

// Pre-generate particle positions to avoid hydration mismatch
const PARTICLE_POSITIONS = [
    { left: 35.63, top: 75.17, delay: 1.48, duration: 6.80 },
    { left: 48.83, top: 15.69, delay: 3.37, duration: 6.69 },
    { left: 13.92, top: 34.44, delay: 2.64, duration: 3.83 },
    { left: 51.45, top: 92.09, delay: 2.37, duration: 3.66 },
    { left: 18.26, top: 22.95, delay: 1.08, duration: 4.18 },
    { left: 27.93, top: 90.04, delay: 1.64, duration: 6.69 },
    { left: 90.46, top: 86.40, delay: 2.99, duration: 5.92 },
    { left: 92.11, top: 54.41, delay: 2.57, duration: 4.77 },
    { left: 5.31, top: 97.50, delay: 3.73, duration: 4.31 },
    { left: 87.81, top: 65.55, delay: 0.50, duration: 3.07 },
    { left: 26.98, top: 25.28, delay: 4.72, duration: 5.41 },
    { left: 52.41, top: 27.80, delay: 3.31, duration: 6.96 },
    { left: 71.03, top: 66.08, delay: 2.52, duration: 5.75 },
    { left: 29.26, top: 65.83, delay: 2.89, duration: 4.01 },
    { left: 39.19, top: 32.53, delay: 2.40, duration: 5.31 },
    { left: 98.24, top: 70.48, delay: 1.76, duration: 4.94 },
    { left: 0.19, top: 73.34, delay: 1.82, duration: 5.95 },
    { left: 45.85, top: 92.16, delay: 1.48, duration: 6.72 },
    { left: 82.95, top: 76.42, delay: 4.86, duration: 4.63 },
    { left: 46.11, top: 98.90, delay: 3.05, duration: 6.23 },
];

export default function LoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/');
                router.refresh();
            } else {
                setError(data.error || 'Invalid password');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-base">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(var(--grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--grid-color)_1px,transparent_1px)] bg-[size:50px_50px]" />

                {/* Animated gradient orbs */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent-purple/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-cyan/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-pink/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {PARTICLE_POSITIONS.map((pos, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-accent-purple/40 rounded-full float"
                            style={{
                                left: `${pos.left}%`,
                                top: `${pos.top}%`,
                                animationDelay: `${pos.delay}s`,
                                animationDuration: `${pos.duration}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Login card */}
            <div
                className={`relative w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
            >
                {/* Glow effect behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-accent-purple/20 via-accent-cyan/20 to-accent-pink/20 rounded-3xl blur-xl" />

                <div className="relative bg-base-elevated/80 backdrop-blur-xl border border-border-subtle rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        {/* Animated icon */}
                        <div className="relative inline-flex items-center justify-center mb-6">
                            {/* Outer rings */}
                            <div className="absolute w-24 h-24 rounded-full border border-accent-purple/30 animate-[spin_8s_linear_infinite]" />
                            <div className="absolute w-20 h-20 rounded-full border border-accent-cyan/30 animate-[spin_6s_linear_infinite_reverse]" />
                            <div className="absolute w-16 h-16 rounded-full border border-accent-pink/30 animate-[spin_4s_linear_infinite]" />

                            {/* Inner glow */}
                            <div className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 blur-md" />

                            {/* Icon */}
                            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-purple/25">
                                <Cpu className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Title with gradient */}
                        <h1 className="text-3xl font-bold mb-2">
                            <span className="gradient-text">Mission Control</span>
                        </h1>

                        {/* Subtitle with typing effect */}
                        <div className="flex items-center justify-center gap-2 text-content-muted">
                            <Terminal className="w-4 h-4 text-accent-purple" />
                            <span className="text-sm font-mono">Renoa's AI Command Center</span>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <div className="flex items-center gap-1.5 text-xs text-content-muted">
                                <span className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
                                <span>System Ready</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-content-muted">
                                <Zap className="w-3 h-3 text-accent-cyan" />
                                <span>AI Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative group">
                            {/* Input glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-purple/0 via-accent-purple/50 to-accent-cyan/0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter access code"
                                    className="w-full pl-11 pr-11 py-3.5 bg-base-surface border border-border-subtle rounded-xl
                           text-content-primary placeholder-content-muted font-mono
                           focus:outline-none focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/20
                           transition-all duration-300"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted 
                           hover:text-content-secondary transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-status-error/10 border border-status-error/20 
                            flex items-center gap-2 animate-fadeIn">
                                <div className="w-2 h-2 rounded-full bg-status-error animate-pulse" />
                                <p className="text-sm text-status-error">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="relative w-full py-3.5 px-4 rounded-xl font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300 group overflow-hidden"
                        >
                            {/* Button gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-pink 
                            opacity-100 group-hover:opacity-90 transition-opacity" />

                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                            -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                            {/* Content */}
                            <span className="relative flex items-center justify-center gap-2 text-white">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Access Dashboard</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-border-subtle">
                        <div className="flex items-center justify-center gap-2 text-xs text-content-muted">
                            <span className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
                            <span className="font-mono">OpenClaw AI Framework</span>
                        </div>
                        <p className="text-center text-xs text-content-muted mt-2">
                            Secure access • End-to-end encrypted
                        </p>
                    </div>
                </div>

                {/* Bottom decoration */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-accent-purple/50 rounded-full" />
                    <div className="w-2 h-2 rounded-full bg-accent-purple/50" />
                    <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-accent-purple/50 rounded-full" />
                </div>
            </div>
        </div>
    );
}
