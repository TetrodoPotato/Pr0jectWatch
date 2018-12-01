// ==UserScript==
// @name        Project Watch - File 7
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include		/^https:\/\/bs.to\/data.*$/
// @include     /^https:\/\/delivery\-\-.+$/
// @include     /^.*oloadcdn\.net.*$/
// @include     /^.*fruithosted\.net.*$/
// @include     /^.*thevideo\.me.*$/
// @include     /^.*\d+\.\d+\.\d+\.\d+.*\/video\.mp4$/
// @include     /^.*vidoza\.net\/[^\/]*\/[^\.]*\.mp4$/
// @include     /^.*\/stream\/.*\.mp4\?.*$/
// @version    	1.14
// @description	SeriesList
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @grant		GM_setValue
// @grant		GM_getValue
// @grant 		GM.setValue
// @grant 		GM.getValue
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/storage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/data.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_7.user.js
// @noframes
// ==/UserScript==

/*
 * Global Setting Variables.
 */
var previewSteps = 20;
var closeEnd = true;
var enablePreview = true;
var timeShow = 3;
var timeStep = 5;
var volStep = 10;
var noStepPreview = false;

/**
 * GM_setValue with new or old Api
 * @param key {String} - Key
 * @param key {String | Number} - value
 * @return null
 */
async function setGMValue(key, val) {
    if (typeof GM_setValue === "function") {
        GM_setValue(key, val);
    } else {
        await GM.setValue(key, val);
    }
}

/**
 * GM_getValue with new or old Api
 * @param key {String} - Key
 * @param def {String | Number} - default if nothing is found value
 * @return {String | Number} requested Value or defaut.
 */
async function getGMValue(key, def) {
    if (typeof GM_getValue === "function") {
        return GM_getValue(key, def);
    } else {
        return await GM.getValue(key, def);
    }
}

/**
 * Replaces the default Colors with the From the Settings
 */
var replaceStyleColors = async function () {
    $('#defineColors').attr('href', await getGMValue('style', styleColors.Default));
}

/**
 * Set Script Permanent Variables and redirect.
 */
var setEpisodeVariables = async function () {
    await setGMValue('series', jDecode(getGetter('series')));
    await setGMValue('season', jDecode(getGetter('season')));
    await setGMValue('episode', jDecode(getGetter('episode')));
    await setGMValue('episodeRange', jDecode(getGetter('episodeRange')));
    await setGMValue('style', jDecode(getGetter('style')));
    await setGMValue('autoplay', jDecode(getGetter('autoplay')).toLowerCase() == 'true');

    /*Setting*/
    await setGMValue('previewSteps', parseInt(jDecode(getGetter('previewSteps'))));
    await setGMValue('closeEnd', jDecode(getGetter('closeEnd')).toLowerCase() == 'true');
    await setGMValue('enablePreview', jDecode(getGetter('enablePreview')).toLowerCase() == 'true');
    await setGMValue('timeShow', parseInt(jDecode(getGetter('timeShow'))));
    await setGMValue('timeStep', parseInt(jDecode(getGetter('timeStep'))));
    await setGMValue('volStep', parseInt(jDecode(getGetter('volStep'))));
    await setGMValue('disableAutoplayOnExit', jDecode(getGetter('disableAutoplayOnExit')).toLowerCase() == 'true');
    await setGMValue('noStepPreview', jDecode(getGetter('noStepPreview')).toLowerCase() == 'true');

    //RESET ERROR
    await setGMValue('isError', false);

    window.location = getGetter('redirect');
}

/**
 * On bs-Data save Data and Redirect
 */
if (/^https:\/\/bs.to\/data.*?$/.test(window.location.href)) {
    setEpisodeVariables();
} else {
    initMediaplayer();
}

/**
 * InitPage API - Loads Serieslist is needed. Start Build main and Side Content if Finished.
 */
var onDocumentReady = async function () {
    await replaceStyleColors();
    await setSetting();

    fillTopText();
    $('#vid').attr('src', window.location.href);

    if (enablePreview) {
        if (noStepPreview) {
            loadFullVideoTimelinePreview();
        } else {
            loadVideoTimelinePreview();
            window.videoPreview = true;
        }
    }

    toggleAutoplay(await getGMValue('autoplay', false));
    updateDark(await getGMValue('lastDark', 0));

    onerror();
    addInterfaceEventhandler();
    addVideoEventhandler();
    startHideShow(timeShow);
    showAllEvent();
}

