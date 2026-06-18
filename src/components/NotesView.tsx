/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Pin, 
  Calendar, 
  Tag, 
  X, 
  CheckCircle,
  AlertCircle,
  FileEdit,
  Grid,
  List
} from 'lucide-react';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tag: 'grain' | 'finance' | 'sourcing' | 'reminder' | 'general';
  isPinned: boolean;
  date: string;
  lastUpdated?: string;
}

interface NotesViewProps {
  lang?: 'en' | 'am';
}

const DEFAULT_NOTES: NoteItem[] = [
  {
    id: 'n-1',
    title: 'የሊስት ዝርዝር መመሪያ (Grain Quality Check)',
    content: 'ከዋሊያ (Waliya) እና ኤቮኒ (Evoniy) አቅራቢዎች ጋር ጥራት ባለው ማከማቻ ዙሪያ የተደረገ ውይይት። እያንዳንዱ ኩንታል እህል ከእርጥበት ነፃ መሆኑ መረጋገጥ አለበት።',
    tag: 'grain',
    isPinned: true,
    date: '2026-06-12'
  },
  {
    id: 'n-2',
    title: 'Sourcing Payment Schedule',
    content: 'Review remaining passive creditor balances before initiating next round of grain procurement orders. Keep an eye on accounts with high-priority repayments.',
    tag: 'finance',
    isPinned: false,
    date: '2026-06-16'
  }
];

