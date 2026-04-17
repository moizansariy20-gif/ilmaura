import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { VideoCamera, Question, ChatCircleText, Plus, Trash, X, PaperPlaneRight, EnvelopeSimple, CloudCheck } from 'phosphor-react';
import { 
    SupportVideo, SupportFAQ, SupportTicket, TicketMessage, SupportContact 
} from '../../types';
import { 
    subscribeToSupportVideos, addSupportVideo, deleteSupportVideo,
    subscribeToSupportFAQs, addSupportFAQ, deleteSupportFAQ,
    subscribeToSupportTickets, updateSupportTicketStatus,
    subscribeToTicketMessages, addTicketMessage,
    subscribeToSupportContacts, updateSupportContacts, createSupportContacts
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth.ts';

export default function SupportManagement() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'content' | 'helpdesk' | 'contacts'>('content');
    const [contacts, setContacts] = useState<SupportContact | null>(null);
    const [contactForm, setContactForm] = useState({ whatsapp: '', email: '' });
    
    // Content State
    const [videos, setVideos] = useState<SupportVideo[]>([]);
    const [faqs, setFaqs] = useState<SupportFAQ[]>([]);
    
    // Helpdesk State
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Modals
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showFAQModal, setShowFAQModal] = useState(false);
    
    // Forms
    const [videoForm, setVideoForm] = useState({ title: '', description: '', youtubeUrl: '' });
    const [faqForm, setFaqForm] = useState({ question: '', answer: '' });

    useEffect(() => {
        const unsubVideos = subscribeToSupportVideos(setVideos);
        const unsubFAQs = subscribeToSupportFAQs(setFaqs);
        const unsubTickets = subscribeToSupportTickets(null, setTickets);
        const unsubContacts = subscribeToSupportContacts(setContacts);
        
        return () => {
            unsubVideos();
            unsubFAQs();
            unsubTickets();
            unsubContacts();
        };
    }, []);

    useEffect(() => {
        if (contacts) {
            setContactForm({ whatsapp: contacts.whatsapp, email: contacts.email });
        }
    }, [contacts]);

    const handleUpdateContacts = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (contacts) {
                await updateSupportContacts(contacts.id, contactForm);
            } else {
                await createSupportContacts(contactForm);
            }
            setSuccessMessage("Support contact information has been updated successfully.");
            setShowSuccess(true);
        } catch (error) {
            console.error("Error updating contacts:", error);
            alert("Failed to update contacts");
        }
    };

    useEffect(() => {
        if (selectedTicket) {
            const unsubMessages = subscribeToTicketMessages(selectedTicket.id, setMessages);
            return () => unsubMessages();
        }
    }, [selectedTicket]);

    // --- Content Handlers ---
    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addSupportVideo(videoForm);
            setShowVideoModal(false);
            setVideoForm({ title: '', description: '', youtubeUrl: '' });
            setSuccessMessage("Training video has been added successfully.");
            setShowSuccess(true);
        } catch (error) {
            console.error("Error adding video:", error);
            alert("Failed to add video");
        }
    };

    const handleAddFAQ = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addSupportFAQ(faqForm);
            setShowFAQModal(false);
            setFaqForm({ question: '', answer: '' });
            setSuccessMessage("FAQ has been added successfully.");
            setShowSuccess(true);
        } catch (error) {
            console.error("Error adding FAQ:", error);
            alert("Failed to add FAQ");
        }
    };

    // --- Helpdesk Handlers ---
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTicket || !user) return;
        
        try {
            await addTicketMessage({
                ticketId: selectedTicket.id,
                senderId: user.id,
                senderRole: 'mother-admin',
                message: newMessage.trim()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!selectedTicket) return;
        try {
            await updateSupportTicketStatus(selectedTicket.id, status);
            setSelectedTicket({ ...selectedTicket, status: status as any });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // Helper to extract YouTube ID
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support & Helpdesk</h1>
                    <p className="text-gray-500">Manage training content and respond to school issues</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`pb-4 px-4 font-medium text-sm transition-colors relative ${
                        activeTab === 'content' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <div className="flex items-center space-x-2">
                        <VideoCamera size={20} />
                        <span>Content Manager</span>
                    </div>
                    {activeTab === 'content' && (
                        <motion.div layoutId="activeTabSupport" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('helpdesk')}
                    className={`pb-4 px-4 font-medium text-sm transition-colors relative ${
                        activeTab === 'helpdesk' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <div className="flex items-center space-x-2">
                        <ChatCircleText size={20} />
                        <span>Issues Helpdesk</span>
                        {tickets.filter(t => t.status === 'Open').length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {tickets.filter(t => t.status === 'Open').length}
                            </span>
                        )}
                    </div>
                    {activeTab === 'helpdesk' && (
                        <motion.div layoutId="activeTabSupport" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('contacts')}
                    className={`pb-4 px-4 font-medium text-sm transition-colors relative ${
                        activeTab === 'contacts' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <div className="flex items-center space-x-2">
                        <EnvelopeSimple size={20} />
                        <span>Contact Settings</span>
                    </div>
                    {activeTab === 'contacts' && (
                        <motion.div layoutId="activeTabSupport" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                </button>
            </div>

            {/* CONTENT MANAGER TAB */}
            {activeTab === 'content' && (
                <div className="space-y-8">
                    {/* Videos Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <VideoCamera className="text-blue-500" /> Training Videos
                            </h2>
                            <button onClick={() => setShowVideoModal(true)} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-2">
                                <Plus size={16} /> Add Video
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videos.map(video => {
                                const videoId = getYouTubeId(video.youtubeUrl);
                                return (
                                    <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {videoId ? (
                                            <iframe 
                                                className="w-full h-48" 
                                                src={`https://www.youtube.com/embed/${videoId}`} 
                                                title={video.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">Invalid URL</div>
                                        )}
                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-gray-900">{video.title}</h3>
                                                <button onClick={() => deleteSupportVideo(video.id)} className="text-red-500 hover:text-red-700 p-1">
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                            {video.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                            {videos.length === 0 && <p className="text-gray-500 col-span-full py-4 text-center">No videos added yet.</p>}
                        </div>
                    </div>

                    {/* FAQs Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Question className="text-green-500" /> Frequently Asked Questions
                            </h2>
                            <button onClick={() => setShowFAQModal(true)} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-2">
                                <Plus size={16} /> Add FAQ
                            </button>
                        </div>
                        <div className="space-y-3">
                            {faqs.map(faq => (
                                <div key={faq.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Q: {faq.question}</h3>
                                        <p className="text-gray-600 mt-1">A: {faq.answer}</p>
                                    </div>
                                    <button onClick={() => deleteSupportFAQ(faq.id)} className="text-red-500 hover:text-red-700 p-1 ml-4 shrink-0">
                                        <Trash size={16} />
                                    </button>
                                </div>
                            ))}
                            {faqs.length === 0 && <p className="text-gray-500 py-4 text-center">No FAQs added yet.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTACT SETTINGS TAB */}
            {activeTab === 'contacts' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Support Contact Settings</h2>
                    <form onSubmit={handleUpdateContacts} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
                            <input 
                                required 
                                type="text" 
                                value={contactForm.whatsapp} 
                                onChange={e => setContactForm({...contactForm, whatsapp: e.target.value})} 
                                className="input-field" 
                                placeholder="+1 (555) 000-0000" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Support Email *</label>
                            <input 
                                required 
                                type="email" 
                                value={contactForm.email} 
                                onChange={e => setContactForm({...contactForm, email: e.target.value})} 
                                className="input-field" 
                                placeholder="support@example.com" 
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full">Update Contacts</button>
                    </form>
                </div>
            )}

            {/* HELPDESK TAB */}
            {activeTab === 'helpdesk' && (
                <div className="flex h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Ticket List */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="font-bold text-gray-900">Support Tickets</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {tickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-gray-900 truncate pr-2">{ticket.schoolName || 'Unknown School'}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                            ticket.status === 'Open' ? 'bg-red-100 text-red-700' :
                                            ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{ticket.subject}</p>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                            {tickets.length === 0 && <div className="p-8 text-center text-gray-500">No tickets found.</div>}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="w-2/3 flex flex-col bg-gray-50">
                        {selectedTicket ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                                        <p className="text-sm text-gray-500">{selectedTicket.schoolName}</p>
                                    </div>
                                    <select 
                                        value={selectedTicket.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="input-field py-1.5 text-sm w-auto"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map(msg => {
                                        const isMe = msg.senderRole === 'mother-admin';
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                                    isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                                                }`}>
                                                    <p className="text-sm">{msg.message}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                    {messages.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            No messages yet. Send a reply to start the conversation.
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your reply..."
                                            className="input-field flex-1"
                                        />
                                        <button type="submit" disabled={!newMessage.trim()} className="btn-primary px-4 flex items-center gap-2">
                                            <span>Send</span>
                                            <PaperPlaneRight weight="fill" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <ChatCircleText size={48} className="mb-4 opacity-20" />
                                <p>Select a ticket to view details and reply</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Video Modal */}
            {showVideoModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Add Training Video</h2>
                            <button onClick={() => setShowVideoModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddVideo} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video Title *</label>
                                <input required type="text" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className="input-field" placeholder="e.g., How to add a student" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
                                <input required type="url" value={videoForm.youtubeUrl} onChange={e => setVideoForm({...videoForm, youtubeUrl: e.target.value})} className="input-field" placeholder="https://www.youtube.com/watch?v=..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} className="input-field min-h-[80px]" placeholder="Brief description of the video..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowVideoModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Add Video</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Add FAQ Modal */}
            {showFAQModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Add FAQ</h2>
                            <button onClick={() => setShowFAQModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddFAQ} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                                <input required type="text" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} className="input-field" placeholder="e.g., How do I reset a password?" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                                <textarea required value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} className="input-field min-h-[120px]" placeholder="Provide the answer here..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowFAQModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Add FAQ</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CloudCheck size={32} weight="fill" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                        <p className="text-gray-500 mb-6">{successMessage}</p>
                        <button 
                            onClick={() => setShowSuccess(false)}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                        >
                            Continue
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