var setSetting = async function () {
    previewSteps = await getGMValue('previewSteps', 20);
    closeEnd = await getGMValue('closeEnd', true);
    enablePreview = await getGMValue('enablePreview', true);
    timeShow = await getGMValue('timeShow', 3);

    timeStep = await getGMValue('timeStep', 5);
    volStep = await getGMValue('volStep', 10);

    noStepPreview = await getGMValue('noStepPreview', false);
}

/**
 * Start Video when everything is loaded
 */
var onDocumentLoaded = function () {
    $('#vid')[0].play();
}

/**
 * Stop Original Video before remove - Parallel Audio Fix
 */
var onBeforeDocumentLoad = function () {
    //Stop old Video : Parallel Fix
    $('video').each(function () {
        $(this).removeAttr('autoplay')
        $(this).find('source').attr('src', '');
        $(this).remove();
    });
}

/**
 * Set Episode Info in Topbar
 */
var fillTopText = async function () {
    $('#max').html(await getGMValue('episodeRange', '1/1'));
    var season = await getGMValue('season', '1');
    $('#sea').html((season == '0') ? 'Special' : ('Season ' + season));
    $('#ser').html(await getGMValue('series', 'Series'));
    $('#tit').html(await getGMValue('episode', 'Episde 1'));
}

/**
 * Set an errorhandler for the VideoElement
 */
var onerror = function () {
    $('#vid').one('error', failed);
    if (typeof window.timer === 'undefined') {
        window.timer = 0;
    }
    window.timer++;
}

/**
 * Videoerrorhandler for the Video
 * @param e {Event} - event
 */
var failed = function (e) {
    console.log(e.target.error.code);
    if (e.target.error.code == e.target.error.MEDIA_ERR_NETWORK) {
        console.log('Network Error');
        window.timer--;
    }

    window.setTimeout(async function () {
        if (window.timer > 3) {
            if (await getGMValue("isError", false)) {
                await setGMValue("isError", false);
                window.location = 'https://bs.to/?error';
            } else {
                await setGMValue("isError", true);
                location.reload();
            }
        } else {
            if (e.target.error.code == e.target.error.MEDIA_ERR_NETWORK) {
                console.log('Network Extend');

                window.isErrorHandling = true;

                $("#vid")[0].pause();
                $("#vid")[0].load();

                $('#vid').one('loadedmetadata', function () {
                    setPlayerStartupValues();
                    window.isErrorHandling = false;
                    console.log('Network Execute');
                });

                $("#vid")[0].play();
            } else {
                $("#vid")[0].pause();
                $("#vid")[0].load();
                $("#vid")[0].play();
            }

            onerror();
        }
    }, 5000);
}

/**
 * Adds Eventhandler for Interactive Videocontrolls. Async = Faster
 */
