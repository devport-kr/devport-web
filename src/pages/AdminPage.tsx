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

  // Separate state for tags input string (to allow comma typing)
  const [tagsInput, setTagsInput] = useState<string>('');

  // Article form state
  const [articleForm, setArticleForm] = useState<CreateArticleRequest>({
    itemType: 'BLOG',
    source: 'hackernews',
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

  // GitRepo form state
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

  // LLM Model form state
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

  // Model Creator form state
  const [modelCreatorForm, setModelCreatorForm] = useState<CreateModelCreatorRequest>({
    slug: '',
    name: '',
  });

  // Benchmark form state
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
      // Process tags from input string
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await adminCreateArticle({
        ...articleForm,
        tags: tags.length > 0 ? tags : undefined,
      });
      showMessage('success', 'Article created successfully!');
      // Reset form
      setTagsInput('');
      setArticleForm({
        itemType: 'BLOG',
        source: 'hackernews',
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
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitGitRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateGitRepo(gitRepoForm);
      showMessage('success', 'Git Repository created successfully!');
      // Reset form
      setGitRepoForm({
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
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitLLMModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateLLMModel(llmModelForm);
      showMessage('success', 'LLM Model created successfully!');
      // Reset form
      setLLMModelForm({
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
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitModelCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateModelCreator(modelCreatorForm);
      showMessage('success', 'Model Creator created successfully!');
      // Reset form
      setModelCreatorForm({
        slug: '',
        name: '',
      });
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateBenchmark(benchmarkForm);
      showMessage('success', 'Benchmark created successfully!');
      // Reset form
      setBenchmarkForm({
        benchmarkType: '',
        displayName: '',
        categoryGroup: 'Composite',
        description: '',
        explanation: '',
        sortOrder: 0,
      });
    } catch (error: any) {
      showMessage('error', `Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const tabs = [
    { id: 'article' as TabType, label: 'Articles' },
    { id: 'gitrepo' as TabType, label: 'Git Repos' },
    { id: 'llmmodel' as TabType, label: 'LLM Models' },
    { id: 'modelcreator' as TabType, label: 'Model Creators' },
    { id: 'benchmark' as TabType, label: 'Benchmarks' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">관리자 페이지</h1>
          <p className="text-gray-400">
            환영합니다, <span className="text-blue-400">{user?.name}</span> (Admin)
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                : 'bg-red-900/20 border border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
          {activeTab === 'article' && (
            <form onSubmit={handleSubmitArticle} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Create Article</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Item Type *
                  </label>
                  <select
                    value={articleForm.itemType}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, itemType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="BLOG">BLOG</option>
                    <option value="DISCUSSION">DISCUSSION</option>
                    <option value="REPO">REPO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Source *
                  </label>
                  <select
                    value={articleForm.source}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, source: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="hackernews">Hacker News</option>
                    <option value="reddit">Reddit</option>
                    <option value="medium">Medium</option>
                    <option value="devto">Dev.to</option>
                    <option value="hashnode">Hashnode</option>
                    <option value="github">GitHub</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={articleForm.category}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="AI_LLM">AI_LLM</option>
                  <option value="DEVOPS_SRE">DEVOPS_SRE</option>
                  <option value="INFRA_CLOUD">INFRA_CLOUD</option>
                  <option value="DATABASE">DATABASE</option>
                  <option value="BLOCKCHAIN">BLOCKCHAIN</option>
                  <option value="SECURITY">SECURITY</option>
                  <option value="DATA_SCIENCE">DATA_SCIENCE</option>
                  <option value="ARCHITECTURE">ARCHITECTURE</option>
                  <option value="MOBILE">MOBILE</option>
                  <option value="FRONTEND">FRONTEND</option>
                  <option value="BACKEND">BACKEND</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Korean Title *
                </label>
                <input
                  type="text"
                  value={articleForm.summaryKoTitle}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, summaryKoTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Korean Body (Optional)
                </label>
                <textarea
                  value={articleForm.summaryKoBody}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, summaryKoBody: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  English Title *
                </label>
                <input
                  type="text"
                  value={articleForm.titleEn}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, titleEn: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={articleForm.url}
                  onChange={(e) => setArticleForm({ ...articleForm, url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Score *
                  </label>
                  <input
                    type="number"
                    value={articleForm.score}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, score: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Created At Source *
                  </label>
                  <input
                    type="datetime-local"
                    value={articleForm.createdAtSource}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, createdAtSource: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="rust, performance, api"
                />
              </div>

              {/* Metadata Section */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Metadata (Optional)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Stars
                    </label>
                    <input
                      type="number"
                      value={articleForm.metadata?.stars || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          metadata: {
                            ...articleForm.metadata,
                            stars: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Comments
                    </label>
                    <input
                      type="number"
                      value={articleForm.metadata?.comments || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          metadata: {
                            ...articleForm.metadata,
                            comments: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Upvotes
                    </label>
                    <input
                      type="number"
                      value={articleForm.metadata?.upvotes || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          metadata: {
                            ...articleForm.metadata,
                            upvotes: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Read Time
                    </label>
                    <input
                      type="text"
                      value={articleForm.metadata?.readTime || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          metadata: {
                            ...articleForm.metadata,
                            readTime: e.target.value || undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="5분"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      value={articleForm.metadata?.language || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          metadata: {
                            ...articleForm.metadata,
                            language: e.target.value || undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="English"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Article
              </button>
            </form>
          )}

          {activeTab === 'gitrepo' && (
            <form onSubmit={handleSubmitGitRepo} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Create Git Repository</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name (owner/repo) *
                </label>
                <input
                  type="text"
                  value={gitRepoForm.fullName}
                  onChange={(e) =>
                    setGitRepoForm({ ...gitRepoForm, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  placeholder="facebook/react"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={gitRepoForm.url}
                  onChange={(e) => setGitRepoForm({ ...gitRepoForm, url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={gitRepoForm.description}
                  onChange={(e) =>
                    setGitRepoForm({ ...gitRepoForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={gitRepoForm.language}
                    onChange={(e) =>
                      setGitRepoForm({ ...gitRepoForm, language: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="JavaScript"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={gitRepoForm.category}
                    onChange={(e) =>
                      setGitRepoForm({ ...gitRepoForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="AI_LLM">AI_LLM</option>
                    <option value="DEVOPS_SRE">DEVOPS_SRE</option>
                    <option value="INFRA_CLOUD">INFRA_CLOUD</option>
                    <option value="DATABASE">DATABASE</option>
                    <option value="BLOCKCHAIN">BLOCKCHAIN</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="DATA_SCIENCE">DATA_SCIENCE</option>
                    <option value="ARCHITECTURE">ARCHITECTURE</option>
                    <option value="MOBILE">MOBILE</option>
                    <option value="FRONTEND">FRONTEND</option>
                    <option value="BACKEND">BACKEND</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Stars
                  </label>
                  <input
                    type="number"
                    value={gitRepoForm.stars}
                    onChange={(e) =>
                      setGitRepoForm({ ...gitRepoForm, stars: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Forks
                  </label>
                  <input
                    type="number"
                    value={gitRepoForm.forks}
                    onChange={(e) =>
                      setGitRepoForm({ ...gitRepoForm, forks: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Stars This Week
                  </label>
                  <input
                    type="number"
                    value={gitRepoForm.starsThisWeek}
                    onChange={(e) =>
                      setGitRepoForm({
                        ...gitRepoForm,
                        starsThisWeek: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Korean Title
                </label>
                <input
                  type="text"
                  value={gitRepoForm.summaryKoTitle}
                  onChange={(e) =>
                    setGitRepoForm({ ...gitRepoForm, summaryKoTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Korean Body
                </label>
                <textarea
                  value={gitRepoForm.summaryKoBody}
                  onChange={(e) =>
                    setGitRepoForm({ ...gitRepoForm, summaryKoBody: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Score *
                </label>
                <input
                  type="number"
                  value={gitRepoForm.score}
                  onChange={(e) =>
                    setGitRepoForm({ ...gitRepoForm, score: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Git Repository
              </button>
            </form>
          )}

          {activeTab === 'llmmodel' && (
            <form onSubmit={handleSubmitLLMModel} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Create LLM Model</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Model ID *
                </label>
                <input
                  type="text"
                  value={llmModelForm.modelId}
                  onChange={(e) =>
                    setLLMModelForm({ ...llmModelForm, modelId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  placeholder="gpt-4-turbo-2024-04-09"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Model Name *
                </label>
                <input
                  type="text"
                  value={llmModelForm.modelName}
                  onChange={(e) =>
                    setLLMModelForm({ ...llmModelForm, modelName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  placeholder="GPT-4 Turbo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={llmModelForm.slug}
                    onChange={(e) =>
                      setLLMModelForm({ ...llmModelForm, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="gpt-4-turbo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Provider
                  </label>
                  <input
                    type="text"
                    value={llmModelForm.provider}
                    onChange={(e) =>
                      setLLMModelForm({ ...llmModelForm, provider: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="OpenAI"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={llmModelForm.description}
                  onChange={(e) =>
                    setLLMModelForm({ ...llmModelForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Price Input ($/MTok)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={llmModelForm.priceInput || ''}
                    onChange={(e) =>
                      setLLMModelForm({
                        ...llmModelForm,
                        priceInput: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Price Output ($/MTok)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={llmModelForm.priceOutput || ''}
                    onChange={(e) =>
                      setLLMModelForm({
                        ...llmModelForm,
                        priceOutput: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Price Blended ($/MTok)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={llmModelForm.priceBlended || ''}
                    onChange={(e) =>
                      setLLMModelForm({
                        ...llmModelForm,
                        priceBlended: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Context Window
                </label>
                <input
                  type="number"
                  value={llmModelForm.contextWindow || ''}
                  onChange={(e) =>
                    setLLMModelForm({
                      ...llmModelForm,
                      contextWindow: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="128000"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Create LLM Model
              </button>
            </form>
          )}

          {activeTab === 'modelcreator' && (
            <form onSubmit={handleSubmitModelCreator} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Create Model Creator</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={modelCreatorForm.slug}
                  onChange={(e) =>
                    setModelCreatorForm({ ...modelCreatorForm, slug: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  placeholder="openai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={modelCreatorForm.name}
                  onChange={(e) =>
                    setModelCreatorForm({ ...modelCreatorForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  placeholder="OpenAI"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Model Creator
              </button>
            </form>
          )}

          {activeTab === 'benchmark' && (
            <form onSubmit={handleSubmitBenchmark} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Create Benchmark</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Benchmark Type *
                </label>
                <input
                  type="text"
                  value={benchmarkForm.benchmarkType}
                  onChange={(e) =>
                    setBenchmarkForm({ ...benchmarkForm, benchmarkType: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  placeholder="TERMINAL_BENCH_HARD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={benchmarkForm.displayName}
                  onChange={(e) =>
                    setBenchmarkForm({ ...benchmarkForm, displayName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  placeholder="Terminal Bench Hard"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category Group *
                  </label>
                  <select
                    value={benchmarkForm.categoryGroup}
                    onChange={(e) =>
                      setBenchmarkForm({ ...benchmarkForm, categoryGroup: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="Composite">Composite</option>
                    <option value="Agentic">Agentic</option>
                    <option value="Reasoning">Reasoning</option>
                    <option value="Coding">Coding</option>
                    <option value="Math">Math</option>
                    <option value="Specialized">Specialized</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Sort Order *
                  </label>
                  <input
                    type="number"
                    value={benchmarkForm.sortOrder}
                    onChange={(e) =>
                      setBenchmarkForm({
                        ...benchmarkForm,
                        sortOrder: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={benchmarkForm.description}
                  onChange={(e) =>
                    setBenchmarkForm({ ...benchmarkForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Explanation (Optional)
                </label>
                <textarea
                  value={benchmarkForm.explanation}
                  onChange={(e) =>
                    setBenchmarkForm({ ...benchmarkForm, explanation: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={5}
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
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
