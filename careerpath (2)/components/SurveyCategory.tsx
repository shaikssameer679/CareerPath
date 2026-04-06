
import React, { useState } from 'react';
import { Briefcase, ChevronDown, ChevronRight, CheckCircle, ArrowRight, Zap, ArrowLeft } from 'lucide-react';
import { CAREER_CATEGORIES } from '../data/categories';

interface Props {
  onSubmit: (category: string, role: string) => void;
  onSkip: () => void;
  onBack: () => void;
  stepLabel?: string;
}

const SurveyCategory: React.FC<Props> = ({ onSubmit, onSkip, onBack, stepLabel = "Step 2 of 2" }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const toggleExpand = (categoryName: string) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryName);
    }
  };

  const handleSelectRole = (category: string, role: string) => {
    setSelectedCategory(category);
    setSelectedRole(role);
  };

  const handleSelectCategoryOnly = (category: string) => {
    setSelectedCategory(category);
    setSelectedRole(null);
  };

  const handleSubmit = () => {
    if (selectedCategory) {
      onSubmit(selectedCategory, selectedRole || '');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto max-h-[85vh]">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-6 h-6 text-slate-500" />
        </button>
        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{stepLabel}</span>
          <h2 className="text-2xl font-bold">Preferred Path</h2>
        </div>
      </div>

      <p className="text-slate-500 mb-6">
        Do you have a specific industry or role in mind? Select one to guide the AI, or skip to let us analyze based on your qualification alone.
      </p>

      <div className="space-y-3 mb-8">
        {CAREER_CATEGORIES.map((cat) => (
          <div 
            key={cat.name} 
            className={`border rounded-2xl transition-all ${
              selectedCategory === cat.name 
                ? 'border-indigo-500 bg-indigo-50/50' 
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleExpand(cat.name)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedCategory === cat.name ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectCategoryOnly(cat.name);
                  }}
                >
                  {selectedCategory === cat.name && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className={`font-bold ${selectedCategory === cat.name ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {cat.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                 {selectedCategory === cat.name && !selectedRole && (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                      General Interest
                    </span>
                 )}
                 {expandedCategory === cat.name ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              </div>
            </div>

            {expandedCategory === cat.name && (
              <div className="px-4 pb-4 pl-12 grid grid-cols-1 md:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                {cat.roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleSelectRole(cat.name, role)}
                    className={`text-left text-sm py-2 px-3 rounded-lg transition-colors ${
                      selectedRole === role 
                        ? 'bg-indigo-600 text-white font-medium shadow-md' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <button
          onClick={onSkip}
          className="text-slate-400 hover:text-slate-600 font-medium text-sm"
        >
          I'm not sure yet, skip
        </button>

        <button
          disabled={!selectedCategory}
          onClick={handleSubmit}
          className={`w-full md:w-auto py-4 px-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            selectedCategory
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Generate Roadmap
          <Zap className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SurveyCategory;
