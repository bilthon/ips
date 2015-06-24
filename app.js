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

var requestPage = function(){

}

var buffer;

/*
* Function used to download the data in case it is not already loaded
*/
var downloadData = function(callback){
	console.log('downloading data..');

	// var options = {
	// 	uri: 'http://'+IPS_HOST+IPS_PATH+pagesCounter,
	// 	method: 'GET',
	// 	encoding: null
	// };

	// request(options, function (error, response, body) {
 //  		if (!error && response.statusCode == 200) {
 //  			console.log('Got page number: '+pagesCounter);
	// 		// var fd = fs.openSync(data_file, 'a');
	// 		// var ic = new iconv.Iconv('iso-8859-1', 'utf-8');
	// 		// var buf = ic.convert(body);
	// 		str = iconv.decode(new Buffer(body), "ISO-8859-1");
	// 		// fs.writeSync(fd, buf.toString('utf-8'));
	// 		// fs.writeSync(fd, buffer.toString('utf8'), 0, 'utf8');

	// 		fs.writeFileSync(data_file, iconv.encode(str, 'utf8'));
	// 		// fs.closeSync(fd);
	// 		pagesCounter = pagesCounter + 1;
	// 		if(pagesCounter > 1)
	// 			// callback();
	// 			console.log('finish');
	// 		else
	// 			downloadData(callback);

 //  		}else{
 //  			console.log('error. code: '+response.statusCode);
 //  		}
	// })

	var req = http.request('http://'+IPS_HOST+IPS_PATH+pagesCounter, function(res){
		var data = new Buffer(0);
		res.on('data', function(chunk){
			data = Buffer.concat([data, chunk]);
		})
		res.on('end', function(){
			var fd = fs.openSync(data_file, 'a');
			// var ic = new iconv.Iconv('iso-8859-1', 'utf-8');
			// var buf = ic.convert(data);
			str = iconv.decode(data, "ISO-8859-1");
			console.log('end. str length: '+str.length);
			fs.writeSync(fd, str);
			fs.closeSync(fd);
			pagesCounter = pagesCounter + 1;
			if(pagesCounter > IPS_PAGES)
				callback();
			else
				downloadData(callback);
		})
	});
	req.end();
}

/* Function used to parse the file */
var parseData = function(){
	var KEYS = [];
	var people = [];
	var data = fs.readFileSync(data_file);
	var promise = htmlToJson.parse(data.toString('utf-8'), {
	    'text':function($doc, $){
	    	$('.datagrid').find('thead').children().children().each(function(index, element){
	    		if(KEYS.length < COLUMN_COUNT){
	    			KEYS.push($(this).contents());
	    		}
	    	});
			var person = {};
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
		console.log('result length: '+res.length);
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