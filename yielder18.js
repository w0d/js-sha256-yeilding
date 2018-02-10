
/* yielder.js
USAGE:
yielder.begin({
				y: functionToYield,		//REQUIRED! Yielding: The function that uses yielder.isTimeUp
				s: {forStart: 0},		//OPTIONAL? State: Place to save vars when function yields e.g. for loop index
				m: 100,					//OPTIONAL DEFAULT 50: Maximum execution time in millseconds
				p: progressFunction,	//OPTIONAL Function notified of progess - passed percentageCompleted from isTimeUp()
				c: callbackFunction,	//OPTIONAL Function notified of completeion NB: Callback args is NOT keyword "this" friendly!
				e: 162562346			//OPTIONAL DEFAULT 0 The time (in millseconds) to stop and yield
			});
yielder.methods
	begin:		//sets up yielder to be used by functionToYield
	isTimeUp:	//place in functionToYield as require. USAGE: if (yielder.isTimeUp(percentageCompleted)) return yielder.time2Yield;
	fin:		//MOSTLY PRIVATE called when functionToYield has returned normally clears its vars for GC & calls .p & .c as necessary
				//PUBLIC USEAGE If an error occurs in functionToYield then call it as appropriate.. clear .c 1st?


//Place this in the functionToYield where you wish for the oppotunity to yield
if (yielder.isTimeUp(percentageCompleted)) return yielder.time2Yield;

//When the functionToYield has finally completed use "return stuff;" as usual and it will be passed to the callbackFunction


// NOT REQUIRED BUT FOR FUTURE?.. yielder.fin => setTimeout(callback(args), 0); - leave as is to make use of spare ms in current processing thread
////IE <=9 timeout args polyfill see:
////https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout


//yielder.min.js: http://dean.edwards.name/packer/ + ";"
//save another 26 chars by using http://closure-compiler.appspot.com/home 1st b4 packer or 180 by only using closure-compiler..
//alt pre-packer https://marijnhaverbeke.nl/uglifyjs
//closurecompiler likes to replace back this for self
//speed tests me thinks

*/

var yielder = {
	time2Yield: 'time2Yield',
	m:50,
	e:0,
	begin: function(config) {
		var self = this;
		for (var prop in config){
			self[prop] = config[prop];
		}
		if (!self.e) self.e = Date.now() + self.m;
		//**DOUBLE CHECK THIS LOGIC BELOW
		//+ possible that isTimeUp when function completed causes unnecessary extra timeout..
		var ret = self.y();
		if (ret != self.time2Yield) self.fin(ret);
	},
	isTimeUp: function(percentageCompleted){
		var self = this;
		if (Date.now() >= self.e) {
			if (self.p) self.p(percentageCompleted);
			setTimeout(function(){
				self.e = Date.now() + self.m;
				var ret = self.y();
				if (ret != self.time2Yield){
					self.fin(ret);
				}
			}, 0);
			return true;
		}
	},
	fin: function(args4CallbackFunction) {
		var self = this;
		var cb = self.c;
		if (self.p) self.p(100);
	//release vars for Garbage Collection
	//**BEWARE this.s (state) may need a deep scrub?
		self.s = self.y = self.c = self.p = null;
	//**FUTURE if setTimeout is to be used below then need shim for IE<10 as no args can be passed directly AND  this.e (endMs) should be set to 0 in line above this & in .begin() if (!this.e) can be removed from this line:if (!this.e) this.e = Date.now() + this.m;
		if (cb) cb(args4CallbackFunction);
	}
};