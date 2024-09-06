
const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = function(mutationsList, observer) {
    var mapSize = '200';
    var mapUrl = 'https://www.valerio.nu/maps';
    chrome.storage.sync.get({
        ppLocationMapSize: 'default',
    }, function(items) {
        mapSize = items.ppLocationMapSize;
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes[0] !== undefined && mutation.addedNodes[0].className === 'p-tab p-tab-photo-details') {
                    setTimeout(function(){
                        var countryElement = document.getElementsByClassName('input-country')[0];
                        var iframe = document.createElement('iframe');
                        iframe.src = mapUrl + '?initLatitude=' + 
                        document.getElementsByClassName('input-latitude')[0].firstChild.firstChild.firstChild.childNodes[1].value
                        + '&initLongitude=' + document.getElementsByClassName('input-longitude')[0].firstChild.firstChild.firstChild.childNodes[1].value;
                        iframe.style = 'display: block; width: 100%; height: 100%; border: none; min-height: ' + mapSize + 'px;';
                        countryElement.parentNode.parentNode.insertBefore(iframe, countryElement.parentNode);
                    }, 1);
                    // Disconnect the observer
                    //observer.disconnect();
                }
            }
        }
    });
};


function observeAppElement() {
    // Check if the element with id 'app' exists
    const targetNode = document.getElementById('app');
    
    if (targetNode) {
        // If the element exists, create the observer and start observing
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    } else {
        // If the element doesn't exist yet, wait and try again
        setTimeout(observeAppElement, 100); // Check again after 100 milliseconds
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
                        leftBox.firstChild.firstChild.firstChild.childNodes[1].value = message.data.coordinates.lat;
                        leftBox.firstChild.firstChild.firstChild.childNodes[1].dispatchEvent(event);
                    }
                }
                if (message.data.coordinates.lon !== undefined)
                {
                    var rightBox = document.getElementsByClassName('input-longitude')[0];
                    if (rightBox !== undefined)
                    {
                        rightBox.firstChild.firstChild.firstChild.childNodes[1].value = message.data.coordinates.lon;
                        rightBox.firstChild.firstChild.firstChild.childNodes[1].dispatchEvent(event);
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


// Function to add the Location button if it's not already present
function addLocationButton() {
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
        newButton.addEventListener('click', function() {
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

        });

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

        saveButton.addEventListener('click', function() {
            latitude = localStorage.getItem('latitude')
            longitude = localStorage.getItem('longitude')
            console.log('Latitude:', latitude, 'Longitude:', longitude);
            photos = localStorage.getItem('photo_clipboard')
            console.log(photos)
            photos = JSON.parse(photos);
            // Remove the iframe from the document
            var iframe = document.querySelector('iframe[src="https://www.valerio.nu/maps"]');
            if (iframe) {
                iframe.parentNode.removeChild(iframe);
            }
            // Remove the Save and Cancel buttons from the document
            saveButton.parentNode.removeChild(saveButton);
            cancelButton.parentNode.removeChild(cancelButton);
            // Show a progress bar
            createProgressBar()
            numberOfPhotosSelected = photos.length
            progressStep = 100 / numberOfPhotosSelected
            progress = 0
            counter = 0
            photos.forEach(function(photo) {
                updatePhoto(photo, latitude, longitude)
                .then(() => {
                    console.log('Update successful')
                    counter = counter + 1
                    progress = progress + progressStep
                    updateProgress(progress)
                    if (counter === photos.length) {
                        removeProgressBar()
                    }
                })
                .catch(error => {
                    console.error('Update failed:', error)
                    removeProgressBar()
                });
            })
        })

        var cancelButton = document.createElement('button');
        cancelButton.setAttribute('type', 'button');
        cancelButton.classList.add('v-btn', 'v-btn--floating', 'v-btn--small', 'theme--dark');
        cancelButton.setAttribute('title', 'Cancel location update');
        var cancelButtonContent = document.createElement('div');
        cancelButtonContent.classList.add('v-btn__content');
        cancelButtonContent.innerHTML = '<i aria-hidden="true" class="v-icon material-icons theme--dark">cancel</i>';
        cancelButton.appendChild(cancelButtonContent);
        // Add event listener to the Cancel button
        cancelButton.addEventListener('click', function() {
            // Remove the iframe from the document
            var iframe = document.querySelector('iframe[src="https://www.valerio.nu/maps"]');
            if (iframe) {
                iframe.parentNode.removeChild(iframe);
            }
            // Remove the Save and Cancel buttons from the document
            saveButton.parentNode.removeChild(saveButton);
            cancelButton.parentNode.removeChild(cancelButton);
        });
        

        // Remove existing buttons from the container div
        buttonListContainer.innerHTML = '';
        // Append the buttons to the container div
        buttonListContainer.appendChild(saveButton);
        buttonListContainer.appendChild(cancelButton);
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
                        console.error(errMessage);
                        // HTTP 500 errors are assumed to be due to a backend database locking issue
                        // which will become available from PhotoPrism after a bug is fixed.
                        // See https://github.com/photoprism/photoprism/issues/4504
                        if (response.status == 500)
                        {
                            if (attempts < 1)
                            {
                                // Display an alert with the error message including the photo ID
                                alert(errMessage);
                                reject(new Error(errMessage)); // Reject the promise
                            }
                            else
                            {
                                const delay = Math.floor(Math.random() * 1000);
                                wait(delay).then(()=> retriableFetch(url, properties, attempts - 1));
                            }                        
                        }
                        else
                        {
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
                    // Before #4504 is fixed in PhotoPrism, it will return a json set of data without
                    // the updates to Latitude and Longitude.  This will check for that, and retry.
                    console.log('Photo ',photo,' Lat (', latitude, '): ', data.Lat, ' Lon (', longitude ,'): ', data.Lng);
                    if (LatOrLongOk(latitude, data.Lat) && LatOrLongOk(longitude, data.Lng))
                    {
                        resolve();
                    }
                    else
                    {
                        if (attempts < 1)
                        {
                            const errMessage = 'Error updating photo ' + photo + ': To many retries on GPS location Photo Lat (' + latitude + '): ' + data.Lat + ' Lon (' +  longitude +'): ' + data.Lng
                            alert(errMessage);
                            console.error(errMessage);
                            reject(new Error(errMessage)); // Reject the promise
                        }
                        else
                        {
                            const delay = Math.floor(Math.random() * 1000);
                            wait(delay).then(()=> retriableFetch(url, properties, attempts - 1));
                        }
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

// Run the function every half second
setInterval(addLocationButton, 500);
