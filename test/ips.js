'use strict';
var ips = require('../data-source');

describe('ips', function () {
	describe('#donwloadData()',function(){
		it('should correctly download employee data', function(done){
			this.timeout(10*17*1000); // 8 seconds for page times 17 pages in ms
			this.slow(8*17*1000);
			ips.downloadData(function(){
				done();
			}, true);
		});
	});

	describe('#parseData()', function(){
		it('should correctly parse data previously downloaded', function(done){
			this.timeout(30*1000);
			this.slow(25*1000);
			ips.parseData(function(data){
				if(data !== undefined)
					done();
			});
		})
	})

	describe('#obtainData()', function(){
		it('should correctly obtain employee data and parse it', function (done) {
			this.timeout(10*17*1000+30*1000);
			this.slow(30000);
			ips.obtainData('nomina.json', true, function (data){
				if(data !== undefined){
					done();
				}
			});
		});
	});
});
