// Saves options to chrome.storage
function save_options() {
    var size = document.getElementById('size').value;
    var url = document.getElementById('url').value;
    var key = document.getElementById('key').value;

    chrome.storage.sync.set({
      ppLocationMapSize: size,
      ppLocationMapUrl: url,
      ppLocationMapKey: key
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        ppLocationMapSize: 'default',
        ppLocationMapUrl: 'https://www.valerio.nu/maps',
        ppLocationMapKey: 'AIzaSyBHtMaeHXRipKOibjU6SjvGA2kkT-EskuQ'
    }, function(items) {
      document.getElementById('size').value = items.ppLocationMapSize;
      document.getElementById('url').value = items.ppLocationMapUrl;
      document.getElementById('key').value = items.ppLocationMapKey;
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);
  