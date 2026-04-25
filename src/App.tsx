/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Lock, Unlock, BookOpen, Code, Lightbulb, TrendingUp, MessageSquare, Send, X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { format, differenceInDays } from 'date-fns';
import { cn } from './lib/utils';
import contentData from './content.json';
import { geminiService } from './services/geminiService';

interface CourseEntry {
  id: number;
  title: string;
  concept: string;
  deep_dive?: string;
  scenario?: string;
  math: string;
  math_desc: string;
  code: string;
}

const PROGRESS_KEY = 'quant_byte_current_progress';

export default function App() {
  const [activeTab, setActiveTab] = useState<'grid' | 'lesson'>('grid');
  const [selectedLesson, setSelectedLesson] = useState<CourseEntry| null>(null);
  const [unlockedCount, setUnlockedCount] = useState(1);
  
  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiLoading]);

  useEffect(() => {
    const savedProgress = localStorage.getItem(PROGRESS_KEY);
    if (savedProgress) {
      setUnlockedCount(parseInt(savedProgress, 10));
    } else {
      localStorage.setItem(PROGRESS_KEY, '1');
      setUnlockedCount(1);
    }
  }, []);

  const handleLessonClick = (lesson: CourseEntry) => {
    if (lesson.id <= unlockedCount) {
      setSelectedLesson(lesson);
      setActiveTab('lesson');
    }
  };

  const completeLesson = () => {
    if (selectedLesson && selectedLesson.id === unlockedCount) {
      const nextProgress = unlockedCount + 1;
      setUnlockedCount(nextProgress);
      localStorage.setItem(PROGRESS_KEY, nextProgress.toString());
    }
    goBack();
  };

  const goBack = () => {
    setActiveTab('grid');
    setSelectedLesson(null);
    setIsChatOpen(false);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedLesson || isAiLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      const response = await geminiService.askAboutLesson(
        selectedLesson.title,
        selectedLesson.concept,
        userMessage
      );
      setMessages(prev => [...prev, { role: 'ai', content: response || "I'm not sure how to answer that." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had some trouble processing that request. Please try again." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-brand-blue/10">
      <AnimatePresence mode="wait">
        {activeTab === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center p-8 md:p-12"
          >
            <div className="w-full max-w-4xl">
              <header className="mb-12 flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">365 Day Curriculum</p>
                  <h1 className="text-5xl font-serif text-slate-950">QuantByte</h1>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold tracking-widest text-brand-blue uppercase mb-1">Mastery Progress</p>
                  <p className="text-2xl font-light text-slate-800">
                    <span className="font-bold text-slate-950">{unlockedCount}</span>
                    <span className="text-slate-300"> / {contentData.length}</span>
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {contentData.map((lesson) => {
                  const isUnlocked = lesson.id <= unlockedCount;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      className={cn(
                        "aspect-[4/5] rounded-[2rem] p-6 flex flex-col justify-between transition-all group",
                        isUnlocked 
                          ? "bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 cursor-pointer border border-slate-100" 
                          : "bg-slate-100 opacity-60 cursor-not-allowed grayscale border border-transparent"
                      )}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn(
                          "text-[10px] font-black tracking-widest uppercase mb-2",
                          isUnlocked ? "text-brand-blue" : "text-slate-400"
                        )}>
                          Day {lesson.id < 10 ? `0${lesson.id}` : lesson.id}
                        </span>
                        <h3 className={cn(
                          "text-lg font-serif leading-tight text-left",
                          isUnlocked ? "text-slate-900" : "text-slate-500"
                        )}>
                          {isUnlocked ? lesson.title : "Locked Concept"}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        {isUnlocked ? (
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors">
                            <BookOpen size={18} />
                          </div>
                        ) : (
                          <Lock size={18} className="text-slate-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <footer className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] flex items-center justify-between text-white shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-brand-blue rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                  <p className="text-sm font-medium">Progress Tracking Active</p>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">
                  Complete your current lesson<br/>to unlock the next concept
                </p>
              </footer>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="lesson"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center p-4 md:p-12 overflow-y-auto"
          >
            <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl border border-slate-200 flex flex-col md:flex-row overflow-hidden min-h-[600px]">
              
              {/* Fake Sidebar Nav for aesthetic */}
              <div className="w-20 bg-slate-900 hidden md:flex flex-col items-center py-10 gap-10 border-r border-slate-800">
                <button onClick={goBack} className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer">
                  <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col gap-8 opacity-30">
                  <div className="w-6 h-6 border-2 border-white rounded-md"></div>
                  <div className="w-6 h-6 border-2 border-white rounded-full"></div>
                  <div className="w-6 h-6 border-2 border-white rounded-md rotate-45"></div>
                </div>
              </div>

              <div className="flex-1 flex flex-col relative">
                {/* Mobile Back Button */}
                <button 
                  onClick={goBack} 
                  className="md:hidden absolute top-6 left-6 z-10 p-2 bg-slate-100 rounded-full text-slate-900"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="px-8 md:px-16 pt-12 pb-6 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase mb-2">Roadmap Progress</p>
                    <h2 className="text-4xl font-light text-slate-800">
                      <span className="font-bold text-slate-950">Day {selectedLesson?.id}</span>
                      <span className="text-slate-300"> / {contentData.length}</span>
                    </h2>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold tracking-widest text-brand-blue uppercase mb-1">Learning Path</p>
                    <p className="text-sm font-medium text-slate-500 italic">Quantitative Essentials</p>
                  </div>
                </div>

                <div className="px-8 md:px-16 flex-1 py-4">
                  <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-950 mb-6 leading-tight">
                      {selectedLesson?.title}
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                      {selectedLesson?.concept}
                    </p>
                  </div>

                  {selectedLesson?.deep_dive && (
                    <div className="mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100 border-l-4 border-l-brand-blue">
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-2">Deep Dive</p>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {selectedLesson.deep_dive}
                      </p>
                    </div>
                  )}

                  {selectedLesson?.scenario && (
                    <div className="mb-10 bg-amber-50/50 p-6 rounded-3xl border border-amber-100 border-l-4 border-l-amber-400">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={14} className="text-amber-600" />
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Real-World Scenario</p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        "{selectedLesson.scenario}"
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Math Moment</p>
                      <div className="flex items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 min-h-[120px]">
                        <div className="markdown-body text-2xl scale-110">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {`$$${selectedLesson?.math}$$`}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed text-center font-medium italic">
                        {selectedLesson?.math_desc}
                      </p>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 shadow-xl flex flex-col overflow-hidden">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Python Demo</p>
                      <div className="font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre pb-4 scrollbar-hide">
                        <code className="text-slate-300">
                          {selectedLesson?.code}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 md:px-16 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                    <p className="text-sm text-slate-500 font-medium">Continuing Your Journey...</p>
                  </div>
                  <button 
                    onClick={completeLesson}
                    className="px-10 py-4 bg-slate-950 text-white rounded-full font-bold text-sm tracking-widest uppercase hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 active:scale-95"
                  >
                    Complete Day {selectedLesson?.id}
                  </button>
                </div>

                {/* Chatbot Floating Button */}
                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="fixed bottom-28 right-8 w-14 h-14 bg-brand-blue text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
                >
                  <MessageSquare size={24} />
                </button>

                {/* Chat Interface */}
                <AnimatePresence>
                  {isChatOpen && (
                    <motion.div 
                      key="ai-chat"
                      initial={{ opacity: 0, y: 100, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 50, scale: 0.9 }}
                      className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[400px] h-[500px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col z-50 border border-slate-100 overflow-hidden"
                    >
                      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(59,130,246,0.5)]">AI</div>
                          <div>
                            <h4 className="text-sm font-bold">Quant Assistant</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Powered by Gemini</p>
                          </div>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                        {messages.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center px-6 text-slate-400 space-y-3">
                            <MessageSquare size={32} strokeWidth={1.5} />
                            <p className="text-sm">Confused about <b>{selectedLesson?.title}</b>? I'm here to help you master it.</p>
                          </div>
                        )}
                        {messages.map((msg, i) => (
                          <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                            <div className={cn(
                              "max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                              msg.role === 'user' 
                                ? "bg-brand-blue text-white rounded-br-none" 
                                : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-100"
                            )}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {isAiLoading && (
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-2">
                            <Loader2 size={12} className="animate-spin text-brand-blue" />
                            Analyzing...
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                        <div className="flex gap-2">
                          <input 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask a question..."
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 placeholder:text-slate-300 shadow-inner"
                          />
                          <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isAiLoading}
                            className="w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all active:scale-90 shadow-lg shadow-brand-blue/20"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
