import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { encryptMessage, decryptMessage, deriveSharedKey, importPublicKey } from '../lib/crypto';
import { translateText } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Globe, FileText, Lock, ChevronLeft, MapPin } from 'lucide-react';

interface ChatRoomProps {
  chatId: string;
  otherUser: any;
  onBack: () => void;
}

export default function ChatRoom({ chatId, otherUser, onBack }: ChatRoomProps) {
  const { user, profile, keyPair } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function setupEncryption() {
      if (!keyPair || !otherUser.publicKey) return;
      try {
        const otherPubKey = await importPublicKey(otherUser.publicKey);
        const derived = await deriveSharedKey(keyPair.privateKey, otherPubKey);
        setSharedKey(derived);
      } catch (e) {
        console.error("Encryption setup failed:", e);
      }
    }
    setupEncryption();
  }, [keyPair, otherUser]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sharedKey || !user) return;

    try {
      const encrypted = await encryptMessage(sharedKey, newMessage);
      const msgData = {
        senderId: user.uid,
        ...encrypted,
        type: 'text',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      await updateDoc(doc(db, 'chats', chatId), {
        updatedAt: serverTimestamp(),
        lastMessage: 'Encrypted Message'
      });
      setNewMessage('');
    } catch (e) {
      console.error("Send failed:", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sharedKey || !user) return;

    // Simple file sharing: convert to base64 and encrypt
    // (Note: Firestore has 1MB limit per doc, so this is for small files)
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const encrypted = await encryptMessage(sharedKey, base64);
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        ...encrypted,
        type: 'file',
        fileName: file.name,
        fileType: file.type,
        createdAt: serverTimestamp()
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f0]">
      <header className="p-4 bg-white border-bottom border-[#1a1a1a1a] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <img src={otherUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h2 className="font-sans font-medium text-[#1a1a1a]">{otherUser.displayName}</h2>
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 font-medium">
              <MapPin size={10} /> {otherUser.country} · {otherUser.language}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full font-bold">
            <Lock size={12} /> E2EE
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              msg={msg} 
              isMe={msg.senderId === user?.uid} 
              sharedKey={sharedKey}
              targetLang={profile?.language || 'en'}
            />
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      <footer className="p-4 bg-white border-t border-[#1a1a1a1a]">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <label className="p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
            <FileText size={20} />
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write an encrypted message..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-2 bg-[#1a1a1a] text-white rounded-full disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}

function MessageItem({ msg, isMe, sharedKey, targetLang }: { msg: any, isMe: boolean, sharedKey: any, targetLang: string }) {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [translated, setTranslated] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!sharedKey) return;
    async function decrypt() {
      try {
        const text = await decryptMessage(sharedKey, msg.iv, msg.content);
        setDecrypted(text);
      } catch (e) {
        console.error("Decryption failed:", e);
      }
    }
    decrypt();
  }, [sharedKey, msg]);

  const handleTranslate = async () => {
    if (!decrypted || isTranslating) return;
    setIsTranslating(true);
    try {
      const res = await translateText(decrypted, targetLang);
      setTranslated(res);
    } finally {
      setIsTranslating(false);
    }
  };

  if (!decrypted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm relative group ${
        isMe ? 'bg-[#1a1a1a] text-white rounded-tr-none' : 'bg-white text-[#1a1a1a] rounded-tl-none border border-[#1a1a1a1a]'
      }`}>
        {msg.type === 'file' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} />
              <span className="truncate max-w-[150px]">{msg.fileName}</span>
            </div>
            <a 
              href={decrypted} 
              download={msg.fileName}
              className="text-xs underline opacity-70 hover:opacity-100"
            >
              Download File
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-relaxed">{decrypted}</p>
            {translated && (
              <p className="text-xs italic opacity-70 border-t border-white/20 pt-1 mt-1">
                {translated}
              </p>
            )}
            {!isMe && !translated && (
              <button 
                onClick={handleTranslate}
                className="opacity-0 group-hover:opacity-100 absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#1a1a1a] transition-all"
                title="Translate"
              >
                <Globe size={14} className={isTranslating ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
