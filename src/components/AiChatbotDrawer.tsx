import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  ArrowRight,
  Bot,
  User,
  Copy,
  Check,
  Zap,
  Brain,
  ShieldCheck,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScript: string;
  onApplyScript: (newScript: string) => void;
}

export const AiChatbotDrawer: React.FC<AiChatbotDrawerProps> = ({
  isOpen,
  onClose,
  currentScript,
  onApplyScript,
}) => {
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to the **LensCue Script Doctor & Speech Coach**!\n\n' +
        'I specialize in refining spoken scripts specifically for camera-notch teleprompters: keeping line lengths short (5-9 words), crafting magnetic hooks, and pacing your speech with rhetorical cues like `[PAUSE 1.5s]` and `[LOOK AT LENS]`.\n\n' +
        'How can I help polish your speech today?',
      timestamp: 'Just now',
    },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          model,
          currentScript,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get AI response.');
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${err?.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Helper to extract script blocks (e.g. ```markdown ... ``` or entire text) to apply directly
  const extractScriptToApply = (content: string): string => {
    const codeBlockMatch = content.match(/```(?:markdown|txt)?\n([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    return content;
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="AI Script Doctor Chatbot"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-bold shadow-md">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              AI Script Doctor
            </h2>
            <span className="text-[11px] text-zinc-400 block">
              Multi-turn Speech & Camera Coach
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Close chatbot drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Model Selector Bar */}
      <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] text-zinc-400 font-medium">Model:</span>
        <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => setModel('gemini-3.8-flash')}
            className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
              model === 'gemini-3.8-flash'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="General Speech Tasks & Script Refining"
          >
            3.8 Flash
          </button>
          <button
            type="button"
            onClick={() => setModel('gemini-3.1-flash-lite')}
            className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
              model === 'gemini-3.1-flash-lite'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Fast Tasks & Instant Line Edits"
          >
            Flash Lite
          </button>
          <button
            type="button"
            onClick={() => setModel('gemini-4-argon')}
            className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
              model === 'gemini-4-argon'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Complex Script Architecture & Advanced Reasoning"
          >
            Argon
          </button>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const hasScript = !isUser && (m.content.includes('```') || m.content.includes('# ') || m.content.includes('[PAUSE'));

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-white text-black font-medium rounded-br-none shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                {/* Assistant Action Bar */}
                {!isUser && hasScript && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, extractScriptToApply(m.content))}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onApplyScript(extractScriptToApply(m.content));
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-black font-semibold text-[11px] transition-colors shadow-sm"
                    >
                      <span>Apply to Prompter</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-zinc-500 mt-1 px-1">
                {m.timestamp}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 max-w-[80%]">
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Consulting {model}...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestion Pills */}
      <div className="px-3 py-2 bg-zinc-950 border-t border-zinc-850 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {[
          'Optimize lines to 5-8 words for camera',
          'Insert [PAUSE] & [SMILE] cues',
          'Condense into 60s pitch',
          'Make conversational',
        ].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => handleSend(suggestion)}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white whitespace-nowrap transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Script Doctor to refine or rewrite..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
