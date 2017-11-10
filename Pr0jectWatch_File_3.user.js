// ==UserScript==
// @name        Project Watch - File 3
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     /^https:\/\/bs\.to\/serie\/[^\/]+(\/(\d+(\/((unwatch:|watch:)(\d+|all)(\/)?)?)?)?)?$/
// @version    	1.0
// @description	EpisodeList
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/seriesStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/autoplayStoreage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/data.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/keyControll.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_3.user.js
// ==/UserScript==

initBsPage();

/**
 * Starts on new Document loaded.
 */
var onDocumentReady = async function () {
    var curDate = new Date().getTime();
    var lastTime = getData('lastUpdate', 0);

    if (((curDate - lastTime) / 86400000) > 7 || (!getData('indexUpdated', false) && isLoggedIn())) {
        window.location = 'https://bs.to/serie-genre?redirect=' + jEncode(window.location.href);
        return true;
    }

    $('#contentContainer').empty().append('<h1 class="mainSiteTitle">' + $('#sp_left h2:first').html() + '</h1>');
    constructSeasonList(getSeasonObjects());
    constructEpisodeList(getEpisodeInfo());
    constructSideContent();

    setEpisodeEvents();
    syncSeries();
}

/**
 * Starts on new Document loaded all.
 */
var onDocumentLoaded = function () {

    //Setting
    if (getData('scrollUnwatched', false)) {
        if ($(".seriesContainer:not(.episodeWatched):first").length) {
            var offSet = $(".seriesContainer:not(.episodeWatched):first").offset()
                $('html, body').animate({
                    scrollTop: (((typeof offSet !== 'undefined') ? offSet.top : 0) - 200)
                }, 2000);

            window.lastFocusList = $(".seriesContainer:not(.episodeWatched):first");
        }
    }

    if (getData('autoplay', false)) {
        return initAutoplay();
    }
}

/**
 * Check if user is logged in.
 * @return {Boolean}
 */
var isLoggedIn = e => !!($('#navigation').length);

/**
 * Get Series Id.
 * @return {String}
 */
var getSeriesId = e => window.location.pathname.split('/')[2];

/**
 * Get the Selected Season of Series.
 * @return {Number}
 */
var getSeason = function () {
    var thisSeason = (window.location.pathname.split('/').length > 3) ? window.location.pathname.split('/')[3] : '1';
    return parseInt(((thisSeason !== '') ? thisSeason : '1'));
}

/**
 * Sync Series and add Special Information. Reloads Favorites.
 */
var syncSeries = function () {
    updateEntry({
        Id: getSeriesId(),
        Genre: $('.infos:first div:first p:first span').append(' ').text().trim(),
        SeriesIndex: $('img:first').attr('src').split('/')[4].split('.')[0], /*Get seriesId - img src ./index.jpg*/
        IsWatched: ((isLoggedIn()) ? ($('#seasonTable td:not(.watched)').length < 2) : null),
        IsSynced: true
    });

    //Reload Favorites
    $('#favReload').click();
}

/**
 * Set Events for the SeriesList.
 */
