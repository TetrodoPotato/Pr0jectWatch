$('.menuIcon, #menuClickLayer').bind('click', function (e) {
    var target = $('#menuBurgerContainer');
    target.attr('ison', !(target.attr('ison') == 'true'));
});

$('#loginButton, #loginClickLayer, #loginCancelButton').bind('click', function (e) {
    var target = $('#loginContainer');
    var isOn = !(target.attr('ison') == 'true')

    target.attr('ison', isOn);

    if (isOn) {
        $('.loginField:first').focus();
    }
});

$('#dialogClickLayer, #dialogCloseIcon').bind('click', function (e) {
    $('#dialogClickLayer').attr('ison', "false");
});

$('#autoplay').bind('change', function (e) {
    setData('autoplay', this.checked, false);
    if (!this.checked) {
        setData('lastSeries', 'none');
        setData('lastSeason', 'none');
        setData('lastEpisode', 'none');
    }
});

/*CRITICAL*/
var isLoggedIn = e => !!($('#navigation').length);

/*CRITICAL*/
$('#get').bind('click', function (e) {
    var curFavs = [];
    $('#other-series-nav a[href*="serie\/"]').each(function (index, series) {
        curFavs.push($(this).attr('href').split('/')[1]);
    });

    $.each(curFavs, function (index, value) {
        var obj = {
            Id: value,
            IsFav: true
        }

        updateEntry(obj);
        updateSeriesListFavorite(obj);
    });

    updateFavoriteMenu();
    setFavMessageText('Favorites Loaded', 2000);
});

/*CRITICAL*/
$('#set').bind('click', function (e) {
    var allFavs = getFavorites();

    var noIndex = false;
    $.each(allFavs, function (index, value) {
        if (value.SeriesIndex === null) {
            noIndex = true;
            return false;
        }
    });

    if (!noIndex) {
        var seriesIDs = allFavs.map(a => a.SeriesIndex);

        $.ajax({
            url: "https://bs.to/ajax/edit-seriesnav.php",
            data: {
                series: seriesIDs
            },
            dataType: "json",
            type: "POST",
            success: function (data) {
                setFavMessageText('Favorites Saved', 2000);
            }
        });
    }
});

/**
 * Controlls the searchbar and checks the {DOM} contentContainer for tables with {DOM} child {id} 1.
 * Set display {String} "none" to {DOM} children without {String} searchterm.
 * For {String} term {String} ">log" {function} searchEv links to {Path} '/log'
 */
var searchEv = function (e) {
    //Remove Info
    $('#searchInfoText').remove();

    //Check if Search is Valid
    var search = $('#search').val();
    if (search.length < getData('minCharsSearch', 3) && /^https\:\/\/bs.to\/serie-genre.*$/.test(window.location.href)) {
        $('.search').hide();
        $('#contentContainer').append('<span id="searchInfoText">Type Min. ' + getData('minCharsSearch', 3) + ' Character For Results</span>');
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
                    if (!target.find('.titleContainer:first').text().toLowerCase().includes(searchTerm[0])) {
                        target.hide();
                    } else {
                        target.show();
                    }
                }
            } else {
                if (!target.find('.titleContainer:first').text().toLowerCase().includes(searchTerm[0])) {
                    target.hide();
                } else {
                    target.show();
                }
            }
        });

        if ($('.search').length) {
            if ($('.search:visible').length == 0) {
                $('#contentContainer').append('<span id="searchInfoText">No Results For "' + $('#search').val() + '"</span>');
            }
        }
    }
};

$('#search').bind('input', searchEv);
$('#search').bind('click', searchEv);

/*CRITICAL*/
//Change LoginButton to Username
if (isLoggedIn()) {
    var username = $('#navigation').find('strong:first-of-type').html();
    $('#login').html('<a title="Logout" href="https://bs.to/?logout&redirect=' + encodeURI(window.location.href) + '">' + username + '</a>').attr('isLoggedIn', 'true');
}

var updateSeriesListFavorite = function (obj) {
    $('.seriesContainer[seriesid="' + obj.Id + '"] .favIcon').toggleClass("Fav noFav");
    $('#favSeasonStar').toggleClass().addClass('seasonNoFav');
}

var updateFavoriteMenu = async function () {
    /*Crit need other file to be loaded*/
    if (typeof getFavorites === 'undefined') {
        window.setTimeout(updateFavoriteMenu, 1000);
        return;
    }

    var rows = getFavorites().map(a => getFavRow(a));

    var $table = $("<table>", {
            "id": "favTable"
        });

    $.each(rows, function (index, value) {
        $table.append(value);
    });

    $('#favoriteContainer').empty().append($table);

    if (isLoggedIn()) {
        $('#syncbuttons').show();
    } else {
        $('#syncbuttons').hide();
    }

    addFavEvents();
}

var getFavRow = function getFavRow(favObj) {
    var title = '<td><div class="favlink favFirst">' + favObj.FullName + '</div></td>';
    var season = '<td><div class="favlink favSeco ' + ((favObj.IsWatched) ? 'favWatched' : '') + '">' + ((favObj.FavSeason == 0) ? 'S' : favObj.FavSeason) + '</div></td>';
    var closeB = '<td><div class="favDel">' + getFavDelIcon() + '</div></td>';

    return $("<tr>", {
        'class': 'favRow',
        'dataId': favObj.Id,
        'data-Season': favObj.FavSeason,
        'tabindex': -1
    }).html(closeB + title + season);
}

var getFavDelIcon = function () {
    return '<svg viewBox="0 0 25 25"><g><path d="M5 0L12.5 7.5L20 0L25 5L17.5 12.5L25 20L20 25L12.5 17.5L5 25L0 20L7.5 12.5L0 5Z"/></g></svg>'
}

