
import React, { useState } from 'react';
import { CAREER_CATEGORIES } from '../data/categories';
import { ArrowLeft, ChevronRight, Briefcase, Info, ArrowRight as ArrowRightIcon } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSelectRole: (category: string, role: string) => void;
  readOnly?: boolean;
}

const CareerExplorer: React.FC<Props> = ({ onBack, onSelectRole, readOnly = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<typeof CAREER_CATEGORIES[0] | null>(null);

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 overflow-hidden h-full">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={selectedCategory ? () => setSelectedCategory(null) : onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {selectedCategory ? selectedCategory.name : (readOnly ? 'Browse Job Roles' : 'Select a Role')}
          </h2>
          <p className="text-sm text-slate-500">
            {selectedCategory 
              ? (readOnly ? 'Available roles in this category' : 'Select a role to generate a detailed roadmap') 
              : 'Choose an industry to explore'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-4">
        {!selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-left-4 duration-300">
            {CAREER_CATEGORIES.map((category, index) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category)}
                className="group text-left p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 transition-all bg-white"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClass(index)}`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{category.name}</h3>
                <p className="text-sm text-slate-500">{category.roles.length} roles available</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-right-8 duration-300">
             {selectedCategory.roles.map((role) => (
               readOnly ? (
                 <div
                   key={role}
                   className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 transition-all w-full cursor-default"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                     <span className="font-semibold text-slate-600 text-lg">{role}</span>
                   </div>
                 </div>
               ) : (
                 <button
                   key={role}
                   onClick={() => onSelectRole(selectedCategory.name, role)}
                   className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30 transition-all group text-left w-full"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-600 transition-colors"></div>
                     <span className="font-semibold text-slate-700 text-lg group-hover:text-blue-800 transition-colors">{role}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                      <span className="text-xs font-bold uppercase tracking-wider hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">Generate Roadmap</span>
                      <ArrowRightIcon className="w-5 h-5" />
                   </div>
                 </button>
               )
             ))}
             {!readOnly && (
               <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm flex items-start gap-3">
                 <Info className="w-5 h-5 shrink-0 mt-0.5" />
                 <p>Click on any role above to instantly generate a comprehensive career roadmap, including core concepts and updated market requirements.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to generate consistent colors based on index
const getColorClass = (index: number) => {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-emerald-100 text-emerald-600',
    'bg-amber-100 text-amber-600',
    'bg-rose-100 text-rose-600',
    'bg-cyan-100 text-cyan-600',
    'bg-indigo-100 text-indigo-600',
    'bg-teal-100 text-teal-600',
  ];
  return colors[index % colors.length];
};

export default CareerExplorer;
