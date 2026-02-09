import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { CommentTreeNode } from '../types';
import CommentItem from '../components/CommentItem';

// ─── Types ───────────────────────────────────────────────────

interface Port {
  id: string;
  portNumber: number;
  slug: string;
  name: string;
  description: string;
  projectCount: number;
  recentReleases: number;
  accentColor: string;
  accentBg: string;
}

interface Project {
  id: string;
  portId: string;
  name: string;
  fullName: string;
  repoUrl: string;
  description: string;
  stars: number;
  starsWeekDelta: number;
  forks: number;
  contributors: number;
  language: string;
  languageColor: string;
  license: string;
  lastRelease: string;
  releasesLast30d: number;
  sparkline: number[];
  tags: string[];
}

type EventType = 'feature' | 'fix' | 'security' | 'breaking' | 'perf';

interface ProjectEvent {
  id: string;
  projectId: string;
  version: string;
  releasedAt: string;
  types: EventType[];
  summary: string;
  bullets: string[];
  impactScore: number;
  sourceUrl: string;
}

interface StarHistory {
  date: string;
  stars: number;
}

// ─── Mock Data ───────────────────────────────────────────────

const PORTS: Port[] = [
  { id: 'p1', portNumber: 11434, slug: 'llm', name: 'LLMs', description: '대규모 언어 모델, 로컬 추론, 에이전트 프레임워크', projectCount: 12, recentReleases: 34, accentColor: '#a855f7', accentBg: 'rgba(168,85,247,0.08)' },
  { id: 'p2', portNumber: 6443, slug: 'k8s', name: 'Kubernetes', description: '컨테이너 오케스트레이션, 서비스 메시, 헬름 차트', projectCount: 10, recentReleases: 22, accentColor: '#3b82f6', accentBg: 'rgba(59,130,246,0.08)' },
  { id: 'p3', portNumber: 8080, slug: 'devops', name: 'DevOps / CI', description: 'CI/CD 파이프라인, 빌드 시스템, GitOps', projectCount: 11, recentReleases: 18, accentColor: '#22c55e', accentBg: 'rgba(34,197,94,0.08)' },
  { id: 'p4', portNumber: 2375, slug: 'docker', name: 'Docker', description: '컨테이너 런타임, 이미지 빌드, 레지스트리', projectCount: 9, recentReleases: 15, accentColor: '#06b6d4', accentBg: 'rgba(6,182,212,0.08)' },
  { id: 'p5', portNumber: 5432, slug: 'db', name: 'Databases', description: 'PostgreSQL, 벡터 DB, 시계열, ORM', projectCount: 10, recentReleases: 12, accentColor: '#f59e0b', accentBg: 'rgba(245,158,11,0.08)' },
  { id: 'p6', portNumber: 9090, slug: 'monitoring', name: 'Monitoring', description: '메트릭, 로그 분석, 트레이싱, 대시보드', projectCount: 8, recentReleases: 9, accentColor: '#ef4444', accentBg: 'rgba(239,68,68,0.08)' },
];

