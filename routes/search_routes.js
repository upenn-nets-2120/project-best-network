

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

//const PORT = config.serverPort;
/*
const db = dbsingleton;
db.get_db_connection();
const PORT = config.serverPort;
*/
let vectorStore = null;

var getVectorStore = async function(req) {
  if (vectorStore == null) {
    
      const embeddings = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY, // In Node.js defaults to process.env.OPENAI_API_KEY
        batchSize: 512, // Default value if omitted is 512. Max is 2048
        model: "text-embedding-3-small",
        request_timeout: 10000000000
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
    request_timeout: 100000000
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
  /*
  const model = new OpenAI({temperature: 0});
  
  const toolkit = new SqlToolKit(db, model);
  const executer = createSqlAgent(model, toolkit);
  const input2 = `Find the posts that are ${result}`;
  const result2 = await executer.invoke({input2});
  */
  res.status(200).json({message:result});
}

var routes = { 
get_post: getPost
};
  
  module.exports = routes;

