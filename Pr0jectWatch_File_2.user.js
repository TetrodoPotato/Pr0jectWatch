// ==UserScript==
// @name        Project Watch - File 2
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     /^https:\/\/bs\.to\/serie\-genre.*$/
// @version    	1.11
// @description	SeriesList
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/storage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/seriesStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/data.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/mainSiteScript.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/favCat.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/keyControll.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_2.user.js
// @noframes
// ==/UserScript==
initBsPage();

/**
 * Check if Logged in.
 */
var isLoggedIn = e => !!($('#navigation').length);

/**
 * InitPage API - Loads Serieslist is needed. Start Build main and Side Content if Finished.
 */
var onDocumentReady = async function () {
    var curDate = new Date().getTime();
    var lastTime = await getData('lastUpdate', 0);

    var diff = (curDate - lastTime) / 86400000; // Miliseconds to Days
    if (diff > (await getData('updateWaitTime', 7)) || (!(await getData('indexUpdated', false)) && isLoggedIn())) {
        createProgressbar();

        await setData('indexUpdated', (await updateSeriesList()), true);
        await setData('lastUpdate', curDate, true);

        removeProgressbar();
    } else {
        console.log('Was Updated ' + diff + " Days Ago")
    }

    var redirect = getGetter('redirect', 'none');
    if (redirect != 'none') {
        window.location = jDecode(redirect);
        return true;
    }

    buildSiteContent();
    /*Build Main Content*/
    await showSeriesRow((await getFullList()).map(obj => seriesRowRaw(obj.FullName, obj.Genre, obj.SeriesIndex, obj.IsFav, obj.IsSynced, obj.Id, obj.IsWatched)));
}

/**
 * API - When everything is loaded.
 */
var onDocumentLoaded = async function () {
    var newSearch = getGetter('search');
    if (typeof newSearch !== 'undefined') {
        $('#search').val(jDecode(newSearch));
        await searchEv();
    }
}

/**
 * Controlls the searchbar and checks the {DOM} contentContainer for tables with {DOM} child {id} 1.
 * Set display {String} "none" to {DOM} children without {String} searchterm.
 */
var searchEv = async function (e) {
    //Remove Info
    $('#searchInfoText').remove();

    //Check if Search is Valid
    var search = $('#search').val();
    if (search.length < (await getData('minCharsSearch', 3)) && /^https\:\/\/bs.to\/serie-genre.*$/.test(window.location.href)) {
        $('.search').hide();
        $('#contentContainer').append('<span id="searchInfoText">Type Min. ' + (await getData('minCharsSearch', 3)) + ' Character For Results</span>');
    } else {
        //Searchterm
        var searchTerm = [];
        $.each(search.toLowerCase().split('genre:'), (index, value) => searchTerm.push(value.trim()));

        var searchGenre = (searchTerm.length > 1) ? true : false;
        $('.search').each(function (index, value) {
            var target = $(this);
            if (searchGenre) {
                if (!target.find('.genreContainer:first').text().toLowerCase().includes(searchTerm[1])) {
                    target.hide();
                } else {
                    target.toggle(target.find('.titleContainer:first').text().toLowerCase().includes(searchTerm[0]));
                }
            } else {
                target.toggle(target.find('.titleContainer:first').text().toLowerCase().includes(searchTerm[0]))
            }
        });

        if ($('.search').length) {
            if ($('.search:visible').length == 0) {
                $('#contentContainer').append('<span id="searchInfoText">No Results For "' + $('#search').val() + '"</span>');
            }
        }
    }
};

/**
 * Build Sidecontent with Sorting Button
 */
var buildSiteContent = async function () {
    var $cont = $('#sideContainerContent').empty().append('<h1 class="sideSiteTitel">Sorting</h1>');

    var listSortings = ['alphabet', 'alphabet reverse', 'genre', 'genre reverse', 'favoritealphabet', 'favoritealphabet reverse', 'favoritegenre', 'favoritegenre reverse'];
    var listSorNames = ['Alphabet [A - Z]', 'Alphabet [Z - A]', 'Genre [A - Z]', 'Genre [Z - A]', 'Favorites [Yes - No] [A - Z]', 'Favorites [No - Yes] [A - Z]', 'Favorites [Yes - No] Genre [A - Z]', 'Favorites [No - Yes] Genre [A - Z]']

    $.each(listSortings, function (index, value) {
        $cont.append('<div data-id="' + value + '" class="sortingButton"><div class="sideTriangle"></div><div class="sortingText">' + listSorNames[index] + '</div></div>');
    });
}

/**
 * Update the Serieslist. Get Serieslist Elements and convert it to Objects.
 */
