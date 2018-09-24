var secureToken = null;
var secureTokenLogin = null;

/**
 * Init Mainpage
 */
var initBsPage = function () {
    window.buildingPageKeyName = 'BSPAGE';
    init('https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/html/siteTemplate.html', function() {
        var secureLoginContainer = $('input[name=security_token]');
        if(secureLoginContainer.length){
            secureTokenLogin = secureLoginContainer.attr("value");
        }
        
        var secureContainer = $("meta[name='security_token']");
        if(secureContainer.length){
            secureToken = secureContainer.attr("content");
        }
    });
}

/**
 * Init Mediaplayer
 */
var initMediaplayer = function () {
    window.buildingPageKeyName = 'MEDIAPLAYER';
    init('https://kartoffeleintopf.github.io/Pr0jectWatch/BsMediaplayer/html/mediaTemplate.html');
}

/**
 * Hoster Support.
 */
var hosterSupport = [['OpenLoadHD', true], ['Streamcherry', true], ['Streamango', true], ['OpenLoad', true], ['Vidto', true], ['vevio', true], ['Vidoza', true], ['Vivo', true], ['TheVideo', false], ['AuroraVid', false], ['FlashX', false], ['YouWatch', false], ['CloudTime', false], ['streamplay', false]];

/**
 * Get Default Hoster.
 */
var defaultHoster = ((arr, n) => arr.map(x => x[n]))(hosterSupport, 0);

/**
 * Definded Colorstyles
 */
var styleColors = {
    Default: 'https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/customStyles/defaultColor.css',
    DefaultDark: 'https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/customStyles/defaultColorDark.css'
}

/**
 * Loads an HTML-File as the new Page and provides some functions for manipulating the Site before and after loading.
 * @param pageURL {String} - Path to the HTML-File.
 */
var init = async function (pageUrl, callback) {
    makeBlackPage();

    window.startingHtmlPageUrl = pageUrl;

    if (document.readyState !== 'complete') {
        $(document).ready(function() {
            
            if(typeof callback == 'function'){
                callback();
            }
            
            buildPage();
        });
    } else {
        
        if(typeof callback == 'function'){
            callback();
        }
        
        buildPage();
    }
}

var buildPage = function () {
    $.get(startingHtmlPageUrl, function (newContent) {
        (async function () {
            if (typeof onBeforeDocumentLoad === 'function') {
                await onBeforeDocumentLoad();
            }

            newContent = newContent.replace(/(\r\n|\n|\r)/gm, "").split('></').join('> </');

            //Parse String to DOM-Elemnts
            var parser = new DOMParser();
            var newDoc = parser.parseFromString(newContent, "text/xml");

            //No Jquery - Jquery execute Script Tags - Remove Script from Old-DOM
            var buffer = document.getElementsByTagName('body')[0].cloneNode(true);
            var iter = buffer.getElementsByTagName('script');
            for (let i = (iter.length - 1); i >= 0; i--) {
                iter[i].outerHTML = '';
            }

            await loadStyleColors(newDoc);

            replaceDocument(newDoc, buffer);

            //Start Page Javascript
            if (buildingPageKeyName === 'BSPAGE') {
                startBsPageJs();
            }

            var stopLoading = false;
            if (typeof onDocumentReady === 'function') {
                stopLoading = await onDocumentReady();
            }

            //Load event doesn't work by dynamic content
            var onStylesApplied = setInterval(function () {
                    (async function () {
                        if ($('body').css('opacity') == '1' && $('body').css('visibility') == 'visible') {
                            clearInterval(onStylesApplied);
                            if (stopLoading !== true) {
                                if (typeof onDocumentLoaded === 'function') {
                                    stopLoading = await onDocumentLoaded();
                                }
                                if (stopLoading !== true) {
                                    if(secureTokenLogin !== null) {
                                        $("#loginWindow form").append('<input type="hidden" name="security_token" value="' + secureTokenLogin + '">')
                                    }
                                    
                                    if(secureToken !== null) {
                                        $("head:first").append('<meta name="security_token" content="' + secureToken + '">');
                                    }
                                    
                                    removeBlackPage();
                                }
                            }
                        }
                    })();
                }, 100);

            checkIfStylesExist();
        })();
    }, 'text');
}

