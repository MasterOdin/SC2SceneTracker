<?php
/**
  (c) Matthew "Master_Odin" Peveler <matt.peveler@gmail.com>

  Licensed under the MIT License

  For the full copyright and license information, please view the LICENSE
  file that was distributed with this source code.

  Generates a json file filled with matches (upcoming/recent results)
  as reported by GosuGamers

  API Version: v1
*/

// note: the flags we're getting from joinDota network because can't use gosugamers
//       as all the flags are in one big image which is a pain to use

date_default_timezone_set("CET");
require_once('vendor/simple_html_dom.php');
$matches = file_get_html('http://www.gosugamers.net/starcraft2/gosubet');

$check = $matches->find('.matches', 2);
if ($check) {
    $upcoming_num = 1;
    $results_num = 2;
    $is_live = true;
} else {
    $upcoming_num = 0;
    $results_num = 1;
    $is_live = false;
}

$live = array();
if ($is_live) {
    foreach($matches->find('.matches',0)->children(0)->children as $match) {
        $player_a = array();
        $player_a["name"] = trim($match->children(0)->children(0)->children(0)->plaintext);
        $player_a["country"] = strtolower(substr($match->find('.flag',0)->class,-2));
        $player_a["flag"] = "http://flags.cdn.gamesports.net/".$player_a["country"].".gif";
        $player_b = array();
        $player_b['name'] = trim($match->children(0)->children(0)->children(4)->plaintext);
        $player_b["country"] = strtolower(substr($match->find('.flag',1)->class,-2));
        $player_b["flag"] = "http://flags.cdn.gamesports.net/".$player_b["country"].".gif";
        $link = "http://www.gosugamers.net".$match->children(0)->children(0)->href;
        $t_page = file_get_html($link);
        $tournament = $t_page->find('.box',0)->children(0)->children(0)->plaintext;
        $bestof = str_replace("Best of ","",$t_page->find('.bestof',0)->plaintext);
        $time = substr($t_page->find('.datetime',0)->plaintext,-5);
        $hour = intval(explode(":",$time)[0])-1;
        $time = str_pad($hour,2,"0",STR_PAD_LEFT).":".explode(":",$time)[1];
        $livein = "Live";
        $live[] = array('player_1'=>$player_a,'player_2'=>$player_b,
           'tournament'=>$tournament, 'time'=>$time, 'bestof'=>$bestof, 'livein'=>$livein);
    }
}

$upcoming = array();
foreach($matches->find('.matches',$upcoming_num)->children(0)->children as $match) {
    $player_a = array();
    $player_a["name"] = trim($match->children(0)->children(0)->children(0)->plaintext);
    $player_a["country"] = strtolower(substr($match->find('.flag',0)->class,-2));
    $player_a["flag"] = "http://flags.cdn.gamesports.net/".$player_a["country"].".gif";
    $player_b = array();
    $player_b['name'] = trim($match->children(0)->children(0)->children(4)->plaintext);
    $player_b["country"] = strtolower(substr($match->find('.flag',1)->class,-2));
    $player_b["flag"] = "http://flags.cdn.gamesports.net/".$player_b["country"].".gif";
    $link = "http://www.gosugamers.net".$match->children(0)->children(0)->href;
    $t_page = file_get_html($link);
    $tournament = $t_page->find('.box',0)->children(0)->children(0)->plaintext;
    $bestof = str_replace("Best of ","",$t_page->find('.bestof',0)->plaintext);
    $time = substr($t_page->find('.datetime',0)->plaintext,-5);
    $hour = intval(explode(":",$time)[0])-1;
    $time = str_pad($hour,2,"0",STR_PAD_LEFT).":".explode(":",$time)[1];
    $livein = trim($match->find('.live-in',0)->plaintext);
    $upcoming[] = array('player_1'=>$player_a,'player_2'=>$player_b,
       'tournament'=>$tournament, 'time'=>$time, 'bestof'=>$bestof,'livein'=>$livein);
}

$i = 0;
$results = array();
foreach($matches->find('.matches',$results_num)->children(0)->children as $match) {
    if ($i == 20) {
        break;
    }
    $player_a = array();
    $player_a["name"] = trim($match->children(0)->children(0)->children(0)->plaintext);
    $player_a["country"] = strtolower(substr($match->find('.flag',0)->class,-2));
    $player_a["flag"] = "http://flags.cdn.gamesports.net/".$player_a["country"].".gif";
    $player_a['score'] = intval(trim($match->find('.score',0)->plaintext));
    $player_b = array();
    $player_b['name'] = trim($match->children(0)->children(0)->children(4)->plaintext);
    $player_b["country"] = strtolower(substr($match->find('.flag',1)->class,-2));
    $player_b["flag"] = "http://flags.cdn.gamesports.net/".$player_b["country"].".gif";
    $player_b['score'] = intval(trim($match->find('.score',1)->plaintext));
    if ($player_a['score'] > $player_b['score']) {
        $winner = '1';
    }
    else if ($player_b['score'] > $player_a['score']) {
        $winner = '2';
    }
    else {
        $winner = '0';
    }
    $link = "http://www.gosugamers.net".$match->children(0)->children(0)->href;
    $t_page = file_get_html($link);
    $tournament = $t_page->find('.box',0)->children(0)->children(0)->plaintext;
    $bestof = str_replace("Best of ","",$t_page->find('.bestof',0)->plaintext);
    $time = substr($t_page->find('.datetime',0)->plaintext,-5);
    $hour = intval(explode(":",$time)[0])-1;
    $time = str_pad($hour,2,"0",STR_PAD_LEFT).":".explode(":",$time)[1];
    $results[] = array('player_1'=>$player_a,'player_2'=>$player_b,
       'tournament'=>$tournament, 'time'=>$time, 'bestof'=>$bestof,'winner'=>$winner);
    $i++;
}

$obj = array('eventsLive'=>$live,'eventsUpcoming'=>$upcoming,'eventsDone'=>$results);
$json = json_encode($obj);
$fp = fopen("GosuGamersMatches/v1/api.json","w");
fwrite($fp, $json);
fclose($fp);
echo $json;

?>