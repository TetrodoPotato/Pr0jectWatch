/**
 * Get an Sorted Object With all Favs.
 * @param favs {Oject-Array} - Unsorted Favs.
 * @return {Array-Object}
 */
var getCatFavs = async function (favs) {
    var catFav = await seriesStorage.storage('catFavs');
    
    if (typeof catFav === 'undefined') {
        catFav = {};
    }
    
    var returnCat = {};

    $.each(catFav, function (key, val) {
        returnCat[key] = [];

        $.each(val, function (index, value) {

            var hasList = false;
            $.each(favs, function (i, v) {
                if (favs[i].Id == value) {
                    returnCat[key].push(favs[i]);
                    favs.splice(i, 1);

                    hasList = true;
                    return false; // Break
                }
            });

            if (!hasList) {
                catFav[key][index] = null;
            }
        });
    });

    $.each(catFav, function (key, value) {
        $.each(value, function (index, val) {
            if (val === null) {
                catFav[key].splice(index, 1);
            }
        });
    });

    await setCatFavs(catFav);

    returnCat['Not Sorted'] = favs;
    return returnCat;
}

/**
 * Save the Sorted Favs.
 * @param obj (Array-Object) - the Sorted List.
 */
var setCatFavs = async function (obj) {
    await seriesStorage.storage('catFavs',obj);
}