var checkIfStylesExist = async function () {
    $.ajax({
        url: await getData('style', styleColors.Default) ,
        type: 'HEAD',
        error: function () {
            //file not exists
            $('body').css({
                'opacity': '1',
                'visibility': 'visible',
            });
        },
        success: function () {
            //file exists
        }
    });
}

/**
 * Replaces the default Colors with the From the Settings
 */
var loadStyleColors = async function (doc) {
    var styleLink = await getData('style', styleColors.Default);
    doc.getElementById('defineColors').setAttribute('href', styleLink);
}

/**
 * Replaces the entire Document with a new one places the old one in an undisplayed container.
 * @param doc {DOM} - The new Document as non jquery DOM element Head and body need to be included.
 * @param oldDocument {DOM} - The original Document Body can be manipulated.
 */
var replaceDocument = function (doc, oldDocument) {
    // Load New Page
    var newBody = doc.getElementsByTagName('body')[0];
    var newHead = doc.getElementsByTagName('head')[0];
    var old = '<div id="oldBody" style="display:none;">' + oldDocument.innerHTML + '</div>';

    if (buildingPageKeyName === 'MEDIAPLAYER') {
        old = '<div id="oldBody" style="display:none;"></div>';
    }

    $('body:first').empty().append(old).prepend(newBody.innerHTML);
    $('head:first').empty().append(newHead.innerHTML);

    copyAttributes(doc.getElementsByTagName('html')[0], document.getElementsByTagName('html')[0]);
    copyAttributes(newBody, document.body);
    copyAttributes(newHead, document.head);
}

/**
 * Copy all Attributes from one DOM element to another.
 * @param elem1 {DOM} - Copy Element
 * @param elem2 {DOM} - Paste Element
 */
var copyAttributes = function (elem1, elem2) {
    while (elem2.attributes.length > 0) {
        elem2.removeAttribute(elem2.attributes[0].name);
    }

    var $select = $(elem1);
    var $div = $(elem2);

    var attributes = $select.prop("attributes");

    // loop through <select> attributes and apply them on <div>
    $.each(attributes, function () {
        $div.attr(this.name, this.value);
    });
}

/**
 * Removes the {DOM} blackP and adds the {DOM} keyonly container.
 */
var removeBlackPage = function () {
    $("#blackP").remove();
    document.documentElement.style.overflow = 'auto'; // firefox, chrome
}

/**
 * Makes the {DOM} blackP at the top.
 */
var makeBlackPage = function () {
    if(document.getElementById("blackP") === null){
        //Black page over original
        var $black = $("<div>", {
                'id': 'blackP',
                'style': 'width:100%; height:100%; position:fixed; top:0; left:0; background:#000; z-index:9999999'
            });
        $(document.documentElement).append($black);
        document.documentElement.style.overflow = 'hidden'; // firefox, chrome
    }
}

/**
 * Get Get-Value from Get ... -,-
 */
var getGetter = function (key, defaultValue) {
    var getter = window.location.search.split('?');
    if (getter.length == 1) {
        return defaultValue;
    }

    var returnVal = defaultValue;
    $.each(getter[1].split('&'), function (index, value) {
        var keyVal = value.split('=');
        if (keyVal[0] == key) {
            returnVal = (keyVal.length != 1) ? keyVal[1] : defaultValue;
            return false;
        }
    });

    return returnVal;
}

/**
 * Encodes an String for Uri
 */
var jEncode = function (str) {
    return encodeURI('' + str).split('?').join('%3F').split('&').join('%2F');
}

/**
 * Decodes an String for Uri
 */
var jDecode = function (str) {
    return decodeURI(('' + str).split('%2F').join('&').split('%3F').join('?'));
}
