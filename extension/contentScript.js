
const targetNode = document.getElementById('photoprism');
const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = function(mutationsList, observer) {
    var mapSize = '200';
    var mapUrl = 'https://www.valerio.nu/maps';
    var mapKey = '';
    chrome.storage.sync.get({
        ppLocationMapSize: 'default',
        ppLocationMapUrl: 'https://www.valerio.nu/maps',
        ppLocationMapKey: ''
    }, function(items) {
        mapSize = items.ppLocationMapSize;
        if (typeof items.ppLocationMapUrl !== 'undefined' && items.ppLocationMapUrl !== '') {
            mapUrl = items.ppLocationMapUrl;
        }
        if (typeof items.ppLocationMapKey !== 'undefined' && items.ppLocationMapKey !== '') {
            mapKey = items.ppLocationMapKey;
        }
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes[0] !== undefined && mutation.addedNodes[0].className === 'p-tab p-tab-photo-details') {
                    setTimeout(function(){
                        var countryElement = document.getElementsByClassName('input-country')[0];
                        var iframe = document.createElement('iframe');
                        var keyParameter = mapKey !== '' ? 'customKey=' + mapKey : '';
                        iframe.src = mapUrl + '?' + keyParameter + '&initLatitude=' + 
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

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

// Receive message with new coordinates
top.window.addEventListener("message", function(message) {
    console.log(message.data);
    setTimeout(function(){
        // This is necessary because Vue.js responds by default to the input event rather than change event
        var event = new Event('input');
        var leftBox = document.getElementsByClassName('input-latitude')[0];
        leftBox.firstChild.firstChild.firstChild.childNodes[1].value = message.data.coordinates.lat;
        leftBox.firstChild.firstChild.firstChild.childNodes[1].dispatchEvent(event);
        var rightBox = document.getElementsByClassName('input-longitude')[0];
        rightBox.firstChild.firstChild.firstChild.childNodes[1].value = message.data.coordinates.lon;
        rightBox.firstChild.firstChild.firstChild.childNodes[1].dispatchEvent(event);
    }, 10);
});