var setEpisodeEvents = function () {
    //Click Watch Icon
    $('#contentContainer').on('click', '.seriesContainer .watchIcon', function () {
        var target = $(this).closest('.seriesContainer');

        var watchLink = 'https://bs.to/serie/' + getSeriesId() + '/' + getSeason() + '/';
        watchLink += ((target.hasClass('episodeWatched')) ? 'unwatch:' : 'watch:') + target.find('.indexCont:first').text();

        makePageCall(watchLink, function () {
            target.toggleClass('episodeWatched');
            $('.active').toggleClass('watched', ($(".seriesContainer:not(.episodeWatched)").length == 0));
            syncSeries();
        });
    });

    $('#contentContainer').on('click', '.seriesContainer .nameWatchedContainer', function () {
        window.location = 'https://bs.to/serie/' + getSeriesId() + '/' + getSeason() + '/' + $(this).closest('*[episodeid]').attr('episodeid');
    });

    $('#seasonTable').on('click', 'td[href]', function (e) {
        window.location = $(this).attr('href');
    });

    setInterval(function () {
        var $targets = $('#seasonTable td[href]:not(.special)');
        var canFit = false;
        $targets.each(function () {
            if ($(this).width() > 100) {
                $targets.addClass('showSeasonText');
                canFit = true;
                return false;
            }
        });

        if (!canFit) {
            $targets.removeClass('showSeasonText');
        }
    }, 1000);

    $('#favSeasonStar').bind('click', function (event) {
        var id = getSeriesId();
        var season = getSeason();
        var curSeries = getFullList().filter(obj => obj.Id.toLowerCase() == id.toLowerCase())[0];
        var fav = (curSeries.IsFav && curSeries.FavSeason != season) ? true : $(this).hasClass('seasonNoFav');

        updateEntry({
            Id: id,
            IsFav: fav,
            FavSeason: season
        });

        if (fav) {
            $('#favSeasonStar').removeClass('seasonNoFav seasonFav');
            $('#favSeasonStar').addClass('thisSeasonFav');
        } else {
            $('#favSeasonStar').removeClass('seasonFav thisSeasonFav');
            $('#favSeasonStar').addClass('seasonNoFav');
        }

        //Reload Favorites
        $('#favReload').click();
    });

    $(window).scroll(function () {
        if ($(window).scrollTop() >= 94) { //Start .offset().top of sticky
            $('#noneMenu').css('padding-top', ($('#seasonContainer').addClass('fixedSeason').outerHeight() + 48) + 'px');
        } else {
            $('#seasonContainer').removeClass('fixedSeason');
            $('#noneMenu').removeAttr('style');
        }

    });

    $('#watchAll').bind('click', function () {
        makePageCall('https://bs.to/serie/' + getSeriesId() + '/' + getSeason() + '/' + 'watch:all', function () {
            $('.seriesContainer ').addClass('episodeWatched');
            $('.active').toggleClass('watched', ($(".seriesContainer:not(.episodeWatched)").length == 0));
            if ($('.active:first').hasClass('watched')) {
                $('.active').removeClass('unwatched');
            } else {
                $('.active').addClass('unwatched');
            }
            syncSeries();
        });
    });

    $('#unwatchAll').bind('click', function () {
        makePageCall('https://bs.to/serie/' + getSeriesId() + '/' + getSeason() + '/' + 'unwatch:all', function () {
            $('.seriesContainer ').removeClass('episodeWatched');
            $('.active').toggleClass('watched', ($(".seriesContainer:not(.episodeWatched)").length == 0));
            if ($('.active:first').hasClass('watched')) {
                $('.active').removeClass('unwatched');
            } else {
                $('.active').addClass('unwatched');
            }
            syncSeries();
        });
    });

    $('.addAutoplayButton').bind('click', function () {
        var target = $(this).closest('.seriesContainer');

        var seriesName = $('.mainSiteTitle:first').clone().children().remove().end().text().trim();
        var episodeDE = target.find('.titleContainer:first strong:first').text().trim();
        var episodeOR = target.find('.titleContainer:first i:first').text().trim();

        setPlayList(getSeriesId(), getSeason(), target.attr('episodeid'), seriesName, ((episodeDE != '') ? episodeDE : episodeOR), parseInt(target.find('.indexCont').text()));

        addBottomText('Added Episode ' + target.find('.indexCont').text() + ' To The Playlist', 2000);
    });
}

/**
 * Add an Buttontext
 */
var addBottomText = function (msg, time) {
    var target = $('<div></div>').attr('class', 'buttomText').text(msg);
    $('body:first').append(target);

    setTimeout(function () {
        target.addClass('showBottomText');
        setTimeout(function () {
            target.removeClass('showBottomText');
            setTimeout(function () {
                target.remove();
            }, 200);
        }, time);
    }, 200);
}

/**
 * Constructs EpisodeRows and Append
 */
var constructEpisodeList = function (list) {
    var target = $('#contentContainer');
    var season = getSeason();
    var loggedIn = isLoggedIn();
    var seriesId = getSeriesId();

    $.each(list, function (index, value) {
        var curObj = list[index];

        var hosterObj = '';
        $.each(curObj.hoster, function (index, value) {
            var hoster = curObj.hoster[index];
            var linkLink = 'https://bs.to/serie/' + seriesId + '/' + season + '/' + curObj.episodeId + '/' + hoster;
            var hostLink = '<a title="Open ' + hoster + '" class="hosterIcon ' + hoster + '" href="' + linkLink + '"></a>';

            hosterObj += hostLink;
        });

        target.append($(episodeRowRaw(index + 1, curObj.episodeId, curObj.nameDe, curObj.nameOr, curObj.watched, hosterObj, loggedIn)));

    });

    $('.active').toggleClass('watched', ($(".seriesContainer:not(.episodeWatched)").length == 0));
    if ($('.active:first').hasClass('watched')) {
        $('.active').removeClass('unwatched');
    } else {
        $('.active').addClass('unwatched');
    }
}

