import util from "util";

let TAG = " app "
import { OpenAI } from "langchain/llms/openai";
import { VectorDBQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {exec, execSync} from 'child_process';
import * as path from 'path';
import fs from "fs"; // for path normalization
const short = require('short-uuid');
const log = require('@pioneer-platform/loggerdog')()
let wait = require('wait-promise');
let sleep = wait.sleep;
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
const model = new OpenAI({ temperature: 0.9 });
const memory = new BufferMemory({ memoryKey: "chat_history" });

const template = `The following is a conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.
      Current conversation:
      {chat_history}
      Human: {input}
      AI:`;

//Instantiate "PromptTemplate" passing the prompt template string initialized above
const prompt = PromptTemplate.fromTemplate(template);
const chain = new LLMChain({ llm: model, prompt, memory });

export async function perform_skill(skill: any, inputs: any) {
    let tag = TAG + " | perform_skill | "
    try {
        //write script to file
        let messages = []
        let cmd = "sh "+skill;
        log.info(tag, "cmd: ", cmd)
        try {
            const TIMEOUT_MS = 60000; // 60 seconds

            const startTime = Date.now();
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > TIMEOUT_MS) {
                throw new Error("Timeout: Script took too long to execute.");
            }

            let {stdout, stderr } = await util.promisify(exec)(cmd);
            log.info(tag, "stdout: ", stdout)
            log.info(tag, "stderr: ", stderr)

            if(stdout && stdout.length > 0 && stdout !== "null\\n"){
                log.info(tag, "Valid Execution: ", stdout)
                messages.push({
                    role: "assistant",
                    content: stdout
                })
            } else if(stderr){
                messages.push({
                    role: "user",
                    content: "that errored: error: " + stderr
                })
            } else if(stdout == "null\\n") {
                messages.push({
                    role: "user",
                    content: "that returned null, you should add error handling to the script"
                })
            } else {
                messages.push({
                    role: "user",
                    content: "something is wrong, not getting any good output"
                })
            }
        } catch(e){
            log.error(tag,"error: ",e)
            messages.push({
                role: "user",
                content: "error: ",e
            })
        }



        return messages
    } catch(e) {
        console.error(e);
        throw e;
    }
}

export async function init(message: any): Promise<void> {
    const tag = TAG + " | handle_input | "
    try{
        log.info("message: ",message)
        const res1 = await chain.call({ input: "Hi! I'm Morpheus." });
        log.info("bot: ",res1)
    }catch(e){
        console.error(e)
    }
}

export async function handle_input(message: any): Promise<void> {
    const tag = TAG + " | handle_input | "
    try{
        log.info("message: ",message)

        const res1 = await chain.call({ input: message });
        log.info("res1: ",res1)

        //text
        return res1.text
    }catch(e){
        console.error(e)
    }
}
