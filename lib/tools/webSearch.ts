import { z } from "zod";

// Tavily API için web search tool
export const webSearchTool = {
  description: "Web'de güncel müzik bilgileri, şarkı listeleri, popüler şarkılar ve müzik trendleri araştırır. Billboard, Spotify Charts, YouTube Trending, Türkiye müzik listeleri gibi güncel kaynaklardan bilgi çeker.",
  parameters: z.object({
    query: z.string().describe("Arama sorgusu. Örnek: '2025 popüler Türkçe şarkılar', 'Spotify Türkiye top 50', 'Billboard hot 100 2024'"),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return {
          results: [],
          answer: "",
          error: "TAVILY_API_KEY environment variable is not set. Please add it to your .env file.",
        };
      }

      const requestBody = {
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: true,
        include_raw_content: false,
        max_results: 5,
      };

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        results: data.results || [],
        answer: data.answer || "",
      };
    } catch (error: any) {
      return {
        results: [],
        error: error.message || "Web search failed",
      };
    }
  },
};

