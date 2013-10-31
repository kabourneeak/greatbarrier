/*
 * common.js
 * Some common utilities used in GB
 */

 
var settings = {
    "protect_new" : true,
    "warn_mixed" : true,
    "wl" : new Array("en.wikipedia.org", "gmail.com", "google.ca", "google.com")
}

/* 
 * Saves options to Synced Storage. 
 */
function saveSettings() {

    /* update settings object */
    settings.timestamp = Date.now();
    
    /* save */
    chrome.storage.local.set(settings, function(){
        console.log("Settings saved: " + settings.timestamp);
    });
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
            console.log("No saved settings found; using defaults");
        }
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
