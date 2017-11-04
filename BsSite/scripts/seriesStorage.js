/**
 * Get the Fulllist of Series.
 * @return {Object-Array}
 */
var getFullList = function () {
    var list = localStorage.getItem('serieslist');
    if(!list){
        list = [];
        localStorage.setItem('serieslist', JSON.stringify(list));
    } else {
        list = JSON.parse(list);
    }
    return list.sort((a, b) => a.FullName.localeCompare(b.FullName));
    
}

var saveList = function (FullObjectListArray) {
    localStorage.setItem('serieslist', JSON.stringify(FullObjectListArray));
}

var updateList = function (objectArray, listArray, callback) {
    var list = getFullList();
    var canuUpdateIndex = (typeof listArray !== 'undefined' && listArray !== null);
    var callbackExist = (typeof callback === 'function');

    var index = 0;
    return new Promise(resolve => {
        var asyncFun = function () {
            var i = list.findIndex(item => item.Id.toLowerCase() === objectArray[index].Id.toLowerCase());
            if (i == -1) {
                list.push(objectArray[index]);
                i = list.length - 1
            }

            if (canuUpdateIndex && list[i].SeriesIndex === null) {
                list[i].SeriesIndex = listArray.filter(a => a.elemText.toLowerCase() === list[i].FullName.toLowerCase())[0].dataId;
            }

            if (callbackExist) {
                callback(((index + 2) / objectArray.length) * 100);
            }

            if (++index < objectArray.length) {
                setTimeout(asyncFun, 0);
            } else {
                saveList(list);
                resolve(true);
            }
        }
        asyncFun();
    });
}

var getFavorites = function () {
    return getFullList().filter(obj => obj.IsFav == true);
}

var updateEntry = function (obj) {
    var list = getFullList();

    var i = list.findIndex(item => item.Id.toLowerCase() == obj.Id.toLowerCase());
    if (i > -1) {
        if (obj.FullName !== null && typeof obj.FullName !== 'undefined') {
            list[i].FullName = obj.FullName;
        }

        if (obj.Genre !== null && typeof obj.Genre !== 'undefined') {
            list[i].Genre = obj.Genre;
        }

        if (obj.IsFav !== null && typeof obj.IsFav !== 'undefined') {
            list[i].IsFav = obj.IsFav;
        }

        if (obj.FavSeason !== null && typeof obj.FavSeason !== 'undefined') {
            list[i].FavSeason = obj.FavSeason;
        }

        if (obj.SeriesIndex !== null && typeof obj.SeriesIndex !== 'undefined') {
            list[i].SeriesIndex = obj.SeriesIndex;
        }

        if (obj.IsWatched !== null && typeof obj.IsWatched !== 'undefined') {
            list[i].IsWatched = obj.IsWatched;
        }

        if (obj.IsSynced !== null && typeof obj.IsSynced !== 'undefined') {
            list[i].IsSynced = obj.IsSynced;
        }

        saveList(list);
    } else {
        alert(obj.Id + " does not exist");
    }
}