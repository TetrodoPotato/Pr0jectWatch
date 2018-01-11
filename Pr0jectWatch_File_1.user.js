// ==UserScript==
// @name        Project Watch - File 1
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     /^https:\/\/bs.to(\/)?(((home|\?next|\?error|\?back|\?logout[^]*)[^\/]*)(\/)?)?$/
// @version    	1.3
// @description	Error-, Next-Redirect
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/playlistStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/data.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_1.user.js
// @noframes
// ==/UserScript==

/**
 * Redirects to next Episode or season
 */
var redirectStart = function () {
    //Black page over original
    makeBlackPage();

    //Get the current lastplayed episode
    var series = getData('lastSeries', 'none');
    var season = getData('lastSeason', 'none');
    var episode = getData('lastEpisode', 'none');

    //Check error on cookies and fuck you
    if (/^https:\/\/bs.to(\/home)?\/?$/.test(window.location.href)) {
        //You know ?!
        setData('errorCode', 0);
        setData('autoplay', false);
        clearAutoplayBuffer();

        if (getData('beforeLogout', 'notSet') !== 'notSet') {
            var linkRef = getData('beforeLogout', 'https://bs.to/serie-genre');
            setData('beforeLogout', 'notSet');
            window.location = linkRef;
        } else {
            if (getData('episodelistOnStart', false)) {
                if (getData('lastSeriesSeasonWatched', 'none') !== 'none') {
                    window.location = getData('lastSeriesSeasonWatched', 'https://bs.to/serie-genre');
                    return;
                }
            }

            window.location = 'https://bs.to/serie-genre';
        }
    } else if (/^https:\/\/bs.to\/\?logout[^]*$/.test(window.location.href)) {
        setData('beforeLogout', jDecode(getGetter('redirect', 'https://bs.to/')));
        window.location = 'https://bs.to/logout';
    } else if (series === 'none' || season === 'none' || episode === 'none') {
        alert('Enable cookies!!!');
        setData('autoplay', false);
        setData('errorCode', 0);
        window.location = 'https://bs.to/';
    } else if (window.location.href == 'https://bs.to/?error') {
        //Update the current errorcode to the next hoster
        setData('errorCode', getData('errorCode', 0) + 1);

        //And try it again
        window.location = 'https://bs.to/serie/' + series + '/' + season + '/' + episode;
    } else if (/^https:\/\/bs.to\/\?next[^\/]*$/.test(window.location.href)) {
        //Errorcode reset
        setData('errorCode', 0);

        var isAutoplay = getGetter('autoplay', 'none');
        if (isAutoplay !== 'none') {
            setData('autoplay', isAutoplay.toLowerCase() == 'true');
            if (isAutoplay.toLowerCase() != 'true') {
                clearAutoplayBuffer();
                setData('isPlayingPlaylist', false)
            }
        }

        if (getData('isPlayingPlaylist', false)) {
            var firstPlaylist = getFullPlayList();

            if (firstPlaylist.length == 0) {
                if(getData('keepPlaying', false)){
                    setData('isPlayingPlaylist', false);
                } else {
                    window.location = 'https://bs.to/';
                    return;
                }    
            } else {
                setData('lastSeries', firstPlaylist[0].seriesID);
                setData('lastSeason', firstPlaylist[0].season);
                setData('lastEpisode', firstPlaylist[0].episodeID);

                series = firstPlaylist[0].seriesID;
                season = firstPlaylist[0].season;
                episode = firstPlaylist[0].episodeID;

                setData('autoplay', true);
            }
        }

        //Open the last season for next episode
        window.location = 'https://bs.to/serie/' + series + '/' + season;
    }
}
redirectStart();