var updateSeriesList = async function () {
    var listElem = (isLoggedIn()) ? (await getIdNames()) : null;

    var objectArray = [];
    $('.genre').each(function (index, genreContainer) {
        var genreName = $(this).find('strong:first-child').text();

        $(this).find('a').each(function (index, series) {
            objectArray.push({
                Id: $(this).attr('href').split('/')[1],
                FullName: $(this).text(),
                Genre: genreName,
                IsFav: false,
                FavSeason: 1,
                SeriesIndex: null,
                IsWatched: false,
                IsSynced: false,
                LastSeasonMax: 0,
                HasNewEpisode: false,
            });
        });
    });

    await updateList(objectArray, listElem, updateProgressbar);
    return (listElem !== null);
}

/**
 * Get all Series-indizes with fullname as Object-Array async.
 * @return {Promise[Object-Array]}
 */
var getIdNames = function () {
    return new Promise(resolve => {
        $.get('https://bs.to/settings/series', function (textCont) {
            //Get Text by Url remove all Script tags and newlines and Parse it in Jquery
            var $elem = $('<div/>').append(textCont.replace(/<script(?=(\s|>))/i, '<script type="text/xml" ').replace(/(\r\n|\n|\r)/gm, "")).find('.col li');

            var obj = [];
            $elem.each(function (index, value) {
                obj.push({
                    elemText: $(this).text(),
                    dataId: $(this).attr('data-id')
                })
            });

            resolve(obj);
        }, 'text');
    });
}

/**
 * Create the ontop progressbar.
 */
var createProgressbar = function () {
    $('body').append($("<div>", {
            'id': 'progressTable',
            'style': 'position:fixed; z-index:9999999999; width:100%; height:100%; top:0; left:0; background-color:#000;'
        }).append('<div id="progressbar" style="height:20px; background-color:#FFF; width:0%;"></div>'));
}

/**
 * Remove ontop progressbar
 */
var removeProgressbar = function () {
    $("#progressTable").remove();
}

/**
 * Update percent of ontop progressbar
 * @param e {Number} - percent.
 */
var updateProgressbar = async function (e) {
    $("#progressbar").css('width', (e + '%'));
}

/**
 * SerieRow as String.
 * @param fullname {String} - Seriesname.
 * @param genre {String} - Seriesgenre.
 * @param picID {String} - data-id String with seriesindex.
 * @param isFav {boolean} - Is Favorites.
 * @param isSynced {Boolean} - Is Synced.
 * @param seriesId {String} - Seriesid.
 * @param isWatched {String} - Is Watched.
 * @return {String} seriesrow as DOM-String.
 */
var seriesRowRaw = function (fullname, genre, picID, isFav, isSynced, seriesId, isWatched) {
    return '<div tabindex="-1" seriesId="' + seriesId + '" class="seriesContainer search"><div class="buttonContainer"><svg title="Toggle Favorite-state Of Series" class="favIcon ' + ((isFav) ? 'Fav' : 'noFav') + '" viewBox="0 0 25 25"><g>' +
    '<path d="M12.6 0 L15.6 9 L24.9 9 L17.5 15.5 L20 24.9 L12.6 19.4 L4.5 24.7 L7.5 15.6 L0 9.2 L9.3 9 Z" /></g></svg>' +
    '<svg title="Sync Series" class="seriesTick ' + ((isSynced) ? 'tickCheck' : '') + '" viewBox="0 0 25 25"><g><path d="M3.5 7.8 L8.9 13.3 L21.8 0 L24.9 3.2 L8.9 19.6 L0 11.4 Z" />' +
    '</g></svg></div><div class="nonButtonContainer"><div class="nameWatchedContainer"><div class="watchedContainer ' + ((isWatched) ? 'watchedSeries' : '') + '">' +
    '</div><div class="titleContainer">' + fullname + '</div></div><div class="alignContainerGenre"><div class="genrePicContainer">' +
    '<div class="genreTriangeContainer"><div class="triangle"></div><div class="genreContainer">' + genre + '</div></div>' +
    '<div class="pictureContainer"><img title="Big Picture" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" ' + ((picID !== null) ? ('data-id="' + picID + '"') : '') + ' class="seriesPicture"/></div></div></div></div></div>';
}

/**
 * Append all Rows to the ContentContainer. Adds an Timeout for Parallel Append.
 * @param contentArray {String-Array} - String-Array with SeriesRow.
 */
