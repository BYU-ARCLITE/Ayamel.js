var flowPlayerInstall = function(host,global,callback){
	"use strict";
	
	function flowReady(){
		var key,aq = this.aq;
		for(key in aq) if(aq.hasOwnProperty(key)){
			switch(key){
				case 'play':
					aq.play && this.media.play();
					break;
				case 'mute':
					this.media[aq.mute]();
					break;
				case 'time':
					this.media.seek(aq.time);
					break;
				case 'volume':
					this.media.setVolume(aq.volume);
			}
		}
	}
	
	function flowEvtWatcher(){
		if(!(this.playing && this.events && this.events.timeupdate)){return;}
		var time = this.media.getTime();
		if(this._timelatch!==time){
			this._timelatch = time;
			this.v.callHandlers('timeupdate');
		}
		setTimeout(flowEvtWatcher.bind(this),50);
	}

	function evt_map(ename){
		this.v && this.v.callHandlers(ename);
	}
	
	function flowClip(res,start,stop){
		var flashDiv = document.createElement('div');
		this.media_el = flashDiv;
		this.media = flowplayer(flashDiv,
			{
				src: "flowplayer.swf",
				wmode: "opaque"
			},{
				clip:{
					url:		res,
					scaling:	'fit',
					start:		start,
					duration:	stop,
					onFinish:	evt_map.bind(this,'ended'),
					onStop:		evt_map.bind(this,'ended'),
					onPause:	evt_map.bind(this,'pause'),
					onStart:	evt_map.bind(this,'play'),
					onResume:	evt_map.bind(this,'play'),
					onSeek:		evt_map.bind(this,'seek')
				},
				onLoad:flowReady.bind(this),
				onVolume:evt_map.bind(this,'volumechange'),
				//onMute:,
				//onUnMute:,
				onError:evt_map.bind(this,'error'),
				plugins: {
					controls: null,
					rtmp: { url: "flowplayer.rtmp-3.2.9.swf" }
				}
			}
		);
		
		this.aq = {};
		this._timelatch = 0;
	}
	
	flowClip.prototype = Object.create(host.Clip.prototype,{
		addEventListener: {
			value: function(event,cb){
				var cblist = this.events[event];
				if(cblist) {cblist.push(cb);}
				else {
					this.events[event] = [cb];
					(event === 'timeupdate') && flowEvtWatcher.call(this);
				}
			}
		},
		Play: {
			value: function() {
				if(this.media.isLoaded()){
					if(this.media.getTime() < this.stop){
						if(this.media.getState() === 4){
							this.media.resume();
						}else{this.media.play();}
					}
				}else{this.aq.play = true;}
			}
		},
		Pause: {
			value: function() {
				if(this.media.isLoaded()){
					this.media.pause();
				}else{this.aq.play = false;}
			}
		},
		playing: {
			get: function(){return this.media.isLoaded()?this.media.isPlaying():this.aq.play;},
			enumerable: true
		},
		setCurrentTime: {		// The current playback time in seconds
			value: function(val) {
				val = Math.round(+val);
				if(this.media.isLoaded()){
					return this.media.seek(val);
				}else{
					return this.aq.time = val;
				}
			}
		},
		getCurrentTime: {
			value: function() { return this.media.isLoaded()?this.media.getTime():0; }
		},
		getDuration: {
			value: function(){return this.media.isLoaded()?this.media.getDuration():0;},
			enumerable: true
		},
		muted: {
			set: function(mute) {
				mute = !!mute;
				var op = mute?'mute':'unmute';
				if(this.ready){
					return this.media[op]();
				}else{
					this.aq.mute = op;
					return mute;
				}
			},
			get: function(){return this.media.isLoaded() && this.media.getStatus().muted;},
			enumerable: true
		}, volume: { //The volume as a percentage
			set: function(val) {
				return this.media.isLoaded()?this.media.setVolume(val):(this.aq.volume = val);
			},
			get: function() { return this.media.isLoaded()?this.media.getVolume():this.aq.volume; },
			enumerable: true
		}, playbackRate: {
			set: function(value) { return 1; },
			get: function() { return 1; },
			enumerable: true
		}, readyState: {
			get: function(){ return this.media.isLoaded(); },
			enumerable: true
		},
		Attach: {
			value: function(v){
				v.clip = this;
				v.element.appendChild(this.media_el);
				this.v = v;
				this._timelatch = (v.attrs.time||0)+this.start;
				this.setCurrentTime(this._timelatch);
				this.events = v.events;
				this.volume = v.attrs.volume;
				this.muted = v.attrs.muted;
				v.addEventListener('timeupdate',this.auto_pause);
			}
		}
	});
		
	var tag = document.createElement('script'),
		first = document.getElementsByTagName('script')[0];
	tag.src = "js/flowplayer.js";
	tag.onload = callback.bind(null,function(res,start,stop){
		var i, files = res.content.files;
		for(i = files.length-1; i >= 0; i--){
			var src;
			if(	(	(src = files[i].stream) &&
					src.substr(0,7) === "rtmp://") ||
				(	(src = files[i].download) &&
					/^video\/(x-flv|mp4|mpeg)/.test(files[i].mime))){
				return new flowClip(src,start,stop);
			}
		}
		return false;
	});
	first.parentNode.insertBefore(tag, first);
};