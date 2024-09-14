// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        ppLocationMapSize: 200,
    }, function(items) {
        if (items !== undefined){
            document.getElementById('size').value = items.ppLocationMapSize;
        } else {
            document.getElementById('size').value = 200;
        }
    });
    buildCheckboxList();
}

// For any site that has been ticked, revoke it's access.
function revoke_permissions(){
    var records = document.getElementById('sitelist').getAttribute("data-records");
    var counter = 0;
    for (let counter = 0; counter < records; counter++) {
        let elementName = 'url'+counter;
        if (document.getElementById(elementName).checked) {
            let url = document.getElementById(elementName).getAttribute("value");
            if (isValidUrl(url)) {
                chrome.scripting.getRegisteredContentScripts({ids:[url]})
                .then ((scripts) => {
                    if (scripts.length == 1) {
                        chrome.scripting.unregisterContentScripts({ids:[url]})
                        .catch((error) => {
                            console.error(error);
                            alert(error);
                        })
                    }
                })
                chrome.permissions.remove({
                    origins: [url]
                }, (removed) => {
                    // The callback argument will be true if the user granted the permissions.
                    if (removed) {
                        console.log("Permission for " + url + " has been removed.")
                    } else {
                        console.log("SNAFU: Unable to remove permission");
                    }
                })
            }
        }
    }
    buildCheckboxList();
}

// Build up the list of sites that have been granted access.
async function buildCheckboxList(){
    let checkboxHTML = "<table><tr><th>Allowed Sites</th></tr>"
    let counter = 0
    for (const url of (await chrome.permissions.getAll()).origins) {
        checkboxHTML += '<tr><td><input type="checkbox" id="url' + counter + '" name="url' + counter + '" value="'+url+'"'
        checkboxHTML += '><label for="url'+counter+'">'+url+'</label></td></tr>'
        counter++;
    }
    checkboxHTML += '</table>'
    document.getElementById('sitelist').innerHTML = checkboxHTML;
    document.getElementById('sitelist').setAttribute("data-records", counter.toString());
    if (counter > 0) {
        document.getElementById('revoke').disabled = false;
    }
}

// Add all the listeners for the options page.

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('revoke').addEventListener('click', revoke_permissions);