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
$links = array(
    'featured' => 'http://www.teamliquid.net/news/',
    'community' => 'http://www.teamliquid.net/news/community/'
);

foreach (array('featured','community') as $k) {
    $enough = false;
    $p = 1;
    $temp = array();
    while ($enough == false) {
        $html = file_get_html($links[$k]."?p=".$p);
        foreach ($html->find('table.lightborder') as $table) {
            foreach ($table->find('tr') as $tr) {
                // we only care about rows that have a type, skip the ones that don't
                if ($tr->children(1)->children(0) != "") {
                    $type = $tr->children(1)->children(0)->plaintext;
                    if ($type == "StarCraft 2: ") {
                        $link = $tr->children(1)->children(2);
                        $temp[] = array(
                            'title' => $link->plaintext,
                            'link'  => $link->href,
                            'date'  => convertDate($tr->children(2)->plaintext)
                        );
                    }            
                }        
            }
        }
        $p++;
        if (count($temp) >= 20) {
            $enough = true;
        }
    }
    $$k = $temp;
}

$obj = array(
        "team_liquid" => array(
            "featured" => $featured,
            "community" => $community
        )
);

$json = json_encode($obj);
$fp = fopen("TeamLiquidNews/v1/api.json","w");
fwrite($fp, $json);
fclose($fp);
echo $json;

// Convert date from form of Day Month Name Year to Year.Month Num.Day (no spaces between elements)
// Example: 27 Feb 2014 becomes 20140227
function convertDate($date) {
     $month_convert = array( 'Jan' => '01', 'Feb' => '02', 
        'Mar' => '03', 'May' => '04', 'Apr' => '05', 'Jun' => '06', 'Jul' => '07', 
        'Aug' => '08', 'Sep' => '09', 'Oct' => '10', 'Nov' => '11', 'Dec' => '12' );
    $day = intval(substr($date,0,2));
    $s = 0;
    if ($day < 10) {
        $s = 1;
        $day = "0".$day;
    }
    $month = substr($date,(3-$s),3);
    $year = substr($date,(7-$s));
    $new_date = $year.$month_convert[$month].$day;
    return $new_date;
}
?>

