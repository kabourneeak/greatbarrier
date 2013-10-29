document.addEventListener('DOMContentLoaded', function () {
  console.log("DOMContentLoaded");
  
  chrome.extension.getBackgroundPage();
  
  $('#injecthere').text("Opened at Y " + date.now());
  
});

