
import React, { useState } from 'react';
import { Heart, Info, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface Props {
  qualification: string;
  onSubmit: (interests: string, hobbies: string, knowledge: string) => void;
  onBack: () => void;
  stepLabel?: string;
}

const SurveyInterests: React.FC<Props> = ({ qualification, onSubmit, onBack, stepLabel = "Step 3 of 3" }) => {
  const [interests, setInterests] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [knowledge, setKnowledge] = useState('');

  const getWordCount = (str: string) => str.trim().split(/\s+/).filter(w => w.length > 0).length;

  const isValid = (str: string) => {
    return str.trim().length > 0;
  };

  const isFormValid = isValid(interests) && isValid(hobbies) && isValid(knowledge);

  return (
    <div className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto max-h-[80vh]">
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-6 h-6 text-slate-500" />
        </button>
        <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
          <Heart className="w-6 h-6" />
        </div>
        <div>
          <span className="text-sm font-bold text-purple-600 uppercase tracking-wider">{stepLabel}</span>
          <h2 className="text-2xl font-bold">Passions & Skills</h2>
        </div>
      </div>

      {qualification === 'Schooling' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Since you are still in schooling, our AI will prioritize your academic path and suggest subjects to focus on for your dream career.
          </p>
        </div>
      )}

      <div className="space-y-8 mb-8">
        <QuestionItem 
          title="What are your core interests and what excites you?"
          description="Explain what naturally draws your attention. Is it technology, nature, helping people, or creating art?"
          value={interests}
          onChange={setInterests}
          wordCount={getWordCount(interests)}
        />
        <QuestionItem 
          title="Describe your hobbies and how you spend free time."
          description="Hobbies often reveal hidden talents. Whether it's gaming, hiking, or reading, tell us why you enjoy it."
          value={hobbies}
          onChange={setHobbies}
          wordCount={getWordCount(hobbies)}
        />
        <QuestionItem 
          title="What basic knowledge or skills do you already possess?"
          description="Mention things you're good at—even if informal. Are you good at math, logic, speaking, or fixing things?"
          value={knowledge}
          onChange={setKnowledge}
          wordCount={getWordCount(knowledge)}
        />
      </div>

      <button
        disabled={!isFormValid}
        onClick={() => onSubmit(interests, hobbies, knowledge)}
        className={`w-full py-4 px-12 rounded-xl font-bold transition-all ${
          isFormValid
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        Generate My Career Roadmap
      </button>
    </div>
  );
};

const QuestionItem: React.FC<{
  title: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  wordCount: number;
}> = ({ title, description, value, onChange, wordCount }) => {
  const isTargetMet = wordCount >= 50;
  const progress = Math.min((wordCount / 50) * 100, 100);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex-1 mr-4">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 shrink-0 ${
          isTargetMet 
            ? 'bg-green-100 text-green-700' 
            : wordCount > 0 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-slate-100 text-slate-500'
        }`}>
          {isTargetMet ? <CheckCircle className="w-3 h-3" /> : (wordCount > 0 ? <AlertCircle className="w-3 h-3" /> : null)}
          {wordCount} / 50+ recommended words
        </div>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-32 p-4 bg-slate-50 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none ${
            isTargetMet ? 'border-green-200' : 'border-slate-200 focus:border-blue-500'
          }`}
          placeholder="Start typing..."
        />
        
        {/* Progress Bar Representation */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200 rounded-b-xl overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${isTargetMet ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {!isTargetMet && wordCount > 0 && (
        <p className="text-[10px] text-slate-400 italic">
          Tip: Detailed answers (50+ words) provide much more accurate AI suggestions.
        </p>
      )}
    </div>
  );
};

export default SurveyInterests;
