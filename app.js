var http = require('http');
var htmlToJson = require('html-to-json');
var fs = require('fs');
// var iconv = require('iconv');
var iconv = require('iconv-lite')
var request = require('request');

var IPS_HOST = 'servicios.ips.gov.py';
var IPS_PATH = '/nomina/nomina2.php?pag=';
var IPS_PAGES = 17;
var COLUMN_COUNT = 21

var data_file = 'nomina.html';
var MAX_ELAPSED_TIME = 1000*60*60*24;

var pagesCounter = 1;

var person = {};

var requestPage = function(){

}

var buffer;
iconv.extendNodeEncodings(); 

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
var downloadData = function(callback){
	console.log('downloading data..');

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
			fs.writeFileSync(data_file, converted, {flag:'a'});
			pagesCounter = pagesCounter + 1;
			if(pagesCounter > IPS_PAGES)
				callback();
			else
				downloadData(callback);

  		}else{
  			console.log('error. code: '+response.statusCode);
  		}
	})
}

/* Function used to parse the file */
var parseData = function(){
	var KEYS = [];
	var people = [];
	var data = fs.readFileSync(data_file).toString('utf8')
	var promise = htmlToJson.parse(data, {
	    'content':function($doc, $){
	    	$('.datagrid').find('thead').children().children().each(function(index, element){
	    		if(KEYS.length < COLUMN_COUNT){
	    			KEYS.push($(this).contents());
	    		}
	    	});
			var skipped = 0;
			var line = 0;
			var column = 0;
			var counter = 0;
			$('.datagrid').find('td').each(function(i,e){
				if($(this).attr('align') != undefined){
					counter = i - skipped;
					var f = (counter) / (KEYS.length);
					line = parseInt((counter) / (KEYS.length));
					column = parseInt(counter % (KEYS.length));
					if($(this).children().length == 1)
						person[KEYS[column]] = $(this).find('a').contents()
					else
						person[KEYS[column]] = $(this).contents();
					if(column+1 == KEYS.length){
						// console.log('pushing new person. line: '+line+', column: '+column+', counter: '+counter+', f: '+f+', people length: '+people.length+', name: '+person[KEYS[1]]);
						people.push(person);
						console.log(JSON.stringify(person));
						person = {};
					}
				}else{
					skipped = skipped + 1;
				}
    		})
    		var random_index = Math.floor(Math.random()*people.length-1)
    		console.log('random person: '+people[random_index][KEYS[1]]+', random index: '+random_index);
    		console.log('last person: '+people[people.length-1][KEYS[1]]);
    		console.log('people count: '+people.length);
	        return people;
	    }
	},
	    function(result){
	        console.log('result callback: '+result);
	    }
	);

	promise.done(function(res){
		console.log('promise done. result: '+res);
		console.log('result length: '+res.contents);
	});
}

if(fs.existsSync(data_file)){
	var now = new Date();
	var elapsed = now - fs.statSync(data_file).mtime;
	console.log('elapsed time since last file refresh: '+elapsed/1000+' seconds');
	if(elapsed > MAX_ELAPSED_TIME){
		// refresh and parse file
		fs.unlinkSync(data_file);
		downloadData(parseData);
	}else{
		// parse file
		parseData();
	}
}else{
	downloadData(parseData);
}