const PROJECTS: Project[] = [
  { id: 'pr1', portId: 'p1', name: 'ollama', fullName: 'ollama/ollama', repoUrl: 'https://github.com/ollama/ollama', description: '로컬에서 LLM을 쉽게 실행. Llama 3, Mistral, Gemma 등 지원.', stars: 128400, starsWeekDelta: 3200, forks: 9800, contributors: 420, language: 'Go', languageColor: '#00ADD8', license: 'MIT', lastRelease: '2026-02-03', releasesLast30d: 4, sparkline: [2,4,3,5,4,6,5,7,6,4,8,7], tags: ['llm','local-inference','docker'] },
  { id: 'pr2', portId: 'p1', name: 'langchain', fullName: 'langchain-ai/langchain', repoUrl: 'https://github.com/langchain-ai/langchain', description: 'LLM 애플리케이션 프레임워크. 체이닝, RAG, 에이전트.', stars: 102300, starsWeekDelta: 1800, forks: 15200, contributors: 890, language: 'Python', languageColor: '#3572A5', license: 'MIT', lastRelease: '2026-02-05', releasesLast30d: 8, sparkline: [5,3,6,4,7,5,8,6,9,7,6,8], tags: ['rag','agents','chains'] },
  { id: 'pr3', portId: 'p1', name: 'vllm', fullName: 'vllm-project/vllm', repoUrl: 'https://github.com/vllm-project/vllm', description: '고성능 LLM 추론 엔진. PagedAttention.', stars: 48900, starsWeekDelta: 980, forks: 6200, contributors: 310, language: 'Python', languageColor: '#3572A5', license: 'Apache 2.0', lastRelease: '2026-01-28', releasesLast30d: 3, sparkline: [3,2,4,3,5,4,3,6,5,4,5,4], tags: ['inference','serving','cuda'] },
  { id: 'pr4', portId: 'p1', name: 'llama.cpp', fullName: 'ggerganov/llama.cpp', repoUrl: 'https://github.com/ggerganov/llama.cpp', description: 'C/C++로 LLaMA 추론. 양자화 및 GGUF 포맷.', stars: 78500, starsWeekDelta: 1400, forks: 11200, contributors: 580, language: 'C++', languageColor: '#f34b7d', license: 'MIT', lastRelease: '2026-02-06', releasesLast30d: 6, sparkline: [4,5,6,4,7,5,8,6,5,7,8,9], tags: ['cpp','quantization','gguf'] },
  { id: 'pr5', portId: 'p1', name: 'open-webui', fullName: 'open-webui/open-webui', repoUrl: 'https://github.com/open-webui/open-webui', description: '셀프 호스팅 ChatGPT 스타일 UI. Ollama 연동.', stars: 67200, starsWeekDelta: 2100, forks: 7800, contributors: 290, language: 'TypeScript', languageColor: '#3178c6', license: 'MIT', lastRelease: '2026-02-01', releasesLast30d: 5, sparkline: [3,4,5,6,5,7,8,6,7,9,8,10], tags: ['webui','chat','self-hosted'] },
  { id: 'pr6', portId: 'p1', name: 'crewai', fullName: 'crewai/crewai', repoUrl: 'https://github.com/crewai/crewai', description: '멀티 에이전트 오케스트레이션 프레임워크.', stars: 34100, starsWeekDelta: 890, forks: 4100, contributors: 180, language: 'Python', languageColor: '#3572A5', license: 'MIT', lastRelease: '2026-01-30', releasesLast30d: 3, sparkline: [2,3,2,4,3,5,4,6,5,4,6,5], tags: ['multi-agent','orchestration'] },
  { id: 'pr7', portId: 'p1', name: 'transformers', fullName: 'huggingface/transformers', repoUrl: 'https://github.com/huggingface/transformers', description: '트랜스포머 모델 라이브러리. 수천 개의 사전학습 모델.', stars: 142000, starsWeekDelta: 1100, forks: 28500, contributors: 2400, language: 'Python', languageColor: '#3572A5', license: 'Apache 2.0', lastRelease: '2026-02-04', releasesLast30d: 4, sparkline: [6,5,7,6,5,7,6,8,7,6,7,8], tags: ['transformers','pytorch','nlp'] },
  { id: 'pr8', portId: 'p1', name: 'mlc-llm', fullName: 'mlc-ai/mlc-llm', repoUrl: 'https://github.com/mlc-ai/mlc-llm', description: '모바일/엣지 LLM 추론. WebGPU/Vulkan.', stars: 21800, starsWeekDelta: 540, forks: 2900, contributors: 95, language: 'Python', languageColor: '#3572A5', license: 'Apache 2.0', lastRelease: '2026-01-22', releasesLast30d: 2, sparkline: [1,2,1,3,2,2,3,2,4,3,2,3], tags: ['mobile','edge','webgpu'] },
];

const EVENTS: ProjectEvent[] = [
  { id: 'e1', projectId: 'pr1', version: 'v0.6.2', releasedAt: '2026-02-03', types: ['feature','perf'], summary: 'Llama 4 Scout 지원 추가 및 추론 속도 40% 향상', bullets: ['Meta Llama 4 Scout (109B MoE) 모델 공식 지원','KV 캐시 메모리 사용량 35% 감소','Apple M4 Metal 가속 최적화','--gpu-layers 옵션 추가'], impactScore: 92, sourceUrl: '#' },
  { id: 'e2', projectId: 'pr1', version: 'v0.6.1', releasedAt: '2026-01-20', types: ['security','fix'], summary: 'API 인증 우회 취약점 패치 (CVE-2026-1234)', bullets: ['API 서버 인증 우회 취약점 패치','모델 파일 권한 검증 강화','Windows 경로 인젝션 방지'], impactScore: 88, sourceUrl: '#' },
  { id: 'e3', projectId: 'pr1', version: 'v0.6.0', releasedAt: '2026-01-08', types: ['feature','breaking'], summary: 'GGUF v4 포맷 지원 및 멀티모달 비전 통합', bullets: ['GGUF v4 양자화 포맷 지원 (v3 deprecated)','비전 모델 통합: 이미지 입력 멀티모달 추론','Modelfile FROM 지시어 변경 (Breaking)','동시 요청 4개 → 8개'], impactScore: 95, sourceUrl: '#' },
  { id: 'e4', projectId: 'pr1', version: 'v0.5.12', releasedAt: '2025-12-18', types: ['fix','perf'], summary: '메모리 누수 수정 및 모델 로딩 시간 25% 단축', bullets: ['장시간 실행 메모리 누수 수정','모델 로딩 시간 25% 단축','ARM64 Linux 호환성 개선'], impactScore: 65, sourceUrl: '#' },
  { id: 'e5', projectId: 'pr1', version: 'v0.5.11', releasedAt: '2025-12-02', types: ['feature'], summary: 'Structured Output(JSON 모드) 및 Tool Calling 지원', bullets: ['JSON 스키마 기반 구조화 출력','OpenAI 호환 Tool Calling API','Python/JS SDK 업데이트'], impactScore: 78, sourceUrl: '#' },
  { id: 'e6', projectId: 'pr1', version: 'v0.5.10', releasedAt: '2025-11-15', types: ['perf'], summary: 'Flash Attention 2 통합, 컨텍스트 128K 확장', bullets: ['Flash Attention 2 통합','최대 컨텍스트 128K 토큰','RTX 50xx 최적화'], impactScore: 72, sourceUrl: '#' },
  { id: 'e7', projectId: 'pr2', version: 'v0.3.15', releasedAt: '2026-02-05', types: ['feature'], summary: 'LangGraph Cloud GA 및 멀티 에이전트 라우팅', bullets: ['LangGraph Cloud 정식 출시','멀티 에이전트 자동 라우팅','스트리밍 콜백 개선'], impactScore: 85, sourceUrl: '#' },
  { id: 'e8', projectId: 'pr4', version: 'b4567', releasedAt: '2026-02-06', types: ['feature','perf'], summary: 'Speculative Decoding 지원 및 CUDA 12.8 최적화', bullets: ['Speculative Decoding으로 추론 2x 가속','CUDA 12.8 공식 지원','FP4 양자화 실험적 지원'], impactScore: 90, sourceUrl: '#' },
  { id: 'e9', projectId: 'pr5', version: 'v0.5.0', releasedAt: '2026-02-01', types: ['feature','breaking'], summary: '플러그인 시스템 v2 및 MCP 서버 통합', bullets: ['플러그인 아키텍처 전면 개편 (Breaking)','Model Context Protocol 서버 내장','실시간 협업 편집 기능'], impactScore: 82, sourceUrl: '#' },
];

