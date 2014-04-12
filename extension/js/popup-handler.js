/*
  (c) Matthew "Master_Odin" Peveler <matt.peveler@gmail.com>

  Licensed under the MIT License
  
  For the full copyright and license information, please view the LICENSE
  file that was distributed with this source code.

  JS file for generating the contents of the popup.html view
*/

/*
 * we can easily update this once new game comes out based on previous games:
 * 1) StarCraft II: Wings of Liberty
 * 2) StarCraft II: Heart of the Swarm
 * 3) StarCraft II: Legacy of the Void (Release: TBA)
 * We'll want to add "game switching" for LoV beta until transition of pros
 * totally complete
 */
var twitch_game = "StarCraft II: Heart of the Swarm";
var day9_link = "http://www.twitch.tv/day9tv";
var day9_live = false;

var milli_half_hour = 1800000;
var milli_hour = 3600000;

var settings = [];
// user settings
settings['popout']  = 'false';
settings['tl_news'] = '0';
settings['offset'] = 'false';

var dt;
var offset = 0;

var api_call = "http://sc2.mpevelerapi.com/";
// var api_call = "http://localhost/sc2/";

/**
 * runs when button is clicked really
 */
$(document).ready(function() {
    // time adjust detection
    dt = new Date();
    offset = dt.getTimezoneOffset()/60;
    
    // functionality
    tabs();
    getSettingsList();
    getStreamList();
    getDay9Feed();
    getGGNews();
    getTLNews();
    getGGRankings();
    getGGMatches();
});

    
/**
 * getStreamList()
 *
 * Gets current stream list from twitch's api (which returns a "stream" object)
 * See: https://github.com/justintv/Twitch-API/blob/master/v2_resources/streams.md
 */
