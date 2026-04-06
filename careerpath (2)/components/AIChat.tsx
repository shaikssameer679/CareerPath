
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { Send, User as UserIcon, Bot, ArrowLeft, Loader2, Sparkles, MoreVertical, Trash2, X, AlertCircle, History, MessageSquare, Clock, Plus, Square, RefreshCw } from 'lucide-react';
import { createChatSession } from '../services/gemini';
import { User, Message, ChatSession } from '../types';

interface AIChatProps {
  user: User;
  activeChat: ChatSession;
  history: ChatSession[];
  onBack: () => void;
  onUpdateMessages: (messages: Message[]) => void;
  onSwitchChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClearAllChats: () => void;
  onCreateNewChat: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ 
  user, 
  activeChat, 
  history, 
  onBack, 
  onUpdateMessages,
  onSwitchChat,
  onDeleteChat,
  onClearAllChats,
  onCreateNewChat
}) => {
  const [messages, setMessages] = useState<Message[]>(activeChat?.messages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const stopGeneratingRef = useRef(false);
  
  // Update loadingRef whenever isLoading changes
  useEffect(() => {
    loadingRef.current = isLoading;
  }, [isLoading]);
  
  // Track current ID to prevent reporting stale messages during transition
  const activeIdRef = useRef<string>(activeChat.id);
  // Track if we just performed a sync to avoid reporting identical data
  const justSyncedRef = useRef<boolean>(true);

  const initChatSession = useCallback(() => {
    try {
      chatSessionRef.current = createChatSession(user.name, activeChat.messages);
      setError(null);
    } catch (err: any) {
      console.error("Failed to initialize chat session:", err);
      setError(err.message || "Failed to initialize counselor. Please check your API key.");
    }
  }, [user.name, activeChat.messages]);

  // Sync state when activeChat changes
  useEffect(() => {
    if (!activeChat) return;
    activeIdRef.current = activeChat.id;
    justSyncedRef.current = true;
    setInput('');
    setMessages(activeChat.messages);
    setError(null);
    initChatSession();
  }, [activeChat?.id, user.name, initChatSession]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    // Small delay to show feedback
    await new Promise(resolve => setTimeout(resolve, 1500));
    initChatSession();
    setIsRefreshing(false);
  };

  // Report messages back to App state
  const lastReportedMessagesRef = useRef<string>(JSON.stringify(activeChat.messages));

  useEffect(() => {
    const currentMessagesJson = JSON.stringify(messages);
    // Only report if:
    // 1. The ID matches (safety)
    // 2. We aren't just reflecting the initial sync from the parent
    // 3. The messages have actually changed since our last report
    if (activeIdRef.current === activeChat.id && !justSyncedRef.current && currentMessagesJson !== lastReportedMessagesRef.current) {
      lastReportedMessagesRef.current = currentMessagesJson;
      onUpdateMessages(messages);
    }
    justSyncedRef.current = false;
  }, [messages, activeChat.id, onUpdateMessages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    scrollToBottom(messages.some(m => m.isStreaming) ? 'auto' : 'smooth');
  }, [messages, isLoading]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      
      // If streaming, only scroll if already near bottom to avoid fighting the user
      if (messages.some(m => m.isStreaming) && !isNearBottom) {
        return;
      }
      
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  };

  const handleClearChat = useCallback(() => {
    onDeleteChat(activeChat.id);
    setShowDeleteConfirm(false);
    setIsMenuOpen(false);
  }, [activeChat.id, onDeleteChat]);

  const handleClearAll = useCallback(() => {
    onClearAllChats();
    setShowClearAllConfirm(false);
    setShowHistory(false);
  }, [onClearAllChats]);

  const handleNewChat = useCallback(() => {
    onCreateNewChat();
    setIsMenuOpen(false);
  }, [onCreateNewChat]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    setError(null);
    
    if (!chatSessionRef.current) {
      try {
        chatSessionRef.current = createChatSession(user.name, messages);
      } catch (err: any) {
        setError(err.message || "Failed to initialize counselor. Please check your API key.");
        return;
      }
    }

    if (!chatSessionRef.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    stopGeneratingRef.current = false;

    // Safety timeout to prevent getting stuck
    const timeoutId = setTimeout(() => {
      if (loadingRef.current) {
        setIsLoading(false);
        if (activeIdRef.current === activeChat.id) {
          setMessages(prev => {
            const filtered = prev.filter(m => !m.isStreaming);
            // If the last message was the empty model message, replace it
            return [...filtered, {
              id: Date.now().toString(),
              role: 'model',
              text: "I'm sorry, the response is taking longer than expected. Please check your connection and try again."
            }];
          });
        }
      }
    }, 60000); // Increased to 60 seconds to allow for long, detailed responses

    try {
      const modelMessageId = (Date.now() + 1).toString();
      const initialModelMsg: Message = {
        id: modelMessageId,
        role: 'model',
        text: '',
        isStreaming: true
      };
      
      setMessages(prev => [...prev, initialModelMsg]);

      const result = await chatSessionRef.current.sendMessageStream({ message: userMessage.text });
      
      let fullText = '';
      
      for await (const chunk of result) {
        if (stopGeneratingRef.current) {
          break;
        }
        
        // Clear timeout as we are receiving data
        clearTimeout(timeoutId);
        
        const c = chunk as GenerateContentResponse;
        let textChunk = '';
        try {
          textChunk = c.text || '';
        } catch (e) {
          console.warn("Could not get text from chunk:", e);
          // If we hit a block or limit, the text getter might throw
        }
        
        fullText += textChunk;
        
        if (activeIdRef.current === activeChat.id) {
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId 
              ? { ...msg, text: fullText } 
              : msg
          ));
        }
      }

      if (activeIdRef.current === activeChat.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        ));
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Chat Error:", error);
      
      const errorMessage = error?.message || String(error);
      setError(errorMessage); // Show the red alert box
      
      if (activeIdRef.current === activeChat.id) {
        setMessages(prev => {
          const filtered = prev.filter(m => !m.isStreaming);
          return [...filtered, {
            id: Date.now().toString(),
            role: 'model',
            text: `I'm sorry, I encountered an error: ${errorMessage}. Please try refreshing the session or try again later.`
          }];
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    stopGeneratingRef.current = true;
    setIsLoading(false);
  };

  // Header Title logic: Always show the title from the state. 
  // Parent App.tsx will handle the rename from 'new chat' to the typed text after submission.
  const displayTitle = activeChat.title;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-500" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 leading-none mb-1 truncate max-w-[150px] md:max-w-[300px]">
              {displayTitle}
            </h2>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
              {isLoading ? 'Thinking...' : 'Online • Ready to help'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className={`p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500 hover:text-blue-600 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
            title="Refresh AI Session"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <button 
                onClick={handleNewChat}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold transition-colors border-b border-slate-50"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                New chat
              </button>
              <button 
                onClick={() => { setShowHistory(true); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold transition-colors border-b border-slate-50"
              >
                <History className="w-4 h-4 text-slate-400" />
                View chat history
              </button>
              <button 
                onClick={() => { setShowDeleteConfirm(true); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Chat Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-6"
      >
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-3 text-red-600 mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button 
              onClick={handleRefresh}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry
            </button>
          </div>
        )}
        
        {messages.length === 0 && !isLoading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Start a conversation</h3>
            <p className="text-slate-500 max-w-xs">Ask me anything about your career path, skills, or professional goals.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-white text-indigo-600 border border-slate-100'
            }`}>
              {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
            </div>
            
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-5 shadow-sm transition-all duration-300 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100'
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                {msg.text}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-blue-400 animate-pulse rounded-full"></span>
                )}
                {!msg.text && msg.role === 'model' && (
                  <div className="flex gap-1.5 py-1">
                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0">
        <form 
          onSubmit={handleSend}
          className="flex items-center gap-3 max-w-4xl mx-auto"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about careers, skills, or advice..."
              className="w-full bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
              disabled={isLoading}
            />
          </div>
          
          {isLoading ? (
            <button
              type="button"
              onClick={handleStop}
              className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all shadow-sm active:scale-95"
              title="Stop generating"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                !input.trim()
                  ? 'bg-slate-100 text-slate-300'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-105 active:scale-95'
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
          )}
        </form>
      </div>

      {/* History Slide-over Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-white w-full max-w-sm h-full shadow-2xl animate-in slide-in-from-right-full duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900">Chat History</h3>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No chat history found</p>
                </div>
              ) : (
                history.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      onSwitchChat(chat.id);
                      setShowHistory(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1 ${
                      activeChat.id === chat.id
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-sm truncate pr-2 ${activeChat.id === chat.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {chat.title}
                      </h4>
                      {activeChat.id === chat.id && <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">Active</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {chat.timestamp}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {chat.messages.length} messages
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Sticky Footer with Clear All Option */}
            {history.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all chats
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Individual Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Conversation?</h3>
              <p className="text-slate-500 leading-relaxed mb-8">
                This will permanently delete your chat history for <span className="font-bold text-slate-700">"{activeChat.title}"</span>. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setShowClearAllConfirm(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">Clear all chats?</h3>
              <p className="text-slate-500 leading-relaxed mb-8">
                This will permanently delete <span className="font-bold text-slate-700">ALL</span> of your chat conversations. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
