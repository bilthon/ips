var http = require('http');
var htmlToJson = require('html-to-json');
var fs = require('fs');
var iconv = require('iconv-lite')
var request = require('request');

var IPS_HOST = 'servicios.ips.gov.py';
var IPS_PATH = '/nomina/nomina2.php?pag=';
var IPS_PAGES = 17;
var COLUMN_COUNT = 21

var DATA_FILE = 'nomina.html';
var JSON_FILE = 'nomina.json';

exports.JSON_FILE = JSON_FILE;

var MAX_ELAPSED_TIME = 1000*60*60*24*30;

var pagesCounter = 1;

var people = [];
var person = {};
var headers = [];

iconv.extendNodeEncodings();

function obtainData(destination_file, remove_old, callback){
	if(destination_file != undefined)
		JSON_FILE = destination_file;

	if(fs.existsSync(DATA_FILE)){
		var now = new Date();
		var elapsed = now - fs.statSync(DATA_FILE).mtime;
		if(elapsed > MAX_ELAPSED_TIME || remove_old === true){
			// refresh and parse file
			fs.unlinkSync(DATA_FILE);
			console.log('downloading data again');
			downloadData(packCallbacks(parseData, callback), true);
		}else{
			// parse file
			console.log('parsing existing file');
			parseData(callback);
		}
	}else{
		downloadData(packCallbacks(parseData, callback));
	}

	function packCallbacks(fn, cb){
		return function(){
			return fn(cb);
		}
	}
}

function char_convert(str_to_convert){
    var chars = ["©","Û","®","ž","Ü","Ÿ","Ý","$","Þ","%","¡","ß","¢","à","£","á","À","¤","â","Á","¥","ã","Â","¦","ä","Ã","§","å","Ä","¨","æ","Å","©","ç","Æ","ª","è","Ç","«","é","È","¬","ê","É","­","ë","Ê","®","ì","Ë","¯","í","Ì","°","î","Í","±","ï","Î","²","ð","Ï","³","ñ","Ð","´","ò","Ñ","µ","ó","Õ","¶","ô","Ö","·","õ","Ø","¸","ö","Ù","¹","÷","Ú","º","ø","Û","»","ù","Ü","@","¼","ú","Ý","½","û","Þ","€","¾","ü","ß","¿","ý","à","‚","À","þ","á","ƒ","Á","ÿ","å","„","Â","æ","…","Ã","ç","†","Ä","è","‡","Å","é","ˆ","Æ","ê","‰","Ç","ë","Š","È","ì","‹","É","í","Œ","Ê","î","Ë","ï","Ž","Ì","ð","Í","ñ","Î","ò","‘","Ï","ó","’","Ð","ô","“","Ñ","õ","”","Ò","ö","•","Ó","ø","–","Ô","ù","—","Õ","ú","˜","Ö","û","™","×","ý","š","Ø","þ","›","Ù","ÿ","œ","Ú"]; 
    var codes = ["&copy;","&#219;","&reg;","&#158;","&#220;","&#159;","&#221;","&#36;","&#222;","&#37;","&#161;","&#223;","&#162;","&#224;","&#163;","&#225;","&Agrave;","&#164;","&#226;","&Aacute;","&#165;","&#227;","&Acirc;","&#166;","&#228;","&Atilde;","&#167;","&#229;","&Auml;","&#168;","&#230;","&Aring;","&#169;","&#231;","&AElig;","&#170;","&#232;","&Ccedil;","&#171;","&#233;","&Egrave;","&#172;","&#234;","&Eacute;","&#173;","&#235;","&Ecirc;","&#174;","&#236;","&Euml;","&#175;","&#237;","&Igrave;","&#176;","&#238;","&Iacute;","&#177;","&#239;","&Icirc;","&#178;","&#240;","&Iuml;","&#179;","&#241;","&ETH;","&#180;","&#242;","&Ntilde;","&#181;","&#243;","&Otilde;","&#182;","&#244;","&Ouml;","&#183;","&#245;","&Oslash;","&#184;","&#246;","&Ugrave;","&#185;","&#247;","&Uacute;","&#186;","&#248;","&Ucirc;","&#187;","&#249;","&Uuml;","&#64;","&#188;","&#250;","&Yacute;","&#189;","&#251;","&THORN;","&#128;","&#190;","&#252","&szlig;","&#191;","&#253;","&agrave;","&#130;","&#192;","&#254;","&aacute;","&#131;","&#193;","&#255;","&aring;","&#132;","&#194;","&aelig;","&#133;","&#195;","&ccedil;","&#134;","&#196;","&egrave;","&#135;","&#197;","&eacute;","&#136;","&#198;","&ecirc;","&#137;","&#199;","&euml;","&#138;","&#200;","&igrave;","&#139;","&#201;","&iacute;","&#140;","&#202;","&icirc;","&#203;","&iuml;","&#142;","&#204;","&eth;","&#205;","&ntilde;","&#206;","&ograve;","&#145;","&#207;","&oacute;","&#146;","&#208;","&ocirc;","&#147;","&#209;","&otilde;","&#148;","&#210;","&ouml;","&#149;","&#211;","&oslash;","&#150;","&#212;","&ugrave;","&#151;","&#213;","&uacute;","&#152;","&#214;","&ucirc;","&#153;","&#215;","&yacute;","&#154;","&#216;","&thorn;","&#155;","&#217;","&yuml;","&#156;","&#218;"];
    var result = str_to_convert;
	for(i=0; i < codes.length; i++){
		result = result.replace(codes[i],chars[i])
	}
	return result;
}

