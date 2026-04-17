
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft01Icon as ArrowLeft, Search01Icon as Search, MoreVerticalIcon as MoreVertical, SentIcon as Send, 
  SmileIcon as Smile, CheckmarkCircle01Icon as Check, CheckmarkBadge01Icon as CheckCheck, Shield01Icon as Shield, Cancel01Icon as X, ArrowRight01Icon as ChevronRight, Message01Icon as MessageSquare, Notification01Icon as Bell, CallIcon as Phone, Video01Icon as Video
} from 'hugeicons-react';

// --- SOUND ASSET ---
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

// --- TYPES ---
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
  avatar?: string;
  photoURL?: string; // Added to support real images
  role: 'teacher' | 'group' | 'admin';
  subject?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline?: boolean;
}

// --- MOCK DATA ---
const MOCK_CONTACTS: ChatContact[] = [
  {
    id: 'group-class-9a',
    name: 'Grade 9 - Official',
    role: 'group',
    lastMessage: 'Principal: Final exams schedule released.',
    time: '10:45 AM',
    unreadCount: 3,
    avatar: '9A'
  }
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'group-class-9a': [
    { id: 'm1', text: 'Welcome to the new academic session.', sender: 'other', senderName: 'Principal', timestamp: '08:00 AM', status: 'read' },
    { id: 'm2', text: 'Physics Lab Coat is mandatory.', sender: 'other', senderName: 'Ms. Fatima Zia', timestamp: '09:15 AM', status: 'read' },
    { id: 'm5', text: 'Final exams schedule released. Check notice board.', sender: 'other', senderName: 'Principal', timestamp: '10:45 AM', status: 'read' },
  ]
};

interface MessengerProps { 
    profile: any; 
    currentClass: any;
    initialChatId?: string | null;
    teachers?: any[]; // Passed to resolve names/avatars if not in mock contacts
}

