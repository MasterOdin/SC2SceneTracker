/*
Copyright (c) 2014 Matthew "Master_Odin" Peveler

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var settings = [];
var day9live = false;
var day9link = "http://www.twitch.tv/day9tv";
settings['popout'] = 'false';

/*
 * getStreamList()
 *
 * Gets current stream list from twitch's api (which returns a "stream" object)
 * See: https://github.com/justintv/Twitch-API/blob/master/v2_resources/streams.md
 */
function getStreamList() {
    var got_streams = false;
    jQuery.getJSON('https://api.twitch.tv/kraken/streams',
        {
            /*
             * we can easily update this once new game comes out based on previous games:
             * 1) StarCraft II: Wings of Liberty
             * 2) StarCraft II: Heart of the Swarm
             * 3) StarCraft II: Legacy of the Void (Release: TBA)
             * We'll want to add "game switching" for LoV beta until transition of pros
             * totally complete
             */
            game: "StarCraft II: Heart of the Swarm",
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
                    day9live = true;
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

/*
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

        if (day9live == true) {
            jQuery('table#tday9').prepend('<tr id="day9-live"><td colspan="2" style="color: #C00000; text-align: center;">'+
                '<a href="'+day9link+'"></a>~~ Day9 is Live!! ~~</td></tr>').click(function() {
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
                var title = p.slice(1,p.length).join(' - ');
                var desc = item['desc'];
                var slice = desc.indexOf('.');
                if (slice == -1) slice = desc.indexOf('!');
                if (item['title'].indexOf('Funday Monday') > -1) {
                    desc = desc.slice(0,slice+1);
                }
                jQuery('table#tday9').append('<tr class="day9-row" width="19%" title="'+desc+'"><td class="td-alt">'+
                    '<a href="'+item['link']+'"></a>'+p[0]+'</td><td width="81%">'+title+'</td></tr>');
                found++;
            }
            setupTooltips('day9-row');
        }
        else {
            jQuery('table#tday9').append('<tr><td>day9.tv doesn\'t appear to be up right now! :(</td></tr>');
        }
    });
}

/*
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
                jQuery('table#tgg').append('<tr class="gg-row" title="'+desc+'"><td><a href="'+item['link']+'"></a>'+title+'</td></tr>');
            }
            setupTooltips('gg-row');
        }        
    });
}

/*
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
            tooltipClass: tt_class
        });
        count++;
    }).click(function() {
        chrome.tabs.create({url:jQuery(this).find('a').attr('href')});
        window.close();
        return false;
    });
}

/*
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
            jQuery('#day9-live').find('a').attr('href',day9link+"/popout");
        }
        else {
            jQuery('#day9-live').find('a').attr('href',day9link);
        }
    }
}

/*
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
        day9link += "/popout";
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
                console.log("no setting changed");
                break;
        }
    });

    jQuery('a').click(function() {
        chrome.tabs.create({url:jQuery(this).attr('href')});
        window.close();
        return false;
    });
}

/*
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


document.addEventListener('DOMContentLoaded', function() {
    tabs();
    getSettingsList();
    getStreamList();
    getDay9Feed();
    getGGNews();
});