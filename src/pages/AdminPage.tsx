import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import type { Article } from '../types';
import {
  adminCreateArticle,
  adminUpdateArticle,
  adminDeleteArticle,
  adminProcessArticleWithLLM,
  adminPreviewArticleLLM,
  adminListArticles,
  adminCreateGitRepo,
  adminCreateLLMModel,
  adminCreateModelCreator,
  adminCreateBenchmark,
  type CreateArticleRequest,
  type ArticleLLMCreateRequest,
  type ArticleLLMPreviewResponse,
  type CreateGitRepoRequest,
  type CreateLLMModelRequest,
  type CreateModelCreatorRequest,
  type CreateLLMBenchmarkRequest,
} from '../services/admin/adminService';
import type { ArticlePageResponse } from '../services/articles/articlesService';
import {
  listAdminWikiProjects,
  type WikiAdminProjectSummary,
} from '../services/wiki/wikiAuthoringService';

type TabType = 'article' | 'wiki' | 'gitrepo' | 'llmmodel' | 'modelcreator' | 'benchmark';
type ArticleSubView = 'list' | 'llm-process' | 'manual-create';

const CATEGORIES = ['AI_LLM', 'DEVOPS_SRE', 'INFRA_CLOUD', 'DATABASE', 'BLOCKCHAIN', 'SECURITY', 'DATA_SCIENCE', 'ARCHITECTURE', 'MOBILE', 'FRONTEND', 'BACKEND', 'OTHER'];
const SOURCES = ['hackernews', 'reddit', 'medium', 'devto', 'hashnode', 'github'];

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('article');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [wikiProjects, setWikiProjects] = useState<WikiAdminProjectSummary[]>([]);
  const [wikiProjectsLoading, setWikiProjectsLoading] = useState(false);
  const [wikiProjectsLoaded, setWikiProjectsLoaded] = useState(false);
  const [wikiSearchInput, setWikiSearchInput] = useState('');
  const [wikiSearch, setWikiSearch] = useState('');

  // Article sub-view state
  const [articleSubView, setArticleSubView] = useState<ArticleSubView>('list');

  // Article list state
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlePage, setArticlePage] = useState(0);
  const [articleTotalPages, setArticleTotalPages] = useState(0);
  const [articleTotalElements, setArticleTotalElements] = useState(0);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleSearchInput, setArticleSearchInput] = useState('');
  const [articlesLoading, setArticlesLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Edit state — full-page editor, not modal
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateArticleRequest>>({});
  const [editTagsInput, setEditTagsInput] = useState('');

  // LLM process state
  const [llmForm, setLlmForm] = useState<ArticleLLMCreateRequest>({
    titleEn: '',
    url: '',
    content: '',
    source: 'hackernews',
    itemType: 'BLOG',
    tags: [],
  });
  const [llmScoreOverride, setLlmScoreOverride] = useState<number | undefined>(undefined);
  const [llmCommentsOverride, setLlmCommentsOverride] = useState<number | undefined>(undefined);
  const [llmUpvotesOverride, setLlmUpvotesOverride] = useState<number | undefined>(undefined);
  const [llmTagsInput, setLlmTagsInput] = useState('');
  const [llmPreview, setLlmPreview] = useState<ArticleLLMPreviewResponse | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);

  // Manual create state
  const [tagsInput, setTagsInput] = useState('');
  const [articleForm, setArticleForm] = useState<CreateArticleRequest>({
    itemType: 'BLOG',
    source: '',
    category: 'AI_LLM',
    summaryKoTitle: '',
    summaryKoBody: '',
    titleEn: '',
    url: '',
    score: 0,
    tags: [],
    createdAtSource: new Date().toISOString().slice(0, 16),
    metadata: { stars: undefined, comments: undefined, upvotes: undefined, readTime: undefined, language: undefined },
  });

  // Other tab forms
  const [gitRepoForm, setGitRepoForm] = useState<CreateGitRepoRequest>({
    fullName: '', url: '', description: '', language: '', stars: 0, forks: 0,
    starsThisWeek: 0, summaryKoTitle: '', summaryKoBody: '', category: 'AI_LLM', score: 0,
  });
  const [llmModelForm, setLLMModelForm] = useState<CreateLLMModelRequest>({
    modelId: '', modelName: '', slug: '', provider: '', description: '',
    priceInput: undefined, priceOutput: undefined, priceBlended: undefined, contextWindow: undefined,
  });
  const [modelCreatorForm, setModelCreatorForm] = useState<CreateModelCreatorRequest>({ slug: '', name: '' });
  const [benchmarkForm, setBenchmarkForm] = useState<CreateLLMBenchmarkRequest>({
    benchmarkType: '', displayName: '', categoryGroup: 'Composite', description: '', explanation: '', sortOrder: 0,
  });

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // Fetch articles list
  const fetchArticles = useCallback(async () => {
    setArticlesLoading(true);
    try {
      const response: ArticlePageResponse = await adminListArticles(articlePage, 15, articleSearch || undefined);
      setArticles(response.content);
      setArticleTotalPages(response.totalPages);
      setArticleTotalElements(response.totalElements);
    } catch (error: any) {
      showMessage('error', `Failed to load articles: ${error.response?.data?.message || error.message}`);
    } finally {
      setArticlesLoading(false);
    }
  }, [articlePage, articleSearch, showMessage]);

  const fetchWikiProjects = useCallback(async () => {
    setWikiProjectsLoading(true);
    try {
      const projects = await listAdminWikiProjects();
      setWikiProjects(projects);
      setWikiProjectsLoaded(true);
    } catch (error: any) {
      showMessage('error', `Failed to load wiki projects: ${error?.response?.data?.message || error?.message || 'unknown error'}`);
    } finally {
      setWikiProjectsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    if (activeTab === 'article' && articleSubView === 'list' && !editArticle) {
      fetchArticles();
    }
  }, [activeTab, articleSubView, editArticle, fetchArticles]);

  useEffect(() => {
    if (activeTab === 'wiki' && !wikiProjectsLoaded && !wikiProjectsLoading) {
      void fetchWikiProjects();
    }
  }, [activeTab, wikiProjectsLoaded, wikiProjectsLoading, fetchWikiProjects]);

  const filteredWikiProjects = useMemo(() => {
    const query = wikiSearch.trim().toLowerCase();
    if (!query) {
      return wikiProjects;
    }

    return wikiProjects.filter(project =>
      project.fullName.toLowerCase().includes(query)
      || (project.projectExternalId || '').toLowerCase().includes(query)
      || project.portName.toLowerCase().includes(query)
      || project.portSlug.toLowerCase().includes(query)
      || (project.language || '').toLowerCase().includes(query)
      || String(project.projectId).includes(query),
    );
  }, [wikiProjects, wikiSearch]);

  // Article search
  const handleArticleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setArticlePage(0);
    setArticleSearch(articleSearchInput);
  };

  const handleWikiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setWikiSearch(wikiSearchInput);
  };

  const openWikiEditor = (projectId: number) => {
    navigate(`/admin/wiki/projects/${projectId}/drafts`);
  };

  // Delete article
  const handleDeleteArticle = async () => {
    if (!deleteConfirm) return;
    try {
      await adminDeleteArticle(deleteConfirm.id);
      showMessage('success', 'Article deleted');
      setDeleteConfirm(null);
      fetchArticles();
    } catch (error: any) {
      showMessage('error', `Delete failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Edit article — open full-page editor
  const openEditModal = (article: Article) => {
    setEditArticle(article);
    setEditForm({
      itemType: article.itemType as any,
      source: article.source,
      category: article.category,
      summaryKoTitle: article.summaryKoTitle,
      summaryKoBody: article.summaryKoBody || '',
      titleEn: article.titleEn,
      url: article.url,
      score: article.score,
      createdAtSource: article.createdAtSource,
      metadata: {
        stars: article.metadata?.stars,
        comments: article.metadata?.comments,
        upvotes: article.metadata?.upvotes,
        readTime: article.metadata?.readTime,
        language: article.metadata?.language,
      },
    });
    setEditTagsInput(article.tags?.join(', ') || '');
  };

  const closeEditor = () => {
    setEditArticle(null);
    setEditForm({});
    setEditTagsInput('');
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArticle) return;
    try {
      const tags = editTagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await adminUpdateArticle(String(editArticle.id), { ...editForm, tags });
      showMessage('success', 'Article updated');
      closeEditor();
      fetchArticles();
    } catch (error: any) {
      showMessage('error', `Update failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // LLM Process
  const handleLLMPreview = async () => {
    setLlmLoading(true);
    setLlmPreview(null);
    try {
      const tags = llmTagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const result = await adminPreviewArticleLLM({ ...llmForm, tags: tags.length > 0 ? tags : undefined });
      setLlmPreview(result);
    } catch (error: any) {
      showMessage('error', `Preview failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleLLMProcess = async () => {
    setLlmLoading(true);
    try {
      const tags = llmTagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const createdArticle = await adminProcessArticleWithLLM({ ...llmForm, tags: tags.length > 0 ? tags : undefined });

      const updatePayload: Partial<CreateArticleRequest> = {};
      if (llmScoreOverride !== undefined) {
        updatePayload.score = llmScoreOverride;
      }
      const metadataUpdate: NonNullable<CreateArticleRequest['metadata']> = {};
      if (llmCommentsOverride !== undefined) {
        metadataUpdate.comments = llmCommentsOverride;
      }
      if (llmUpvotesOverride !== undefined) {
        metadataUpdate.upvotes = llmUpvotesOverride;
      }
      if (Object.keys(metadataUpdate).length > 0) {
        updatePayload.metadata = metadataUpdate;
      }
      if (Object.keys(updatePayload).length > 0) {
        await adminUpdateArticle(String(createdArticle.id), updatePayload);
      }

      showMessage('success', 'Article processed and saved via LLM');
      setLlmForm({ titleEn: '', url: '', content: '', source: 'hackernews', itemType: 'BLOG', tags: [] });
      setLlmScoreOverride(undefined);
      setLlmCommentsOverride(undefined);
      setLlmUpvotesOverride(undefined);
      setLlmTagsInput('');
      setLlmPreview(null);
      setArticleSubView('list');
    } catch (error: any) {
      showMessage('error', `LLM processing failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLlmLoading(false);
    }
  };

  // Manual create
  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await adminCreateArticle({ ...articleForm, tags: tags.length > 0 ? tags : undefined });
      showMessage('success', 'Article created successfully');
      setTagsInput('');
      setArticleForm({
        itemType: 'BLOG', source: '', category: 'AI_LLM', summaryKoTitle: '', summaryKoBody: '',
        titleEn: '', url: '', score: 0, tags: [], createdAtSource: new Date().toISOString().slice(0, 16),
        metadata: { stars: undefined, comments: undefined, upvotes: undefined, readTime: undefined, language: undefined },
      });
      setArticleSubView('list');
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Other tab handlers
  const handleSubmitGitRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateGitRepo(gitRepoForm);
      showMessage('success', 'Git Repository created successfully');
      setGitRepoForm({ fullName: '', url: '', description: '', language: '', stars: 0, forks: 0, starsThisWeek: 0, summaryKoTitle: '', summaryKoBody: '', category: 'AI_LLM', score: 0 });
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitLLMModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateLLMModel(llmModelForm);
      showMessage('success', 'LLM Model created successfully');
      setLLMModelForm({ modelId: '', modelName: '', slug: '', provider: '', description: '', priceInput: undefined, priceOutput: undefined, priceBlended: undefined, contextWindow: undefined });
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitModelCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateModelCreator(modelCreatorForm);
      showMessage('success', 'Model Creator created successfully');
      setModelCreatorForm({ slug: '', name: '' });
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateBenchmark(benchmarkForm);
      showMessage('success', 'Benchmark created successfully');
      setBenchmarkForm({ benchmarkType: '', displayName: '', categoryGroup: 'Composite', description: '', explanation: '', sortOrder: 0 });
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const tabs: Array<{ id: TabType; label: string; shortcut: string }> = [
    { id: 'article', label: 'Articles', shortcut: '1' },
    { id: 'wiki', label: 'Wiki', shortcut: '2' },
    { id: 'gitrepo', label: 'Repos', shortcut: '3' },
    { id: 'llmmodel', label: 'Models', shortcut: '4' },
    { id: 'modelcreator', label: 'Creators', shortcut: '5' },
    { id: 'benchmark', label: 'Benchmarks', shortcut: '6' },
  ];

  const inputClass = "w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-text-muted/50";
  const labelClass = "block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-widest";
  const btnPrimary = "py-2.5 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98]";
  const btnSecondary = "py-2 px-4 border border-surface-border text-text-secondary hover:text-text-primary hover:border-accent/40 hover:bg-surface-elevated rounded-lg text-sm transition-all";

  const truncate = (text: string, max: number) => text.length > max ? text.substring(0, max) + '...' : text;
  const parseOptionalInt = (value: string): number | undefined => {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  // ─── FULL-PAGE ARTICLE EDITOR ─────────────────────────────────
  const renderArticleEditor = () => {
    if (!editArticle) return null;

    return (
      <form onSubmit={handleUpdateArticle} className="flex flex-col h-[calc(100vh-140px)]">
        {/* Editor toolbar */}
        <div className="flex items-center justify-between px-1 pb-4 border-b border-surface-border mb-0 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeEditor}
              className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to list
            </button>
            <div className="w-px h-4 bg-surface-border" />
            <span className="text-xs text-text-muted font-mono">
              ID:{editArticle.id}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium uppercase tracking-wide">
              {editForm.source}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={closeEditor} className={btnSecondary}>
              Discard
            </button>
            <button type="submit" className={`${btnPrimary} px-6`}>
              Save Changes
            </button>
          </div>
        </div>

        {/* Editor body — 2-column layout */}
        <div className="flex-1 grid grid-cols-[1fr_320px] gap-0 mt-0 min-h-0 overflow-hidden">
          {/* Left: Writing surface */}
          <div className="overflow-y-auto pr-6 border-r border-surface-border/50 pt-5 pb-8 scrollbar-minimal">
            {/* English title */}
            <div className="mb-4">
              <label className={labelClass}>English Title</label>
              <input
                type="text"
                value={editForm.titleEn || ''}
                onChange={(e) => setEditForm({ ...editForm, titleEn: e.target.value })}
                className="w-full bg-transparent border-none text-text-primary text-lg font-medium focus:outline-none placeholder:text-text-muted/40"
                placeholder="Original article title..."
                maxLength={500}
              />
            </div>

            {/* Korean title */}
            <div className="mb-5">
              <label className={labelClass}>Korean Title</label>
              <input
                type="text"
                value={editForm.summaryKoTitle || ''}
                onChange={(e) => setEditForm({ ...editForm, summaryKoTitle: e.target.value })}
                className="w-full bg-transparent border-none text-text-primary text-base focus:outline-none placeholder:text-text-muted/40"
                placeholder="Korean summary title..."
                maxLength={500}
              />
            </div>

            <div className="w-12 h-px bg-surface-border mb-5" />

            {/* Korean body — THE MAIN WRITING AREA */}
            <div className="mb-5">
              <label className={labelClass}>Korean Body</label>
              <textarea
                value={editForm.summaryKoBody || ''}
                onChange={(e) => setEditForm({ ...editForm, summaryKoBody: e.target.value })}
                className="w-full bg-transparent border-none text-text-secondary text-sm leading-relaxed focus:outline-none resize-none placeholder:text-text-muted/40"
                placeholder="Write the Korean summary body here. This is your main writing area — take your time, write freely..."
                style={{ minHeight: '400px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.max(400, target.scrollHeight) + 'px';
                }}
              />
            </div>

            {/* URL */}
            <div className="mt-6 pt-5 border-t border-surface-border/40">
              <label className={labelClass}>Source URL</label>
              <input
                type="url"
                value={editForm.url || ''}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                className={`${inputClass} font-mono text-xs`}
                maxLength={1000}
              />
            </div>
          </div>

          {/* Right: Metadata rail */}
          <div className="overflow-y-auto pl-5 pt-5 pb-8 scrollbar-minimal">
            <div className="space-y-4">
              <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Properties</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={editForm.itemType} onChange={(e) => setEditForm({ ...editForm, itemType: e.target.value as any })} className={inputClass}>
                    <option value="BLOG">BLOG</option>
                    <option value="DISCUSSION">DISCUSSION</option>
                    <option value="REPO">REPO</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Source</label>
                  <input type="text" value={editForm.source || ''} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputClass}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Score</label>
                <input type="number" value={editForm.score ?? 0} onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value) })} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Tags</label>
                <input type="text" value={editTagsInput} onChange={(e) => setEditTagsInput(e.target.value)} className={inputClass} placeholder="comma, separated" />
                {editTagsInput && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {editTagsInput.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted border border-surface-border">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-surface-border/50">
                <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Metadata</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Stars</label>
                      <input
                        type="number"
                        value={editForm.metadata?.stars ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, metadata: { ...editForm.metadata, stars: parseOptionalInt(e.target.value) } })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Comments</label>
                      <input
                        type="number"
                        value={editForm.metadata?.comments ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, metadata: { ...editForm.metadata, comments: parseOptionalInt(e.target.value) } })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Upvotes</label>
                      <input
                        type="number"
                        value={editForm.metadata?.upvotes ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, metadata: { ...editForm.metadata, upvotes: parseOptionalInt(e.target.value) } })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Read Time</label>
                      <input
                        type="text"
                        value={editForm.metadata?.readTime || ''}
                        onChange={(e) => setEditForm({ ...editForm, metadata: { ...editForm.metadata, readTime: e.target.value || undefined } })}
                        className={inputClass}
                        placeholder="5분"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Language</label>
                    <input
                      type="text"
                      value={editForm.metadata?.language || ''}
                      onChange={(e) => setEditForm({ ...editForm, metadata: { ...editForm.metadata, language: e.target.value || undefined } })}
                      className={inputClass}
                      placeholder="English"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    );
  };

  // If editing an article, show the full-page editor instead of normal content
  const isEditing = editArticle !== null;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-[1440px] px-6 py-6">
        {/* Header strip */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-text-primary tracking-tight">Admin</h1>
            <div className="w-px h-4 bg-surface-border" />
            <span className="text-xs text-text-muted">{user?.name}</span>
          </div>
          {message && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium animate-fade-in ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar — compact, utilitarian */}
          <aside className="xl:sticky xl:top-20 h-fit">
            <nav className="space-y-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'article') {
                      setArticleSubView('list');
                      closeEditor();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-surface-card text-text-primary border border-surface-border'
                      : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated border border-transparent'
                  }`}
                >
                  <span className="font-medium">{tab.label}</span>
                  <span className="text-[10px] text-text-muted/60 font-mono">{tab.shortcut}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content area */}
          <div className="rounded-xl border border-surface-border bg-surface-card p-5 min-h-[600px]">

            {/* If editing an article, show full-page editor */}
            {activeTab === 'article' && isEditing ? (
              renderArticleEditor()
            ) : (
              <>
                {/* ═══ ARTICLES TAB ═══ */}
                {activeTab === 'article' && (
                  <>
                    {/* Command bar */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-0.5">
                        {[
                          { id: 'list' as const, label: 'List' },
                          { id: 'llm-process' as const, label: 'LLM Process' },
                          { id: 'manual-create' as const, label: 'Manual' },
                        ].map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setArticleSubView(sub.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                              articleSubView === sub.id
                                ? 'bg-surface-card text-text-primary shadow-sm'
                                : 'text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                      {articleSubView === 'list' && (
                        <span className="text-[10px] text-text-muted font-mono">{articleTotalElements} total</span>
                      )}
                    </div>

                    {/* ── Article List ── */}
                    {articleSubView === 'list' && (
                      <div>
                        <form onSubmit={handleArticleSearch} className="flex gap-2 mb-4">
                          <input
                            type="text"
                            value={articleSearchInput}
                            onChange={(e) => setArticleSearchInput(e.target.value)}
                            placeholder="Search articles..."
                            className={`${inputClass} flex-1`}
                          />
                          <button type="submit" className={`${btnSecondary} px-5`}>Search</button>
                          {articleSearch && (
                            <button type="button" onClick={() => { setArticleSearchInput(''); setArticleSearch(''); setArticlePage(0); }} className={`${btnSecondary} px-3`}>Clear</button>
                          )}
                        </form>

                        {articlesLoading ? (
                          <div className="flex items-center justify-center py-16 text-text-muted text-sm">
                            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin mr-2" />
                            Loading...
                          </div>
                        ) : articles.length === 0 ? (
                          <div className="text-center py-16 text-text-muted text-sm">No articles found</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-surface-border text-text-muted text-[10px] uppercase tracking-widest">
                                  <th className="text-left py-2 pr-3 font-semibold">Title</th>
                                  <th className="text-left py-2 px-2 w-20 font-semibold">Source</th>
                                  <th className="text-left py-2 px-2 w-28 font-semibold">Category</th>
                                  <th className="text-right py-2 px-2 w-14 font-semibold">Score</th>
                                  <th className="text-right py-2 pl-2 w-24 font-semibold">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {articles.map((article) => (
                                  <tr
                                    key={article.id}
                                    className="border-b border-surface-border/40 hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                                    onClick={() => openEditModal(article)}
                                  >
                                    <td className="py-2.5 pr-3">
                                      <div className="text-text-primary text-sm leading-snug group-hover:text-accent transition-colors">{truncate(article.summaryKoTitle || article.titleEn, 60)}</div>
                                    </td>
                                    <td className="py-2.5 px-2">
                                      <span className="text-[10px] font-mono text-text-muted">{article.source}</span>
                                    </td>
                                    <td className="py-2.5 px-2">
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/8 text-accent/80 font-medium">{article.category}</span>
                                    </td>
                                    <td className="py-2.5 px-2 text-right text-text-muted font-mono text-xs">{article.score}</td>
                                    <td className="py-2.5 pl-2 text-right" onClick={e => e.stopPropagation()}>
                                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(article)} className="text-[10px] px-2 py-1 text-accent hover:bg-accent/10 rounded transition-colors font-medium">Edit</button>
                                        <button onClick={() => setDeleteConfirm({ id: String(article.id), title: article.summaryKoTitle || article.titleEn })} className="text-[10px] px-2 py-1 text-red-400 hover:bg-red-400/10 rounded transition-colors font-medium">Del</button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {articleTotalPages > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-border/40">
                            <button
                              onClick={() => setArticlePage(p => Math.max(0, p - 1))}
                              disabled={articlePage === 0}
                              className={`${btnSecondary} text-xs ${articlePage === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                              Prev
                            </button>
                            <span className="text-[10px] text-text-muted font-mono">
                              {articlePage + 1} / {articleTotalPages}
                            </span>
                            <button
                              onClick={() => setArticlePage(p => Math.min(articleTotalPages - 1, p + 1))}
                              disabled={articlePage >= articleTotalPages - 1}
                              className={`${btnSecondary} text-xs ${articlePage >= articleTotalPages - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── LLM Process Form ── */}
                    {articleSubView === 'llm-process' && (
                      <div className="max-w-3xl space-y-5">
                        <div>
                          <h2 className="text-base font-semibold text-text-primary">LLM Process</h2>
                          <p className="text-xs text-text-muted mt-0.5">Paste article content for automatic translation, categorization, and tagging.</p>
                        </div>

                        <div className="grid grid-cols-[1fr_140px] gap-3">
                          <div>
                            <label className={labelClass}>English Title</label>
                            <input type="text" value={llmForm.titleEn} onChange={(e) => setLlmForm({ ...llmForm, titleEn: e.target.value })} className={inputClass} required placeholder="Original article title" />
                          </div>
                          <div>
                            <label className={labelClass}>Source</label>
                            <select value={llmForm.source} onChange={(e) => setLlmForm({ ...llmForm, source: e.target.value })} className={inputClass}>
                              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className={labelClass}>URL</label>
                          <input type="url" value={llmForm.url} onChange={(e) => setLlmForm({ ...llmForm, url: e.target.value })} className={inputClass} required placeholder="https://..." />
                        </div>

                        <div>
                          <label className={labelClass}>Content</label>
                          <textarea
                            value={llmForm.content}
                            onChange={(e) => setLlmForm({ ...llmForm, content: e.target.value })}
                            className={`${inputClass} font-mono text-xs leading-relaxed`}
                            style={{ minHeight: '240px' }}
                            required
                            placeholder="Paste the full article content here..."
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = Math.max(240, target.scrollHeight) + 'px';
                            }}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Tags (optional)</label>
                          <input type="text" value={llmTagsInput} onChange={(e) => setLlmTagsInput(e.target.value)} className={inputClass} placeholder="react, performance" />
                        </div>

                        <details className="group">
                          <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary transition-colors select-none">
                            Manual overrides
                          </summary>
                          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-border/40">
                            <div>
                              <label className={labelClass}>Score</label>
                              <input type="number" value={llmScoreOverride ?? ''} onChange={(e) => setLlmScoreOverride(parseOptionalInt(e.target.value))} className={inputClass} placeholder="Override" />
                            </div>
                            <div>
                              <label className={labelClass}>Comments</label>
                              <input type="number" value={llmCommentsOverride ?? ''} onChange={(e) => setLlmCommentsOverride(parseOptionalInt(e.target.value))} className={inputClass} placeholder="Override" />
                            </div>
                            <div>
                              <label className={labelClass}>Upvotes</label>
                              <input type="number" value={llmUpvotesOverride ?? ''} onChange={(e) => setLlmUpvotesOverride(parseOptionalInt(e.target.value))} className={inputClass} placeholder="Override" />
                            </div>
                          </div>
                        </details>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleLLMPreview}
                            disabled={llmLoading || !llmForm.titleEn || !llmForm.url || !llmForm.content}
                            className={`flex-1 ${btnSecondary} ${llmLoading || !llmForm.titleEn || !llmForm.url || !llmForm.content ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            {llmLoading ? 'Processing...' : 'Preview'}
                          </button>
                          <button
                            type="button"
                            onClick={handleLLMProcess}
                            disabled={llmLoading || !llmForm.titleEn || !llmForm.url || !llmForm.content}
                            className={`flex-1 ${btnPrimary} ${llmLoading || !llmForm.titleEn || !llmForm.url || !llmForm.content ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            {llmLoading ? 'Processing...' : 'Process & Save'}
                          </button>
                        </div>

                        {llmLoading && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/15">
                            <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                            <span className="text-xs text-accent">LLM is processing... (5-30s)</span>
                          </div>
                        )}

                        {llmPreview && (
                          <div className="border border-surface-border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">Preview</h3>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${llmPreview.isTechnical ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {llmPreview.isTechnical ? 'Technical' : 'Non-technical'}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">{llmPreview.category}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-text-muted uppercase tracking-wide block mb-0.5">Korean Title</span>
                              <p className="text-text-primary text-sm">{llmPreview.titleKo}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {llmPreview.tags?.map((tag, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted">{tag}</span>
                              ))}
                            </div>
                            <div>
                              <span className="text-[10px] text-text-muted uppercase tracking-wide block mb-0.5">Summary</span>
                              <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap">{truncate(llmPreview.summaryKo, 500)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Manual Create Form ── */}
                    {articleSubView === 'manual-create' && (
                      <form onSubmit={handleSubmitArticle} className="max-w-3xl space-y-4">
                        <div>
                          <h2 className="text-base font-semibold text-text-primary">Manual Create</h2>
                          <p className="text-xs text-text-muted mt-0.5">Create an article record directly.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={labelClass}>Item Type</label>
                            <select value={articleForm.itemType} onChange={(e) => setArticleForm({ ...articleForm, itemType: e.target.value as any })} className={inputClass} required>
                              <option value="BLOG">BLOG</option>
                              <option value="DISCUSSION">DISCUSSION</option>
                              <option value="REPO">REPO</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Source</label>
                            <input type="text" value={articleForm.source} onChange={(e) => setArticleForm({ ...articleForm, source: e.target.value })} className={inputClass} required placeholder="hackernews" />
                          </div>
                          <div>
                            <label className={labelClass}>Category</label>
                            <select value={articleForm.category} onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })} className={inputClass} required>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className={labelClass}>Korean Title</label>
                          <input type="text" value={articleForm.summaryKoTitle} onChange={(e) => setArticleForm({ ...articleForm, summaryKoTitle: e.target.value })} className={inputClass} required maxLength={500} />
                        </div>

                        <div>
                          <label className={labelClass}>Korean Body</label>
                          <textarea
                            value={articleForm.summaryKoBody}
                            onChange={(e) => setArticleForm({ ...articleForm, summaryKoBody: e.target.value })}
                            className={`${inputClass} leading-relaxed`}
                            rows={6}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>English Title</label>
                          <input type="text" value={articleForm.titleEn} onChange={(e) => setArticleForm({ ...articleForm, titleEn: e.target.value })} className={inputClass} required maxLength={500} />
                        </div>

                        <div>
                          <label className={labelClass}>URL</label>
                          <input type="url" value={articleForm.url} onChange={(e) => setArticleForm({ ...articleForm, url: e.target.value })} className={inputClass} required maxLength={1000} />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={labelClass}>Score</label>
                            <input type="number" value={articleForm.score} onChange={(e) => setArticleForm({ ...articleForm, score: parseInt(e.target.value) })} className={inputClass} required />
                          </div>
                          <div>
                            <label className={labelClass}>Created At</label>
                            <input type="datetime-local" value={articleForm.createdAtSource} onChange={(e) => setArticleForm({ ...articleForm, createdAtSource: e.target.value })} className={inputClass} required />
                          </div>
                          <div>
                            <label className={labelClass}>Tags</label>
                            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputClass} placeholder="rust, api" />
                          </div>
                        </div>

                        <details className="group">
                          <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary transition-colors select-none">
                            Metadata (optional)
                          </summary>
                          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-border/40">
                            <div>
                              <label className={labelClass}>Stars</label>
                              <input type="number" value={articleForm.metadata?.stars ?? ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, stars: parseOptionalInt(e.target.value) } })} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Comments</label>
                              <input type="number" value={articleForm.metadata?.comments ?? ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, comments: parseOptionalInt(e.target.value) } })} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Upvotes</label>
                              <input type="number" value={articleForm.metadata?.upvotes ?? ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, upvotes: parseOptionalInt(e.target.value) } })} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Read Time</label>
                              <input type="text" value={articleForm.metadata?.readTime || ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, readTime: e.target.value || undefined } })} className={inputClass} placeholder="5분" />
                            </div>
                            <div>
                              <label className={labelClass}>Language</label>
                              <input type="text" value={articleForm.metadata?.language || ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, language: e.target.value || undefined } })} className={inputClass} placeholder="English" />
                            </div>
                          </div>
                        </details>

                        <button type="submit" className={`w-full ${btnPrimary}`}>Create Article</button>
                      </form>
                    )}
                  </>
                )}

                {/* ═══ WIKI TAB ═══ */}
                {activeTab === 'wiki' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-text-primary">Wiki Authoring</h2>
                        <p className="text-xs text-text-muted mt-0.5">Browse projects and jump into the draft lifecycle.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void fetchWikiProjects()}
                        disabled={wikiProjectsLoading}
                        className={`${btnSecondary} text-xs ${wikiProjectsLoading ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {wikiProjectsLoading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>

                    <form onSubmit={handleWikiSearch} className="flex gap-2">
                      <input
                        type="text"
                        value={wikiSearchInput}
                        onChange={(e) => setWikiSearchInput(e.target.value)}
                        placeholder="Search by repo, port, language, or project id..."
                        className={`${inputClass} flex-1`}
                      />
                      <button type="submit" className={`${btnSecondary} text-xs`}>Search</button>
                      {wikiSearch && (
                        <button type="button" onClick={() => { setWikiSearch(''); setWikiSearchInput(''); }} className={`${btnSecondary} text-xs`}>Clear</button>
                      )}
                    </form>

                    <p className="text-[10px] text-text-muted font-mono">
                      {filteredWikiProjects.length} project{filteredWikiProjects.length === 1 ? '' : 's'}
                      {wikiSearch.trim() ? ` matching "${wikiSearch.trim()}"` : ''}
                    </p>

                    {wikiProjectsLoading ? (
                      <div className="flex items-center justify-center py-12 text-text-muted text-sm">
                        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : filteredWikiProjects.length === 0 ? (
                      <div className="text-center py-12 text-text-muted text-sm">No projects found.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-surface-border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-surface-border bg-surface-elevated text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                              <th className="px-3 py-2 text-left">Repository</th>
                              <th className="px-3 py-2 text-left">Port</th>
                              <th className="px-3 py-2 text-right">Stars</th>
                              <th className="px-3 py-2 text-left">Language</th>
                              <th className="px-3 py-2 text-right w-24"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredWikiProjects.map((project) => (
                              <tr key={project.projectId} className="border-b border-surface-border/40 last:border-b-0 hover:bg-surface-elevated/40 transition-colors">
                                <td className="px-3 py-2">
                                  <div className="font-medium text-text-primary text-sm">{project.fullName}</div>
                                  <div className="text-[10px] text-text-muted font-mono">#{project.projectId}</div>
                                </td>
                                <td className="px-3 py-2 text-text-secondary text-xs">{project.portName}</td>
                                <td className="px-3 py-2 text-right text-text-muted text-xs font-mono">{project.stars.toLocaleString()}</td>
                                <td className="px-3 py-2 text-text-muted text-xs">{project.language || '—'}</td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => openWikiEditor(project.projectId)}
                                    className="text-[10px] px-2.5 py-1 rounded bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
                                  >
                                    Open Drafts
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ GIT REPOS TAB ═══ */}
                {activeTab === 'gitrepo' && (
                  <form onSubmit={handleSubmitGitRepo} className="max-w-2xl space-y-4">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Create Repository</h2>
                      <p className="text-xs text-text-muted mt-0.5">Seed repository metadata into the system.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Full Name</label>
                        <input type="text" value={gitRepoForm.fullName} onChange={(e) => setGitRepoForm({ ...gitRepoForm, fullName: e.target.value })} className={inputClass} required placeholder="facebook/react" />
                      </div>
                      <div>
                        <label className={labelClass}>URL</label>
                        <input type="url" value={gitRepoForm.url} onChange={(e) => setGitRepoForm({ ...gitRepoForm, url: e.target.value })} className={inputClass} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea value={gitRepoForm.description} onChange={(e) => setGitRepoForm({ ...gitRepoForm, description: e.target.value })} className={inputClass} rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Language</label>
                        <input type="text" value={gitRepoForm.language} onChange={(e) => setGitRepoForm({ ...gitRepoForm, language: e.target.value })} className={inputClass} placeholder="JavaScript" />
                      </div>
                      <div>
                        <label className={labelClass}>Category</label>
                        <select value={gitRepoForm.category} onChange={(e) => setGitRepoForm({ ...gitRepoForm, category: e.target.value })} className={inputClass}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Stars</label>
                        <input type="number" value={gitRepoForm.stars} onChange={(e) => setGitRepoForm({ ...gitRepoForm, stars: parseInt(e.target.value) || 0 })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Forks</label>
                        <input type="number" value={gitRepoForm.forks} onChange={(e) => setGitRepoForm({ ...gitRepoForm, forks: parseInt(e.target.value) || 0 })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Stars /wk</label>
                        <input type="number" value={gitRepoForm.starsThisWeek} onChange={(e) => setGitRepoForm({ ...gitRepoForm, starsThisWeek: parseInt(e.target.value) || 0 })} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Korean Title</label>
                      <input type="text" value={gitRepoForm.summaryKoTitle} onChange={(e) => setGitRepoForm({ ...gitRepoForm, summaryKoTitle: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Score</label>
                      <input type="number" value={gitRepoForm.score} onChange={(e) => setGitRepoForm({ ...gitRepoForm, score: parseInt(e.target.value) })} className={inputClass} required />
                    </div>
                    <button type="submit" className={`w-full ${btnPrimary}`}>Create Repository</button>
                  </form>
                )}

                {/* ═══ LLM MODELS TAB ═══ */}
                {activeTab === 'llmmodel' && (
                  <form onSubmit={handleSubmitLLMModel} className="max-w-2xl space-y-4">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Create LLM Model</h2>
                      <p className="text-xs text-text-muted mt-0.5">Register model pricing and context window.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Model ID</label>
                        <input type="text" value={llmModelForm.modelId} onChange={(e) => setLLMModelForm({ ...llmModelForm, modelId: e.target.value })} className={inputClass} required placeholder="gpt-4-turbo" />
                      </div>
                      <div>
                        <label className={labelClass}>Model Name</label>
                        <input type="text" value={llmModelForm.modelName} onChange={(e) => setLLMModelForm({ ...llmModelForm, modelName: e.target.value })} className={inputClass} required placeholder="GPT-4 Turbo" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Slug</label>
                        <input type="text" value={llmModelForm.slug} onChange={(e) => setLLMModelForm({ ...llmModelForm, slug: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Provider</label>
                        <input type="text" value={llmModelForm.provider} onChange={(e) => setLLMModelForm({ ...llmModelForm, provider: e.target.value })} className={inputClass} placeholder="OpenAI" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea value={llmModelForm.description} onChange={(e) => setLLMModelForm({ ...llmModelForm, description: e.target.value })} className={inputClass} rows={2} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Input $/MTok</label>
                        <input type="number" step="0.01" value={llmModelForm.priceInput || ''} onChange={(e) => setLLMModelForm({ ...llmModelForm, priceInput: parseFloat(e.target.value) || undefined })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Output $/MTok</label>
                        <input type="number" step="0.01" value={llmModelForm.priceOutput || ''} onChange={(e) => setLLMModelForm({ ...llmModelForm, priceOutput: parseFloat(e.target.value) || undefined })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Context Window</label>
                        <input type="number" value={llmModelForm.contextWindow || ''} onChange={(e) => setLLMModelForm({ ...llmModelForm, contextWindow: parseInt(e.target.value) || undefined })} className={inputClass} placeholder="128000" />
                      </div>
                    </div>
                    <button type="submit" className={`w-full ${btnPrimary}`}>Create Model</button>
                  </form>
                )}

                {/* ═══ MODEL CREATORS TAB ═══ */}
                {activeTab === 'modelcreator' && (
                  <form onSubmit={handleSubmitModelCreator} className="max-w-md space-y-4">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Create Model Creator</h2>
                      <p className="text-xs text-text-muted mt-0.5">Register a new AI model provider.</p>
                    </div>
                    <div>
                      <label className={labelClass}>Slug</label>
                      <input type="text" value={modelCreatorForm.slug} onChange={(e) => setModelCreatorForm({ ...modelCreatorForm, slug: e.target.value })} className={inputClass} required placeholder="openai" />
                    </div>
                    <div>
                      <label className={labelClass}>Name</label>
                      <input type="text" value={modelCreatorForm.name} onChange={(e) => setModelCreatorForm({ ...modelCreatorForm, name: e.target.value })} className={inputClass} required placeholder="OpenAI" />
                    </div>
                    <button type="submit" className={`w-full ${btnPrimary}`}>Create Creator</button>
                  </form>
                )}

                {/* ═══ BENCHMARKS TAB ═══ */}
                {activeTab === 'benchmark' && (
                  <form onSubmit={handleSubmitBenchmark} className="max-w-2xl space-y-4">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Create Benchmark</h2>
                      <p className="text-xs text-text-muted mt-0.5">Add a benchmark to the catalog.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Benchmark Type</label>
                        <input type="text" value={benchmarkForm.benchmarkType} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, benchmarkType: e.target.value })} className={inputClass} required placeholder="TERMINAL_BENCH_HARD" />
                      </div>
                      <div>
                        <label className={labelClass}>Display Name</label>
                        <input type="text" value={benchmarkForm.displayName} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, displayName: e.target.value })} className={inputClass} required placeholder="Terminal Bench Hard" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Category Group</label>
                        <select value={benchmarkForm.categoryGroup} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, categoryGroup: e.target.value })} className={inputClass} required>
                          {['Composite', 'Agentic', 'Reasoning', 'Coding', 'Math', 'Specialized'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Sort Order</label>
                        <input type="number" value={benchmarkForm.sortOrder} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, sortOrder: parseInt(e.target.value) })} className={inputClass} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea value={benchmarkForm.description} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, description: e.target.value })} className={inputClass} rows={2} required />
                    </div>
                    <div>
                      <label className={labelClass}>Explanation (optional)</label>
                      <textarea value={benchmarkForm.explanation} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, explanation: e.target.value })} className={inputClass} rows={3} />
                    </div>
                    <button type="submit" className={`w-full ${btnPrimary}`}>Create Benchmark</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ DELETE CONFIRMATION DIALOG ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 max-w-sm w-full mx-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-text-primary mb-1.5">Delete article?</h3>
            <p className="text-xs text-text-muted mb-5">
              "{truncate(deleteConfirm.title, 60)}"
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className={`flex-1 ${btnSecondary}`}>Cancel</button>
              <button onClick={handleDeleteArticle} className="flex-1 py-2 px-4 bg-red-500/90 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
