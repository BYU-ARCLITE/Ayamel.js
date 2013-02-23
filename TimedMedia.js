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