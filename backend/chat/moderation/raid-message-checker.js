"use strict";

const logger = require("../../logwrapper");
const frontendCommunicator = require("../../common/frontend-communicator");
const chatModerationManager = require("./chat-moderation-manager");

const messageCache = [];

let raidMessage = "";
let checkerEnabled = false;
const settings = {
    shouldBan: false,
    shouldBlock: false,
    cacheLimit: 50,
    characterLimit: 10
};

function handleRaider(message) {
    const chat = require("../twitch-chat");

    if (settings.shouldBan) {
        chat.ban(message.username, "");
    }

    if (settings.shouldBlock) {
        chat.block(message.userId, "");
    }
}

function updateSettings(moderationSettings) {
    if (moderationSettings.spamRaidProtection.cacheLimit != null) {
        settings.cacheLimit = moderationSettings.spamRaidProtection.cacheLimit;
    }

    if (moderationSettings.spamRaidProtection.characterLimit != null) {
        settings.characterLimit = moderationSettings.spamRaidProtection.characterLimit;
    }

    logger.debug(settings);
}

/**
 *
 * @param {import("../chat-helpers").FirebotChatMessage} firebotChatMessage
 */
function sendMessageToCache(firebotChatMessage) {
    if (messageCache.length === 0) {
        const moderationSettings = chatModerationManager.getChatModerationSettings();
        updateSettings(moderationSettings);
    }

    if (messageCache.length >= settings.cacheLimit) {
        messageCache.shift();
    }

    if (firebotChatMessage.rawText.length > settings.characterLimit) {
        firebotChatMessage.rawText = firebotChatMessage.rawText.substr(settings.characterLimit);
    }

    messageCache.push(firebotChatMessage);

    if (firebotChatMessage && checkerEnabled && firebotChatMessage.rawText === raidMessage) {
        handleRaider(firebotChatMessage);
    }
}

function getRaidMessage() {
    const rawMessages = messageCache.map(message => message.rawText);
    const raidMessages = rawMessages.reduce((allMessages, message) => {
        if (allMessages[message] != null) {
            allMessages[message] += 1;
        } else {
            allMessages[message] = 1;
        }

        return allMessages;
    }, {});

    const highest = Math.max(...Object.values(raidMessages));
    const index = Object.values(raidMessages).findIndex(message => message === highest);

    return Object.keys(raidMessages)[index];
}

function checkPreviousMessages() {
    for (const message in messageCache) {
        if (messageCache[message].rawText === raidMessage) {
            handleRaider(messageCache[message]);
        }
    }
}

function enable(shouldBan, shouldBlock) {
    raidMessage = getRaidMessage();
    settings.shouldBan = shouldBan;
    settings.shouldBlock = shouldBlock;

    checkPreviousMessages();

    checkerEnabled = true;
    logger.debug("Raid message checker enabled...");
}

function disable() {
    checkerEnabled = false;
}

frontendCommunicator.on("chatModerationSettingsUpdate", moderationSettings => {
    if (moderationSettings.spamRaidProtection == null) return;

    updateSettings(moderationSettings);
});

exports.sendMessageToCache = sendMessageToCache;
exports.enable = enable;
exports.disable = disable;