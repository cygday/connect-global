import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { MessageSquare, Settings, Compass, MapPin } from 'lucide-react';

interface SidebarProps {
  onSelectChat: (chatId: string, otherUser: any) => void;
  activeChatId?: string;
  onNavigate: (view: 'discover' | 'profile' | 'chat') => void;
  currentView: string;
}

export default function Sidebar({ onSelectChat, activeChatId, onNavigate, currentView }: SidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const chatData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherId = data.participants.find((id: string) => id !== user.uid);
        const otherDoc = await getDoc(doc(db, 'users', otherId));
        return {
          id: chatDoc.id,
          ...data,
          otherUser: otherDoc.data()
        };
      }));
      setChats(chatData);
    });
  }, [user]);

  return (
    <div className="w-[300px] h-full bg-white border-r border-[#1a1a1a1a] flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-sans font-medium text-[#1a1a1a] flex items-center gap-2">
          ConnectGlobal
        </h1>
      </div>

      <nav className="px-4 space-y-1 mb-8">
        <button 
          onClick={() => onNavigate('discover')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentView === 'discover' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Compass size={20} /> <span className="font-medium">Discover</span>
        </button>
        <button 
          onClick={() => onNavigate('profile')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentView === 'profile' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Settings size={20} /> <span className="font-medium">Passport</span>
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        <h2 className="uppercase tracking-[0.2em] text-[10px] font-bold text-gray-400 mb-4 ml-4">
          Recent Tickets
        </h2>
        {chats.map(chat => (
          <button
            key={chat.id}
            onClick={() => {
              onSelectChat(chat.id, chat.otherUser);
              onNavigate('chat');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              activeChatId === chat.id && currentView === 'chat' ? 'bg-gray-100 border border-[#1a1a1a1a]' : 'hover:bg-gray-50'
            }`}
          >
            <img src={chat.otherUser?.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 overflow-hidden">
              <h3 className="font-medium text-[#1a1a1a] truncate">{chat.otherUser?.displayName}</h3>
              <p className="text-xs text-gray-500 truncate">{chat.lastMessage || 'Start exploring...'}</p>
            </div>
            <div className="text-[10px] font-bold opacity-30">
               <MapPin size={12} />
            </div>
          </button>
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 mt-auto">
         <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Signal: Secured</div>
         </div>
      </div>
    </div>
  );
}