const Messenger: React.FC<MessengerProps> = ({ profile, currentClass, initialChatId, teachers = [] }) => {
  const navigate = useNavigate();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>(MOCK_CONTACTS);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Populate contacts with real teachers
  useEffect(() => {
    if (teachers.length > 0) {
      // Create contacts from teachers list
      const teacherContacts: ChatContact[] = teachers.map(t => ({
        id: t.id,
        name: t.name,
        role: 'teacher',
        subject: t.designation || 'Faculty',
        avatar: t.name[0],
        photoURL: t.photoURL,
        lastMessage: 'Tap to start conversation',
        time: '',
        unreadCount: 0,
        isOnline: false
      }));

      setContacts(prev => {
         // Avoid duplicates if teachers are already added
         const existingIds = new Set(prev.map(c => c.id));
         const newContacts = teacherContacts.filter(tc => !existingIds.has(tc.id));
         return [...prev, ...newContacts];
      });
    }
  }, [teachers]);

  // Initialize Active Chat if ID passed via props (Direct Link from Dashboard)
  useEffect(() => {
      if (initialChatId) {
          setActiveChatId(initialChatId);
          // If message history doesn't exist for this ID, init it
          setMessages(prev => {
              if (!prev[initialChatId]) {
                  return { ...prev, [initialChatId]: [] };
              }
              return prev;
          });
      }
  }, [initialChatId]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  const activeContact = contacts.find(c => c.id === activeChatId);
  const activeMessages = activeChatId ? (messages[activeChatId] || []) : [];

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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChatId) return;
    
    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), msg]
    }));
    
    setNewMessage('');
    
    // Simulate Reply
    setTimeout(() => {
        const replyMsg: Message = {
            id: Date.now().toString(),
            text: "Got it! I will check and get back to you shortly.",
            sender: 'other',
            senderName: activeContact?.name,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
        };

        setMessages(prev => {
            const updatedChat = [...(prev[activeChatId] || [])].map(m => 
                m.sender === 'me' ? { ...m, status: 'read' as const } : m
            );
            return { ...prev, [activeChatId]: [...updatedChat, replyMsg] };
        });

        playNotificationSound();
        sendLocalNotification(activeContact?.name || "New Message", replyMsg.text);
    }, 2000);
  };

  // --- VIEW: INBOX ---
  if (!activeChatId) {
    return (
      <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
        {/* TOP NAV BAR */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
            <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
            >
                <ArrowLeft size={20} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
            </button>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Student</p>
                    <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37]/40 shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                    {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        profile?.name?.charAt(0) || 'S'
                    )}
                </div>
            </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10 mt-4">
          {/* Header Section */}
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Messages</h1>
                <div className="flex flex-col mt-1 md:mt-2">
                  <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Inbox</p>
                  <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    Communicate with teachers
                  </p>
                </div>
              </div>
              
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <MessageSquare size={32} className="text-[#D4AF37] relative z-10" />
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 space-y-8">
            {/* Search */}
            <div className="bg-[#FCFBF8] dark:bg-slate-800/50 p-3 rounded-[2rem] border border-[#D4AF37]/20 shadow-sm flex items-center mb-6">
                <div className="w-10 h-10 flex items-center justify-center text-[#1e3a8a]/50 dark:text-[#D4AF37]/50">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search chats..." 
                    className="flex-1 bg-transparent outline-none font-bold text-[#1e3a8a] dark:text-white placeholder:text-[#1e3a8a]/30 dark:placeholder:text-[#D4AF37]/30 text-sm"
                />
            </div>

            {/* Chat List Card */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-[#D4AF37]/20 shadow-xl overflow-hidden min-h-[500px]">
                <div className="p-6 pb-4 border-b border-[#D4AF37]/10">
                    <h3 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Your Teachers</h3>
                </div>
                
                <div className="divide-y divide-[#D4AF37]/10">
                    {contacts.map((contact) => (
                        <div 
                            key={contact.id}
                            onClick={() => setActiveChatId(contact.id)}
                            className="p-5 flex items-center gap-4 hover:bg-[#D4AF37]/5 dark:hover:bg-slate-800/80 transition-colors cursor-pointer active:scale-[0.98] duration-200"
                        >
                            {/* Avatar */}
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md border-2 border-white dark:border-slate-700 ${contact.role === 'group' ? 'bg-gradient-to-br from-[#1e3a8a] to-blue-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} overflow-hidden`}>
                                {contact.photoURL ? (
                                    <img src={contact.photoURL} alt={contact.name} className="w-full h-full object-cover" />
                                ) : (
                                    contact.avatar || contact.name[0]
                                )}
                                {contact.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-black text-[#1e3a8a] dark:text-white text-sm truncate">{contact.name}</h4>
                                    <span className={`text-[10px] font-bold ${contact.unreadCount > 0 ? 'text-[#D4AF37]' : 'text-[#1e3a8a]/40 dark:text-white/40'}`}>{contact.time}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <p className={`text-xs truncate max-w-[85%] ${contact.unreadCount > 0 ? 'font-bold text-[#1e3a8a] dark:text-white' : 'font-medium text-[#1e3a8a]/60 dark:text-white/60'}`}>
                                        {contact.role === 'group' && <span className="text-[#D4AF37] mr-1">{contact.lastMessage.split(':')[0]}:</span>}
                                        {contact.role === 'group' ? contact.lastMessage.split(':')[1] : contact.lastMessage}
                                    </p>
                                    {contact.unreadCount > 0 && (
                                        <div className="w-5 h-5 bg-[#1e3a8a] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                                            {contact.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: CHAT ROOM ---
  return (
    <div className="fixed inset-0 z-[300] bg-[#f8fafc] flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 shadow-sm shrink-0 safe-top h-20">
         <button onClick={() => setActiveChatId(null)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50 rounded-full transition-all active:scale-90">
            <ArrowLeft size={24} />
         </button>
         
         <div className="flex items-center gap-3 flex-1">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 ${activeContact?.role === 'group' ? 'bg-[#1e3a8a]' : 'bg-emerald-500'} overflow-hidden`}>
                {activeContact?.photoURL ? (
                    <img src={activeContact.photoURL} alt={activeContact.name} className="w-full h-full object-cover" />
                ) : (
                    activeContact?.avatar || activeContact?.name[0]
                )}
             </div>
             <div>
                 <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight flex items-center gap-2">
                     {activeContact?.name}
                     {activeContact?.role === 'group' && <ChevronRight size={14} className="text-slate-400" />}
                 </h3>
                 {activeContact?.role === 'group' ? (
                     <p className="text-[10px] font-bold text-slate-400 truncate">Official Channel</p>
                 ) : (
                     <p className="text-[10px] font-bold text-emerald-600">Online</p>
                 )}
             </div>
         </div>

         {activeContact?.role !== 'group' && (
             <div className="flex gap-2 text-slate-400">
                 <button className="p-2 hover:bg-slate-50 dark:bg-slate-800/50 rounded-full"><Phone size={20} /></button>
                 <button className="p-2 hover:bg-slate-50 dark:bg-slate-800/50 rounded-full"><Video size={20} /></button>
             </div>
         )}
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#f8fafc]"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
         <div className="max-w-3xl mx-auto space-y-4 pb-4">
             <div className="text-center my-6">
                 <span className="bg-slate-200/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Today</span>
             </div>
             
             {activeMessages.map((msg) => {
                 const isMe = msg.sender === 'me';
                 return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div 
                            className={`max-w-[80%] rounded-[1.2rem] px-5 py-3 relative shadow-sm text-sm leading-relaxed ${
                            isMe 
                                ? 'bg-[#1e3a8a] text-white rounded-br-none' 
                                : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                            }`}
                        >
                            {/* Sender Name in Group */}
                            {activeContact?.role === 'group' && !isMe && (
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-black text-indigo-600">{msg.senderName}</span>
                                    {msg.senderName === 'Principal' && <span className="text-[8px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>}
                                </div>
                            )}
                            
                            <p>{msg.text}</p>
                            
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                <span className="text-[9px] font-bold opacity-80">{msg.timestamp}</span>
                                {isMe && (
                                    <span>
                                    {msg.status === 'read' ? <CheckCheck size={12} className="text-emerald-300"/> : <Check size={12}/>}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                 );
             })}
             <div ref={messagesEndRef} />
         </div>
      </div>

      {/* Input Area */}
      {activeContact?.role !== 'group' ? (
        <div className="bg-white dark:bg-slate-800 p-3 border-t border-slate-200 dark:border-slate-700 shrink-0 safe-bottom">
            <div className="max-w-3xl mx-auto flex items-end gap-2">
                <div className="flex-1 bg-slate-100 rounded-[1.5rem] flex items-center p-1.5 border border-transparent focus-within:border-indigo-300 focus-within:bg-white dark:bg-slate-800 transition-all shadow-inner">
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-full"><Smile size={24} /></button>
                    <textarea 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium max-h-24 py-3 px-2 resize-none"
                        rows={1}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    />
                </div>
                
                <button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-lg transition-all ${
                        newMessage.trim() ? 'bg-[#1e3a8a] hover:bg-blue-900 active:scale-90' : 'bg-slate-300 cursor-default'
                    }`}
                >
                    <Send size={20} className="ml-0.5" />
                </button>
            </div>
        </div>
      ) : (
          <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 py-2 rounded-xl">Only Admins can send messages in this group.</p>
          </div>
      )}

    </div>
  );
};

export default Messenger;
