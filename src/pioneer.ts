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
const chain = new LLMChain({ llm: model, prompt, memory });

export async function fix_skill(skill: string, issue:any, context:any): Promise<any> {
    const tag = TAG + " | handle_input | "
    try{
        log.info(tag,"skill: ",skill)
        log.info(tag,"context: ",context)
        log.info(tag,"issue: ",issue)
        //skill is a string representing the skill to be performed and its path to the bash script
        //issue is the problem having with the skill

        //read the skill from file, its a bash script that will be executed
        //prmpt the AI to fix the skill
        //prompt the AI the issue verbalized by the user
        //add any extra info in the conext
        //the AI will return a string of code to fix the skill
        //parse the bash script from the result
        //wite the bash script to file with a new version number in the name of the wile. aka skill_v1.sh

        // Resolve the relative path to an absolute path

        const script = fs.readFileSync(skill, 'utf8');
        // log.info("script: ",script)
        // Prompt the AI with the issue and context
        // const prompt = `Please fix the following bash script:\n\n${script}\n\nIssue: ${issue}\n\nContext: ${context}`;
        //
        // // Call the AI model
        // const model = new OpenAI({ temperature: .9 });
        // const response = await model.call(prompt);
        //
        // // Parse the bash script from the result
        // //@ts-ignore
        // let result = response.choices[0].text.trim();
        //
        // // Write the updated script to a new file with a version number appended to the name
        // const newFilePath = path.join(__dirname, `${skill}_v1.sh`);
        // fs.writeFileSync(newFilePath, result, 'utf8');
        //
        // log.info("result: ", result)
        // return result;

        const answerParser = StructuredOutputParser.fromNamesAndDescriptions({
            answer: "fix the bash script for the given issue",
            source: "source used to answer the user's bash script.",
        });

        const confidenceParser = new RegexParser(
            /Confidence: (.*), Explanation: (.*)/,
            ["confidence", "explanation"],
            "noConfidence"
        );

        const parser = new CombiningOutputParser(answerParser, confidenceParser);

        const formatInstructions = parser.getFormatInstructions();

        const prompt = new PromptTemplate({
            template: "fix the bash script for the given issue.\n{script}\n{issue}\n{context}",
            inputVariables: ["script","issue","context"],
            partialVariables: { format_instructions: formatInstructions },
        });
        log.info(tag,"prompt: ",prompt)

        const model = new OpenAI({ temperature: .9 });

        const input = await prompt.format({
            script, issue, context
        });
        log.info(tag,"input: ",input)

        // const response = await model.call(input);
        // let result = await parser.parse(response);
        // log.info("result: ", result);

        // const answerParser = StructuredOutputParser.fromNamesAndDescriptions({
        //     answer: "fix the bash script for the given issue",
        //     source: "source used to answer the user's bash script.",
        // });
        // const confidenceParser = new RegexParser(
        //     /Confidence: (A|B|C), Explanation: (.*)/,
        //     ["confidence", "explanation"],
        //     "noConfidence"
        // );
        // const parser = new CombiningOutputParser(answerParser, confidenceParser);
        // const formatInstructions = parser.getFormatInstructions();
        //
        // const prompt = new PromptTemplate({
        //     template:
        //         "fix the bash script for the given issue.\n{script}\n{description}",
        //     inputVariables: ["script","issue","context"],
        //     partialVariables: { format_instructions: formatInstructions },
        // });
        // const model = new OpenAI({ temperature: .9 });
        // const input = await prompt.format({
        //     script,issue,context
        // });
        // const response = await model.call(input);
        // let result = await parser.parse(response)
        // log.info("result: ", result)
        // return result
    }catch(e){
        console.error(e);
        throw e;
    }
}

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
