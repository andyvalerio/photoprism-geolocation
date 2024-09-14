// Script Global variables to hold stuff that you need async awaits to get
// which you can NOT use in FireFox when saving permissions etc.

var sourceWindowURL = "";
var sourceTabId = 0;


// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
async function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        "ppLocationMapSize": 200,
    }, function(items) {
        document.getElementById('size').value = items.ppLocationMapSize;
    });

    tabToRefresh = (await chrome.tabs.query({active: true, lastFocusedWindow: true}))[0];
    tabURL = new URL(tabToRefresh.url)
    sourceWindowURL = tabURL.protocol + "//" + tabURL.hostname  + "/*";  // Strip the ports off as although Chrome accepts it FireFox DOES NOT!!!
    sourceTabId = tabToRefresh.id;

    document.getElementById('sitename').textContent = sourceWindowURL;

    if (isValidUrl(sourceWindowURL)){
        var permission = { origins: [sourceWindowURL] };
        var result = (await chrome.permissions.contains(permission));
        document.getElementById('grant').disabled = result;
        document.getElementById('revoke').disabled = !result;
        if (!result) {
            chrome.runtime.sendMessage({action: "Popup", origin: sourceWindowURL, tabId:sourceTabId });
        }
    }
    else {
        document.getElementById('grant').disabled = true;
        document.getElementById('revoke').disabled = true;
        document.getElementById('sitename').textContent = "Page Not Valid for Extension";
    }
    buildTableHTML();
}

// Build up the list of sites that have been granted access.
async function buildTableHTML(){
    let tableHTML = "<table><tr><th>Allowed Sites</th></tr>"
    for (const url of (await chrome.permissions.getAll()).origins) {
        tableHTML += '<tr><td>'+url+'</td></tr>'
    }
    tableHTML += '</table>'
    document.getElementById('sitelist').innerHTML = tableHTML;
}

// Request the user to grant access permissions to the current window's site.
function grant_permissions() {
    if (isValidUrl(sourceWindowURL)) {
        // chrome.permissions.request may change the currentWindow, so we need to save it!
        chrome.permissions.request({ origins: [sourceWindowURL] })
        .then((granted) => {
            // The callback argument will be true if the user granted the permissions.
            if (granted) {
                document.getElementById('grant').disabled = true;
                document.getElementById('revoke').disabled = false;
                console.log("Permission for " + sourceWindowURL + " has been granted.")
            } else {
                document.getElementById('grant').disabled = false;
                document.getElementById('revoke').disabled = true;
            }
        })
        .catch((error) => {
            console.error(error);
            document.getElementById('message').textContent = error;
        })
    }
}

// Revoke the permissions from the current window's site.
async function revoke_permissions() {
    if (isValidUrl(sourceWindowURL)) {
        // Remove the registered content script.
        registered = (await chrome.scripting.getRegisteredContentScripts({ids:[sourceWindowURL]}))
        if (registered.length == 1) {
            chrome.scripting.unregisterContentScripts({ids:[sourceWindowURL]})
            .catch((error) => {
                console.error(error);
                document.getElementById('message').textContent = error;
            })
        }
        
        // Remove the permissions.
        chrome.permissions.remove({ origins: [sourceWindowURL] })
        .then((removed) => {
            // The callback argument will be true if the user granted the permissions.
            if (removed) {
                document.getElementById('grant').disabled = false;
                document.getElementById('revoke').disabled = true;
                console.log("Permission for " + sourceWindowURL + " has been removed.")
                chrome.tabs.sendMessage(sourceTabId, { action: "Revoked" });
                document.getElementById('message').textContent = "You have to close the current tab to stop the extension from running."
                buildTableHTML();
            } else {
                document.getElementById('grant').disabled = true;
                document.getElementById('revoke').disabled = false;
                console.log("SNAFU: Unable to remove permission");
            }
        })
    }
}


// Add all the listeners for the popup.

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('grant').addEventListener('click', grant_permissions);
document.getElementById('revoke').addEventListener('click', revoke_permissions);