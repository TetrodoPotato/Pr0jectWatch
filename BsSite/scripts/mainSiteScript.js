var startBsPageJs = function () {
    bsPageJsEvents(); //Async
    changeIfUsernameLogedIn(); //Async
    setFavorites(); //Async
    onWindowResize(); //Async
    initSiteState(); //Async
    initSeriesSearch(); //Async
}

var bsPageJsEvents = async function () {
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
        var target = this;
        (async function () {
            await setData('autoplay', target.checked, false);
            if (!target.checked) {
                await clearAutoplayBuffer();
            }
        })();
    });

    /*CRITICAL*/
    $('#get').bind('click', function (e) {
        syncFavGet();
    });

    /*CRITICAL*/
    $('#set').bind('click', function (e) {
        (async function () {
            var allFavs = await getFavorites();

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
        })();
    });

    $('#search').on('input click', function () {
        searchEv();
    });

    $('#arrowContainer').bind('click', function (e) {
        onWindowResize($('#contentContainer').attr('ison').toLowerCase() == 'true');
    });

    $(document).scroll(scrollEvent);
    $(window).resize(onWindowResize);
}

var setFavorites = async function () {
    await updateFavoriteMenu(); // Build Favorites
    await updateFavNSync();
}

var updateFavoriteMenu = async function () {
    var $table = $("<table>", {
            "id": "favTable"
        });

    if (await getData('catFav', false)) {
        $.each(await getCatFavs(await getFavorites()), function (key, value) {
            if (value.length != 0) {
                $table.append(getFavCatRow(key));

                $.each(value.map(a => getFavRow(a)), function (index, value) {
                    $table.append(value);
                });
            }
        });
    } else {
        $.each((await getFavorites()).map(a => getFavRow(a)), function (index, value) {
            $table.append(value);
        });
    }

    $('#favoriteContainer').empty().append($table);

    if (isLoggedIn()) {
        $('#syncbuttons').show();
    } else {
        $('#syncbuttons').hide();
    }

    addFavEvents();
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
        var target = this;
        (async function () {
            var tar = $(target).parent();
            while (typeof tar.attr('dataid') === 'undefined') {
                tar = tar.parent();
            }

            var retObj = {
                Id: tar.attr('dataid'),
                IsFav: false
            }

            await updateEntry(retObj);
            updateFavoriteMenu();
            updateSeriesListFavorite(retObj);
        })();
    })
}

var updateFavNSync = async function () {
    if (await getData('syncFavMenu', true)) {
        $('.favNewEpi').removeClass('hasFavSynced');
        
        var list = await getFavorites();

        if (list.length != 0) {
            $.each(list, function (index, value) {
                var obj = value;

                $.get('https://bs.to/serie/' + obj.Id + '/' + obj.FavSeason, function (result) {
                    (async function () {
                        var episodeMax = $(result).find('.episodes tr').length;
                        var hasNew = obj.LastSeasonMax < episodeMax;

                        var isWatched = ((isLoggedIn()) ? ($(result).find('.seasons li:not(.watched), .episodes tr:not(.watched)').length < 2) : null);
                        
                        await updateEntry({
                            Id: obj.Id,
                            Genre: $(result).find('.infos:first div:first p:first span').append(' ').text().trim(),
                            SeriesIndex: $(result).find('img:first').attr('src').split('/')[4].split('.')[0],
                            IsWatched: isWatched,
                            IsSynced: true,
                            HasNewEpisode: hasNew,
                        });
                        
                        var favRow = $("[dataid='" + obj.Id + "']");
                        
                        favRow.find('.favNewEpi:first').toggleClass('hasNew', hasNew);
                        favRow.find('.favNewEpi:first').toggleClass('hasFavSynced', true);
                        favRow.find('.favSeco:first').toggleClass('favWatched', ((isWatched !== null) ? isWatched : obj.IsWatched));                    
                    })();
                });
            });
        }
    }
}

