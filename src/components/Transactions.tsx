import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Edit2, Trash2, Calendar, ShoppingBag, Utensils, Landmark, Landmark as TransportIcon, HelpCircle, Sparkles, X } from 'lucide-react';
import { Expense } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useNotification } from './NotificationContext';

interface TransactionsProps {
  expenses: Expense[];
  onUpdateExpense: (id: string, updated: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

const CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Education', 'Transport', 'Bills', 'Other'];

export function Transactions({ expenses, onUpdateExpense, onDeleteExpense }: TransactionsProps) {
  const { showNotification } = useNotification();
  
  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPayment, setSelectedPayment] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'week'>('all');

  // Edit modal state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    category: 'Food',
    subcategory: '',
    date: '',
    merchant: '',
    note: '',
    paymentMethod: 'Bank' as 'Cash' | 'Bank'
  });

  const categoryIcons: Record<string, React.ReactNode> = {
    'Food': <Utensils size={16} />,
    'Shopping': <ShoppingBag size={16} />,
    'Entertainment': <Sparkles size={16} />,
    'Education': <HelpCircle size={16} />,
    'Transport': <TransportIcon size={16} />,
    'Bills': <Landmark size={16} />,
  };
  const defaultIcon = <HelpCircle size={16} />;

  // Filtered and sorted expenses
  const processedExpenses = useMemo(() => {
    let result = [...expenses];

    // 1. Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(e => 
        (e.merchant?.toLowerCase() || '').includes(term) ||
        (e.description?.toLowerCase() || '').includes(term) ||
        (e.note?.toLowerCase() || '').includes(term) ||
        (e.subcategory?.toLowerCase() || '').includes(term)
      );
    }

    // 2. Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(e => e.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 3. Payment Method filter
    if (selectedPayment !== 'All') {
      result = result.filter(e => e.paymentMethod === selectedPayment);
    }

    // 4. Date range filter
    if (dateRange === 'month') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (dateRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter(e => new Date(e.date) >= oneWeekAgo);
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [expenses, searchTerm, selectedCategory, selectedPayment, sortBy, dateRange]);

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      subcategory: expense.subcategory || '',
      date: expense.date.split('T')[0],
      merchant: expense.merchant || expense.description || '',
      note: expense.note || '',
      paymentMethod: expense.paymentMethod || 'Bank'
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const parsedAmount = parseFloat(editFormData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('Please enter a valid amount', 'warning');
      return;
    }

    onUpdateExpense(editingExpense.id, {
      amount: parsedAmount,
      category: editFormData.category,
      subcategory: editFormData.subcategory || undefined,
      description: editFormData.merchant, // keep V1 description matching merchant
      merchant: editFormData.merchant || undefined,
      note: editFormData.note || undefined,
      paymentMethod: editFormData.paymentMethod,
      date: new Date(editFormData.date).toISOString()
    });

    setEditingExpense(null);
    showNotification('Transaction updated successfully', 'success');
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDeleteExpense(id);
      showNotification('Transaction deleted', 'info');
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Editorial Title */}
      <div className="select-none">
        <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Ledger</h2>
        <p className="text-sm text-[var(--muted)] mt-1 font-medium">Detailed spending history and analysis.</p>
      </div>

      {/* Search & Filters Panel */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search merchants, notes, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all font-medium"
            />
          </div>
          
          {/* Quick Filters / Sort Toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full sm:w-44 pl-9 pr-8 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted)] cursor-pointer focus:outline-none appearance-none"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories, Payment Methods & Date Range Bar */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold select-none border-b border-[var(--border)]/30 pb-3">
          {/* Categories select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Payment Method filter */}
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="px-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <option value="All">All Payment Methods</option>
            <option value="Bank">Bank / Cards</option>
            <option value="Cash">Cash</option>
          </select>

          {/* Date range filter */}
          <select
            value={dateRange}
            onChange={(e: any) => setDateRange(e.target.value)}
            className="px-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="month">Current Month</option>
            <option value="week">Past 7 Days</option>
          </select>
        </div>
      </section>

      {/* Transactions List */}
      <section className="space-y-3">
        {processedExpenses.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden glass-panel rounded-2xl">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]/50 bg-[var(--surface-elevated)]/40 select-none text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                    <th className="p-4 font-mono">Transaction</th>
                    <th className="p-4 font-mono">Category</th>
                    <th className="p-4 font-mono">Payment</th>
                    <th className="p-4 font-mono">Date</th>
                    <th className="p-4 text-right font-mono">Amount</th>
                    <th className="p-4 text-right font-mono">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/20 font-medium">
                  {processedExpenses.map((e) => {
                    const icon = categoryIcons[e.category] || defaultIcon;
                    return (
                      <tr key={e.id} className="hover:bg-[var(--surface-elevated)]/20 transition-colors">
                        <td className="p-4 min-w-[200px]">
                          <p className="font-bold text-[var(--foreground)] truncate">{e.merchant || e.description || e.category}</p>
                          {e.note && <p className="text-[11px] text-[var(--muted)] mt-1 truncate font-normal leading-normal font-sans">{e.note}</p>}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                            <span className="shrink-0 text-[var(--accent)]">{icon}</span>
                            <span className="font-semibold">{e.subcategory ? `${e.category} / ${e.subcategory}` : e.category}</span>
                          </span>
                        </td>
                        <td className="p-4 text-xs text-[var(--muted)] font-mono">{e.paymentMethod || 'Bank'}</td>
                        <td className="p-4 text-xs text-[var(--muted)] tabular-digits">
                          {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-right font-bold text-[var(--danger)] tabular-digits">
                          -{formatCurrency(e.amount)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditClick(e)}
                              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] cursor-pointer focus:outline-none"
                              aria-label="Edit transaction"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(e.id)}
                              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] cursor-pointer focus:outline-none"
                              aria-label="Delete transaction"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="block sm:hidden space-y-2.5">
              {processedExpenses.map((e) => {
                const icon = categoryIcons[e.category] || defaultIcon;
                return (
                  <div 
                    key={e.id}
                    className="p-4 rounded-xl glass-panel space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--muted)] shrink-0 mt-0.5">
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate text-[var(--foreground)]">{e.merchant || e.description || e.category}</p>
                          <p className="text-[10px] text-[var(--muted)] mt-0.5 font-semibold">
                            {e.category} {e.subcategory && `• ${e.subcategory}`}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-sm text-[var(--danger)] tabular-digits">-{formatCurrency(e.amount)}</p>
                    </div>

                    {e.note && (
                      <p className="text-xs text-[var(--muted)] bg-[var(--surface-elevated)]/40 p-2 rounded-lg font-medium leading-normal">
                        {e.note}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/20 text-[10px] text-[var(--muted)] font-bold uppercase select-none">
                      <span>{e.paymentMethod || 'Bank'} • {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(e)}
                          className="flex items-center gap-1 py-1 px-2 rounded bg-[var(--accent-light)] text-[var(--accent)] cursor-pointer"
                        >
                          <Edit2 size={10} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(e.id)}
                          className="flex items-center gap-1 py-1 px-2 rounded bg-[var(--danger-light)] text-[var(--danger)] cursor-pointer"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
            <p className="text-sm text-[var(--muted)] font-semibold">No transactions match your search criteria.</p>
          </div>
        )}
      </section>

      {/* Edit Expense Overlay Modal */}
      {editingExpense && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setEditingExpense(null)}
        >
          <div 
            className="w-full max-w-md glass-panel rounded-2xl p-6 space-y-6 shadow-[0_15px_50px_rgba(0,0,0,0.4)] animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center select-none border-b border-[var(--border)]/30 pb-3">
              <h3 className="text-lg font-bold text-[var(--foreground)] font-serif">Edit Transaction</h3>
              <button 
                onClick={() => setEditingExpense(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Amount input focus */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] ml-1 select-none">Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={editFormData.amount}
                  onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })}
                  className="w-full bg-transparent border-none text-2xl font-bold font-mono focus:outline-none focus:ring-0 text-[var(--foreground)] p-1"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)] cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Payment Method</label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={e => setEditFormData({ ...editFormData, paymentMethod: e.target.value as 'Cash' | 'Bank' })}
                    className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)] cursor-pointer"
                  >
                    <option value="Bank">Bank / Cards</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              {/* Conditionally show Subcategories for Food */}
              {editFormData.category.toLowerCase() === 'food' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Subcategory</label>
                  <select
                    value={editFormData.subcategory}
                    onChange={e => setEditFormData({ ...editFormData, subcategory: e.target.value })}
                    className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)] cursor-pointer"
                  >
                    <option value="">Unclassified</option>
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Merchant Name</label>
                <input 
                  type="text" 
                  value={editFormData.merchant}
                  onChange={e => setEditFormData({ ...editFormData, merchant: e.target.value })}
                  className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)]"
                  placeholder="e.g. Swiggy, DMart"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Transaction Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                  <input 
                    type="date" 
                    required
                    value={editFormData.date}
                    onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] select-none">Notes</label>
                <textarea 
                  value={editFormData.note}
                  onChange={e => setEditFormData({ ...editFormData, note: e.target.value })}
                  className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--foreground)] min-h-[60px]"
                  placeholder="Additional context..."
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[var(--accent)] text-[#080808] font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md text-center focus:outline-none"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
