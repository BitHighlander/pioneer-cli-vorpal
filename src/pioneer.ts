import { KkRestAdapter } from "@keepkey/hdwallet-keepkey-rest";
import { KeepKeySdk } from "@keepkey/keepkey-sdk";
import { SDK } from "@pioneer-sdk/sdk";
import * as core from "@shapeshiftoss/hdwallet-core";
const log = require('@pioneer-platform/loggerdog')()
import type { NativeHDWallet } from "@shapeshiftoss/hdwallet-native";
import { NativeAdapter } from "@shapeshiftoss/hdwallet-native";
import { entropyToMnemonic } from "bip39";
//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import ai = require("./ai-controller");
import * as config from "@pioneer-platform/pioneer-config"

export enum WalletActions {
    SET_STATUS = "SET_STATUS",
    SET_USERNAME = "SET_USERNAME",
    SET_USER = "SET_WALLETS",
    SET_CONTEXT = "SET_CONTEXT",
    SET_BLOCKCHAIN = "SET_BLOCKCHAIN",
    SET_ASSET = "SET_ASSET",
    SET_API = "SET_API",
    SET_APP = "SET_APP",
    SET_WALLET = "SET_WALLET",
    ADD_WALLET = "ADD_WALLET",
    RESET_STATE = "RESET_STATE",
}

export interface InitialState {
    status: any;
    username: string;
    serviceKey: string;
    queryKey: string;
    context: string;
    balances: any[];
    pubkeys: any[];
    wallets: any[];
    walletDescriptions: any[];
    totalValueUsd: number;
    user: any;
    wallet: any;
    app: any;
    api: any;
}

const initialState: InitialState = {
    status: "disconnected",
    username: "",
    serviceKey: "",
    queryKey: "",
    context: "",
    balances: [],
    pubkeys: [],
    wallets: [],
    walletDescriptions: [],
    totalValueUsd: 0,
    user: null,
    wallet: null,
    app: null,
    api: null,
};

export type ActionTypes =
    | { type: WalletActions.SET_STATUS; payload: any }
    | { type: WalletActions.SET_USERNAME; payload: string }
    | { type: WalletActions.SET_WALLET; payload: any }
    | { type: WalletActions.SET_APP; payload: any }
    | { type: WalletActions.SET_API; payload: any }
    | { type: WalletActions.SET_USER; payload: any }
    | { type: WalletActions.SET_CONTEXT; payload: any }
    | { type: WalletActions.ADD_WALLET; payload: any }
    | { type: WalletActions.RESET_STATE };

const reducer = (state: InitialState, action: ActionTypes) => {
    switch (action.type) {
        case WalletActions.SET_STATUS:
            return { ...state, status: action.payload };
        case WalletActions.SET_CONTEXT:
            return { ...state, context: action.payload };
        case WalletActions.SET_USERNAME:
            return { ...state, username: action.payload };
        case WalletActions.SET_WALLET:
            return { ...state, wallet: action.payload };
        case WalletActions.ADD_WALLET:
            return { ...state, wallets: [...state.wallets, action.payload] };
        case WalletActions.SET_APP:
            return { ...state, app: action.payload };
        case WalletActions.SET_API:
            return { ...state, api: action.payload };
        case WalletActions.SET_USER:
            return { ...state, user: action.payload };
        case WalletActions.RESET_STATE:
            return {
                ...state,
                api: null,
                user: null,
                username: null,
                context: null,
                status: null,
            };
        default:
            return state;
    }
};

const state: InitialState = { ...initialState };

function setStatus(payload: any) {
    state.status = payload;
}

function setContext(payload: any) {
    state.context = payload;
}

function setBlockchainContext(payload: any) {
    // Implement the logic for setting the blockchain context in your state
}

function setAssetContext(payload: any) {
    // Implement the logic for setting the asset context in your state
}

async function checkKeepkeyAvailability() {
    // Implement the logic to check the availability of KeepKey
    return true; // Replace with your implementation
}

export const onStartPioneer = async function () {
    try {
        log.info("config: ", config)
        let configFile = config.getConfig()
        if(!configFile) await config.innitConfig("english")
        configFile = config.getConfig()
        let { serviceKey, queryKey, username } = configFile

        if (!queryKey) {
            queryKey = `key:${uuidv4()}`;
            config.updateConfig({queryKey})
        }
        if (!username) {
            username = `user:${uuidv4()}`;
            username = username.substring(0, 13);
            config.updateConfig({username})
        }

        const keyring = new core.Keyring();
        const blockchains = [
            "bitcoin",
            "ethereum",
            "thorchain",
            "bitcoincash",
            "litecoin",
            "binance",
            "cosmos",
            "dogecoin",
        ];

        const paths: any = [];
        const spec =
            process.env["PIONEER_URL_SPEC"] || "https://pioneers.dev/spec/swagger.json";
        const wss = process.env["PIONEER_URL_WS"] || "wss://pioneers.dev";
        const configPioneer: any = {
            blockchains,
            username,
            queryKey,
            spec,
            wss,
            paths,
        };

        let app = new SDK(spec, configPioneer);

        let walletKeepKey: core.HDWallet | null = null;
        const isKeepkeyAvailable = await checkKeepkeyAvailability();

        if (isKeepkeyAvailable) {
            const configKeepKey: any = {
                apiKey: serviceKey || "notSet",
                pairingInfo: {
                    name: "Pioneer",
                    imageUrl: "https://i.imgur.com/BdyyJZS.png",
                    basePath: "http://localhost:1646/spec/swagger.json",
                    url: "https://pioneer-template.vercel.com",
                },
            };
            const sdkKeepKey = await KeepKeySdk.create(configKeepKey);
            config.updateConfig({serviceKey: configKeepKey.apiKey})
            //@ts-ignore
            walletKeepKey = await KkRestAdapter.useKeyring(keyring).pairDevice(sdkKeepKey);

            const successKeepKey = await app.pairWallet(walletKeepKey);
        }

        //TODO init software if no keepkey

        let walletSoftware: core.HDWallet | null = null;

        if (!isKeepkeyAvailable && !walletSoftware) {
            console.log("No wallets found! Unable to continue.");
        } else {
            const walletPreferred: core.HDWallet | null = walletKeepKey || walletSoftware;

            //@ts-ignore
            setContext(walletPreferred?.type);
            state.wallet = walletPreferred;

            const api = await app.init(walletPreferred);
            // log.info("api: ",api)
            log.info("app: ",app)
            log.info("ai: ",ai)
            //@ts-ignore

            // const user = await api.User();
            // console.log("user: ", user.data);
            // //@ts-ignore
            // if (api) {
            //     state.app = app;
            //     state.api = api;
            //
            //     //@ts-ignore
            //     const user = await api.User();
            //     console.log("user: ", user.data);
            //
            //     setBlockchainContext(user.data.blockchainContext);
            //     setAssetContext(user.data.assetContext);
            // }
        }

        //
        return app
    } catch (e) {
        console.error(e);
    }
};