/*
* Function used to download the data in case it is not already loaded
*/
function downloadData(callback, remove_old){
	if(remove_old !== undefined && remove_old == true){
		if(fs.existsSync(DATA_FILE)){
			console.log('deleting existing file');
			fs.unlinkSync(DATA_FILE);
		}
	}

	var options = {
		uri: 'http://'+IPS_HOST+IPS_PATH+pagesCounter,
		method: 'GET',
		encoding: null
	};

	request(options, function (error, response, body) {
  		if (!error && response.statusCode == 200) {
  			console.log('Got page number: '+pagesCounter);
			var str = iconv.decode(body, "iso-8859-1");
			var converted = char_convert(str);
			fs.writeFile(DATA_FILE, converted, {flag:'a'}, function(err){
				pagesCounter = pagesCounter + 1;
				if(pagesCounter > IPS_PAGES)
					callback();
				else
					downloadData(callback);
			});
  		}else{
  			console.log('error. code: '+response.statusCode);
  		}
	});
}

/* Function used to parse the file */
function parseData(callback){
	fs.readFile(DATA_FILE, function(err, data){
		if(!err){
			console.log('parsing the table headers');
			/* Parsing the table header */
			htmlToJson.parse(data.toString('utf8'), function(){
				this.map('div.datagrid > table > thead > tr', function($item){
					$item.children().each(function(i, element){
						if(headers.length < COLUMN_COUNT){
							headers.push(element['children'][0]['data']);
						}
					});
				});
			});

			console.log('parsing the table data');
			/* Parsing table data */
			htmlToJson.parse(data.toString('utf8'), function(){
				return this.map('td', function ($item){
					if($item.parent().parent().is('tbody') == true){
						return $item.text();
					}
				});
			}).done(function(result){
				var filtered = result.filter(function(element, index, array){
					if(element != undefined)
						return true;
					else
						false;
				});
				for(var i = 0; i < filtered.length; i++){
					person[headers[i % COLUMN_COUNT]] = filtered[i].trim();
					if((i+1) % COLUMN_COUNT == 0){
						people.push(person);
						person = {};
					}
				}
				console.log('parsed '+people.length+' people.');
				fs.writeFile(JSON_FILE, JSON.stringify(people), function(err, data){
					if(!err){
						console.log('json file sucessfully saved to disk');
						if(callback != undefined)
							callback(JSON.stringify(people));
					}else{
						console.error('Error writing parsed JSON file');
					}
				})
			});
		}else{
			console.error('Error opening file to parse');
		}
	});
}

exports.downloadData = downloadData;
exports.parseData = parseData;
exports.obtainData = obtainData;
