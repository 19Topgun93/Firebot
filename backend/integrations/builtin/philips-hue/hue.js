"use strict";
const EventEmitter = require("events");
const logger = require("../../../logwrapper");
const hueHandler = require("./hue-handler");
const v3 = require('node-hue-api').v3,
    discovery = v3.discovery,
    hueApi = v3.api;
const appName = 'Firebot';
const deviceName = 'Firebot-Hue';

const integrationDefinition = {
    id: "hue",
    name: "Philips Hue",
    description: "Allows users to run hue specific effects. Press the link button on your hue bridge, then press link.",
    linkType: "other",
    connectionToggle: false
};

class HueIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
    }
    init() {
        // Register hue specific events and variables here.
    }
    async connect(integrationData) {
        let connection = await hueHandler.connectHueBridge(integrationData);

        if (connection) {
            this.emit("connected", integrationDefinition.id);
            this.connected = true;
            return true;
        }

        renderWindow.webContents.send(
            "error",
            "Could not connect to hue. The bridge might have changed ip addresses or lost user info. Try re-linking to hue."
        );
        return false;
    }
    disconnect() {
        // TODO: Disconnect from authed instance.
        this.emit("disconnected", integrationDefinition.id);
    }
    async link() {
        let settings = {};

        let hueUser = await this.discoverAndCreateUser();

        if (hueUser !== false) {
            settings.user = hueUser;

            this.emit("settings-update", integrationDefinition.id, settings);
            return settings;
        }

        renderWindow.webContents.send(
            "error",
            "Please press the link button on your hue bridge, then click the link button in Firebot."
        );
        throw new Error("Please press the link button on your hue bridge, then click the link button in Firebot.");
    }
    unlink() {
        // TODO: Disconnect from authed instance.
    }
    async discoverBridge() {
        const discoveryResults = await discovery.nupnpSearch();

        if (discoveryResults.length === 0) {
            logger.error('Failed to resolve any Hue Bridges');
            return null;
        }
        // Ignoring that you could have more than one Hue Bridge on a network as this is unlikely in 99.9% of users situations
        return discoveryResults[0].ipaddress;
    }
    async discoverAndCreateUser() {
        const ipAddress = await this.discoverBridge();

        // Create an unauthenticated instance of the Hue API so that we can create a new user
        const unauthenticatedApi = await hueApi.createLocal(ipAddress).connect();
        let createdUser;
        try {
            createdUser = await unauthenticatedApi.users.createUser(appName, deviceName);
            createdUser.ipAddress = ipAddress;
            return createdUser;
        } catch (err) {
            if (err.getHueErrorType() === 101) {
                logger.warn('The Link button on the bridge was not pressed. Please press the Link button and try again.');
            } else {
                logger.error(`Unexpected Error: ${err.message}`);
            }

            return false;
        }
    }
}

module.exports = {
    definition: integrationDefinition,
    integration: new HueIntegration()
};
