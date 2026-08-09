import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, MessageSquare, ArrowRight, CornerDownLeft, HelpCircle, Check, X, CreditCard } from 'lucide-react';
import { UserData, Expense } from '../types';
import { aiService, AIAskResponse } from '../lib/aiService';
import { formatCurrency } from '../lib/utils';
import { useNotification } from './NotificationContext';
import { MagicRings } from './MagicRings';

interface AIAssistantProps {
  data: UserData;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  expenses?: Expense[];
  pendingAction?: {
    amount: number;
    category: string;
    subcategory?: string;
    merchant: string;
    note?: string;
    isAdded?: boolean;
  };
}

export function AIAssistant({ data, onAddExpense }: AIAssistantProps) {
  const { showNotification } = useNotification();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello. I'm your Spending Intelligence partner. Ask me questions about your monthly spending, categories, or weekend behavior. I'm observant, not judgmental.",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQueries = [
    "How much did I spend this month?",
    "Where did most of my money go this month?",
    "Am I spending too much on food?",
    "Why was my spending higher this month?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleQuery = async (queryText: string) => {
    if (queryText.trim() === '' || isTyping) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Build conversation history format for the API
      // Take the last 6 messages to keep context without exceeding limits
      const apiHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: m.sender,
          content: m.text
        }));

      const response = await aiService.askQuestion(queryText, data.expenses, data, apiHistory);
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date(),
        expenses: response.sourceExpenses,
        pendingAction: response.parsedExpenseAction
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: "I experienced a difficulty retrieving details. Please configure your Gemini API Key in Settings or check your connection.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery(input);
    }
  };

  const confirmAction = (msgId: string, action: any) => {
    onAddExpense({
      amount: action.amount,
      category: action.category,
      subcategory: action.subcategory || '',
      merchant: action.merchant,
      description: action.merchant, // Ensure description is set to keep compatibility with V1/types
      note: action.note || '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank' // Default to Bank for AI logging
    });

    showNotification(`Added ${formatCurrency(action.amount)} for ${action.merchant} to ledger.`, 'success');

    // Mark action as added in message view
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.pendingAction) {
        return {
          ...m,
          pendingAction: {
            ...m.pendingAction,
            isAdded: true
          }
        };
      }
      return m;
    }));
  };

  const rejectAction = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.pendingAction) {
        return {
          ...m,
          pendingAction: undefined
        };
      }
      return m;
    }));
    showNotification('Expense logging canceled.', 'info');
  };

  return (
    <div className="flex flex-col h-[75vh] md:h-[80vh] rounded-2xl glass-panel overflow-hidden animate-slide-in relative">
      
      {/* Header with MagicRings integrated into the backdrop */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] bg-[var(--surface-elevated)]/20 select-none relative overflow-hidden h-16">
        <MagicRings ringCount={6} speed={0.4} opacity={0.65} lineThickness={1.2} baseRadius={40} />
        <div className="w-8 h-8 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center relative z-10 border border-[var(--accent)]/15">
          <Sparkles size={16} />
        </div>
        <div className="relative z-10">
          <h2 className="font-bold text-sm text-[var(--foreground)] leading-tight editorial-title">Spending Intelligence</h2>
          <p className="text-[9px] text-[var(--muted)] font-mono font-bold uppercase tracking-[0.15em] mt-0.5">V2 Core Layer</p>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div 
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} space-y-1`}
            >
              <div 
                className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  isAssistant 
                    ? 'glass-panel text-[var(--foreground)] rounded-tl-sm border border-[var(--border)]/40 font-medium' 
                    : 'bg-[var(--accent)] text-[#080808] rounded-tr-sm font-bold shadow-sm'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                
                {/* Embedded expense sources if returned */}
                {isAssistant && msg.expenses && msg.expenses.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]/30 space-y-1.5 w-full">
                    <p className="text-[9px] uppercase font-bold text-[var(--muted)] tracking-wider font-mono">Linked Transactions</p>
                    {msg.expenses.slice(0, 3).map((e) => (
                      <div key={e.id} className="flex justify-between items-center text-xs bg-[var(--surface-elevated)]/50 p-2 rounded-lg border border-[var(--border)]/30">
                        <span className="font-semibold text-[var(--foreground)] truncate pr-2">{e.merchant || e.description}</span>
                        <span className="font-bold text-[var(--danger)] shrink-0">{formatCurrency(e.amount)}</span>
                      </div>
                    ))}
                    {msg.expenses.length > 3 && (
                      <p className="text-[9px] text-[var(--muted)] italic pl-1">And {msg.expenses.length - 3} more items...</p>
                    )}
                  </div>
                )}

                {/* Inline confirmation action for transaction logging */}
                {isAssistant && msg.pendingAction && (
                  <div className="mt-4 p-3 rounded-xl bg-[var(--surface-elevated)]/80 border border-[var(--border)]/70 text-xs text-[var(--foreground)] space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[var(--accent)] font-bold text-[9px] uppercase tracking-wider font-mono">
                      <CreditCard size={12} />
                      {msg.pendingAction.isAdded ? 'Expense Logged' : 'Pending Expense Confirmation'}
                    </div>
                    <div className="flex justify-between items-center pt-1 select-none">
                      <div>
                        <p className="font-bold text-[var(--foreground)]">{msg.pendingAction.merchant}</p>
                        <p className="text-[10px] text-[var(--muted)] font-semibold mt-0.5">{msg.pendingAction.category} {msg.pendingAction.subcategory ? `• ${msg.pendingAction.subcategory}` : ''}</p>
                      </div>
                      <span className="font-bold text-sm text-[var(--danger)]">{formatCurrency(msg.pendingAction.amount)}</span>
                    </div>

                    {!msg.pendingAction.isAdded && (
                      <div className="flex gap-2 pt-2 border-t border-[var(--border)]/20 mt-1">
                        <button
                          onClick={() => confirmAction(msg.id, msg.pendingAction)}
                          className="flex-1 py-1.5 rounded-lg bg-[var(--accent)] text-[#080808] font-bold flex items-center justify-center gap-1 hover:opacity-90 cursor-pointer shadow-sm text-xs focus:outline-none"
                        >
                          <Check size={12} /> Confirm
                        </button>
                        <button
                          onClick={() => rejectAction(msg.id)}
                          className="py-1.5 px-3 rounded-lg bg-[var(--surface-elevated)]/60 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer text-xs focus:outline-none"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-[var(--muted)] px-1 font-mono select-none">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex flex-col items-start space-y-1">
            <div className="glass-panel text-[var(--muted)] rounded-2xl rounded-tl-sm p-4 border border-[var(--border)]/45 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Grid */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-[var(--border)]/30 bg-[var(--surface-elevated)]/20 select-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1 font-mono">
            <HelpCircle size={12} className="text-[var(--accent)]" /> Suggested Questions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuery(q)}
                className="p-3 text-left rounded-xl glass-panel text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/45 cursor-pointer transition-all flex items-center justify-between"
              >
                <span>{q}</span>
                <ArrowRight size={12} className="shrink-0 text-[var(--muted)] opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex gap-2">
        <textarea
          placeholder="Ask a question or request an expense log (e.g. 'spent 250 on coffee')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/30 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)] resize-none custom-scrollbar"
        />
        <button
          type="button"
          onClick={() => handleQuery(input)}
          disabled={input.trim() === '' || isTyping}
          className="p-3 rounded-xl bg-[var(--accent)] text-[#080808] hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center shadow-md"
        >
          <Send size={16} />
        </button>
      </div>

    </div>
  );
}
