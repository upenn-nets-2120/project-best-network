

const { OpenAI, ChatOpenAI } = require("@langchain/openai");

const { PromptTemplate } = require("@langchain/core/prompts");

const { StringOutputParser } = require("@langchain/core/output_parsers");


const { OpenAIEmbeddings } = require("@langchain/openai");

const { formatDocumentsAsString } = require("langchain/util/document");

const {
    RunnableSequence,
    RunnablePassthrough,
  } = require("@langchain/core/runnables");

const { Chroma } = require("@langchain/community/vectorstores/chroma");

let vectorStore = null;

var getVectorStore = async function(req) {
  if (vectorStore == null) {
    
      const embeddings = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY, // In Node.js defaults to process.env.OPENAI_API_KEY
        batchSize: 512, // Default value if omitted is 512. Max is 2048
        model: "text-embedding-3-small",
        request_timeout: 10000
      });
      
      vectorStore = await Chroma.fromExistingCollection(embeddings, {
          collectionName: "posts_new",
          url: "http://localhost:8000", // Optional, will default to this value
          });
          
  }
  return vectorStore;
  //return null
}

var getPost = async function(req, res) {
  const vs = await getVectorStore();
  const retriever = vs.asRetriever();
  const { input } = req.body;
  console.log(process.env.OPENAI_API_KEY)
  const prompt = PromptTemplate.fromTemplate(`Answer the question based only on the following context:
  {context} Question: {question}`);
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo",
    request_timeout: 10000
  });
  const ragChain = RunnableSequence.from([
      {
          context: retriever.pipe(formatDocumentsAsString),
          question: new RunnablePassthrough(),
        },
    prompt,
    llm,
    new StringOutputParser(),
  ]);
  result = await ragChain.invoke(input);
  console.log(result);
  res.status(200).json({message:result});
}

var routes = { 
get_post: getPost
};
  
  module.exports = routes;

