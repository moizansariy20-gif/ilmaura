import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlass, Question, PlayCircle, Ticket, 
  EnvelopeSimple, WhatsappLogo, Lifebuoy, CaretDown, CaretUp,
  PaperPlaneRight, X
} from 'phosphor-react';
import { 
    SupportVideo, SupportFAQ, SupportTicket, TicketMessage, SupportContact 
} from '../../types';
import { 
    subscribeToSupportVideos, subscribeToSupportFAQs, 
    subscribeToSupportTickets, createSupportTicket, 
    subscribeToTicketMessages, addTicketMessage,
    subscribeToSupportContacts
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth.ts';

const HelpSupport = ({ profile }: { profile: any }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  
  const [videos, setVideos] = useState<SupportVideo[]>([]);
  const [faqs, setFaqs] = useState<SupportFAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [contacts, setContacts] = useState<SupportContact | null>(null);
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubVideos = subscribeToSupportVideos(setVideos);
    const unsubFAQs = subscribeToSupportFAQs(setFaqs);
    const unsubTickets = subscribeToSupportTickets(profile.schoolId, setTickets);
    const unsubContacts = subscribeToSupportContacts(setContacts);
    
    return () => {
        unsubVideos();
        unsubFAQs();
        unsubTickets();
        unsubContacts();
    };
  }, [profile.schoolId]);

  useEffect(() => {
    if (selectedTicket) {
        const unsubMessages = subscribeToTicketMessages(selectedTicket.id, setMessages);
        return () => unsubMessages();
    }
  }, [selectedTicket]);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDescription.trim()) return;
    try {
        const ticket = await createSupportTicket({
            schoolId: profile.schoolId,
            schoolName: profile.schoolName || 'Unknown School',
            subject: newTicketSubject,
            description: newTicketDescription
        });
        setNewTicketSubject('');
        setNewTicketDescription('');
        setShowNewTicketModal(false);
        setSelectedTicket(ticket);
    } catch (error) {
        console.error("Error creating ticket:", error);
        alert("Failed to create ticket");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || !user) return;
    
    try {
        await addTicketMessage({
            ticketId: selectedTicket.id,
            senderId: user.id,
            senderRole: 'principal',
            message: newMessage.trim()
        });
        setNewMessage('');
    } catch (error) {
        console.error("Error sending message:", error);
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const filteredFaqs = faqs.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredVideos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        {/* HEADER */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
                  <Lifebuoy size={32} weight="fill" />
                  Help & Support
                </h1>
                <p className="text-sm font-bold text-blue-200 uppercase tracking-wider mt-1">
                  Find answers, watch tutorials, or contact our team
                </p>
            </div>
        </div>

        <div className="p-8 space-y-8 bg-white dark:bg-[#1e293b]">
          {/* SEARCH BAR */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-[#1e293b] p-2 group focus-within:border-[#1e3a8a] transition-colors">
                <MagnifyingGlass size={24} weight="bold" className="text-slate-400 ml-2 group-focus-within:text-[#1e3a8a]"/>
                <input 
                  type="text" 
                  placeholder="SEARCH FOR HELP TOPICS..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm font-bold uppercase tracking-wider outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: FAQs & Videos */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* VIDEO TUTORIALS */}
              <div className="border-2 border-slate-200 dark:border-[#1e293b] p-6 bg-white dark:bg-[#1e293b]">
                <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2 text-[#1e3a8a]">
                  <PlayCircle size={24} weight="fill" />
                  Video Tutorials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVideos.map((video) => {
                    const videoId = getYouTubeId(video.youtubeUrl);
                    return (
                        <div key={video.id} className="border-2 border-slate-200 dark:border-[#1e293b] overflow-hidden">
                            {videoId ? (
                                <iframe 
                                    className="w-full aspect-video" 
                                    src={`https://www.youtube.com/embed/${videoId}`} 
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="w-full aspect-video bg-slate-100 flex items-center justify-center text-slate-400">Invalid URL</div>
                            )}
                            <div className="p-3 bg-slate-50 dark:bg-[#0f172a]">
                                <p className="font-bold text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                    {video.title}
                                </p>
                            </div>
                        </div>
                    );
                  })}
                  {filteredVideos.length === 0 && <p className="text-slate-500 col-span-full py-4">No videos found.</p>}
                </div>
              </div>

              {/* FAQs */}
              <div className="border-2 border-slate-200 dark:border-[#1e293b] p-6 bg-slate-50 dark:bg-[#0f172a]">
                <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2 text-[#1e3a8a]">
                  <Question size={24} weight="fill" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#1e293b]">
                      <button 
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:bg-[#0f172a] transition-colors"
                      >
                        <span className="font-bold text-sm uppercase tracking-wide text-slate-800 dark:text-slate-100">{faq.question}</span>
                        {openFaq === faq.id ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                      </button>
                      {openFaq === faq.id && (
                        <div className="p-4 border-t-2 border-slate-100 dark:border-[#334155] bg-slate-50 dark:bg-[#0f172a] text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredFaqs.length === 0 && <p className="text-slate-500 py-4">No FAQs found.</p>}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Support Ticket & Contact */}
            <div className="space-y-8">
              {/* SUPPORT TICKETS */}
              <div className="border-2 border-[#1e3a8a] flex flex-col h-[600px] bg-white dark:bg-[#1e293b] shadow-[4px_4px_0px_#1e3a8a]">
                <div className="p-4 border-b-2 border-[#1e3a8a] bg-slate-50 dark:bg-[#0f172a] flex justify-between items-center">
                    <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-[#1e3a8a]">
                    <Ticket size={20} weight="fill" />
                    My Tickets
                    </h2>
                    <button onClick={() => setShowNewTicketModal(true)} className="bg-[#1e3a8a] text-white text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#172554]">
                        New Ticket
                    </button>
                </div>
                
                {!selectedTicket ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {tickets.map(ticket => (
                            <div 
                                key={ticket.id} 
                                onClick={() => setSelectedTicket(ticket)}
                                className="border-2 border-slate-200 p-3 cursor-pointer hover:border-[#1e3a8a] transition-colors"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-slate-800 truncate pr-2">{ticket.subject}</span>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 shrink-0 ${
                                        ticket.status === 'Open' ? 'bg-red-100 text-red-700' :
                                        ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                        {tickets.length === 0 && <p className="text-slate-500 text-center py-8 text-sm font-bold uppercase">No tickets found.</p>}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 border-b-2 border-slate-200 bg-slate-50 flex items-center gap-2">
                            <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-slate-800">
                                <CaretDown size={20} className="rotate-90" />
                            </button>
                            <div className="flex-1 truncate">
                                <p className="font-bold text-sm text-slate-800 truncate">{selectedTicket.subject}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{selectedTicket.status}</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map(msg => {
                                const isMe = msg.senderRole === 'principal';
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 ${
                                            isMe ? 'bg-[#1e3a8a] text-white rounded-l-xl rounded-tr-xl' : 'bg-white border-2 border-slate-200 text-slate-800 rounded-r-xl rounded-tl-xl'
                                        }`}>
                                            <p className="text-sm font-medium">{msg.message}</p>
                                            <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-3 bg-white border-t-2 border-slate-200">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 border-2 border-slate-200 p-2 text-sm font-bold outline-none focus:border-[#1e3a8a]"
                                />
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            alert("Image upload functionality needs backend implementation.");
                                        }
                                    }}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer bg-slate-200 text-slate-700 px-3 flex items-center justify-center hover:bg-slate-300">
                                    📷
                                </label>
                                <button type="submit" disabled={!newMessage.trim()} className="bg-[#1e3a8a] text-white px-3 flex items-center justify-center hover:bg-[#172554] disabled:opacity-50">
                                    <PaperPlaneRight weight="fill" size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
              </div>

              {/* CONTACT INFO */}
              <div className="border-2 border-slate-200 dark:border-[#1e293b] p-6 bg-slate-50 dark:bg-[#0f172a]">
                <h2 className="text-lg font-black uppercase tracking-tight mb-4 text-slate-800 dark:text-slate-100">
                  Direct Contact
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-full shrink-0">
                      <WhatsappLogo size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">WhatsApp Support</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{contacts?.whatsapp || 'Not Available'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full shrink-0">
                      <EnvelopeSimple size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Support</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{contacts?.email || 'Not Available'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a] w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b-2 border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-black uppercase tracking-tight text-[#1e3a8a]">Create New Ticket</h2>
                    <button onClick={() => setShowNewTicketModal(false)} className="text-slate-400 hover:text-slate-800"><X size={24} weight="bold" /></button>
                </div>
                <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Subject / Issue Title *</label>
                        <input 
                            required 
                            type="text" 
                            value={newTicketSubject} 
                            onChange={e => setNewTicketSubject(e.target.value)} 
                            className="w-full border-2 border-slate-200 p-3 text-sm font-bold outline-none focus:border-[#1e3a8a]" 
                            placeholder="e.g., Cannot add new student" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Description *</label>
                        <textarea 
                            required 
                            value={newTicketDescription} 
                            onChange={e => setNewTicketDescription(e.target.value)} 
                            className="w-full border-2 border-slate-200 p-3 text-sm font-bold outline-none focus:border-[#1e3a8a] resize-none" 
                            rows={4}
                            placeholder="Describe your issue in detail..." 
                        />
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="w-full bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-xs py-4 hover:bg-[#172554] transition-colors">
                            Create Ticket
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupport;
