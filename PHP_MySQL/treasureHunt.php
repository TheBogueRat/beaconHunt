<?php
header('content-type: application/json; charset=utf-8');
header('Accesss-Control-Allow-Origin:*');
//
// treasureHunt.php (Returns game items for Mobile App)
//

include("sleepyBadger.php");  // Provides $username, $password, $hostname, $database

//connection to the database
$dbhandle = mysqli_connect($hostname, $username, $password, $database)
 or die("Unable to connect to MySQL");

$data= array();

// Modify table name below as necessary...
$sql = "SELECT * FROM treasure_hunt";

//execute the SQL query and return records
$result = mysqli_query($dbhandle, $sql);
while($obj=mysqli_fetch_object($result)) {
	$data[]=$obj;
}

// Return JSONP formatted data to requesting page.
echo $_GET['jsonp'].'('.json_encode($data).')';
?>