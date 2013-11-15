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
	isWhite: false,
	isMixed : false,
	isIgnore : false,
	isNewTabUrl : false,
};

function prepRedirect() {
    $('#redirect').css('display', 'block');

	$('#r_site').text(data.redirect.site);
	$('#r_site2').text(data.redirect.site);

	$('#r_add')[0].addEventListener('click', function() {
		modifyWhiteList("add", data.redirect.site, false);
	});

    $('#r_opt')[0].addEventListener('click', openOptions);
};

function prepWhoops() {
    $('#whoops').css('display', 'block');
	
	if (data.whoops.action == "add") {
		$('#w_prev').text("added " + data.whoops.site + " to the whitelist.");
		$('#w_action').text("remove " + data.whoops.site + ".");
		
		$('#w_undo')[0].addEventListener('click', function() {
			modifyWhiteList("rem", data.whoops.site, false);
		});
	} else {
		$('#w_prev').text("removed " + data.whoops.site + " from the whitelist.");
		$('#w_action').text("re-add " + data.whoops.site + ".");
		
		$('#w_undo')[0].addEventListener('click', function() {
			modifyWhiteList("add", data.whoops.site, false);
		});
	}

    $('#w_opt')[0].addEventListener('click', openOptions);
};

function prepIgnorable() {
    $('#ignore_page').css('display', 'block');
	
    $('#ip_opt')[0].addEventListener('click', openOptions);
};

function prepAllWhite() {
    $('#allwhite').css('display', 'block');
	$('#aw_site').text(data.curTabSite);
	var wle = getWhitelistEntry(data.curTabSite);
	$('#aw_wle').text(wle);
	$('#aw_wle2').text(wle);
	
    $('#aw_rem')[0].addEventListener('click', function() {
		modifyWhiteList("rem", wle);
    });

    $('#aw_opt')[0].addEventListener('click', openOptions);
};

function prepAllBlack() {
    $('#allblack').css('display', 'block');
	$('#ab_site').text(data.curTabSite);
	$('#ab_site2').text(data.curTabSite);

    $('#ab_add')[0].addEventListener('click', function() {
		modifyWhiteList("add", data.curTabSite);
    });

    $('#ab_opt')[0].addEventListener('click', openOptions);
};

function prepMixedWhite() {
    $('#mixedwhite').css('display', 'block');
	$('#mw_site').text(data.curTabSite);
	var wle = getWhitelistEntry(data.curTabSite);
	$('#mw_wle').text(wle);

    $('#mw_rem')[0].addEventListener('click', function() {
		modifyWhiteList("rem", wle);
    });

    $('#mw_close')[0].addEventListener('click', closeBlackTabs);	

    $('#mw_opt')[0].addEventListener('click', openOptions);
};

function prepMixedBlack() {
    $('#mixedblack').css('display', 'block');
	$('#mb_site').text(data.curTabSite);
	$('#mb_site2').text(data.curTabSite);

    $('#mb_add')[0].addEventListener('click', function() {
		modifyWhiteList("add", data.curTabSite);
    });	

    $('#mb_close')[0].addEventListener('click', closeBlackTabs);

    $('#mb_opt')[0].addEventListener('click', openOptions);
};

function openOptions() {
	chrome.tabs.create({url: "options.html"});
	window.close();
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
	
	// finished with popup
	window.close();
};

function modifyWhiteList(action, site, createUndo) {
	if(typeof(createUndo)==='undefined') createUndo = true;
	
	if (action == "add") {
	    // check for duplicates
		if (settings.wl.indexOf(site) != -1) {
			return;
		}

		/* add to settings */
		settings.wl.push(site);
		settings.wl.sort();
		
	} else if (action == "rem") {
	
		var index = settings.wl.indexOf(site);
	
		if (index != -1) {
			settings.wl.splice(index, 1);
		}
	} else {
		console.log("Invalid WL modification method: " + action);
	}

	// finalize changes
	saveSettings();

	// create undo entry
	data.whoops = {
		'hasWhoops' : createUndo,
		'timestamp' : Date.now(),
		'action': action,
		'site': site,
	};
		
	chrome.extension.getBackgroundPage().popup_whoops = data.whoops;
	
	// done with popup
	window.close();
};

function dispatch() {

	if (data.redirect.hasRedirect) {
		if (data.redirect.timestamp >= (Date.now() - 10000)) {
			prepRedirect();
			return;
		} else {
			data.whoops.hasRedirect = false;
			chrome.extension.getBackgroundPage().popup_redirect = data.redirect;
		}
	} 

	if (data.whoops.hasWhoops) {
		if (data.whoops.timestamp >= (Date.now() - 10000)) {
			prepWhoops();
			return;
		} else {
			data.whoops.hasWhoops = false;
			chrome.extension.getBackgroundPage().popup_whoops = data.whoops;
		}
	} 
	
	if (data.isIgnore || data.isNewTabUrl) {
		prepIgnorable();
	} else if (data.isMixed) {
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
};

/*
 * This event fires each time the popup is opened, so we can examine the state
 * of things and decide how we want to write out the content.
 */
document.addEventListener('DOMContentLoaded', function () {

	// set up basic events
	$('.status').on('click', function(e){window.close()});
	$('.ainfo').on('click', function(e){window.close()});

	// collect asynchronous data
	settings = chrome.extension.getBackgroundPage().settings;
	data.tabReg = chrome.extension.getBackgroundPage().tabReg;
	data.whoops = chrome.extension.getBackgroundPage().popup_whoops;
	data.redirect = chrome.extension.getBackgroundPage().popup_redirect;
	data.curTabId = data.tabReg.curActiveTabId;
	data.isBlack = data.tabReg.isBlack(data.curTabId);
	data.isWhite = data.tabReg.isWhite(data.curTabId);
	data.isMixed = data.tabReg.isMixed();

	if (data.curTabId < 0) {
		data.isIgnore = true;
		dispatch();
	} else {
		// chain the collection of synchronous data
		chrome.tabs.get(data.curTabId, function(tab) {
			data.curTabUrl = tab.url;
			data.curTabSite = extractSiteFromUrl(tab.url);
			data.isIgnore = isIgnorableUrl(tab.url);
			data.isNewTabUrl = isNewTabUrl(tab.url);
			dispatch();
		});
	}
});
