/*
 * common.js
 * Some common utilities used in GB
 */

 
var settings = {
    "timestamp" : 0,
	"protect_new" : false,
    "warn_mixed" : true,
	"save_history" : false,
	"auto_sync_timestamp" : 0,
    "wl" : new Array("en.wikipedia.org", "gmail.com", "google.ca", "google.com", "googleusercontent.com")
}

var lo_settings = {
	// settings that are only stored locally, and never synced
    "timestamp" : 0,
	"auto_sync" : true,
}

var newTabUrls = ["chrome://newtab/",
	"/webhp?sourceid=chrome-instant",
	"/_/chrome/newtab"];

function saveSettings() {

    /* update settings object */
    settings.timestamp = Date.now();
    lo_settings.timestamp = Date.now();

    /* save */
    chrome.storage.local.set(settings, function(){
        console.log("Settings (primary) saved: " + settings.timestamp);
    });

    chrome.storage.local.set(lo_settings, function(){
        console.log("Settings (local) saved: " + lo_settings.timestamp);
    });
	
};

function saveSettingsSync() {

    /* update settings object */
    settings.auto_sync_timestamp = Date.now();

    /* sync */
    chrome.storage.sync.set(settings, function(){
        console.log("Settings synced: " + settings.auto_sync_timestamp);
    });
}

/*
 * Loads locally-saved settings
 */
function loadSettings(callback) {

    chrome.storage.local.get(settings, function(res) {
        
        if (res.timestamp) {
            settings = res;
        } else {
            // no settings object found, so leave settings as default
            console.log("No local settings (primary) found; using defaults");
        }

		// cascade next call
		chrome.storage.local.get(lo_settings, function(res) {
			
			if (res.timestamp) {
				lo_settings = res;
			} else {
				// no settings object found, so leave settings as default
				console.log("No local settings (local only) found; using defaults");
			}
			
			// run callback
			if (typeof(callback) !== 'undefined')
				callback();
		}); 
    });	
};

function loadSettingsSync(callback) {

    chrome.storage.sync.get(settings, function(res) {
        
        if (res.timestamp) {
            settings = res;
        } else {
            // no settings object found, so leave settings as default
            console.log("No synced settings (primary) found.");
        }

		// run callback
		if (typeof(callback) !== 'undefined')
			callback();
    });
}

function mergeSettingsSync(callback) {
	// load the cloud-settings and merge the whitelists

    chrome.storage.sync.get(settings, function(res) {
        
        if (res.wl) {

			for (var i = 0; i < res.wl.length; ++i) {
				var r_url = res.wl[i];
				
				// check for duplicates
				if (settings.wl.indexOf(r_url) != -1) {
					settings.wl.push(r_url);
				}
			}
			
			settings.wl.sort();
			
        } else {
            // no settings object found, so leave settings as default
            console.log("No synced whitelist found; nothing to merge.");
        }

		// run callback
		if (typeof(callback) !== 'undefined')
			callback();
    });
};

function extractSiteFromUrl(url) {

    if (url == "")
        return;

    url = url.toLowerCase();

    // get rid of protocol
    if (url.indexOf('http://') == 0) {
        url = url.replace("http://", "");
    } else if (url.indexOf('https://') == 0) {
        url = url.replace("https://", "");
    } else {
        // do nothing
    }

    // get rid of page spec
    var firstSlash = url.indexOf("/");
    if (firstSlash > -1)
        url = url.substring(0, firstSlash);

    return url;
};

function getWhitelistEntry(site){

    for (var i = 0; i < settings.wl.length; ++i) {
        var wle = settings.wl[i];
        var iof = site.indexOf(wle);
        
        if ((iof >= 0) && (iof + wle.length == site.length))
            return wle;
    }
    
    return false;
};

function isNewTabUrl(url) {
    for (var i = 0; i < newTabUrls.length; ++i){
        if (url.indexOf(newTabUrls[i]) >= 0){
            return true;
        }
    }
            
    return false;
};

function isIgnorableUrl(url) {
    if (url.indexOf("chrome") == 0)
        return true;
        
    return false;
};
