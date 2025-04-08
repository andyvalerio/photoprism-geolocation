var isNewPhotoprismUi = null;

// Store variables to allow revocation to turn intervals off.
var intervalId = 0;
var amIRevoked = false;

// The listener for messages from the background processes
const listenerScriptLoaded = (message, sender, sendResponse) => {
    // Prevent this script from being loaded again on tab refresh/update.
    if (message.action === "IsScriptLoaded") {
        sendResponse(true)
    }
    else if (message.action === "Revoked") {
        if (intervalId !== 0){
            clearInterval(intervalId);
        }
        console.log("We received a revoke instruction!");
        amIRevoked = true;
    }
}
  
chrome.runtime.onMessage.addListener(listenerScriptLoaded)


const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = function(mutationsList, observer) {
    var mapSize = '200';
    var mapUrl = 'https://www.valerio.nu/maps';
    chrome.storage.sync.get({
        ppLocationMapSize: 200,
    }, function(items) {
        mapSize = items.ppLocationMapSize;
        if (mapSize != 0) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeType === 1) {
                    const isPrevUiTab = !isNewPhotoprismUi && mutation.addedNodes[0].className === 'p-tab p-tab-photo-details';
                    const isNewUiTab = isNewPhotoprismUi && mutation.addedNodes[0].classList.contains('v-tabs-window') && !!mutation.addedNodes[0].getElementsByClassName('p-tab-photo-details')[0];

                    if (isPrevUiTab || isNewUiTab) {
                        setTimeout(function(){
                            const countryElement = document.getElementsByClassName('input-country')[0];
                            const iframe = document.createElement('iframe');
                            iframe.src = mapUrl
                                + '?initLatitude=' + document.getElementsByClassName('input-latitude')[0].getElementsByTagName('input')[0].value
                                + '&initLongitude=' + document.getElementsByClassName('input-longitude')[0].getElementsByTagName('input')[0].value;
                            iframe.style = 'display: block; width: 100%; height: 100%; border: none; min-height: ' + mapSize + 'px;';
                            countryElement.parentNode.parentNode.insertBefore(iframe, countryElement.parentNode);
                        }, 1);
                        // Disconnect the observer
                        //observer.disconnect();
                    }
                }
            }
        }
    });
};

function observeTargetNode(targetNode) {
    if (targetNode) {
        // If the element exists, create the observer and start observing
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    } else {
        if (!amIRevoked) {
            // If the element doesn't exist yet, wait and try again
            setTimeout(observeAppElement, 100); // Check again after 100 milliseconds
        }
    }
}

function observeAppElement() {
    if (isNewPhotoprismUi === true) {
        if (!document.getElementsByClassName('v-overlay-container')[0]) {
            var container = document.createElement('div');
            container.classList.add('v-overlay-container');
            document.body.appendChild(container);
        }

        observeTargetNode(document.getElementsByClassName('v-overlay-container')[0]);
    } else {
        // Check if the element with id 'app' exists
        const targetNode = document.getElementById('app');

        if (targetNode) {
            isNewPhotoprismUi = !targetNode.classList.contains('application');

            if (isNewPhotoprismUi) {
                setTimeout(observeAppElement, 100);
                return;
            }
        }

        observeTargetNode(targetNode);
    }
}

// Call the function to start observing the 'app' element
observeAppElement();


