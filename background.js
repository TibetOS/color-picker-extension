// Color Picker Pro - Background Service Worker

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Initialize default settings
        chrome.storage.local.set({
            colorHistory: [],
            lastFormat: 'hex'
        });

        console.log('Color Picker Pro installed');
    }
});

// Handle any messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getHistory') {
        chrome.storage.local.get(['colorHistory'], (data) => {
            sendResponse({ history: data.colorHistory || [] });
        });
        return true; // Keep message channel open for async response
    }
});
