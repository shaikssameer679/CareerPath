
import React, { useState, useRef } from 'react';
import { Camera, User as UserIcon, ArrowRight, ArrowLeft, GraduationCap, Edit3 } from 'lucide-react';

interface Props {
  initialEmail: string;
  onComplete: (name: string, avatar: string, qualification: string) => void;
  onBack: () => void;
}

const ProfileSetup: React.FC<Props> = ({ initialEmail, onComplete, onBack }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Qualification State
  const [selectedQualification, setSelectedQualification] = useState<string | null>(null);
  const [isOther, setIsOther] = useState(false);
  const [customQualification, setCustomQualification] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const qualificationOptions: { label: string; value: string; icon: string }[] = [
    { label: 'Currently in Schooling', value: 'Schooling', icon: '🏫' },
    { label: 'High School Diploma', value: 'High School', icon: '🎓' },
    { label: 'Vocational Diploma', value: 'Diploma', icon: '📜' },
    { label: 'Bachelor\'s Degree', value: 'Undergraduate', icon: '🏛️' },
    { label: 'Master\'s Degree', value: 'Postgraduate', icon: '💎' },
    { label: 'PhD or Doctorate', value: 'PhD', icon: '🧬' },
    { label: 'No Formal Qualification', value: 'None', icon: '🌱' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleQualificationSelect = (val: string) => {
    setIsOther(false);
    setSelectedQualification(val);
  };

  const handleOtherClick = () => {
    setIsOther(true);
    setSelectedQualification(null);
  };

  const isQualificationValid = selectedQualification || (isOther && customQualification.trim().length > 2);
  const canContinue = name.trim().length > 0 && isQualificationValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canContinue) {
      const finalQualification = isOther ? customQualification.trim() : selectedQualification!;
      onComplete(name, avatar || '', finalQualification);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 animate-in slide-in-from-right-8 duration-500 relative overflow-y-auto">
      
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2 text-slate-500 hover:text-slate-800 z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-bold">Back</span>
      </button>

      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
          <p className="text-slate-500">Let's personalize your experience, {initialEmail.split('@')[0]}.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top Section: Avatar & Name */}
          <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center">
              <div 
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center overflow-hidden transition-all ${
                  avatar ? 'border-blue-500' : dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'
                }`}>
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                
                <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="flex-1 w-full max-w-xs">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 my-6"></div>

          {/* Qualification Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Current Academic Status</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {qualificationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleQualificationSelect(opt.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    selectedQualification === opt.value
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className={`font-semibold text-sm ${selectedQualification === opt.value ? 'text-blue-900' : 'text-slate-700'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
              
              <button
                type="button"
                onClick={handleOtherClick}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  isOther
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-lg">
                  ✨
                </div>
                <span className={`font-semibold text-sm ${isOther ? 'text-blue-900' : 'text-slate-700'}`}>
                  Other Qualification
                </span>
              </button>
            </div>

            {isOther && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Specify your qualification</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customQualification}
                    onChange={(e) => setCustomQualification(e.target.value)}
                    placeholder="e.g. Associate Degree in Graphic Design"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                  />
                  <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4" />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!canContinue}
            className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
              canContinue 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 hover:scale-[1.02] active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
