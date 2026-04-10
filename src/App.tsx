import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  FileText, 
  History, 
  Loader2, 
  ExternalLink, 
  ChevronRight,
  Download,
  Trash2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { performResearch, generateReport, ResearchResult } from './services/geminiService';

interface HistoryItem {
  id: string;
  topic: string;
  timestamp: number;
  result: ResearchResult;
  report?: string;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [currentResult, setCurrentResult] = useState<ResearchResult | null>(null);
  const [currentReport, setCurrentReport] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('insight_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('insight_history', JSON.stringify(history));
  }, [history]);
  const [activeTab, setActiveTab] = useState<'research' | 'report'>('research');
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadingMessages = [
    "Scanning the digital universe...",
    "Synthesizing global perspectives...",
    "Connecting the dots...",
    "Extracting core insights...",
    "Verifying sources...",
    "Polishing the summary..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResearching || isGeneratingReport) {
      let i = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isResearching, isGeneratingReport]);

  const handleResearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsResearching(true);
    setCurrentResult(null);
    setCurrentReport(null);
    setActiveTab('research');

    try {
      const result = await performResearch(query);
      setCurrentResult(result);
      
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        topic: query,
        timestamp: Date.now(),
        result
      };
      setHistory(prev => [newItem, ...prev]);
    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!currentResult || !query) return;

    setIsGeneratingReport(true);
    try {
      const report = await generateReport(query, currentResult.summary);
      setCurrentReport(report);
      setActiveTab('report');
      
      // Update history with report
      setHistory(prev => prev.map(item => 
        item.topic === query ? { ...item, report } : item
      ));
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setQuery(item.topic);
    setCurrentResult(item.result);
    setCurrentReport(item.report || null);
    setActiveTab(item.report ? 'report' : 'research');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans">
      {/* Sidebar */}
      <aside className="w-80 border-r border-zinc-200 bg-white flex flex-col hidden md:flex">
        <div className="p-6 border-bottom border-zinc-100">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-xl">
            <div className="bg-zinc-900 text-white p-1.5 rounded-lg">
              <Sparkles size={20} />
            </div>
            <span>InsightStream</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <History size={14} />
            <span>Recent Research</span>
          </div>
          
          {history.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-zinc-400 italic">No recent history</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all group relative",
                  query === item.topic 
                    ? "bg-zinc-100 text-zinc-900 shadow-sm" 
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <div className="flex flex-col gap-1 pr-6">
                  <span className="text-sm font-medium truncate">{item.topic}</span>
                  <span className="text-[10px] opacity-60">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-100">
          <div className="bg-zinc-50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Powered by Gemini 3.1 with real-time search grounding for accurate, up-to-date information.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header / Search */}
        <header className="p-6 md:p-10 border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto w-full">
            <form onSubmit={handleResearch} className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What would you like to research today?"
                className="w-full pl-12 pr-32 py-4 bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-zinc-900/5 rounded-2xl text-lg transition-all outline-none"
              />
              <button
                type="submit"
                disabled={isResearching || !query.trim()}
                className="absolute right-2 inset-y-2 px-6 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isResearching ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>Research</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-10">
            <AnimatePresence mode="wait">
              {isResearching || isGeneratingReport ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-zinc-900/10 blur-3xl rounded-full animate-pulse" />
                    <Loader2 size={48} className="animate-spin text-zinc-900 relative z-10" />
                  </div>
                  <h3 className="mt-8 text-xl font-semibold text-zinc-900">{loadingMessage}</h3>
                  <p className="mt-2 text-zinc-500">This usually takes about 10-20 seconds.</p>
                </motion.div>
              ) : currentResult ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  {/* Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
                    <button
                      onClick={() => setActiveTab('research')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === 'research' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <BookOpen size={16} />
                      <span>Summary</span>
                    </button>
                    <button
                      onClick={() => {
                        if (currentReport) setActiveTab('report');
                        else handleGenerateReport();
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === 'report' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <FileText size={16} />
                      <span>Report</span>
                    </button>
                  </div>

                  {activeTab === 'research' ? (
                    <div className="space-y-10">
                      <section className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
                        <div className="markdown-body">
                          <Markdown>{currentResult.summary}</Markdown>
                        </div>
                      </section>

                      {currentResult.sources.length > 0 && (
                        <section className="space-y-4">
                          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <ExternalLink size={14} />
                            Sources & References
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentResult.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-4 bg-white border border-zinc-100 rounded-2xl hover:border-zinc-300 hover:shadow-md transition-all group"
                              >
                                <div className="mt-1 text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                  <ExternalLink size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-zinc-900 truncate">{source.title}</p>
                                  <p className="text-xs text-zinc-400 truncate mt-0.5">{new URL(source.url).hostname}</p>
                                </div>
                              </a>
                            ))}
                          </div>
                        </section>
                      )}

                      {!currentReport && (
                        <div className="flex justify-center pt-4">
                          <button
                            onClick={handleGenerateReport}
                            className="flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
                          >
                            <FileText size={20} />
                            <span>Generate Full Report</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-zinc-900">Research Report: {query}</h2>
                        <button 
                          onClick={() => window.print()}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                        >
                          <Download size={16} />
                          <span>Export PDF</span>
                        </button>
                      </div>
                      <section className="bg-white p-10 rounded-3xl border border-zinc-100 shadow-sm min-h-[600px]">
                        <div className="markdown-body">
                          <Markdown>{currentReport}</Markdown>
                        </div>
                      </section>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center space-y-8"
                >
                  <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300">
                    <BookOpen size={48} />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h2 className="text-2xl font-bold text-zinc-900">Start your research</h2>
                    <p className="text-zinc-500">
                      Enter a topic above to get a comprehensive summary and real-time insights from across the web.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {[
                      "Explain Generative AI and its impact",
                      "Summarize current AI trends in 2024",
                      "The history of space exploration",
                      "How quantum computing works"
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(suggestion);
                          // We can't trigger handleResearch directly because it needs the updated state
                          // but we can just set it and let the user click or use a temporary var
                        }}
                        className="p-4 text-left bg-white border border-zinc-100 rounded-2xl hover:border-zinc-300 hover:bg-zinc-50 transition-all text-sm text-zinc-600 font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

