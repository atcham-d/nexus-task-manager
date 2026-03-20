import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BackgroundBoxes } from '../components/BackgroundBoxes';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleGoogleRegister = () => {
    window.location.href = `${API_URL}/api/v1/auth/google`;
  };

  const pwChecks = [
    { label: '8+ characters', ok: form.password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(form.password) },
    { label: 'Lowercase', ok: /[a-z]/.test(form.password) },
    { label: 'Number', ok: /\d/.test(form.password) },
    { label: 'Special char', ok: /[@$!%*?&]/.test(form.password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs?.length) toast.error(errs[0].msg);
      else toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Left panel - Hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-surface-950 border-r border-surface-900 p-12 relative overflow-hidden">
        <BackgroundBoxes />
        
        <div className="relative z-20 flex items-center gap-2.5">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/20">NX</div>
          <span className="text-slate-100 font-bold text-xl tracking-tight">Nexus</span>
        </div>

        <div className="relative z-20">
          <h1 className="text-5xl font-bold text-white leading-[1.1] mb-6 whitespace-pre-line text-balance">
            Join the{'\n'}
            <span className="text-brand-400">Future of Work.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Clarity over chaos. Nexus keeps your team aligned, your deadlines visible, and your priorities sharp.
          </p>
        </div>

        <div className="relative z-20 flex items-center gap-6 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Centralized Tasks
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Real-time Sync
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-950">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">NX</div>
            <span className="text-slate-100 font-semibold">Nexus</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Create account</h2>
            <p className="text-slate-400 mt-1 text-sm">Join Nexus Task Manager</p>
          </div>

          <button onClick={handleGoogleRegister} className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-2.5 card hover:bg-surface-800 transition-all text-sm font-medium text-slate-200">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-surface-700" />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px bg-surface-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
              <input type="text" required className="input" placeholder="Disha Sharma"
                value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required className="input pr-10" placeholder="Min 8 chars"
                  value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pwChecks.map(({ label, ok }) => (
                    <span key={label} className={`badge ${ok ? 'bg-green-500/10 text-green-400' : 'bg-surface-800 text-slate-500'}`}>
                      {ok ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm password</label>
              <input type={showPass ? 'text' : 'password'} required className="input" placeholder="Repeat password"
                value={form.confirm} onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))} />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2" disabled={loading}>
              {loading ? <><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />Creating account...</> : 'Create account →'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
          <p className="text-center text-slate-600 text-[10px] mt-12 font-medium tracking-widest uppercase">
            © 2025 Nexus. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