/**
 * Makes an Async SiteCall no Sitereturn. Calls Callback-Function
 */
function makePageCall(siteUrl, callback) {
    $.get(siteUrl, function () {
        callback();
    })
}

/**
 * Constructs an SeasonList with Favoritebutton and Append.
 */
var constructSeasonList = function (obj) {
    $('#contentContainer').append('<div id="seasonContainer"></div>').append('<div id="seasonContainerSpaceTaker"></div>');
    $('#seasonContainer').append('<table id="seasonTable"><tr></tr></table>');

    var seasonIsFav = getFullList().filter(obj => obj.Id.toLowerCase() == getSeriesId().toLowerCase())[0];

    var $row = $('#seasonTable tr:first');
    $row.append('<td class="' + ((seasonIsFav.IsFav) ? ((seasonIsFav.FavSeason == getSeason()) ? 'thisSeasonFav' : 'seasonFav') : 'seasonNoFav') + '" id="favSeasonStar"><svg viewBox="0 0 25 25"><g><path d="M12.6 0 L15.6 9 L24.9 9 L17.5 15.5 L20 24.9 L12.6 19.4 L4.5 24.7 L7.5 15.6 L0 9.2 L9.3 9 Z" /></g></svg></td>');

    var partLink = 'https://bs.to/serie/' + getSeriesId() + '/';
    $.each(obj, function (index, value) {
        $row.append('<td class="' + value.state + '" href="' + (partLink + value.index) + '">' + (value.index ? value.index : 'Specials') + '</a>');
    });
}

/**
 * Return an Season Object-Array with index and state.
 * @return {Object-Array}
 */
var getSeasonObjects = function () {
    var obj = [];
    $('#seasons li').each(function () {
        var target = $(this);
        if (typeof target.attr('class') === 'undefined') {
            target.attr('class', '')
        }

        obj.push({
            index: (!isNaN(target.text())) ? parseInt(target.text()) : 0,
            state: ((!target.attr('class').includes('watched')) ? (target.attr('class') + ' unwatched') : target.attr('class'))
        });
    });
    return obj;
}

/**
 * Get all Informations from all Episodes als Object.
 * @return {Object-Array}
 */
var getEpisodeInfo = function () {
    var rows = [];
    $('.episodes:first tr').each(function (index, value) {
        var target = $(this);

        var objhoster = [];
        target.find('.nowrap a').each(function () {
            objhoster.push($(this).text());
        });

        rows.push({
            episodeId: target.find('a:first').attr('href').split('/')[3],
            watched: target.hasClass('watched'),
            nameDe: target.find('strong:first-child').text(),
            nameOr: target.find('i:first-child').text(),
            hoster: objhoster
        });
    });
    return rows;
}

/**
 * Get a complete episodeRow as String.
 * @return {String}
 */
