var svg;
var ieV;

function init() {
	//console.group("init");
	ieV = getInternetExplorerVersion();
	//console.log("ieV: ",ieV);
	if(ieV > -1)
	{
		var ieError = document.getElementById('ieerror');
		ieError.style.display = "block";
		ieError.innerHTML = ieError.innerHTML.replace("{version}",ieV);
	}
	if(ieV == -1 || ieV >= 9.0)
	{
		updateSVG();
	}
	//console.groupEnd();
}
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
function getInternetExplorerVersion()
{
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}


function updateSVG()
{
	//console.group("updateSVG");
	
	var gcode;
	gcode = document.getElementById('gcode').value;
	//console.log("gcode: ",gcode);
	
	svg = document.getElementById('svg');
	//console.log("svg: ",svg);
	
	procesGCode(gcode);
	
	//console.groupEnd();
}
function procesGCode(gcode)
{
	//console.group("procesGCode");
	//console.log("gcode: ",gcode);
	
	// remove comments
	gcode = gcode.replace(/\([^\)]*\)/ig, '');
	//console.log("->gcode: ",gcode);
	
	// clear svg
	var svgContainer = document.getElementById('svgContainer');
	while(svgContainer.childNodes.length) svgContainer.removeChild(svgContainer.childNodes[0]);
	
	// recreate svg
	svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
	svgContainer.appendChild(svg);
	
	var doc = svg.ownerDocument;
	var svgNS = svg.getAttribute("xmlns");
	
	var inches = false;
	var drilling = false;
	var prevX = 0;
	var prevY = 0;
	var polyline;
	var polylinePoints = "";
	var minX = 0;
	var maxX = 0;
	var minY = 0;
	var maxY = 0;
	var minZ = 9999;
	var maxZ = 0;
	var minF = 9999;
	var maxF = 0;
	
	startIcon = createStartIcon(doc,svgNS);
	svg.appendChild(startIcon);
	
	var lines = gcode.split('\n')
	var numLines = lines.length;
	for(var i=0;i<numLines;i++)
	{
		var line = lines[i];
		var commands = line.split(' ');
		var numCommands = commands.length;
		for(var j=0;j<numCommands;j++)
		{
			var command = commands[j];
			if(command == '') continue;
			//console.log("command: ",command);
			switch(command)
			{
				case "G20":
					inches = true;
					break;
				default:
					var type = command.charAt(0);
					//console.log("type: ",type);
					var value = parseFloat(command.slice(1));
					//console.log("value: ",value);
					switch(type)
					{
						case "G":
							if(value != 0 && value != 1) break;
							if(polyline != undefined && polylinePoints != "")
							{
								polyline.setAttributeNS(null,'points', polylinePoints);
							}
							polyline = doc.createElementNS(svgNS,'polyline');
							polyline.setAttributeNS(null,'fill', "none");
							polyline.setAttributeNS(null,'stroke-width', "0.5");
							polyline.setAttributeNS(null,'stroke-linecap', "round");
							polyline.setAttributeNS(null,'opacity', "0.5");
							
							var drilling = (value == 1);
							polyline.setAttributeNS(null,'stroke', (drilling)? "red" : "green");
							polyline.setAttributeNS(null,'opacity', (drilling)? "0.5" : "0.2");
							
							svg.appendChild(polyline);
							
							polylinePoints = prevX+','+prevY;
							break;
						case "X":
							if(polylinePoints != "")
								polylinePoints += ' ';
							polylinePoints += value;
							prevX = value;
							
							if(value < minX) minX = value;
							else if(value > maxX) maxX = value;
							break;
						case "Y":
							polylinePoints += ","+value;
							prevY = value;
							
							if(value < minY) minY = value;
							else if(value > maxY) maxY = value;
							break;
						case "Z":
							if(value < minZ) minZ = value;
							else if(value > maxZ) maxZ = value;
							break;
						case "F":
							if(value < minF) minF = value;
							else if(value > maxF) maxF = value;
							break;
					}
					break;
			}
		}
	}
	if(polyline != undefined && polylinePoints != "")
	{
		polyline.setAttributeNS(null,'points', polylinePoints);
	}
	
	finishIcon = createFinishIcon(doc,svgNS,prevX,prevY);
	svg.appendChild(finishIcon);
	
	svg.setAttributeNS(null,'viewBox', (minX-1)+' '+(minY-1)+' '+(maxX+2)+' '+(maxY+2));
	svg.setAttributeNS(null,'preserveAspectRatio', 'xMinYMin');
	
	// update code for download
	var downloadCode = document.getElementById("downloadCode");
	downloadCode.value = getNodeXML(svg);
	
	// update bounds
	var units = (inches)? "inches" : "mm";
	
	var boundsHTML = "<dl>";
	boundsHTML += "<dt>X min: </dt><dd>"+minX+' '+units+'</dd>';
	boundsHTML += "<dt>X max: </dt><dd>"+maxX+' '+units+'</dd>';
	boundsHTML += "<dt>Y min: </dt><dd>"+minY+' '+units+'</dd>';
	boundsHTML += "<dt>Y max: </dt><dd>"+maxY+' '+units+'</dd>';
	boundsHTML += "<dt>Z min: </dt><dd>"+minZ+' '+units+'</dd>';
	boundsHTML += "<dt>Z max: </dt><dd>"+maxZ+' '+units+'</dd>';
	boundsHTML += "<dt>F min: </dt><dd>"+minF+'</dd>';
	boundsHTML += "<dt>F max: </dt><dd>"+maxF+'</dd>';
	boundsHTML += "</dl>";
	//console.log("boundsHTML: ",boundsHTML);
	boundsDiv = document.getElementById('bounds');
	boundsDiv.innerHTML = boundsHTML;
	
	//console.log("svg: ",svg);
	//console.groupEnd();
}

function createStartIcon(doc,svgNS)
{
	var startIcon = doc.createElementNS(svgNS,'circle');
	startIcon.setAttributeNS(null,'cx', 0);
	startIcon.setAttributeNS(null,'cy', 0);
	startIcon.setAttributeNS(null,'r', 0.5);
	startIcon.setAttributeNS(null,'stroke', 'none');
	startIcon.setAttributeNS(null,'fill', '#0066ff');
	startIcon.setAttributeNS(null,'opacity', 1);
	return startIcon;
}
function createFinishIcon(doc,svgNS,x,y)
{
	var finishIcon = doc.createElementNS(svgNS,'circle');
	finishIcon.setAttributeNS(null,'cx', x);
	finishIcon.setAttributeNS(null,'cy', y);
	finishIcon.setAttributeNS(null,'r', 0.7);
	finishIcon.setAttributeNS(null,'stroke', '#0066ff');
	finishIcon.setAttributeNS(null,'stroke-width', 0.2);
	finishIcon.setAttributeNS(null,'fill', 'none');
	finishIcon.setAttributeNS(null,'opacity', 1);
	return finishIcon;
}




// convert XML node content into string
function getNodeXML (node) {
	if (node)
	{
		return (node.xml || (new XMLSerializer()).serializeToString(node) || "").replace(/(.*)( xmlns=\".*?\")(.*)/g, "$1$3");
	}
	else
	{
		return '';
	}
}