// Listener for when the extension is installed or updated.
// reason can be used to decide what needs to be done.
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    // Show the install tab so the user knows they have to add their PhotoPrism server.
    chrome.tabs.create({ url: "install.html" });
});



// Variable to hold the tabid from the popup
var popupAlmostJSON = {};

// Permissions have been added.  
// If it was from the popup, we will have a value in the JSON.
// So we can check if the tab already has the script, and if not
// we can send it there.
chrome.permissions.onAdded.addListener(async (permissions) => {
    rightnow = new Date()
    console.log(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js Executing chrome.permissions.onAdded.addListener for permissions " + permissions);
    if (popupAlmostJSON.hasOwnProperty(permissions.origins)){
        tabId = popupAlmostJSON[permissions.origins];
        // Remove the previous popup's storage.
        delete popupAlmostJSON[permissions.origins];
        setTimeout(registerMatchAndScript, 1000, tabId, "chrome.permissions.onAdded.addListener", permissions.origins);
    }
})

// Someone has sent us a message.
// If it was the Popup, then save the state information.
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action == 'Popup') {
        if (popupAlmostJSON.hasOwnProperty(message.origin)){
            // Remove the previous popup's storage.
            delete popupAlmostJSON[message.origin];
        }
        // Add the latest tab for this origin.
        popupAlmostJSON[message.origin] = message.tabId;
    }
})

// Function to inject the content script into the tab.
function injectContentScript(tabId, callingScript, sourceURL){
    // This needs to detect if the script is already active in this tab, before firing it in again...
    chrome.tabs
    .sendMessage(tabId, { action: "IsScriptLoaded" })
    // If there is an error, that probably means that the script isn't there.
    // We are assuming that it's not there so we can inject it.
    .catch(async () => {
        rightnow = new Date()
        console.log(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js Executing " + callingScript + " activating script on " + tabId + " for URL " + sourceURL);
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: ["contentScript.js"],
        })
        .then ((injectionResult) => {
            rightnow = new Date()
            console.log(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js injection results is " + injectionResult[0].result + " or error is " + injectionResult[0].error);
        })
        .catch((error) => {
            rightnow = new Date()
            console.error(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js injection error is " + error);
        })
    })
}

// Function to stuff the content scripts into the window.
function registerMatchAndScript(tabId, callingScript, sourceURL){
    // This needs to detect if the script is already active in this tab, before firing it in again...
    chrome.tabs
    .sendMessage(tabId, { action: "IsScriptLoaded" })
    // If there is an error, that probably means that the script isn't there.
    // We are assuming that it's not there so we can register it.
    .catch(async () => {
        rightnow = new Date()
        console.log(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js Executing " + callingScript + " registering Match and Script on " + tabId + " for URL " + sourceURL);
        var registerContentScript = {}
        if ((typeof sourceURL) == "object"){
            registerContentScript = {
                id: sourceURL[0],
                js: ["contentScript.js"],
                matches: sourceURL,
            }
        } else {
            registerContentScript = {
                id: sourceURL,
                js: ["contentScript.js"],
                matches: [sourceURL],
            }
        }
        chrome.scripting.registerContentScripts([registerContentScript])
        .then(() => {
            rightnow = new Date()
            console.log(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js Reloading tab " + tabId + " for URL " + sourceURL);
            chrome.tabs.reload(tabId);
        })
        .catch((error) => {
            rightnow = new Date()
            console.error(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js injection error is " + error);
        })
    })
}


// Listener for when a tab is updated.
// This will take action when the change is complete, and the extension has access to the tab.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete") {
        // If we don't have permissions the tab.url will be undefined.
        if (tab.url !== undefined)
        {
            //rightnow = new Date()
            //console.log(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js Executing onUpdated");
            var url = (new URL(tab.url)).origin  + "/*";
            var permission = { origins: [url] };
            // Make sure that we acually have permissions on the tab.
            var result = (await chrome.permissions.contains(permission));
            if (result)
            {
                injectContentScript(tab.id, "chrome.tabs.onUpdated.addListener", url);
            }
        }
    }
})

