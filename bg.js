// bg.js - event page for Great Barrier

var settings = {
    "protect_new" : true,
    "warn_mixed" : true,
    "wl" : new Array("en.wikipedia.org", "google.ca")
}

var tabReg = {
    addWhite : function(tabId){
			if (tabId == -1) {
				console.log("(" + tabId +  ") ignoring blank tab");
				return;
			}

			this.add(tabId, 'white');
        },

    addBlack : function(tabId) {
			this.add(tabId, 'black');
        },
		
	addUnused : function(tabId) {
			this.add(tabId, 'unused');
		},
		
	add : function(tabId, type) {
            if (this._list.hasOwnProperty(tabId))
				this[this._list[tabId]] -= 1;
			
			this._list[tabId] = type;
			this[type] += 1;
			console.log("(" + tabId +  ") registered as " + type);
        },
    
    isWhite : function(tabId){
            if (this._list.hasOwnProperty(tabId))
                return this._list[tabId] == 'white';
            
            return false;
        },
     
    isBlack : function(tabId){
            if (this._list.hasOwnProperty(tabId))
                return this._list[tabId] == 'black';
            
            return false;
        },
		
	isUnused : function(tabId){
            if (this._list.hasOwnProperty(tabId))
                return this._list[tabId] == 'unused';
            
            return false;
        },
    
    rem : function(tabId){
            if (this._list.hasOwnProperty(tabId)) {
				this[this._list[tabId]] -= 1;
            
    			delete this._list[tabId];
                console.log("(" + tabId +  ") deregistered");
            }
        },
        
    isMixed : function() {
            return ((this['white'] > 0) && (this['black'] > 0));
        },
    
    lastMixedState : false,
    
    _list : {},
    'white' : 0,
    'black' : 0,
	'unused' : 0,
};

/*
 * Loads any synced settings or creates defaults
 */
function loadSettings() {

    chrome.storage.local.get(null, function(res) {
        
        if (res.timestamp) {
            settings = res;
        } else {
            // no settings object found, so leave settings as default
            console.log("No sync'd settings found; using defaults");
        }
    });
};

function isOnWhitelist(url){

    if (url.indexOf("http://") == 0) {
        url = url.replace("http://", "");
    } else if (url.indexOf("https://") == 0) {
        url = url.replace("https://", "");
    }

    var firstSlash = url.indexOf("/");

	for (var i = 0; i < settings.wl.length; ++i) {
	    var wle = settings.wl[i];
		var iof = url.indexOf(wle);
	    
		if ((iof >= 0) && (iof + wle.length <= firstSlash))
			return true;
	}
	
	return false;
};

var newTabUrls = ["chrome://newtab/", "/webhp?sourceid=chrome-instant"];

function isNewTabUrl(url) {
	for (var i = 0; i < newTabUrls.length; ++i){
		if (url.indexOf(newTabUrls[i]) >= 0){
			return true;
		}
	}
			
	return false;
}

/*
 * Checks each page after loading to see if it should be given "white" status
 */
function onCompletedHandler(info) {
    console.log("(" + info.tabId +  ") onComplete: " + info.url);
	
    if (isNewTabUrl(info.url)) {
        if (settings.protect_new) {
            console.log("(" + info.tabId +  ") registering new tab as per user-preference");
            tabReg.addWhite(info.tabId);
        } else {
            console.log("(" + info.tabId +  ") ignoring new tab as per user-preference");
        }
	} else if (isOnWhitelist(info.url)) {
	    tabReg.addWhite(info.tabId);
	} else {
	    tabReg.addBlack(info.tabId);
	}
	
	checkMixedStatus();
	
    updateUI(info.tabId);
};

var notif = {
	type: "basic",
	title: "Mixed Tabs Warning",
	message: "You have whitelisted and non-whitelisted tabs open together. For optimal security, you should open non-whitelisted sites in an Incognito window.",
	buttons: [{title: "Close non-whitelisted tabs"}, {title: "Okay, Thanks!"}],
	iconUrl: "warning.png"
}

function checkMixedStatus() {

    var curMixedState = tabReg.isMixed();
    
	if (curMixedState != tabReg.lastMixedState) {
        tabReg.lastMixedState = curMixedState;
        
	    if (tabReg.isMixed()) {
	        console.log("Mixed tabs now exist");
			
			if (settings.warn_mixed) {
				chrome.notifications.create("mixedTabsWarning", notif, function(nId){
					console.log("mixed tabs warning notification raised");
				});
			}
	        
	    } else {
	        console.log("No more mixed tabs");
			
			chrome.notifications.clear("mixedTabsWarning",function(wasCleared){
				console.log("mixed tabs warning notification cleared");
			});
	    }
	}
};

function updateUI(tabId) {

    // TODO:  update popup to be context sensitive?
    
    if (tabReg.isMixed()) {
        if (tabReg.isBlack(tabId)) {
            chrome.browserAction.setIcon({path: "icon_mixed_b.png"});
        } else {
            chrome.browserAction.setIcon({path: "icon_mixed_w.png"});
        }
    } else {
        chrome.browserAction.setIcon({path: "icon_good.png"});
    }   
}

function onBeforeRequestHandler(info) {

	if (tabReg.isWhite(info.tabId) || tabReg.isUnused(info.tabId)) {
		if (isOnWhitelist(info.url)) {
			// 	.. allow nav to proceed unhindered
			return {cancel : false}
		} else {
			//  .. cancel, and open in an Incognito window
			
			console.log("(" + info.tabId +  ") Redirecting non-whitelist entry to " + info.url);
			
			chrome.windows.create({url: info.url, incognito: true});

			if (tabReg.isUnused(info.tabId)) {
				// This tab has never had an onCompleted event, then it is 
				// probably safe to close it.
				window.setTimeout(function(){chrome.tabs.remove(info.tabId)}, 200);
			}

			// ultimate hack right here: stop the navigation on the original
			// tab without chrome putting up an error screen
			return {redirectUrl : "javascript:return false;"};
			
		}
	} else {
	    // tab is black; we don't control navigation on black tabs.  If the nav
	    // is to a whitelisted page, the tab will become registered when
	    // onCompleted runs.
		console.log("(" + info.tabId +  ") ignoring nav to " + info.url);
	}
};

function onCreatedHandler(tab) {
    if (isNewTabUrl(tab.url)) {
        if (settings.protect_new) {
            console.log("(" + tab.id +  ") registering new tab as per user-preference");
            tabReg.addWhite(tab.id);
        } else {
            console.log("(" + tab.id +  ") ignoring new tab as per user-preference");
        }
    } else if (tab.url.indexOf("chrome") == 0) {
		console.log("(" + tab.id +  ") ignoring built-in page " + tab.url);
		
    } else if (tabReg.isWhite(tab.openerTabId)) {
		console.log("(" + tab.id +  ") registering tab opened by " + tab.openerTabId + " at " + tab.url);
		tabReg.addUnused(tab.id);
	}
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
	    tabReg.rem(tabId);
	    checkMixedStatus();
	    updateUI();
	});
	
	chrome.tabs.onCreated.addListener(onCreatedHandler);
	
	chrome.tabs.onActivated.addListener(function(info){
	    console.log("(" + info.tabId + ") now active");
        updateUI(info.tabId);
	});
}

/*
 * Application start-up here
 */
init();