var getFavRow = function getFavRow(favObj) {
    var newEpisode = '<td><div class="favNewEpi ' + ((favObj.HasNewEpisode) ? 'hasNew' : '') + ' hasFavSynced"><svg viewBox="0 0 25 25"><g><path d="M3.5 7.8 L8.9 13.3 L21.8 0 L24.9 3.2 L8.9 19.6 L0 11.4 Z" /></g></svg></div></td>';
    var title = '<td><div class="favlink favFirst">' + favObj.FullName + '</div></td>';
    var season = '<td><div class="favlink favSeco ' + ((favObj.IsWatched) ? 'favWatched' : '') + '">' + ((favObj.FavSeason == 0) ? 'S' : favObj.FavSeason) + '</div></td>';
    var closeB = '<td><div class="favDel">' + getFavDelIcon() + '</div></td>';

    return $("<tr>", {
        'class': 'favRow',
        'dataId': favObj.Id,
        'data-Season': favObj.FavSeason,
        'tabindex': -1
    }).html(newEpisode + closeB + title + season);
}

var syncFavGet = async function () {
    var curFavs = [];
    $('#other-series-nav a[href*="serie\/"]').each(function (index, series) {
        curFavs.push($(this).attr('href').split('/')[1]);
    });

    if (curFavs.length != 0) {
        await new Promise(resolve => {
            var listProc = 0;

            $.each(curFavs, function (index, value) {
                $.get('https://bs.to/serie/' + value, function (result) {
                    (async function () {
                        var obj = {
                            Id: value,
                            Genre: $(result).find('.infos:first div:first p:first span').append(' ').text().trim(),
                            SeriesIndex: $(result).find('img:first').attr('src').split('/')[4].split('.')[0],
                            IsWatched: ((isLoggedIn()) ? ($(result).find('.seasons li:not(.watched), .episodes tr:not(.watched)').length < 2) : null),
                            IsFav: true,
                            IsSynced: true
                        }
                        await updateEntry(obj);
                        updateSeriesListFavorite(obj);

                        if (++listProc >= curFavs.length - 1) {
                            resolve(true);
                        }
                    })();

                });
            })

        });
    }

    updateFavoriteMenu();
    setFavMessageText('Favorites Loaded', 2000);
}

/*CRITICAL*/
var isLoggedIn = e => !!($('#navigation').length);

/**
 * Controlls the searchbar and checks the {DOM} contentContainer for tables with {DOM} child {id} 1.
 * Set display {String} "none" to {DOM} children without {String} searchterm.
 */
