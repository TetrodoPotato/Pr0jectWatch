// ==UserScript==
// @name        Project Watch - File 1
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     /^https:\/\/bs.to(\/)?(((home|\?next|\?error|\?back|\?logout[^]*)[^\/]*)(\/)?)?$/
// @version    	1.4
// @description	Error-, Next-Redirect
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/playlistStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/data.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/storage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/mainSiteScript.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_1.user.js
// @noframes
// ==/UserScript==

/**
 * Redirects to next Episode or season
 */
var redirectStart = async function () {
    //Get the current lastplayed episode
    var series = await getData('lastSeries', 'none');
    var season = await getData('lastSeason', 'none');
    var episode = await getData('lastEpisode', 'none');

    //Check error on cookies and fuck you
    if (/^https:\/\/bs.to(\/home)?\/?$/.test(window.location.href)) {
        //You know ?!
        await setData('errorCode', 0);
        await setData('autoplay', false);
        await clearAutoplayBuffer();

        if (await getData('beforeLogout', 'notSet') !== 'notSet') {
            var linkRef = await getData('beforeLogout', 'https://bs.to/serie-genre');
            await setData('beforeLogout', 'notSet');
            window.location = linkRef;
        } else {
            if (await getData('episodelistOnStart', false)) {
                if (await getData('lastSeriesSeasonWatched', 'none') !== 'none') {
                    window.location = await getData('lastSeriesSeasonWatched', 'https://bs.to/serie-genre');
                    return;
                }
            }

            window.location = 'https://bs.to/serie-genre';
        }
    } else if (/^https:\/\/bs.to\/\?logout[^]*$/.test(window.location.href)) {
        await setData('beforeLogout', jDecode(getGetter('redirect', 'https://bs.to/')));
        window.location = 'https://bs.to/logout';
    } else if (series === 'none' || season === 'none' || episode === 'none') {
        alert('Enable cookies!!!');
        await setData('autoplay', false);
        await setData('errorCode', 0);
        window.location = 'https://bs.to/';
    } else if (window.location.href == 'https://bs.to/?error') {
        //Update the current errorcode to the next hoster
        await setData('errorCode', await getData('errorCode', 0) + 1);

        //And try it again
        window.location = 'https://bs.to/serie/' + series + '/' + season + '/' + episode;
    } else if (/^https:\/\/bs.to\/\?next[^\/]*$/.test(window.location.href)) {
        //Errorcode reset
        await setData('errorCode', 0);

        var isAutoplay = getGetter('autoplay', 'none');
        if (isAutoplay !== 'none') {
            await setData('autoplay', isAutoplay.toLowerCase() == 'true');
            if (isAutoplay.toLowerCase() != 'true') {
                await clearAutoplayBuffer();
                await setData('isPlayingPlaylist', false)
            }
        }

        if (await getData('isPlayingPlaylist', false)) {
            var firstPlaylist = await getFullPlayList();

            if (firstPlaylist.length == 0) {
                if (await getData('keepPlaying', false)) {
                    await setData('isPlayingPlaylist', false);
                } else {
                    window.location = 'https://bs.to/';
                    return;
                }
            } else {
                await setData('lastSeries', firstPlaylist[0].seriesID);
                await setData('lastSeason', firstPlaylist[0].season);
                await setData('lastEpisode', firstPlaylist[0].episodeID);

                series = firstPlaylist[0].seriesID;
                season = firstPlaylist[0].season;
                episode = firstPlaylist[0].episodeID;

                await setData('autoplay', true);
            }
        }

        //Open the last season for next episode
        window.location = 'https://bs.to/serie/' + series + '/' + season;
    }
}

var getFileAsTextString = function (pageUrl) {
    return new Promise(resolve => {
        $.get(pageUrl + '?noCacheTimeKey=' + new Date().getTime(), function (newContent) {
            resolve(newContent);
        }, 'text');
    });

}

var getTitle = function (text) {
    return $('<div></div>').append('<h2>' + text + '</h2>').css('margin', '20px 0 0 0');
}

var getListItem = function (text) {
    return $('<li></li>').css({
        'padding': '3px 0px',
        'margin': '0 0 0 20px',
        'text-align': 'justify',
    }).append('<strong>' + text + '</strong>');
}

