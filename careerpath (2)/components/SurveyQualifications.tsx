
import React, { useState } from 'react';
import { Qualification } from '../types';
import { GraduationCap, ArrowRight, Edit3, ArrowLeft } from 'lucide-react';

interface Props {
  onSubmit: (q: Qualification) => void;
  onBack: () => void;
  stepLabel?: string;
}

const SurveyQualifications: React.FC<Props> = ({ onSubmit, onBack, stepLabel = "Step 1 of 3" }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [isOther, setIsOther] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const options: { label: string; value: string; icon: string }[] = [
    { label: 'Currently in Schooling', value: 'Schooling', icon: '🏫' },
    { label: 'High School Diploma', value: 'High School', icon: '🎓' },
    { label: 'Vocational Diploma', value: 'Diploma', icon: '📜' },
    { label: 'Bachelor\'s Degree', value: 'Undergraduate', icon: '🏛️' },
    { label: 'Master\'s Degree', value: 'Postgraduate', icon: '💎' },
    { label: 'PhD or Doctorate', value: 'PhD', icon: '🧬' },
    { label: 'No Formal Qualification', value: 'None', icon: '🌱' },
  ];

  const handleSelect = (val: string) => {
    setIsOther(false);
    setSelected(val);
  };

  const handleOtherClick = () => {
    setIsOther(true);
    setSelected(null);
  };

  const canContinue = selected || (isOther && customValue.trim().length > 2);

  const handleSubmit = () => {
    if (isOther) {
      onSubmit(customValue.trim());
    } else if (selected) {
      onSubmit(selected);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto max-h-[85vh]">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-6 h-6 text-slate-500" />
        </button>
        <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">{stepLabel}</span>
          <h2 className="text-2xl font-bold">Academic Status</h2>
        </div>
      </div>

      <p className="text-slate-500 mb-8">
        Your current educational background helps us understand your starting point and the bridge needed to your future career.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
              selected === opt.value
                ? 'border-blue-600 bg-blue-50 shadow-sm'
                : 'border-slate-100 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-3xl">{opt.icon}</span>
            <span className={`font-semibold ${selected === opt.value ? 'text-blue-900' : 'text-slate-700'}`}>
              {opt.label}
            </span>
          </button>
        ))}
        
        <button
          onClick={handleOtherClick}
          className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
            isOther
              ? 'border-blue-600 bg-blue-50 shadow-sm'
              : 'border-slate-100 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-lg text-xl">
            ✨
          </div>
          <span className={`font-semibold ${isOther ? 'text-blue-900' : 'text-slate-700'}`}>
            Other Qualification
          </span>
        </button>
      </div>

      {isOther && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Specify your qualification</label>
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="e.g. Associate Degree in Graphic Design"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
            />
            <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-slate-100 flex justify-end">
        <button
          disabled={!canContinue}
          onClick={handleSubmit}
          className={`w-full md:w-auto py-4 px-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            canContinue
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SurveyQualifications;
