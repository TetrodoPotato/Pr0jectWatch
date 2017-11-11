/**
 * Set a cookie.
 * @param {String} name - cookie name.
 * @param {String} value - cookie value.
 * @param {Boolean} perma - if the cookie doesn't expire after Browser close.
 */
var setCookie = function (name, value, perma) {
    var expires = '';

    //For permanent cookie
    if (perma) {
        var d = new Date();
        //expires in 9999days
        d.setTime(d.getTime() + (9999 * 24 * 60 * 60 * 1000));
        var expires = ";expires=" + d.toUTCString();
    }
    //For subdomains
    var website_host;
    var website_host_buff = window.location.hostname;

    if (website_host_buff.split('.').length > 2) {
        var buffHost = website_host_buff.split('.');
        website_host = buffHost[buffHost.length - 2] + '.' + buffHost[buffHost.length - 1];
    } else {
        website_host = website_host_buff;
    }

    //Create new cookie
    document.cookie = name + "=" + value + expires + ";path=/;domain=." + website_host;
}

/**
 * Get a cookie.
 * @param {String} cname - name of cookie.
 * @return int/float/boolean/string. Undefined if cookie dont exist.
 */
var getCookie = function (cname) {
    //Name if the cookie
    var name = cname + "=";
    //The complete cookie string
    var decodedCookie = decodeURIComponent(document.cookie);
    //Cookie array
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        //Current cookie
        var c = ca[i].trim();

        //When the name is part of the string
        if (c.indexOf(name) == 0) {
            //Only the string value after 'cname='
            var returnVal = c.substring(name.length, c.length);

            //Pase values in boolean int and string
            if (returnVal.toLowerCase() == 'true') {
                return true;
            } else if (returnVal.length == 0) {
                return '';
            } else if (returnVal.toLowerCase() == 'false') {
                return false;
            } else if (!isNaN(returnVal) && returnVal.toString().indexOf('.') != -1) {
                return parseFloat(returnVal);
            } else if (!isNaN(returnVal)) {
                return parseInt(returnVal);
            } else {
                return returnVal;
            }
        }
    }
    //Cookie is undefined when not found
    return undefined;
}

/**
 * Remove a cookie.
 * @param {String} name - name of cookie.
 */
var removeCookie = function (name) {
    var expires = ';expires=Thu, 01 Jan 1970 00:00:00 UTC';

    //For subdomains
    var website_host;
    var website_host_buff = window.location.hostname;

    if (website_host_buff.split('.').length > 2) {
        var buffHost = website_host_buff.split('.');
        website_host = buffHost[buffHost.length - 2] + '.' + buffHost[buffHost.length - 1];
    } else {
        website_host = website_host_buff;
    }

    //Create new cookie
    document.cookie = name + "=" + expires + ";path=/;domain=." + website_host;
}

/**
 * Set Local Storage Item.
 * @param Key {String} - Key.
 * @param value {All} - value.
 */
var setLocalStorage = function (key, value) {
    localStorage[key] = value;
}

/**
 * Get local Storage.
 * @param key {String} - Key.
 * @return {ALL}
 */
var getLocalStorage = function (key) {
    var returnVal = localStorage[key];
    if (typeof returnVal !== 'undefined') {
        //Pase values in boolean int and string
        if (returnVal.toLowerCase() == 'true') {
            return true;
        } else if (returnVal.length == 0) {
            return '';
        } else if (returnVal.toLowerCase() == 'false') {
            return false;
        } else if (!isNaN(returnVal) && returnVal.toString().indexOf('.') != -1) {
            return parseFloat(returnVal);
        } else if (!isNaN(returnVal)) {
            return parseInt(returnVal);
        } else {
            return returnVal;
        }
    }
    return undefined;
}

/**
 * Set data value.
 * @param key {String} - Key.
 * @param value {All} - value.
 * @param perma {Boolean} - if Value is Permanent. Exist after Browserclose. 
 */
var setData = function (key, value, perma) {
    if (perma) {
        setLocalStorage(key, value);
    } else {
        setCookie(key, value, false);
    }
}

/**
 * Get Data from Cookie of Localstoreage.
 * @param key {String} - Key.
 * @param deefaultValue {All} - Value if Value is undefinded.
 * @return {All}
 */
var getData = function (key, defaultValue) {
    var value = getCookie(key);
    if (typeof value === 'undefined') {
        value = getLocalStorage(key);
        if (typeof value !== 'undefined') {
            return value;
        }
    } else {
        return value;
    }

    return defaultValue;
}

/**
 * Clear all Autoplay Buffers
 */
var clearAutoplayBuffer = function () {
    setData('lastSeries', 'none');
    setData('lastSeason', 'none');
    setData('lastEpisode', 'none');
    setData('isPlayingPlaylist', false);
}