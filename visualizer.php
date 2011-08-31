<?php
	if(!isset($_GET['id'])) return;

	switch($_GET['id']) 
	{
		case 'downloadFile':
			header('Content-type: image/svg+xml');
			header('Content-Disposition: attachment; filename="gcode.svg"');
			echo $_POST['content'];
			break;
	}
?>