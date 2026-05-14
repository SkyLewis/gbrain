import type { Recipe } from '../types.ts';

/**
 * Alibaba DashScope (灵积). OpenAI-compatible /embeddings endpoint at
 * dashscope.aliyuncs.com. Hosts text-embedding-v4 and text-embedding-v3
 * (Matryoshka-aware up to 1024 dims in gbrain's supported options).
 *
 * Reference: https://help.aliyun.com/zh/dashscope/developer-reference/text-embedding-quick-start
 *
 * Note: the China endpoint is the default. International-region users can
 * override cfg.base_urls['dashscope'] to
 * https://dashscope-intl.aliyuncs.com/compatible-mode/v1.
 */
export const dashscope: Recipe = {
  id: 'dashscope',
  name: 'Alibaba DashScope (灵积)',
  tier: 'openai-compat',
  implementation: 'openai-compatible',
  base_url_default: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  auth_env: {
    required: ['DASHSCOPE_API_KEY'],
    setup_url: 'https://help.aliyun.com/zh/dashscope/developer-reference/text-embedding-quick-start',
  },
  touchpoints: {
    embedding: {
      models: ['text-embedding-v4', 'text-embedding-v3'],
      default_dims: 1024,
      dims_options: [64, 128, 256, 512, 768, 1024],
      // Alibaba doesn't publish a hard batch-token cap for the OpenAI-compat
      // path. Conservative declaration so the gateway pre-splits before
      // hitting whatever undocumented server-side limit exists.
      max_batch_tokens: 8192,
      // DashScope embeddings mix English + CJK heavily; the tokenizer is
      // closer to Voyage density than OpenAI tiktoken for CJK-dominant
      // content. Conservative chars_per_token=2 leaves headroom.
      chars_per_token: 2,
    },
  },
  setup_hint:
    'Get an API key at https://help.aliyun.com/zh/dashscope/developer-reference/text-embedding-quick-start, then `export DASHSCOPE_API_KEY=...`',
};
