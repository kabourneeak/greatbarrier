/*
 * popup.js
 */
 
/* the data needed by the various popup screens */
var data = {
	tabReg : null,
	curTabId : -2,
	curTabUrl : "?",
	curTabSite : "?",
	curTabDomain : "?",
	isBlack : false,
	isMixed : false,
}

function prepAllWhite(tab) {
    $('#allwhite').css('display', 'block');
	$('#aw_site').text(data.curTabSite);
	var wle = getWhitelistEntry(data.curTabSite);
	$('#aw_wlmatch').text(wle);
	$('#aw_wlmatch2').text(wle);
	
    $('#aw_rem')[0].addEventListener('click', function() {
		// TODO update whitelist
		
		saveSettings();
        window.close();
    });

    $('#aw_opt')[0].addEventListener('click', function() {
        chrome.tabs.create({url: "options.html"});
		window.close();
    });
};

function prepAllBlack() {
    $('#allblack').css('display', 'block');
	$('#ab_site').text(data.curTabSite);

    $('#ab_add')[0].addEventListener('click', function() {
		// TODO update whitelist
		
		saveSettings();
        window.close();
    });

    $('#ab_opt')[0].addEventListener('click', function() {
        chrome.tabs.create({url: "options.html"});
		window.close();
    });
};

function prepMixedWhite() {
    $('#mixedwhite').css('display', 'block');

    $('#mw_rem')[0].addEventListener('click', function() {
		// TODO update whitelist
		
		saveSettings();
        window.close();
    });

    $('#mw_close')[0].addEventListener('click', function() {
		closeBlackTabs();
		window.close();
    });	

    $('#mw_opt')[0].addEventListener('click', function() {
        chrome.tabs.create({url: "options.html"});
		window.close();
    });	
};

function prepMixedBlack() {
    $('#mixedblack').css('display', 'block');

    $('#mb_add')[0].addEventListener('click', function() {
		// TODO update whitelist
		
		saveSettings();
		window.close();
    });	

    $('#mb_close')[0].addEventListener('click', function() {
		closeBlackTabs();
		window.close();
    });	

    $('#mb_opt')[0].addEventListener('click', function() {
        chrome.tabs.create({url: "options.html"});
		window.close();
    });		
};

function closeBlackTabs() {
	/* close black tabs */
	
	var toClose = new Array();
	
	for (var tabId in data.tabReg._list) {
		if (data.tabReg._list[tabId] == 'black')
			toClose.push(parseInt(tabId));
	}

	if (toClose.length > 0) {
		chrome.tabs.remove(toClose, function(){});
	}
};

function dispatch() {
	if (data.isMixed) {
		if (data.isBlack) {
			prepMixedBlack();
		} else {
			prepMixedWhite();
		}
	} else {
		if (data.isBlack) {
			prepAllBlack();
		} else {
			prepAllWhite();
		}
	}
}

/*
 * This event fires each time the popup is opened, so we can examine the state
 * of things and decide how we want to write out the content.
 */
document.addEventListener('DOMContentLoaded', function () {

	// collect asynchronous data
	settings = chrome.extension.getBackgroundPage().settings;
	data.tabReg = chrome.extension.getBackgroundPage().tabReg;
	data.curTabId = data.tabReg.curActiveTabId;
	data.isBlack = data.tabReg.isBlack(data.curTabId);
	data.isMixed = data.tabReg.isMixed();

	// chain the collection of synchronous data
	chrome.tabs.get(data.curTabId, function(tab) {
		data.curTabUrl = tab.url;
		data.curTabSite = extractSiteFromUrl(tab.url);
		dispatch();
	});
});
