// Saves options to chrome.storage
function save_options() {
    var size = document.getElementById('size').value;
    // Validate the input.
    validSize = [100, 200, 400];
    if(+size === parseInt(size)){
        if(validSize.includes(parseInt(size))) {
            chrome.storage.sync.set({
                "ppLocationMapSize": size,
            }, function() {
                if (chrome.runtime.error) { console.log("chrome.runtime.error was true"); }
                else { console.log("Attempted to save ", size);}
                // Update status to let user know options were saved.
                var status = document.getElementById('status');
                status.textContent = 'Options saved.';
                setTimeout(function() {
                status.textContent = '';
                }, 750);
            });
        }
    }
}

// Validates that the string is a valid URL.
// Prevents someone passing a nasty script into us.
function isValidUrl(string) {
    try {
        var parsedURL = new URL(string);
        if (parsedURL.host !== '') {
            return true; 
        }
        else {
            return false;
        }
    } catch (err) {
        return false;
    }
}
