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
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
//@ts-ignore
import {query} from "@pioneer-platform/langchain";
const short = require('short-uuid');
const log = require('@pioneer-platform/loggerdog')()
let wait = require('wait-promise');
let ai = require('@pioneer-platform/pioneer-intelligence')
let OPENAI_API_KEY = process.env['OPENAI_API_KEY']
if(!OPENAI_API_KEY) throw Error("OPENAI_API_KEY key required!")
ai.init(OPENAI_API_KEY)
let sleep = wait.sleep;


import {
    StructuredOutputParser,
    RegexParser,
    CombiningOutputParser,
} from "langchain/output_parsers";
const model = new OpenAI({ temperature: 0.9 });
const memory = new BufferMemory({ memoryKey: "chat_history" });

const template = `The following is a conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.
      Current conversation:
      {chat_history}
      Human: {input}
      AI:`;

//Instantiate "PromptTemplate" passing the prompt template string initialized above
const prompt = PromptTemplate.fromTemplate(template);
const chainPrompt = new LLMChain({ llm: model, prompt, memory });
let chainCode:any
let docs:any
export async function init(): Promise<void> {
    const tag = TAG + " | init | "
    try{
        console.log("init: ")
        //load the modal
        let files = fs.readdirSync("./data/");
        let ALL_MEMORY = []
        for(let i = 0; i < files.length; i++){
            console.log("filename: ",files[i])
            //Load in the file containing the content on which we will be performing Q&A
            //The answers to the questions are contained in this file
            const text = fs.readFileSync("./data/"+files[i], "utf8");
            ALL_MEMORY.push(text)
        }

        //console.log("text: ",text)
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 2000 });
        //Create documents from the split text as required by subsequent calls
        docs = await textSplitter.createDocuments(ALL_MEMORY);
        const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());

        //Create the LangChain.js chain consting of the LLM and the vector store
        chainCode = VectorDBQAChain.fromLLM(model, vectorStore);
        // const queryChain = VectorDBQAChain.fromLLM(model, vectorStore);
        // console.log("chain: ",queryChain)

        //if not, create it
        log.info("loaded ",files)

    }catch(e){
        console.error(e)
    }
}

export async function autonomous(): Promise<any> {
    const tag = TAG + " | autonomous | "
    try{
        //get issues
        // let issues = await perform_skill("./skills/get-open-issues.sh",{})
        // log.info(tag,"issues: ",issues)
        //
        // // Extract and clean content
        // let cleanedIssues = issues.map(issue => {
        //     let content = issue.content;
        //     // Remove everything before the first '+' character
        //     let plusIndex = content.indexOf('+');
        //     if(plusIndex >= 0) {
        //         // If '+' character found in content string
        //         content = content.substring(plusIndex + 1);
        //     }
        //     return content;
        // });
        // log.info("cleanedIssues: ",cleanedIssues)
        let prompt = "You a coder bot. The github project has a list of issues. the issue you are solving is titled: Missing README.md  the ticket says to:  map the projects CLI commands, give examples for each. explain what the code* function is doing. add the following image https://cdn-images-1.medium.com/v2/resize:fit:800/1*OSuGUiCB4zyp9oG0ONkGjw.png at the top of the README.md file.  "
        //create task from issue
        // issues = JSON.stringify(issues)
        // issues.replace()
        let task = await ai.buildTask(prompt)
        log.info(tag,"task: ",task)

        //load repo into memory

        //perform task

        //perform steps

        //return result

        return
    }catch(e){
        console.error(e);
        throw e;
    }
}

export async function create_skill(skill: any, inputs:any, outputs:any, context:any): Promise<any> {
    const tag = TAG + " | handle_input | "
    try{
        log.info(tag,"skill: ",skill)
        log.info(tag,"inputs: ",inputs)
        log.info(tag,"outputs: ",outputs)

        let result = await ai.buildScript(skill, inputs, outputs, context)
        log.info(tag,"result: ",result)

        //write the skill to file
        const path = require('path');
        const fs = require('fs');
        //@ts-ignore
        const newFilePath = path.join(__dirname, '..', 'skills', `${result.scriptName}_untested.sh`);
        log.info(tag,"newFilePath: ",newFilePath)
        fs.writeFileSync(newFilePath, result.script, 'utf8');

        //execute the skill

        //return the result

        return result
    }catch(e){
        console.error(e);
        throw e;
    }
}

