#!/usr/bin/env node
import * as dotenv from "dotenv";
dotenv.config();
//cli tools
import {fix_skill, handle_input, perform_skill} from "./pioneer";

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

        //welcome

        //initial setup
        //is github token set?
        //is openAi token set?

        //

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
            .command('run <filename>', 'Perform a skill.')
            .action(async function(args:any, callback:any) {
                let tag = " | run | "
                try{
                    // Respond to the input here
                    const filename = args.filename;
                    const scriptPath = path.join(__dirname, '..', 'skills', `${filename}`);
                    log.info(tag,"scriptPath: ",scriptPath)
                    //TODO - check if file exists
                    //TODO - read bash file and determine inputs needed
                    //TODO - inquire about inputs
                    let result = await perform_skill(scriptPath,[])
                    log.info(tag,"result: ",result)
                    callback();
                }catch(e){
                    console.log(e)
                }
            })
            .autocomplete(skills);

        vorpal
            .command('fix <filename>', 'fix a skill.')
            .action(async function(args: any, callback: () => void) {
                //@ts-ignore
                this.prompt([
                    {
                        type: 'input',
                        name: 'issue',
                        message: 'describe the issue: '
                    },
                    {
                        type: 'extra context',
                        name: 'context',
                        message: 'provide context or extra info: '
                    }
                ], async (results: { issue: any; context: any; }) => {
                    console.log('Your context is: ', results.context);
                    console.log('Your issue is: ', results.issue);
                    let resultFix = await fix_skill("./skills/"+args.filename,results.issue,results.context)
                    // console.log('resultFix: ', resultFix);
                    // callback();
                });
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
                // Respond to the input here
                // @ts-ignore
                // this.log('You entered:', input);
                callback();
            });

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
onStart()