var searchEv = async function (e) {
    //Remove Info
    $('#searchInfoText').remove();

    //Check if Search is Valid
    var search = $('#search').val();
    if (search.length < (await getData('minCharsSearch', 3)) && /^https\:\/\/bs.to\/serie-genre.*$/.test(window.location.href)) {
        $('.search').hide();
        $('#contentContainer').append('<span id="searchInfoText">Type Min. ' + (await getData('minCharsSearch', 3)) + ' Character For Results</span>');
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

var getFavCatRow = function (name) {
    return $("<tr>", {
        'class': 'favCatRow'
    }).html('<td colspan="4">' + name + '</td>');
}

/*CRITICAL*/
//Change LoginButton to Username
var changeIfUsernameLogedIn = async function () {
    if (isLoggedIn()) {
        var username = $('#navigation').find('strong:first-of-type').html();
        $('#login').html('<a title="Logout" href="https://bs.to/?logout&redirect=' + encodeURI(window.location.href) + '">' + username + '</a>').attr('isLoggedIn', 'true');
    }
}

var updateSeriesListFavorite = function (obj) {
    $('.seriesContainer[seriesid="' + obj.Id + '"] .favIcon').toggleClass("Fav noFav");
    $('#favSeasonStar').toggleClass().addClass('seasonNoFav');
}

var getFavDelIcon = function () {
    return '<svg viewBox="0 0 25 25"><g><path d="M5 0L12.5 7.5L20 0L25 5L17.5 12.5L25 20L20 25L12.5 17.5L5 25L0 20L7.5 12.5L0 5Z"/></g></svg>'
}

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
    if (typeof window.lastScroll === 'undefined') {
        window.lastScroll = 0;
    }

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

var onWindowResize = function (on) {
    var windowWidth = $(window).width(); // Max 960
    
    if (windowWidth < 960 && typeof on !== 'boolean' || on === false) { // Ca Half Over Display
        //Set Styles
        $('#contentContainer').attr('ison', 'true');
        $('#arrowContainer svg').toggleClass('off', true);
    } else {
        //Reset Styles
        $('#contentContainer').attr('ison', 'false')
        $('#arrowContainer svg').toggleClass('off', false);
    }
}

var initSiteState = async function () {
    var navigation = window.location.pathname.split('/')[1];
    if (navigation === 'serie-genre') {
        $('#serNav .navRow').addClass('onSite');
    } else if (navigation === 'log') {
        $('#logNav .navRow').addClass('onSite');
    } else if (navigation === 'settings') {
        $('#setNav .navRow').addClass('onSite');
    } else if (navigation === 'playlist') {
        $('#plyNav .navRow').addClass('onSite');
    } else if (navigation === 'favorites') {
        $('#favNav .navRow').addClass('onSite');
    }

    if (typeof getData === 'function') {
        $('#autoplay').prop("checked", await getData('autoplay', false));
        $('#favNav').toggle(await getData('catFav', false));
    } else {
        setTimeout(function () {
            initSiteState();
        }, 500);
    }
}

var initSeriesSearch = async function () {
    if (!/^https:\/\/bs\.to\/serie\-genre.*$/.test(window.location.href)) {
        if (!(await getData('episodeSearch', false)) || !/^https:\/\/bs\.to\/serie\/[^\/]+(\/(\d+(\/((unwatch:|watch:)(\d+|all)(\/)?)?)?)?)?$/.test(window.location.href)) {
            await seriesSearch();
        }
    }
}

var seriesSearch = async function () {
    $('.search').removeClass('search');

    $('body:first').append('<datalist id="seriesSearchList"></datalist>');
    $.each(await getFullList(), function (index, value) {
        $('#seriesSearchList').append('<option value="' + value.FullName + '">');
    });
    $('#search').attr('list', 'seriesSearchList');

    $('#search').keyup(function (e) {
        (async function () {
            if (e.keyCode == 13) {
                e.preventDefault();
                var i = (await getFullList()).findIndex(item => item.FullName.toLowerCase() === $('#search').val().toLowerCase());
                if (i !== -1) {
                    window.location = 'https://bs.to/serie/' + (await getFullList())[i].Id;
                } else {
                    window.location = 'https://bs.to/serie-genre?search=' + encodeURI($('#search').val());
                }
            }
        })();

    });

    $('#searchLogo').bind('click', function () {
        (async function () {
            var i = (await getFullList()).findIndex(item => item.FullName.toLowerCase() === $('#search').val().toLowerCase());
            if (i !== -1) {
                window.location = 'https://bs.to/serie/' + (await getFullList())[i].Id;
            } else {
                window.location = 'https://bs.to/serie-genre?search=' + encodeURI($('#search').val());
            }
        })();

    });

    $('#search').on('input', function () {
        if (typeof window.clearSearch !== 'undefined') {
            clearTimeout(window.clearSearch);
        }

        window.clearSearch = setTimeout(function () {
                (async function () {
                    var i = (await getFullList()).findIndex(item => item.FullName.toLowerCase() === $('#search').val().toLowerCase());
                    if (i !== -1) {
                        window.location = 'https://bs.to/serie/' + (await getFullList())[i].Id;
                    }
                })();

            }, 1000);
    });
}
