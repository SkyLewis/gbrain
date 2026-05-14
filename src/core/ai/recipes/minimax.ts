import type { Recipe } from '../types.ts';

/**
 * MiniMax (海螺AI). OpenAI-compatible text endpoint at api.minimax.io
 * and embedding endpoint for `embo-01` (1536 dims).
 *
 * MiniMax's API takes an extra `type: 'db' | 'query'` field for asymmetric
 * retrieval. gbrain currently has no notion of "this is a document vs a
 * query" at the embed-call site (embed() takes only texts), so we default
 * to `type: 'db'` for the indexing path. Queries also embed with `type:
 * 'db'`, making retrieval symmetric. This sacrifices some retrieval
 * quality vs. a true asymmetric setup but works correctly. A follow-up
 * TODO will thread query/document context through the embed seam for
 * full asymmetric support.
 *
 * References:
 * - https://platform.minimax.io/docs/api-reference/text-openai-api
 * - https://platform.minimax.io/docs/api-reference/text-chat-openai
 * - https://www.minimaxi.com/document/guides/embeddings
 */
export const minimax: Recipe = {
  id: 'minimax',
  name: 'MiniMax (海螺AI)',
  tier: 'openai-compat',
  implementation: 'openai-compatible',
  base_url_default: 'https://api.minimax.io/v1',
  auth_env: {
    required: ['MINIMAX_API_KEY'],
    optional: ['MINIMAX_GROUP_ID'],
    setup_url: 'https://platform.minimax.io/docs/api-reference/text-openai-api',
  },
  touchpoints: {
    embedding: {
      models: ['embo-01'],
      default_dims: 1536,
      cost_per_1m_tokens_usd: 0.07,
      price_last_verified: '2026-05-09',
      // MiniMax docs don't publish a hard batch-token cap; declare a
      // conservative 4096-token budget so the gateway pre-splits before
      // hitting whatever undocumented server-side limit exists. Recursive
      // halving in the gateway catches token-limit errors at runtime.
      max_batch_tokens: 4096,
    },
    expansion: {
      models: ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed'],
      cost_per_1m_tokens_usd: 0.3,
      price_last_verified: '2026-05-14',
    },
    chat: {
      models: ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed'],
      supports_tools: true,
      // MiniMax exposes OpenAI-compatible tool calls, but gbrain's Minions
      // subagent loop is still hard-wired to Anthropic Messages persistence.
      supports_subagent_loop: false,
      supports_prompt_cache: false,
      max_context_tokens: 204800,
      max_output_tokens: 2048,
      cost_per_1m_input_usd: 0.3,
      cost_per_1m_output_usd: 1.2,
      price_last_verified: '2026-05-14',
    },
  },
  setup_hint:
    'Get an API key at https://platform.minimax.io, then `export MINIMAX_API_KEY=...`. For China endpoint, set provider_base_urls.minimax to https://api.minimaxi.com/v1.',
};
