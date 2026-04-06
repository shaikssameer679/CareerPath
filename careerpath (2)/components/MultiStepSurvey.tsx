
import React, { useState } from 'react';
import { ChevronRight, ArrowLeft, Send, CheckCircle, ClipboardList, Zap } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSubmit: (mcqs: { question: string, answer: string }[], openEnded: { question: string, answer: string }[]) => void;
}

const MCQ_QUESTIONS = [
  {
    id: 1,
    question: "How do you prefer to spend a rainy afternoon?",
    options: ["Solving logic puzzles & riddles", "Sketching or creative DIY projects", "Catching up with friends and helping them", "Organizing my space or files"]
  },
  {
    id: 2,
    question: "What's your favorite part of a group project?",
    options: ["Leading and coordinating the team", "Coming up with the core creative idea", "Doing the deep research and data gathering", "Presenting the final results to others"]
  },
  {
    id: 3,
    question: "If you had to learn a new skill tomorrow, what would it be?",
    options: ["Mastering a complex coding language", "Learning a beautiful new spoken language", "Crafting something with my hands (wood/metal)", "Understanding human psychology & behavior"]
  },
  {
    id: 4,
    question: "Which type of news interests you most?",
    options: ["Tech breakthroughs & AI news", "Global politics & social changes", "Health, biology & wellness updates", "Business, stocks & market trends"]
  },
  {
    id: 5,
    question: "How do you approach a difficult problem?",
    options: ["Break it down into small logical steps", "Look for a creative workaround others missed", "Ask experts for their advice first", "Experiment with different tools immediately"]
  },
  {
    id: 6,
    question: "What environment makes you most productive?",
    options: ["A silent library or private office", "A busy cafe with white noise", "A collaborative, open office space", "An outdoor space close to nature"]
  },
  {
    id: 7,
    question: "What do you value most in a potential job?",
    options: ["Constant innovation and new tech", "Making a direct positive social impact", "Long-term stability and clear growth", "Creative freedom and flexibility"]
  }
];

const OPEN_ENDED_QUESTIONS = [
  {
    id: 8,
    question: "Describe a project or activity you worked on that you felt genuinely proud of.",
    placeholder: "e.g. I built a website for a local shop, organized a charity run, repaired an old motorcycle..."
  },
  {
    id: 9,
    question: "What are some specific topics you could talk about for 30 minutes without any preparation?",
    placeholder: "e.g. Space exploration, cooking techniques, historical events, coding tips..."
  },
  {
    id: 10,
    question: "What is one professional dream you've always had, even if it seems unreachable right now?",
    placeholder: "e.g. Starting my own tech firm, writing a bestselling book, becoming a surgeon..."
  }
];

const MultiStepSurvey: React.FC<Props> = ({ onBack, onSubmit }) => {
  const [step, setStep] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<string[]>(new Array(MCQ_QUESTIONS.length).fill(''));
  const [openAnswers, setOpenAnswers] = useState<string[]>(new Array(OPEN_ENDED_QUESTIONS.length).fill(''));

  const totalSteps = MCQ_QUESTIONS.length + OPEN_ENDED_QUESTIONS.length;
  const isMcqStep = step < MCQ_QUESTIONS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleMcqSelect = (answer: string) => {
    const updated = [...mcqAnswers];
    updated[step] = answer;
    setMcqAnswers(updated);
    
    // Auto-advance for MCQ
    setTimeout(() => {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      }
    }, 300);
  };

  const handleOpenAnswerChange = (val: string) => {
    const updated = [...openAnswers];
    updated[step - MCQ_QUESTIONS.length] = val;
    setOpenAnswers(updated);
  };

  const nextStep = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const canContinue = isMcqStep 
    ? mcqAnswers[step] !== '' 
    : openAnswers[step - MCQ_QUESTIONS.length]?.trim().length > 10;

  const handleFinalSubmit = () => {
    const mcqData = MCQ_QUESTIONS.map((q, i) => ({ question: q.question, answer: mcqAnswers[i] }));
    const openData = OPEN_ENDED_QUESTIONS.map((q, i) => ({ question: q.question, answer: openAnswers[i] }));
    onSubmit(mcqData, openData);
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto max-h-[85vh] animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Only show the back arrow on the first step to return to dashboard */}
          {step === 0 && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-500" />
            </button>
          )}
          <div className={step === 0 ? "" : "ml-2"}>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              Career Discovery
            </h2>
            <p className="text-sm text-slate-500">Step {step + 1} of {totalSteps}</p>
          </div>
        </div>
        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden md:block">
          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col justify-center py-4">
        {isMcqStep ? (
          <div key={`mcq-${step}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-slate-800 mb-8 leading-tight">
              {MCQ_QUESTIONS[step].question}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {MCQ_QUESTIONS[step].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMcqSelect(option)}
                  className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left group ${
                    mcqAnswers[step] === option
                      ? 'border-blue-600 bg-blue-50 shadow-md scale-[1.02]'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className={`text-lg font-semibold ${mcqAnswers[step] === option ? 'text-blue-900' : 'text-slate-700'}`}>
                    {option}
                  </span>
                  {mcqAnswers[step] === option && <CheckCircle className="w-6 h-6 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div key={`open-${step}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-slate-800 mb-2 leading-tight">
              {OPEN_ENDED_QUESTIONS[step - MCQ_QUESTIONS.length].question}
            </h3>
            <p className="text-slate-500 mb-8">Share your thoughts to help the AI understand your unique perspective.</p>
            <textarea
              autoFocus
              value={openAnswers[step - MCQ_QUESTIONS.length]}
              onChange={(e) => handleOpenAnswerChange(e.target.value)}
              placeholder={OPEN_ENDED_QUESTIONS[step - MCQ_QUESTIONS.length].placeholder}
              className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none text-lg text-slate-700"
            />
            <div className="mt-2 flex justify-end">
              <span className={`text-xs font-bold uppercase tracking-widest ${openAnswers[step - MCQ_QUESTIONS.length]?.trim().length > 10 ? 'text-green-500' : 'text-slate-400'}`}>
                {openAnswers[step - MCQ_QUESTIONS.length]?.trim().length || 0} / 10+ characters
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
        <button
          onClick={prevStep}
          className={`px-8 py-4 font-bold text-slate-500 hover:text-slate-800 transition-colors ${step === 0 ? 'invisible' : ''}`}
        >
          Previous
        </button>

        {step === totalSteps - 1 ? (
          <button
            onClick={handleFinalSubmit}
            disabled={!canContinue}
            className={`px-12 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              canContinue
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Submit Survey
            <Send className="w-5 h-5" />
          </button>
        ) : !isMcqStep && (
          <button
            onClick={nextStep}
            disabled={!canContinue}
            className={`px-12 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              canContinue
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Next Question
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiStepSurvey;
