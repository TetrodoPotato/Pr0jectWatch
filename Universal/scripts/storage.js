window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

if (!window.indexedDB) {
    window.alert("Ihr Browser unterstützt keine stabile Version von IndexedDB. Dieses und jenes Feature wird Ihnen nicht zur Verfügung stehen.");
}

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
                alert("Abrufen Datenbankfehler: " + event.target.errorCode);
            };

            tx.oncomplete = function () {
                db.close();
            };
        }

        open.onerror = function (event) {
            alert("Öffnen Datenbankfehler: " + event.target.errorCode);
            console.log(event);
        };
    });
}

seriesStorage.delete  = function (key) {
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

            var removeData = store.delete (key);

            removeData.onsuccess = function () {
                resolve(true);
            };

            removeData.onerror = function (event) {
                alert("Abrufen Datenbankfehler: " + event.target.errorCode);
            };

            tx.oncomplete = function () {
                db.close();
            };
        }

        open.onerror = function (event) {
            alert("Öffnen Datenbankfehler: " + event.target.errorCode);
            console.log(event);
        };
    });
}

seriesStorage.deleteAll  = function (key) {
    return new Promise(function (resolve, reject) {
        var request = indexedDB.deleteDatabase("seriesStorage");

        request.onerror = function (event) {
            resolve(false);
        };

        request.onsuccess = function (event) {
            resolve(true);
        };
    });
}
