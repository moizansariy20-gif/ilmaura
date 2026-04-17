
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Search, Send, Smile, Check, CheckCheck, 
  Users, ChevronRight, MessageSquare, Bell, User
} from 'lucide-react';

// Reusing sound asset
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  senderName?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatContact {
  id: string;
  name: string;
  role: 'student' | 'parent' | 'principal' | 'class';
  subtitle: string; // e.g. "Class 9A" or "Principal"
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline?: boolean;
}

const MOCK_TEACHER_CONTACTS: ChatContact[] = [
  {
    id: 'principal',
    name: 'The Principal',
    role: 'principal',
    subtitle: 'Admin Office',
    lastMessage: 'Please submit the weekly report by Friday.',
    time: '10:00 AM',
    unreadCount: 1,
    isOnline: true
  },
  {
    id: 'class-9a-parents',
    name: 'Class 9-A Parents',
    role: 'class',
    subtitle: 'Broadcast Group',
    lastMessage: 'You: Mid-term results will be announced tomorrow.',
    time: 'Yesterday',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 'student-ali',
    name: 'Ali Ahmed (Parent)',
    role: 'parent',
    subtitle: 'Student: Ali Ahmed - 9A',
    lastMessage: 'Thank you Sir, we will check his homework.',
    time: 'Mon',
    unreadCount: 0,
    isOnline: true
  }
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'principal': [
    { id: 'p1', text: 'Good Morning. Are the grade 9 papers checked?', sender: 'other', timestamp: '09:00 AM', status: 'read' },
    { id: 'p2', text: 'Yes Sir, I am finalizing the list.', sender: 'me', timestamp: '09:05 AM', status: 'read' },
    { id: 'p3', text: 'Please submit the weekly report by Friday.', sender: 'other', timestamp: '10:00 AM', status: 'delivered' }
  ],
  'student-ali': [
    { id: 's1', text: 'Sir, Ali is sick today.', sender: 'other', timestamp: 'Mon', status: 'read' },
    { id: 's2', text: 'Noted. Hope he gets well soon.', sender: 'me', timestamp: 'Mon', status: 'read' },
    { id: 's3', text: 'Thank you Sir, we will check his homework.', sender: 'other', timestamp: 'Mon', status: 'read' }
  ]
};

