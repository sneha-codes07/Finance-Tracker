import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Plus, X, Landmark, Wallet, HelpCircle } from 'lucide-react';
import { Expense } from '../types';
import { aiService } from '../lib/aiService';
import { useNotification } from './NotificationContext';

interface AddExpenseProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

const CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Education', 'Transport', 'Bills', 'Other'];

export function AddExpense({ isOpen, onClose, onAddExpense }: AddExpenseProps) {
  const { showNotification } = useNotification();
  
  // Natural language state
  const [nlInput, setNlInput] = useState('');

  // Structured form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Bank');

  // Trigger local NL parsing when text changes
  const handleNlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNlInput(val);
    
    if (val.trim() === '') return;

    // Use our local parsing service
    const parsed = await aiService.parseNaturalLanguageInput(val);
    
    if (parsed.amount) {
      setAmount(parsed.amount.toString());
    }
    if (parsed.category) {
      setCategory(parsed.category);
    }
    if (parsed.subcategory !== undefined) {
      setSubcategory(parsed.subcategory);
    }
    if (parsed.merchant) {
      setMerchant(parsed.merchant);
    }
    if (parsed.note) {
      setNote(parsed.note);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('Please enter a valid amount', 'warning');
      return;
    }

    onAddExpense({
      amount: parsedAmount,
      category,
      subcategory: subcategory || undefined,
      description: merchant || note || category, // fallback for V1 compatibility
      merchant: merchant || undefined,
      note: note || undefined,
      paymentMethod,
      date: new Date(date).toISOString()
    });

    // Reset Form
    setNlInput('');
    setAmount('');
    setCategory('Food');
    setSubcategory('');
    setMerchant('');
    setNote('');
    setPaymentMethod('Bank');
    setDate(new Date().toISOString().split('T')[0]);
    
    onClose();
    showNotification('Expense logged successfully', 'success');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md glass-panel rounded-t-3xl md:rounded-2xl p-6 space-y-5 shadow-[0_15px_50px_rgba(0,0,0,0.4)] animate-slide-in max-h-[92vh] md:max-h-none overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--border)]/30 pb-3 select-none">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-serif">Log Expense</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Natural Language Entry Helper */}
        <div className="relative">
          <Sparkles size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--accent)]" />
          <input
            type="text"
            placeholder="Type '350 Swiggy' or '1200 petrol' to auto-fill..."
            value={nlInput}
            onChange={handleNlChange}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/30 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 text-[var(--foreground)]"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Big Amount Focus */}
          <div className="space-y-1 p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] ml-1 select-none">Amount (₹)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-transparent border-none text-3xl font-bold font-mono focus:outline-none focus:ring-0 text-[var(--foreground)] p-0"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1 select-none">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Category</label>
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  setSubcategory('');
                }}
                className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)] cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1 select-none">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Payment Method</label>
              <div className="flex bg-[var(--surface-elevated)] rounded-xl p-1 border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Bank')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${paymentMethod === 'Bank' ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm' : 'text-[var(--muted)]'}`}
                >
                  <span className="flex items-center justify-center gap-1"><Landmark size={12} /> Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${paymentMethod === 'Cash' ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm' : 'text-[var(--muted)]'}`}
                >
                  <span className="flex items-center justify-center gap-1"><Wallet size={12} /> Cash</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subcategory for Food */}
          {category.toLowerCase() === 'food' && (
            <div className="space-y-1 select-none">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Food Subcategory</label>
              <select
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)] cursor-pointer"
              >
                <option value="">Unclassified Food</option>
                <optgroup label="Essential Food">
                  <option value="groceries">Groceries</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="milk">Milk & Dairy</option>
                  <option value="ingredients">Cooking Ingredients</option>
                  <option value="staples">Staples</option>
                </optgroup>
                <optgroup label="Outside Food">
                  <option value="restaurant">Restaurant</option>
                  <option value="delivery">Delivery / Ordering</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="cafe">Cafe & Beverages</option>
                  <option value="streetfood">Street Food</option>
                </optgroup>
                <optgroup label="Junk / Treats">
                  <option value="chips">Chips & Snacks</option>
                  <option value="softdrinks">Soft Drinks</option>
                  <option value="desserts">Desserts</option>
                  <option value="icecream">Ice Cream</option>
                  <option value="treats">Treats</option>
                </optgroup>
              </select>
            </div>
          )}

          {/* Merchant */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Merchant Name</label>
            <input
              type="text"
              placeholder="e.g. Swiggy, Starbucks, DMart..."
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Notes</label>
            <textarea
              placeholder="Add details, tags, or context..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)] min-h-[60px]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[var(--accent)] text-[#080808] font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md text-center focus:outline-none"
            >
              Confirm Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
