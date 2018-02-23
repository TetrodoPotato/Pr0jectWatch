var seriesStorage = {};

seriesStorage.storage = function (key, value = null) {
    return new Promise(function (resolve, reject) {
        var open = indexedDB.open("seriesStorage", 1);

        open.onupgradeneeded = function () {
            var db = open.result;
            var store = db.createObjectStore("memory", {
                    keyPath: "key"
                });
        };

        open.onsuccess = function () {
            var db = open.result;
            var tx = db.transaction("memory", "readwrite");
            var store = tx.objectStore("memory");

            if (value !== null) {
                store.put({
                    key: key,
                    value: value,
                });
            }

            var getData = store.get(key);

            getData.onsuccess = function () {
                if (typeof getData.result === 'undefined') {
                    resolve();
                } else {
                    resolve(getData.result.value);
                }
            };

            getData.onerror = function (event) {
                //None
            };

            tx.oncomplete = function () {
                db.close();
            };
        }

        open.onerror = function (event) {
            alert("Öffnen Datenbankfehler: " + event.target.errorCode);
        };
    });
}

self.onmessage = function (n) {
    if(typeof n.data !== 'object' || n.data === null){
        return;
    }
    
    var data = n.data;
    var index = 0;
    
    for (index = 0; index < data.SeriesObj.length; index++) {
        var i = data.SeriesList.findIndex(item => item.Id.toLowerCase() === data.SeriesObj[index].Id.toLowerCase());
        if (i == -1) {
            data.SeriesList.push(data.SeriesObj[index]);
            i = data.SeriesList.length - 1
        }

        if (data.updateIndex && data.SeriesList[i].SeriesIndex === null) {
            data.SeriesList[i].SeriesIndex = data.indexArray.filter(a => a.elemText.toLowerCase() === data.SeriesList[i].FullName.toLowerCase())[0].dataId;
        }

        data.SeriesList[i].isCheckedInUpdate = true;
        
        self.postMessage(((index + 2) / data.SeriesObj.length) * 100);
    }

    //Last Post
    self.postMessage(((index + 2) / data.SeriesObj.length) * 100);
    
    //Clear Removed Series
    for (var i = (data.SeriesList.length - 1); i > -1; i--) {
        if (data.SeriesList[i].isCheckedInUpdate !== true) {
            data.SeriesList.splice(i, 1);
        }
    }

    for (var i = 0; i < data.SeriesList.length; i++) {
        delete data.SeriesList[i].isCheckedInUpdate
    }

    //Save List
    (async function () {
        await seriesStorage.storage('serieslist', data.SeriesList);
        self.postMessage('READY');
    })();
};
