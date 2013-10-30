function prepAllWhite() {
    $('#allwhite').css('display', 'block');
};

function prepAllBlack() {
    $('#allblack').css('display', 'block');
};

function prepMixedWhite() {
    $('#mixedwhite').css('display', 'block');
};

function prepMixedBlack() {
    $('#mixedblack').css('display', 'block');
};

/*
 * This event fires each time the popup is opened, so we can examine the state
 * of things and decide how we want to write out the content.
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContentLoaded');
  
  var tabReg = chrome.extension.getBackgroundPage().tabReg;
  var myTabId = tabReg.curActiveTabId;
  var isBlack = tabReg.isBlack(myTabId);
  
  if (tabReg.isMixed()) {
    if (isBlack) {
      prepMixedBlack();
    } else {
      prepMixedWhite();
    }
  } else {
    
    if (isBlack) {
      prepAllBlack();
    } else {
      prepAllWhite();
    }
  }
});

