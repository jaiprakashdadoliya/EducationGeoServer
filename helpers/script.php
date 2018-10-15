<?php

// var runner = require("child_process");
// var phpScriptPath = __dirname+"/helpers/script.php";
// var argsString = "value1,value2,value3";
// runner.exec("php " + phpScriptPath + " " +argsString, function(err, phpResponse, stderr) {
//  if(err) console.log(err); /* log error */
//   console.log( phpResponse );
// });

$apnsHost = 'gateway.sandbox.push.apple.com';
$apnsCert = __DIR__.'/certificates/education.pem';
$apnsPort = 2195;
$apnsPass = 'Download@123';
$token = '1F65D357E02970E12E84FAB4BAF9BE27B57CF9A1EF3E30C735F33488AA2B5E1B';

$payload['aps'] = array('alert' => 'Oh hai!', 'badge' => 1, 'sound' => 'default');
$output = json_encode($payload);
$token = pack('H*', str_replace(' ', '', $token));
$apnsMessage = chr(0).chr(0).chr(32).$token.chr(0).chr(strlen($output)).$output;

$streamContext = stream_context_create();
stream_context_set_option($streamContext, 'ssl', 'local_cert', $apnsCert);
stream_context_set_option($streamContext, 'ssl', 'passphrase', $apnsPass);

$apns = stream_socket_client('ssl://'.$apnsHost.':'.$apnsPort, $error, $errorString, 2, STREAM_CLIENT_CONNECT, $streamContext);
if (!$apns)
	exit("Failed to connect: $error $errorString" . PHP_EOL);
echo 'Connected to APNS' . PHP_EOL;
fwrite($apns, $apnsMessage);
fclose($apns);
