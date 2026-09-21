import type { FeedItem } from "../lib/types";

// Curated technical background, not a claim that these papers are new this week.
// Each excerpt provides a mechanism and a boundary, not just a topic name.
export const explainerReferences: FeedItem[] = [
  {
    title: "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters",
    link: "https://arxiv.org/abs/2408.03314",
    sourceName: "Snell et al. — original research paper (arXiv)", authority: "primary",
    technicalTopics: ["Adaptive test-time compute"],
    snippet: "Technical background, 2024. This paper studies spending inference computation on searching with process-based verifiers and on adaptively revising responses. A fixed best-of-N budget is a baseline. The useful allocation depends on prompt difficulty: choose a search/revision strategy per prompt instead of spending the same budget everywhere. Extra computation is not uniformly effective, and gains depend on the base model's existing ability on the task. Explain allocation and verification, not a generic claim that thinking longer is always better.",
  },
  {
    title: "Looking back at speculative decoding",
    link: "https://research.google/blog/looking-back-at-speculative-decoding/",
    sourceName: "Google Research", authority: "primary",
    technicalTopics: ["Speculative decoding"],
    snippet: "Technical background, 2024. Ordinary autoregressive decoding generates one token per target-model step. Speculative decoding uses a cheaper draft model to propose several tokens; the target evaluates the proposals in parallel. Acceptance and corrective sampling preserve the target distribution under the described algorithm. This exploits spare compute in memory-bound inference. Benefit depends on proposal acceptance and drafting/verification overhead. Distinguish identical output distribution from identical text on every random run; faster inference does not mean a more accurate model.",
  },
  {
    title: "GraphRAG: New tool for complex data discovery now on GitHub",
    link: "https://www.microsoft.com/en-us/research/blog/graphrag-new-tool-for-complex-data-discovery-now-on-github/",
    sourceName: "Microsoft Research", authority: "primary",
    technicalTopics: ["GraphRAG community retrieval"],
    snippet: "Technical background, 2024. Microsoft's GraphRAG extracts entities and relationships from documents into a graph, identifies communities, and creates community summaries for questions spanning a corpus. Similarity retrieval of individual text chunks is the baseline. Community summaries help synthesize global themes that isolated chunks may miss. The tradeoff is upfront graph construction and summarization cost. Suitability depends on whether global queries justify that indexing work; it is not a universal replacement for vector retrieval, nor a guarantee of correctness.",
  },
  {
    title: "vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention",
    link: "https://vllm.ai/blog/2023-06-20-vllm",
    sourceName: "vLLM — UC Berkeley research team", authority: "primary",
    technicalTopics: ["PagedAttention and KV-cache allocation"],
    snippet: "Technical background, 2023. KV cache stores attention keys and values for token generation. Reserving contiguous memory for variable-length sequences can waste GPU memory. PagedAttention divides each sequence's cache into fixed-size blocks, maps logical to non-contiguous physical blocks through a block table, and allocates blocks on demand. Shared prompt blocks use reference counting and copy-on-write. Less fragmentation creates room to batch more sequences. This manages existing KV data rather than removing its growth with sequence length; partial final blocks still have unused space. Reported speedups depend on benchmark setup.",
  },
  {
    title: "Mixtral of Experts",
    link: "https://arxiv.org/abs/2401.04088",
    sourceName: "Mistral AI — original research paper (arXiv)", authority: "primary",
    technicalTopics: ["Sparse mixture-of-experts routing"],
    snippet: "Technical background, 2024. Mixtral replaces each layer's single feedforward block with multiple expert blocks. A learned router selects two experts per token at each layer, then combines their outputs; selections can change between tokens. Compared with a dense network activating all its feedforward weights, this separates total parameter capacity from active per-token computation. Inactive expert weights still belong to the model, so fewer active parameters does not imply an equally small storage footprint. Experts are neural sub-networks, not separate chatbot agents or guaranteed subject specialists.",
  },
  {
    title: "Effective context engineering for AI agents",
    link: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
    sourceName: "Anthropic Engineering", authority: "primary",
    technicalTopics: ["Agent context compaction and persistent memory"],
    snippet: "Technical background, 2025. Long agent runs exceed context windows and accumulate distracting tool outputs. Compaction summarizes important state before a fresh window; external structured notes preserve progress for later retrieval; subagents isolate exploration and return condensed findings. Unlike appending all past messages, this separates active context from persisted state. Aggressive compaction can discard details needed later. Just-in-time retrieval saves context but adds exploration latency. Persistent notes are not model weight updates. Teach the state write/read cycle and what can be lost, not a basic definition of an AI agent.",
  },
  {
    title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning",
    link: "https://arxiv.org/html/2501.12948v1",
    sourceName: "DeepSeek-AI — original research paper (arXiv)", authority: "primary",
    technicalTopics: ["Reinforcement learning with verifiable rewards"],
    snippet: "Technical background, 2025. DeepSeek-R1-Zero uses rule-based accuracy and format rewards in reinforcement learning, without preliminary supervised fine-tuning. Math answers can be checked against deterministic results; code can be checked with predefined tests. These rewards supply a training signal instead of human-written reasoning demonstrations. This relies on reliable checks: passing finite tests is not proof of general correctness, and subjective tasks require other evaluation signals. Distinguish R1-Zero from the full R1 pipeline, which also uses cold-start data and additional training stages. Explain verifiable feedback changing training, not the company's biography.",
  },
  {
    title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
    link: "https://arxiv.org/abs/2312.00752",
    sourceName: "Gu and Dao — original research paper (arXiv)", authority: "primary",
    technicalTopics: ["Selective state-space models"],
    snippet: "Technical background, revised 2024. Mamba makes state-space parameters depend on the current input, allowing information to be selectively retained or forgotten in a recurrent state. A hardware-aware parallel algorithm implements this recurrence. Compared with attention-based processing, the model avoids attention and scales linearly with sequence length in the reported architecture. Input-dependent selection prevents use of the efficient convolution approach used by earlier fixed-parameter state-space models. Linear scaling is a computational property, not proof that every retrieval or reasoning task improves. Keep performance claims tied to the evaluated tasks.",
  },
  {
    title: "Genie 2: A large-scale foundation world model",
    link: "https://deepmind.google/blog/genie-2-a-large-scale-foundation-world-model/",
    sourceName: "Google DeepMind", authority: "primary",
    technicalTopics: ["Action-conditioned latent world models"],
    snippet: "Technical background, 2024. Genie 2 encodes video frames into latent representations and uses an autoregressive latent diffusion dynamics model. It predicts subsequent frames conditioned on prior latent frames and user actions, producing an interactive environment rather than fixed video playback. Generated environments can support agent experiments. DeepMind reports a quality reduction for its real-time distilled version and identifies consistency and generality as ongoing research. Plausible generated physics is not a validated real-world simulator; do not imply guaranteed fidelity or production readiness.",
  },
  {
    title: "Effective harnesses for long-running agents",
    link: "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents",
    sourceName: "Anthropic Engineering", authority: "primary",
    technicalTopics: ["Cross-context agent state and verification"],
    snippet: "Technical background, 2025. Anthropic separates an initializer preparing the environment from coding sessions making incremental progress. A feature list, progress file and git history carry state across context resets; later sessions inspect state, test a selected feature, and leave a handoff. This addresses the failure of expecting a single prompt or window to finish a long project. End-to-end testing is needed because the agent can declare success prematurely. Written progress is evidence to verify against the actual application, not a guarantee that a feature works.",
  },
];

export const primarySourceNames = new Set([
  "McKinsey Insights", "MIT Sloan Management Review", "Knowledge at Wharton",
  "MIT News (AI)", "Harvard Gazette (Sci & Tech)", "OpenAI News", "Google DeepMind",
  "Google Research", "Microsoft Research",
]);