// 5-year monthly star history for ollama (realistic growth curve)
const STAR_HISTORY: Record<string, StarHistory[]> = {
  pr1: [ // ollama — launched Jul 2023, viral Nov 2023
    { date: '2021-03', stars: 0 }, { date: '2021-06', stars: 0 }, { date: '2021-09', stars: 0 }, { date: '2021-12', stars: 0 },
    { date: '2022-03', stars: 0 }, { date: '2022-06', stars: 0 }, { date: '2022-09', stars: 0 }, { date: '2022-12', stars: 0 },
    { date: '2023-03', stars: 0 }, { date: '2023-06', stars: 120 }, { date: '2023-07', stars: 850 }, { date: '2023-08', stars: 2400 },
    { date: '2023-09', stars: 5100 }, { date: '2023-10', stars: 9800 }, { date: '2023-11', stars: 18500 }, { date: '2023-12', stars: 32000 },
    { date: '2024-01', stars: 38200 }, { date: '2024-02', stars: 44800 }, { date: '2024-03', stars: 52100 }, { date: '2024-04', stars: 58900 },
    { date: '2024-05', stars: 64300 }, { date: '2024-06', stars: 70100 }, { date: '2024-07', stars: 76800 }, { date: '2024-08', stars: 82500 },
    { date: '2024-09', stars: 87200 }, { date: '2024-10', stars: 92100 }, { date: '2024-11', stars: 96800 }, { date: '2024-12', stars: 101400 },
    { date: '2025-01', stars: 105200 }, { date: '2025-02', stars: 108100 }, { date: '2025-03', stars: 110800 }, { date: '2025-04', stars: 113200 },
    { date: '2025-05', stars: 115400 }, { date: '2025-06', stars: 117200 }, { date: '2025-07', stars: 119000 }, { date: '2025-08', stars: 120800 },
    { date: '2025-09', stars: 122400 }, { date: '2025-10', stars: 124000 }, { date: '2025-11', stars: 125500 }, { date: '2025-12', stars: 126800 },
    { date: '2026-01', stars: 127600 }, { date: '2026-02', stars: 128400 },
  ],
};

// ─── Project Overview Data ───────────────────────────────────

const PROJECT_OVERVIEWS: Record<string, { summary: string; highlights: string[]; quickstart: string; links: { label: string; url: string }[]; sourceUrl: string; updatedAt: string }> = {
  pr1: {
    sourceUrl: 'https://github.com/ollama/ollama#readme',
    updatedAt: '2026-02-01',
    summary: 'Ollama는 로컬 환경에서 대규모 언어 모델(LLM)을 쉽게 실행할 수 있는 오픈소스 도구입니다. Docker처럼 간단한 CLI로 Llama 3, Mistral, Gemma 등 100개 이상의 모델을 한 줄 명령어로 실행하며, GGUF 양자화를 통해 소비자급 하드웨어(16GB RAM)에서도 대형 모델을 구동합니다. Go로 작성된 서버 데몬이 포트 11434에서 OpenAI 호환 REST API를 제공합니다.',
    highlights: [
      'Docker 스타일 CLI — ollama run llama3.3 한 줄로 시작',
      'macOS Metal, NVIDIA CUDA, AMD ROCm GPU 자동 가속',
      '100+ 사전 빌드 모델 (Llama 3.3, Mistral, Gemma 2, Qwen 2.5, DeepSeek-R1)',
      'GGUF 양자화: 70B 모델을 16GB RAM에서 실행',
      'OpenAI 호환 REST API — 기존 SDK/라이브러리 즉시 연동',
      'Structured Output, Tool Calling, 비전(멀티모달) 지원',
      'Modelfile로 커스텀 모델 생성 (시스템 프롬프트, 파라미터 설정)',
      'LangChain, LlamaIndex, CrewAI, Spring AI 등 주요 프레임워크 연동',
    ],
    quickstart: 'curl -fsSL https://ollama.com/install.sh | sh\nollama run llama3.3',
    links: [
      { label: 'GitHub', url: 'https://github.com/ollama/ollama' },
      { label: '공식 사이트', url: 'https://ollama.com' },
      { label: '모델 라이브러리', url: 'https://ollama.com/library' },
      { label: 'API 문서', url: 'https://github.com/ollama/ollama/blob/main/docs/api.md' },
    ],
  },
};

