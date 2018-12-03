// ==UserScript==
// @name        Project Watch - File 4
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     /^https:\/\/bs\.to\/serie\/[^\/]+\/\d+\/\d+?[^\/\:]+(\/\w+)?(\/)?$/
// @include     /^https:\/\/bs\.to\/serie\/[^\/]+\/\d+\/\d+\-[^\/]+\/\w+\/\w+(\/)?$/
// @version    	1.14
// @description	Select Hoster
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/data.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/playlistStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/seriesStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/storage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/logStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/favCat.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/mainSiteScript.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/keyControll.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_4.user.js
// @noframes
// ==/UserScript==

/**
 * Redirects to currect hoster
 */
var initHosterList = async function () {
    makeBlackPage();

    var isRepeated = false;

    var searchHoster = async function () {
        //Get Hosterlist
        var hoster = [];
        var hosterLower = [];
        $('.hoster-tabs a').each(function () {
            hoster.push({
                hosterName: $(this).text().trim(),
                hosterLink: $(this).attr('href')
            });
            hosterLower.push($(this).text().toLowerCase().trim());
        });

        var errorCode = await getData('errorCode', 0);
        var hasHoster = false;
        $.each(await getData('hoster', defaultHoster), function (index, value) {
            var hosterIndex = $.inArray(value.toLowerCase(), hosterLower);
            if (hosterIndex != -1) {
                if (errorCode-- < 1) {
                    hasHoster = true;
                    window.location = '/' + hoster[hosterIndex].hosterLink;
                    return false;
                }
            }
        });

        if (!hasHoster) {
            if (!isRepeated) {
                isRepeated = true;
                setTimeout(function () {
                    searchHoster();
                }, 1000);
            } else {
                alert('No Hoster For This Episode');
                window.location = window.location + '/NoHoster';
            }
        }

    }

    $(document).ready(function () {
        searchHoster();
    });
}

var startHoster = async function () {
    var seriesId = window.location.pathname.split('/')[2];
    var seriesName = $('#sp_left h2').clone().children().remove().end().text().trim();
    var season = window.location.pathname.split('/')[3];
    var episodeDE = $('#titleGerman').clone().children().remove().end().text().trim();
    var episodeOR = $('#titleGerman small').clone().children().remove().end().text().trim();
    var episodeIndex = $('#episodes .active:first a').text().trim();
    var episodeMax = $('#episodes li:last a').text().trim();
    var hoster = window.location.pathname.split('/')[6].split('?')[0];
    var redirect = $('.hoster-player:first').attr('href');

    if (typeof redirect === 'undefined') {
        setTimeout(onDocumentReady, 1000);
    }

    //Setting
    if (await getData('enableLog', true)) {
        await setLog(seriesId, seriesName, season, episodeDE, episodeOR, episodeIndex, episodeMax, hoster);
    }
    //Setting
    if (await getData('autoAutoplay', false)) {
        await setData('autoplay', true);
    }
    //Setting
    if (await getData('updateSeason', true)) {
        await updateEntry({
            Id: seriesId,
            FavSeason: season
        });
    }
    await setForAutoplay();

    if (hoster == 'NoHoster') {
        window.location = 'https://bs.to/?next';
        return true;
    }

    var supportet = false;
    $.each(hosterSupport, function (i, supp) {
        if (supp[0].toLowerCase() == hoster.toLowerCase()) {
            supportet = supp[1];
            return false;
        }
    });

    if (await getData('isPlayingPlaylist', false)) {
        await removePlayList((await getFullPlayList())[0].episodeID);
    }

    //Save Last link
    await setData('lastSeriesSeasonWatched', 'https://bs.to/serie/' + seriesId + '/' + season, true);

    if (supportet) {
        window.location = 'https://bs.to/data'
             + '?redirect=' + jEncode(redirect)
             + '&series=' + jEncode(seriesName)
             + '&season=' + jEncode(season)
             + '&episode=' + jEncode(((episodeDE != '') ? episodeDE : episodeOR))
             + '&episodeRange=' + jEncode(episodeIndex + '/' + episodeMax)
             + '&style=' + jEncode(await getData('style', styleColors.Default))
             + '&autoplay=' + jEncode(await getData('autoplay', false))
             + '&closeEnd=' + jEncode(await getData('closeEnd', true))
             + '&enablePreview=' + jEncode(await getData('enablePreview', true))
             + '&previewSteps=' + jEncode(await getData('previewSteps', 20))
             + '&timeShow=' + jEncode(await getData('timeShow', 3))
             + '&timeStep=' + jEncode(await getData('timeStep', 5))
             + '&volStep=' + jEncode(await getData('volStep', 10))
             + '&disableAutoplayOnExit=' + jEncode(await getData('disableAutoplayOnExit', false))
             + '&noStepPreview=' + jEncode(await getData('noStepPreview', false));
        return true;
    } else {
        initBsPage();
    }
}

/**
 * Decide with Pages Loads.
 */
var initPageStart = async function () {
    if (/^https:\/\/bs\.to\/serie\/[^\/]+\/\d+\/\d+?[^\/\:]+(\/\w+)?(\/)?$/.test(window.location.href)) {
        await initHosterList();
    } else {
        makeBlackPage();
        $(document).ready(function () {
            startHoster();
        });
    }
}
initPageStart();

