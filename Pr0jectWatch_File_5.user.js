// ==UserScript==
// @name        Project Watch - File 5
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     https://bs.to/log
// @include     https://bs.to/settings
// @include     https://bs.to/playlist
// @version    	1.0
// @description	Log and Settings
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     http://rubaxa.github.io/Sortable/Sortable.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/logStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/data.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/keyControll.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_5.user.js
// ==/UserScript==

initBsPage();

/**
 * Api initPage on Document loaded.
 */
var onDocumentReady = async function () {
    if (window.location.href == 'https://bs.to/log') {
        initLogCont();
    } else if (window.location.href == 'https://bs.to/settings') {
        initSettingCont();
    } else if (window.location.href == 'https://bs.to/playlist') {
        initPlaylistCont();
    }

    initSideCont();
}

/**
 * Init Log Page.
 */
var initLogCont = function () {
    $('#contentContainer').empty().append('<h1 class="mainSiteTitle">Series-Log</h1>').append('<table id="logTable"></table>');

    var table = $('#logTable').append('<tr><th>Nr</th><th>Series</th><th>Season</th><th>Index</th><th>Episode German</th><th>Episode Original</th><th>Hoster</th><th>Date</th></tr>');
    $.each(getFullLog(), function (index, v) {
        table.append('<tr><td>' + (index + 1) + '</td><td>' + v.series + '</td><td>' + ((v.season == 0) ? 'S' : v.season) + '</td><td>' + v.episodeNr + '/' + v.episodes + '</td><td>' + v.episodeDE + '</td><td>' + v.episodeOR + '</td><td>' + v.hoster + '</td><td>' + v.date + '</td></tr>');
    });
}

/**
 * Creates a list with max Five Elements of the last watched Series with Seasons.
 */
