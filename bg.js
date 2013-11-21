// bg.js - event page for Great Barrier

// other settings being stored
var popup_whoops = {
    hasWhoops : false,
    timestamp : 0,
    action: "add",
    site: "",
};

var popup_redirect = {
    hasRedirect : false,
    timestamp : 0,
    site: "",
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
        
    addProtectedUnused : function(tabId) {
            this.add(tabId, 'protected');
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

    isProtectedUnused : function(tabId){
            if (this._list.hasOwnProperty(tabId))
                return this._list[tabId] == 'protected';
            
            return false;
        },
        
    isRegistered : function(tabId){
            return this._list.hasOwnProperty(tabId);
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
    'protected' : 0,
    
    curActiveTabId : -2,
};

function isOnWhitelist(url){

    url = extractSiteFromUrl(url);
    
    for (var i = 0; i < settings.wl.length; ++i) {
        var wle = settings.wl[i];
        var iof = url.indexOf(wle);
        
        if ((iof >= 0) && (iof + wle.length == url.length))
            return true;
    }
    
    return false;
};

function rebuildRegistry() {

    chrome.tabs.query({}, function(tabs){
        console.log("rebuilding tab registry...");
    
        // re-evaluate every tab
        for (var i = 0; i < tabs.length; ++i) {
            tabReg.rem(tabs[i].id);
            evalTab(tabs[i].id, tabs[i].url);
        }

        // update context-sensitive UI bits
        for (var i = 0; i < tabs.length; ++i) {
            updateUI(tabs[i].id);
        }
        
        console.log("rebuilding tab registry... complete");
    });
};

function evalTab(tabId, url) {

    if (isNewTabUrl(url)) {
        tabReg.addUnused(tabId);

    } else if (isIgnorableUrl(url)) {
        tabReg.rem(tabId);
        console.log("(" + tabId +  ") ignoring this tab (built-in, etc.)");

    } else if (isOnWhitelist(url)) {
        tabReg.addWhite(tabId);
        
    } else {
        tabReg.addBlack(tabId);
    }
    
};

/*
 * Checks each page after loading to see if it should be given "white" status
 */
function onCompletedHandler(info) {
    console.log("(" + info.tabId +  ") onComplete: " + info.url);
    
    evalTab(info.tabId, info.url);
    
    checkMixedStatus();
    
    updateUI(info.tabId);
};

var notif = {
    type: "basic",
    title: "Mixed Tabs Warning",
    message: "You have whitelisted and non-whitelisted tabs open together. For optimal security, you should open non-whitelisted sites in an Incognito window.",
    buttons: [{title: "Okay, got it!"},{title: "Close non-whitelisted tabs"}],
    iconUrl: "icon_gate_warn_128px.png"
};

function checkMixedStatus() {

    var curMixedState = tabReg.isMixed();
    
    if (curMixedState != tabReg.lastMixedState) {
        tabReg.lastMixedState = curMixedState;
        
        // update current tab with relevant icon
        updateUI(tabReg.curActiveTabId);

        if (tabReg.isMixed()) {
            console.log("Mixed tabs now exist");
            
            if (settings.warn_mixed) {
                chrome.notifications.create("mixedTabsWarning", notif, function(nId){
                    console.log("mixed tabs warning notification raised");
                });
            }
            
        } else {
            console.log("No more mixed tabs");
            
            chrome.notifications.clear("mixedTabsWarning", function(wasCleared){
                console.log("mixed tabs warning notification cleared");
            });
        }
    }
};

function updateUI(tabId) {
    if (tabId < 0) 
        return;
    
    if (tabReg.isMixed()) {
        if (tabReg.isBlack(tabId)) {
            chrome.browserAction.setIcon({'path': "icon_gate_x_19px.png", 'tabId': tabId});
        } else {
            chrome.browserAction.setIcon({'path': "icon_gate_warn_19px.png", 'tabId': tabId});
        }
    } else {
        chrome.browserAction.setIcon({'path': "icon_gate_aok_19px.png", 'tabId': tabId});
    }   
};

function onBeforeRequestHandler(info) {

    // check if this is a new tab (sometimes the onCreated event fires late)
    if (!(tabReg.isRegistered(info.tabId)))
        if (!isIgnorableUrl(info.url))
            tabReg.addUnused(info.tabId);

    // see if this tab qualifies for protection
    var intercede = tabReg.isWhite(info.tabId)
                    || (tabReg.isProtectedUnused(info.tabId))
                    || (tabReg.isUnused(info.tabId) && settings.protect_new);

    if (intercede) {
        if (isOnWhitelist(info.url)) {
            //  .. allow nav to proceed unhindered
            return {cancel : false}
        } else {
            //  .. cancel, and open in an Incognito window
            
            console.log("(" + info.tabId +  ") Redirecting non-whitelist entry to " + info.url);
            
            chrome.windows.create({url: info.url, incognito: true});

            if (tabReg.isUnused(info.tabId) || tabReg.isProtectedUnused(info.tabId)) {
                // This tab has never had an onCompleted event, then it is 
                // probably safe to close it.
                window.setTimeout(function(){chrome.tabs.remove(info.tabId)}, 200);
            }
            
            // record redirect for user popup action
            popup_redirect = {
                hasRedirect : true,
                timestamp : Date.now(),
                site: extractSiteFromUrl(info.url),
            };

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
        tabReg.addUnused(tab.id);
        console.log("(" + tab.id +  ") registered blank tab as 'unused'");
        
    } else if (isIgnorableUrl(tab.url)) {
        console.log("(" + tab.id +  ") ignoring built-in page " + tab.url);

    } else if (tabReg.isWhite(tab.openerTabId)) {
       console.log("(" + tab.id +  ") registering tab opened by " + tab.openerTabId + " at " + tab.url);
       tabReg.addProtectedUnused(tab.id);
        
    } else {
        tabReg.addUnused(tab.id);
        console.log("(" + tab.id +  ") registered as 'unused'");
    }   
};

function onNotifButtonHandler(nId, bId) {
    if (nId == 'mixedTabsWarning') {
        if (bId == 0) {
            /* okay, thanks! */
            chrome.notifications.clear(nId, function(wasCleared){
                console.log("mixed tabs warning notification cleared");
            });
            
        } else if (bId == 1) {
            /* close black tabs */
            
            var toClose = new Array();
            
            for (var tabId in tabReg._list) {
                if (tabReg._list[tabId] == 'black')
                    toClose.push(parseInt(tabId));
            }

            if (toClose.length > 0) {
                chrome.tabs.remove(toClose, function(){});
            }
        }
    }
};

function init() {
    console.log("Starting extension");
    
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
        
        rebuildRegistry();
    });
    
    // Tab events
    chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
        tabReg.rem(tabId);
        checkMixedStatus();
        // no need to updateUI since tab is gone!
    });
    
    chrome.tabs.onCreated.addListener(onCreatedHandler);
    chrome.tabs.onUpdated.addListener(function(tabId, chg, tab) {
        updateUI(tabId)
    });
    
    chrome.tabs.onActivated.addListener(function(info){
        console.log("(" + info.tabId + ") now active");
        tabReg.curActiveTabId = info.tabId;
        updateUI(info.tabId);
    });
    
    chrome.windows.onFocusChanged.addListener(function(wid){
        if (wid != chrome.windows.WINDOW_ID_NONE) {
            chrome.tabs.query({'active': true, 'currentWindow': true}, function(tabs) {
                tabReg.curActiveTabId = tabs[0].id;
                updateUI(tabs[0].id);
            });
        }
    });
    
    /* load settings */
    loadSettings(function(){rebuildRegistry();});
    
    // Notification events
    chrome.notifications.onButtonClicked.addListener(onNotifButtonHandler);
    chrome.notifications.onClicked.addListener(function(nId){
        chrome.notifications.clear(nId, function(wasCleared){
            console.log("mixed tabs warning notification cleared");
        });
    });
};

/*
 * Application start-up here
 */
init();
