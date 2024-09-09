// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
async function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        "ppLocationMapSize": 200,
    }, function(items) {
        document.getElementById('size').value = items.ppLocationMapSize;
    });
    var url = (new URL((await theCurrentTab()).url)).origin  + "/*";

    document.getElementById('sitename').textContent = url;

    var permission = { origins: [url] };
    var result = (await chrome.permissions.contains(permission));
    document.getElementById('grant').disabled = result;
    document.getElementById('revoke').disabled = !result;
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
async function grant_permissions() {
    var url = (new URL((await theCurrentTab()).url)).origin  + "/*";
    if (isValidUrl(url)) {
        await chrome.permissions.request({
            origins: [url]
        }, (granted) => {
            // The callback argument will be true if the user granted the permissions.
            if (granted) {
                document.getElementById('grant').disabled = true;
                document.getElementById('revoke').disabled = false;
                console.log("Permission for " + url + " has been granted.")
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.reload(tabs[0].id);
                });
                window.close();
            } else {
                document.getElementById('grant').disabled = false;
                document.getElementById('revoke').disabled = true;
            }
        })
    }
}

// Revoke the permissions from the current window's site.
async function revoke_permissions() {
    var url = (new URL((await theCurrentTab()).url)).origin  + "/*";
    if (isValidUrl(url)) {
    chrome.permissions.remove({
        origins: [url]
    }, (removed) => {
        // The callback argument will be true if the user granted the permissions.
        if (removed) {
            document.getElementById('grant').disabled = false;
            document.getElementById('revoke').disabled = true;
            console.log("Permission for " + url + " has been removed.")
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "Revoked" });
            });
            document.getElementById('message').textContent = "You have to close the current tab to stop the extension from running."
        } else {
            document.getElementById('grant').disabled = true;
            document.getElementById('revoke').disabled = false;
            console.log("SNAFU: Unable to remove permission");
        }
    })
    }
}

// Get the tab that was active when the popup was requested.
var theCurrentTab = async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

// Add all the listeners for the popup.

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('grant').addEventListener('click', grant_permissions);
document.getElementById('revoke').addEventListener('click', revoke_permissions);