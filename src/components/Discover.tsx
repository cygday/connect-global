import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, or } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { Globe, RefreshCw, UserPlus, Search } from 'lucide-react';

export default function Discover({ onStartChat }: { onStartChat: (chatId: string, user: any) => void }) {
  const { user, profile } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // Simple discovery: find users with different languages or just random users
      const q = query(
        collection(db, 'users'), 
        where('uid', '!=', user?.uid || ''),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => doc.data());
      setPotentialMatches(users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user]);

  const createChat = async (otherUser: any) => {
    if (!user) return;
    try {
      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const snapshot = await getDocs(q);
      const existing = snapshot.docs.find(doc => doc.data().participants.includes(otherUser.uid));
      
      if (existing) {
        onStartChat(existing.id, otherUser);
      } else {
        const docRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, otherUser.uid],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        onStartChat(docRef.id, otherUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f0] p-6 lg:p-12">
      <header className="mb-12">
        <h1 className="font-sans font-medium text-6xl lg:text-8xl tracking-tight text-[#1a1a1a] mb-4">
          Travel <span className="italic text-gray-400">the</span> World
        </h1>
        <p className="text-gray-500 max-w-md text-lg">
          Connect with people across the globe. Instant translation and end-to-end encryption by default.
        </p>
      </header>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="uppercase tracking-[0.2em] text-[11px] font-bold text-gray-400 flex items-center gap-2">
            <Globe size={14} /> New Connections
          </h2>
          <button 
            onClick={fetchMatches}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-2 text-sm text-gray-600"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Shuffle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {potentialMatches.map((person, idx) => (
            <motion.div
              key={person.uid}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img 
                    src={person.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.uid}`} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-50"
                    alt={person.displayName}
                  />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 border-4 border-white rounded-full" />
                </div>
                <h3 className="text-xl font-medium text-[#1a1a1a]">{person.displayName}</h3>
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                  <Globe size={12} /> {person.country} · {person.language}
                </p>
                <div className="text-sm text-gray-600 italic line-clamp-2 min-h-[40px] mb-6">
                  "{person.bio}"
                </div>
                <button 
                  onClick={() => createChat(person)}
                  className="w-full h-12 bg-[#1a1a1a] text-white rounded-full font-medium flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <UserPlus size={18} /> Take off
                </button>
              </div>
            </motion.div>
          ))}
          {potentialMatches.length === 0 && !loading && (
            <div className="col-span-full py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center text-gray-500">
               <Search size={48} className="mb-4 opacity-20" />
               <p>No new travelers found at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