var addInterfaceEventhandler = async function () {
    // Click and Drag without neededto stay at bar
    var handlerDar = function (e) {
        updateDark((e.pageX - $('#darkPlane').offset().left) * $('#darkPlane')[0].max / $('#darkPlane').outerWidth());
    };

    $('#infoPanel').bind('mousedown', function (e) {
        updateDark((e.pageX - $('#darkPlane').offset().left) * $('#darkPlane')[0].max / $('#darkPlane').outerWidth());

        $('body').bind('mousemove', handlerDar);
        window.isDrag = true;
        $('#darkPlane')[0].focus();

        $('body').bind('mouseup', function (e) {
            $('body').unbind();

            if (!$('#vid')[0].paused && !$('#vid')[0].ended && !getDefault(window.isHover, false)) {
                activateControll(true);
            }
            window.isDrag = false;
        });
    });

    $('#plus').bind('mousedown', function (e) {
        window.isSpeed = true;
        changeSpeed(1);

        window.isDrag = true;

        $('body').bind('mouseup', function (e) {
            $('body').unbind();
            window.isSpeed = false;
            window.speedTick = 0;

            if (!$('#vid')[0].paused && !$('#vid')[0].ended && !getDefault(window.isHover, false)) {
                activateControll(true);
            }
            window.isDrag = false;
        });
    });

    $('#minus').bind('mousedown', function (e) {
        window.isSpeed = true;
        changeSpeed(-1);

        window.isDrag = true;

        $('body').bind('mouseup', function (e) {
            $('body').unbind();
            window.isSpeed = false;
            window.speedTick = 0;

            if (!$('#vid')[0].paused && !$('#vid')[0].ended && !getDefault(window.isHover, false)) {
                activateControll(true);
            }
            window.isDrag = false;
        });
    });

    // Click and Drag without neededto stay at bar
    var handlerPro = function (e) {
        var x = (e.pageX - $('#progress').offset().left); // or e.offsetX (less support, though)
        var clickedValue = x * $('#progress').attr('max') / $('#progress').outerWidth();
        updateTime(clickedValue);
        showCur(e.pageX, clickedValue);
        $('#curProc').show();
    };

    $('#bars').bind('mousedown', function (e) {
        updateTime((e.pageX - $(this).offset().left) * $('#progress').attr('max') / this.offsetWidth);

        $('body').bind('mousemove', handlerPro);
        $('#vid')[0].pause();
        window.isDrag = true;

        $('body').bind('mouseup', function (e) {
            $('#vid')[0].play();
            $('#curProc').hide();
            $('body').unbind();

            if (!$('#vid')[0].paused && !$('#vid')[0].ended && !getDefault(window.isHover, false)) {
                activateControll(true);
            }
            window.isDrag = false;
        });
    });

    $('#bars').bind("mousemove", function (e) {
        var x = e.pageX - $(this).offset().left;
        var clickedValue = x * $('#progress').attr('max') / $(this).outerWidth();
        showCur(e.pageX, clickedValue);
        $('#curProc').show();
    });

    $('#bars').bind("mouseleave", function (e) {
        $('#curProc').hide();
    });

    // Click and Drag without neededto stay at bar
    var handlerVol = function (e) {
        updateVolume((e.pageX - $('#volume').offset().left) * $('#volume')[0].max / $('#volume').outerWidth());
    };

    $('#volumeCol').bind('mousedown', function (e) {
        updateVolume((e.pageX - $('#volume').offset().left) * $('#volume')[0].max / $('#volume').outerWidth());

        $('body').bind('mousemove', handlerVol);
        $('#volume').focus();
        window.isDrag = true;

        $('body').bind('mouseup', function (e) {
            $('body').unbind();
            $('#volume').blur();

            if (!$('#vid')[0].paused && !$('#vid')[0].ended && !getDefault(window.isHover, false)) {
                activateControll(true);
            }
            window.isDrag = false;
        });
    });

    $('#playpause').bind('click', function (e) {
        playpause();
    });

    $('#clicklayer').bind('click', function (e) {
        playpause();
    });

    $('#mute').bind('click', function (e) {
        updateVolume('mute')
    });

    $('#close').bind('click', async function (e) {
        if (await getGMValue('disableAutoplayOnExit', false)) {
            window.autoP = false;
        }
        closeVideo();
    });

    $('#fullscreen').bind('click', function (e) {
        toggleFullscreen();
    });

    $('#autoplayChange').bind('click', function () {
        toggleAutoplay();
    });

    $('#infoPanel').bind('mouseover', function (e) {
        activateControll(false)
        window.isHover = true;
    });

    $('#video-controls').bind('mouseover', function (e) {
        activateControll(false);
        window.isHover = true;
    });

    $('#infoPanel').bind('mouseout', function (e) {
        if (!$('#vid')[0].paused && !$('#vid')[0].ended && !getDefault(window.isDrag, false)) {
            activateControll(true);
        }
        window.isHover = false;
    });

    $('#video-controls').bind('mouseout', function (e) {
        if (!$('#vid')[0].paused && !$('#vid')[0].ended && !getDefault(window.isDrag, false)) {
            activateControll(true);
        }
        window.isHover = false;
    });

    var screen_change_events = "webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange";
    $(document).on(screen_change_events, function () {
        if ((window.fullScreen) ||
            (window.innerWidth == screen.width && window.innerHeight == screen.height)) {
            $('#fullscreen').html(getFullscreen(true));
        } else {
            $('#fullscreen').html(getFullscreen(false));
        }
    });
}

/**
 * Set the video handler.
 */
