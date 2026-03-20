import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      const handleLogin = async () => {
        try {
          await loginWithTokens(accessToken, refreshToken);
          toast.success('Signed in successfully!');
          navigate('/dashboard');
        } catch (err) {
          console.error('OAuth login failed', err);
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
        }
      };
      handleLogin();
    } else {
      toast.error('Login failed. No tokens found.');
      navigate('/login');
    }
  }, [searchParams, loginWithTokens, navigate]);

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-medium">Completing sign-in...</span>
      </div>
    </div>
  );
}