var getTextItem = function (text) {
    return $('<div></div>').text(text).css('text-align', 'justify');
}

var getChangelogContainer = async function () {
    var string = await getFileAsTextString('https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/other/changelog.txt');
    string = string.split(/(\r\n|\n|\r)/gm);

    var container = $('<div></div>');

    var title = $('<div></div>').css('padding', '0 0 10px 20px');
    title.append('<h1>Changelog</h1>');
    container.append(title);

    var mainContainer = $('<div></div>').css({
            'height': '400px',
            'width': 'calc(100% - 40px)',
            'padding': '20px',
            'overflow-x': 'hidden',
            'overflow-y': 'scroll',
        });
    container.append(mainContainer);

    var list = null;

    $.each(string, function (index, value) {
        if (value.includes('[TITLE]')) {
            if (list !== null) {
                mainContainer.append(list);
                list = null;
            }

            mainContainer.append(getTitle(value.replace('[TITLE]', '')));
        } else if (value.includes('[TEXT]')) {
            if (list !== null) {
                mainContainer.append(list);
                list = null;
            }

            mainContainer.append(getTextItem(value.replace('[TEXT]', '')));
        } else if (value.includes('[LIST]')) {
            if (list === null) {
                list = $('<ul></ul>');
                list.css('list-style-type', 'circle');
            }

            list.append(getListItem(value.replace('[LIST]', '')));
        }
    });

    if (list !== null) {
        mainContainer.append(list);
        list = null;
    }

    return container;
}

var showChangelog = async function () {
    var container = await getChangelogContainer();
    container.css({
        'width': '540px',
        'padding': '10px 0 0 0',
        'background-color': '#FFF',
        'margin': '20px auto',
        'border-radius': '3px',
    });

    okButton = $('<button></button>').text('OK');
    okButton.css({
        'width': '540px',
        'height': '50px',
        'border': 'none',
        'background-color': '#333',
        'color': '#FFF',
        'font-weight': 'bold',
        'cursor': 'pointer',
    });
    okButton.bind('click', function (e) {
        (async function(){
            await setData('currentScriptVersion', (await GM.info).version, true);
            redirectStart();
        })();
        
    });
    container.append(okButton);

    var borderContainer = $('<div></div>');
    borderContainer.css({
        'width': '100%',
        'position': 'absolute',
        'top': '0px',
        'left': '0px',
        'z-index': '9999999999',
    });

    borderContainer.append(container);
    $('html:first').append(borderContainer);
}

var convertOldData = async function () {
    //SeriesList
    if (typeof localStorage.serieslist !== 'undefined') {
        var list = JSON.parse(localStorage.getItem('serieslist'));
        if (typeof list[0].Genre !== 'undefined') {
            await seriesStorage.storage('serieslist', list);
        }

        delete localStorage.serieslist;
    }

    //LogList
    if (typeof localStorage.loglist !== 'undefined') {
        var list = JSON.parse(localStorage.getItem('loglist'));
        if (typeof list[0].episodeNr !== 'undefined') {
            await seriesStorage.storage('loglist', list);
        }

        delete localStorage.loglist;
    }

    //catFavs
    if (typeof localStorage.catFavs !== 'undefined') {
        var list = JSON.parse(localStorage.getItem('catFavs'));
        await seriesStorage.storage('catFavs', list);

        delete localStorage.catFavs;
    }
    
    delete localStorage.playList;
    
    //Convert Serieslist
    var seriesList = await seriesStorage.storage('serieslist');
    if (typeof seriesList !== 'undefined') {
        if(typeof seriesList[0].LastSeasonMax === 'undefined'){
            $.each(seriesList, function(index, value){
                seriesList[index].LastSeasonMax = 0;
                seriesList[index].HasNewEpisode = false;
            });
            
            await seriesStorage.storage('serieslist',seriesList);
        }
    }

}

var getScriptVersion = async function () {
    if(typeof GM !== 'undefined'){
        return (await GM.info).version
    } else if(typeof GM_info !== 'undefined') {
        return GM_info.version;
    } else {
        return '1.5';
    }
}

var startStartPage = async function () {
    //Black page over original
    makeBlackPage();

    await convertOldData();

    if (await getData('currentScriptVersion', '0') < await getScriptVersion()) {
        showChangelog();
    } else {
        await redirectStart();
    }
}

startStartPage();
