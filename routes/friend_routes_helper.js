const { ChromaClient } = require("chromadb");
const {OpenAIEmbeddingFunction} = require('chromadb');

async function uploadEmbeddingsForPost(content, author_id, post_id, title) {
    let embedder = new OpenAIEmbeddingFunction({
        openai_api_key: "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",
        model: "text-embedding-3-small"
    })
    console.log("The model is:", embedder.model);
    try {
      // Connect to Chroma collection
        const client = new ChromaClient();
        const collection = await client.getOrCreateCollection({
            name: "posts_new",
            embeddingFunction: embedder,
            metadata: { "hnsw:space": "l2" },
        });
        // Concatenate all hashtags into a single string

        // Add embedding data to the collection
        const res = await collection.add({ 
            ids: [`${post_id}`],
            metadatas: [{ source: `title: ${title} from author: ${author_id}` }],
            documents: [content] 
        });
        if (res === true) {
            console.log("Added embeddings to collection.");
            return { success: true };
        } else {
            console.error(res.error);
            return { success: false };
        }
    } catch (error) {
      console.error("Error processing embeddings:", error);
      return { error: 'Error processing embeddings.' };
    }
  }

module.exports = {
    uploadEmbeddingsForPost
};