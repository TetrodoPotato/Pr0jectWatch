/**
 * Focus Next Menu Item.
 * @param direction {Number} - prev. < 0 or next > 0
 */
var focusNext = function (direction) {
    if ($('#menuBurgerContainer').attr('ison') == 'true') {
        return focusNextMenu(direction);
    }

    var elm = getNextTabIndex('contentContainer', window.lastFocusList, direction);
    if (elm != false) {
        elm.focus();
        window.lastFocusList = elm;
        scrollToElement($(elm));
        return true;
    }
}

/**
 * Focus Next Menu Item.
 * @param direction {Number} - prev. < 0 or next > 0
 */
var focusNextMenu = function (direction) {
    var currentFoc = $(':focus');

    var elm = getNextTabIndex('sideMenu', currentFoc, direction);
    if (elm != false) {
        elm.focus();
        return true;
    }
}

/**
 * Get the next Element with Tabindex -1.
 * @param mainContainerId {String} - Id for the Main Parent Container for Search.
 * @param currentElement {Element} - The Current Element for search next or prev.
 * @param direction {Number} - prev. < 0 or next > 0
 * @return {Element} or {False} on Error or no next/prev. Element.
 */
var getNextTabIndex = function (mainContainerId, currentElement, direction) {
    var elems = $('#' + mainContainerId + ' [tabindex]:visible');
    if ($(currentElement).length == 0 || !$(currentElement).is(':visible') || !$(currentElement).is('#' + mainContainerId + ' [tabindex]:visible')) {
        return elems.first();
    } else if (!$(currentElement).is(':focus')) {
        return currentElement;
    }

    var returnElem = null;
    if (direction < 0) {
        returnElem = $(currentElement).prev('*[tabindex]:visible');
    } else {
        returnElem = $(currentElement).next('*[tabindex]:visible');
    }

    if (returnElem.length) {
        return returnElem;
    }

    elems = (direction < 0) ? elems.get().reverse() : elems;

    var nextIs = false;
    var returnElement = null;
    $(elems).each(function (index, value) {
        if (nextIs) {
            returnElement = this;
            return false;
        } else if ($(this)[0] == $(currentElement)[0]) {
            nextIs = true;
        }
    })

    return ((nextIs) ? ((returnElement !== null) ? returnElement : false) : false)
}

/**
 * Change Season.
 * @param direction {Number} - up < 0 or down > 0
 */
var changeSeason = function (direction) {
    if (typeof window.countDown !== 'undefined') {
        clearTimeout(window.countDown);
    }

    if ($('#seasonContainer').length) {
        window.firstActive = (typeof window.firstActive == 'undefined') ? $('#seasonTable .active:first') : window.firstActive;

        if (direction < 0) {
            var prevElement = $('#seasonTable .active:first').prev('td');
            if (!prevElement.is("#favSeasonStar")) {
                $('#seasonTable .active:first').removeClass('active');
                prevElement.addClass('active');
            }
        } else {
            var nextElement = $('#seasonTable .active:first').next('td');
            if (nextElement.length) {
                $('#seasonTable .active:first').removeClass('active');
                nextElement.addClass('active');
            }
        }

        window.countDown = setTimeout(function () {
                if (window.firstActive[0] != $('#seasonTable .active:first')[0]) {
                    $('#seasonTable .active:first').click();
                }
            }, 1000);
    }
}

/**
 * Scroll To Element.
 * @param element {Element} - element.
 */
var scrollToElement = function (element) {
    if ($(element).length) {
        $(window).scrollTop(($(element).offset().top) - 200);
    }
}

/**
 * Watch EpisodeClick for KeyControll
 * @param element {Element} - Selected Element.
 */