/**
 * Init Page Redirect and Provide noneSupport Hoster Redirect
 */
var onDocumentReady = async function () {
    var seriesId = window.location.pathname.split('/')[2];
    var seriesName = $('#sp_left h2').clone().children().remove().end().text().trim();
    var season = window.location.pathname.split('/')[3];
    var episodeDE = $('#titleGerman').clone().children().remove().end().text().trim();
    var episodeOR = $('#titleGerman small').clone().children().remove().end().text().trim();
    var episodeIndex = $('#episodes .active:first a').text().trim();
    var episodeMax = $('#episodes li:last a').text().trim();
    var hoster = window.location.pathname.split('/')[6].split('?')[0];
    var redirect = $('.hoster-player:first').attr('href');

    if (typeof redirect === 'undefined') {
        setTimeout(onDocumentReady, 1000);
    }

    //Setting
    if (await getData('enableLog', true)) {
        await setLog(seriesId, seriesName, season, episodeDE, episodeOR, episodeIndex, episodeMax, hoster);
    }
    //Setting
    if (await getData('autoAutoplay', false)) {
        await setData('autoplay', true);
    }
    //Setting
    if (await getData('updateSeason', true)) {
        await updateEntry({
            Id: seriesId,
            FavSeason: season
        });
    }
    await setForAutoplay();

    if (hoster == 'NoHoster') {
        window.location = 'https://bs.to/?next';
        return true;
    }

    var supportet = false;
    $.each(hosterSupport, function (i, supp) {
        if (supp[0].toLowerCase() == hoster.toLowerCase()) {
            supportet = supp[1];
            return false;
        }
    });

    if (await getData('isPlayingPlaylist', false)) {
        await removePlayList((await getFullPlayList())[0].episodeID);
    }

    //Save Last link
    await setData('lastSeriesSeasonWatched', 'https://bs.to/serie/' + seriesId + '/' + season, true);

    if (supportet) {
        window.location = 'https://bs.to/data'
             + '?redirect=' + jEncode(redirect)
             + '&series=' + jEncode(seriesName)
             + '&season=' + jEncode(season)
             + '&episode=' + jEncode(((episodeDE != '') ? episodeDE : episodeOR))
             + '&episodeRange=' + jEncode(episodeIndex + '/' + episodeMax)
             + '&style=' + jEncode(await getData('style', styleColors.Default))
             + '&autoplay=' + jEncode(await getData('autoplay', false))
             + '&closeEnd=' + jEncode(await getData('closeEnd', true))
             + '&enablePreview=' + jEncode(await getData('enablePreview', true))
             + '&previewSteps=' + jEncode(await getData('previewSteps', 20))
             + '&timeShow=' + jEncode(await getData('timeShow', 3))
             + '&timeStep=' + jEncode(await getData('timeStep', 5))
             + '&volStep=' + jEncode(await getData('volStep', 10))
             + '&disableAutoplayOnExit=' + jEncode(await getData('disableAutoplayOnExit', false))
             + '&noStepPreview=' + jEncode(await getData('noStepPreview', false));
        return true;
    } else {
        var win = window.open($('.hoster-player:first').attr('href'), "Project Watch Video", "");
        var pollTimer = window.setInterval(function () {
                if (win.closed !== false) { // !== is required for compatibility with Opera
                    window.clearInterval(pollTimer);
                    window.location = 'https://bs.to/?next';
                }
            }, 200);
        $('.hoster-player:first').attr('href', 'https://www.google.de/');
    }

    $('#contentContainer').empty().append('<h1 class="mainSiteTitle">Open Hosterwindow</h1>').append('<button id="nextButton">Next Episode</button>').find('#nextButton').bind('click', function () {
        window.location = 'https://bs.to/?next';
    });

    await initSideCont();
}

/**
 * Set Constant Variables for next Autoplay.
 */
var setForAutoplay = async function () {
    await setData('lastSeries', window.location.pathname.split('/')[2]);
    await setData('lastSeason', window.location.pathname.split('/')[3]);
    await setData('lastEpisode', window.location.pathname.split('/')[4]);
    await setData('lastLanguage', window.location.pathname.split('/')[5]);
}

/**
 * Creates a list with max Five Elements of the last watched Series with Seasons.
 */
var initSideCont = async function () {
    var target = $('#sideContainerContent').empty().append('<h1 class="sideSiteTitel">Last Watched</h1>');

    var lastFiveList = [];
    $.each((await getFullLog()).reverse(), function (index, value) {
        if (!containsObject(value, lastFiveList)) {
            lastFiveList.push(value);
            return !(lastFiveList.length > 4) // Break if 5 Elements reached - Rest is Continue
        }
    });

    $.each(lastFiveList, function (index, value) {
        target.append('<div href="' + ('https://bs.to/serie/' + value.seriesId + '/' + value.season) + '" class="lastWatchedButton"><div class="lastWatchedsideTriangle"></div><div class="lastWatchedText">' + value.series + '</div></div>');
    });

    $('.lastWatchedButton').bind('click', function () {
        window.location = $(this).attr('href');
    });
}

/**
 * Checks if ObjectList Already contains series.
 * @param obj {Object} - Series Object.
 * @param list {Object-Array} - Series List
 * @return {Boolean}
 */
var containsObject = function (obj, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].series == obj.series) {
            return true;
            break;
        }
    }
    return false;
}