export default function NotesView({ lang = 'am' }: NotesViewProps) {
  // DB State Persistence
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('p_business_notebook');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse notebook records', e);
      }
    }
    return DEFAULT_NOTES;
  });

  useEffect(() => {
    localStorage.setItem('p_business_notebook', JSON.stringify(notes));
  }, [notes]);

  // View Layout
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<'all' | 'grain' | 'finance' | 'sourcing' | 'reminder' | 'general'>('all');

  // Form Management states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form Field Inputs
  const [fields, setFields] = useState({
    title: '',
    content: '',
    tag: 'general' as NoteItem['tag'],
    isPinned: false,
    date: new Date().toISOString().substring(0, 10)
  });

  // Amharic/English translations dictionary
  const t = {
    title: lang === 'en' ? 'Central Business Notepad' : 'የእቅድ እና ማስታወሻ ደብተር',
    desc: lang === 'en' 
      ? 'Secure documentation of operational grain workflows, market thoughts, and task reminders.' 
      : 'የእህል ንግድ እንቅስቃሴዎችን፣ የፋይናንስ እቅዶችን እና አስቸኳይ አስታዋሾችን ማዕከላዊ ማስቀመጫ።',
    searchPlaceholder: lang === 'en' ? 'Search title or content...' : 'ማስታወሻ በቃል ወይም በርዕስ ይፈልጉ...',
    addBtn: lang === 'en' ? '➕ Create Business Note' : '➕ አዲስ ማስታወሻ ጻፍ',
    allTags: lang === 'en' ? 'All Notes' : 'ሁሉም ማስታወሻዎች',
    notEmpty: lang === 'en' ? 'No notes matched your filters.' : 'ከምርጫዎ ጋር የሚዛመድ ማስታወሻ አልተገኘም።',
    pinnedSection: lang === 'en' ? 'Pinned Highlights' : 'የተሰኩ አስቸኳይ ማስታወሻዎች 📌',
    othersSection: lang === 'en' ? 'Other Notes' : 'ሌሎች መጋዘንና የቢዝነስ ማስታወሻዎች',
    noteFormTitle: lang === 'en' ? 'Create Note Record' : 'አዲስ የቢዝነስ ማስታወሻ ማስገቢያ',
    editFormTitle: lang === 'en' ? 'Edit Business Note' : 'የማስታወሻ መረጃ ማስተካከያ',
    formLabelTitle: lang === 'en' ? 'Note Title' : 'የማስታወሻው ርዕስ',
    formLabelContent: lang === 'en' ? 'Content/Details' : 'ዝርዝር ሐሳብ',
    formLabelCategory: lang === 'en' ? 'Category / Tag' : 'የማስታወሻው ዘርፍ',
    formLabelPinned: lang === 'en' ? 'Pin this note to top?' : 'ይህ ማስታወሻ ከላይ ይሰካ?',
    formLabelDate: lang === 'en' ? 'Creation Date' : 'የተመዘገበበት ቀን',
    saveBtn: lang === 'en' ? 'Save Note' : 'ማስታወሻውን አስቀምጥ',
    cancelBtn: lang === 'en' ? 'Cancel' : 'ተመለስ',
    deleteConfirm: lang === 'en' ? 'Are you sure you want to delete this note?' : 'ይህንን ማስታወሻ በእርግጠኝነት መሰረዝ ይፈልጋሉ?',
    
    // Category tags
    grain: lang === 'en' ? '🌾 Grain Quality / Stock' : '🌾 የእህል ጥራትና ማስቀመጫ',
    finance: lang === 'en' ? '💰 Finance / Loans' : '💰 ፋይናንስ እና ብድር',
    sourcing: lang === 'en' ? '🚚 Order Sourcing' : '🚚 የግዢ ሂደቶች',
    reminder: lang === 'en' ? '🔔 Urgent Reminder' : '🔔 አስቸኳይ ማስታወሻ',
    general: lang === 'en' ? '📝 General Log' : '📝 ጠቅላላ መዝገብ'
  };

  const tagList: { key: NoteItem['tag']; label: string; color: string }[] = [
    { key: 'grain', label: t.grain, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { key: 'finance', label: t.finance, color: 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/10' },
    { key: 'sourcing', label: t.sourcing, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { key: 'reminder', label: t.reminder, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { key: 'general', label: t.general, color: 'bg-slate-800 text-slate-300 border-slate-700' }
  ];

  const getTagMeta = (key: NoteItem['tag']) => {
    return tagList.find(t => t.key === key) || { label: key, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  // Filter notes chronological list
  const processedNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = selectedTagFilter === 'all' ? true : n.tag === selectedTagFilter;
      return matchSearch && matchTag;
    });
  }, [notes, searchQuery, selectedTagFilter]);

  // Separate pinned and regular notes
  const pinnedNotes = useMemo(() => {
    return processedNotes.filter(n => n.isPinned).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [processedNotes]);

  const regularNotes = useMemo(() => {
    return processedNotes.filter(n => !n.isPinned).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [processedNotes]);

  // Create or Update Action handler
  const handleSaveNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.title.trim()) {
      alert(lang === 'en' ? 'Please enter a valid note title!' : 'እባክዎ የማስታወሻውን ርዕስ ያስገቡ!');
      return;
    }

    if (editingNoteId) {
      setNotes(prev => prev.map(n => {
        if (n.id === editingNoteId) {
          return {
            ...n,
            title: fields.title.trim(),
            content: fields.content.trim(),
            tag: fields.tag,
            isPinned: fields.isPinned,
            lastUpdated: new Date().toISOString().substring(0, 10)
          };
        }
        return n;
      }));
      setEditingNoteId(null);
    } else {
      const newNote: NoteItem = {
        id: 'note-' + Date.now(),
        title: fields.title.trim(),
        content: fields.content.trim(),
        tag: fields.tag,
        isPinned: fields.isPinned,
        date: fields.date
      };
      setNotes(prev => [newNote, ...prev]);
    }

    // Reset fields
    setFields({
      title: '',
      content: '',
      tag: 'general',
      isPinned: false,
      date: new Date().toISOString().substring(0, 10)
    });
    setIsFormOpen(false);
  };

  const handleEditInit = (n: NoteItem) => {
    setEditingNoteId(n.id);
    setFields({
      title: n.title,
      content: n.content,
      tag: n.tag,
      isPinned: n.isPinned,
      date: n.date
    });
    setIsFormOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, isPinned: !n.isPinned };
      }
      return n;
    }));
  };

  return (
    <div className="space-y-6" id="notes-module-workspace">
      
      {/* Dynamic Header Banner with Slate styling */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-6 relative overflow-hidden shadow-2xl" id="notes-header-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5ClassName">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-widest inline-flex items-center gap-1">
              <FileText className="w-3" /> Memo Management Engine
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white font-sans tracking-tight" id="notes-title">
              {t.title}
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-sans" id="notes-description">
              {t.desc}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingNoteId(null);
              setFields({
                title: '',
                content: '',
                tag: 'general',
                isPinned: false,
                date: new Date().toISOString().substring(0, 10)
              });
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/10 shrink-0 cursor-pointer"
            id="create-note-trigger-btn"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addBtn}</span>
          </button>
        </div>
      </div>

      {/* Control bar: Search, filters and layouts selector */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl" id="controls-panel">
        
        {/* Search input */}
        <div className="relative w-full md:max-w-md" id="search-input-wrapper">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450" id="search-icon-badge">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-[#0d121f] border border-[#1f2937] hover:border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none transition-all"
            id="search-input-field"
          />
        </div>

        {/* View mode toggle and Tag Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end" id="filters-flex-group">
          
          {/* Quick Tag filter selector dropdown/tabs */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl" id="filter-tabs-scroller">
            <button
              onClick={() => setSelectedTagFilter('all')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                selectedTagFilter === 'all' ? 'bg-[#1f2937] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              id="tag-filter-all"
            >
              {t.allTags}
            </button>
            {(['grain', 'finance', 'sourcing', 'reminder'] as const).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(tag)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  selectedTagFilter === tag ? 'bg-[#1f2937] text-white shadow-sm' : 'text-slate-450 hover:text-white'
                }`}
                id={`tag-filter-${tag}`}
              >
                {tag === 'grain' ? '🌾' : tag === 'finance' ? '💰' : tag === 'sourcing' ? '🚚' : '🔔'}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

          {/* Grid/List togglers */}
          <div className="flex items-center gap-1 bg-[#0d121f] border border-[#1f2937] rounded-xl p-1" id="layout-switches">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-450 hover:text-slate-350'}`}
              title="Grid Layout"
              id="layout-grid-btn"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-450 hover:text-slate-350'}`}
              title="List Layout"
              id="layout-list-btn"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Main rendering list */}
      <div className="space-y-8" id="notes-content-container">
        
        {/* Pinned notes highlight */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-3" id="pinned-section">
            <h4 className="text-xs font-black text-rose-400 tracking-wider uppercase flex items-center gap-1.5 font-sans" id="pinned-heading">
              <Pin className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0 rotate-45" /> {t.pinnedSection}
            </h4>
            
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'} id="pinned-nodes-list">
              {pinnedNotes.map(n => renderNoteCard(n))}
            </div>
          </div>
        )}

        {/* Regular notes section */}
        <div className="space-y-3" id="regular-section">
          {pinnedNotes.length > 0 && (
            <h4 className="text-xs font-black text-slate-400 tracking-wider uppercase font-sans" id="regular-heading">
              {t.othersSection}
            </h4>
          )}

          {regularNotes.length === 0 && pinnedNotes.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-[#1f2937] rounded-3xl bg-[#111827]/40 space-y-3" id="empty-notes-placeholder">
              <div className="w-12 h-12 bg-slate-800/40 text-slate-550 rounded-full flex items-center justify-center mx-auto text-xl font-bold">📂</div>
              <div className="space-y-1">
                <p className="text-xs text-slate-350 font-sans font-bold">{t.notEmpty}</p>
                <p className="text-[10px] text-slate-550 font-sans">
                  {lang === 'en' ? 'Click create note button to start planning your grain warehouse flow' : 'አዲስ የቢዝነስ ወይም የማከማቻ እቅድ ለመጀመር ከላይ ያለውን ቁልፍ ተጫኑ።'}
                </p>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'} id="regular-nodes-list">
              {regularNotes.map(n => renderNoteCard(n))}
            </div>
          )}
        </div>

      </div>

      {/* Note Edit/Add Modal dialog overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="note-modal-backdrop">
          <div className="bg-[#111827] border border-[#1f2937] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative" id="note-modal-box">
            
            <div className="p-6 border-b border-[#1f2937] flex items-center justify-between" id="note-modal-header">
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wider flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-indigo-400" />
                <span>{editingNoteId ? t.editFormTitle : t.noteFormTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                id="close-note-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNoteSubmit} className="p-6 space-y-4" id="note-workspace-form">
              
              {/* Field title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 font-sans uppercase block">
                  {t.formLabelTitle}
                </label>
                <input
                  type="text"
                  value={fields.title}
                  onChange={(e) => setFields(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={lang === 'en' ? 'e.g., Evoniy Sourcing Contract' : 'ምሳሌ፡ የዋሊያ እህል ጥራት ፍተሻ ውጤት'}
                  className="w-full bg-[#0d121f] border border-[#1f2937] focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none placeholder-slate-600 transition-all"
                  id="note-form-title-input"
                />
              </div>

              {/* Categorization & Date group row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Category/Tag Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 font-sans uppercase block">
                    {t.formLabelCategory}
                  </label>
                  <select
                    value={fields.tag}
                    onChange={(e) => setFields(prev => ({ ...prev, tag: e.target.value as NoteItem['tag'] }))}
                    className="w-full bg-[#0d121f] border border-[#1f2937] focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none transition-all cursor-pointer"
                    id="note-form-tag-select"
                  >
                    <option value="general">{t.general}</option>
                    <option value="grain">{t.grain}</option>
                    <option value="finance">{t.finance}</option>
                    <option value="sourcing">{t.sourcing}</option>
                    <option value="reminder">{t.reminder}</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 font-sans uppercase block">
                    {t.formLabelDate}
                  </label>
                  <input
                    type="date"
                    value={fields.date}
                    onChange={(e) => setFields(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-[#0d121f] border border-[#1f2937] focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-bold font-mono text-white focus:outline-none transition-all"
                    id="note-form-date-input"
                  />
                </div>

              </div>

              {/* Content text-area */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 font-sans uppercase block">
                  {t.formLabelContent}
                </label>
                <textarea
                  value={fields.content}
                  onChange={(e) => setFields(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={lang === 'en' ? 'Provide granular bullet items regarding payments or grain checks...' : 'እባክዎ የማስታወሻውን ዋና ይዘትና ጉዳይ እዚህ ዝርዝር አድርገው ይጻፉ...'}
                  rows={5}
                  className="w-full bg-[#0d121f] border border-[#1f2937] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white focus:outline-none placeholder-slate-600 transition-all resize-y leading-relaxed"
                  id="note-form-content-textarea"
                />
              </div>

              {/* Pinned status checkbox */}
              <div className="flex items-center gap-2.5 bg-slate-900/50 p-3 rounded-xl border border-slate-800/40" id="pinned-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="form-pin-checkbox"
                  checked={fields.isPinned}
                  onChange={(e) => setFields(prev => ({ ...prev, isPinned: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-[#0d121f] border-[#1f2937] border cursor-pointer"
                />
                <label htmlFor="form-pin-checkbox" className="text-xs font-bold text-slate-350 font-sans select-none cursor-pointer">
                  📌 {t.formLabelPinned}
                </label>
              </div>

              {/* Action operations controls */}
              <div className="flex items-center gap-2 justify-end pt-3 border-t border-[#1f2937]" id="note-modal-actions-container">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-300 hover:text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                  id="note-form-cancel-btn"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                  id="note-form-save-btn"
                >
                  {t.saveBtn}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );

  // Helper single card renderer logic to avoid code duplication
  function renderNoteCard(n: NoteItem) {
    const isList = viewMode === 'list';
    const tagMeta = getTagMeta(n.tag);

    return (
      <div
        key={n.id}
        onClick={() => handleEditInit(n)}
        className={`bg-[#0d121f] hover:bg-slate-900/55 rounded-2xl border transition-all cursor-pointer group flex relative ${
          isList ? 'flex-row items-center justify-between p-4 gap-4 hover:pl-5 border-[#1f2937]' : 'flex-col justify-between p-5 min-h-48 border-[#1f2937] hover:border-slate-700'
        }`}
        id={`note-card-${n.id}`}
      >
        <div className={`space-y-1.5 ${isList ? 'flex-1 min-w-0' : 'w-full'}`} id={`note-card-body-${n.id}`}>
          
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Tag metadata badge */}
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${tagMeta.color}`} id={`note-tag-${n.id}`}>
              {tagMeta.label}
            </span>

            {/* Date timestamp */}
            <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 font-bold shrink-0">
              <Calendar className="w-2.5 h-2.5" />
              {n.date}
            </span>
          </div>

          <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors font-sans truncate pr-8 mt-1.5" id={`note-title-${n.id}`}>
            {n.title}
          </h4>

          <p className={`text-xs text-slate-450 leading-relaxed font-sans font-medium line-clamp-3 whitespace-pre-wrap ${isList ? 'hidden sm:line-clamp-1' : ''}`} id={`note-content-${n.id}`}>
            {n.content}
          </p>
        </div>

        {/* Action icons corner layout */}
        <div className={`flex items-center gap-1 shrink-0 ${isList ? '' : 'pt-4 border-t border-[#1f2937]/50 mt-3 justify-between'}`} id={`note-card-actions-${n.id}`}>
          
          {/* Pinned status display indicator */}
          <button
            type="button"
            onClick={(e) => handleTogglePin(n.id, e)}
            className={`p-1.5 hover:bg-slate-905 rounded-lg transition-all border ${
              n.isPinned 
                ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' 
                : 'bg-transparent text-slate-500 hover:text-slate-350 border-transparent'
            }`}
            title="Pin Note"
          >
            <Pin className={`w-3.5 h-3.5 fill-current ${n.isPinned ? 'rotate-45' : ''}`} />
          </button>

          <div className="flex items-center gap-1">
            {/* Delete note button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNote(n.id);
              }}
              className="p-1.5 bg-[#1f2937]/30 hover:bg-rose-500/15 text-slate-450 hover:text-rose-400 border border-slate-800/80 hover:border-rose-500/10 rounded-lg transition-all"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    );
  }
}
