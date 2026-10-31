"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const loadingMessages = [
  "Searching knowledge base...",
  "Please wait...",
  "Just a little bit more...",
  // "I'm on free tier here :)...",
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Hafizi's AI assistant, Fyzie. Ask me anything about his experience, projects, or skill set.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Rotate loading text every 5 seconds when loading is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingMsgIndex(0);
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Function to reset chat history
  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! What else would you like to know about Hafizi?",
      },
    ]);
  };

  // Generate a persistent session ID for this browser tab session
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 11));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: trimmed,
          session_id: sessionId // Pass session ID to maintain escalation flow state
        }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble connecting to the backend server. Please try again later.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[100] font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-[#EBDED2] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-[#372C2E] text-white px-5 py-4 flex justify-between items-center border-b border-[#563727]">
            <div>
              <h3 className="font-bold text-sm text-white">AI Assistant</h3>
              <p className="text-xs text-[#DE9E48]">Powered by LlamaIndex + Qdrant</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Clear Chat Button */}
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="text-white/70 hover:text-white p-1 rounded-md hover:bg-[#563727] transition-colors"
              >
                <Trash2 size={17} />
              </button>
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-md hover:bg-[#563727] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#FDFBF7] flex flex-col gap-3 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#372C2E] text-white self-end rounded-br-none'
                    : 'bg-white text-[#372C2E] border border-[#EBDED2] shadow-xs self-start rounded-bl-none'
                }`}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="bg-white text-[#6E5A52] border border-[#EBDED2] shadow-xs self-start rounded-xl rounded-bl-none p-3 flex items-center gap-2 text-xs transition-all duration-300">
                <Loader2 size={14} className="animate-spin text-[#DE9E48] shrink-0" />
                <span>{loadingMessages[loadingMsgIndex]}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-[#EBDED2]">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about my experience, stack..."
                className="flex-1 px-4 py-2 bg-[#F5EFEB] border border-[#EBDED2] rounded-full text-sm text-[#372C2E] placeholder-[#A08E87] outline-none focus:ring-2 focus:ring-[#DE9E48]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 bg-[#DE9E48] text-[#372C2E] font-bold rounded-full hover:bg-[#ecc07b] disabled:opacity-50 transition-colors shadow-xs"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button with "Chat with Fyzie" label hidden when open */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 h-14 rounded-full shadow-lg transition-all hover:scale-105 ml-auto ${
          isOpen ? 'bg-[#563727] text-white w-14 justify-center px-0' : 'bg-[#372C2E] text-white hover:bg-[#563727] border border-[#DE9E48]/40'
        }`}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <>
            <MessageSquare size={22} className="shrink-0 text-[#DE9E48]" />
            <span className="font-semibold text-sm whitespace-nowrap">Chat with AI</span>
          </>
        )}
      </button>
    </div>
  );
}