
import React, { useState } from 'react';
import { SavedRoadmap } from '../types';
import { ArrowLeft, Trash2, ChevronRight, Bookmark, Calendar, AlertCircle, X } from 'lucide-react';

interface Props {
  roadmaps: SavedRoadmap[];
  onBack: () => void;
  onSelect: (roadmap: SavedRoadmap) => void;
  onDelete: (id: string) => void;
}

const SavedRoadmapsList: React.FC<Props> = ({ roadmaps, onBack, onSelect, onDelete }) => {
  const [roadmapToDelete, setRoadmapToDelete] = useState<SavedRoadmap | null>(null);

  const handleDeleteConfirm = () => {
    if (roadmapToDelete) {
      onDelete(roadmapToDelete.id);
      setRoadmapToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 animate-in slide-in-from-right-4 duration-500 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-1">
          {/* Back button with reduced margin for tighter grouping */}
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          
          <div className="flex items-center gap-3">
            {/* Save symbol (Bookmark icon) moved closer to back button */}
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0">
              <Bookmark className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 truncate">My Roadmaps</h2>
              <p className="text-xs md:text-sm text-slate-500 truncate">Your professional history</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 text-blue-600 px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold border border-blue-100 shrink-0">
          {roadmaps.length} Total
        </div>
      </div>

      {/* Main List Area */}
      {roadmaps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
          <div className="bg-slate-100 p-8 rounded-3xl mb-4">
            <Bookmark className="w-16 h-16 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-700">No roadmaps saved yet</h3>
          <p className="text-sm max-w-xs text-slate-500">
            Complete a career survey and click 'Save Roadmap' to start your collection.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-8">
          {roadmaps.map((roadmap) => (
            <div 
              key={roadmap.id}
              className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              onClick={() => onSelect(roadmap)}
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {roadmap.suggestion.careerName}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {roadmap.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setRoadmapToDelete(roadmap);
                  }}
                  className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all relative z-20"
                  title="Delete Roadmap"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {roadmapToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setRoadmapToDelete(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Roadmap?</h3>
              <p className="text-slate-500 leading-relaxed mb-8">
                Are you sure you want to delete your <span className="font-bold text-slate-700">"{roadmapToDelete.suggestion.careerName}"</span> roadmap? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setRoadmapToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedRoadmapsList;
