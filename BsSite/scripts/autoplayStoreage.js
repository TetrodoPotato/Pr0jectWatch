/**
 * Get the Fulllist of Logs.
 * @return {Object-Array}
 */
var getFullPlayList = function () {
    var list = localStorage.getItem('playList');
    if (!list) {
        list = [];
        localStorage.setItem('playList', JSON.stringify(list));
    } else {
        list = JSON.parse(list);
    }
    return list;
}

/**
 * Save log.
 * @param FullObjectListArray {Object-Array} - Full Log
 */
var savePlayList = function (FullObjectListArray) {
    localStorage.setItem('playList', JSON.stringify(FullObjectListArray));
}

/**
 *
 */
var setPlayList = function (seriesId, season, episodeid, seriesName, episodenameDE, episodenameOR) {
    var list = getFullPlayList();
    list.push({
        seriesID: seriesId,
        season: season,
        episodeID: episodeid,
        seriesName: seriesName,
        episodeNameDE: episodenameDE,
        episodeNameOR: episodenameOR
    });

    savePlayList(list);
}

/**
 * Removes Autoplay Item.
 * @param id {String} - id of item.
 */
var removePlayList = function (id) {
    var list = getFullPlayList();
    list.splice(list.findIndex(item => item.seriesID.toLowerCase() === id.toLowerCase()), 1);
    savePlayList(list);
}
