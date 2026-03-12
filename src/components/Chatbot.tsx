import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';

interface ChatbotProps {
  getAIClient: () => GoogleGenAI;
}

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export function Chatbot({ getAIClient }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hello! I am your AI assistant. How can I help you with your fashion assets today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = () => {
    if (!chatRef.current) {
      const ai = getAIClient();
      chatRef.current = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction: 'You are a helpful fashion and e-commerce assistant. You help users understand how to use the app, provide fashion advice, and answer questions about styling, photography, and the generated assets.',
        },
      });
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      initChat();
      const responseStream = await chatRef.current.sendMessageStream({ message: userText });
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        const textChunk = chunk.text || '';
        setMessages(prev => 
          prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: msg.text + textChunk } : msg
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Sorry, I encountered an error while processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 bg-white text-black rounded-full shadow-2xl hover:scale-105 transition-transform z-50",
          isOpen && "hidden"
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white/80" />
                <h3 className="font-medium text-white">AI Assistant</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-white/10" : "bg-white text-black"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm",
                    msg.role === 'user' 
                      ? "bg-white/10 text-white rounded-tr-sm" 
                      : "bg-white text-black rounded-tl-sm"
                  )}>
                    {msg.role === 'model' ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/10">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white text-black rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