var addVideoEventhandler = async function () {
    $('#vid').bind('ended', function () {
        if (closeEnd) {
            closeVideo();
        }
    });

    $('#vid').bind('timeupdate', function (e) {
        if (window.isErrorHandling === true) {
            return;
        }

        var curTime = $('#vid')[0].currentTime;
        var playTimeMin = zeroFill(parseInt(('' + (curTime / 60))), 2);
        var playTimeSec = zeroFill(parseInt(('' + (curTime % 60))), 2);

        var duration = $('#vid')[0].duration;
        var durationMin = zeroFill(parseInt(('' + (duration / 60))), 2);
        var durationSec = zeroFill(parseInt(('' + (duration % 60))), 2);

        $('#timeShow').html(playTimeMin + ":" + playTimeSec + " / " + durationMin + ":" + durationSec);
        $('#progress').attr('max', duration).attr('value', curTime);

        $('#progressVisible').css('width', ((curTime / duration) * 100) + '%');

        setGMValue('lastTime', curTime);
    });

    $('#vid').bind('volumechange', function () {
        setGMValue('lastAudio', $('#vid')[0].volume);
    });

    $('#vid').bind('playing', function () {
        $('#playpause').html(getPlay(false));
        if (!getDefault(window.isHover, false) && !getDefault(window.isDrag, false)) {
            activateControll(true);
        }
    });

    $('#vid').bind('pause', function () {
        $('#playpause').html(getPlay(true));
        activateControll(false);
    });

    $('#vid').bind('progress', function () {
        var canvas = $('#buffer').attr('width', this.duration)[0];
        var ctx = canvas.getContext('2d');

        var b = this.buffered;
        var i = b.length;
        var w = canvas.width;
        var h = canvas.height;
        var vl = this.duration;
        var x1;
        var x2;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#FFFFFF';
        while (i--) {
            x1 = b.start(i) / vl * w;
            x2 = b.end(i) / vl * w;
            ctx.fillRect(x1, 0, x2 - x1, h);
        }
        ctx.fillStyle = '#fff';

        x1 = this.currentTime / vl * w;

        ctx.fill();
    })

    $('#vid').one('play', function () {
        //After the Video plays
        $('#vid').bind('ratechange', function () {
            $('#speed').html($('#vid')[0].playbackRate.toFixed(2) + 'x');
            setGMValue('lastSpeed', $('#vid')[0].playbackRate);
        });

        setPlayerStartupValues();
    });

    $('#vid').on('loadstart waiting', function (event) {
        $('.loader').toggleClass('isLoading', true);
    });
    $('#vid').on('canplay', function (event) {
        $('.loader').toggleClass('isLoading', false);
    });
}

/**
 * Change Current Video Time
 * @param time {Number} - time
 * @param add {boolean} - to add
 */
var updateTime = function (time, add) {
    var newTime = 0;

    if (add) {
        newTime = $('#vid')[0].currentTime + time;
    } else {
        newTime = time;
    }

    if (typeof newTime === 'number') {
        if (newTime < 0) {
            return;
        }
        if (newTime >= $('#vid')[0].duration) {
            return;
        }
    } else {
        return;
    }

    $('#vid')[0].currentTime = newTime;
}

/**
 * Updates the Volume and Volumebar
 * @param vol {Number} - volume to add
 */
var updateVolume = function (vol) {
    var video = $('#vid')[0];

    if (isNaN(vol)) {
        video.muted = !video.muted;
        if (video.muted == false && video.volume == 0) {
            updateVolume(50);
        }
    } else {
        //Keep between 0 - 100
        vol = (vol > 100) ? 100 : ((vol < 0) ? 0 : vol);

        video.volume = vol / 100;
        video.muted = (video.volume == 0);
    }

    if (video.muted || video.volume == 0) {
        $('#mute').html(getSound(0));
    } else {
        $('#mute').html(getSound(video.volume / 0.3));
    }

    $('#volume').attr('value', video.volume * 100);
}

/**
 * Change the playback speed
 * @param val {Number} - value to add in persent
 * @param isTimeout {boolean}- if the call is from setTimout
 */
