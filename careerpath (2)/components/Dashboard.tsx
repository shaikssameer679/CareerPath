import React from 'react';
import { User } from '../types';
import { Compass, Sparkles, Briefcase, Bookmark, ClipboardList, ArrowRight, LogOut, User as UserIcon, AlertCircle } from 'lucide-react';

interface DashboardProps {
  user: User;
  onExploreCareers: () => void;
  onViewRoadmaps: () => void;
  onViewSaved: () => void;
  onAIChat: () => void;
  onStartSurvey: () => void;
  onOpenProfile: () => void;
  savedCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onExploreCareers, 
  onViewRoadmaps, 
  onViewSaved, 
  onAIChat,
  onStartSurvey,
  onOpenProfile,
  savedCount 
}) => {
  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 animate-in fade-in duration-500">
      {/* Top Header Section with Greeting and Small Saved Roadmaps Button */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={onOpenProfile}
            className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner overflow-hidden shrink-0 border border-blue-50 hover:scale-105 hover:shadow-md transition-all active:scale-95"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-7 h-7 md:w-8 md:h-8" />
            )}
          </button>
          <div className="min-w-0 cursor-pointer" onClick={onOpenProfile}>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 truncate hover:text-blue-600 transition-colors">Hi, {user.name || 'User'}!</h2>
            <p className="text-sm md:text-base text-slate-500">Ready to build your future today?</p>
          </div>
        </div>

        {/* Small, compact My Roadmaps button */}
        <button 
          onClick={onViewSaved}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:border-blue-400 hover:bg-blue-50/20 transition-all active:scale-95 shrink-0"
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${savedCount > 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
            <Bookmark className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm text-slate-700">My Roadmaps</span>
          {savedCount > 0 && (
            <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md text-[10px] font-black">
              {savedCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <button 
          onClick={onAIChat}
          className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl transition-all hover:shadow-lg hover:bg-indigo-100/50 hover:scale-[1.02] active:scale-95 cursor-pointer text-left"
        >
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-xl text-indigo-900 mb-2">AI Counselor</h3>
          <p className="text-sm text-indigo-700 leading-relaxed">Chat with AI for doubt-clearing and career guidance.</p>
        </button>
        
        <button 
          onClick={onExploreCareers}
          className="bg-purple-50 border border-purple-100 p-8 rounded-3xl transition-all hover:shadow-lg hover:bg-purple-100/50 hover:scale-[1.02] active:scale-95 cursor-pointer text-left"
        >
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-xl text-purple-900 mb-2">Job Roles</h3>
          <p className="text-sm text-purple-700 leading-relaxed">Browse job categories and view role details.</p>
        </button>
        
        <button 
          onClick={onViewRoadmaps}
          className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl transition-all hover:shadow-lg hover:bg-emerald-100/50 hover:scale-[1.02] active:scale-95 cursor-pointer text-left"
        >
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <Compass className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-xl text-emerald-900 mb-2">Roadmaps</h3>
          <p className="text-sm text-emerald-700 leading-relaxed">Pick a role to generate your detailed career path.</p>
        </button>
      </div>

      <div className="mb-12">
        <button 
          onClick={onStartSurvey}
          className="w-full bg-blue-600 text-white p-6 md:p-8 rounded-3xl flex items-center justify-between group cursor-pointer shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-2xl mb-1">Start Career Survey</h3>
              <p className="text-blue-100 leading-relaxed opacity-90">Let AI suggest your ideal career based on your personality and skills.</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Bottom Footer Section */}
      <div className="mt-auto pt-10 pb-4">
        <p className="text-slate-400 text-sm mt-4 text-center max-w-lg mx-auto leading-relaxed">
          Your path to a successful career starts here. Use our tools to find your direction.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;