// ─── Mock Discussion Data (CommentTreeNode shape) ───────────

const MOCK_COMMENTS: Record<string, CommentTreeNode[]> = {
  pr1: [
    {
      id: 'd1', content: 'v0.6.2에서 Llama 4 Scout 지원 추가된 거 진짜 빠르다. Meta가 발표한지 일주일도 안 됐는데 이미 ollama에서 돌릴 수 있음. KV 캐시 최적화도 체감될 정도로 좋아졌고, M4 Max에서 llama4-scout 70B 양자화 모델 초당 40토큰 나옴.',
      deleted: false, parentId: null, createdAt: '2026-02-06T14:22:00Z', updatedAt: '2026-02-06T14:22:00Z', isOwner: false,
      author: { id: 1, name: 'cloudnative_kr', flair: 'MLOps Engineer', flairColor: '#a855f7' },
      replies: [
        {
          id: 'd1r1', content: 'M4 Max 유저는 좋겠다... 3060 12GB로는 Scout 돌리기 빡센데 Q4_K_M으로 돌릴 수 있는 방법 있나요? VRAM 터질 것 같은데',
          deleted: false, parentId: 'd1', createdAt: '2026-02-06T15:10:00Z', updatedAt: '2026-02-06T15:10:00Z', isOwner: false,
          author: { id: 2, name: 'gpu_poor', flair: 'Indie Dev', flairColor: '#22c55e' },
          replies: [
            {
              id: 'd1r1r1', content: '--gpu-layers 20 정도로 부분 오프로딩 하면 12GB에서도 가능. 나머지는 RAM으로 넘기면 되는데 속도는 좀 느려짐 (초당 8~12토큰). 아니면 Q3_K_S로 더 줄이는 방법도 있음.',
              deleted: false, parentId: 'd1r1', createdAt: '2026-02-06T15:34:00Z', updatedAt: '2026-02-06T15:34:00Z', isOwner: false,
              author: { id: 3, name: 'gguf_wizard', flair: 'Quantization Nerd', flairColor: '#f59e0b' },
              replies: [],
            },
            {
              id: 'd1r1r2', content: 'Q4_K_M 기준 VRAM 약 9.2GB 정도 먹으니까 12GB면 여유 있을 걸? 다만 컨텍스트 길게 잡으면 터지니까 --ctx-size 4096으로 제한 걸어두는 게 좋음.',
              deleted: false, parentId: 'd1r1', createdAt: '2026-02-06T16:02:00Z', updatedAt: '2026-02-06T16:02:00Z', isOwner: false,
              author: { id: 4, name: 'sysadmin_park' },
              replies: [],
            },
          ],
        },
        {
          id: 'd1r2', content: '속도 벤치마크 공유합니다. M4 Pro 48GB 기준:\n• llama4-scout Q5_K_M: 38 tok/s\n• llama3.3-70B Q4_K_M: 22 tok/s\n• mistral-large Q4_K_M: 19 tok/s\n\n확실히 Scout가 MoE라서 같은 파라미터 대비 빠름.',
          deleted: false, parentId: 'd1', createdAt: '2026-02-06T16:45:00Z', updatedAt: '2026-02-06T16:45:00Z', isOwner: false,
          author: { id: 5, name: 'llm_benchmarker' },
          replies: [],
        },
      ],
    },
    {
      id: 'd2', content: 'v0.6.1 보안 패치 CVE-2026-1234 꼭 업데이트하세요. API 서버를 외부에 노출한 경우 인증 우회가 가능한 취약점이었습니다. 특히 Docker로 0.0.0.0:11434 바인딩 해놓은 분들 즉시 업데이트 권장. 원격 코드 실행까지는 아니지만 모델 파일 접근/삭제가 가능했음.',
      deleted: false, parentId: null, createdAt: '2026-02-05T09:15:00Z', updatedAt: '2026-02-05T09:15:00Z', isOwner: false,
      author: { id: 6, name: 'security_first_dev', flair: 'AppSec', flairColor: '#ef4444' },
      replies: [
        {
          id: 'd2r1', content: '이거 때문에 저번 주에 회사 스테이징 서버 올라마 인스턴스 전부 업데이트했음. 다행히 내부망이라 외부 접근은 없었는데, 혹시 모르니 로그도 한번 확인해보세요. /var/log/ollama 에서 비정상 API 호출 있는지 체크.',
          deleted: false, parentId: 'd2', createdAt: '2026-02-05T10:02:00Z', updatedAt: '2026-02-05T10:02:00Z', isOwner: false,
          author: { id: 7, name: 'docker_compose_lover' },
          replies: [],
        },
        {
          id: 'd2r2', content: 'brew upgrade ollama 한 줄이면 끝. macOS 유저들은 간단.',
          deleted: false, parentId: 'd2', createdAt: '2026-02-05T11:30:00Z', updatedAt: '2026-02-05T11:30:00Z', isOwner: false,
          author: { id: 8, name: 'homebrew_ai' },
          replies: [],
        },
      ],
    },
    {
      id: 'd3', content: '우리 팀에서 ollama를 프로덕션에 실제로 쓰고 있는데 경험 공유합니다.\n\n• 내부 문서 검색 RAG 파이프라인에 llama3.3-70B 사용\n• 하루 약 5만 건 추론, A100 80GB 2장으로 운영\n• OpenAI API 대비 비용 약 85% 절감 (월 $12K → $1.8K 인프라 비용)\n• 응답 품질은 GPT-4 대비 90% 수준, 내부 도메인 특화 작업에서는 오히려 나음\n\n다만 모니터링/로깅 인프라는 직접 구축해야 하고, 모델 업데이트 시 A/B 테스트 파이프라인도 필요. 순수 추론 비용만 보면 확실히 셀프 호스팅이 이김.',
      deleted: false, parentId: null, createdAt: '2026-02-03T22:00:00Z', updatedAt: '2026-02-03T22:00:00Z', isOwner: false,
      author: { id: 9, name: 'startup_cto_kim', flair: 'CTO @ stealth', flairColor: '#3b82f6' },
      replies: [
        {
          id: 'd3r1', content: '혹시 Kubernetes에서 돌리시나요? 오토스케일링 어떻게 처리하시는지 궁금합니다. 저도 비슷한 구성 고려 중인데 GPU 노드 스케일링이 걸림돌...',
          deleted: false, parentId: 'd3', createdAt: '2026-02-04T00:15:00Z', updatedAt: '2026-02-04T00:15:00Z', isOwner: false,
          author: { id: 10, name: 'devops_ninja_lee' },
          replies: [
            {
              id: 'd3r1r1', content: 'K8s 위에서 KEDA + custom metrics으로 오토스케일링 하고 있어요. GPU 노드는 최소 2개 상시, 피크 시간에 4개까지 스케일아웃. 프리엠티블 인스턴스 섞어서 비용 최적화 중입니다. 관련 블로그 글 조만간 올릴 예정.',
              deleted: false, parentId: 'd3r1', createdAt: '2026-02-04T01:20:00Z', updatedAt: '2026-02-04T01:20:00Z', isOwner: false,
              author: { id: 9, name: 'startup_cto_kim', flair: 'CTO @ stealth', flairColor: '#3b82f6' },
              replies: [],
            },
          ],
        },
        {
          id: 'd3r2', content: '월 $1.8K면 진짜 괜찮네요. 저희는 vLLM으로 서빙하고 있는데 ollama가 운영 편의성 면에서 더 나을까요? vLLM은 throughput은 좋은데 설정이 좀 복잡...',
          deleted: false, parentId: 'd3', createdAt: '2026-02-04T08:00:00Z', updatedAt: '2026-02-04T08:00:00Z', isOwner: false,
          author: { id: 11, name: 'cost_optimizer' },
          replies: [],
        },
        {
          id: 'd3r3', content: '와 실제 프로덕션 사례 감사합니다. 저도 졸업 프로젝트로 비슷한 거 하려는데, 학교 서버 RTX 4090 1장으로도 가능할까요?',
          deleted: false, parentId: 'd3', createdAt: '2026-02-04T09:30:00Z', updatedAt: '2026-02-04T09:30:00Z', isOwner: false,
          author: { id: 12, name: 'ml_intern_2026' },
          replies: [],
        },
      ],
    },
    {
      id: 'd4', content: 'ollama 코드 기여 경험담. Go로 작성되어 있고 코드 퀄리티 꽤 좋은 편. 이슈 올리면 메인테이너 응답도 빠름 (보통 24시간 이내). first-time contributor 라벨 달린 이슈도 있어서 오픈소스 기여 입문으로 추천.',
      deleted: false, parentId: null, createdAt: '2026-02-02T18:30:00Z', updatedAt: '2026-02-02T18:30:00Z', isOwner: false,
      author: { id: 13, name: 'open_source_contributor' },
      replies: [],
    },
    {
      id: 'd5', content: 'Structured Output + Tool Calling 조합이 게임 체인저. 이전에는 출력 파싱하려고 정규식 떡칠했는데 이제 JSON 스키마 넘기면 깔끔하게 나옴. 사내 챗봇에 적용했더니 파싱 에러 98% 감소. Function calling도 OpenAI 호환이라 기존 코드 거의 안 고치고 마이그레이션 가능.',
      deleted: false, parentId: null, createdAt: '2026-02-01T12:00:00Z', updatedAt: '2026-02-01T12:00:00Z', isOwner: false,
      author: { id: 14, name: 'ai_product_manager', flair: 'PM @ Kakao', flairColor: '#f59e0b' },
      replies: [
        {
          id: 'd5r1', content: 'Spring AI에서 ollama tool calling 연동 가이드 있으면 공유 부탁드립니다. 공식 문서가 좀 부실해서...',
          deleted: false, parentId: 'd5', createdAt: '2026-02-01T14:20:00Z', updatedAt: '2026-02-01T14:20:00Z', isOwner: false,
          author: { id: 15, name: 'backend_dev_choi' },
          replies: [],
        },
      ],
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────

const EVENT_TYPE: Record<EventType, { label: string; cls: string; dot: string }> = {
  feature:  { label: 'Feature',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: '#22c55e' },
  fix:      { label: 'Fix',      cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         dot: '#3b82f6' },
  security: { label: 'Security', cls: 'bg-red-500/10 text-red-400 border-red-500/20',            dot: '#ef4444' },
  breaking: { label: 'Breaking', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20',   dot: '#f97316' },
  perf:     { label: 'Perf',     cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',         dot: '#06b6d4' },
};

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k';
  return String(n);
}

function ago(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  return `${d}일 전`;
}

// ─── Views ───────────────────────────────────────────────────

type View =
  | { type: 'directory' }
  | { type: 'port'; id: string }
  | { type: 'project'; id: string };

export default function PortsPrototypePage() {
  const [view, setView] = useState<View>({ type: 'directory' });
  const [eventFilter, setEventFilter] = useState<EventType | 'all'>('all');

  const port = view.type === 'port' ? PORTS.find(p => p.id === view.id) : null;
  const project = view.type === 'project' ? PROJECTS.find(p => p.id === view.id) : null;
  const projectPort = project ? PORTS.find(p => p.id === project.portId) : null;
  const portProjects = port ? PROJECTS.filter(p => p.portId === port.id) : [];

  const hotReleases = useMemo(() => {
    if (!port) return [];
    const ids = PROJECTS.filter(p => p.portId === port.id).map(p => p.id);
    return EVENTS.filter(e => ids.includes(e.projectId))
      .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime())
      .slice(0, 6);
  }, [port]);

  const filteredEvents = useMemo(() => {
    if (!project) return [];
    const all = EVENTS.filter(e => e.projectId === project.id);
    if (eventFilter === 'all') return all;
    return all.filter(e => e.types.includes(eventFilter));
  }, [project, eventFilter]);

  const goPort = (id: string) => { setView({ type: 'port', id }); setEventFilter('all'); };
  const goProject = (id: string) => { setView({ type: 'project', id }); setEventFilter('all'); };
  const goDir = () => setView({ type: 'directory' });

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="bg-surface/80 backdrop-blur-xl border-b border-surface-border/50 sticky top-0 z-50">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-0.5">
                <span className="text-lg font-semibold text-text-primary tracking-tight">devport</span>
                <span className="text-accent text-lg font-semibold">.</span>
              </Link>
              <span className="text-surface-border">/</span>
              <button onClick={goDir} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                ports
              </button>
              {(port || projectPort) && (
                <>
                  <span className="text-surface-border">/</span>
                  <button
                    onClick={() => goPort((port || projectPort)!.id)}
                    className={`text-sm font-mono transition-colors ${view.type === 'port' ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    :{(port || projectPort)!.portNumber}
                  </button>
                </>
              )}
              {project && (
                <>
                  <span className="text-surface-border">/</span>
                  <span className="text-sm text-text-primary">{project.name}</span>
                </>
              )}
            </div>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wider">
              MOCK
            </span>
          </div>
        </div>
      </nav>

      {/* ─── PROJECT DETAIL (outside <main> for full-width fixed sidebar layout) ── */}
      {view.type === 'project' && project && projectPort && (() => {
        const overview = PROJECT_OVERVIEWS[project.id];
        const starData = STAR_HISTORY[project.id] || [];

        return (
          <div className="min-h-[calc(100vh-3.5rem)]">
            {/* Fixed right sidebar */}
            <aside className="fixed right-0 top-14 w-[28%] min-w-[340px] max-w-[420px] h-[calc(100vh-3.5rem)] pt-8 pb-8 px-6 border-l border-surface-border/50 overflow-y-auto hidden xl:block bg-surface z-40 scrollbar-hide">
              <div className="space-y-4">
                {/* Star history chart */}
                {starData.length > 0 && (
                  <div className="bg-surface-card rounded-xl border border-surface-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-text-secondary">Star History</h3>
                      <span className="text-2xs text-text-muted">{starData[0]?.date} — {starData[starData.length - 1]?.date}</span>
                    </div>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={starData.filter(d => d.stars > 0)}>
                          <defs>
                            <linearGradient id="starGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 9, fill: '#8b949e' }}
                            tickFormatter={(v: string) => v.slice(0, 4)}
                            interval={11}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: '#8b949e' }}
                            tickFormatter={(v: number) => fmt(v)}
                            axisLine={false}
                            tickLine={false}
                            width={32}
                          />
                          <Tooltip
                            contentStyle={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: '8px', fontSize: '11px', color: '#f0f6fc' }}
                            labelStyle={{ color: '#8b949e' }}
                            formatter={(value: number) => [value.toLocaleString(), 'Stars']}
                          />
                          <Area
                            type="monotone"
                            dataKey="stars"
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            fill="url(#starGrad)"
                            dot={false}
                            activeDot={{ r: 3, fill: '#f59e0b', stroke: '#0f1419', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border/50">
                      <div>
                        <div className="text-lg font-semibold text-text-primary">{fmt(project.stars)}</div>
                        <div className="text-2xs text-text-muted">total stars</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-emerald-400">+{fmt(project.starsWeekDelta)}</div>
                        <div className="text-2xs text-text-muted">this week</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick stats */}
                <div className="bg-surface-card rounded-xl border border-surface-border divide-y divide-surface-border">
                  {[
                    { label: 'Contributors', value: String(project.contributors) },
                    { label: 'Forks', value: fmt(project.forks) },
                    { label: 'Releases / 30d', value: String(project.releasesLast30d) },
                    { label: 'Last release', value: ago(project.lastRelease) },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-text-muted">{s.label}</span>
                      <span className="text-xs font-medium text-text-secondary">{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="bg-surface-card rounded-xl border border-surface-border p-4">
                  <h3 className="text-xs text-text-muted mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map(t => (
                      <span key={t} className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface-hover">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content — with right margin on xl to not overlap sidebar */}
            <div className="xl:mr-[28%] max-w-3xl mx-auto px-6 py-8">
              {/* Header: title left, badges right */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-semibold text-text-primary mb-1">{project.fullName}</h1>
                  <p className="text-sm text-text-muted">{project.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-muted">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {fmt(project.stars)}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-muted">
                    <span className="w-2 h-2 rounded-full" style={{ background: project.languageColor }} />
                    {project.language}
                  </span>
                  <span className="px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-muted">
                    {project.license}
                  </span>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                  </a>
                </div>
              </div>

              {/* Overview card */}
              {overview && (
                <div className="bg-surface-card rounded-xl border border-surface-border mb-6 overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      <h2 className="text-sm font-medium text-text-secondary">개요</h2>
                    </div>
                    <div className="flex items-center gap-3 text-2xs text-text-muted">
                      <span>업데이트: {overview.updatedAt}</span>
                      <a
                        href={overview.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent-light transition-colors flex items-center gap-1"
                      >
                        원문
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-5 space-y-4">
                    {/* Summary */}
                    <p className="text-sm text-text-secondary leading-relaxed">{overview.summary}</p>

                    {/* Highlights */}
                    <div className="space-y-1.5">
                      {overview.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="text-text-muted mt-0.5 shrink-0">·</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick start */}
                    <pre className="text-xs text-emerald-300/80 bg-surface-elevated/80 border border-surface-border/50 rounded-lg px-4 py-3 overflow-x-auto font-mono leading-relaxed">
                      {overview.quickstart}
                    </pre>

                    {/* Links row */}
                    <div className="flex flex-wrap gap-2">
                      {overview.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:text-accent-light px-2.5 py-1 rounded-lg border border-surface-border hover:bg-surface-hover transition-colors flex items-center gap-1"
                        >
                          {link.label}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* LLM disclaimer footer */}
                  <div className="px-5 py-2.5 border-t border-surface-border bg-surface-elevated/30">
                    <span className="text-2xs text-text-muted">LLM으로 생성된 한국어 요약입니다. 정확한 내용은 원문 문서를 확인하세요.</span>
                  </div>
                </div>
              )}

              {/* Release timeline */}
              <div className="bg-surface-card rounded-xl border border-surface-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-text-secondary">릴리스</h2>
                  <div className="flex gap-0.5 bg-surface-elevated rounded-lg p-0.5">
                    <button
                      onClick={() => setEventFilter('all')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${eventFilter === 'all' ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-secondary'}`}
                    >
                      All
                    </button>
                    {(Object.keys(EVENT_TYPE) as EventType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setEventFilter(t)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${eventFilter === t ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-secondary'}`}
                      >
                        {EVENT_TYPE[t].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative pl-5">
                  <div className="absolute left-[3px] top-1 bottom-1 w-px bg-surface-border" />

                  {filteredEvents.map((ev) => {
                    const dotColor = ev.types.includes('security') ? EVENT_TYPE.security.dot
                      : ev.types.includes('breaking') ? EVENT_TYPE.breaking.dot
                      : projectPort.accentColor;

                    return (
                      <div key={ev.id} className="relative pb-6 last:pb-0">
                        <div className="absolute -left-5 top-1 w-[7px] h-[7px] rounded-full border-2" style={{ borderColor: dotColor, background: '#0f1419' }}>
                          <div className="absolute inset-[1px] rounded-full" style={{ background: dotColor }} />
                        </div>

                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-semibold text-text-primary">{ev.version}</span>
                          <span className="text-2xs text-text-muted">{ev.releasedAt}</span>
                          <div className="flex gap-1 ml-auto">
                            {ev.types.map(t => (
                              <span key={t} className={`text-2xs px-1.5 py-0.5 rounded border ${EVENT_TYPE[t].cls}`}>
                                {EVENT_TYPE[t].label}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-sm text-text-primary mb-2">{ev.summary}</p>

                        <ul className="space-y-1 mb-2">
                          {ev.bullets.map((b, i) => (
                            <li key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                              <span className="text-surface-border mt-0.5">·</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="flex items-center gap-3 text-2xs text-text-muted">
                          <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light transition-colors">릴리스 노트</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LLM disclaimer footer */}
              <div className="text-center mt-6 mb-8">
                <span className="text-2xs text-text-muted">릴리스 요약은 LLM으로 생성 · 원문 확인 필수</span>
              </div>

              {/* ─── Discussion Section ─────────────────────── */}
              {(() => {
                const threads = MOCK_COMMENTS[project.id] || [];
                const totalComments = threads.reduce((sum, c) => {
                  const countAll = (n: CommentTreeNode): number => 1 + n.replies.reduce((s, r) => s + countAll(r), 0);
                  return sum + countAll(c);
                }, 0);
                const noop = async () => {};

                return (
                  <div className="space-y-4">
                    {/* Discussion header */}
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                      <h2 className="text-sm font-medium text-text-secondary">토론</h2>
                      {totalComments > 0 && (
                        <span className="text-xs text-text-muted">{totalComments}개 댓글</span>
                      )}
                    </div>

                    {/* Comment input placeholder */}
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-2xs text-text-muted shrink-0">
                        ?
                      </div>
                      <div
                        className="flex-1 bg-surface-elevated/50 border border-surface-border/50 rounded-lg px-4 py-2.5 text-sm text-text-muted cursor-text hover:border-surface-border transition-colors"
                      >
                        이 프로젝트에 대해 의견을 공유하세요...
                      </div>
                    </div>

                    {/* Thread list */}
                    <div className="space-y-1">
                      {threads.map(thread => (
                        <CommentItem
                          key={thread.id}
                          comment={thread}
                          articleId="mock"
                          onReply={noop}
                          onEdit={noop}
                          onDelete={noop}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Directory and port views stay inside <main> */}
      {view.type !== 'project' && (
        <main className="max-w-[1100px] mx-auto px-6 py-8">

          {/* ─── DIRECTORY ──────────────────────────────────── */}
          {view.type === 'directory' && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-text-primary tracking-tight mb-1">Ports</h1>
                <p className="text-sm text-text-muted">포트 번호로 분류된 오픈소스 커뮤니티</p>
              </div>

              {/* Port list */}
              <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden divide-y divide-surface-border">
                {PORTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => goPort(p.id)}
                    className="w-full flex items-center gap-5 px-5 py-4 hover:bg-surface-hover/50 transition-colors text-left group"
                  >
                    {/* Port number */}
                    <div className="w-24 shrink-0">
                      <span className="font-mono text-xl font-bold tracking-tighter" style={{ color: p.accentColor }}>
                        :{p.portNumber}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-text-primary group-hover:text-accent-light transition-colors">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate">{p.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 shrink-0 text-xs text-text-muted">
                      <div className="text-right">
                        <div className="text-text-secondary font-medium">{p.projectCount}</div>
                        <div className="text-2xs">프로젝트</div>
                      </div>
                      <div className="text-right">
                        <div className="text-text-secondary font-medium">{p.recentReleases}</div>
                        <div className="text-2xs">릴리스/30d</div>
                      </div>
                      {/* Activity bar */}
                      <div className="w-16">
                        <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, (p.recentReleases / 35) * 100)}%`, background: p.accentColor }}
                          />
                        </div>
                      </div>
                    </div>

                    <svg className="w-4 h-4 text-text-muted/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── PORT DETAIL ────────────────────────────────── */}
          {view.type === 'port' && port && (
            <div>
              {/* Header */}
              <div className="flex items-baseline gap-4 mb-6">
                <span className="font-mono text-3xl font-bold tracking-tighter" style={{ color: port.accentColor }}>
                  :{port.portNumber}
                </span>
                <h1 className="text-xl font-semibold text-text-primary">{port.name}</h1>
                <span className="text-sm text-text-muted">{port.description}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Projects — left 3 cols */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-text-secondary">프로젝트 ({portProjects.length})</h2>
                    <span className="text-xs text-text-muted">릴리스 기준 정렬</span>
                  </div>

                  <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden divide-y divide-surface-border">
                    {portProjects.sort((a, b) => b.releasesLast30d - a.releasesLast30d).map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => goProject(p.id)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-surface-hover/50 transition-colors text-left group"
                      >
                        {/* Rank */}
                        <span className={`text-xs font-mono w-5 shrink-0 ${i < 3 ? 'text-accent font-medium' : 'text-text-muted'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-text-primary group-hover:text-accent-light transition-colors truncate">
                              {p.fullName}
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <span className="w-2 h-2 rounded-full" style={{ background: p.languageColor }} />
                              <span className="text-2xs text-text-muted">{p.language}</span>
                            </span>
                          </div>
                          <p className="text-xs text-text-muted truncate">{p.description}</p>
                        </div>

                        {/* Stars */}
                        <div className="hidden sm:flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-text-secondary">
                              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              {fmt(p.stars)}
                            </div>
                            {p.starsWeekDelta > 0 && (
                              <span className="text-2xs text-emerald-400">+{fmt(p.starsWeekDelta)}/wk</span>
                            )}
                          </div>
                          {/* Sparkline */}
                          <div className="w-14 h-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={p.sparkline.map((v, j) => ({ v, j }))}>
                                <defs>
                                  <linearGradient id={`sp-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={port.accentColor} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={port.accentColor} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke={port.accentColor} strokeWidth={1.5} fill={`url(#sp-${p.id})`} dot={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hot releases — right 2 cols */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                    <h2 className="text-sm font-medium text-text-secondary">최근 릴리스</h2>
                  </div>

                  <div className="space-y-2">
                    {hotReleases.map((ev) => {
                      const proj = PROJECTS.find(p => p.id === ev.projectId);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => proj && goProject(proj.id)}
                          className="bg-surface-card rounded-xl border border-surface-border p-4 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-medium text-text-secondary">{proj?.name}</span>
                            <span className="text-xs font-mono text-text-muted">{ev.version}</span>
                            <span className="text-2xs text-text-muted ml-auto">{ago(ev.releasedAt)}</span>
                          </div>
                          <p className="text-sm text-text-primary mb-2 line-clamp-2">{ev.summary}</p>
                          <div className="flex gap-1.5">
                            {ev.types.map(t => (
                              <span key={t} className={`text-2xs px-1.5 py-0.5 rounded border ${EVENT_TYPE[t].cls}`}>
                                {EVENT_TYPE[t].label}
                              </span>
                            ))}
                            {ev.impactScore >= 80 && (
                              <span className="text-2xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 ml-auto font-mono">
                                {ev.impactScore}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
}