var showSeriesRow = async function (contentArray) {
    var container = $('#contentContainer');
    container.html('<h1 class="mainSiteTitle">All Series</h1>');

    var index = 0;
    var timeoutTime = await getData('listTimeout', 10000); //ms
    var timeoutCurTime = new Date().getTime();

    var minChars = await getData('minCharsSearch', 3);

    $.each(contentArray, function (i, value) {
        container.append($(contentArray[i]).toggle(minChars == 0));
        if ((new Date().getTime()) - timeoutCurTime > timeoutTime) { //Check if Timeout
            index = i + 1;
            return false;
        }
    });

    if (minChars != 0) {
        $('#contentContainer').append('<span id="searchInfoText">Type Min. ' + minChars + ' Character For Results</span>');
    }

    addListEvents();

    if (index > 0) { // If Timieout
        toggleLoadBar(true);
        var afterTimeout = function () {
            //On display iterate over with Timeout
            var $cont = $(contentArray[index]);

            //Remove Info
            $('#searchInfoText').remove();

            var search = $('#search').val();
            if (search.length < minChars) {
                $('#contentContainer').append('<span id="searchInfoText">Type Min. ' + minChars + ' Character For Results</span>');
                $('.search').hide();
            } else {
                //get the searchterm and apply
                var searchTerm = [];
                $.each(search.toLowerCase().split('genre:'), (index, value) => searchTerm.push(value.trim()));
                var searchGenre = (searchTerm.length > 1) ? true : false;

                if (searchGenre) {
                    if (!$cont.find('.genreContainer:first').text().toLowerCase().includes(searchTerm[1])) {
                        $cont.hide();
                    } else {
                        if (!$cont.find('.titleContainer:first').text().toLowerCase().includes(searchTerm[0])) {
                            $cont.hide();
                        }
                    }
                } else {
                    if (!$cont.find('.titleContainer:first').text().toLowerCase().includes(searchTerm[0])) {
                        $cont.hide();
                    }
                }

                if ($('.search').length) {
                    if ($('.search:visible').length == 0) {
                        $('#contentContainer').append('<span id="searchInfoText">No Results For "' + $('#search').val() + '"</span>');
                    }
                }
            }

            container.append($cont);

            if (++index < contentArray.length) {
                updateLoadBar((index / contentArray.length) * 100);
                setTimeout(afterTimeout, 0);
            } else {
                toggleLoadBar(false);
            }
        }
        setTimeout(afterTimeout, 0);
        setTimeout(removeBlackPage, 10000);
        console.log('Timeout');
    }
}

/**
 * Toggle the visibility on the menu-progressbar.
 * @param on {Boolean} - State.
 */
var toggleLoadBar = function (on) {
    if (on) {
        $('#prBar').addClass('barActive');
    } else {
        $('#prBar').attr('class', '');
    }
}

/**
 * Update the Percentage of the menu-progressbar.
 * @param percent {Number} - percent.
 */
var updateLoadBar = async function (percent) {
    $('#prBar').css('width', percent + '%');
}

/**
 * Add Eventlistener to Content- and Side-Container.
 */
