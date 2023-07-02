/*
    Pioneer AI client

    Make AI calls to Pioneer server
 */

const TAG = " | pioneer-ai-client | "
// import { BabyAGI } from "langchain/experimental/babyagi";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
// import { OpenAIEmbeddings } from "langchain/embeddings/openai";
// import { OpenAI } from "langchain/llms/openai";
// import { PromptTemplate } from "langchain/prompts";
// import { LLMChain } from "langchain/chains";
// import { ChainTool, SerpAPI, Tool } from "langchain/tools";
// import { initializeAgentExecutorWithOptions } from "langchain/agents";
// @ts-ignore
import { OpenAI } from "langchain/llms/openai";
// @ts-ignore
import { DynamicTool, DynamicToolInput, CallbackManagerForToolRun } from "langchain/tools";
// @ts-ignore
import { ChatOpenAI } from "langchain/chat_models/openai";
// @ts-ignore
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import {
    RequestsGetTool,
    RequestsPostTool,
    AIPluginTool,
    // @ts-ignore
} from "langchain/tools";

const log = require('@pioneer-platform/loggerdog')()
let pioneerApi = require("@pioneer-platform/pioneer-client")

// process.env['URL_PIONEER_SPEC'] = "https://pioneers.dev/spec/swagger.json"
process.env['URL_PIONEER_SPEC'] = "http://127.0.0.1:9001/spec/swagger.json"
let spec = process.env['URL_PIONEER_SPEC']

let model = new OpenAI({
    // modelName: "gpt-4-0613",
    temperature: 0
});
let executor:any

module.exports = {
    init:function(app:any){
        return init_sdk(app)
    },
    //Task Queue
    query:function(input:string){
        return run_query(input)
    }
}

let init_sdk = async function(app:any){
    let tag = TAG + " | init_sdk | "
    try{
        //tools
        let tools:any = []

        //synced
        // tools.push(new DynamicTool({
        //     name: "getIsSynced",
        //     // @ts-ignore
        //     description: "Determining if the user is synced. an unsynced user might have inaccurate data",
        //     func: async () =>
        //         new Promise(async (resolve) => {
        //             try{
        //                 resolve(app.isSynced);
        //             }catch(e){
        //                 resolve("no information here, try another query");
        //             }
        //         }),
        // }))

        //
        // //isPaired
        // tools.push(new DynamicTool({
        //     name: "getIsPaired",
        //     // @ts-ignore
        //     description: "Determining if the user is paired with wallets",
        //     func: async () =>
        //         new Promise(async (resolve) => {
        //             try{
        //                 resolve(app.isPaired);
        //             }catch(e){
        //                 resolve("no information here, try another query");
        //             }
        //         }),
        // }))

        const myFunction = async (input: string, runManager?: CallbackManagerForToolRun) => {
            // Your custom code here
            log.info("input: ",input)
            let pubkey = app.pubkeys.filter((e:any) => e.symbol === input)
            log.info("pubkey: ",pubkey)
            log.info("pubkey: ",pubkey[0])
            return JSON.stringify(pubkey[0]);
        };

        const myTool: DynamicToolInput = {
            name: "getAddress",
            description: "this function intakes a symbol and returns and address",
            func: myFunction,
        };

        tools.push(new DynamicTool(myTool));

        //get pubkeys
        // tools.push(new DynamicTool({
        //     name: "getPubkey",
        //     // @ts-ignore
        //     description: "This function required a asset. {ASSET} an asset is a blockchain. (BTC) is an example, so is LTC, DOGE, ETH. pubkeys are addresses and xpubs. they have paths and belong to wallets. differnt pubkeys belong to differnt chains",
        //     func: async () =>
        //         new Promise(async (resolve) => {
        //             try{
        //                 let ASSET = "ETH"
        //                 let pubkey = app.pubkeys.filter((e:any) => e.symbol === ASSET)
        //                 resolve(JSON.stringify(pubkey));
        //             }catch(e){
        //                 resolve("no information here, try another query");
        //             }
        //         }),
        // }))

        //transfer

        //swap

        //lp

        //init
        executor = await initializeAgentExecutorWithOptions(tools, model, {
            agentType: "zero-shot-react-description",
            verbose: true
        });

        return true
    }catch(e){
        log.error(e)
    }
}

let run_query = async function(input:string){
    let tag = TAG + " | run_query | "
    try{
        const result = await executor.call({ input });
        return result
    }catch(e){
        log.error(e)
    }
}
