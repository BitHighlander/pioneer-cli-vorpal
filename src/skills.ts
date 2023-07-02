const TAG = " | skills | "

import {perform_skill} from "./engine";

const log = require('@pioneer-platform/loggerdog')()
import * as path from 'path';
import fs from "fs"; // for path normalization
import axios from 'axios';




export async function publish(scriptName:string): Promise<any> {
    const tag = TAG + " | publish | "
    try{
        //@TODO
        //get the skill from the db

        //if doesnt exist, create it
        //if exists, update it
        // URL is switchable, based on the environment variable
        const url = process.env['URL_PIONEER_SPEC'] || "http://127.0.0.1:9001/spec/swagger.json";
        const response = await axios.get(`${url}/skill/`+scriptName);
        log.info(tag,"response: ",response.data)

        // // Prepare the headers
        // const headers = {
        //     'Authorization': 'your-token-here' // replace this with actual token
        // };
        //
        // // Prepare the data
        // const data = {
        //     scriptName: skill.scriptName,
        //     script: skill.script,
        //     summary: skill.summary,
        //     inputs: skill.inputs,
        //     keywords: skill.keywords,
        // };
        //
        // // Make the request
        // const response = await axios.post(`${url}/skills/create`, data, { headers });
        //
        // return response.data;
    }catch(e){
        console.error(e);
        throw e;
    }
}
