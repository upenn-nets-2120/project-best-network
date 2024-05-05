const { ChromaClient } = require("chromadb");
const {OpenAIEmbeddingFunction} = require('chromadb');

async function uploadEmbeddingsForPost(hashtags, author_id, post_id) {
    let embedder = new OpenAIEmbeddingFunction({
        openai_api_key: "sk-proj-sZ53UsKU4SJaL42d76pMT3BlbkFJ6Jc9TJiW8KCiM7oIgNm6",
        model: "text-embedding-3-large"
    })
    console.log("The model is:", embedder.model);

    if (!hashtags || hashtags.length === 0) {
      return { error: 'No hashtags provided.' };
    }  
    try {
      // Connect to Chroma collection
        const client = new ChromaClient();
        const collection = await client.getOrCreateCollection({
            name: "posts_new",
            embeddingFunction: embedder,
            metadata: { "hnsw:space": "l2" },
        });
        // Concatenate all hashtags into a single string
        const concatenatedHashtags = hashtags.join(' ');

        // Add embedding data to the collection
        const res = await collection.add({ 
            ids: [`${post_id}`],
            metadatas: [{ source: `from author: ${author_id}` }],
            documents: [concatenatedHashtags] 
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