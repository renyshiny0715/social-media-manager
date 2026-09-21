import type { FeedItem } from "../lib/types";

// Source-backed foundational material for quiet news weeks. These are explicitly
// labelled background references, never described as new launches or trending news.
export const explainerReferences: FeedItem[] = [
  {
    title: "What is the Model Context Protocol (MCP)?",
    link: "https://modelcontextprotocol.io/docs/getting-started/intro",
    sourceName: "Model Context Protocol — official documentation",
    authority: "primary",
    snippet: "Background explainer: MCP is an open standard for connecting AI applications to external systems. It provides a shared interface to data sources, tools and workflows. Think of a common connector: it helps integration, but does not itself guarantee safe permissions or correct actions.",
  },
  {
    title: "What is retrieval augmented generation (RAG)?",
    link: "https://www.ibm.com/think/topics/retrieval-augmented-generation",
    sourceName: "IBM Think",
    authority: "primary",
    snippet: "Background explainer: RAG retrieves relevant information from a knowledge base and supplies it as context for a language model's response. An open-book exam is a useful analogy. It can ground answers in enterprise documents, but bad retrieval and outdated documents can still produce unreliable answers.",
  },
  {
    title: "Building effective agents",
    link: "https://www.anthropic.com/engineering/building-effective-agents",
    sourceName: "Anthropic Engineering",
    authority: "primary",
    snippet: "Background explainer: Workflows follow predefined code paths; agents let language models direct their own processes and tool use. Start with simple approaches and add complexity when needed. Agents can handle open-ended tasks, but autonomy introduces extra cost, latency and error risks. Human checkpoints and testing matter.",
  },
  {
    title: "What is a digital twin?",
    link: "https://www.nvidia.com/en-us/glossary/digital-twin/",
    sourceName: "NVIDIA — official glossary",
    authority: "primary",
    snippet: "Background explainer: A digital twin is a virtual representation of a physical object, process or system, connected to real-world data. It can support simulation and monitoring, for example testing factory changes virtually before changing equipment. Its usefulness depends on the fidelity of the model and input data.",
  },
];

export const primarySourceNames = new Set([
  "McKinsey Insights", "MIT Sloan Management Review", "Knowledge at Wharton",
  "MIT News (AI)", "Harvard Gazette (Sci & Tech)", "OpenAI News", "Google DeepMind",
]);