var changeSpeed = function (val, isTimeout) {
    if (isTimeout && !window.isSpeed) {
        return;
    }

    var nextVal = $('#vid')[0].playbackRate + (val / 100);
    nextVal = (nextVal > 4) ? 4 : ((nextVal < 0.5) ? 0.5 : nextVal);
    nextVal = parseFloat(Math.round(nextVal * 100) / 100);

    $('#vid')[0].playbackRate = nextVal;

    if (typeof window.speedTick === 'undefined') {
        window.speedTick = 0;
    }

    window.speedTick++;

    var nextSpeed = speedTick * 100;
    nextSpeed = (nextSpeed > 900) ? 950 : nextSpeed;

    if (window.isSpeed) {
        setTimeout(changeSpeed, 1000 - nextSpeed, val, true);
    } else {
        window.speedTick = 0;
    }
}

/**
 * Update hovered time and position of the selected-time-element
 * @param x {Number} - x-coordinate
 * @param seconds {Number} - Seconds to show
 */
var showCur = function (x, seconds) {
    var min = zeroFill(parseInt(('' + (seconds / 60))), 2);
    var sec = zeroFill(parseInt(('' + (seconds % 60))), 2);

    if (window.videoPreview == true) {
        if (noStepPreview) {
            $('#previewTimelineVideo')[0].currentTime = seconds;          
        } else {
            var step = Math.floor((seconds - (seconds % ($('#preview')[0].duration / previewSteps))) / ($('#preview')[0].duration / previewSteps)); //Step
            $('#canvasContainer canvas').hide();
            if ($('#canvasContainer canvas').length > step) {
                $('#canvasContainer canvas:nth-of-type(' + (step + 1) + ')').show();
            }
        }
    }
    $('#curProc').css('left', ((x - ($('#curProc').outerWidth(true) / 2)) + "px"))
    $('#previewText').html(min + ":" + sec);
}

/**
 * Toggled the play-state of the video
 */
var playpause = function () {
    if ($('#vid')[0].paused || $('#vid')[0].ended) {
        $('#vid')[0].play();
    } else {
        $('#vid')[0].pause();
    }

    showAllEvent();
}

/**
 * Fill a String shorter than two with leading Zeros.
 * @param str {String} - String.
 * @return {String}
 */
var zeroFill = function (str, width) {
    str = '' + str;
    var newWidth = (width < str.length) ? str.length : width;
    return ('00000000000' + str).slice(-1 * newWidth);
}

/**
 * Start HideShow
 */
var startHideShow = function (time) {
    window.delay = setInterval(delayCheck, 500);
    window.waitTime = time;
    $('html').on('mousemove', showAllEvent);
}

/**
 * Hide Controlls after x Seconds.
 */
var delayCheck = function () {
    if (getDefault(window.activated, true)) {
        if (getDefault(window.timedelay, 1) == (getDefault(window.waitTime, 3) * 2)) {
            $('.hide').removeClass('show');
            window.timedelay = 1;
        }
        window.timedelay = getDefault(window.timedelay, 1) + 1;
    }
}

/**
 * Show Controlls for x Seconds
 */
var showAllEvent = function () {
    $('.hide').addClass('show');
    window.timedelay = 1;
    clearInterval(window.delay);
    window.delay = setInterval(delayCheck, 500);
}

/**
 * Turn Invisible machanism on or off
 * @param {boolean} on or off
 */
var activateControll = function (act) {
    window.activated = act;
}

/**
 * Enter or Exit Fullscreen;
 */
var toggleFullscreen = function () {
    if ((window.fullScreen) || window.innerWidth == screen.width && window.innerHeight == screen.height) {
        exitFullscreen();
    } else {
        enterFullscreen(document.documentElement);
    }
}

/**
 * Enter Fullscreen from a element
 */
var enterFullscreen = function (element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    }
}

/**
 * Exits Fullscrren
 */