// Receive message with new coordinates
top.window.addEventListener("message", function(message) {
    console.log(message.data);
    setTimeout(function(){
        // This is necessary because Vue.js responds by default to the input event rather than change event
        var event = new Event('input');
        // Validate that the coordinates and it's children are available, then set the values for latitude and longitude.
        if (message.data.coordinates !== undefined)
            {
                if (message.data.coordinates.lat !== undefined)
                {
                    var leftBox = document.getElementsByClassName('input-latitude')[0];
                    if (leftBox !== undefined)
                    {
                        leftBox.getElementsByTagName('input')[0].value = message.data.coordinates.lat;
                        leftBox.getElementsByTagName('input')[0].dispatchEvent(event);
                    }
                }
                if (message.data.coordinates.lon !== undefined)
                {
                    var rightBox = document.getElementsByClassName('input-longitude')[0];
                    if (rightBox !== undefined)
                    {
                        rightBox.getElementsByTagName('input')[0].value = message.data.coordinates.lon;
                        rightBox.getElementsByTagName('input')[0].dispatchEvent(event);
                    }
                }
            }
        }, 10);
    // Save the coordinates to local storage in case it is a bulk update (to be used when the user triggers the bulk update)
    // Make sure that the latitude and longitude are available
    if (message.data.coordinates !== undefined)
    {
        if (message.data.coordinates.lat !== undefined)
        {
            localStorage.setItem('latitude', message.data.coordinates.lat);
        }
        if (message.data.coordinates.lon !== undefined)
        {
            localStorage.setItem('longitude', message.data.coordinates.lon);
        }
    }
});


// Function to round a number to a precision.  Required to handle GPS coords being fixed by PhotoPrism.
function roundTo(num, precision) {
  const factor = Math.pow(10, precision)
  return Math.round(num * factor) / factor
}

const multiSelectButtonsActions = {
    _removeButton: (className) => {
        const button = document.querySelector(`.${className}`);
        button.parentNode.removeChild(button);
    },
    locationButton: () => {
        // Create a new iframe element
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.valerio.nu/maps';
        iframe.style.position = 'fixed';
        iframe.style.top = '50%';
        iframe.style.left = '50%';
        iframe.style.transform = 'translate(-50%, -50%)';
        iframe.style.width = '50%';
        iframe.style.height = '50%';
        iframe.style.border = '4px solid black';
        iframe.style.zIndex = '9999';

        // Append the iframe to the body
        document.body.appendChild(iframe);
    },
    saveButton: () => {
        latitude = roundTo(parseFloat(localStorage.getItem('latitude')), 6);  // Round to 6 digits which is max that PhotoPrism handles
        longitude = roundTo(parseFloat(localStorage.getItem('longitude')), 6);  // Round to 6 digits which is max that PhotoPrism handles
        console.log('Latitude:', latitude, 'Longitude:', longitude);
        photos = localStorage.getItem(isNewPhotoprismUi ? 'clipboard.photos' : 'photo_clipboard');
        console.log(photos);
        photos = JSON.parse(photos);
        // Remove the iframe from the document
        var iframe = document.querySelector('iframe[src="https://www.valerio.nu/maps"]');
        if (iframe) {
            iframe.parentNode.removeChild(iframe);
        }
        // Remove the Save and Cancel buttons from the document
        multiSelectButtonsActions._removeButton('extension-save-button');
        multiSelectButtonsActions._removeButton('extension-cancel-button');
        // Show a progress bar
        createProgressBar();
        numberOfPhotosSelected = photos.length;
        progressStep = 100 / numberOfPhotosSelected;
        progress = 0;
        counter = 0;
        photos.forEach(function(photo) {
            updatePhoto(photo, latitude, longitude)
            .then(() => {
                console.log('Update successful');
                counter = counter + 1;
                progress = progress + progressStep;
                updateProgress(progress);
                if (counter === photos.length) {
                    removeProgressBar();
                }
            })
            .catch(error => {
                console.error('Update failed:', error);
                removeProgressBar();
            });
        });
    },
    cancelButton: () => {
        // Remove the iframe from the document
        var iframe = document.querySelector('iframe[src="https://www.valerio.nu/maps"]');
        if (iframe) {
            iframe.parentNode.removeChild(iframe);
        }
        // Remove the Save and Cancel buttons from the document
        multiSelectButtonsActions._removeButton('extension-save-button');
        multiSelectButtonsActions._removeButton('extension-cancel-button');
    },
};

