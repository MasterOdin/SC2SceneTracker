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

/*
 * Relates to https://github.com/justintv/Twitch-API/blob/master/v2_resources/streams.md
 */

var settings = [];
settings['popout'] = 'false';

function getStreamList() {
    var got_streams = false;
    jQuery.getJSON('https://api.twitch.tv/kraken/streams',
        { 
            game: "StarCraft II: Heart of the Swarm", 
            limit: 15 
        },
        function(data) {
            
            jQuery.each(data.streams,function(key,value) {
                got_streams = true;
                var url = value['channel']['url']+(settings['popout'] == "true" ? "/popout" : "");
                var alt = value['channel']['status'];
                var name = value['channel']['display_name'];
                var viewers = value['viewers'];

                var logo = (value['channel']['logo'] == null) ? '../images/no_logo-70x70.jpeg' : value['channel']['logo'].replace("300x300","70x70");   
                jQuery('table#streams').append('<tr class="stream-row" title="'+alt+'">'+
                    '<td class="logo"><a class="stream" href="'+url+'" alt="'+alt+'"><img class="stream-logo" src="'+logo+'" /></a></td>'+
                    '<td class="name">'+name+'</a></td>'+
                    '<td class="viewers">'+viewers+'</td></tr>');
            });

            jQuery('tr.stream-row').click(function() {
                chrome.tabs.create({url:jQuery(this).find('a').attr('href')});
                window.close();
                return false;
            });

            jQuery('tr.stream-row').each(function() {
                var top = jQuery(this).position().top;
                var my = "center bottom";
                var at = "center top-7";
                var tt_class = "top";
                if (top < 160) {
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
            });
            
            if (got_streams == false) {
                jQuery('#streams').append("<tr><td colspan='3'>Twitch didn't return any streams. Try again later. :(</td></tr>");
            }
        }
    );
}

function getDay9Feed() {
    var items = [];
    var item;
    jQuery.get("http://day9.tv/rss/", function(data) {
        var xml = jQuery(data);
        xml.find("item").each(function() {
            item = {
                title: jQuery(this).find("title").text(),
                link: jQuery(this).find("link").text(),
                description: jQuery(this).find("description").text(),
                pubDate: jQuery(this).find("pubDate").text(),
                author: jQuery(this).find("author").text()
            }
            items.push(item);

        });
        items.reverse();
        var found = 0;
        while (found < 15 && items.length > 0) {
            item = items.pop();
            jQuery('table#tday9').append('<tr><td>'+item['title']+'</td></tr>');
            found++;
        }
    });
}

function updateStreams() {
    jQuery('.stream-row').each(function() {
        if (settings['popout'] == 'true') {
            jQuery(this).find('a').attr('href',jQuery(this).find('a').attr('href')+"/popout");
        }
        else {
            jQuery(this).find('a').attr('href',jQuery(this).find('a').attr('href').replace("/popout",""));
        }
    });
}

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

    jQuery('input[type=checkbox]').each(function() {
        if (settings[jQuery(this).attr('name')] == "true") {
            jQuery(this).attr('checked',true);
        }
    }).click(function() {
        localStorage.setItem(jQuery(this).attr('name'),jQuery(this).prop('checked'));
        settings[jQuery(this).attr('name')] = jQuery(this).prop('checked').toString();

        switch (jQuery(this).attr('name')) {
            case 'popout':
                updateStreams();
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
    //getNewsList();
    
});