
import React, { useEffect, useState } from 'react';
import { SurveyData, CareerSuggestion } from '../types';
import { analyzeCareer } from '../services/gemini';
import { 
  TrendingUp, ListChecks, Map, AlertTriangle, 
  RefreshCw, Bookmark, BookmarkCheck, Share2, Lightbulb,
  X, Meh, Smile, Sparkles, ArrowLeft
} from 'lucide-react';

interface Props {
  surveyData: SurveyData;
  preloadedSuggestion?: CareerSuggestion | null;
  fromHistory?: boolean;
  isSurveyResult?: boolean;
  onReset: () => void;
  onBackToList?: () => void;
  onBackToCatalog?: () => void;
  onEdit: () => void;
  onSave: (suggestion: CareerSuggestion) => void;
  isAlreadySaved: boolean;
}

type FeedbackState = 'none' | 'satisfied' | 'unsatisfied';

const ResultView: React.FC<Props> = ({ 
  surveyData, 
  preloadedSuggestion, 
  fromHistory = false,
  isSurveyResult = false,
  onReset, 
  onBackToList,
  onBackToCatalog,
  onEdit, 
  onSave, 
  isAlreadySaved 
}) => {
  const [result, setResult] = useState<CareerSuggestion | null>(preloadedSuggestion || null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(isAlreadySaved);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (preloadedSuggestion) {
      setResult(preloadedSuggestion);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await analyzeCareer(surveyData);
        if (data.isMeaningless) {
          setError("Unpredictable Input: We couldn't find a suitable career path because the information provided seems random or meaningless. Please try again with clear descriptions.");
          return;
        }
        setResult(data);
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong while processing your career roadmap. Please try again.");
      }
    };
    fetchData();
  }, [surveyData, preloadedSuggestion]);

  const handleSave = () => {
    if (result && !saved) {
      onSave(result);
      setSaved(true);
      if (showExitDialog) setShowExitDialog(false);
    }
  };

  const handleGoDashboard = () => {
    if (!saved && isSurveyResult) {
      setShowExitDialog(true);
    } else {
      onReset();
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const title = `Career Roadmap: ${result.careerName}`;
    const text = `Check out this AI-generated career roadmap for ${result.careerName} on CareerPath!`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        alert("Copied to clipboard!");
      }
    } catch (err) { console.error(err); }
  };

  if (error) {
    const isUnpredictable = error.includes("Unpredictable Input");
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{isUnpredictable ? "Unpredictable Input" : "Analysis Failed"}</h2>
        <p className="text-slate-500 mb-8 max-w-sm">{isUnpredictable ? error.split(": ")[1] : error}</p>
        <button
          onClick={onReset}
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          {isUnpredictable ? "Restart Survey" : "Try Again"}
        </button>
      </div>
    );
  }

  const isLoading = !result;

  return (
    <div className={`flex-1 flex flex-col p-6 md:p-10 max-h-[85vh] transition-all duration-500 ${isLoading ? 'overflow-hidden relative' : 'overflow-y-auto animate-in slide-in-from-bottom-4'}`}>
      
      {isLoading ? (
        <div className="flex flex-col h-full animate-pulse space-y-8 select-none pointer-events-none">
            <div className="w-full h-64 bg-slate-200 rounded-3xl shrink-0 opacity-70" />
            <div className="grid md:grid-cols-2 gap-8 shrink-0">
                <div className="h-48 bg-slate-200 rounded-2xl opacity-60" />
                <div className="h-48 bg-slate-200 rounded-2xl opacity-60" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/40 backdrop-blur-[2px]">
                <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {isSurveyResult ? "finding best role suitable for you..." : "Loading your roadmap..."}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <>
            {/* Back Arrow for Non-Survey Views (Catalog or History) */}
            {(!isSurveyResult || fromHistory) && (
              <div className="mb-6 flex items-center gap-4 animate-in slide-in-from-left-4 duration-300">
                <button 
                  onClick={
                    fromHistory && onBackToList 
                      ? onBackToList 
                      : (!isSurveyResult && onBackToCatalog ? onBackToCatalog : onReset)
                  }
                  className="p-2 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-all active:scale-95"
                  title="Go Back"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <span className="font-bold text-slate-500 text-sm uppercase tracking-wider">
                  {fromHistory ? 'Back to List' : 'Back to Selection'}
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 rounded-3xl shadow-xl flex-1 w-full relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase tracking-wider opacity-80">
                      {isSurveyResult ? "Analysis Result" : "Career Roadmap"}
                    </span>
                </div>
                <h1 className="text-4xl font-extrabold mb-4">{result.careerName}</h1>
                <p className="text-blue-50 leading-relaxed text-lg font-medium">
                  {isSurveyResult 
                    ? "This is the result from your provided interests and hobbies." 
                    : `This is the detailed career roadmap for the position of ${result.careerName}.`
                  }
                </p>
                </div>
            </div>

            <div className="mb-10 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-blue-600">
                <Sparkles className="w-6 h-6" />
                <h3 className="font-bold text-xl">{isSurveyResult ? "Why this path fits you" : "Role Description"}</h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg italic">
                "{result.reasoning}"
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-900">
                    <ListChecks className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">Market Requirements</h3>
                </div>
                <ul className="space-y-3">
                    {result.requirements.map((req, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                        {req}
                    </li>
                    ))}
                </ul>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-indigo-900">
                    <Lightbulb className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-lg">Core Industry Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {result.coreConcepts?.map((concept, i) => (
                    <span key={i} className="bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                        {concept}
                    </span>
                    ))}
                </div>
                </div>
            </div>

            <div className="space-y-4 mb-12">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <Map className="w-6 h-6 text-blue-600" />
                Detailed Career Roadmap
                </h2>
                <div className="relative border-l-2 border-blue-100 ml-4 pl-8 space-y-12">
                {result.roadmap.map((step, i) => (
                    <div key={i} className="relative group">
                    <div className="absolute -left-[41px] top-0 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-sm" />
                    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xl font-bold text-slate-900">{step.title}</h4>
                        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 uppercase">
                            {step.duration}
                        </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                        {step.description}
                        </p>
                    </div>
                    </div>
                ))}
                </div>
            </div>

            {/* Satisfaction Section - ONLY for Survey Results, NOT for catalog or history */}
            {isSurveyResult && !fromHistory && (
              <div className="mb-10 bg-slate-50 rounded-3xl p-8 border border-slate-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-xl mb-6">Are you satisfied with this recommendation?</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={() => setFeedback('satisfied')}
                    className="flex items-center gap-2 px-10 py-4 bg-green-100 text-green-700 rounded-2xl font-bold hover:bg-green-200 transition-all active:scale-95 shadow-sm"
                  >
                    <Smile className="w-5 h-5" /> Satisfied
                  </button>
                  <button 
                    onClick={() => setFeedback('unsatisfied')}
                    className="flex items-center gap-2 px-10 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95 shadow-sm"
                  >
                    <Meh className="w-5 h-5" /> Unsatisfied
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 pt-6 border-t border-slate-100 mb-6">
                {isSurveyResult && !fromHistory ? (
                  <>
                    <button
                      onClick={handleGoDashboard}
                      className="flex-[2] bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                    >
                      Go to Dashboard
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-bold py-5 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={saved}
                      className={`flex-1 font-bold py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                          saved 
                          ? 'bg-green-50 border-2 border-green-200 text-green-600 cursor-default shadow-none' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                      }`}
                    >
                      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      {saved ? 'Saved' : 'Save Roadmap'}
                    </button>
                  </>
                ) : !fromHistory ? (
                  /* Catalog view: Show Share and Save, but no Dashboard button */
                  <>
                    <button
                      onClick={handleShare}
                      className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-bold py-5 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={saved}
                      className={`flex-[2] font-bold py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                          saved 
                          ? 'bg-green-50 border-2 border-green-200 text-green-600 cursor-default shadow-none' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                      }`}
                    >
                      {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                      {saved ? 'Saved to Dashboard' : 'Save this Roadmap'}
                    </button>
                  </>
                ) : (
                  /* History view: Show simplified Share */
                  <button
                    onClick={handleShare}
                    className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Share2 className="w-5 h-5" />
                    Share this Career Roadmap
                  </button>
                )}
            </div>
        </>
      )}

      {/* Feedback Dialogs */}
      {feedback === 'satisfied' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative p-8 text-center animate-in zoom-in-95 duration-200">
            {/* X button removed as per user request */}
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl animate-bounce">😊</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h3>
            <p className="text-slate-600 text-lg">Thank you and hope you will achieve your goal! We're glad we could help.</p>
            <button onClick={() => setFeedback('none')} className="mt-8 w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 transition-colors">Close</button>
          </div>
        </div>
      )}

      {feedback === 'unsatisfied' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative p-8 text-center animate-in zoom-in-95 duration-200">
            <button onClick={() => setFeedback('none')} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">We're Sorry</h3>
            <p className="text-slate-600 text-lg mb-8">Sorry for your inconvenience, restart your survey we will provide better career role recommendation.</p>
            <div className="flex gap-4">
              <button onClick={() => setFeedback('none')} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Dismiss</button>
              <button onClick={onEdit} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-colors">Restart Survey</button>
            </div>
          </div>
        </div>
      )}

      {/* Save before exit dialog - ONLY triggered for Survey Results */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <Bookmark className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Save your roadmap?</h3>
            <p className="text-slate-600 mb-8">You haven't saved this result yet. Would you like to save it to your dashboard before leaving?</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleSave} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-colors">
                <BookmarkCheck className="w-5 h-5" /> Save and Exit
              </button>
              <button onClick={onReset} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">
                Exit without saving
              </button>
              <button onClick={() => setShowExitDialog(false)} className="w-full py-3 text-sm text-slate-400 font-bold hover:text-slate-600 transition-colors">
                Go back to roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
