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

function getStreamList() {
    jQuery.getJSON('https://api.twitch.tv/kraken/streams',
        { 
            game: "StarCraft II: Heart of the Swarm", 
            limit: 15 
        },
        function(data) {
            var items = [];
            jQuery.each(data.streams,function(key,value) {
                var url = value['channel']['url'];
                var alt = value['channel']['status'];
                var name = value['channel']['display_name'];
                var viewers = value['viewers'];
                var logo = value['channel']['logo'].replace("300x300","70x70");
                jQuery('table#streams').append('<tr><td class="logo"><img class="stream_logo" src="'+logo+'" /></td>'+
                    '<td class="name"><a class="stream" href="'+url+'" alt="'+alt+'">'+name+'</a></td>'+
                    '<td class="viewers">'+viewers+'</td></tr>');
            });
            jQuery('a.stream').click(function() {
                chrome.tabs.create({url: jQuery(this).attr('href')});
                window.close();
                return false;
            });            
        }
    );

}
 
document.addEventListener('DOMContentLoaded', function() {
    getStreamList(); 
});