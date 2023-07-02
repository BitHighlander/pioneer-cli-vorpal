#!/usr/bin/env node
import * as dotenv from "dotenv";
dotenv.config()
dotenv.config({path:'../../.env'})
//cli tools
import {fix_skill, handle_input, perform_skill, create_skill, autonomous, init} from "./engine";
import {publish} from "./skills";
import { onStartPioneer } from "./pioneer";
let ai = require("./ai-controller")
// import inquirer from 'inquirer';
// const fsAutocomplete = require('vorpal-autocomplete-fs');

import util from "util";
import {showWelcome} from './ascii';
// import chalk from "chalk";
const vorpal = require('vorpal')();
const log = require('@pioneer-platform/loggerdog')()
const fs = require('fs-extra');
const path = require('path');
// const inquirer = require("inquirer");
// const chalk = require("chalk");
// const figlet = require("figlet");
//globals
let currentDirectory = process.cwd();
let fileList: string[] = [];
let skills:any = []
let refreshSkills = async function(){
    try{
        //skills
        skills = await fs.readdir("./skills")
        fileList = fs.readdirSync(currentDirectory);
        //log.info("skills: ",skills)
        return
    }catch(e){
        log.error(e)
    }
}

let onStart = async function(){
    try{
        await refreshSkills()

        //start wallet
        //welcome

        //initial setup
        //is github token set?
        //is openAi token set?

        //commands
        vorpal
            .command('skills', 'Outputs "loaded skills".')
            .action(function(args:any, callback:any) {
                //TODO verbose
                log.info("skills: ",skills)
                callback();
            })
            .autocomplete(skills);

        vorpal
            .command('autonomous', '')
            .action(function(args:any, callback:any) {
                //autonomous
                autonomous()
                callback()
            })
            .autocomplete(skills);

        vorpal
            .command('publish <filename>', 'publish a skill as working and ready')
            .action(function(args:any, callback:any) {

            })
            .autocomplete(skills);

        vorpal
            .command('create', 'create a skill.')
            .action(async function(args:any, callback:any) {
                let tag = " | create | "
                try{
                    //@ts-ignore
                    this.prompt([
                        {
                            type: 'input',
                            name: 'skill',
                            message: 'describe the skill:'
                        },
                        {
                            type: 'input',
                            name: 'input',
                            message: 'describe the inputs to the skill (or leave empty):'
                        },
                        {
                            type: 'input',
                            name: 'output',
                            message: 'describe the outputs of the skill(or leave empty): '
                        },
                        {
                            type: 'input',
                            name: 'context',
                            message: 'describe any extra context needed for the skill '
                        }
                    ], async (results: { skill: any; input: any; output: any; context:any }) => {
                        console.log('Your skill is: ', results.skill);
                        console.log('Your input is: ', results.input);
                        console.log('Your output is: ', results.output);
                        console.log('Your context is: ', results.context);
                        let resultCreate = await create_skill(results.skill,results.input,results.output,results.context)
                        console.log('resultCreate: ', resultCreate);
                        callback();
                    });
                }catch(e){
                    console.log(e)
                }
            })
            .autocomplete(skills);

        // vorpal
        //     .command('run <filename>', 'Perform a skill.')
        //     .action(async function(args:any, callback:any) {
        //         let tag = " | run | "
        //         try{
        //             // Respond to the input here
        //             const filename = args.filename;
        //             //@ts-ignore
        //             const scriptPath = path.join(__dirname, '..', 'skills', `${filename}`);
        //             log.info(tag,"scriptPath: ",scriptPath)
        //             //TODO - check if file exists
        //             //TODO - read bash file and determine inputs needed
        //             //TODO - inquire about inputs
        //             let result = await perform_skill(scriptPath,[])
        //             log.info(tag,"result: ",result)
        //             callback();
        //         }catch(e){
        //             console.log(e)
        //         }
        //     })
        //     .autocomplete(skills);

        // vorpal
        //     .command('fix <filename>', 'fix a skill.')
        //     .option('-issue, --issue <key>', 'Specifies the API key')
        //     .action(async function(args: any, callback: () => void) {
        //         //@ts-ignore
        //         let resultFix = await fix_skill("./skills/"+args.filename,args.options.issue,"")
        //         console.log('resultFix: ', resultFix);
        //         callback();
        //     })
        //     .autocomplete(skills);

        async function mark_file_broke(filepath: string) {
            //@ts-ignore
            let directory = path.dirname(filepath);
            //@ts-ignore
            let filename = path.basename(filepath);
            //@ts-ignore
            let brokenPath = path.join(directory, 'broken_' + filename);

            fs.rename(filepath, brokenPath, function(err:any) {
                if (err) throw err;
                console.log('File is marked as broken!');
            });
        }

        function increment_filename(filename: string): string {
            let parts = filename.split('_');
            let lastPart = parts.pop();
            let versionRegex = /v(\d+)/;
            //@ts-ignore
            let versionMatch = versionRegex.exec(lastPart);

            if (versionMatch) {
                let versionNumber = parseInt(versionMatch[1]);
                versionNumber++;  // Increment version number

                // Replace old version number with incremented version number
                //@ts-ignore
                let newLastPart = lastPart.replace(versionRegex, 'v' + versionNumber);

                parts.push(newLastPart);
                return parts.join('_');
            } else {
                console.error('Unable to parse filename version: ' + filename);
                return filename;
            }
        }

        // Support function for recursive prompts
        async function runSkillLoop(this: any, args: any, callback: () => void) {
            //@ts-ignore
            let scriptPath = path.join(__dirname, '..', 'skills', `${args.filename}`);

            // Running skill and collecting result
            let result = await perform_skill(scriptPath,[])

            console.log('result: ', result);
            console.log('result: ', JSON.stringify(result));

            // Prompt for user feedback on output
            const resultChoice = await this.prompt([
                {
                    type: 'list',
                    name: 'choice',
                    message: 'is this output suffecient? ',
                    choices: ['correct', 'improve (fixme)']
                }
            ]);

            console.log('Your choice is: ', resultChoice.choice);
            if(resultChoice.choice == "correct"){
                log.info("Running skill successful");
                publish(scriptPath)
                callback();
            } else {
                log.info("Skill run unsuccessful, marking file as broke");
                // // Logic for marking file as broke
                // // You need to implement 'mark_file_broke' function
                // await mark_file_broke(scriptPath);

                const results = await this.prompt([
                    {
                        type: 'input',
                        name: 'issue',
                        message: 'describe the issue: '
                    },
                    {
                        type: 'input',
                        name: 'context',
                        message: '(output already included) provide context or extra info: '
                    }
                ]);

                console.log('Your context is: ', results.context);
                console.log('Your issue is: ', results.issue);
                results.context = "script output was: "+ JSON.stringify(result) +" user included content is: " + results.context
                let resultFix = await fix_skill(args.filename,results.issue,results.context)
                console.log('resultFix: ', resultFix);

                // Change filename for next iteration
                args.filename = resultFix.skillName; // You need to implement 'increment_filename' function
                log.info("===========================================")
                log.info("CREATED NEW SKILL: ",args.filename)
                log.info("===========================================")
                refreshSkills()
                log.info("skills: ",skills)
                await runSkillLoop.call(this, args, callback);  // Use .call() here
            }
        }

        // Run command definition
        vorpal
            .command('run <filename>', 'Perform a skill.')
            .action(async function(args: any, callback: () => void) {
                //@ts-ignore
                await runSkillLoop.call(this, args, callback);  // Use .call() here
            })
            .autocomplete(skills);


        vorpal
            .command('ls', 'list a directory.')
            .action(function(args: any, callback: () => void) {
                let tag = " | run | "
                try{
                    fs.readdir(currentDirectory, (err: any, files: any[]) => {
                        if (err) {
                            console.log(tag, 'Error reading directory:', err);
                        } else {
                            console.log(files.join('\n'));
                            fileList = files; // Update fileList after listing the directory
                        }
                        callback();
                    });
                }catch(e){
                    console.log(e);
                }
            });

        vorpal
            .command('cd <path>', 'change directory.')
            .autocomplete({
                data: () => {
                    return fileList;
                }
            })
            .action(function(args: { path: any; }, callback: () => void) {
                let tag = " | run | "
                try{
                    let newDirectory = path.resolve(currentDirectory, args.path);
                    if (fs.existsSync(newDirectory)) {
                        currentDirectory = newDirectory;
                        console.log(`Changed directory to ${newDirectory}`);
                        refreshSkills(); // Update fileList after changing the directory
                    } else {
                        console.log(`${tag} Invalid directory: ${newDirectory}`);
                    }
                    callback();
                }catch(e){
                    console.log(e);
                }
            });

        //catchall
        vorpal
            .catch('[input...]', 'Responds to all inputs.')
            .action(async function(args:any, callback:any) {
                const input = args.input.join(' ');
                let result = await handle_input(input);
                log.info("result: ",result)
                log.info("result(string): ",JSON.stringify(result))
                // Respond to the input here
                // @ts-ignore
                // this.log('You entered:', input);
                callback();
            });


        //https://pbs.twimg.com/profile_images/1422284737993969668/9HtSLXCm_400x400.jpg

        log.info(
            "\n",
            "Pioneer-cli"
        );
        log.info(
            "\n        ,    .  ,   .           .\n" +
            "    *  / \\_ *  / \\_      " +
            ".-." +
            "  *       *   /\\'__        *\n" +
            "      /    \\  /    \\,   " +
            "( ₿ )" +
            "     .    _/  /  \\  *'.\n" +
            " .   /\\/\\  /\\/ :' __ \\_  " +
            " - " +
            "          _^/  ^/    `--.\n" +
            "    /    \\/  \\  _/  \\-'\\      *    /.' ^_   \\_   .'\\  *\n" +
            "  /\\  .-   `. \\/     \\ /==~=-=~=-=-;.  _/ \\ -. `_/   \\\n" +
            " /  `-.__ ^   / .-'.--\\ =-=~_=-=~=^/  _ `--./ .-'  `-\n" +
            "/        `.  / /       `.~-^=-=~=^=.-'      '-._ `._"
        );
        log.info(
            " \n A simple Multi-Coin Wallet and explorer CLI      \n \n                        ---Highlander \n "
        );

        vorpal
            .delimiter('pioneer:')
            .show();
    }catch(e){
        log.error(e)
    }
}