var addFavEvents = function () {
    $('#favTable .favFirst').bind('click', function (event) {
        var tar = $(this).parent();
        while (typeof tar.attr('dataid') === 'undefined') {
            tar = tar.parent();
        }

        var redLink = 'https://bs.to/serie/' + tar.attr('dataid') + '/';
        redLink += tar.attr('data-Season');

        window.location.href = redLink;
    })

    $('#favTable .favDel').bind('click', function (event) {
        var tar = $(this).parent();
        while (typeof tar.attr('dataid') === 'undefined') {
            tar = tar.parent();
        }

        var retObj = {
            Id: tar.attr('dataid'),
            IsFav: false
        }

        updateEntry(retObj);
        updateFavoriteMenu();
        updateSeriesListFavorite(retObj);
    })
}

var updateFavNSync = async function () {
    if (typeof getData !== 'function') {
        setTimeout(updateFavNSync, 1000);
        return false;
    }

    if (getData('syncFavMenu', true)) {
        if (typeof getFavorites !== 'function') {
            setTimeout(updateFavNSync, 1000);
            return false;
        }

        if (/^https:\/\/bs\.to\/serie\-genre.*$/.test(window.location.href)) {
            var list = getFavorites().filter(obj => obj.IsWatched == true);
            await new Promise(resolve => {
                var listProc = 0;
                var index = 0;

                var syncOne = function () {
                    var i = index;
                    $.get('https://bs.to/serie/' + list[i].Id, function (result) {
                        updateEntry({
                            Id: list[i].Id,
                            Genre: $(result).find('.infos:first div:first p:first span').append(' ').text().trim(),
                            SeriesIndex: $(result).find('img:first').attr('src').split('/')[4].split('.')[0],
                            IsWatched: ((isLoggedIn()) ? ($(result).find('.seasons li:not(.watched), .episodes tr:not(.watched)').length < 2) : null),
                            IsSynced: true
                        });

                        if (++listProc >= list.length - 1) {
                            resolve(true);
                        }
                    });

                    if (++index < list.length) {
                        setTimeout(syncOne, 500);
                    }
                }
                syncOne();
            });
        }
    }

    setTimeout(updateFavoriteMenu, 1000);
}
updateFavNSync();

var setFavMessageText = function (msg, milliSeconds) {
    $('#favMessageLayer').html(msg).css({
        'opacity': '1'
    });

    setTimeout(function () {
        $('#favMessageLayer').css({
            'opacity': '0'
        });
    }, milliSeconds + 200);
}

var scrollEvent = function () {
    var target = $('#sideContainer');
    var targetHeight = target.outerHeight() + parseInt($('#noneMenu').css('padding-top'));
    var windowHeight = $(window).height();
    var scrollTop = $(document).scrollTop();
    var scrollHeigth = windowHeight + scrollTop - targetHeight;

    var curMarg = parseInt(target.css('margin-top'));
    if (window.lastScroll > scrollTop) {
        //Up
        if (scrollTop < curMarg) {
            curMarg = scrollTop;
        }
    } else {
        //Down
        if (curMarg < scrollHeigth) {
            curMarg = scrollHeigth;
        }
    }

    window.lastScroll = scrollTop;
    target.css('margin-top', (targetHeight < windowHeight) ? scrollTop : ((curMarg > -1) ? curMarg : 0) + 'px');
}

window.lastScroll = 0;
$(document).scroll(scrollEvent);

var onWindowResize = function (on) {
    var windowWidth = $(window).width(); // Max 960
    if (windowWidth < 960 && typeof on !== 'boolean' || on === false) { // Ca Half Over Display
        //Set Styles
        $('#contentContainer').attr('ison', 'true');
        $('#arrowContainer svg').addClass('off');
    } else {
        //Reset Styles
        $('#contentContainer').attr('ison', 'false')
        $('#arrowContainer svg').removeClass('off');
    }
}
$(window).resize(onWindowResize);
onWindowResize();

$('#favReload').bind('click', updateFavoriteMenu);

$('#arrowContainer').bind('click', function (e) {
    onWindowResize($('#arrowContainer svg').hasClass('off'));
});

var initSiteState = function () {
    var navigation = window.location.pathname.split('/')[1];
    if (navigation === 'serie-genre') {
        $('#serNav .navRow').addClass('onSite');
    } else if (navigation === 'log') {
        $('#logNav .navRow').addClass('onSite');
    } else if (navigation === 'settings') {
        $('#setNav .navRow').addClass('onSite');
    }

    if (typeof getData === 'function') {
        $('#autoplay').prop("checked", getData('autoplay', false));
    } else {
        setTimeout(initSiteState, 500);
    }
}
initSiteState();

var initSeriesSearch = function () {
    if (typeof getData !== 'undefined' || typeof getFullList !== 'undefined') {
        setTimeout(initSeriesSearch, 1000);
        false;
    }

    if (/^https:\/\/bs\.to\/serie\-genre.*$/.test(window.location.href)) {
        if (!getData('episodeSearch', false)) {
            initSeriesSearch();
        }
    }

}

var initSeriesSearch = function () {
    $('.search').removeClass('search');

    $('body:first').append('<datalist id="seriesSearchList"></datalist>');
    $.each(getFullList(), function (index, value) {
        $('#seriesSearchList').append('<option value="' + value.FullName + '">');
    });
    $('#search').attr('list', 'seriesSearchList');

    $('#search').keyup(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            var i = getFullList().findIndex(item => item.FullName.toLowerCase() === $('#search').val().toLowerCase());
            if (i !== -1) {
                window.location = 'https://bs.to/serie/' + getFullList()[i].Id;
            } else {
                window.location = 'https://bs.to/serie-genre?search=' + jEncode($('#search').val());
            }
        }
    });
}
