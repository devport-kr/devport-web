import type { LLMModel, BenchmarkType } from './types';

// Mock data for LLM models across different benchmarks
export const llmBenchmarkData: Record<BenchmarkType, LLMModel[]> = {
  AGENTIC_CODING: [
    {
      id: '1',
      name: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      score: 82.0,
      contextWindow: '200K',
      pricing: '$3 / $15'
    },
    {
      id: '2',
      name: 'GPT 5.1',
      provider: 'OpenAI',
      score: 76.3,
      contextWindow: '200K',
      pricing: '$1.25 / $10'
    },
    {
      id: '3',
      name: 'Gemini 3 Pro',
      provider: 'Google',
      score: 76.2,
      contextWindow: '10M',
      pricing: '$2 / $12'
    },
    {
      id: '4',
      name: 'Grok 4',
      provider: 'xAI',
      score: 75.0,
      contextWindow: '256K',
      pricing: 'TBA'
    },
    {
      id: '5',
      name: 'GPT-5',
      provider: 'OpenAI',
      score: 74.9,
      contextWindow: '400K',
      pricing: '$1.25 / $10'
    },
    {
      id: '6',
      name: 'Claude Opus 4.1',
      provider: 'Anthropic',
      score: 74.5,
      contextWindow: '200K',
      pricing: '$15 / $75'
    },
    {
      id: '7',
      name: 'Claude 4 Sonnet',
      provider: 'Anthropic',
      score: 72.7,
      contextWindow: '200K',
      pricing: '$3 / $15'
    },
    {
      id: '8',
      name: 'Claude 4 Opus',
      provider: 'Anthropic',
      score: 72.5,
      contextWindow: '200K',
      pricing: '$15 / $75'
    }
  ],
  REASONING: [
    {
      id: '1',
      name: 'Gemini 3 Pro',
      provider: 'Google',
      score: 91.9,
      contextWindow: '10M',
      pricing: '$2 / $12'
    },
    {
      id: '2',
      name: 'GPT 5.1',
      provider: 'OpenAI',
      score: 88.1,
      contextWindow: '200K',
      pricing: '$1.25 / $10'
    },
    {
      id: '3',
      name: 'Grok 4',
      provider: 'xAI',
      score: 87.5,
      contextWindow: '256K',
      pricing: 'TBA'
    },
    {
      id: '4',
      name: 'GPT-5',
      provider: 'OpenAI',
      score: 87.3,
      contextWindow: '400K',
      pricing: '$1.25 / $10'
    },
    {
      id: '5',
      name: 'Gemini 2.5 Pro',
      provider: 'Google',
      score: 86.4,
      contextWindow: '1M',
      pricing: '$1.25 / $10'
    },
    {
      id: '6',
      name: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      score: 83.4,
      contextWindow: '200K',
      pricing: '$3 / $15'
    },
    {
      id: '7',
      name: 'Kimi K2 Thinking',
      provider: 'Moonshot AI',
      score: 84.5,
      contextWindow: '256K',
      pricing: '$0.6 / $2.5'
    },
    {
      id: '8',
      name: 'Claude Opus 4.1',
      provider: 'Anthropic',
      score: 80.9,
      contextWindow: '200K',
      pricing: '$15 / $75'
    }
  ],
  MATH: [
    {
      id: '1',
      name: 'Gemini 3 Pro',
      provider: 'Google',
      score: 100.0,
      contextWindow: '10M',
      pricing: '$2 / $12'
    },
    {
      id: '2',
      name: 'Kimi K2 Thinking',
      provider: 'Moonshot AI',
      score: 99.1,
      contextWindow: '256K',
      pricing: '$0.6 / $2.5'
    },
    {
      id: '3',
      name: 'GPT oss 20b',
      provider: 'OpenAI',
      score: 98.7,
      contextWindow: '131K',
      pricing: '$0.08 / $0.35'
    },
    {
      id: '4',
      name: 'OpenAI o3',
      provider: 'OpenAI',
      score: 98.4,
      contextWindow: '200K',
      pricing: '$10 / $40'
    },
    {
      id: '5',
      name: 'GPT oss 120b',
      provider: 'OpenAI',
      score: 97.9,
      contextWindow: '131K',
      pricing: '$0.15 / $0.6'
    },
    {
      id: '6',
      name: 'OpenAI o3-mini',
      provider: 'OpenAI',
      score: 97.9,
      contextWindow: '200K',
      pricing: '$1.1 / $4.4'
    },
    {
      id: '7',
      name: 'OpenAI o4-mini',
      provider: 'OpenAI',
      score: 97.9,
      contextWindow: '200K',
      pricing: '$1.1 / $4.4'
    },
    {
      id: '8',
      name: 'DeepSeek-R1',
      provider: 'DeepSeek',
      score: 97.3,
      contextWindow: '128K',
      pricing: '$0.55 / $2.19'
    }
  ],
  VISUAL: [
    {
      id: '1',
      name: 'Gemini 3 Pro',
      provider: 'Google',
      score: 31.0,
      contextWindow: '10M',
      pricing: '$2 / $12'
    },
    {
      id: '2',
      name: 'GPT 5.1',
      provider: 'OpenAI',
      score: 18.0,
      contextWindow: '200K',
      pricing: '$1.25 / $10'
    },
    {
      id: '3',
      name: 'GPT-5',
      provider: 'OpenAI',
      score: 18.0,
      contextWindow: '400K',
      pricing: '$1.25 / $10'
    },
    {
      id: '4',
      name: 'Grok 4',
      provider: 'xAI',
      score: 16.0,
      contextWindow: '256K',
      pricing: 'TBA'
    },
    {
      id: '5',
      name: 'Claude Opus 4.1',
      provider: 'Anthropic',
      score: 9.0,
      contextWindow: '200K',
      pricing: '$15 / $75'
    },
    {
      id: '6',
      name: 'OpenAI o3',
      provider: 'OpenAI',
      score: 8.5,
      contextWindow: '200K',
      pricing: '$10 / $40'
    },
    {
      id: '7',
      name: 'Qwen2.5-VL-32B',
      provider: 'Alibaba',
      score: 7.2,
      contextWindow: '131K',
      pricing: 'Open Source'
    },
    {
      id: '8',
      name: 'GPT-4o',
      provider: 'OpenAI',
      score: 6.8,
      contextWindow: '128K',
      pricing: '$2.5 / $10'
    }
  ],
  MULTILINGUAL: [
    {
      id: '1',
      name: 'Gemini 3 Pro',
      provider: 'Google',
      score: 91.8,
      contextWindow: '10M',
      pricing: '$2 / $12'
    },
    {
      id: '2',
      name: 'Claude Opus 4.1',
      provider: 'Anthropic',
      score: 89.5,
      contextWindow: '200K',
      pricing: '$15 / $75'
    },
    {
      id: '3',
      name: 'Gemini 2.5 Pro',
      provider: 'Google',
      score: 89.2,
      contextWindow: '1M',
      pricing: '$1.25 / $10'
    },
    {
      id: '4',
      name: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      score: 89.1,
      contextWindow: '200K',
      pricing: '$3 / $15'
    },
    {
      id: '5',
      name: 'Claude 4 Opus',
      provider: 'Anthropic',
      score: 88.8,
      contextWindow: '200K',
      pricing: '$15 / $75'
    },
    {
      id: '6',
      name: 'GPT 5.1',
      provider: 'OpenAI',
      score: 87.5,
      contextWindow: '200K',
      pricing: '$1.25 / $10'
    },
    {
      id: '7',
      name: 'Grok 4',
      provider: 'xAI',
      score: 86.9,
      contextWindow: '256K',
      pricing: 'TBA'
    },
    {
      id: '8',
      name: 'GPT-5',
      provider: 'OpenAI',
      score: 85.2,
      contextWindow: '400K',
      pricing: '$1.25 / $10'
    }
  ]
};
