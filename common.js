/*
 * common.js
 * Some common utilities used in GB
 */

var settings = {
	"timestamp" : 0,
    "protect_new" : false,
    "warn_mixed" : true,
	"save_history" : false,
    "wl" : new Array(
        { "url": "en.wikipedia.org", "warn_only" : false },
        { "url": "gmail.com", "warn_only": false },
        { "url": "google.ca", "warn_only": false },
        { "url": "google.com", "warn_only": false },
        { "url": "googleusercontent.com", "warn_only": false }
        )
}

var newTabUrls = ["chrome://newtab/",
	"/webhp?sourceid=chrome-instant",
	"/_/chrome/newtab"];

/* 
 * Saves options to Synced Storage. 
 */
function saveSettings() {

    /* update settings object */
    settings.timestamp = Date.now();
    
    /* save */
    chrome.storage.sync.set(settings, function(){
		if (chrome.runtime.lastError === undefined) {
			console.log("Settings saved: " + settings.timestamp);
		} else {
			console.log("Settings not saved: " + chrome.runtime.lastError.message);
			delete chrome.runtime.lastError;
		}
    });
};
 
/*
 * Loads any synced settings or creates defaults
 */
function loadSettings(callback) {

    chrome.storage.sync.get(null, function(res) {
        
        if (res.timestamp) {
            settings = res;
        } else {
            // no settings object found, so leave settings as default
            console.log("No saved settings found; using defaults");
        }
        
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
        var iof = site.indexOf(wle.url);
        
        if ((iof >= 0) && (iof + wle.url.length == site.length))
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
