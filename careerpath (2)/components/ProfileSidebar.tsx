
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, User as UserIcon, GraduationCap, Check, LogOut, Trash2, Shield, Bell, Settings } from 'lucide-react';
import { User } from '../types';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateProfile: (name: string, avatar: string, qualification: string) => Promise<void>;
  onSignOut: () => void;
  onDeleteAccount?: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateProfile,
  onSignOut,
  onDeleteAccount
}) => {
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [qualification, setQualification] = useState(user.qualification || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const qualificationOptions = [
    'Schooling', 'High School', 'Diploma', 'Undergraduate', 'Postgraduate', 'PhD', 'None'
  ];

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      setQualification(user.qualification || '');
      setIsEditing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic size check - if > 2MB, warn or compress
      if (file.size > 2 * 1024 * 1024) {
        console.warn("File is quite large, compressing...");
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimensions for avatar
            const MAX_SIZE = 400;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Get compressed base64 (using JPEG for better compression)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            console.log("Image compressed:", { 
              original: (event.target?.result as string).length, 
              compressed: compressedBase64.length 
            });
            
            setAvatar(compressedBase64);
            setIsEditing(true);
          };
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    console.log("ProfileSidebar: handleSave called", { name, qualification, avatarLength: avatar?.length });
    setIsSaving(true);
    try {
      await onUpdateProfile(name, avatar, qualification);
      console.log("ProfileSidebar: onUpdateProfile successful");
      setIsEditing(false);
      // Close sidebar immediately for snappy feel
      console.log("ProfileSidebar: closing sidebar");
      onClose();
    } catch (error) {
      console.error("ProfileSidebar: Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-full max-w-md bg-white shadow-2xl z-[201] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-xl font-black text-slate-900">Profile Settings</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-blue-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-12 h-12 text-blue-200" />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-lg border-4 border-white hover:scale-110 transition-transform active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-400 font-medium">{user.email}</p>
                </div>
              </div>

              {/* Form Section */}
              <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => { setName(e.target.value); setIsEditing(true); }}
                      className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-bold text-slate-700"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Qualification</label>
                  <div className="grid grid-cols-2 gap-2">
                    {qualificationOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setQualification(opt); setIsEditing(true); }}
                        className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                          qualification === opt 
                            ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100' 
                            : 'border-white bg-white text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Save Changes
                  </motion.button>
                )}
              </div>

              {/* Danger Zone */}
              <div className="pt-6 space-y-3">
                <button 
                  onClick={onSignOut}
                  className="w-full flex items-center gap-4 p-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>

                {onDeleteAccount && (
                  <button 
                    onClick={onDeleteAccount}
                    className="w-full flex items-center gap-4 p-4 text-red-600 font-bold hover:bg-red-50 rounded-2xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileSidebar;