// Function to add the Location button if it's not already present
function addLocationButtonToPrevUi() {
    var buttonListContainer = document.querySelector('.v-speed-dial__list');
    // Check if the Location button is not already present
    if (buttonListContainer && document.querySelectorAll('.extension-location-button').length === 0 && document.querySelectorAll('.extension-save-button').length === 0) {
        // Create a new button element
        var newButton = document.createElement('button');
        newButton.setAttribute('type', 'button');
        newButton.classList.add('extension-location-button', 'v-btn', 'v-btn--floating', 'v-btn--small', 'theme--dark');
        newButton.setAttribute('title', 'Location');
        var buttonContent = document.createElement('div');
        buttonContent.classList.add('v-btn__content');
        buttonContent.innerHTML = '<i aria-hidden="true" class="v-icon material-icons theme--dark">location_on</i>';
        newButton.appendChild(buttonContent);

        // Find the container div for the existing buttons
        var buttonListContainer = document.querySelector('.v-speed-dial__list');

        // Create a new div to hold the button
        var buttonWrapper = document.createElement('div');
        buttonWrapper.setAttribute('style', 'transition-delay: 0.40s;');
        buttonWrapper.appendChild(newButton);

        // Append the new button to the container div
        buttonListContainer.appendChild(buttonWrapper);

        // Add event listener to the button
        newButton.addEventListener('click', multiSelectButtonsActions.locationButton);

    } else if (buttonListContainer && document.querySelector('iframe[src="https://www.valerio.nu/maps"]') && document.querySelectorAll('.extension-save-button').length === 0) {
        // If the iframe exists and is visible, add "Save" and "Cancel" buttons
        var saveButton = document.createElement('button');
        saveButton.setAttribute('type', 'button');
        saveButton.classList.add('v-btn', 'v-btn--floating', 'v-btn--small', 'theme--dark', 'extension-save-button');
        saveButton.setAttribute('title', 'Save location for selected photos');
        var saveButtonContent = document.createElement('div');
        saveButtonContent.classList.add('v-btn__content');
        saveButtonContent.innerHTML = '<i aria-hidden="true" class="v-icon material-icons theme--dark">save</i>';
        saveButton.appendChild(saveButtonContent);
        saveButton.addEventListener('click', multiSelectButtonsActions.saveButton);

        var cancelButton = document.createElement('button');
        cancelButton.setAttribute('type', 'button');
        cancelButton.classList.add('v-btn', 'v-btn--floating', 'v-btn--small', 'theme--dark', 'extension-cancel-button');
        cancelButton.setAttribute('title', 'Cancel location update');
        var cancelButtonContent = document.createElement('div');
        cancelButtonContent.classList.add('v-btn__content');
        cancelButtonContent.innerHTML = '<i aria-hidden="true" class="v-icon material-icons theme--dark">cancel</i>';
        cancelButton.appendChild(cancelButtonContent);
        // Add event listener to the Cancel button
        cancelButton.addEventListener('click', multiSelectButtonsActions.cancelButton);

        // Remove existing buttons from the container div
        buttonListContainer.innerHTML = '';
        // Append the buttons to the container div
        buttonListContainer.appendChild(saveButton);
        buttonListContainer.appendChild(cancelButton);
    }

}

const createNewUiButton = (className, iconName, title, clickCallback) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = title;
    button.className = `v-btn v-btn--flat v-btn--icon v-btn--size-small bg-highlight v-btn--density-default v-btn--variant-elevated opacity-95 ma-1 ${className}`;
    button.innerHTML = `<span class="v-btn__overlay"></span><span class="v-btn__underlay"></span><span class="v-btn__content"><i class="mdi mdi-${iconName} v-icon notranslate v-icon--size-default" aria-hidden="true"></i></span>`;
    button.addEventListener('click', clickCallback);
    return button;
};