var episodeRowRaw = function (index, episodeID, nameDE, nameOR, watched, hosterObj, isLoggedIn) {
    return '<div tabindex="-1" episodeId="' + episodeID + '" class="seriesContainer' + ((watched) ? ' episodeWatched' : '') + ' search"><div class="buttonContainer"><svg title="Toggle Watchstate" ' + ((!isLoggedIn) ? 'style="display:none"' : '') + ' class="watchIcon" viewBox="0 0 30 30"><g>' +
    '<path d="M0,15.089434 C0,16.3335929 5.13666091,24.1788679 14.9348958,24.1788679 C24.7325019,24.1788679 29.8697917,16.3335929' +
    ' 29.8697917,15.089434 C29.8697917,13.8456167 24.7325019,6 14.9348958,6 C5.13666091,6 0,13.8456167 0,15.089434 Z M14.9348958,22.081464 ' +
    'C11.2690863,22.081464 8.29688487,18.9510766 8.29688487,15.089434 C8.29688487,11.2277914 11.2690863,8.09740397 14.9348958,8.09740397 ' +
    'C18.6007053,8.09740397 21.5725924,11.2277914 21.5725924,15.089434 C21.5725924,18.9510766 18.6007053,22.081464 14.9348958,22.081464 ' +
    'L14.9348958,22.081464 Z M18.2535869,15.089434 C18.2535869,17.0200844 16.7673289,18.5857907 14.9348958,18.5857907 C13.1018339,18.5857907 ' +
    '11.6162048,17.0200844 11.6162048,15.089434 C11.6162048,13.1587835 13.1018339,11.593419 14.9348958,11.593419 C15.9253152,11.593419 ' +
    '14.3271242,14.3639878 14.9348958,15.089434 C15.451486,15.7055336 18.2535869,14.2027016 18.2535869,15.089434 L18.2535869,15.089434 Z"></path>' +
    '</g></svg><div class="indexCont">' + index + '</div></div><div class="nonButtonContainer"><div class="nameWatchedContainer"><div class="watchedEpiContainer"></div>' +
    '<div class="titleContainer">' + ((nameDE != '') ? ('<strong>' + nameDE + '</strong>') : '') + ((nameOR != '' && nameDE != '') ? ' - ' : '') + ((nameOR != '') ? ('<i>' + nameOR + '</i>') : '') +
    '</div></div><div class="alignContainerGenre"><div class="genrePicContainer"><div class="hosterTriangeContainer"><div class="triangle"></div><div class="hosterContainer">' + hosterObj + '</div>' +
    '</div><div title="Add Episode To Playlist" class="addAutoplayButton">+</div></div></div></div></div>';
}

/**
 * Fill Sitecontent with Seriesinformation.
 */
var constructSideContent = function () {
    var container = $('#sideContainerContent').empty().append('<h1 class="sideSiteTitel">Info</h1>').append($('#sp_right img:first').clone()).append($('.justify:first').parent().clone().attr('id', 'infoText')).append(getInfoTable());

    //Add Un/Watch-All Buttons
    if (isLoggedIn()) {
        container.append('<button id="watchAll">Watch All</button><button id="unwatchAll">Unwatch All</button>');
    }
}

/**
 * Construct the infoTable.
 * @return {JQuery}
 */
var getInfoTable = function () {
    var $table = $("<table>", {
            "id": "infoTable"
        });

    $('.infos:first div').each(function (index, value) {
        $table.append('<tr><td>' + $(this).find('span:first').text() + '</td><td>' + $(this).find('p:first').text() + '</td></tr>');
    });

    return $table;
}

/**
 * Init Autoplay
- AUTOPLAY INVALID NOT SAME SERIES
 */
var initAutoplay = function () {
    if (!autoplayIsValid()) {
        $('#autoplay').prop('checked', false);
        setData('autoplay', false);
        setData('lastSeries', 'none');
        setData('lastSeason', 'none');
        setData('lastEpisode', 'none');
        setData('isPlayingPlaylist', false);
        return false;
    }

    var autoplayTime = getData('autoplayTime', 5);

    if (autoplayTime == 0 || getData('lastEpisode') == '0x000000') {
        return playNextEpisode();
    }

    var target = $('#sideContainer').prepend('<div id="sideAutoplay"></div>').find('#sideAutoplay');
    target.append('<div id="autoplayContent"><span id="timeInfotext">Next Episode In <span id="autoTimeNumber">' + autoplayTime + '</span> Seconds</span><span id="nextEpisodeText">' + getNextText() + '</span><div id="autoplayButton"><button id="nextAutoplay">Next</button><button id="cancelAutoplay">Cancel</button></div></div>');

    $('#nextAutoplay').bind('click', function (e) {
        e.stopPropagation();
        playNextEpisode();
    });

    $('#cancelAutoplay, #dialogClickLayer').bind('click', function () {
        closeAutoplay();
    });

    var lastIsOn;
    var autoCheckSizeInterval = setInterval(function () {
            if (window.closeAutoplay == true) {
                clearInterval(autoCheckSizeInterval);
                return;
            }

            var thisIsOn = ($('#contentContainer').attr('ison') == 'true');
            if (thisIsOn != lastIsOn) {
                if (thisIsOn) {
                    var dialogContainer = $('#dialogClickLayer').attr('ison', 'true');
                    dialogContainer.find('#dialogWindow').empty().append($('#autoplayContent'));
                } else {
                    var dialogContainer = $('#dialogClickLayer').attr('ison', 'false');
                    $('#sideAutoplay').append($('#autoplayContent'));
                }
            }
            lastIsOn = thisIsOn;
        }, 100);

    startAutoplayCount(autoplayTime);
}

