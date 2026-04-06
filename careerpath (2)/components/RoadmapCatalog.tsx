
import React, { useState, useMemo } from 'react';
import { CAREER_CATEGORIES } from '../data/categories';
import { ArrowLeft, Search, Briefcase, ChevronRight } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSelectRole: (category: string, role: string) => void;
}

const RoadmapCatalog: React.FC<Props> = ({ onBack, onSelectRole }) => {
  const [search, setSearch] = useState('');

  const allRoles = useMemo(() => {
    // Flatten all categories into a single list of roles and sort A-Z
    return CAREER_CATEGORIES.flatMap(cat => 
      cat.roles.map(role => ({ role, category: cat.name }))
    ).sort((a, b) => a.role.localeCompare(b.role));
  }, []);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return allRoles;
    const lowerSearch = search.toLowerCase();
    return allRoles.filter(item => 
      item.role.toLowerCase().includes(lowerSearch) || 
      item.category.toLowerCase().includes(lowerSearch)
    );
  }, [search, allRoles]);

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Career Library</h2>
          <p className="text-sm text-slate-500">Explore and search through {allRoles.length} curated career paths</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for a role (e.g. Data Scientist, Chef)..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all shadow-sm"
          autoFocus
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-3">
        {filteredRoles.length > 0 ? (
          filteredRoles.map((item) => (
            <button
              key={`${item.category}-${item.role}`}
              onClick={() => onSelectRole(item.category, item.role)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-md hover:bg-emerald-50/30 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">{item.role}</h4>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{item.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-300 group-hover:text-emerald-500 transition-colors">
                <span className="text-xs font-bold uppercase tracking-wider hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">View Roadmap</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p>No roles found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapCatalog;