var watchClick = function (element) {
    var target = $(element).closest('.seriesContainer');

    var watchLink = 'https://bs.to/serie/' + getSeriesId() + '/' + getSeason() + '/';
    watchLink += ((target.hasClass('episodeWatched')) ? 'unwatch:' : 'watch:') + target.find('.indexCont:first').text();

    makePageCall(watchLink, function () {
        target.toggleClass('episodeWatched');
        $('.active').toggleClass('watched', ($(".seriesContainer:not(.episodeWatched)").length == 0));
        syncSeries();
    });
}

/**
 * Favrite SeriesClick for KeyControll
 * @param element {Element} - Selected Element.
 */
var favClick = async function (element) {
    await updateEntry({
        Id: $(element).closest('*[seriesId]').attr('seriesId'),
        IsFav: $(element).toggleClass("Fav noFav").hasClass('Fav')
    });
}

/**
 * Key Bitches
 */
$(document).keydown(function (e) {
    (async function () {
        if (e.shiftKey || e.ctrlKey) {
            return;
        }

        if (e.keyCode === 27 && $('#autoplayButton').length) { //ESC | Close Next Window
            e.preventDefault();
            $('#cancelAutoplay').click();
        } else if ($(':focus').is('input')) { //On Search Focus
            if ($('#search').is(':focus')) {
                if (e.keyCode === 27) { //Esc / Enter / Down / Up | End Search Focus
                    e.preventDefault();
                    $('#search').blur();
                    focusNext(1);
                }
            }
        } else if (e.keyCode === 78) { //N
            e.preventDefault();
            $('#nextAutoplay').click();
        } else if (e.keyCode === 65) { // A
            e.preventDefault();
            $('#autoplay').click()
        } else if (e.keyCode === 38) { // Up Arrow
            if (focusNext(-1)) {
                e.preventDefault();
            }
        } else if (e.keyCode === 40) { // Down Arrow
            if (focusNext(1)) {
                e.preventDefault();
            }
        } else if (e.keyCode === 77) { // M
            e.preventDefault();
            $('#menuBurgerContainer').attr('ison', ($('#menuBurgerContainer').attr('ison') != 'true'));
        } else if (e.keyCode === 13) { // Enter
            e.preventDefault();
            $(':focus .nameWatchedContainer:first').click();
            if ($(':focus').attr('href')) {
                window.location = $(':focus').attr('href');
            }
            $(':focus .favlink:first').click();
        } else if ($('#menuBurgerContainer').attr('ison') != 'true') { //ONLY NOT ON MENU
            if (e.keyCode === 75) { // K
                e.preventDefault();
                $('#search').focus()
            } else if (e.keyCode === 39) { // Right Arrow
                e.preventDefault();
                changeSeason(1)
            } else if (e.keyCode === 37) { // Left Arrow
                e.preventDefault();
                changeSeason(-1)
            } else if (e.keyCode === 70) { // F
                e.preventDefault();
                if ($(':focus .favDel:first').length) {
                    $(':focus .favDel:first').click();
                } else if ($('#favSeasonStar').length) {
                    $('#favSeasonStar').click();
                } else if ($(':focus .favIcon:first').length) {
                    await favClick($(':focus .favIcon:first'));
                }

                updateFavoriteMenu();
            } else if (e.keyCode === 87) { // W
                e.preventDefault();
                if ($(':focus .watchIcon:first').length) {
                    if ($(':focus .watchIcon:first').is(":visible")) {
                        watchClick($(':focus .watchIcon:first'));
                    }
                }
            } else if (e.keyCode === 9) { // Tab
                e.preventDefault();
                onWindowResize($('#arrowContainer svg').hasClass('off'));
            } else if (e.keyCode === 79) { // O
                e.preventDefault();
                $('#watchAll').click();
            } else if (e.keyCode === 80) { // P
                e.preventDefault();
                $('#unwatchAll').click();
            } else if (e.keyCode === 171 || e.keyCode === 107) { // +
                e.preventDefault();
                if ($(':focus .addAutoplayButton:first').length) {
                    $(':focus .addAutoplayButton:first').click();
                }
            }
        }
    })();

});
