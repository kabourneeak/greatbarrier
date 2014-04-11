
/*
 * Loads any synced settings or creates defaults
 */
function initSettings() {

    chrome.storage.local.get(null, function(res) {
        
        if (res.timestamp) {
            settings = res;
        }
        else {
            // no settings object found, so leave settings as default
            console.log("No sync'd settings found; using defaults");
        }
        
        applySettings();
    });
};

/*
 * Applies settings to interface
 */
function applySettings() {

    $("#warn_mixed").prop("checked", settings.warn_mixed);
    $("#protect_new").prop("checked", settings.protect_new);

    // write out whitelist
    createWlUI();
};

function deleteWlEntry(index) {

    console.log("delete entry " + index);    
    
    settings.wl.splice(index, 1);

    saveSettings();
    
    createWlUI();
};

function createWlUI() {

    // delete current stuff
    $('#whitelist .wl_entry').remove();
    
    // add entire list    
    for(var i = 0; i < settings.wl.length; ++i) {
        wle = settings.wl[i];
        
        var li = createWlEntryUI(i, wle);
        
        $("#whitelist")[0].appendChild(li);
    }

}

/*
 * Creates the DOM Subtree corresponding to a WL entry
 */
function createWlEntryUI(index, url) {

    var url_t = document.createTextNode(url);

    var dt = document.createElement("dt");
    dt.appendChild(url_t);
    
    var dl = document.createElement("dl");
    dl.appendChild(dt);
    
    var a_item = document.createElement("a");
    a_item.appendChild(dl);
    a_item.href = "#";
    
    var a_del = document.createElement("a");
    var a_del_t = document.createTextNode("delete");
    a_del.appendChild(a_del_t);
    a_del.href = "#";
    a_del.id = "del_" + index;
    a_del.className = "delete";
    a_del.addEventListener('click', function(e){
        e.preventDefault();
        deleteWlEntry(index);
    }, false);
    
    var li = document.createElement("li");
    li.appendChild(a_item);
    li.appendChild(a_del);
    li.id = "li_" + index;
    li.className = "wl_entry";
    
    return li;
}

/*
 * Adds the URL the user has entered into the WL page to the WL proper
 */
function addNewWlEntry() {

    /* get text */
    var url = $('#new_wl').val();
    
    if (url == "") {
        return;
    } 
   
    /* validate and massage value */
    url = extractSiteFromUrl(url);
    
    // check for duplicates
    if (settings.wl.indexOf(url) != -1) {
        return;
    }

    /* add to settings */
    settings.wl.push(url);
    settings.wl.sort();
    
    // clear input
    $('#new_wl').val("");

    // add to UI
    createWlUI();
};

function initEvents() {

    $('#protect_new')[0].addEventListener('change', function() {
        settings.protect_new = $('#protect_new').prop("checked");
        saveSettings();
    });

    $('#warn_mixed')[0].addEventListener('change', function() {
        settings.warn_mixed = $('#warn_mixed').prop("checked");
        saveSettings();
    });
    
    $('#new_wl')[0].addEventListener('keyup', function(e) {
      if (e.keyCode == 13) {
        addNewWlEntry();
        saveSettings();
      }
    });
    
    $('#new_wl_save')[0].addEventListener('click', function(e) {
        e.preventDefault();
        addNewWlEntry();
        saveSettings();
    });
    
};

function initAnim() {

  // From http://roykolak.github.io/chrome-bootstrap/
  $('.menu a').click(function(ev) {
    ev.preventDefault();
    var selected = 'selected';

    $('.mainview > *').removeClass(selected);
    $('.menu li').removeClass(selected);
    setTimeout(function() {
      $('.mainview > *:not(.selected)').css('display', 'none');
    }, 100);

    $(ev.currentTarget).parent().addClass(selected);
    var currentView = $($(ev.currentTarget).attr('href'));
    currentView.css('display', 'block');
    setTimeout(function() {
      currentView.addClass(selected);
    }, 0);

    setTimeout(function() {
      $('body')[0].scrollTop = 0;
    }, 200);
  });
  
  $('.mainview > *:not(.selected)').css('display', 'none');
  
};

function initIntrospection() {
    /*
     * Look into other chrome settings and update the UI appropriately
     */
    
    chrome.extension.isAllowedIncognitoAccess(function(res){
        if (res) {
            $("#ip_off").css({'display': 'none'});
            $("#ip_on").css({'display': 'block'});
        }
        else {
            $("#ip_on").css({'display': 'none'});
            $("#ip_off").css({'display': 'block'});
        }
    });

};

document.addEventListener('DOMContentLoaded', function() {
    initSettings();
    initEvents();
    initAnim();
    initIntrospection();
    
}, false);

window.onfocus = function() {
    // re-evaluate things after returning to window
    initSettings();
    initIntrospection();
};
