'use strict';
var ips = require('../data-source');

describe('ips', function () {
	describe('#obtainData()', function(){
		it('should correctly obtain employee data and parse it', function (done) {
			this.timeout(30000);
			ips.obtainData('nomina.json', function (data){
				if(data != undefined){
					console.log('calling done');
					done();
				}
			});
		});
	});
});