function addLocationButtonToNewUi() {
    const clipboard = document.querySelector('.clipboard-container');

    if (clipboard && !clipboard.querySelector('.extension-location-button') && !clipboard.querySelector('.extension-save-button')) {
        const locationButton = createNewUiButton('extension-location-button', 'map-marker', 'Location', multiSelectButtonsActions.locationButton);
        clipboard.insertBefore(locationButton, clipboard.querySelector('button:first-child'));
    } else if (document.querySelector('iframe[src="https://www.valerio.nu/maps"]') && !document.querySelector('.extension-save-button')) {
        multiSelectButtonsActions._removeButton('extension-location-button');
        const saveButton = createNewUiButton('extension-save-button', 'content-save-all-outline', 'Save location for selected photos', multiSelectButtonsActions.saveButton);
        const cancelButton = createNewUiButton('extension-cancel-button', 'close-circle', 'Cancel location update', multiSelectButtonsActions.cancelButton);
        clipboard.insertBefore(cancelButton, clipboard.querySelector('button:first-child'));
        clipboard.insertBefore(saveButton, clipboard.querySelector('button:first-child'));
    }
}

// Function to create and append a progress bar
function createProgressBar() {
    // Create a new div for the progress bar
    var progressBarDiv = document.createElement('div');
    progressBarDiv.setAttribute('id', 'progress-bar');
    progressBarDiv.style.position = 'fixed';
    progressBarDiv.style.top = '50%';
    progressBarDiv.style.left = '50%';
    progressBarDiv.style.transform = 'translate(-50%, -50%)';
    progressBarDiv.style.width = '400px'; // Adjust width as needed
    progressBarDiv.style.height = '30px'; // Adjust height as needed
    progressBarDiv.style.border = '5px solid #000'; // Black border
    progressBarDiv.style.borderRadius = '10px'; // Rounded corners
    progressBarDiv.style.zIndex = '9999'

    // Create a div for the progress indicator
    var progressIndicatorDiv = document.createElement('div');
    progressIndicatorDiv.setAttribute('id', 'progress-indicator');
    progressIndicatorDiv.style.width = '0%'; // Initial width is 0%
    progressIndicatorDiv.style.height = '100%';
    progressIndicatorDiv.style.backgroundColor = '#4CAF50'; // Green color for progress
    progressIndicatorDiv.style.borderRadius = '5px'; // Rounded corners

    // Append the progress indicator to the progress bar
    progressBarDiv.appendChild(progressIndicatorDiv);

    // Append the progress bar to the document body
    document.body.appendChild(progressBarDiv);
}

function updateProgress(progress) {
    // Get the progress indicator element
    var progressIndicator = document.getElementById('progress-indicator');
    // Ensure progress is within the range of 0 to 100
    progress = Math.min(100, Math.max(0, progress));
    // Update the width of the progress indicator
    progressIndicator.style.width = progress + '%';
}

function removeProgressBar() {
    var progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.remove();
    }
}

// Check if 2 GPS numbers are close enough.  Required to deal with rounding issues between javascript and go.
// For some reason -33.972222 becomes -33.97222 in PhotoPrism.
// Others are more reasonable with a difference of 0.000001.
function LatOrLongOk(first, second)
{
    return Math.abs(first - second) < 0.000050;  
}


// Create a delay of up to a second if we need to retry.
const wait = (delay) => (new Promise((resolve) => setTimeout(resolve, delay)));

