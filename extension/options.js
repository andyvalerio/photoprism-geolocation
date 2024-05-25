// Saves options to chrome.storage
function save_options() {
    var size = document.getElementById('size').value;

    chrome.storage.sync.set({
      ppLocationMapSize: size,
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
    }, function(items) {
      document.getElementById('size').value = items.ppLocationMapSize;
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);
  