const TeacherMessenger: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sound & Notification Logic
  const playNotificationSound = () => {
      const audio = new Audio(NOTIFICATION_SOUND);
      audio.play().catch(e => {
        if (e.name !== 'AbortError') {
          console.error("Audio play failed:", e);
        }
      });
  };

  const sendLocalNotification = (title: string, body: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
      }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  const activeContact = MOCK_TEACHER_CONTACTS.find(c => c.id === activeChatId);
  const activeMessages = activeChatId ? (messages[activeChatId] || []) : [];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChatId) return;

    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));
    setNewMessage('');

    // Fake Reply Logic
    setTimeout(() => {
        const replyMsg: Message = {
            id: Date.now().toString(),
            text: activeContact?.role === 'class' ? "Parent: Received, thanks." : "Okay, noted.",
            sender: 'other',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
        };
        setMessages(prev => {
             const updated = [...(prev[activeChatId] || [])].map(m => m.sender === 'me' ? {...m, status: 'read' as const} : m);
             return { ...prev, [activeChatId]: [...updated, replyMsg] };
        });
        playNotificationSound();
        sendLocalNotification("New Reply", replyMsg.text);
    }, 2000);
  };

  // --- RENDER INBOX ---
  if (!activeChatId) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 min-h-screen pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-4">
                <div className="w-14 h-14 bg-[#6B1D2F] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-[#6B1D2F]/20">
                    <MessageSquare size={28} />
                </div>
                Messages
            </h1>
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search conversations..." 
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-[#6B1D2F]/10 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-[#6B1D2F]/5 outline-none transition-all shadow-sm"
                />
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
                {MOCK_TEACHER_CONTACTS.map((contact) => (
                    <div 
                        key={contact.id}
                        onClick={() => setActiveChatId(contact.id)}
                        className="p-6 flex items-center gap-6 hover:bg-slate-50 dark:bg-slate-800/50 transition-all cursor-pointer group"
                    >
                        <div className="relative shrink-0">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-2xl font-black shadow-lg transition-transform group-hover:scale-105 ${
                                contact.role === 'principal' ? 'bg-slate-900 shadow-slate-900/20' : 
                                contact.role === 'class' ? 'bg-[#6B1D2F] shadow-[#6B1D2F]/20' : 'bg-emerald-600 shadow-emerald-500/20'
                            }`}>
                                {contact.name[0]}
                            </div>
                            {contact.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-[#6B1D2F] transition-colors">{contact.name}</h4>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${contact.unreadCount > 0 ? 'text-[#6B1D2F] dark:text-white' : 'text-slate-400'}`}>{contact.time}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{contact.subtitle}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{contact.role}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className={`text-sm truncate max-w-[90%] ${contact.unreadCount > 0 ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-500'}`}>
                                    {contact.lastMessage}
                                </p>
                                {contact.unreadCount > 0 && (
                                    <div className="w-6 h-6 bg-[#6B1D2F] text-white text-[10px] font-black rounded-xl flex items-center justify-center shadow-lg shadow-[#6B1D2F]/20 animate-bounce">
                                        {contact.unreadCount}
                                    </div>
                                )}
                            </div>
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-[#6B1D2F] dark:text-white/50 transition-colors" size={20} />
                    </div>
                ))}
            </div>
            {MOCK_TEACHER_CONTACTS.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mb-6">
                        <MessageSquare size={40} className="text-slate-200"/>
                    </div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">No Messages Yet</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                        Your conversations with parents, students, and staff will appear here.
                    </p>
                </div>
            )}
        </div>
      </div>
    );
  }

  // --- RENDER CHAT ROOM ---
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-slate-800 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl relative animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-6 flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 shadow-sm z-10">
            <button onClick={() => setActiveChatId(null)} className="p-3 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-slate-100 transition-all active:scale-90">
                <ArrowLeft size={20} />
            </button>
            <div className="relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg ${
                    activeContact?.role === 'principal' ? 'bg-slate-900 shadow-slate-900/20' : 'bg-[#6B1D2F] shadow-[#6B1D2F]/20'
                }`}>
                    {activeContact?.name[0]}
                </div>
                {activeContact?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
                )}
            </div>
            <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{activeContact?.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeContact?.subtitle}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online Now</span>
                </div>
            </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50 dark:bg-slate-800/50 custom-scrollbar">
            <div className="text-center my-8">
                <span className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-sm">Today</span>
            </div>
            {activeMessages.map((msg) => {
                const isMe = msg.sender === 'me';
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[75%] px-6 py-4 rounded-[1.5rem] text-sm shadow-sm transition-all hover:shadow-md ${
                            isMe 
                                ? 'bg-[#6B1D2F] text-white rounded-br-none' 
                                : 'bg-white text-slate-900 rounded-bl-none border border-[#6B1D2F]/10'
                        }`}>
                            <p className="font-bold leading-relaxed">{msg.text}</p>
                            <div className={`text-[9px] font-black uppercase tracking-widest mt-2 flex items-center justify-end gap-1.5 ${isMe ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                                {msg.timestamp} 
                                {isMe && (
                                    msg.status === 'read' 
                                        ? <CheckCheck size={12} className="text-[#D4AF37]"/> 
                                        : <Check size={12} className="text-[#D4AF37]/70"/>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-4 items-center">
                <button className="p-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                    <Smile size={24} />
                </button>
                <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message here..." 
                    className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 outline-none transition-all"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="w-14 h-14 bg-[#6B1D2F] text-white rounded-2xl shadow-xl shadow-[#6B1D2F]/20 flex items-center justify-center hover:bg-[#4A1421] disabled:opacity-50 disabled:shadow-none transition-all active:scale-90 shrink-0"
                >
                    <Send size={24} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default TeacherMessenger;
