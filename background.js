// Color Picker Pro v2.0 - Background Service Worker

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Initialize default settings
        chrome.storage.local.set({
            colorHistory: [],
            palettes: [],
            activePalette: null,
            lastFormat: 'hex'
        });
        console.log('Color Picker Pro v2.0 installed');
    } else if (details.reason === 'update') {
        console.log('Color Picker Pro updated to v2.0');
    }
});

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
    if (command === '_execute_action') {
        // The popup will open automatically with _execute_action
        // This handler is here for future custom commands
        console.log('Color Picker opened via shortcut');
    }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getHistory':
            chrome.storage.local.get(['colorHistory'], (data) => {
                sendResponse({ history: data.colorHistory || [] });
            });
            return true;

        case 'getPalettes':
            chrome.storage.local.get(['palettes', 'activePalette'], (data) => {
                sendResponse({
                    palettes: data.palettes || [],
                    activePalette: data.activePalette || null
                });
            });
            return true;
    }
});