function updatePhoto(photo, latitude, longitude) 
{
    return new Promise
    (
        (resolve, reject) => 
        {
            // Get the current host URL
            var hostUrl = window.location.origin;
            // Handle proxied hosted PhotoPrism if required.
            var UrlPath = window.location.pathname.match("(\/.*)\/library");
            if (UrlPath != null)
            {
                hostUrl += UrlPath[1];
            }
            
            // Get the session ID and auth token from localStorage (in different ways to support multiple versions of PhotoPrism)
            var session_id = localStorage.getItem('session_id');
            var sessionId = localStorage.getItem('sessionId');
            var sessionIDToUse = sessionId !== null ? sessionId : session_id;
            var authToken = localStorage.getItem('authToken');
            
            var fetchURL = hostUrl + "/api/v1/photos/" + photo;
            var fetchProperties = {
                    "headers": {
                        "accept": "application/json, text/plain, */*",
                        "content-type": "application/json",
                        "x-session-id": sessionIDToUse, // Use the session ID retrieved from localStorage
                        "x-auth-token": authToken,
                    },
                    "body": JSON.stringify({"Lat": parseFloat(latitude), "Lng": parseFloat(longitude), "PlaceSrc": "manual"}),
                    "method": "PUT",
                    "mode": "cors",
                    "credentials": "include"
                };
            
            const retriableFetch = (url, properties, attempts = 5) => fetch(url, properties)
            .then
            (
                (response) => 
                {
                    if (response.ok)
                    {
                        console.log('Fetch successful for ', response.url,' Status:', response.status);
                        return response.json()
                    }
                    else 
                    {
                        const errMessage = 'Error updating photo ' + photo + '. Status: ' + response.status;
                        // HTTP 500 errors are assumed to be due to a backend database locking issue
                        // which will become available from PhotoPrism after a bug is fixed.
                        // See https://github.com/photoprism/photoprism/issues/4504
                        if (response.status == 500)
                        {
                            if (attempts < 1)
                            {
                                // Display an alert with the error message including the photo ID
                                console.error(errMessage);
                                alert(errMessage);
                                reject(new Error(errMessage)); // Reject the promise
                            }
                            else
                            {
                                console.log(errMessage);
                                // Pass the error to the next .then for retry attempt.
                                return {"Error": "true", "Status": response.status, "Message": errMessage}
                            }
                        }
                        else
                        {
                            // Display an alert with the error message including the photo ID
                            console.error(errMessage);
                            alert(errMessage);
                            reject(new Error(errMessage)); // Reject the promise
                        }
                    }
                }
            )
            .then
            (
                (data) => 
                {
                    if (data !== undefined)
                    {
                        if (data.Error == "true")
                        {
                            // We can only get here if there was a http 500 error, and we haven't run out of attempts.
                            const delay = Math.floor(Math.random() * 1000);
                            wait(delay).then(()=> retriableFetch(url, properties, attempts - 1));
                        }
                        else
                        {
                            // Before #4504 is fixed in PhotoPrism, it may return a json set of data without
                            // the updates to Latitude and Longitude when there has been a database deadlock or timeout.
                            // This will check for that, and retry.
                            if (LatOrLongOk(latitude, data.Lat) && LatOrLongOk(longitude, data.Lng))
                            {
                                // Data is all ok, so mark this one as complete.
                                resolve();
                            }
                            else
                            {
                                if (attempts < 1)
                                {
                                    // To many retry attempts...
                                    const errMessage = 'Error updating photo ' + photo + ': To many retries on GPS location Photo Lat (' + latitude + '): ' + data.Lat + ' Lon (' +  longitude +'): ' + data.Lng
                                    alert(errMessage);
                                    console.error(errMessage);
                                    reject(new Error(errMessage)); // Reject the promise
                                }
                                else
                                {
                                    // We haven't run out of retries, so try again.
                                    console.log('Photo ',photo,' Lat (', latitude, '): ', data.Lat, ' Lon (', longitude ,'): ', data.Lng, ' has issues.  Retrying...');
                                    const delay = Math.floor(Math.random() * 1000);
                                    wait(delay).then(()=> retriableFetch(url, properties, attempts - 1));
                                }
                            }
                        }
                    }
                    else
                    {
                        // Update has failed and we have been rejected.
                        // Nothing to do here.
                    }
                }
            )
            .catch
            (
                (error) =>
                {
                    // Display an alert with the error message including the photo ID
                    alert('Error updating photo ' + photo + ': ' + error.message);
                    console.error('Error updating photo ' + photo + ': ' + error);
                    reject(error); // Reject the promise
                }
            );
            retriableFetch(fetchURL, fetchProperties, 5);
        }
    );
}

if (!amIRevoked) {
    // Run the function every half second
    intervalId = setInterval(
        isNewPhotoprismUi
            ? addLocationButtonToNewUi
            : addLocationButtonToPrevUi,
        500
    );
}
