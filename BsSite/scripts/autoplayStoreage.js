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
var setPlayList = function (seriesId, season, episodeid, seriesName, episodename, index) {
    var list = getFullPlayList();
    list.push({
        seriesID: seriesId,
        episodeIndex:index,
        season: season,
        episodeID: episodeid,
        seriesName: seriesName,
        episodeName: episodename
    });

    savePlayList(list);
}

/**
 * Removes Autoplay Item.
 * @param id {String} - id of item.
 */
var removePlayList = function (id) {
    var list = getFullPlayList();
    list.splice(list.findIndex(item => item.episodeID.toLowerCase() === id.toLowerCase()), 1);
    savePlayList(list);
}

/**
 * Remove All Items
 */
var removeAllPlaylist = function () {
    localStorage.setItem('playList', JSON.stringify([]));
}