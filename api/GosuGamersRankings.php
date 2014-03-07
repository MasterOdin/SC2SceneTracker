<?php
/**
  (c) Matthew "Master_Odin" Peveler <matt.peveler@gmail.com>

  For the full copyright and license information, please view the LICENSE
  file that was distributed with this source code.

  Generates a json file filled with news grabbed from the TeamLiquid forum

  API Version: v1
*/

if ($_SERVER['SERVER_NAME'] == "127.0.0.1" || $_SERVER['SERVER_NAME'] == "localhost") {
    ini_set('display_errors',1);
    ini_set('display_startup_errors',1);
    error_reporting(-1);
}

include('vendor/simple_html_dom.php');

$html = file_get_html("http://www.gosugamers.net/starcraft2/rankings");
$players = array();
foreach($html->find('tr.profile') as $player) {
  //echo $player->children(2)->children(3);
  $rank   = str_replace("#","",$player->children(0)->plaintext);
  $handle = $player->children(2)->children(0)->children(0)->plaintext;
  $name   = trim($player->children(2)->children(3)->plaintext);
  $stats  = trim(preg_replace('/(.*?)\: ([0-9]*?)\-([0-9]*?) \((.*?)\)/',"$2|$3",$player->children(2)->children(4)->plaintext));
  $stats  = explode("|",$stats);
  $wins   = $stats[0];
  $loses  = $stats[1];
  $points = preg_replace('/\((.*?)\)/',"$1",$player->children(2)->children(0)->children(1)->plaintext);
  //print $rank." ".$name." ".$points."<br />";
  $players[$rank] = array(
      'rank'   => $rank,
      'handle' => $handle,
      'name'   => $name,
      'wins'   => $wins,
      'loses'  => $loses,
      'points' => $points
  );
}

$save = array('gosugamers_rankings' => $players);
$json = json_encode($save);
$fp = fopen('GosuGamersRankings/v1/api.json','w');
fwrite($fp,$json);
fclose($fp);

echo $json;
?>