(function(global,Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	function TimedMedia(params){
		this.events = params.events||{};
		this.attrs = params.attrs||{};
		this.element = params.element||null;
		this.media = null;
	}
	
	TimedMedia.prototype = Object.create(Ayamel.AyamelElement,{
		addEventListener: {
			value: function(event,cb){
				var cblist = this.events[event];
				if(cblist) {cblist.push(cb);}
				else {this.events[event] = [cb];}
				this.media && this.media.addEventListener(event,cb,false);
			}
		},
		removeEventListener: {
			value: function(event,cb){
				var index,
					cblist = this.events[event];
				if(cblist && (index = cblist.indexOf(cb))!==-1){
					if(cblist.length===1){delete this.events[event];}
					else{cblist.splice(index,1);}
				}
				this.media && this.media.removeEventListener(event,cb);
			}
		},
		callHandlers: {
			value: function(ename){
				var evt, self = this;
				if(this.events.hasOwnProperty(ename)){
					evt = document.createEvent("HTMLEvents");
					evt.initEvent(ename, true, true ); // event type,bubbling,cancelable
					this.events[ename].forEach(function(handler){
						handler.call(self,evt);
					});
				}
			}
		},
		Play: {
			value: function(){
				this.attrs.playing = true;
				this.media && this.media.Play();
			}
		},
		Pause: {
			value: function(){
				this.attrs.playing = false;
				this.media && this.media.Pause();
			}
		},
		playing: {get: function(){ return this.attrs.playing; } },
		currentTime: {	// The current playback time in seconds
			set: function(val){
				return (this.media || this.attrs).currentTime = +val;
			},				
			get: function(){
				return (this.media || this.attrs).currentTime;
			},
			enumerable:true
		},
		duration: {	//The duration in seconds
			get: function(){ return this.media?(this.media.duration||0):0; },
			enumerable:true
		},
		playbackRate: {	//The playback rate as a fraction
			set: function(rate){
				return this.attrs.playbackRate = (this.media)?(this.media.playbackRate = rate):+rate;
			},
			get: function(){ return this.attrs.playbackRate; },
			enumerable:true
		},
		volume: { //The volume as a percentage
			set: function(val) {
				if(val > 100){val = 100;}
				else if(val < 0){val = 0;}
				return this.attrs.volume = (this.media)?(this.media.volume = val):val;
			},
			get: function() {return this.attrs.volume;},
			enumerable:true
		},
		muted: {
			set: function(mute) {
				return this.attrs.muted = (this.media)?(this.media.muted = mute):!!mute;
			},
			get: function() {return this.attrs.muted;},
			enumerable:true
		},
		readyState: {
			get: function(){ return this.media?this.media.readyState:0; },
			enumerable: true
		}
	});

	Ayamel.TimedMedia = TimedMedia;
}(window,Ayamel));