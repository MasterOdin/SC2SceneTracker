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
function getStreamList() {
    jQuery.getJSON('https://api.twitch.tv/kraken/streams',
        { 
            game: "StarCraft II: Heart of the Swarm", 
            limit: 15 
        },
        function(data) {
            var items = [];
            jQuery.each(data.streams,function(key,value) {
                var url = value['channel']['url']+"/popout";
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


            jQuery('tr.stream_row').hover(function() {
                console.log(jQuery(this).position().top);
            });
        }
    );

}

function tabs() {
    jQuery( ".tab" ).click( function () {
        jQuery('#content-'+jQuery( ".selected" ).attr('id')).css('display','none');
        jQuery(".selected").removeClass( "selected" );
        jQuery( this ).addClass( "selected" );
        jQuery("#content-"+jQuery(this).attr('id')).css('display','block');
    });
}
 
document.addEventListener('DOMContentLoaded', function() {
    getStreamList();
    tabs();
});