var addListEvents = function () {
    $('#contentContainer').on('click', '.nameWatchedContainer', function (event) {
        window.location = 'https://bs.to/serie/' + $(this).closest('*[seriesId]').attr('seriesId');
    });

    $('#contentContainer').on('click', '.seriesPicture[src]', function (event) {
        var mainNode = $(this).closest('*[seriesId]')

            var $table = $("<table>", {
                "class": "imgTable"
            }).append('<tr class="picTitelRow"><td>' + mainNode.find('.titleContainer:first').text() + '</td></tr>').append('<tr class="picGenreRow"><td>' + mainNode.find('.genreContainer:first').text() + '</td></tr>');

        var dialogContainer = $('#dialogClickLayer').attr('ison', 'true');
        dialogContainer.find('#dialogWindow').html('<img onload="this.width*=2;" src="' + $(this).attr('src') + '"></img>').append($table);
    });

    $('#contentContainer').on('mouseover', '.seriesPicture[data-id]', function (event) {
        if ($(this).attr('src').indexOf('bs.to') == -1) {
            $(this).attr('src', ('https://bs.to/public/img/cover/' + $(this).attr('data-id') + '.jpg'));
        }
    });

    $('#contentContainer').on('click', '.favIcon', function (event) {
        var target = $(this).closest('.seriesContainer');

        $.get('https://bs.to/serie/' + target.attr('seriesid'), function (result) {
            (async function () {
                //Get seriesId
                var seriesIndex = $(result).find('img:first').attr('src').split('/')[4].split('.')[0];
                //Get All Genre
                var newGenre = $(result).find('.infos:first div:first p:first span').append(' ').text().trim();
                //Check if everything is Watched
                var allWatched = ($(result).find('.seasons li:not(.watched), .episodes tr:not(.watched)').length < 2);

                target.find('.genreContainer:first').html(newGenre);
                target.find('.watchedContainer:first').toggleClass('watchedSeries', allWatched);
                target.find('.seriesPicture:first').attr('data-id', seriesIndex);
                target.find('.seriesTick:first').addClass('tickCheck');

                await updateEntry({
                    Id: target.attr('seriesid'),
                    Genre: newGenre,
                    SeriesIndex: seriesIndex,
                    IsWatched: ((isLoggedIn()) ? allWatched : null),
                    IsFav: $(target).find('.favIcon').toggleClass("Fav noFav").hasClass('Fav'),
                    IsSynced: true
                });

                //Reload Favorites
                updateFavoriteMenu();
            })();

        });
    });

    $('#sideContainer').on('click', '.sortingButton', function (e) {
        sortSeriesList($(this).attr('data-id'));
    });

    $('#contentContainer').on('click', '.seriesTick', function (e) {
        var target = $(this).closest('.seriesContainer');

        $.get('https://bs.to/serie/' + target.attr('seriesid'), function (result) {
            (async function () {
                //Get seriesId
                var seriesIndex = $(result).find('img:first').attr('src').split('/')[4].split('.')[0];
                //Get All Genre
                var newGenre = $(result).find('.infos:first div:first p:first span').append(' ').text().trim();
                //Check if everything is Watched
                var allWatched = ($(result).find('.seasons li:not(.watched), .episodes tr:not(.watched)').length < 2);

                target.find('.genreContainer:first').html(newGenre);
                target.find('.watchedContainer:first').toggleClass('watchedSeries', allWatched);
                target.find('.seriesPicture:first').attr('data-id', seriesIndex);
                target.find('.seriesTick:first').addClass('tickCheck');

                await updateEntry({
                    Id: target.attr('seriesid'),
                    Genre: newGenre,
                    SeriesIndex: seriesIndex,
                    IsWatched: ((isLoggedIn()) ? allWatched : null),
                    IsSynced: true
                });

                //Reload Favorites
                updateFavoriteMenu();
            })();

        });
    });
}

/**
 * Sort the Content on the Document.
 * @param sorted {String} - String that descriptes the Sort.
 */
var sortSeriesList = function (sorted) {
    sorted = ((typeof sorted === 'undefined') ? '' : sorted).toLowerCase().split(' ');

    var reversed = (sorted.length > 1) ? -1 : 1;
    var $sorted = $('.seriesContainer').get();

    if (sorted[0] == 'alphabet') {
        $sorted.sort((a, b) => $(a).find('.titleContainer:first').text().localeCompare($(b).find('.titleContainer:first').text()) * reversed);
    } else if (sorted[0] == 'genre') {
        $sorted.sort((a, b) => $(a).find('.genreContainer:first').text().split(' ')[0].localeCompare($(b).find('.genreContainer:first').text().split(' ')[0]) * reversed);
    } else if (sorted[0] == 'favoritealphabet') {
        $sorted.sort(function (a, b) {
            if ($(a).find('.favIcon').hasClass('Fav') == $(b).find('.favIcon').hasClass('Fav')) {
                return $(a).find('.titleContainer:first').text().localeCompare($(b).find('.titleContainer:first').text());
            } else {
                return ($(a).find('.favIcon').hasClass('Fav') === $(b).find('.favIcon').hasClass('Fav')) ? 0 : $(a).find('.favIcon').hasClass('Fav') ? (-1 * reversed) : (1 * reversed);
            }

            return $(a).find('.genreContainer:first').text().split(' ')[0].localeCompare($(b).find('.genreContainer:first').text().split(' ')[0]) * -1;
        });
    } else if (sorted[0] == 'favoritegenre') {
        $sorted.sort(function (a, b) {
            if ($(a).find('.favIcon').hasClass('Fav') == $(b).find('.favIcon').hasClass('Fav')) {
                return $(a).find('.genreContainer:first').text().split(' ')[0].localeCompare($(b).find('.genreContainer:first').text().split(' ')[0]);
            } else {
                return ($(a).find('.favIcon').hasClass('Fav') === $(b).find('.favIcon').hasClass('Fav')) ? 0 : $(a).find('.favIcon').hasClass('Fav') ? (-1 * reversed) : (1 * reversed);
            }

            return $(a).find('.genreContainer:first').text().split(' ')[0].localeCompare($(b).find('.genreContainer:first').text().split(' ')[0]) * -1;
        });
    } else {
        $sorted.sort((a, b) => $(a).find('.titleContainer:first').text().localeCompare($(b).find('.titleContainer:first').text()))
    }

    $('#contentContainer').append($sorted);
}