export async function fix_skill(skill: string, issue:any, context:any): Promise<any> {
    const tag = TAG + " | handle_input | ";
    let script = '', scriptWorking = '';
    try{
        log.info(tag,"skill: ",skill);
        log.info(tag,"context: ",context);
        log.info(tag,"issue: ",issue);

        try {
            script = fs.readFileSync(path.join(__dirname, '..', 'skills', `${skill}`), 'utf8');
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                log.warn(tag, `File not found, but continuing: ${error.message}`);
            } else {
                throw error;
            }
        }

        if (skill.includes('_untested')) {
            let skillWorking = skill.replace('_untested', '');
            log.info(tag,"skillWorking1: ",skillWorking);
            skillWorking = skillWorking.replace(/_v\d+(?=.sh$)/, '');
            log.info(tag,"skillWorking2: ",skillWorking);
            const scriptPath = path.join(__dirname, '..', 'skills', `${skillWorking}`);
            log.info(tag,"scriptPath: ",scriptPath);

            try {
                scriptWorking = fs.readFileSync(scriptPath, 'utf8');
                context = {
                    skill: skillWorking,
                    working: true,
                    script: scriptWorking
                };
            } catch (error: any) {
                if (error.code === 'ENOENT') {
                    log.warn(tag, `Error reading script, file not found but continuing: ${error.message}`);
                    context = {
                        skill: skillWorking,
                        working: false,
                        script: null
                    };
                } else {
                    throw error;
                }
            }
        }
        log.info(tag,"context: ",context);
        let result = await ai.fixScript(script, issue, context);
        log.info(tag,"result: ",result);
        log.info(tag,"result type: ",typeof(result));

        if(!result.script) throw Error("Invalid result! Missing script");

        skill = skill.replace(".sh","");

        const versionMatch = skill.match(/_v(\d+)/);
        let versionNumber = 1;
        if (versionMatch) {
            versionNumber = parseInt(versionMatch[1]) + 1;
            skill = skill.replace(/_v\d+/, `_v${versionNumber}`);
        } else {
            skill += `_v${versionNumber}`;
        }

        skill = skill.replace(/_untested/, '');
        skill += "_untested";

        const newFilePath = path.join(__dirname,'..', 'skills', `${skill}.sh`);
        fs.writeFileSync(newFilePath, result.script, 'utf8');
        result.skillName = `${skill}.sh`;
        return result;
    }catch(e: any){
        log.error(tag, 'Error in fix_skill: ', e.message);
        throw e;
    }
}



export async function perform_skill(skill: any, inputs: any) {
    let tag = TAG + " | perform_skill | ";
    try {
        let messages = [];
        let cmd = "bash "+skill;
        log.info(tag, "cmd: ", cmd);
        try {
            const TIMEOUT_MS = 60000; // 60 seconds

            const startTime = Date.now();
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > TIMEOUT_MS) {
                throw new Error("Timeout: Script took too long to execute.");
            }

            let {stdout, stderr } = await util.promisify(exec)(cmd);
            log.info(tag, "stdout: ", stdout);
            log.info(tag, "stderr: ", stderr);

            if(stdout && stdout.length > 0 && stdout !== "null\\n"){
                log.info(tag, "Valid Execution: ", stdout);

                // Attempt to parse stdout as JSON
                let stdoutData;
                try {
                    stdoutData = JSON.parse(stdout);
                    stdout = JSON.stringify(stdoutData, null, 2); // Prettify JSON if possible
                } catch (err) {
                    // If stdout is not JSON, treat it as plain text
                }

                messages.push({
                    role: "assistant",
                    content: stdout
                });
            } else if(stderr){
                messages.push({
                    role: "user",
                    content: "That errored: error: " + stderr
                });
            } else if(stdout == "null\\n") {
                messages.push({
                    role: "user",
                    content: "That returned null, you should add error handling to the script"
                });
            } else {
                messages.push({
                    role: "user",
                    content: "Something is wrong, not getting any good output"
                });
            }
        } catch(e){
            log.error(tag,"error: ",e);
            messages.push({
                role: "user",
                content: "Error: "+ e?.toString()
            });
        }

        return messages;
    } catch(e) {
        console.error(e);
        throw e;
    }
}

export async function handle_input(message: any): Promise<void> {
    const tag = TAG + " | handle_input | "
    try{
        log.info("message: ",message)

        // query
        // let res = await query(message)
        // log.info("res =: ",res)

        //
        // const res = await chainCode.call({
        //     input_documents: docs,
        //     query: message,
        // });

        const res1 = await chainPrompt.call({ input: message });
        log.info("res1: ",res1)

        //text
        return res1.text
    }catch(e){
        console.error(e)
    }
}
