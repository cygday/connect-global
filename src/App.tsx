/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './lib/AuthContext';
import { useState } from 'react';
import Discover from './components/Discover';
import ChatRoom from './components/ChatRoom';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Plane, ShieldCheck } from 'lucide-react';

function LandingPage() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl"
      >
        <div className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-full mb-8 font-mono text-xs uppercase tracking-widest shadow-lg">
          <Plane size={14} /> Ready for departure
        </div>
        <h1 className="text-7xl md:text-9xl font-sans font-medium text-[#1a1a1a] tracking-tight leading-none mb-8">
          Connect <br /> <span className="italic text-gray-400">Global</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-lg mx-auto">
          Travel the world from your sofa. End-to-end encrypted chats with instant AI translation across 100+ languages.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
              <ShieldCheck className="mx-auto mb-3 text-green-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest">E2EE Secured</h3>
           </div>
           <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
              <Globe className="mx-auto mb-3 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest">AI Translation</h3>
           </div>
           <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
              <Plane className="mx-auto mb-3 text-orange-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Instant Match</h3>
           </div>
        </div>

        <button 
          onClick={signIn}
          className="h-16 px-12 bg-[#1a1a1a] text-white rounded-full font-medium text-lg hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl"
        >
          Begin your journey
        </button>
      </motion.div>
    </div>
  );
}

function MainApp() {
  const [view, setView] = useState<'discover' | 'profile' | 'chat'>('discover');
  const [activeChat, setActiveChat] = useState<{ id: string, otherUser: any } | null>(null);

  const handleStartChat = (chatId: string, otherUser: any) => {
    setActiveChat({ id: chatId, otherUser });
    setView('chat');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar 
        onSelectChat={(id, user) => handleStartChat(id, user)} 
        activeChatId={activeChat?.id}
        onNavigate={setView}
        currentView={view}
      />
      <main className="flex-1 h-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'discover' && (
            <motion.div 
              key="discover"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto"
            >
              <Discover onStartChat={handleStartChat} />
            </motion.div>
          )}
          {view === 'chat' && activeChat && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full"
            >
              <ChatRoom 
                chatId={activeChat.id} 
                otherUser={activeChat.otherUser} 
                onBack={() => setView('discover')} 
              />
            </motion.div>
          )}
          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto"
            >
              <Profile />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f5f5f0]">
      <div className="w-16 h-16 border-4 border-[#1a1a1a1a] border-t-[#1a1a1a] rounded-full animate-spin mb-4" />
      <p className="font-mono text-xs uppercase tracking-widest text-gray-500">Establishing Secure Uplink...</p>
    </div>
  );

  return user ? <MainApp /> : <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