var exitFullscreen = function () {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

/**
 * Close the Video and get back to the episodes
 */
var closeVideo = async function () {
    await setGMValue('isError', false);
    window.location = 'https://bs.to/?next' + ((typeof window.autoP === 'boolean') ? ('&autoplay=' + window.autoP) : '');
}

/**
 * Sets all Mediaplayer variables of the Last run.
 */
var setPlayerStartupValues = async function () {
    if ((await getGMValue('lastLocation', '')) === window.location.href) {
        updateTime(await getGMValue('lastTime', 0))
    }
    await setGMValue('lastLocation', window.location.href);

    updateVolume((await getGMValue('lastAudio', 1)) * 100);
    changeSpeed(((await getGMValue('lastSpeed', 1)) * 100) - 100);
}

/**
 * Return an Defaultvalue if value not set.
 * @param value {All} - Value to check.
 * @param defaultValue {All} - return if value not set.
 * @return {All}.
 */
var getDefault = function (value, defaultValue) {
    if (typeof value === 'undefined' || value === null) {
        return defaultValue;
    }
    return value;
}

/**
 * Updates the darkPlane with a darkshade. Updates number and progressbar.
 * @param val {Numver} - persentage of dimm
 */
var updateDark = function (val) {
    $('#clicklayer').css('opacity', (val / 100));
    $('#darkPlane').attr('value', val);

    setGMValue('lastDark', val);
}

/**
 * Provides a play-icon triangle with 35x35.
 * @return {String} play-icon triangle svg-tag.
 */
var getPlay = function (isplay) {
    if (isplay) {
        return '<svg height="35" width="35"><polygon points="8,5 8,30 28,18"></polygon></svg>';
    } else {
        return '<svg height="35" width="35"><polygon points="10,5 15,5 15,30 10,30"></polygon><polygon points="20,5 25,5 25,30 20,30"></polygon></svg>';
    }
}

/**
 * Provides a speaker-icon with variable soundwaves and 35x35.
 * @param {Number} val - number of soundwaves 0-3
 * @return {String} speaker-icon triangle svg-tag.
 */
var getSound = function (val) {
    var svg = $('<svg/>', {
            'height': '35',
            'width': '35'
        }).append('<polygon points="1,12 1,21 8,21 17,29 17,5 9,12"></polygon>');

    if (val == 0) {
        svg.append('<polygon points="19,12 30,24 32,23 21,10"></polygon>');
        svg.append('<polygon points="22,24 32,12 30,10 20,23"></polygon>');
    } else {
        svg.append('<polyline style="fill:none; stroke-width:3;" points="21,12 23,14 23,17 23,20 21,22"></polyline>');

        if (val >= 1) {
            svg.append('<polyline style="fill:none; stroke-width:3;" points="24,26 27,22 28,17 27,12 24,8"></polyline>');
        }

        if (val >= 2) {
            svg.append('<polyline style="fill:none; stroke-width:3;" points="28,5 31,9 33,17 31,25 28,30"></polyline>');
        }
    }

    return svg[0].outerHTML;
}

/**
 * Get SVG for Fullscrennbutton on or off
 * @param ison {Boolean} - Is Fullscreen On.
 */
var getFullscreen = function (ison) {
    var svg = $('<svg/>', {
            'height': '35',
            'width': '35'
        });

    if (ison) {
        svg.append('<polygon points="7,15 15,15 15,7 12,7 12,12 7,12"></polygon>');
        svg.append('<polygon points="7,20 15,20 15,28 12,28 12,23 7,23"></polygon>');
        svg.append('<polygon points="20,28 20,20 28,20 28,23 23,23 23,28"></polygon>');
        svg.append('<polygon points="20,7 20,15 28,15 28,12 23,12 23,7"></polygon>');
    } else {
        svg.append('<polygon points="10,15 10,10 15,10 15,7 7,7 7,15"></polygon>');
        svg.append('<polygon points="10,20 10,25 15,25 15,28 7,28 7,20"></polygon>');
        svg.append('<polygon points="20,25 25,25 25,20 28,20 28,28 20,28"></polygon>');
        svg.append('<polygon points="20,10 25,10 25,15 28,15 28,7 20,7"></polygon>');
    }

    return svg[0].outerHTML;
}

/**
 * Toggle Autoplay.
 * @param state {Boolean} - Optional for Expl. Set.
 * @return {Boolean}
 */
var toggleAutoplay = function (state) {
    if (typeof window.autoP === 'undefined') {
        window.autoP = true;
    }

    if (typeof state !== 'undefined') {
        window.autoP = (('' + state).toLowerCase() == 'true' || state == true || state == 1 || state == '1');
    } else {
        window.autoP = !window.autoP;
    }

    $('#autoplayChange').toggleClass('autoOff', !window.autoP);

    setGMValue('autoplay', window.autoP);

    return window.autoP;
}

/**
 * Loads an Video and Buffers Frame for Each Preview Step (Default : 60 Steps)
 */
var loadVideoTimelinePreview = function () {
    if (typeof window.PrevErrors === 'undefined') {
        window.PrevErrors = 0;
    }

    $('#preview').one('timeupdate', function () {
        var video = $('#preview')[0];
        var duration = video.duration;
        var curLoadingTime = 0;
        var count = 0;
        var currentErr = window.PrevErrors;
        var scale = video.videoHeight / 100;

        if ($('#canvasContainer canvas').length != previewSteps) {
            while ($('#canvasContainer canvas').length < previewSteps) {
                var newCanvas = $('<canvas></canvas>')
                    .attr('style', 'height:100px; width:' + (video.videoWidth / scale) + 'px;')
                    .attr('height', '100')
                    .attr('width', (video.videoWidth / scale))
                    .attr('style', 'height:100px; width:' + (video.videoWidth / scale) + 'px;')
                    .hide().appendTo('#canvasContainer');
            }
        }

        var intervalFunction = async function () {
            if (window.PrevErrors > currentErr) {
                return false;
            }

            if (isTimeBuffered(video, curLoadingTime)) {
                await drawVidToCanvasAndAppend(count, video, 'canvasContainer', currentErr);
                if (window.PrevErrors > currentErr) {
                    return false;
                }
                video.currentTime = curLoadingTime += (duration / previewSteps);
                count++;
            }

            if (curLoadingTime < video.duration - 1 && count < previewSteps) {
                setTimeout(intervalFunction, 10);
            }
        }

        intervalFunction();
    });

    $('#preview').one('error', function () {
        $("#preview").unbind();
        console.log('Prev.Error: ' + (++window.PrevErrors));
        setTimeout(loadVideoTimelinePreview, 1000);
    });

    $('#preview').one('canplay', function() {
        $("#preview")[0].play();
    })
    
    if (window.location.href.includes('?')) {
        $('#preview').attr('src', window.location.href + '&preview');
    } else {
        $('#preview').attr('src', window.location.href + '?preview');
    }

}

/**
 * Draw Videoframe on Canvas and append to target. Async
 * @param video {Element} - Video element.
 * @param appendTargetId {String} - id if target to append.
 */
var drawVidToCanvasAndAppend = function (canvasIndex, video, appendTargetId, err) {
    return new Promise((resolve, reject) => {
        var canvas = $('#canvasContainer canvas').eq(canvasIndex);
        var ctx = canvas[0].getContext('2d');
        var scale = video.videoHeight / 100;

        var draw = function () {
            if (window.PrevErrors > err) {
                return false;
            }

            ctx.drawImage(video, 0, 0, (video.videoWidth / scale), 100);

            if (!isCanvasDrawn(canvas[0])) {
                setTimeout(draw, 100);
            } else {
                resolve(true);
            }
        }
        setTimeout(draw, 100);
        draw();
    });
}

/**
 * Check if on canvas was drawn and is not the same as before
 * @param canvas {Element} - canvas.
 * @return {Boolean}
 */
var isCanvasDrawn = function (canvas) {
    var ctxCur = canvas.getContext("2d");
    var ctxPre = null;

    var checkPrevious = false;

    var previous = $(canvas).prev('canvas');
    if (previous.length != 0) {
        ctxPre = previous[0].getContext("2d");
        checkPrevious = true;
    }

    if (ctxCur.getImageData(0, 0, canvas.width, canvas.height).data[3] != 0) {
        if (checkPrevious) {
            if (!checkIfSame(ctxCur.getImageData(0, 0, canvas.width, canvas.height).data, ctxPre.getImageData(0, 0, canvas.width, canvas.height).data, 12)) {
                return true;
            }
        } else {
            return true;
        }
    }
    return false
}

/**
 * Check if the two arrays are the same until index is reached.
 * @param arr1 {Array} - Array One.
 * @param arr2 {Array} - Array Two.
 * @param indezies {Number} - Max Index to check.
 * @return {Boolean}.
 */
var checkIfSame = function (arr1, arr2, indezies) {
    var same = true;

    $.each(arr1, function (index, value) {
        if (arr1[index] != arr2[index]) {
            same = false;
            return false;
        }

        if (indezies < index) {
            return false;
        }
    });

    return same;
}

/**
 * Checks if Time is Buffered in Video.
 * @param video {Element} - The Videoelement.
 * @param time {Number} - time to check [ms]
 * @return {Boolean}
 */
var isTimeBuffered = function (video, time) {
    var buf = video.buffered;
    var len = buf.length;
    while (len--) {
        if (time <= Math.floor(buf.end(len)) && time >= Math.floor(buf.start(len))) {
            return true;
        }
    }
    return false;
}

var loadFullVideoTimelinePreview = async function () {
    var req = new XMLHttpRequest();
    req.open('GET', 'video.mp4', true);
    req.responseType = 'blob';

    req.onload = function () {
        if (this.status === 200) {
            var videoBlob = this.response;
            var vid = URL.createObjectURL(videoBlob);

            var previewVideo = $('<video></video>').attr('id', 'previewTimelineVideo').attr('muted', '').appendTo('#canvasContainer');

            $('#previewTimelineVideo').one('seeking', function () {
                var scale = previewVideo[0].videoHeight / 100;

                previewVideo.css({
                    'height': '100%',
                    'width': '100%',
                    'border-radius': '3px',
                });

                $('#curProc').css({
                    'height': '100px',
                    'width': (previewVideo[0].videoWidth / scale) + 'px',
                });
            });

            previewVideo[0].src = vid;

            window.videoPreview = true;
        }
    }
    req.onerror = function () {
        console.log('Preview-Error')
        loadFullVideoTimelinePreview();
    }

    req.send();
}

/**
 * Key Bitches
 */
$(window).keydown(async function (e) {
    var player = document.getElementById('vid');
    if (player !== null) {
        if (e.keyCode === 32) { //Space
            e.preventDefault();
            playpause();
        } else if (e.keyCode === 9) { //Tab
            e.preventDefault();
            if (await getGMValue('disableAutoplayOnExit', false)) {
                window.autoP = false;
            }
            closeVideo();
        } else if (e.keyCode === 81) { //Q
            e.preventDefault();
            updateVolume('mute')
        } else if (e.keyCode === 37) { //Arr-left
            e.preventDefault();
            updateTime(timeStep * -1, true);
        } else if (e.keyCode === 39) { //Arr-right
            e.preventDefault();
            updateTime(timeStep, true);
        } else if (e.keyCode === 38) { //Arr-up
            e.preventDefault();
            updateVolume((player.volume * 100) + volStep);
        } else if (e.keyCode === 40) { //Arr-down
            e.preventDefault();
            updateVolume((player.volume * 100) - volStep);
        } else if (e.keyCode === 107 || e.keyCode === 171) { //+
            e.preventDefault();
            changeSpeed(1);
        } else if (e.keyCode === 109 || e.keyCode === 173) { // -
            e.preventDefault();
            changeSpeed(-1);
        } else if (e.keyCode === 49) {
            e.preventDefault();
            updateDark(0);
        } else if (e.keyCode === 50) {
            e.preventDefault();
            updateDark(10);
        } else if (e.keyCode === 51) {
            e.preventDefault();
            updateDark(20);
        } else if (e.keyCode === 52) {
            e.preventDefault();
            updateDark(30);
        } else if (e.keyCode === 53) {
            e.preventDefault();
            updateDark(40);
        } else if (e.keyCode === 54) {
            e.preventDefault();
            updateDark(50);
        } else if (e.keyCode === 55) {
            e.preventDefault();
            updateDark(60);
        } else if (e.keyCode === 56) {
            e.preventDefault();
            updateDark(70);
        } else if (e.keyCode === 57) {
            e.preventDefault();
            updateDark(80);
        } else if (e.keyCode === 48) {
            e.preventDefault();
            updateDark(90);
        } else if (e.keyCode === 63) {
            e.preventDefault();
            updateDark(100);
        } else if (e.keyCode === 122) { //F11
            e.preventDefault();
            toggleFullscreen();
        } else if (e.keyCode === 65) { //A
            e.preventDefault();
            toggleAutoplay();
        }

        //Every Key
        showAllEvent();
    }
});

$(window).on('wheel', function (e) {
    var player = document.getElementById('vid');
    if (e.originalEvent.deltaY < 0) {
        updateVolume((player.volume * 100) + volStep);
    } else {
        updateVolume((player.volume * 100) - volStep);
    }
});
