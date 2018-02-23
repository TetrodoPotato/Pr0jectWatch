/**
 * Get the Fulllist of Logs.
 * @return {Object-Array}
 */
var getFullLog = async function () {
    var log = await seriesStorage.storage('loglist');

    if (!log) {
        log = [];
        await seriesStorage.storage('loglist', log);
    }
    return log;
}

/**
 * Save log.
 * @param FullObjectListArray {Object-Array} - Full Log
 */
var saveLog = async function (FullObjectListArray) {
    await seriesStorage.storage('loglist', FullObjectListArray);
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
var setLog = async function (seriesIdent, seriesName, seasonIndex, episodeNameDE, episodeNameOr, episodeIndex, episodeMax, hosterName) {
    var currentdate = new Date();
    var datetime = fillZeros(currentdate.getDate()) + "/"
         + fillZeros((currentdate.getMonth() + 1)) + "/"
         + fillZeros(currentdate.getFullYear()) + " "
         + fillZeros(currentdate.getHours()) + ":"
         + fillZeros(currentdate.getMinutes()) + ":"
         + fillZeros(currentdate.getSeconds());

    var list = await getFullLog();
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

    await saveLog(list);
    await clearLog();
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
var clearLog = async function () {
    var maxEntities = await getData('maxLogEntities', 50);
    await saveLog((await getFullLog()).reverse().slice(0, maxEntities).reverse());
}
