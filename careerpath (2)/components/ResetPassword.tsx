import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, CheckCircle, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface ResetPasswordProps {
  onComplete: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false
  });

  useEffect(() => {
    setPasswordRequirements({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password)
    });
  }, [password]);

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      console.log("ResetPassword - URL Debug:", { hash, search, url: window.location.href });
      
      const isError = search.includes('error=') || hash.includes('error=');
      if (isError) {
        const params = new URLSearchParams(search || hash.substring(1));
        const errorMsg = params.get('error_description') || params.get('error');
        if (errorMsg) {
          setError(`Auth error: ${errorMsg}. Please try requesting a new reset link.`);
          return;
        }
      }

      // Try to exchange code if present (PKCE flow)
      const searchParams = new URLSearchParams(search);
      const code = searchParams.get('code');
      if (code) {
        console.log("ResetPassword - Found code in URL, attempting exchange...");
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("ResetPassword - Code exchange error:", exchangeError);
          } else if (data.session) {
            console.log("ResetPassword - Code exchange successful!");
            return;
          }
        } catch (e) {
          console.error("ResetPassword - Exception during code exchange:", e);
        }
      }

      // Try to set session if access_token is present (Implicit flow)
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        console.log("ResetPassword - Found access_token in hash, attempting to set session...");
        const refreshToken = hashParams.get('refresh_token') || '';
        try {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError) {
            console.error("ResetPassword - setSession error:", setSessionError);
          } else if (data.session) {
            console.log("ResetPassword - setSession successful!");
            return;
          }
        } catch (e) {
          console.error("ResetPassword - Exception during setSession:", e);
        }
      }
      
      // Initial check
      const { data: { session } } = await supabase.auth.getSession();
      console.log("ResetPassword - Initial session check:", session ? "Session found" : "No session");
      
      if (session) return;

      // If no session, wait and retry a few times silently
      let retries = 0;
      const maxRetries = 10;
      const retryInterval = 1000;

      const interval = setInterval(async () => {
        retries++;
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        
        if (retrySession) {
          clearInterval(interval);
        } else if (retries >= maxRetries) {
          clearInterval(interval);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.warn("ResetPassword - No session or user found after retries");
          }
        }
      }, retryInterval);

      // Also listen for auth state changes as a backup
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          clearInterval(interval);
        }
      });

      return () => {
        clearInterval(interval);
        subscription.unsubscribe();
      };
    };

    checkSession();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
    if (!allRequirementsMet) {
      setError('Please meet all password requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // Ensure we have a session before updating
      let { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("ResetPassword - No session found in handleSubmit, attempting manual recovery...");
        const hash = window.location.hash;
        const search = window.location.search;
        
        // 1. Try code exchange
        const code = new URLSearchParams(search).get('code');
        if (code) {
          const { data: exchangeData } = await supabase.auth.exchangeCodeForSession(code);
          session = exchangeData.session;
        }
        
        // 2. Try token set
        if (!session) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          if (accessToken) {
            const { data: setData } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            });
            session = setData.session;
          }
        }
        
        // 3. Final check
        if (!session) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error("Your session has expired or the link is invalid. Please request a new reset link from the login page.");
          }
        }
      }

      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      });

      if (authError) throw authError;

      setSuccess('Password updated successfully! Redirecting to login...');
      
      // Sign out to force fresh login
      await supabase.auth.signOut();
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
        <Lock className="text-white w-8 h-8" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Set New Password</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        Please enter your new password below to secure your account.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="relative text-left">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none border-transparent"
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="mt-3 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password Requirements</p>
            <div className="grid grid-cols-1 gap-2">
              <div className={`flex items-center gap-2 text-xs transition-colors ${passwordRequirements.length ? 'text-green-600' : 'text-slate-400'}`}>
                <CheckCircle className={`w-3.5 h-3.5 ${passwordRequirements.length ? 'fill-green-100' : 'opacity-20'}`} />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors ${passwordRequirements.lowercase ? 'text-green-600' : 'text-slate-400'}`}>
                <CheckCircle className={`w-3.5 h-3.5 ${passwordRequirements.lowercase ? 'fill-green-100' : 'opacity-20'}`} />
                <span>One lowercase letter (a-z)</span>
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors ${passwordRequirements.uppercase ? 'text-green-600' : 'text-slate-400'}`}>
                <CheckCircle className={`w-3.5 h-3.5 ${passwordRequirements.uppercase ? 'fill-green-100' : 'opacity-20'}`} />
                <span>One uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors ${passwordRequirements.number ? 'text-green-600' : 'text-slate-400'}`}>
                <CheckCircle className={`w-3.5 h-3.5 ${passwordRequirements.number ? 'fill-green-100' : 'opacity-20'}`} />
                <span>One number (0-9)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-left">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Confirm New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none border-transparent"
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          </div>
        </div>

        {error && (
          <div className="flex flex-col gap-3 bg-red-50 p-4 rounded-xl border border-red-100">
            <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
            {error.includes('expired') && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4"
              >
                Reload page
              </button>
            )}
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 p-3 rounded-xl border border-green-100">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Updating Password...
            </>
          ) : (
            <>
              Change Password
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
