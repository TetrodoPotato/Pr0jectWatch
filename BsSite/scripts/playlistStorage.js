/**
 * Get the Fulllist of Logs.
 * @return {Object-Array}
 */
var getFullPlayList = async function () {
    var list = await seriesStorage.storage('playList');
    
    if (!list) {
        list = [];
        await seriesStorage.storage('playList', list);
    }
    return list;
}

/**
 * Save log.
 * @param FullObjectListArray {Object-Array} - Full Log
 */
var savePlayList = async function (FullObjectListArray) {
    await seriesStorage.storage('playList', FullObjectListArray);
}

/**
 * Fuck it.
 */
var setPlayList = async function (seriesId, season, episodeid, seriesName, episodename, index, language) {
    var list = await getFullPlayList();
    list.push({
        seriesID: seriesId,
        season: season,
        episodeID: episodeid,
        seriesName: seriesName,
        episodeName: episodename,
        episodeIndex: index,
        language: language,
    });

    await savePlayList(list);
}

var setAllPlayList = async function(obj){
    var list = await getFullPlayList();
    $.each(obj,function(index, entry){
        list.push(entry);
    });
    
    await savePlayList(list);
}

/**
 * Removes Autoplay Item.
 * @param id {String} - id of item.
 */
var removePlayList = async function (id) {
    var list = await getFullPlayList();
    list.splice(list.findIndex(item => item.episodeID.toLowerCase() === id.toLowerCase()), 1);
    await savePlayList(list);
}

/**
 * Remove All Items
 */
var removeAllPlaylist = async function () {
    await seriesStorage.delete('playList');
}
