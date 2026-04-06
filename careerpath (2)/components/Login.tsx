
import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle, UserPlus, HelpCircle, ArrowLeft, Eye, EyeOff, Smartphone, ChevronDown, Loader2 } from 'lucide-react';
import { supabase, generateNumericUserId } from '../services/supabase';

interface AuthProps {
  onLogin: (email: string, isNewUser: boolean, id?: string) => void;
  onSkip?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password';
type LoginMethod = 'email' | 'mobile';

const countryCodes = [
  { code: '+1', country: 'US', name: 'United States' },
  { code: '+1', country: 'CA', name: 'Canada' },
  { code: '+44', country: 'GB', name: 'United Kingdom' },
  { code: '+91', country: 'IN', name: 'India' },
  { code: '+61', country: 'AU', name: 'Australia' },
  { code: '+86', country: 'CN', name: 'China' },
  { code: '+81', country: 'JP', name: 'Japan' },
  { code: '+49', country: 'DE', name: 'Germany' },
  { code: '+33', country: 'FR', name: 'France' },
  { code: '+55', country: 'BR', name: 'Brazil' },
  { code: '+7', country: 'RU', name: 'Russia' },
  { code: '+971', country: 'AE', name: 'UAE' },
  { code: '+39', country: 'IT', name: 'Italy' },
  { code: '+34', country: 'ES', name: 'Spain' },
  { code: '+52', country: 'MX', name: 'Mexico' },
  { code: '+82', country: 'KR', name: 'South Korea' },
  { code: '+65', country: 'SG', name: 'Singapore' },
  { code: '+31', country: 'NL', name: 'Netherlands' },
  { code: '+46', country: 'SE', name: 'Sweden' },
  { code: '+41', country: 'CH', name: 'Switzerland' },
  { code: '+27', country: 'ZA', name: 'South Africa' },
  { code: '+20', country: 'EG', name: 'Egypt' },
  { code: '+90', country: 'TR', name: 'Turkey' },
  { code: '+54', country: 'AR', name: 'Argentina' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia' },
  { code: '+48', country: 'PL', name: 'Poland' },
  { code: '+32', country: 'BE', name: 'Belgium' },
  { code: '+47', country: 'NO', name: 'Norway' },
  { code: '+43', country: 'AT', name: 'Austria' },
  { code: '+45', country: 'DK', name: 'Denmark' },
  { code: '+30', country: 'GR', name: 'Greece' },
  { code: '+351', country: 'PT', name: 'Portugal' },
  { code: '+353', country: 'IE', name: 'Ireland' },
  { code: '+64', country: 'NZ', name: 'New Zealand' },
  { code: '+66', country: 'TH', name: 'Thailand' },
  { code: '+62', country: 'ID', name: 'Indonesia' },
  { code: '+60', country: 'MY', name: 'Malaysia' },
  { code: '+84', country: 'VN', name: 'Vietnam' },
  { code: '+63', country: 'PH', name: 'Philippines' },
  { code: '+92', country: 'PK', name: 'Pakistan' },
  { code: '+880', country: 'BD', name: 'Bangladesh' },
  { code: '+234', country: 'NG', name: 'Nigeria' },
  { code: '+254', country: 'KE', name: 'Kenya' },
  { code: '+380', country: 'UA', name: 'Ukraine' },
];

const Login: React.FC<AuthProps> = ({ onLogin, onSkip }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPasswordRequirements({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password)
    });
  }, [password]);

  // Clear all fields when switching modes or login methods
  useEffect(() => {
    setEmail('');
    setMobile('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setError('');
    setSuccess('');
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setIsTimerActive(false);
    setTimer(0);
    localStorage.removeItem('careerpath_setting_password');
  }, [mode, loginMethod]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current country object
  const currentCountry = countryCodes.find(c => c.country === selectedCountry) || countryCodes[3];

  const validateEmail = (e: string) => {
    const emailLower = e.trim().toLowerCase();
    // Strictly validate by <anything>@gmail.com pattern
    return emailLower.endsWith('@gmail.com') && emailLower.split('@')[0].length > 0;
  };

  const validateMobile = (m: string) => {
    // Strictly 10 digits
    return /^\d{10}$/.test(m);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Enforce numeric only and max 10 chars
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
    setError('');
  };

  const handleSendOtp = async () => {
    const identifier = loginMethod === 'email' ? email.trim() : mobile.trim();
    if (loginMethod === 'email' && !validateEmail(identifier)) {
      setError('Please enter a valid Gmail address (e.g., username@gmail.com).');
      setSuccess('');
      return;
    }
    if (loginMethod === 'mobile' && identifier.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      setSuccess('');
      return;
    }

    setOtpLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Check if user already exists before sending OTP in register mode
      if (mode === 'register') {
        const searchIdentifier = (loginMethod === 'email' ? identifier : `${identifier}@mobile.careerpath.com`).toLowerCase();
        
        // Optimized check with a strict timeout
        const checkPromise = supabase
          .from('user_credentials')
          .select('email')
          .eq('email', searchIdentifier)
          .maybeSingle();
        
        const checkTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database check timed out.')), 10000)
        );

        try {
          const { data: existingUser } = await Promise.race([checkPromise, checkTimeout]) as any;
          if (existingUser) {
            setError('you are already with us! just login to continue...');
            setOtpLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Existence check timed out or failed, proceeding to send OTP');
        }
      }

      // Set a flag to prevent App.tsx from redirecting when the session is created
      localStorage.setItem('careerpath_setting_password', 'true');
      
      // Create a promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OTP request timed out. Please check your connection.')), 10000)
      );

      console.log('Sending OTP to:', identifier);
      const otpPromise = supabase.auth.signInWithOtp({
        email: loginMethod === 'email' ? identifier : `${identifier}@mobile.careerpath.com`,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: 'Not Verified',
          }
        }
      });

      const { error: otpError } = await Promise.race([otpPromise, timeoutPromise]) as any;
      
      if (otpError) throw otpError;
      
      console.log('OTP sent successfully');
      setIsOtpSent(true);
      setTimer(30);
      setIsTimerActive(true);
      setSuccess('OTP sent to your email!');
    } catch (err: any) {
      localStorage.removeItem('careerpath_setting_password');
      console.error('OTP Error Detail:', err);
      let msg = err.message || 'Failed to send OTP.';
      setError(msg);
      setSuccess('');
    } finally {
      setOtpLoading(false);
      console.log('OTP process finished');
    }
  };

  const handleResendOtp = async () => {
    if (isTimerActive) return;
    
    const identifier = loginMethod === 'email' ? email.trim() : mobile.trim();
    const searchIdentifier = loginMethod === 'email' ? identifier : `${identifier}@mobile.careerpath.com`;

    setOtpLoading(true);
    setError('');
    try {
      // Create a promise that rejects after 8 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Resend request timed out.')), 10000)
      );

      const otpPromise = supabase.auth.signInWithOtp({
        email: searchIdentifier,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: 'Not Verified', // Shows in Supabase dashboard "Display name" column
          }
        }
      });

      // Race the OTP request against the timeout
      const { error: otpError } = await Promise.race([otpPromise, timeoutPromise]) as any;
      
      if (otpError) throw otpError;
      setTimer(30);
      setIsTimerActive(true);
      setSuccess('A new OTP has been sent to your email!');
    } catch (err: any) {
      console.error('Resend OTP Error:', err);
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP.');
      return;
    }
    const identifier = loginMethod === 'email' ? email.trim() : mobile.trim();
    const searchIdentifier = loginMethod === 'email' ? identifier : `${identifier}@mobile.careerpath.com`;

    setOtpLoading(true);
    setError('');
    try {
      const verifyPromise = supabase.auth.verifyOtp({
        email: searchIdentifier,
        token: otp,
        type: 'signup'
      });

      const verifyTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timed out.')), 10000)
      );

      const { error: verifyError } = await Promise.race([verifyPromise, verifyTimeout]) as any;

      if (verifyError) {
        // Try 'magiclink' if 'signup' fails, as Supabase sometimes uses magiclink type for OTP
        const retryPromise = supabase.auth.verifyOtp({
          email: searchIdentifier,
          token: otp,
          type: 'magiclink'
        });
        const { error: retryError } = await Promise.race([retryPromise, verifyTimeout]) as any;
        if (retryError) throw verifyError;
      }
      setIsOtpVerified(true);
      setSuccess('Email verified! Now set your password.');
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      let msg = 'Invalid OTP.';
      if (typeof err === 'string') msg = err;
      else if (err.message) msg = err.message;
      else if (err.error_description) msg = err.error_description;
      
      if (msg === '{}' || !msg) msg = 'Invalid or expired OTP. Please try again.';
      setError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let identifier = '';
    let loginEmail = '';
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();

    if (loginMethod === 'email') {
      if (!validateEmail(trimmedEmail)) {
        setError('Please enter a valid Gmail address (e.g., username@gmail.com).');
        return;
      }
      identifier = trimmedEmail;
      loginEmail = trimmedEmail;
    } else {
      if (!validateMobile(trimmedMobile)) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      identifier = `${currentCountry.code} ${trimmedMobile}`;
      loginEmail = `${trimmedMobile}@mobile.careerpath.com`;
    }

    setIsLoading(true);
    const startTime = Date.now();
    localStorage.setItem('careerpath_login_delay', 'true');

    try {
      // 1. Validation checks before the delay
      if (mode === 'login') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsLoading(false);
          localStorage.removeItem('careerpath_login_delay');
          return;
        }
      } else if (mode === 'register') {
        if (!isOtpVerified) {
          setError('Please verify your email with OTP first.');
          setIsLoading(false);
          localStorage.removeItem('careerpath_login_delay');
          return;
        }
        
        const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
        if (!allRequirementsMet) {
          setError('Please meet all password requirements.');
          setIsLoading(false);
          localStorage.removeItem('careerpath_login_delay');
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          localStorage.removeItem('careerpath_login_delay');
          return;
        }
      }

      // 2. Actual Authentication
      if (mode === 'login') {
        // Check if user exists in our records first for better UX
        const checkPromise = supabase
          .from('user_credentials')
          .select('email')
          .ilike('email', loginEmail)
          .maybeSingle();
        
        const checkTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User check timed out.')), 10000)
        );

        try {
          const { data: existingUser, error: checkError } = await Promise.race([checkPromise, checkTimeout]) as any;
          
          if (checkError) {
            console.error('Error checking user existence:', checkError);
          } else if (!existingUser) {
            setError('We couldn’t find an account with this identifier. Please register first.');
            setIsLoading(false);
            localStorage.removeItem('careerpath_login_delay');
            return;
          }
        } catch (e) {
          console.warn('User existence check timed out, proceeding to login attempt');
        }

        const loginPromise = supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password,
        });

        const loginTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login request timed out.')), 10000)
        );

        const { error: authError } = await Promise.race([loginPromise, loginTimeout]) as any;

        if (authError) throw authError;

        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timed out.')), 10000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]) as any;
        const userId = session?.user?.id;
        const numericId = userId ? generateNumericUserId(userId) : null;
        const metadata = session?.user?.user_metadata;        // Save to combined user_credentials table for easy viewing in Table Editor
        try {
          if (numericId) {
            const upsertPromise = supabase.from('user_credentials').upsert({
              id: numericId,
              email: loginEmail,
              password: password,
              full_name: metadata?.full_name || (identifier.includes('@') ? identifier.split('@')[0] : 'User'),
              avatar: metadata?.avatar_url,
              qualification: metadata?.qualification || 'Undergraduate',
              created_at: session?.user?.created_at || new Date().toISOString(),
              last_login: new Date().toISOString()
            });

            const upsertTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database update timed out.')), 10000)
            );

            await Promise.race([upsertPromise, upsertTimeout]);
          }
        } catch (e) {
          console.warn("Could not save to user_credentials table. Make sure you ran the SQL script.", e);
        }
        
        // Update metadata as well if it was previously "Not Verified"
        try {
          const updatePromise = metadata?.full_name === 'Not Verified' 
            ? supabase.auth.updateUser({
                data: { 
                  full_name: 'Verified User',
                  last_used_password: password 
                }
              })
            : supabase.auth.updateUser({
                data: { last_used_password: password }
              });

          const updateTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth metadata update timed out.')), 10000)
          );

          await Promise.race([updatePromise, updateTimeout]);
        } catch (e) {
          console.warn("Could not update auth metadata:", e);
        }
        
        onLogin(identifier, false, userId);
      } else if (mode === 'register') {
        // Double check existence one last time with a fast timeout
        try {
          const searchIdentifier = loginEmail;
          
          // 1. Fast check against user_credentials table
          const checkPromise = supabase
            .from('user_credentials')
            .select('email')
            .eq('email', searchIdentifier)
            .maybeSingle();
          
          const checkTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 5000)
          );
          
          try {
            const { data: existingUser } = await Promise.race([checkPromise, checkTimeout]) as any;
            if (existingUser) {
              setError('you are already with us! just login to continue...');
              setIsLoading(false);
              localStorage.removeItem('careerpath_login_delay');
              return;
            }
          } catch (e) {
            console.warn('Final table check timed out or failed, proceeding with registration');
          }
        } catch (e) {
          console.warn('Final existence check logic failed:', e);
        }

        // Since verifyOtp logs the user in, we just update the password and metadata
        const updatePromise = supabase.auth.updateUser({
          password: password,
          data: { 
            registration_password: password,
            full_name: 'Verified User' // Update status in Supabase dashboard
          }
        });

        const updateTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update timed out. Please check your connection.')), 10000)
        );

        const { error: authError } = await Promise.race([updatePromise, updateTimeout]) as any;
        if (authError) throw authError;

        // Get the session to get the user ID
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timed out.')), 10000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]) as any;
        const userId = session?.user?.id;
        const numericId = userId ? generateNumericUserId(userId) : null;
        
        // Save to combined user_credentials table for easy viewing in Table Editor
        try {
          if (numericId) {
            const upsertPromise = supabase.from('user_credentials').upsert({
              id: numericId,
              email: loginEmail,
              password: password,
              full_name: session?.user?.user_metadata?.full_name || (identifier.includes('@') ? identifier.split('@')[0] : 'User'),
              avatar: session?.user?.user_metadata?.avatar_url,
              qualification: session?.user?.user_metadata?.qualification || 'Undergraduate',
              created_at: session?.user?.created_at || new Date().toISOString(),
              last_login: new Date().toISOString()
            });

            const upsertTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database update timed out.')), 10000)
            );

            await Promise.race([upsertPromise, upsertTimeout]);
          }
        } catch (e) {
          console.warn("Could not save to user_credentials table. Make sure you ran the SQL script.", e);
        }
        
        setSuccess('Registration complete!');
        localStorage.removeItem('careerpath_login_delay');
        localStorage.removeItem('careerpath_setting_password');
        
        // Use loginEmail instead of email state to ensure synthetic mobile emails are passed correctly
        onLogin(loginEmail, true, userId);
      } else if (mode === 'forgot-password') {
        const resetPromise = supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: `${window.location.origin}/?recovery=true`,
        });

        const resetTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Reset request timed out.')), 10000)
        );

        const { error: authError } = await Promise.race([resetPromise, resetTimeout]) as any;
        if (authError) throw authError;

        const elapsed = Date.now() - startTime;
        const targetDelay = 2000 + Math.random() * 1000;
        if (elapsed < targetDelay) {
          await new Promise(resolve => setTimeout(resolve, targetDelay - elapsed));
        }

        const contactType = loginMethod === 'email' ? 'email' : 'mobile number';
        setSuccess(`Reset instructions sent to your ${contactType}!`);
        setTimeout(() => setMode('login'), 2500);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      
      let msg = 'An error occurred during authentication.';
      if (typeof err === 'string') msg = err;
      else if (err.message) msg = err.message;
      else if (err.error_description) msg = err.error_description;
      
      if (msg === '{}' || !msg) msg = 'Authentication failed. Please check your credentials and try again.';
      setError(msg);
    } finally {
      localStorage.removeItem('careerpath_login_delay');
      setIsLoading(false);
    }
  };

  const renderHeader = () => {
    switch (mode) {
      case 'register':
        return {
          title: 'Join CareerPath',
          subtitle: 'Create an account to start your professional journey.',
          icon: <UserPlus className="text-white w-8 h-8" />,
          color: 'bg-indigo-600'
        };
      case 'forgot-password':
        return {
          title: 'Reset Password',
          subtitle: `Enter your ${loginMethod === 'email' ? 'email' : 'mobile number'} and we'll send you instructions.`,
          icon: <HelpCircle className="text-white w-8 h-8" />,
          color: 'bg-amber-500'
        };
      default:
        return {
          title: 'Welcome to CareerPath',
          subtitle: 'Sign in to access your career insights.',
          icon: <Lock className="text-white w-8 h-8" />,
          color: 'bg-blue-600'
        };
    }
  };

  const header = renderHeader();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center animate-in fade-in duration-500">
      <div className={`w-16 h-16 ${header.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 transition-colors duration-300`}>
        {header.icon}
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2 transition-all">{header.title}</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        {header.subtitle}
      </p>

      {/* Login Method Toggle */}
      {mode !== 'forgot-password' && (
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-full max-w-[280px] mx-auto relative">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 z-10 ${
              loginMethod === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('mobile')}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 z-10 ${
              loginMethod === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Mobile
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* Identifier Field (Email or Mobile) */}
        <div className="relative text-left animate-in slide-in-from-bottom-2 duration-300" key={loginMethod}>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">
            {loginMethod === 'email' ? 'Email Address' : 'Mobile Number'}
          </label>
          
          {loginMethod === 'email' ? (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="name@gmail.com"
                  disabled={isLoading || otpLoading || isOtpSent}
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none ${
                    error && !validateEmail(email) ? 'border-red-400' : 'border-transparent'
                  }`}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                {email.toLowerCase().endsWith('@gmail.com') && email.split('@')[0].length > 0 && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                )}
              </div>

              {mode === 'register' && !isOtpVerified && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  {!isOtpSent ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || !validateEmail(email)}
                          className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification OTP'}
                        </button>

                      </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                          placeholder="Enter 6-digit OTP"
                          disabled={otpLoading}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-center tracking-[0.5em] font-bold text-lg"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || otp.length !== 6}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify OTP'}
                      </button>

                      <div className="flex flex-col items-center gap-2 pt-1">
                        {isTimerActive ? (
                          <p className="text-xs text-slate-500 font-medium">
                            Resend OTP in <span className="text-blue-600 font-bold">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={otpLoading}
                            className="text-xs text-blue-600 font-bold hover:underline transition-all"
                          >
                            Resend OTP
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => { setIsOtpSent(false); setOtp(''); setIsTimerActive(false); }}
                          className="text-[10px] text-slate-400 font-medium hover:text-slate-600 uppercase tracking-wider"
                        >
                          Change Email
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center z-20">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-lg transition-colors group"
                >
                  <img 
                    src={`https://flagcdn.com/w40/${currentCountry.country.toLowerCase()}.png`}
                    alt={currentCountry.country}
                    className="w-6 h-4 object-cover rounded-sm shadow-sm"
                  />
                  <span className="font-bold text-slate-700">{currentCountry.code}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-2"></div>
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {countryCodes.map((c) => (
                    <button
                      key={c.country}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c.country);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-50 last:border-0"
                    >
                      <img 
                        src={`https://flagcdn.com/w40/${c.country.toLowerCase()}.png`}
                        alt={c.country}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm shrink-0"
                      />
                      <span className="text-slate-700 font-medium text-sm flex-1 truncate">{c.name}</span>
                      <span className="text-slate-400 text-sm font-mono font-bold">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}

              <input
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                maxLength={10}
                disabled={isLoading}
                placeholder="00000 00000"
                className={`w-full pl-[130px] pr-12 py-4 bg-slate-50 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none ${
                  error && !validateMobile(mobile) ? 'border-red-400' : 'border-transparent'
                }`}
              />

              {validateMobile(mobile) && (
                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
              )}
            </div>
          )}
        </div>

        {/* Password Fields (Login/Register) */}
        {mode !== 'forgot-password' && (mode === 'login' || isOtpVerified) && (
          <div className="relative text-left animate-in slide-in-from-top-2 duration-300">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                disabled={isLoading}
                placeholder="••••••••"
                className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none border-transparent`}
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
            
            {mode === 'register' && (
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
            )}
          </div>
        )}

        {/* Confirm Password (Register Only) */}
        {mode === 'register' && isOtpVerified && (
          <div className="relative text-left animate-in slide-in-from-top-2 duration-300">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                disabled={isLoading}
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none border-transparent`}
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm font-medium animate-bounce">{error}</p>}
        {success && <p className="text-green-600 text-sm font-medium bg-green-50 py-2 rounded-lg border border-green-100">{success}</p>}

        <button
          type="submit"
          disabled={isLoading || (mode === 'register' && !isOtpVerified)}
          className={`w-full ${header.color} hover:opacity-90 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-lg ${isLoading || (mode === 'register' && !isOtpVerified) ? 'opacity-80 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {mode === 'login' ? 'Logging in...' : mode === 'register' ? 'Creating account...' : 'Sending link...'}
            </>
          ) : (
            <>
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="pt-4 flex flex-col gap-3">
          {mode === 'login' ? (
            <>
              <div className="flex items-center justify-center">
                <button 
                  type="button" 
                  onClick={() => setMode('forgot-password')}
                  disabled={isLoading}
                  className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
              <div className="h-px bg-slate-100 w-full my-2" />
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setMode('register')}
                  disabled={isLoading}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Register now
                </button>
              </p>
            </>
          ) : (
            <button 
              type="button" 
              onClick={() => setMode('login')}
              className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          )}
        </div>
      </form>

      <div className="mt-12 grid grid-cols-3 gap-8 text-slate-400">
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-bold text-slate-700">10k+</span>
          <span className="text-xs">Profiles</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-bold text-slate-700">95%</span>
          <span className="text-xs">Accuracy</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-bold text-slate-700">AES-256</span>
          <span className="text-xs">Secure</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
