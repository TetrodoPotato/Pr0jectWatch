// ==UserScript==
// @name        Project Watch - File 6
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     /^https:\/\/openload\.co\/embed\/.+$/
// @include     /^https:\/\/vivo\.sx\/.+$/
// @include     /^https:\/\/streamango\.com\/embed\/.+$/
// @version    	1.0
// @description	Hoster Parser
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// ==/UserScript==

makeBlackPage();
document.documentElement.style.overflow = 'hidden';

var parseOpenload = function () {
    $(document).ready(function () {
        //Get the api ticket of the mp4 file
        var elem = $('#streamurl');
        if (elem.length != 0) {
            if (elem.text() != "HERE IS THE LINK") {
                window.location = 'https://openload.co/stream/' + elem.text() + '?mime=true';
                return;
            }
        }
        window.location = 'https://bs.to/?error';
    }); 
    
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
    
    //When document loaded
    $(document).ready(function () {
        //Start the redirect process
        setTimeout(startRedirect, 1000);
    });
}

var parseStreamango = function () {
     $(document).ready(function () {
        window.location = $('video').attr('src');
    });   
}

if (/^https:\/\/openload\.co\/embed\/.+$/.test(window.location.href)) {
    parseOpenload();
} else if (/^https:\/\/vivo\.sx\/.+$/.test(window.location.href)) {
    parseVivo();
} else if (/^https:\/\/streamango\.com\/embed\/.+$/.test(window.location.href)) {
    parseStreamango();
}

