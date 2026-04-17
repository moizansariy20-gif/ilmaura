import React, { useState, useEffect } from 'react';
import { FacebookLogo, InstagramLogo, LinkedinLogo, CheckCircle, WarningCircle, Link, Trash, ChartLineUp, ThumbsUp, ChatCircle, Sparkle } from 'phosphor-react';
import { School } from '../../types.ts';
import { updateSchoolBranding } from '../../services/api.ts';

interface SocialMediaManagementProps {
  school: School;
  onUpdate: () => void;
}

const FB_APP_ID = (import.meta as any).env.VITE_FACEBOOK_APP_ID;

const SocialMediaManagement: React.FC<SocialMediaManagementProps> = ({ school, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [pageStats, setPageStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'connections' | 'dashboard'>('connections');

  const fbConfig = school.socialMediaConfig?.facebook;

  useEffect(() => {
    if (fbConfig && activeTab === 'dashboard') {
      fetchFacebookDashboard(fbConfig.pageId, fbConfig.accessToken);
    }
  }, [fbConfig, activeTab]);

  const fetchFacebookDashboard = async (pageId: string, token: string) => {
    try {
      // Fetch recent posts
      const postsRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true)&limit=5&access_token=${token}`);
      const postsData = await postsRes.json();
      if (!postsData.error && postsData.data) {
        setRecentPosts(postsData.data);
      }

      // Fetch page info (followers/likes/picture)
      const pageRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=followers_count,fan_count,picture.type(large)&access_token=${token}`);
      const pageData = await pageRes.json();
      if (!pageData.error) {
        setPageStats(pageData);
      }
    } catch (err) {
      console.error("Failed to fetch FB dashboard data", err);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'SOCIAL_AUTH_SUCCESS' && event.data?.provider === 'facebook') {
        const token = event.data.token;
        await fetchFacebookPages(token);
      } else if (event.data?.type === 'SOCIAL_AUTH_ERROR') {
        setError(`Failed to connect: ${event.data.errorDescription || event.data.error}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectFacebook = () => {
    setError(null);
    setSuccess(null);
    
    if (!FB_APP_ID || FB_APP_ID === '123456789012345') {
      setError("Facebook App ID is not configured. Go to developers.facebook.com, create an app, and add your App ID to the VITE_FACEBOOK_APP_ID environment variable in AI Studio Settings.");
      return;
    }

    const redirectUri = `${window.location.origin}/social-auth-callback`;
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=pages_manage_posts,pages_read_engagement,pages_show_list`;
    
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(authUrl, 'Facebook Auth', `width=${width},height=${height},top=${top},left=${left}`);
  };

  const fetchFacebookPages = async (userAccessToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (data.data && data.data.length > 0) {
        setAvailablePages(data.data);
        setShowPageSelector(true);
      } else {
        setError("No Facebook Pages found for this account. Please create a Page first.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch Facebook Pages.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = async (page: any) => {
    setLoading(true);
    try {
      const newConfig = {
        ...school.socialMediaConfig,
        facebook: {
          pageId: page.id,
          pageName: page.name,
          accessToken: page.access_token,
          connectedAt: new Date().toISOString()
        }
      };

      await updateSchoolBranding(school.id, { socialMediaConfig: newConfig });
      setSuccess(`Successfully connected to Facebook Page: ${page.name}`);
      setShowPageSelector(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to save configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    if (!window.confirm("Are you sure you want to disconnect this Facebook Page?")) return;
    
    setLoading(true);
    try {
      const newConfig = { ...school.socialMediaConfig };
      delete newConfig.facebook;
      
      await updateSchoolBranding(school.id, { socialMediaConfig: newConfig });
      setSuccess("Facebook Page disconnected successfully.");
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to disconnect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Social Media Integration</h1>
            <div className="flex items-center gap-4 mt-2">
                 <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">Connections</span>
            </div>
          </div>
          
          <div className="flex bg-white/10 dark:bg-slate-800/10 p-1 mt-4 md:mt-0 border-2 border-white/20">
            <button 
              onClick={() => setActiveTab('connections')}
              className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'connections' ? 'bg-white dark:bg-slate-800 text-[#1e3a8a]' : 'text-white hover:bg-white/20 dark:bg-slate-800/20'}`}
            >
              Connections
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-800 text-[#1e3a8a]' : 'text-white hover:bg-white/20 dark:bg-slate-800/20'}`}
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 min-h-[600px]">
          {error && (
            <div className="bg-rose-100 text-rose-800 p-4 border-2 border-rose-300 flex items-center gap-3 mb-6 font-bold uppercase text-sm">
              <WarningCircle size={24} weight="fill" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-100 text-emerald-800 p-4 border-2 border-emerald-300 flex items-center gap-3 mb-6 font-bold uppercase text-sm">
              <CheckCircle size={24} weight="fill" />
              <p>{success}</p>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Facebook Card */}
              <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <div className="p-6 flex-1">
                  <div className="w-16 h-16 bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center mb-6 border-2 border-[#1877F2]/20">
                    <FacebookLogo size={32} weight="fill" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Facebook Page</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">
                    Auto-post your school notices directly to your official Facebook Page.
                  </p>

                  {fbConfig ? (
                    <div className="mt-8 p-4 bg-emerald-50 border-2 border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-700 font-black uppercase text-xs tracking-widest mb-2">
                        <CheckCircle size={18} weight="fill" />
                        Connected
                      </div>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{fbConfig.pageName}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase">
                        Since {new Date(fbConfig.connectedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-8 p-4 bg-slate-100 border-2 border-slate-300 border-dashed">
                      <p className="text-xs font-black text-slate-500 dark:text-slate-400 text-center uppercase tracking-widest">Not connected</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  {fbConfig ? (
                    <button
                      onClick={handleDisconnectFacebook}
                      disabled={loading}
                      className="w-full py-3 px-4 flex items-center justify-center gap-2 text-rose-700 bg-rose-50 border-2 border-rose-200 hover:bg-rose-100 transition-colors font-black text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      <Trash size={18} weight="bold" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectFacebook}
                      disabled={loading}
                      className="w-full py-3 px-4 flex items-center justify-center gap-2 text-white bg-[#1877F2] border-2 border-[#1877F2] hover:bg-[#166FE5] transition-colors font-black text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      <Link size={18} weight="bold" />
                      Connect Facebook
                    </button>
                  )}
                </div>
              </div>

              {/* Instagram Card (Coming Soon) */}
              <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col opacity-75">
                <div className="p-6 flex-1">
                  <div className="w-16 h-16 bg-pink-50 text-pink-600 flex items-center justify-center mb-6 border-2 border-pink-200">
                    <InstagramLogo size={32} weight="fill" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Instagram</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">
                    Share school events and photos directly to your Instagram feed.
                  </p>
                  <div className="mt-8 p-4 bg-slate-100 border-2 border-slate-300 border-dashed flex items-center justify-center">
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Coming Soon</span>
                  </div>
                </div>
                <div className="p-4 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <button disabled className="w-full py-3 px-4 bg-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest cursor-not-allowed border-2 border-slate-300">
                    Connect Instagram
                  </button>
                </div>
              </div>

              {/* LinkedIn Card (Coming Soon) */}
              <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col opacity-75">
                <div className="p-6 flex-1">
                  <div className="w-16 h-16 bg-sky-50 text-sky-600 flex items-center justify-center mb-6 border-2 border-sky-200">
                    <LinkedinLogo size={32} weight="fill" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">LinkedIn</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">
                    Post professional updates and job openings to your school's LinkedIn page.
                  </p>
                  <div className="mt-8 p-4 bg-slate-100 border-2 border-slate-300 border-dashed flex items-center justify-center">
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Coming Soon</span>
                  </div>
                </div>
                <div className="p-4 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <button disabled className="w-full py-3 px-4 bg-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest cursor-not-allowed border-2 border-slate-300">
                    Connect LinkedIn
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {!fbConfig ? (
                <div className="bg-white dark:bg-slate-800 p-16 border-2 border-slate-300 text-center">
                  <ChartLineUp size={64} className="mx-auto text-slate-300 mb-6" />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Accounts Connected</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md mx-auto font-bold uppercase tracking-wide text-sm">Connect your social media accounts in the Connections tab to view analytics and recent posts here.</p>
                  <button 
                    onClick={() => setActiveTab('connections')}
                    className="mt-8 px-8 py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest hover:bg-[#172554] transition-colors border-2 border-[#1e3a8a]"
                  >
                    Go to Connections
                  </button>
                </div>
              ) : (
                <>
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white dark:bg-slate-800 p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-6 rounded-xl">
                      {pageStats?.picture?.data?.url ? (
                        <img src={pageStats.picture.data.url} alt={fbConfig.pageName} className="w-16 h-16 rounded-full border-2 border-blue-200 object-cover shadow-sm" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border-2 border-blue-200 shadow-sm">
                          <FacebookLogo size={32} weight="fill" />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Active Page</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white truncate">{fbConfig.pageName}</p>
                        <a href={`https://facebook.com/${fbConfig.pageId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-bold mt-1 inline-block">View Page ↗</a>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-6">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200">
                        <ChartLineUp size={32} weight="fill" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Followers</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{pageStats?.followers_count || '--'}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-6">
                      <div className="w-16 h-16 bg-rose-50 text-rose-600 flex items-center justify-center border-2 border-rose-200">
                        <ThumbsUp size={32} weight="fill" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Page Likes</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{pageStats?.fan_count || '--'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Posts */}
                  <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden mt-8">
                    <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Posts & Engagement</h3>
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-200 px-3 py-1.5 rounded-full uppercase tracking-widest">Last 5 Posts</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/50/50">
                      {recentPosts.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">No recent posts found.</div>
                      ) : (
                        recentPosts.map(post => (
                          <div key={post.id} className="border-2 border-slate-200 dark:border-slate-700 p-5 rounded-xl hover:border-blue-300 transition-colors bg-white dark:bg-slate-800 shadow-sm flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                              {pageStats?.picture?.data?.url ? (
                                <img src={pageStats.picture.data.url} alt="Page" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                                  <FacebookLogo size={20} weight="fill" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{fbConfig.pageName}</p>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{new Date(post.created_time).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <p className="text-slate-800 dark:text-slate-100 font-medium whitespace-pre-wrap text-sm flex-1 mb-6 line-clamp-4">
                              {post.message || <span className="text-slate-400 italic">(Media / Link Post)</span>}
                            </p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">
                                <div className="flex items-center gap-1.5 bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-100 text-blue-700">
                                  <ThumbsUp size={16} weight="fill" />
                                  {post.likes?.summary?.total_count || 0}
                                </div>
                                <div className="flex items-center gap-1.5 bg-emerald-50/50 px-2.5 py-1.5 rounded-lg border border-emerald-100 text-emerald-700">
                                  <ChatCircle size={16} weight="fill" />
                                  {post.comments?.summary?.total_count || 0}
                                </div>
                              </div>
                              <a 
                                href={`https://facebook.com/${post.id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-white hover:bg-blue-600 border-2 border-blue-600 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                View / Reply
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Page Selector Modal */}
      {showPageSelector && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Select Facebook Page</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Choose which page to connect</p>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {availablePages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full flex items-center justify-between p-4 border-2 transition-all text-left group ${
                      selectedPageId === page.id 
                        ? 'border-[#1877F2] bg-blue-50' 
                        : 'border-slate-200 hover:border-[#1877F2] hover:bg-blue-50'
                    }`}
                  >
                    <div>
                      <p className={`font-black ${selectedPageId === page.id ? 'text-[#1877F2]' : 'text-slate-900 dark:text-white group-hover:text-[#1877F2]'}`}>{page.name}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{page.category || `ID: ${page.id}`}</p>
                    </div>
                    <CheckCircle size={24} weight="fill" className={selectedPageId === page.id ? 'text-[#1877F2]' : 'text-slate-300 group-hover:text-[#1877F2]'} />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowPageSelector(false)}
                className="px-6 py-3 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors border-2 border-slate-300 bg-white dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const page = availablePages.find(p => p.id === selectedPageId);
                  if (page) handleSelectPage(page);
                }}
                disabled={!selectedPageId || loading}
                className="px-6 py-3 bg-[#1877F2] text-white font-black text-xs uppercase tracking-widest hover:bg-[#166FE5] transition-colors disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaManagement;
