// Listener for when the extension is installed or updated.
// reason can be used to decide what needs to be done.
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    // Show the install tab so the user knows they have to add their PhotoPrism server.
    chrome.tabs.create({ url: "install.html" });
});


// Listener for when a tab is updated.
// This will take action when the change is complete, and the extension has access to the tab.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete") {
        // Only run if the tab's change has been completed
        // Tab's that access url's that haven't been granted access by the user will be undefined.
        rightnow = new Date()
        console.log(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js Executing onUpdated with tab.url " + tab.url);
        if (tab.url !== undefined) {
            // Setup the url filter that the permission would have been granted on
            var url = (new URL(tab.url)).origin  + "/*";
            var permission = { origins: [url] };
            // Although we can't get here (in theory) without permissions, check them again anyway.
            var result = (await chrome.permissions.contains(permission));
            if (result) {
                // This needs to detect if the script is already active in this tab, before firing it in again...
                chrome.tabs
                    .sendMessage(tab.id, { action: "IsScriptLoaded" })
                    .catch(async () => {
                    console.log(rightnow.toLocaleString(undefined, {year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", fractionalSecondDigits:3, hour12: false}) + " worker.js Executing onUpdated activating script on " + tab.id + " for " + tab.url);
                    // Load all the content_scripts from the manifest.
                    for (const cs of chrome.runtime.getManifest().content_scripts) {
                        await chrome.scripting.executeScript({
                            target: {tabId: tab.id},
                            files: cs.js,
                        })
                    }
                })
            }
        }
    }
})
