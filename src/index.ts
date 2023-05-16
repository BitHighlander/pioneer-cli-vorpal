#!/usr/bin/env node
import inquirer from 'inquirer';
import * as dotenv from "dotenv";
dotenv.config();
//cli tools
import {handle_input,perform_skill} from "./pioneer";
const fsAutocomplete = require('vorpal-autocomplete-fs');

import util from "util";
import {showWelcome} from './ascii';
// import chalk from "chalk";
const vorpal = require('vorpal')();
const log = require('@pioneer-platform/loggerdog')()
const fs = require('fs-extra');
const path = require('path');
// const chalk = require("chalk");
// const figlet = require("figlet");
//globals
let skills:any = []
let refreshSkills = async function(){
    try{
        //skills
        skills = await fs.readdir("./skills")
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