var initSideCont = function () {
    var target = $('#sideContainerContent').empty().append('<h1 class="sideSiteTitel">Last Watched</h1>');

    var lastFiveList = [];
    $.each(getFullLog().reverse(), function (index, value) {
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
 * Check if Series is Already in Serieslist
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

/**
 * Init Setting Page.
 */
var initSettingCont = function () {
    $('#contentContainer').empty().append('<h1 class="mainSiteTitle">Settings</h1>');
    addHosterSort();
    addStylesConf();
    addGeneralConf();
    addMediaplayerConf();

    $('.settingHeader').bind('click', function () {
        $(this).closest('.settingContainer').attr('ison', !($(this).closest('.settingContainer').attr('ison') == 'true'));
    });
}

/**
 * Add HostersortConfig.
 */
var addHosterSort = function () {
    var hoster = JSON.parse(getData('hoster', JSON.stringify(defaultHoster)));
    if (hoster.length < defaultHoster.length) {
        hoster = defaultHoster;
        setData('hoster', JSON.stringify(defaultHoster), true);
    }

    var arrow = '<svg viewBox="0 0 30 30"><g><path d="M10 0 L25 15 L10 30 L5 25 L15 15 L5 5 Z" /></g></svg>';
    var target = $('#contentContainer').append('<div ison="false" class="settingContainer" id="hosterSortContainer"><div class="settingHeader">' + arrow + '<h3>Hoster Proirity</h3></div><ul id="sortHoster"></ul></div>').find('#sortHoster');
    $.each(hoster, function (index, value) {
        $.each(hosterSupport, function (i, v) {
            if (v[0] == value) {
                target.append('<li sup="' + v[1] + '"><div class="sortIndex">' + (index + 1) + '</div><div class="hosterName">' + value + '</div></li>');
            }
        });
    })

    Sortable.create($("#sortHoster")[0], {
        animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
        ghostClass: "sortableGhost",
        onUpdate: function (evt) {
            var newSort = [];
            $('#sortHoster li').each(function (index, value) {
                newSort.push($(this).find('.hosterName').text().trim());
                $(this).find('.sortIndex').text(index + 1);
            });
            setData('hoster', JSON.stringify(newSort), true);
        }
    });
}

/**
 * Add Styleconfig.
 */
var addStylesConf = function () {
    var arrow = '<svg viewBox="0 0 30 30"><g><path d="M10 0 L25 15 L10 30 L5 25 L15 15 L5 5 Z" /></g></svg>';
    var target = $('#contentContainer').append('<div ison="false" class="settingContainer" id="styleColorContainer"><div class="settingHeader">' + arrow + '<h3>Style</h3></div><select id="stylesApply"></select></div>').find('#stylesApply');

    var styleLink = getData('style', styleColors.Default);

    var isNotCustom = false;
    $.each(styleColors, function (index, value) {
        if (value == styleLink) {
            isNotCustom = true;
        }
        target.append('<option ' + ((value == styleLink) ? 'selected' : '') + ' value="' + value + '">' + index + '</option>');
    });

    $('#styleColorContainer').append('<span>Custom Colors</span><input placeholder="Customstyle Link" type="text" id="customStyles"><button id="applyStylesButton">Apply Custom Style</button>');

    if (!isNotCustom) {
        target.append('<option class="customSty" disabled selected value="' + styleLink + '">Custom Color</option>');
        $('#customStyles').val(styleLink);
    }

    $('#stylesApply').bind('change', function () {
        var styleHref = $('#stylesApply option:selected').val();
        setData('style', styleHref, true);
        $('#defineColors').attr('href', styleHref);
        $('#customStyles').val('');
    });

    $('#applyStylesButton').bind('click', function () {
        var styleHref = $('#customStyles').val();
        if (styleHref == '') {
            return false;
        }

        setData('style', styleHref, true);
        $('#defineColors').attr('href', styleHref);

        if (isNotCustom) {
            isNotCustom = false;
            target.append('<option class="customSty" disabled selected value="' + styleLink + '">Custom Color</option>');
        }

        $('.customSty:first').val(styleHref);
        target.val(styleHref);
    });
}

/**
 * Add GeneralConfigs.
 */
var addGeneralConf = function () {
    var arrow = '<svg viewBox="0 0 30 30"><g><path d="M10 0 L25 15 L10 30 L5 25 L15 15 L5 5 Z" /></g></svg>';
    var target = $('#contentContainer').append('<div ison="false" class="settingContainer" id="generalStyles"><div class="settingHeader">' + arrow + '<h3>Genreal</h3></div></div>').find('#generalStyles');

    addCheckbox(target, 'enableLog', true, 'Enable Log');
    addCheckbox(target, 'autoAutoplay', false, 'Enable Automatic Turn On Autoplay');
    addCheckbox(target, 'scrollUnwatched', false, 'Enable Automatic Scroll To First Unwatched Episode');
    addCheckbox(target, 'updateSeason', true, 'Update Favorised Seriesseason On New Season Watch');
    addCheckbox(target, 'playMerged', true, 'Don\'t Play [In Episode X Enthalten] - Episodes');
    addCheckbox(target, 'syncFavMenu', true, 'Enable Sync Watched Series In Favmenu [Turn Off On Mobiledevices]');
    addCheckbox(target, 'episodeSearch', false, 'Enable Episodesearch. Seriessearch on Episodelist will be disabled');

    addNumberInput(target, 'autoplayTime', 5, 'Timer Time For Autoplay [Sec]', 0, 60000);
    addNumberInput(target, 'updateWaitTime', 7, 'Time Till Next Listupdate [Days]', 1, 60000);
    addNumberInput(target, 'listTimeout', 10000, 'Time Till Serieslist Slowload [Ms]', 1, 60000);
    addNumberInput(target, 'minCharsSearch', 3, 'Min Characters In Search Before List Shows', 0, 60000);

    target.append('<button id="updateList">Manual Update List</button>');
    $('#updateList').bind('click', function () {
        setData('lastUpdate', 0, true);
        window.location = 'https://bs.to/serie-genre?redirect=' + jEncode(window.location.href);
    });

    target.append('<button id="removeLog">Clear Log</button>');
    $('#removeLog').bind('click', function () {
        window.localStorage.removeItem('loglist');
        window.location.reload();
    });
}

/**
 * Add MediaplayerConfigs.
 */
var addMediaplayerConf = function () {
    var arrow = '<svg viewBox="0 0 30 30"><g><path d="M10 0 L25 15 L10 30 L5 25 L15 15 L5 5 Z" /></g></svg>';
    var target = $('#contentContainer').append('<div ison="false" class="settingContainer" id="mediaStyles"><div class="settingHeader">' + arrow + '<h3>Mediaplayer</h3></div></div>').find('#mediaStyles');

    addCheckbox(target, 'closeEnd', true, 'Close On End');
    addCheckbox(target, 'enablePreview', true, 'Enable Timeline Preview');

    addNumberInput(target, 'previewSteps', 20, 'Preview Image Steps', 1, 60000);
    addNumberInput(target, 'timeShow', 3, 'Timer Time For Controlls Show Hide [Sec]', 1, 60000);
}

/**
 * Add an new Config with Checkbox.
 * @param addContainer {Jquery} - Container to add the config.
 * @param saveIndex {String} - Key for localStorage Save.
 * @param defaultState - Default State if not Set.
 * @param msg {String} - Description.
 */
var addCheckbox = function (addContainer, saveIndex, defaultState, msg) {
    addContainer.append('<div class="settingCheckbox"><label class="switch"><input ' + ((getData(saveIndex, defaultState)) ? 'checked' : '') + ' id="' + saveIndex + '" type="checkbox"/><span class="slider round"></span></label>' + msg + '<div>');
    $('#' + saveIndex).on('change', function () {
        setData(saveIndex, this.checked, true)
    });
}

/**
 * Add an new Config with Numberinput.
 * @param addContainer {Jquery} - Container to add the config.
 * @param saveIndex {String} - Key for localStorage Save.
 * @param defaultState - Default State if not Set.
 * @param msg {String} - Description.
 * @param min {Number} - min number.
 * @param max {Number} - max number.
 */
var addNumberInput = function (addContainer, saveIndex, defaultState, msg, min, max) {
    addContainer.append('<label class="settingInput"><input min="' + min + '" max="' + max + '" value="' + (getData(saveIndex, defaultState)) + '" type="number" id="' + saveIndex + '">' + msg + '</label>');
    $('#' + saveIndex).on('change', function () {
        var value = $(this).val();
        if (!isNaN(value)) {
            value = parseInt(value);
            if (value < min || value > max) {
                return;
            }
        } else {
            return;
        }

        setData(saveIndex, value, true)
    });
}

/**
 * Init Playlist Page
 */
var initPlaylistCont = function () {
    
}