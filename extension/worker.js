chrome.runtime.onInstalled.addListener(function() {
  console.log('I am a service worker, you can change me in the file worker.js. A service worker can print stuff in the console, cool! Discover what else a service worker can do at this page: https://developer.chrome.com/docs/extensions/mv3/background_pages/')
});