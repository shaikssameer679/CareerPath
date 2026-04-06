import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { AppState, User, SurveyData, CareerSuggestion, SavedRoadmap, ChatSession, Message } from './types';
import Login from './components/Login';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './components/Dashboard';
import CareerExplorer from './components/CareerExplorer';
import RoadmapCatalog from './components/RoadmapCatalog';
import ResultView from './components/ResultView';
import SavedRoadmapsList from './components/SavedRoadmapsList';
import AIChat from './components/AIChat';
import MultiStepSurvey from './components/MultiStepSurvey';
import ResetPassword from './components/ResetPassword';
import ProfileSidebar from './components/ProfileSidebar';
import { LogOut, AlertCircle, X, Loader2, RefreshCw, Trash2, User as UserIcon } from 'lucide-react';
import { supabase, generateNumericUserId, generate12DigitId } from './services/supabase';

// Set this to true to show the "Delete Account & Data" button on the dashboard
const SHOW_DELETE_BUTTON = true;

// Error Boundary Component
class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              The application encountered an unexpected error. This might be due to API limits or a temporary connection issue.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Application
              </button>
              <button 
                // @ts-ignore
                onClick={() => this.setState({ hasError: false })}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
              >
                Try to Recover
              </button>
            </div>
          </div>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('type=recovery') || search.includes('recovery=true') || search.includes('type=recovery')) {
      return AppState.RESET_PASSWORD;
    }
    return AppState.LOGIN;
  });
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  
  // Keep userRef in sync with user state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const isUpdatingProfileRef = useRef(false);
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
  const [savedChats, setSavedChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<CareerSuggestion | null>(null);
  const [isExplorerMode, setIsExplorerMode] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [isSurveyResult, setIsSurveyResult] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const isRecoveringRef = useRef(
    window.location.hash.includes('type=recovery') || 
    window.location.search.includes('recovery=true') || 
    window.location.search.includes('type=recovery')
  );

  const [surveyData, setSurveyData] = useState<SurveyData>({
    qualification: 'Not specified',
    interests: 'Not specified',
    hobbies: 'Not specified',
    knowledge: 'Not specified'
  });

  const dashboardScrollPos = useRef<number>(0);
  const previousState = useRef<AppState>(AppState.LOGIN);

  useLayoutEffect(() => {
    if (previousState.current === AppState.DASHBOARD) {
      dashboardScrollPos.current = window.scrollY;
    }

    if (currentState === AppState.DASHBOARD) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: dashboardScrollPos.current,
          behavior: 'auto'
        });
      });
    } else {
      window.scrollTo(0, 0);
    }

    previousState.current = currentState;
  }, [currentState]);

  useEffect(() => {
    const handleRecoveryCheck = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const url = window.location.href;
      
      console.log("Full URL check:", url);
      console.log("Hash:", hash);
      console.log("Search:", search);

      const isRecovery = hash.includes('type=recovery') || 
                        search.includes('recovery=true') || 
                        search.includes('type=recovery') || 
                        search.includes('code=') ||
                        (hash.includes('access_token=') && hash.includes('type=recovery'));
      
      const isError = search.includes('error=') || hash.includes('error=');
      if (isError) {
        const params = new URLSearchParams(search || hash.substring(1));
        const errorMsg = params.get('error_description') || params.get('error');
        if (errorMsg) {
          console.error("Auth error from URL:", errorMsg);
          if (errorMsg.includes('expired')) {
            alert("Your password reset link has expired. Please request a new one.");
            window.location.href = window.location.origin;
            return false;
          }
        }
      }
      
      if (isRecovery) {
        console.log("Recovery mode detected from URL flags");
        isRecoveringRef.current = true;
        if (currentState !== AppState.RESET_PASSWORD) {
          setCurrentState(AppState.RESET_PASSWORD);
        }
        return true;
      }
      return false;
    };

    // Initial check
    const wasRecovery = handleRecoveryCheck();

    // Listen for hash changes
    window.addEventListener('hashchange', handleRecoveryCheck);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, "User:", session?.user?.email, "IsRecoveringRef:", isRecoveringRef.current);
      
      // Re-check URL on every auth event just in case
      const isRecoveryUrl = window.location.hash.includes('type=recovery') || 
                           window.location.search.includes('recovery=true') || 
                           window.location.search.includes('type=recovery');
      
      if (event === 'PASSWORD_RECOVERY' || isRecoveryUrl) {
        console.log("Password recovery mode active");
        isRecoveringRef.current = true;
        if (currentState !== AppState.RESET_PASSWORD) {
          setCurrentState(AppState.RESET_PASSWORD);
        }
        // Don't return here, let it update the user state if session is present
      }

      if (isRecoveringRef.current && !session?.user) {
        console.log("Currently in recovery mode, but no session yet. Staying in RESET_PASSWORD state.");
        if (currentState !== AppState.RESET_PASSWORD) {
          setCurrentState(AppState.RESET_PASSWORD);
        }
        return;
      }

      if (session?.user) {
        // Skip if we are currently updating the profile manually
        if (isUpdatingProfileRef.current) {
          console.log("Profile update in progress, skipping auth listener update");
          return;
        }

        if (localStorage.getItem('careerpath_setting_password') === 'true' || 
            localStorage.getItem('careerpath_login_delay') === 'true') {
          return;
        }

        const email = session.user.email || '';
        const metadata = session.user.user_metadata;
        const numericId = generateNumericUserId(session.user.id);

        // Try to get data from user_credentials table as it's more reliable for large avatars
        let dbName = metadata?.full_name;
        let dbAvatar = metadata?.avatar_url;
        let dbQualification = metadata?.qualification;

        try {
          const credPromise = supabase
            .from('user_credentials')
            .select('full_name, avatar, qualification')
            .eq('id', numericId)
            .single();
          
          const credTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Credentials fetch timed out.')), 10000)
          );

          const { data: credentials, error: credError } = await Promise.race([credPromise, credTimeout]) as any;
          
          if (!credError && credentials) {
            console.log("Found credentials in DB:", credentials);
            dbName = credentials.full_name || dbName;
            dbAvatar = credentials.avatar || dbAvatar;
            dbQualification = credentials.qualification || dbQualification;
          } else if (credError) {
            console.error("Cred error in auth listener:", credError);
            // If we have a timeout or error, but we already have a user in state, 
            // don't overwrite with potentially stale metadata
            if (userRef.current && userRef.current.id === session.user.id && userRef.current.avatar && !dbAvatar) {
              console.log("Fetch failed but we have local avatar, keeping it.");
              dbAvatar = userRef.current.avatar;
            }
          }
        } catch (e: any) {
          console.error("Exception in auth listener credentials fetch:", e);
          // On timeout/exception, try to preserve existing avatar if it's the same user
          if (userRef.current && userRef.current.id === session.user.id && userRef.current.avatar && !dbAvatar) {
            dbAvatar = userRef.current.avatar;
          }
        }
        
        // Update user data
        const updatedUser: User = { 
          id: session.user.id,
          numericId,
          email, 
          name: dbName || (email.includes('@') ? email.split('@')[0] : 'User'), 
          avatar: dbAvatar,
          qualification: dbQualification || 'Undergraduate' 
        };
        
        setUser(prev => {
          // Only update if data is actually different to prevent unnecessary re-renders
          if (prev && 
              prev.name === updatedUser.name && 
              prev.avatar === updatedUser.avatar && 
              prev.qualification === updatedUser.qualification &&
              prev.id === updatedUser.id) {
            return prev;
          }
          return updatedUser;
        });

        // If we were in login state, move to dashboard
        if (currentState === AppState.LOGIN && !isRecoveringRef.current) {
          setCurrentState(AppState.DASHBOARD);
        }
      } else {
        // No user session
        if (!isRecoveringRef.current) {
          setUser(null);
          if (currentState !== AppState.LOGIN) {
            setCurrentState(AppState.LOGIN);
          }
        } else {
          console.log("No session in recovery mode, waiting for session to be established...");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleRecoveryCheck);
    };
  }, [currentState]);

  useEffect(() => {
    if (!user?.id) {
      setSavedRoadmaps([]);
      setSavedChats([]);
      setActiveChatId(null);
      setActiveSuggestion(null);
      setSurveyData({
        qualification: 'Not specified',
        interests: 'Not specified',
        hobbies: 'Not specified',
        knowledge: 'Not specified'
      });
      setIsDataLoaded(false);
      return;
    }

    const userId = user.id;
    const email = user.email;
    
    // Migration logic: Check for ID-based key first, then fallback to email-based key
    let storedRoadmaps = localStorage.getItem(`careerpath_saved_roadmaps_${userId}`);
    if (!storedRoadmaps && email) {
      storedRoadmaps = localStorage.getItem(`careerpath_saved_roadmaps_${email}`);
      // If we found it by email, we'll save it by ID later in the other useEffect
    }

    if (storedRoadmaps) {
      try {
        const parsed = JSON.parse(storedRoadmaps);
        if (Array.isArray(parsed)) setSavedRoadmaps(parsed);
        else setSavedRoadmaps([]);
      } catch (e) { 
        console.error("Failed to parse saved roadmaps", e); 
        setSavedRoadmaps([]);
      }
    } else {
      setSavedRoadmaps([]);
    }

    let storedChats = localStorage.getItem(`careerpath_saved_chats_${userId}`);
    if (!storedChats && email) {
      storedChats = localStorage.getItem(`careerpath_saved_chats_${email}`);
    }

    if (storedChats) {
      try {
        const parsed = JSON.parse(storedChats);
        if (Array.isArray(parsed)) setSavedChats(parsed);
        else setSavedChats([]);
      } catch (e) { 
        console.error("Failed to parse saved chats", e); 
        setSavedChats([]);
      }
    } else {
      setSavedChats([]);
    }

    setIsDataLoaded(true);
  }, [user?.id, user?.email]);

  // Fetch data from Supabase on login
  useEffect(() => {
    const fetchSupabaseData = async () => {
      if (!user?.id || !isDataLoaded) return;
      
      try {
        // Fetch Roadmaps
        const { data: roadmaps, error: rError } = await supabase
          .from('saved_roadmaps')
          .select('data')
          .eq('user_id', user.numericId);
        
        if (!rError && roadmaps && roadmaps.length > 0) {
          const parsedRoadmaps = roadmaps.map(r => r.data);
          setSavedRoadmaps(prev => {
            const merged = [...prev];
            parsedRoadmaps.forEach(remote => {
              if (!merged.some(local => local.id === remote.id)) {
                merged.push(remote);
              }
            });
            return merged.sort((a, b) => b.id - a.id);
          });
        }

        // Fetch Chats
        const { data: chats, error: cError } = await supabase
          .from('saved_chats')
          .select('data')
          .eq('user_id', user.numericId);
        
        if (!cError && chats && chats.length > 0) {
          const parsedChats = chats.map(c => c.data);
          setSavedChats(prev => {
            const merged = [...prev];
            parsedChats.forEach(remote => {
              if (!merged.some(local => local.id === remote.id)) {
                merged.push(remote);
              }
            });
            return merged.sort((a, b) => b.id - a.id);
          });
        }
      } catch (e) {
        console.error("Error fetching from Supabase:", e);
      }
    };

    if (user?.id && isDataLoaded) {
      fetchSupabaseData();
    }
  }, [user?.id, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded && user?.id) {
      localStorage.setItem(`careerpath_saved_roadmaps_${user.id}`, JSON.stringify(savedRoadmaps));
      // Clean up old email-based key if it exists
      if (user.email) {
        localStorage.removeItem(`careerpath_saved_roadmaps_${user.email}`);
      }
    }
  }, [savedRoadmaps, isDataLoaded, user?.id, user?.email]);

  useEffect(() => {
    if (isDataLoaded && user?.id) {
      const validChats = savedChats.filter(chat => 
        !(chat.title === 'new chat' && chat.messages.length <= 1)
      );
      localStorage.setItem(`careerpath_saved_chats_${user.id}`, JSON.stringify(validChats));
      // Clean up old email-based key if it exists
      if (user.email) {
        localStorage.removeItem(`careerpath_saved_chats_${user.email}`);
      }
    }
  }, [savedChats, isDataLoaded, user?.id, user?.email]);

  const handleLogin = async (email: string, isNewUser: boolean, id?: string) => {
    if (isNewUser) {
      const numericId = id ? generateNumericUserId(id) : undefined;
      setUser(prev => ({ ...prev, email, id: id || prev?.id, numericId }));
      setCurrentState(AppState.PROFILE_SETUP);
    } else {
      const name = email.includes('@') ? email.split('@')[0] : 'User';
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const userId = id || user?.id;
      const numericId = userId ? generateNumericUserId(userId) : undefined;
      
      const userData: User = { 
        email, 
        id: userId,
        numericId,
        name: user?.name || formattedName, 
        qualification: user?.qualification || 'Undergraduate' 
      };
      setUser(userData);
      setSurveyData(prev => ({ ...prev, qualification: userData.qualification }));
      
      // Save profile to Supabase
      if (userData.id && userData.numericId) {
        try {
          const upsertPromise = supabase.from('user_credentials').upsert({
            id: userData.numericId,
            email: userData.email,
            full_name: userData.name,
            qualification: userData.qualification,
            last_login: new Date().toISOString()
          });

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile update timed out.')), 10000)
          );

          await Promise.race([upsertPromise, timeoutPromise]);
        } catch (e) {
          console.error("Error saving profile to Supabase", e);
        }
      }
      
      setCurrentState(AppState.DASHBOARD);
    }
  };

  const handleSkipLogin = () => {
    setUser({ email: 'guest@careerpath.ai', name: 'Guest User', qualification: 'None' });
    setCurrentState(AppState.DASHBOARD);
  };

  const handleProfileComplete = async (name: string, avatar: string, qualification: string) => {
    console.log("Starting profile update...", { name, qualification, avatarLength: avatar?.length });
    isUpdatingProfileRef.current = true;
    
    try {
      // 1. Get the current user session to be absolutely sure we have the ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.error("Session error:", sessionError);
      
      const userId = session?.user?.id || user?.id;
      
      if (!userId) {
        console.error("No user ID found for profile update");
        return;
      }

      const numericId = generateNumericUserId(userId);
      const userEmail = session?.user?.email || user?.email || '';

      // 2. Update local state IMMEDIATELY for responsive UI (Optimistic Update)
      console.log("Optimistically updating local user state...");
      setUser(prev => {
        const baseUser = prev || { id: userId, email: userEmail } as User;
        return {
          ...baseUser,
          id: userId,
          numericId,
          email: userEmail,
          name, 
          avatar, 
          qualification 
        } as User;
      });
      
      setSurveyData(prev => ({ ...prev, qualification }));

      // 3. Update user_credentials table (more reliable than metadata for large data)
      try {
        console.log("Updating user_credentials table for ID:", numericId);
        
        const credentialsData: any = {
          id: numericId,
          email: userEmail,
          full_name: name,
          qualification: qualification,
          last_login: new Date().toISOString()
        };

        // Only include avatar if it exists
        if (avatar) {
          credentialsData.avatar = avatar;
        }

        const { data: upsertData, error: upsertError } = await supabase
          .from('user_credentials')
          .upsert(credentialsData)
          .select();
        
        if (upsertError) {
          console.error("Error updating user_credentials in Supabase:", upsertError);
          // Fallback without avatar if the column doesn't exist or data is too large
          const { error: fallbackError } = await supabase.from('user_credentials').upsert({
            id: numericId,
            email: userEmail,
            full_name: name,
            qualification: qualification,
            last_login: new Date().toISOString()
          });
          if (fallbackError) console.error("Fallback credentials upsert also failed:", fallbackError);
        } else {
          console.log("user_credentials table updated successfully:", upsertData);
        }
      } catch (e: any) {
        console.error("Exception updating user_credentials:", e);
        // If we get "Failed to fetch", retry without avatar
        if (e?.message === 'Failed to fetch' || (e instanceof Error && e.message === 'Failed to fetch')) {
          console.log("Caught 'Failed to fetch' in credentials upsert, retrying without avatar...");
          try {
            await supabase.from('user_credentials').upsert({
              id: numericId,
              email: userEmail,
              full_name: name,
              qualification: qualification,
              last_login: new Date().toISOString()
            });
          } catch (retryError) {
            console.error("Retry credentials upsert failed:", retryError);
          }
        }
      }

      // 3. Update Supabase user metadata (for auth.users)
      // Note: Large avatars (>32KB) will cause "Failed to fetch" or metadata size limit errors
      try {
        const AVATAR_METADATA_LIMIT = 30000; // ~30KB limit for metadata to be safe
        const isAvatarTooLargeForMetadata = avatar && avatar.length > AVATAR_METADATA_LIMIT;
        
        console.log("Updating auth metadata...", { isAvatarTooLargeForMetadata, avatarLength: avatar?.length });
        
        const updateData: any = { 
          full_name: name, 
          qualification: qualification 
        };
        
        // Only include avatar in metadata if it's small enough
        if (!isAvatarTooLargeForMetadata) {
          updateData.avatar_url = avatar;
        }

        const { data: { user: updatedAuthUser }, error: authError } = await supabase.auth.updateUser({
          data: updateData
        });

        if (authError) {
          console.error("Failed to update auth metadata:", authError);
          // If it failed with the avatar, try one more time without it
          if (updateData.avatar_url) {
            console.log("Retrying auth metadata update without avatar...");
            await supabase.auth.updateUser({
              data: { 
                full_name: name, 
                qualification: qualification 
              }
            });
          }
        } else {
          console.log("Auth metadata updated successfully");
        }
      } catch (e: any) {
        console.error("Exception updating auth metadata:", e);
        // If we get "Failed to fetch", it's almost certainly the payload size
        if (e?.message === 'Failed to fetch' || (e instanceof Error && e.message === 'Failed to fetch')) {
          console.log("Caught 'Failed to fetch', retrying metadata update with minimal data...");
          try {
            await supabase.auth.updateUser({
              data: { 
                full_name: name, 
                qualification: qualification 
              }
            });
          } catch (retryError) {
            console.error("Retry also failed:", retryError);
          }
        }
      }

      // 5. Profile update complete
      console.log("Profile update complete in database and metadata");
      
      // Only change state if we are in profile setup
      if (currentState === AppState.PROFILE_SETUP) {
        setCurrentState(AppState.DASHBOARD);
      }
    } catch (error) {
      console.error("Critical error in handleProfileComplete:", error);
    } finally {
      // Keep the ref true for a bit longer to ensure auth listener doesn't overwrite
      setTimeout(() => {
        isUpdatingProfileRef.current = false;
      }, 2000);
    }
  };

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSavedRoadmaps([]);
    setSavedChats([]);
    setActiveChatId(null);
    setShowLogoutConfirm(false);
    setCurrentState(AppState.LOGIN);
  };

  const handleDeleteAccountRequest = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteAccount = async () => {
    const userId = user?.id;
    const email = user?.email;

    if (!userId) return;

    try {
      // 1. Delete data from Supabase custom tables
      // We do this first while the user is still authenticated
      await Promise.all([
        supabase.from('saved_chats').delete().eq('user_id', user.numericId),
        supabase.from('saved_roadmaps').delete().eq('user_id', user.numericId),
        supabase.from('user_credentials').delete().eq('id', user.numericId)
      ]);
    } catch (error) {
      console.error('Error during profile deletion process:', error);
    }

    // 2. Clear all user-specific data from localStorage
    localStorage.removeItem(`careerpath_saved_roadmaps_${userId}`);
    localStorage.removeItem(`careerpath_saved_chats_${userId}`);
    localStorage.removeItem(`careerpath_survey_data_${userId}`);
    
    // Legacy cleanup for old email-based keys
    if (email) {
      localStorage.removeItem(`careerpath_saved_roadmaps_${email}`);
      localStorage.removeItem(`careerpath_saved_chats_${email}`);
      localStorage.removeItem(`careerpath_survey_data_${email}`);
    }
    
    // Clear current state
    setSavedRoadmaps([]);
    setSavedChats([]);
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    setUser(null);
    setShowDeleteConfirm(false);
    setCurrentState(AppState.LOGIN);
  };

  const handleExploreCareers = () => {
    setIsExplorerMode(true);
    setCurrentState(AppState.CAREER_EXPLORER);
  };

  const handleViewRoadmaps = () => {
    setIsExplorerMode(true);
    setCurrentState(AppState.ROADMAP_CATALOG);
  };

  const handleRoleSelect = (category: string, role: string) => {
    setSurveyData({
        qualification: user?.qualification || 'General Entry Level', 
        preferredIndustry: category,
        preferredRole: role,
        interests: `Pursuing a career as a ${role}`,
        hobbies: 'Not specified',
        knowledge: 'Not specified'
    });
    setActiveSuggestion(null);
    setIsExplorerMode(true);
    setIsHistoryView(false);
    setIsSurveyResult(false);
    setCurrentState(AppState.RESULTS);
  };

  const handleMultiStepSurveySubmit = (mcqs: any[], openEnded: any[]) => {
    setSurveyData(prev => ({
      ...prev,
      surveyResponses: { mcqs, openEnded }
    }));
    setActiveSuggestion(null);
    setIsExplorerMode(false);
    setIsHistoryView(false);
    setIsSurveyResult(true);
    setCurrentState(AppState.RESULTS);
  };

  const handleSaveRoadmap = async (suggestion: CareerSuggestion) => {
    const newSaved: SavedRoadmap = {
      id: generate12DigitId(),
      user_id: user?.numericId || 0,
      full_name: user?.name,
      date: new Date().toLocaleDateString(),
      suggestion,
      surveyData: { ...surveyData }
    };
    setSavedRoadmaps(prev => [newSaved, ...prev]);

    // Save to Supabase
    if (user?.numericId) {
      try {
        await supabase.from('saved_roadmaps').upsert({
          id: newSaved.id,
          user_id: user.numericId,
          full_name: user.name,
          email: user.email,
          title: suggestion.careerName,
          data: newSaved,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.error("Error saving roadmap to Supabase", e);
      }
    }
  };

  const handleViewSavedRoadmap = (roadmap: SavedRoadmap) => {
    setActiveSuggestion(roadmap.suggestion);
    setSurveyData(roadmap.surveyData);
    setIsExplorerMode(false);
    setIsHistoryView(true);
    setIsSurveyResult(false);
    setCurrentState(AppState.RESULTS);
  };

  const handleDeleteRoadmap = async (id: number) => {
    setSavedRoadmaps(prev => prev.filter(r => r.id !== id));
    
    if (user?.numericId) {
      try {
        await supabase.from('saved_roadmaps').delete().eq('user_id', user.numericId).eq('id', id);
      } catch (e) {
        console.error("Error deleting roadmap from Supabase", e);
      }
    }
  };

  const handleSwitchChat = (id: number) => {
    setActiveChatId(id);
  };

  const handleDeleteChat = (id: number) => {
    setIsClearing(true);
    setTimeout(async () => {
      setSavedChats(prev => {
        const filtered = prev.filter(c => c.id !== id);
        if (activeChatId === id) {
          if (filtered.length > 0) setActiveChatId(filtered[0].id);
          else setActiveChatId(null);
        }
        return filtered;
      });

      if (user?.numericId) {
        try {
          await supabase.from('saved_chats').delete().eq('user_id', user.numericId).eq('id', id);
        } catch (e) {
          console.error("Error deleting chat from Supabase", e);
        }
      }

      setIsClearing(false);
      
      // If no chats left, create a new one automatically
      setSavedChats(prev => {
        if (prev.length === 0) {
          const newId = generate12DigitId();
          const newChat: ChatSession = {
            id: newId,
            user_id: user?.numericId,
            full_name: user?.name,
            title: 'new chat',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: []
          };
          setActiveChatId(newId);
          return [newChat];
        }
        return prev;
      });
    }, 2000);
  };

  const handleClearAllChats = () => {
    setIsClearing(true);
    setTimeout(async () => {
      setSavedChats([]);
      setActiveChatId(null);

      if (user?.numericId) {
        try {
          await supabase.from('saved_chats').delete().eq('user_id', user.numericId);
        } catch (e) {
          console.error("Error clearing chats from Supabase", e);
        }
      }

      setIsClearing(false);
      handleCreateNewChat();
    }, 2000);
  };

  const handleCreateNewChat = () => {
    const newId = generate12DigitId();
    const chatNumber = savedChats.length + 1;
    const newChat: ChatSession = {
      id: newId,
      user_id: user?.numericId,
      full_name: user?.name,
      title: `Chat #${chatNumber}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: []
    };
    setSavedChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleUpdateMessages = async (messages: Message[]) => {
    if (!activeChatId || !user?.numericId) return;
    
    setSavedChats(prev => {
      const chatIndex = prev.findIndex(c => c.id === activeChatId);
      if (chatIndex === -1) return prev;

      const currentChat = prev[chatIndex];
      let newTitle = currentChat.title;
      
      // Update title if it's a default title and we have messages
      if ((newTitle === 'new chat' || newTitle.startsWith('Chat #')) && messages.length > 0) {
        const userMsg = messages.find(m => m.role === 'user');
        if (userMsg) {
          newTitle = userMsg.text.length > 30 
            ? userMsg.text.substring(0, 30) + '...' 
            : userMsg.text;
        }
      }

      const updatedChat = { ...currentChat, messages, title: newTitle, user_id: user.numericId, full_name: user.name };
      
      // Save to Supabase (Side effect inside functional update is generally avoided but here ensures we have latest state)
      const lastMsg = messages.length > 0 ? messages[messages.length - 1].text : '';
      supabase.from('saved_chats').upsert({
        id: activeChatId,
        user_id: user.numericId,
        full_name: user.name,
        email: user.email,
        title: updatedChat.title,
        last_message: lastMsg.substring(0, 200),
        data: updatedChat,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error("Error saving chat to Supabase", error);
      });

      const newChats = [...prev];
      newChats[chatIndex] = updatedChat;
      return newChats;
    });
  };

  const renderContent = () => {
    switch (currentState) {
      case AppState.LOGIN:
        return <Login onLogin={handleLogin} onSkip={handleSkipLogin} />;
      case AppState.PROFILE_SETUP:
        return (
          <ProfileSetup 
            initialEmail={user?.email || ''} 
            onComplete={handleProfileComplete} 
            onBack={() => { setUser(null); setCurrentState(AppState.LOGIN); }} 
          />
        );
      case AppState.DASHBOARD:
        return (
          <Dashboard 
            user={user!} 
            onExploreCareers={handleExploreCareers}
            onViewRoadmaps={handleViewRoadmaps}
            onViewSaved={() => setCurrentState(AppState.SAVED_ROADMAPS)}
        onAIChat={() => {
          if (savedChats.length === 0) {
            const newId = generate12DigitId();
            const newChat: ChatSession = {
              id: newId,
              user_id: user?.numericId,
              full_name: user?.name,
              title: 'new chat',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messages: []
            };
            setSavedChats([newChat]);
            setActiveChatId(newId);
          } else if (!activeChatId) {
            setActiveChatId(savedChats[0].id);
          }
          setCurrentState(AppState.AI_CHAT);
        }}
            onStartSurvey={() => setCurrentState(AppState.CAREER_SURVEY)}
            onOpenProfile={() => setIsProfileOpen(true)}
            savedCount={savedRoadmaps.length}
          />
        );
      case AppState.CAREER_EXPLORER:
        return (
          <CareerExplorer 
            onBack={() => setCurrentState(AppState.DASHBOARD)}
            onSelectRole={handleRoleSelect}
            readOnly={true}
          />
        );
      case AppState.ROADMAP_CATALOG:
        return (
          <RoadmapCatalog 
            onBack={() => setCurrentState(AppState.DASHBOARD)}
            onSelectRole={handleRoleSelect}
          />
        );
      case AppState.CAREER_SURVEY:
        return (
          <MultiStepSurvey 
            onBack={() => setCurrentState(AppState.DASHBOARD)} 
            onSubmit={handleMultiStepSurveySubmit} 
          />
        );
      case AppState.RESULTS:
        return (
          <ResultView 
            surveyData={surveyData}
            preloadedSuggestion={activeSuggestion}
            fromHistory={isHistoryView}
            isSurveyResult={isSurveyResult}
            onReset={() => setCurrentState(AppState.DASHBOARD)}
            onBackToList={() => setCurrentState(AppState.SAVED_ROADMAPS)}
            onBackToCatalog={() => setCurrentState(isExplorerMode ? AppState.ROADMAP_CATALOG : AppState.DASHBOARD)}
            onEdit={() => setCurrentState(isSurveyResult ? AppState.CAREER_SURVEY : AppState.DASHBOARD)}
            onSave={handleSaveRoadmap}
            isAlreadySaved={activeSuggestion ? savedRoadmaps.some(r => r.suggestion.careerName === activeSuggestion.careerName) : false}
          />
        );
      case AppState.SAVED_ROADMAPS:
        return (
          <SavedRoadmapsList 
            roadmaps={savedRoadmaps}
            onBack={() => setCurrentState(AppState.DASHBOARD)}
            onSelect={handleViewSavedRoadmap}
            onDelete={handleDeleteRoadmap}
          />
        );
      case AppState.AI_CHAT:
        const activeChat = savedChats.find(c => c.id === activeChatId) || savedChats[0];
        if (!activeChat || isClearing) {
          return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Clearing chat history...</p>
              </div>
            </div>
          );
        }
        return (
          <AIChat 
            user={user!}
            activeChat={activeChat}
            history={savedChats}
            onBack={() => setCurrentState(AppState.DASHBOARD)}
            onUpdateMessages={handleUpdateMessages}
            onSwitchChat={handleSwitchChat}
            onDeleteChat={handleDeleteChat}
            onClearAllChats={handleClearAllChats}
            onCreateNewChat={handleCreateNewChat}
          />
        );
      case AppState.RESET_PASSWORD:
        return (
          <ResetPassword 
            onComplete={() => {
              isRecoveringRef.current = false;
              // Clear the hash and search params so it doesn't trigger recovery mode again
              window.location.hash = '';
              const url = new URL(window.location.href);
              url.searchParams.delete('recovery');
              url.searchParams.delete('type');
              url.searchParams.delete('code');
              window.history.replaceState({}, '', url.pathname + url.search);
              setCurrentState(AppState.LOGIN); // Go back to login after reset
            }} 
          />
        );
      default:
        return null;
    }
  };

  const isNavVisible = currentState === AppState.LOGIN || currentState === AppState.DASHBOARD;
  const isChatState = currentState === AppState.AI_CHAT;

  return (
    <ErrorBoundary>
      <div className={`${isChatState ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col max-w-7xl mx-auto bg-white shadow-2xl relative`}>
        {isNavVisible && (
          <nav className="fixed top-0 left-0 right-0 max-w-7xl mx-auto px-5 py-4 md:px-6 md:py-5 border-b border-slate-100 flex items-center justify-center bg-white/95 backdrop-blur-md z-[100] shadow-sm">
            <div 
              className="flex items-center cursor-pointer group"
              onClick={() => user && setCurrentState(AppState.DASHBOARD)}
            >
              <h1 className="text-xl font-black text-slate-900 tracking-tight">CareerPath <span className="text-blue-600">AI</span></h1>
            </div>
          </nav>
        )}

        <main className={`flex-1 flex flex-col relative min-h-0 ${isNavVisible ? 'pt-16 md:pt-20' : ''}`}>
          {renderContent()}
        </main>

        {!isChatState && (
          <footer className="p-8 border-t border-slate-100 bg-slate-50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-slate-400 text-sm text-center md:text-left">© 2025 CareerPath AI Counsel. Powered by Gemini.</p>
              <div className="flex gap-8 text-sm font-bold text-slate-400">
                <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
              </div>
            </div>
          </footer>
        )}
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Sign Out?</h3>
                <p className="text-slate-500 leading-relaxed mb-8">
                  Are you sure you want to sign out? You'll need to sign back in to access your saved roadmaps and chats.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmLogout}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Yes, Sign Out
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Delete Account Confirmation Modal */}
        {SHOW_DELETE_BUTTON && showDeleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Account & Data?</h3>
                <p className="text-slate-500 leading-relaxed mb-8">
                  This will permanently delete your saved roadmaps, chats, and profile data from both this device and the server.
                  <br /><br />
                  <span className="text-red-600 font-bold">Warning:</span> This action cannot be undone. All your progress will be lost forever.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmDeleteAccount}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Delete Everything
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Sidebar */}
        {user && (
          <ProfileSidebar 
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
            onUpdateProfile={handleProfileComplete}
            onSignOut={handleLogoutRequest}
            onDeleteAccount={SHOW_DELETE_BUTTON ? handleDeleteAccountRequest : undefined}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;