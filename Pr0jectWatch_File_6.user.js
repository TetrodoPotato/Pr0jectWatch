// ==UserScript==
// @name        Project Watch - File 6
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     /^https:\/\/openload\.co\/embed\/.+$/
// @include     /^https:\/\/oload\.stream\/embed\/.+$/
// @include     /^https:\/\/vivo\.sx\/.+$/
// @include     /^https:\/\/streamango\.com\/embed\/.+$/
// @include     /^http:\/\/vidto\.me\/.+$/
// @include     /^https:\/\/vidoza\.net\/embed.+$/
// @version    	1.6
// @description	Hoster Parser
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/mainSiteScript.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_6.user.js
// @noframes
// ==/UserScript==

makeBlackPage();
document.documentElement.style.overflow = 'hidden';

var parseOpenload = function () {
    //Click on the Video so the mp4 link appears
    function startRedirect() {
        var elem = $('.vjs-big-play-button:first');
        var elem2 = $('#videooverlay');
        if (elem.length != 0 && elem2.length != 0) {
            elem.click();
            elem2.click();
            setTimeout(openVideo, 100);
        } else {
            window.location = 'https://bs.to/?error';
        }

    }

    var timer = 0;
    //Get the mp4 link
    function openVideo() {
        var elem = $('video:first');
        if (typeof elem.attr('src') !== 'undefined') {
            var vidLink = elem.attr("src");
            
            if(!vidLink.includes('openload.co')){
                vidLink = 'https://openload.co' + vidLink;
            }
            
            window.location.replace(vidLink);
        } else {
            if (++timer < 100) {
                setTimeout(openVideo, 100);
            } else {
                window.location = 'https://bs.to/?error';
            }
        }
    }

    //Start the redirect process
    setTimeout(startRedirect, 1000);
}

var parseVivo = function () {
    //Click on the Video so the mp4 link appears
    function startRedirect() {
        var elem = $('.needsclick:first');
        if (elem.length != 0) {
            elem.click();
            setTimeout(openVideo, 100);
        } else {
            window.location = 'https://bs.to/?error';
        }
    }

    var timer = 0;
    //Get the mp4 link
    function openVideo() {
        var elem = $('video:first');
        if (elem.length != 0) {
            var vidLink = elem.attr("src");
            window.location = vidLink;
        } else {
            if (++timer < 100) {
                setTimeout(openVideo, 100);
            } else {
                window.location = 'https://bs.to/?error';
            }
        }
    }

    //Start the redirect process
    setTimeout(startRedirect, 1000);
}

var parseStreamango = function () {
    window.location = $('video').attr('src');
}

/*NOT SUPPORTET MEDIAPLAYER GET ERROR NOTHING LOADS*/
var parseTheVideo = function () {
    var t = 0;
    var timer = setInterval(function () {
            var nextLink = $('video:first').attr('src');
            if (typeof nextLink !== 'undefined') {
                window.location = nextLink;
                clearInterval(timer);
            }
            if (++t > 100) {
                clearInterval(timer);
                window.location = 'https://bs.to/?error';
            }
        }, 100);

}

var parseVidto = function () {
    var t = 0;
    var timer = setInterval(function () {
            var nextButton = $('#btn_download');
            if (nextButton.length) {
                nextButton.click();
            } else {
                var nextLink = $('video:first').attr('src');
                if (typeof nextLink !== 'undefined') {
                    window.location = nextLink;
                    clearInterval(timer);
                }
            }

            if (++t > 100) {
                clearInterval(timer);
                window.location = 'https://bs.to/?error';
            }
        }, 100);
}

var parseVidoza = function () {
    var t = 0;
    var timer = setInterval(function () {
        var cvframe = $('.jw-video:first');
        
        if (cvframe.length != 0) {
            var src = cvframe.attr('src');
            if(typeof src !== 'undefined') {
                window.location = src;
                clearInterval(timer);
            }
            
        }
        
        if (++t > 100) {
            clearInterval(timer);
            window.location = 'https://bs.to/?error';
        }
    }, 100);

}

$(document).ready(function () {
    if (/^https:\/\/openload\.co\/embed\/.+$/.test(window.location.href) || /^https:\/\/oload\.stream\/embed\/.+$/.test(window.location.href)) {
        parseOpenload();
    } else if (/^https:\/\/vivo\.sx\/.+$/.test(window.location.href)) {
        parseVivo();
    } else if (/^https:\/\/streamango\.com\/embed\/.+$/.test(window.location.href)) {
        parseStreamango();
    } else if (/^https:\/\/thevideo\.io\/embed.+$/.test(window.location.href)) {
        parseTheVideo();
    } else if (/^http:\/\/vidto\.me\/.+$/.test(window.location.href)) {
        parseVidto();
    } else if (/^https:\/\/vidoza\.net\/embed.+$/.test(window.location.href)) {
        parseVidoza();
    }
});
