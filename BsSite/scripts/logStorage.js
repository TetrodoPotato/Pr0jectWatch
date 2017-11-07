/**
 * Get the Fulllist of Logs.
 * @return {Object-Array}
 */
var getFullLog = function () {
    var log = localStorage.getItem('loglist');
    if (!log) {
        log = [];
        localStorage.setItem('loglist', JSON.stringify(log));
    } else {
        log = JSON.parse(log);
    }
    return log;
}

/**
 * Save log.
 * @param FullObjectListArray {Object-Array} - Full Log
 */
var saveLog = function (FullObjectListArray) {
    localStorage.setItem('loglist', JSON.stringify(FullObjectListArray));
}

/**
 * Set an new Log-Item and Clears Log.
 * @param seriesIdent {String} - Seriesid.
 * @param seriesName {String} - Seriesname.
 * @param seasonIndex {String} - Season Number.
 * @param episodeNameDE {String} - Episodename German.
 * @param episodeNameOr {String} - Episodename Original
 * @param episodeIndex {String} - Episode Number
 * @param episodeMax {String} - Max Numbers of Episode in the Season.
 * @param hosterName {String} - Hoster.
 */
var setLog = function (seriesIdent, seriesName, seasonIndex, episodeNameDE, episodeNameOr, episodeIndex, episodeMax, hosterName) {
    var currentdate = new Date();
    var datetime = fillZeros(currentdate.getDate()) + "/"
         + fillZeros((currentdate.getMonth() + 1)) + "/"
         + fillZeros(currentdate.getFullYear()) + " "
         + fillZeros(currentdate.getHours()) + ":"
         + fillZeros(currentdate.getMinutes()) + ":"
         + fillZeros(currentdate.getSeconds());

    var list = getFullLog();
    list.push({
        seriesId: seriesIdent,
        series: seriesName,
        season: seasonIndex,
        episodeDE: episodeNameDE,
        episodeOR: episodeNameOr,
        episodeNr: episodeIndex,
        episodes: episodeMax,
        hoster: hosterName,
        date: datetime
    });

    saveLog(list);
    clearLog();
}

/**
 * Fill a String shorter than two with leading Zeros.
 * @param str {String} - String.
 * @return {String}
 */
var fillZeros = function (str) {
    return ('0' + str).slice(-2);
}

/**
 * Removes Log-Items More Than 50 Items
 */
var clearLog = function () {
    saveLog(getFullLog().reverse().slice(0, 50).reverse());
}