/**
 * Count to Zero, Updates the Timenumber and starts the new Episode.
 * @param time {Number} - The timecountdown Start number.
 */
var startAutoplayCount = function (time) {
    var countInterval = setInterval(function () {
            if (window.closeAutoplay == true) {
                clearInterval(countInterval);
                return;
            }

            $('#autoTimeNumber').html(--time);

            if (time < 1) {
                clearInterval(countInterval);
                playNextEpisode();
            }
        }, 1000);
}

/**
 * Set the text with the Information for the Next Episode.
 */
var getNextText = function () {
    var next = null;
    if(getData('lastEpisode') == '0x000001'){
        next = $('.seriesContainer:first');
    } else {
        next = $('.seriesContainer[episodeid="' + getData('lastEpisode') + '"]').next('.seriesContainer');
    }
    

    /*Setting*/
    if (getData('playMerged', true) && next.length != 0) {
        if (next.find('.titleContainer').text().toLowerCase().includes('[in episode')) {
            next = next.next('.seriesContainer');
        }
    }

    return ((next.length != 0) ? (next.find('.indexCont:first').text().trim() + '/' + $('.seriesContainer').length + ' - Season ' + $('#seasonTable .active:first').text().trim()) : ('Season ' + $('#seasonTable .active:first').next('td').text().trim()))
}

/**
 * Check if Autoplay is Valid with the Set variables and Series
 */
var autoplayIsValid = function () {
    if(getData('isPlayingPlaylist', false)) {
        var play = $('.seriesContainer[episodeid="' + getData('lastEpisode') + '"]').prev('.seriesContainer');
        if(play.length == 0){
            setData('lastEpisode', '0x000001');
        } else {
            setData('lastEpisode', play.attr('episodeid'));
        }
        return true;
    }
    
    if (getData('lastSeries') != getSeriesId()) {
        return false;
    } else if (getData('lastEpisode') == '0x000000') {
        return true;
    } else if (getData('lastSeason') !== getSeason()) {
        return false;
    }

    var next = $('.seriesContainer[episodeid="' + getData('lastEpisode') + '"]').next('.seriesContainer');

    /*Setting*/
    if (getData('playMerged', true) && next.length != 0) {
        if (next.find('.titleContainer').text().toLowerCase().includes('[in episode')) {
            next = next.next('.seriesContainer');
        }
    }

    if (next.length == 0) {
        next = $('#seasonTable .active:first').next('td');
        if (next.length == 0) {
            return false;
        }
    }

    return true;
}

/**
 * Plays the Next Episode
 */
var playNextEpisode = function () {
    if (getData('lastEpisode') == '0x000000' || getData('lastEpisode') == '0x000001') {
        $('.seriesContainer:first .nameWatchedContainer:first').click();
        return true;
    }

    var next = $('.seriesContainer[episodeid="' + getData('lastEpisode') + '"]').next('.seriesContainer');

    /*Setting*/
    if (getData('playMerged', true) && next.length != 0) {
        if (next.find('.titleContainer').text().toLowerCase().includes('[in episode')) {
            next = next.next('.seriesContainer');
        }
    }

    if (next.length == 0) {
        next = $('#seasonTable .active:first').next('td');
        setData('lastEpisode', '0x000000');
        window.location = next.attr('href');
        return;
    }

    next.find('.nameWatchedContainer:first').click();
}

/**
 * Close Autoplay Window.
 */
var closeAutoplay = function () {
    window.closeAutoplay = true;
    $('#sideAutoplay').remove();
    $('#dialogClickLayer').attr('ison', 'false');
    $('#autoplay').prop("checked", false);
    setData('autoplay', false, false);
    setData('lastSeries', 'none');
    setData('lastSeason', 'none');
    setData('lastEpisode', 'none');
    setData('isPlayingPlaylist', false);
}
