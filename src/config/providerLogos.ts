// Provider logo configuration
// Using SVG logos from simple-icons or company CDNs for best quality

export interface ProviderInfo {
  name: string;
  logo: string; // URL or data URI
  color?: string; // Brand color for fallback
}

export const providerLogos: Record<string, ProviderInfo> = {
  "OpenAI": {
    name: "OpenAI",
    logo: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png",
    color: "#412991"
  },
  "xAI": {
    name: "xAI",
    logo: "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg",
    color: "#000000"
  },
  "Meta": {
    name: "Meta",
    logo: "https://cdn.simpleicons.org/meta/0668E1",
    color: "#0668E1"
  },
  "Google": {
    name: "Google",
    logo: "https://cdn.simpleicons.org/google/4285F4",
    color: "#4285F4"
  },
  "Anthropic": {
    name: "Anthropic",
    logo: "https://cdn.simpleicons.org/anthropic/D4A574",
    color: "#D4A574"
  },
  "Mistral": {
    name: "Mistral",
    logo: "",
    color: "#FF7000"
  },
  "DeepSeek": {
    name: "DeepSeek",
    logo: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek.png",
    color: "#1E40AF"
  },
  "Perplexity": {
    name: "Perplexity",
    logo: "",
    color: "#20808D"
  },
  "Amazon": {
    name: "Amazon",
    logo: "https://companieslogo.com/img/orig/AMZN-e9f942e4.png",
    color: "#FF9900"
  },
  "Microsoft Azure": {
    name: "Microsoft Azure",
    logo: "",
    color: "#0078D4"
  },
  "Liquid AI": {
    name: "Liquid AI",
    logo: "https://avatars.githubusercontent.com/u/161134812?s=200&v=4",
    color: "#00D9FF"
  },
  "Upstage": {
    name: "Upstage",
    logo: "https://pbs.twimg.com/profile_images/1645976530111827968/JLlqDC_n_400x400.jpg",
    color: "#6366F1"
  },
  "MiniMax": {
    name: "MiniMax",
    logo: "",
    color: "#FF6B6B"
  },
  "NVIDIA": {
    name: "NVIDIA",
    logo: "https://cdn.simpleicons.org/nvidia/76B900",
    color: "#76B900"
  },
  "Kimi": {
    name: "Kimi",
    logo: "",
    color: "#8B5CF6"
  },
  "Allen Institute for AI": {
    name: "Allen Institute for AI",
    logo: "https://avatars.githubusercontent.com/u/8317224?s=200&v=4",
    color: "#0EA5E9"
  },
  "IBM": {
    name: "IBM",
    logo: "https://cdn.simpleicons.org/ibm/052FAD",
    color: "#052FAD"
  },
  "Reka AI": {
    name: "Reka AI",
    logo: "https://avatars.githubusercontent.com/u/115127218?s=200&v=4",
    color: "#EC4899"
  },
  "Nous Research": {
    name: "Nous Research",
    logo: "https://avatars.githubusercontent.com/u/125783130?s=200&v=4",
    color: "#A855F7"
  },
  "LG AI Research": {
    name: "LG AI Research",
    logo: "https://www.lgresearch.ai/resources/images/lg_symbol.svg",
    color: "#A50034"
  },
  "Baidu": {
    name: "Baidu",
    logo: "https://cdn.simpleicons.org/baidu/2319DC",
    color: "#2319DC"
  },
  "Deep Cogito": {
    name: "Deep Cogito",
    logo: "https://avatars.githubusercontent.com/u/159277672?s=200&v=4",
    color: "#6366F1"
  },
  "KwaiKAT": {
    name: "KwaiKAT",
    logo: "",
    color: "#FF6B35"
  },
  "Z AI": {
    name: "Z AI",
    logo: "",
    color: "#3B82F6"
  },
  "Cohere": {
    name: "Cohere",
    logo: "",
    color: "#39594D"
  },
  "ServiceNow": {
    name: "ServiceNow",
    logo: "",
    color: "#62D84E"
  },
  "AI21 Labs": {
    name: "AI21 Labs",
    logo: "",
    color: "#FF6B6B"
  },
  "Alibaba": {
    name: "Alibaba",
    logo: "https://cdn.simpleicons.org/alibabadotcom/FF6A00",
    color: "#FF6A00"
  },
  "InclusionAI": {
    name: "InclusionAI",
    logo: "",
    color: "#10B981"
  },
  "ByteDance Seed": {
    name: "ByteDance Seed",
    logo: "https://cdn.simpleicons.org/tiktok/000000",
    color: "#000000"
  },
  "OpenChat": {
    name: "OpenChat",
    logo: "",
    color: "#8B5CF6"
  },
  "Databricks": {
    name: "Databricks",
    logo: "",
    color: "#FF3621"
  },
  "Snowflake": {
    name: "Snowflake",
    logo: "",
    color: "#29B5E8"
  }
};

// Fallback for providers not in the list
export const getProviderInfo = (provider: string): ProviderInfo => {
  return providerLogos[provider] || {
    name: provider,
    logo: "", // Empty = will show text only
    color: "#6B7280" // Gray fallback
  };
};
