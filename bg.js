// bg.js - event page for Great Barrier

var settings = {
    "reuse" : false,
    "block" : true,
    "warnmixed" : true,
    "wl" : new Array("en.wikipedia.org", "www.google.ca")
}

var registeredTabs = {};

/*
 * Loads any synced settings or creates defaults
 */
function loadSettings() {

    chrome.storage.local.get(null, function(res) {
        
        if (res.timestamp) {
            settings = res;
        }
        else {
            // no settings object found, so leave settings as default
            console.log("No sync'd settings found; using defaults");
        }
    });
};

function isOnWhitelist(url){

    if (url.indexOf("http://") == 0)
        url = url.replace("http://", "");
    else if (url.indexOf("https://") == 0)
        url = url.replace("https://", "");

    var firstSlash = url.indexOf("/");

	for (var i = 0; i < settings.wl.length; ++i) {
	    var wle = settings.wl[i];
		var iof = url.indexOf(wle);
	    
		if ((iof >= 0) && (iof + wle.length <= firstSlash))
			return true;

	}
	
	return false;
};

var warningIcon = "data:image/png;base64,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"

/*
 * Checks each page after loading to see if it should be given "white" status
 */
function onCompletedHandler(info) {
    console.log("(" + info.tabId +  ") onComplete: " + info.url);
	
	if (isOnWhitelist(info.url))
	{
		if (info.tabId == -1) {
			// we don't register -1, since this would prevent the user from ever
			// navigating somewhere via the address bar
			console.log("Skipping registration of tab -1");
		} else {
			registerBarrier(info);
		}
	}
	else
	{
	    // TODO: check for mixed tabs condition
	
	    var notif = {
				type: "basic",
				title: "You are mixing trusted and untrusted tabs",
				message: "You have just opened a trusted site in the same window as one or more untrusted sites. For optimal security, you should open your untrusted sites in an Incognito window",
				buttons: [{title: "Close untrusted tabs"}, {title: "Ignore this warning"}],
				iconUrl: warningIcon
			}

		// chrome.notifications.create("n1234", notif, function(nId){});
	}
};

function onBeforeRequestHandler(info) {

	if (registeredTabs.hasOwnProperty(info.tabId))
	{
		if (isOnWhitelist(info.url))
		{
			// 	.. allow
			return {cancel : false}
			
			// will get checked for registration by onComplete
		}
		else
		{
			//  .. cancel, and open in an Incognito window
			
			// we should remember any Incognito window we open and reuse it if it is
			// still open
			
			console.log("Redirected non-whitelist entry to " + info.url);
			
			chrome.windows.create({url: info.url, incognito: true});

			// ultimate hack right here:
			return {redirectUrl : "javascript:window.history.go(0)"};
		}
	} else {
		console.log("ignoring request on tab " + info.tabId + " to " + info.url);
	}
};

function registerBarrier(info) {
	registeredTabs[info.tabId] = "registered";
	console.log("registered " + info.tabId);
};

function init() {
	console.log("Starting extension");
	
	/* load settings */
	loadSettings();
	
	/* hook events */
	
	// Page-watching events
	var filters = {
			urls: ["http://*/*", "https://*/*"],
			types: ["main_frame"]
		};

	chrome.webRequest.onCompleted.addListener(onCompletedHandler, filters);
	chrome.webRequest.onBeforeRequest.addListener(onBeforeRequestHandler, filters, ["blocking"]);
	
	// Settings update events
	chrome.storage.onChanged.addListener(function(changes, area) {
		console.log("Settings have been updated");
		for (key in changes) {
			settings[key] = changes[key].newValue;
		}
	});
	
	// Tab events
	chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
		if (registeredTabs.hasOwnProperty(tabId)) {
			console.log("deregistering Tab " + tabId);
			delete registeredTabs[tabId];
		}
	});
	
	chrome.tabs.onCreated.addListener(function(tab){
		if (registeredTabs.hasOwnProperty(tab.openerTabId)) {
			console.log("registering tab " + tab.id + " opened by " + tab.openerTabId);
			registeredTabs[tab.id] = "registered";
		}
	});
	
}

/*
 * Application start-up here
 */
init();
