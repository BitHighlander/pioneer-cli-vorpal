/*
    Ascii art
        and CLI view generation
            -Highlander
 */
const TAG = " | App | ";
const chalk = require("chalk");
const figlet = require("figlet");
const log = require("loggerdog-client")();


export function showWelcome() {
    let tag = TAG + " | importConfig | ";
    try {

    } catch (e) {
        console.error(tag, "e: ", e);
        return {};
    }
}