function getStreamList() {
    var got_streams = false;
    jQuery.getJSON("https://api.twitch.tv/kraken/streams",
        {
            game: twitch_game,
            limit: 15
        },
        function(data) {
            jQuery.each(data.streams,function(key,value) {
                got_streams = true;
                var url = value['channel']['url']+(settings['popout'] == "true" ? "/popout" : "");
                var alt = value['channel']['status'].replace(/"/g,'&quot;').replace(/>/g,"&gt;");
                var name = value['channel']['display_name'];
                var viewers = value['viewers'];
                if (value['channel']['name'] == "day9tv") {
                    day9_live = true;
                }

                var logo = (value['channel']['logo'] == null) ? '../images/no_logo-70x70.jpeg' : value['channel']['logo'].replace("300x300","70x70");
                jQuery('table#streams').append('<tr class="stream-row" title="'+alt+'">'+
                    '<td class="logo"><a class="stream" href="'+url+'"><img class="stream-logo" src="'+logo+'" /></a></td>'+
                    '<td class="name">'+name+'</a></td>'+
                    '<td class="viewers td-alt">'+viewers+'</td></tr>');
            });

            setupTooltips('stream-row');
            
            if (got_streams == false) {
                jQuery('#streams').append("<tr><td colspan='3'>Twitch didn't return any streams. Try again later. :(</td></tr>");
            }
        }
    ).error(function() { jQuery('#streams').append("<tr><td colspan='3'>Twitch didn't return any streams. Try again later. :(</td></tr>"); });
}

/**
 * getDay9Feed()
 *
 * Fetches and parses the Day9TV RSS feed (as there is no good JSON feed to fetch). Fields returned per item from the feed are
 * title, link, description, and guid (which is identical to link). Descriptions are too long and unwieldy to use really.
*/
function getDay9Feed() {
    var items = [];
    var item;
    jQuery.get("http://day9.tv/rss/", function(data) {
        var xml = jQuery(data);
        xml.find("item").each(function() {
            item = {
                title: jQuery(this).find("title").text().replace(/"/g,'&quot;').replace(/>/g,"&gt;").replace(/Day\[9\]/,''),
                desc: jQuery(this).find("description").text(),
                link: jQuery(this).find("link").text()
            }
            if (item['title'].indexOf("#") == 7) {
                items.push(item);
            }
        });

        if (day9_live == true) {
            jQuery('table#tday9').prepend('<tr id="day9-live"><td colspan="2" style="color: #C00000; text-align: center;">'+
                '<a href="'+day9_link+'"></a>~~ Day9 is Live!! ~~</td></tr>').click(function() {
                    chrome.tabs.create({url:jQuery(this).find('a').attr('href')});
                    window.close();
                    return false;
                });
        }

        if (items.length > 0) {
            items.reverse();
            var found = 0;
            while (found < 15 && items.length > 0) {
                item = items.pop();
                var p = item['title'].replace(" by Day9","").split(' - ');
                var title = jQuery("<div/>").html(p.slice(1,p.length).join(' - ')).text();
                var t_desc = title;
                var desc = item['desc'];
                var slice = desc.indexOf('.');
                if (slice == -1) slice = desc.indexOf('!');
                if (item['title'].indexOf('Funday Monday') > -1) {
                    desc = desc.slice(0,slice+1);
                }
                if (title.length > 40) {
                    title = title.substr(0,40-title.substr(0,40).split("").reverse().join("").indexOf(" ")-1) + "...";
                }
                jQuery('table#tday9').append('<tr class="day9-row" width="22%" title="'+t_desc+"|"+desc+'"><td class="td-alt">'+
                    '<a href="'+item['link']+'"></a>'+p[0]+'</td><td width="78%">'+title+'</td></tr>');
                found++;
            }
            setupTooltips('day9-row');
        }
        else {
            jQuery('table#tday9').append('<tr><td>day9.tv doesn\'t appear to be up right now! :(</td></tr>');
        }
    });
}

/**
 * getGGNews()
 *
 * Fetch news from GosuGamer's RSS feed (http://www.gosugamers.net/starcraft2/news/rss)
 */
function getGGNews() {
    var items = [];
    var item, i, desc, title;
    jQuery.get("http://www.gosugamers.net/starcraft2/news/rss", function(data) {
        var xml = jQuery(data);
        xml.find("item").each(function() {
            i = jQuery(this);
            item = {
                title: i.find("title").text(),
                desc: i.find("description").text(),
                pubDate: i.find("pubDate").text(),
                link: i.find("link").text()
            }
            items.push(item);
        });
        if (items.length > 0) {
            items.reverse();
            while (items.length > 0) {
                item = items.pop();
                if (item['title'].length > 55) {
                    title = item['title'].substr(0,55);
                    // this ensures we don't have a "..." in the middle of a word, which looks nicer I think
                    title = title.substr(0,55-title.split("").reverse().join("").indexOf(" ")-1) + "...";
                }
                else {
                    title = item['title'];
                }
                desc = item['desc'].substr(3,item['desc'].indexOf('</p>')-3).replace(/"/g,'&quot;').replace(/>/g,"&gt;");
                jQuery('table#tgg').append('<tr class="gg-row" title="'+item['title']+"|"+item['pubDate']+'"><td><a href="'+item['link']+'"></a>'+title+'</td></tr>');
            }
            setupTooltips('gg-row');
        }        
    });
}

/**
 * getTLNews()
 *
 * Fetch news from the custom API (http://www.mpeveler.com/api/TeamLiquidNews/v1/)
 * Returns a JSON object (Scraped info from TeamLiquid)
 */
function getTLNews() {
    var cache_time = parseInt(localStorage.getItem('tlnewscache'));
    if(!getNextCacheHalfHour(cache_time)) {
        setupTLNews(JSON.parse(localStorage.getItem('tlnews')),1);
    }
    else {
        jQuery.getJSON(api_call+'TeamLiquidNews/v1', function(data) {
            setupTLNews(data,0);
        });
    }
}

function setupTLNews(data,local) {
    var i = 0;
    var news = [];
    var copy = jQuery.extend(true, {}, data);
    switch (parseInt(settings['tl_news'])) {
        case 0:
            for (i = 0; i < 20; i++) {
                if (data['team_liquid']['featured'][0]['date'] > data['team_liquid']['community'][0]['date']) {
                    news.push(data['team_liquid']['featured'].shift());
                }
                else {
                    news.push(data['team_liquid']['community'].shift());
                }
            }
            break;
        case 1:
            news = data['team_liquid']['featured'].slice(0,20);          
            
            break;
        case 2:
            news = data['team_liquid']['community'].slice(0,20);
            break;
    }
    for (i = 0; i < news.length; i++) {
        var item = news[i];
        var year = item['date'].substr(0,4);
        var month = item['date'].substr(4,2);
        var day = item['date'].substr(6,2);
        jQuery('table#tliquid').append('<tr class="tl-row" title="'+item['title']+"|"+month+"/"+day+"/"+year+'"><td><a href="http://www.teamliquid.net'+item['link']+'"></a>'+item['title']+'</td></tr>');
    }
    setupTooltips('tl-row');
    if (local == 0) {
        localStorage.setItem('tlnews',JSON.stringify(copy));
        localStorage.setItem('tlnewscache',jQuery.now());
    }
}

/**
 * getGGRankings()
 *
 * Fetch the rankings from the custom API (http://mpeveler.com/api/GosuGamersRankings/v1/)
 * Returns a JSON object (scraped info from GosuGamers)
 */
function getGGRankings() {
    var cache_time = parseInt(localStorage.getItem('ggrankingscache'));
    if(!getNextCacheTomorrow(cache_time)) {
        setupGGRankings(JSON.parse(localStorage.getItem('ggrankings')),1);
    }
    else {
        jQuery.getJSON(api_call+'GosuGamersRankings/v1',function(data) {
            setupGGRankings(data,0);
        });
    }
}

function setupGGRankings(data,local) {
    var items = data['gosugamers_rankings'];
    for (var key in items) {
        var item = items[key];
        jQuery('table#trankings').append('<tr class="ggr-row"><td><a href="'+item['link']+'"></a>'+item['rank']+'</td><td style="text-align: left;">'+item['handle']+'</td>'+
            '<td style="text-align:right">('+item['wins']+' - '+item['loses']+' | ' +Math.round((parseInt(item['wins'])/(parseInt(item['wins'])+
            parseInt(item['loses']))*100))+'%)</td><td>'+item['points']+'</td></tr>');
    }
    setupTooltips('ggr-row');
    if (local == 0) {
        localStorage.setItem('ggrankings',JSON.stringify(data));
        localStorage.setItem('ggrankingscache',jQuery.now());
        console.log("non-local");
    }    
    else
        console.log("local");
}

/**
 * getGGMatches()
 *
 * Fetch the matches from the custom API (http://sc2.mpevelerapi.com/GosuGamersMatches/v1/)
 * The API returns a JSON object (scraped info from GosuGamers)
 */
function getGGMatches() {
    var cache_time = parseInt(localStorage.getItem('ggmatchescache'));
    if(!getNextCacheHalfHour(cache_time)) {
        setupGGMatches(JSON.parse(localStorage.getItem('ggmatches')),1);
    }
    else {
        jQuery.getJSON(api_call+'GosuGamersMatches/v1/',function(data) {
            setupGGMatches(data,0);
        });
    }
}

function setupGGMatches(data,local) {
    var live = data['eventsLive'];
    var upcoming = data['eventsUpcoming'];
    var done = data['eventsDone'];
    var row = "";
    for (var key in live) {
        var item = live[key];
        var t = item['tournament']+"|"+item['time']+" GMT";
        row = "<tr class='ggm-row' title='"+t+"'><td><a href='"+item['link']+"'></a>"+item['livein']+"</td><td>"+item['player_1']['name']+
        "</td><td>vs</td><td>"+item['player_2']['name']+"</td></tr>";
        jQuery('table#tupcoming').append(row);
    }
    for (var key in upcoming) {
        var item = upcoming[key];
        var t = item['tournament']+"|"+item['time']+" GMT";
        row = "<tr class='ggm-row' title='"+t+"'><td><a href='"+item['link']+"'></a>"+item['livein']+"</td><td>"+item['player_1']['name']+
        "</td><td>vs</td><td>"+item['player_2']['name']+"</td></tr>";
        jQuery('table#tupcoming').append(row);            
    }
    var score = "";
    for (var key in done) {
        var item = done[key];
        if (item['winner'] == '0') {
            item['w'] = '=';
        }
        else if (item['winner'] == '1') {
            item['w'] = '>';
        }
        else {
            item['w'] = '<';
        }
        var t = item['tournament']+"|"+item['time']+" GMT";
        score = item['player_1']['score']+" : "+item['player_2']['score'];
        row = "<tr class='ggm-row' title='"+t+"'><td width='10%'><a href='"+item['link']+"'></a>"+score+"</td>"+
        "<td width='40%' align='center'>"+item['player_1']['name']+"</td><td width='10%'>"+item['w']+"</td>"+
        "<td width='40%' align='center'>"+item['player_2']['name']+"</td></tr>";
        jQuery('table#tresults').append(row);            
    }
    setupTooltips('ggm-row');
    if (local == 0) {
        localStorage.setItem('ggmatches',JSON.stringify(data));
        localStorage.setItem('ggmatchescache',jQuery.now());
    }
}

/**
 * setupTooltips(class_name)
 * param class_name: class name of the rows for the table to get the jQuery UI Tooltip
 *
 * See API for implementation details: http://api.jqueryui.com/tooltip/
 */
function setupTooltips(class_name) {
    var count = 0;
    jQuery('tr.'+class_name).each(function() {
        var my = "center bottom";
        var at = "center top-7";
        var tt_class = "top";
        if (count < 6) {
            my = "top+17";
            at = "center";
            tt_class = "bottom";
        }
        jQuery(this).tooltip({
            html:true,
            position: {
                my: my, 
                at: at
            },
            tooltipClass: tt_class,
            content: function(callback) {
                //console.log($(this).prop('title').replace("|","<br />"));
                callback($(this).prop('title').replace(/\|/g, '<br />')); 
            }
        });
        count++;
    }).click(function() {
        console.log(jQuery(this).find('a').attr('href'));
        if (jQuery(this).find('a').attr('href') != undefined) {
            chrome.tabs.create({url:jQuery(this).find('a').attr('href')});
            window.close();
        }
        return false;
    });
}

/**
 * updateTwitchLinks()
 *
 * Make the twitch links to either /popout or not based on popout setting being changed
 */
function updateTwitchLinks() {
    jQuery('.stream-row').each(function() {
        if (settings['popout'] == 'true') {
            jQuery(this).find('a').attr('href',jQuery(this).find('a').attr('href')+"/popout");
        }
        else {
            jQuery(this).find('a').attr('href',jQuery(this).find('a').attr('href').replace("/popout",""));
        }
    });

    if (day9live == true) {
        if (settings['popout'] == 'true') {
            jQuery('#day9-live').find('a').attr('href',day9_link+"/popout");
        }
        else {
            jQuery('#day9-live').find('a').attr('href',day9_link);
        }
    }
}

/**
 * getSettingsList()
 *
 * Create settings tab content and necessary actions
 */
function getSettingsList() {
    for (i in settings) {
        var setting = localStorage.getItem(i);
        if (setting == undefined || setting == "undefined") {
            localStorage.setItem(i,settings[i]);
        }
        else {
            settings[i] = setting;
        }
    }

    if (settings['popout'] == 'true') {
        day9_link += "/popout";
    }

    jQuery('input[type=checkbox]').each(function() {
        if (settings[jQuery(this).attr('name')] == "true") {
            jQuery(this).attr('checked',true);
        }
    }).click(function() {
        localStorage.setItem(jQuery(this).attr('name'),jQuery(this).prop('checked'));
        settings[jQuery(this).attr('name')] = jQuery(this).prop('checked').toString();
        switch (jQuery(this).attr('name')) {
            case 'popout':
                updateTwitchLinks();
                break;
            default:
                //console.log("no setting changed");
                break;
        }
    });

    jQuery('select').each(function() {
        jQuery('option[value="' + localStorage.getItem(jQuery(this).attr('name')) + '"]', this).first().attr('selected', 'selected');
    }).change(function() {
        localStorage.setItem(jQuery(this).attr('name'),jQuery(this).val());
        settings[jQuery(this).attr('name')] = jQuery(this).val();
        switch (jQuery(this).attr('name')) {
            case 'tl_news':
                jQuery('table#tliquid').empty();
                getTLNews();
                break;
        }
    });

    jQuery('a').click(function() {
        chrome.tabs.create({url:jQuery(this).attr('href')});
        window.close();
        return false;
    });
}

/**
 * tabs()
 *
 * create the tab JS for content switching as well as expanding selected one
 */
function tabs() {
    jQuery('.selected').each(function() {
        jQuery('#content-'+jQuery(this).attr('id')).css('display','block');
    });
    jQuery( ".tab" ).click( function () {
        var elem = jQuery(this).parent().children('.selected');
        jQuery('#content-'+elem.attr('id')).css('display','none');
        elem.removeClass( "selected" );
        jQuery( this ).addClass( "selected" );
        jQuery("#content-"+jQuery(this).attr('id')).css('display','block');
    });
}

/**
 * getNextCache(time,min)
 * param cache_time : Date() obj for last cache time
 *
 * Given a date obj, returns True/False if the current time is after a 30
 * min period (ie. 1:45 falls between 1:30 and 2:00, so we update once after 2:00)
 */

function getNextCacheHalfHour(cache_time) {
    var ct = new Date(cache_time);
    var et = ct;
    //var cur = parseInt(dt.getFullYear()+""+parseNumber(dt.getMonth())+""+parseNumber(dt.getDate())+""+parseNumber(dt.getHours())+""+parseNumber(dt.getMinutes()));
    var current_min = parseInt(ct.getMinutes());
    et.setMinutes(current_min-(current_min)%30);
    et.setTime(et.getTime()+milli_half_hour);
    //var next = parseInt(et.getFullYear()+""+parseNumber(et.getMonth())+""+parseNumber(et.getDate())+""+parseNumber(et.getHours())+""+parseNumber(et.getMinutes()));
    //console.log(cur);
    //console.log(next);
    if (parseInt(dt.getTime()) > parseInt(et.getTime())) 
        return true;
    else
        return false;
}

function getNextCacheTomorrow(cache_time) {
    var ct = new Date(cache_time);
    var et = ct;
    et.setHours(0);
    et.setMinutes(0);
    et.setTime(et.getTime()+(24*milli_hour));
    //console.log(parseInt(dt.getFullYear()+""+parseNumber(dt.getMonth())+""+parseNumber(dt.getDate())+""+parseNumber(dt.getHours())+""+parseNumber(dt.getMinutes())));
    //console.log(parseInt(et.getFullYear()+""+parseNumber(et.getMonth())+""+parseNumber(et.getDate())+""+parseNumber(et.getHours())+""+parseNumber(et.getMinutes())));
    if (parseInt(dt.getTime()) > parseInt(et.getTime()))
        return true;
    else
        return false;
}

function parseNumber(num) {
    if (num < 10)
        return "0"+num;
    else
        return num;
}