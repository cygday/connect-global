import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Globe, MessageSquare, LogOut, Save } from 'lucide-react';

export default function Profile() {
  const { profile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        bio,
        country,
        language
      });
      alert('Profile updated!');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f0] p-6 lg:p-12">
      <header className="mb-12">
        <h1 className="font-sans font-medium text-4xl lg:text-6xl tracking-tight text-[#1a1a1a] mb-2">
          Your <span className="italic text-gray-400">Passport</span>
        </h1>
        <p className="text-gray-500">How the world sees you on ConnectGlobal.</p>
      </header>

      <form onSubmit={handleSave} className="max-w-2xl bg-white rounded-[32px] p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <img src={profile?.photoURL} className="w-24 h-24 rounded-full border-4 border-[#1a1a1a1f]" alt="" />
          <div>
            <h2 className="text-xl font-medium">{profile?.displayName}</h2>
            <p className="text-sm text-gray-400 font-mono uppercase tracking-widest">{profile?.uid.slice(0, 8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Display Name</label>
            <input 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Country</label>
            <input 
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g. India, Japan"
              className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Native Language</label>
            <select 
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Bio</label>
          <textarea 
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] resize-none"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button 
            type="submit"
            disabled={saving}
            className="flex-1 h-12 bg-[#1a1a1a] text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
             <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button"
            onClick={logout}
            className="px-6 h-12 border border-red-100 text-red-500 rounded-full font-medium flex items-center gap-2 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </form>
    </div>
  );
}
