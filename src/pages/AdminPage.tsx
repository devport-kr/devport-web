import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import {
  adminCreateArticle,
  adminCreateGitRepo,
  adminCreateLLMModel,
  adminCreateModelCreator,
  adminCreateBenchmark,
  type CreateArticleRequest,
  type CreateGitRepoRequest,
  type CreateLLMModelRequest,
  type CreateModelCreatorRequest,
  type CreateLLMBenchmarkRequest,
} from '../services/api';

type TabType = 'article' | 'gitrepo' | 'llmmodel' | 'modelcreator' | 'benchmark';

const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('article');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tagsInput, setTagsInput] = useState<string>('');

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
    metadata: {
      stars: undefined,
      comments: undefined,
      upvotes: undefined,
      readTime: undefined,
      language: undefined,
    },
  });

  const [gitRepoForm, setGitRepoForm] = useState<CreateGitRepoRequest>({
    fullName: '',
    url: '',
    description: '',
    language: '',
    stars: 0,
    forks: 0,
    starsThisWeek: 0,
    summaryKoTitle: '',
    summaryKoBody: '',
    category: 'AI_LLM',
    score: 0,
  });

  const [llmModelForm, setLLMModelForm] = useState<CreateLLMModelRequest>({
    modelId: '',
    modelName: '',
    slug: '',
    provider: '',
    description: '',
    priceInput: undefined,
    priceOutput: undefined,
    priceBlended: undefined,
    contextWindow: undefined,
  });

  const [modelCreatorForm, setModelCreatorForm] = useState<CreateModelCreatorRequest>({
    slug: '',
    name: '',
  });

  const [benchmarkForm, setBenchmarkForm] = useState<CreateLLMBenchmarkRequest>({
    benchmarkType: '',
    displayName: '',
    categoryGroup: 'Composite',
    description: '',
    explanation: '',
    sortOrder: 0,
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await adminCreateArticle({
        ...articleForm,
        tags: tags.length > 0 ? tags : undefined,
      });
      showMessage('success', 'Article created successfully');
      setTagsInput('');
      setArticleForm({
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
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitGitRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateGitRepo(gitRepoForm);
      showMessage('success', 'Git Repository created successfully');
      setGitRepoForm({
        fullName: '', url: '', description: '', language: '', stars: 0, forks: 0,
        starsThisWeek: 0, summaryKoTitle: '', summaryKoBody: '', category: 'AI_LLM', score: 0,
      });
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitLLMModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateLLMModel(llmModelForm);
      showMessage('success', 'LLM Model created successfully');
      setLLMModelForm({
        modelId: '', modelName: '', slug: '', provider: '', description: '',
        priceInput: undefined, priceOutput: undefined, priceBlended: undefined, contextWindow: undefined,
      });
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
      setBenchmarkForm({
        benchmarkType: '', displayName: '', categoryGroup: 'Composite',
        description: '', explanation: '', sortOrder: 0,
      });
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const tabs = [
    { id: 'article' as TabType, label: 'Articles' },
    { id: 'gitrepo' as TabType, label: 'Repos' },
    { id: 'llmmodel' as TabType, label: 'Models' },
    { id: 'modelcreator' as TabType, label: 'Creators' },
    { id: 'benchmark' as TabType, label: 'Benchmarks' },
  ];

  const inputClass = "w-full px-3 py-2.5 bg-surface-elevated border border-surface-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-2">관리자</h1>
          <p className="text-sm text-text-muted">
            Welcome, <span className="text-accent">{user?.name}</span>
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-surface-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent -mb-px'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div className="bg-surface-card rounded-2xl p-6 border border-surface-border">
          {activeTab === 'article' && (
            <form onSubmit={handleSubmitArticle} className="space-y-5">
              <h2 className="text-lg font-medium text-text-primary mb-4">Create Article</h2>

              <div className="grid grid-cols-2 gap-4">
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
                  <input type="text" value={articleForm.source} onChange={(e) => setArticleForm({ ...articleForm, source: e.target.value })} className={inputClass} required placeholder="hackernews, reddit..." />
                </div>
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select value={articleForm.category} onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })} className={inputClass} required>
                  {['AI_LLM', 'DEVOPS_SRE', 'INFRA_CLOUD', 'DATABASE', 'BLOCKCHAIN', 'SECURITY', 'DATA_SCIENCE', 'ARCHITECTURE', 'MOBILE', 'FRONTEND', 'BACKEND', 'OTHER'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Korean Title</label>
                <input type="text" value={articleForm.summaryKoTitle} onChange={(e) => setArticleForm({ ...articleForm, summaryKoTitle: e.target.value })} className={inputClass} required maxLength={500} />
              </div>

              <div>
                <label className={labelClass}>Korean Body (Optional)</label>
                <textarea value={articleForm.summaryKoBody} onChange={(e) => setArticleForm({ ...articleForm, summaryKoBody: e.target.value })} className={inputClass} rows={3} />
              </div>

              <div>
                <label className={labelClass}>English Title</label>
                <input type="text" value={articleForm.titleEn} onChange={(e) => setArticleForm({ ...articleForm, titleEn: e.target.value })} className={inputClass} required maxLength={500} />
              </div>

              <div>
                <label className={labelClass}>URL</label>
                <input type="url" value={articleForm.url} onChange={(e) => setArticleForm({ ...articleForm, url: e.target.value })} className={inputClass} required maxLength={1000} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Score</label>
                  <input type="number" value={articleForm.score} onChange={(e) => setArticleForm({ ...articleForm, score: parseInt(e.target.value) })} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Created At</label>
                  <input type="datetime-local" value={articleForm.createdAtSource} onChange={(e) => setArticleForm({ ...articleForm, createdAtSource: e.target.value })} className={inputClass} required />
                </div>
              </div>

              <div>
                <label className={labelClass}>Tags (comma-separated)</label>
                <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputClass} placeholder="rust, performance, api" />
              </div>

              <div className="border-t border-surface-border pt-5 mt-5">
                <h3 className="text-sm font-medium text-text-secondary mb-4">Metadata (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Stars</label>
                    <input type="number" value={articleForm.metadata?.stars || ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, stars: e.target.value ? parseInt(e.target.value) : undefined } })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Comments</label>
                    <input type="number" value={articleForm.metadata?.comments || ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, comments: e.target.value ? parseInt(e.target.value) : undefined } })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Upvotes</label>
                    <input type="number" value={articleForm.metadata?.upvotes || ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, upvotes: e.target.value ? parseInt(e.target.value) : undefined } })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Read Time</label>
                    <input type="text" value={articleForm.metadata?.readTime || ''} onChange={(e) => setArticleForm({ ...articleForm, metadata: { ...articleForm.metadata, readTime: e.target.value || undefined } })} className={inputClass} placeholder="5분" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl transition-colors">
                Create Article
              </button>
            </form>
          )}

          {activeTab === 'gitrepo' && (
            <form onSubmit={handleSubmitGitRepo} className="space-y-5">
              <h2 className="text-lg font-medium text-text-primary mb-4">Create Repository</h2>

              <div>
                <label className={labelClass}>Full Name (owner/repo)</label>
                <input type="text" value={gitRepoForm.fullName} onChange={(e) => setGitRepoForm({ ...gitRepoForm, fullName: e.target.value })} className={inputClass} required placeholder="facebook/react" />
              </div>

              <div>
                <label className={labelClass}>URL</label>
                <input type="url" value={gitRepoForm.url} onChange={(e) => setGitRepoForm({ ...gitRepoForm, url: e.target.value })} className={inputClass} required />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea value={gitRepoForm.description} onChange={(e) => setGitRepoForm({ ...gitRepoForm, description: e.target.value })} className={inputClass} rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Language</label>
                  <input type="text" value={gitRepoForm.language} onChange={(e) => setGitRepoForm({ ...gitRepoForm, language: e.target.value })} className={inputClass} placeholder="JavaScript" />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={gitRepoForm.category} onChange={(e) => setGitRepoForm({ ...gitRepoForm, category: e.target.value })} className={inputClass}>
                    {['AI_LLM', 'DEVOPS_SRE', 'INFRA_CLOUD', 'DATABASE', 'BLOCKCHAIN', 'SECURITY', 'DATA_SCIENCE', 'ARCHITECTURE', 'MOBILE', 'FRONTEND', 'BACKEND', 'OTHER'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Stars</label>
                  <input type="number" value={gitRepoForm.stars} onChange={(e) => setGitRepoForm({ ...gitRepoForm, stars: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Forks</label>
                  <input type="number" value={gitRepoForm.forks} onChange={(e) => setGitRepoForm({ ...gitRepoForm, forks: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Stars This Week</label>
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

              <button type="submit" className="w-full py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl transition-colors">
                Create Repository
              </button>
            </form>
          )}

          {activeTab === 'llmmodel' && (
            <form onSubmit={handleSubmitLLMModel} className="space-y-5">
              <h2 className="text-lg font-medium text-text-primary mb-4">Create LLM Model</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Model ID</label>
                  <input type="text" value={llmModelForm.modelId} onChange={(e) => setLLMModelForm({ ...llmModelForm, modelId: e.target.value })} className={inputClass} required placeholder="gpt-4-turbo" />
                </div>
                <div>
                  <label className={labelClass}>Model Name</label>
                  <input type="text" value={llmModelForm.modelName} onChange={(e) => setLLMModelForm({ ...llmModelForm, modelName: e.target.value })} className={inputClass} required placeholder="GPT-4 Turbo" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Price Input ($/MTok)</label>
                  <input type="number" step="0.01" value={llmModelForm.priceInput || ''} onChange={(e) => setLLMModelForm({ ...llmModelForm, priceInput: parseFloat(e.target.value) || undefined })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Price Output ($/MTok)</label>
                  <input type="number" step="0.01" value={llmModelForm.priceOutput || ''} onChange={(e) => setLLMModelForm({ ...llmModelForm, priceOutput: parseFloat(e.target.value) || undefined })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Context Window</label>
                  <input type="number" value={llmModelForm.contextWindow || ''} onChange={(e) => setLLMModelForm({ ...llmModelForm, contextWindow: parseInt(e.target.value) || undefined })} className={inputClass} placeholder="128000" />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl transition-colors">
                Create Model
              </button>
            </form>
          )}

          {activeTab === 'modelcreator' && (
            <form onSubmit={handleSubmitModelCreator} className="space-y-5">
              <h2 className="text-lg font-medium text-text-primary mb-4">Create Model Creator</h2>

              <div>
                <label className={labelClass}>Slug</label>
                <input type="text" value={modelCreatorForm.slug} onChange={(e) => setModelCreatorForm({ ...modelCreatorForm, slug: e.target.value })} className={inputClass} required placeholder="openai" />
              </div>

              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={modelCreatorForm.name} onChange={(e) => setModelCreatorForm({ ...modelCreatorForm, name: e.target.value })} className={inputClass} required placeholder="OpenAI" />
              </div>

              <button type="submit" className="w-full py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl transition-colors">
                Create Creator
              </button>
            </form>
          )}

          {activeTab === 'benchmark' && (
            <form onSubmit={handleSubmitBenchmark} className="space-y-5">
              <h2 className="text-lg font-medium text-text-primary mb-4">Create Benchmark</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Benchmark Type</label>
                  <input type="text" value={benchmarkForm.benchmarkType} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, benchmarkType: e.target.value })} className={inputClass} required placeholder="TERMINAL_BENCH_HARD" />
                </div>
                <div>
                  <label className={labelClass}>Display Name</label>
                  <input type="text" value={benchmarkForm.displayName} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, displayName: e.target.value })} className={inputClass} required placeholder="Terminal Bench Hard" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Category Group</label>
                  <select value={benchmarkForm.categoryGroup} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, categoryGroup: e.target.value })} className={inputClass} required>
                    {['Composite', 'Agentic', 'Reasoning', 'Coding', 'Math', 'Specialized'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
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
                <label className={labelClass}>Explanation (Optional)</label>
                <textarea value={benchmarkForm.explanation} onChange={(e) => setBenchmarkForm({ ...benchmarkForm, explanation: e.target.value })} className={inputClass} rows={3} />
              </div>

              <button type="submit" className="w-full py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl transition-colors">
                Create Benchmark
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