//test mode
let onTest = async function(){
    try{
        let pioneer = await onStartPioneer()
        log.info("pioneer: ", pioneer)
        await ai.init(pioneer)

        // let filename = 'get-open-issues_v2_untested.sh'
        // let issue = "the output does not contain the issue at all now"
        //
        // let context = "It outputted this: [  {    role: 'assistant',    content: 'Fetching open issues for repository BitHighlander/pioneer-cli-vorpal\\n' +      'Open issues:\\n' +      'Missing README.md  open  https://github.com/BitHighlander/pioneer-cli-vorpal/issues/1\\n' +      '\\n' +      'Extra context:\\n' +      '404: Not Found\\n'  }] get-open-issues.sh works but output is not formatted correctly"
        // let resultFix = await fix_skill(filename,issue,context)
        // console.log('resultFix: ', resultFix);

        // let skill = "write lol to a text file"
        // let inputs = ""
        // let outputs = "true"
        // let context = ""
        // let resultFix = await create_skill(skill,inputs,outputs, context)
        // console.log('resultFix: ', resultFix);

        // let input = "what tools do you have"
        // let output = await handle_input(input)
        // console.log('output: ', output);
        let output = await ai.query("whats my bitcoin address")
        console.log('output: ', output);
        //autonomous
        // autonomous()
    }catch(e){
        console.error(e)
    }
}
onTest()

// onStart()
// init()
