var fs = require('fs');
var numeral = require('numeral');
var data = require('./data-source');
var gauss = require('gauss');
var _ = require('lodash');


exports.process_data =  function(json_file){
	fs.readFile(json_file, onDataRead);
}

function onDataRead(err, data){
	if(!err){
		var people = JSON.parse(data);
		// getTotalSalaries(people);
		var d1 = new Date();
		getProfessionCount(people);
		var d2 = new Date();
		console.log(d2.getMilliseconds()-d1.getMilliseconds());
		// getSalariesByProfession(people);
	}else{
		console.error(err);
	}
}

function getTotalSalaries(people){
	var total = 0;
	for(var i in people){
		total += numeral().unformat(people[i]['SALARIO BASICO']);
	}
	console.log('Total salaries: '+total+' Gs');
	return total;
}

function filterBy(people, attribute, projection){
	var attributes = _.uniq(_.pluck(people, attribute));
	var result = [];
	for(var i in attributes){
		var filtered = _.filter(people, function(value, index, collection){
			if(value[attribute] == attributes[i])
				return true;
		});
		if(filtered.length != 0){
			if(projection == 'count'){
				result.push({attribute:attributes[i], 'count' : filtered.length});				
			}else{
				var filteredPeople = new gauss.Collection(filtered);
				var groupedProjection = filteredPeople
					.map(function(element){return numeral().unformat(element['SALARIO BASICO'])})
					.toVector();
				result.push({attribute:attributes[i], projection : groupedProjection});
			}
		}
	}
	console.log(result);
	return result;
}

function getProfessionCount(people){
	return filterBy(people, 'PROFESION', 'count');
}

function getSalariesByProfession(people){
	return filterBy(people, 'PROFESION', 'SALARIO BASICO');
}