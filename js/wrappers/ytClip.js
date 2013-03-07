var ytPlayerInstall = function(host,global,callback){

	function ytReady(){
		var key,aq = this.aq;
		this.ready=true;
		for(key in aq) if(aq.hasOwnProperty(key)){
			switch(key){
				case 'play':	this[aq.play?'Play':'Pause']();
					delete aq.play;	break;
				case 'time':	this.media.seekTo(aq.time);
					delete aq.time;	break;
				case 'mute':	this.media[aq.mute]();
					delete aq.mute; break;
				case 'volume':	this.media.setVolume(aq.volume);
					delete aq.volume; break;
				default:
					this[key](aq[key]);
			}
		}
	}
	
	function ytEvtWatcher(){
		if(!(this.playing && this.events && this.events.timeupdate)){return;}
		var time = this.media.getCurrentTime();
		if(this._timelatch!==time){
			this._timelatch = time;
			this.v.callHandlers('timeupdate');
		}
		setTimeout(ytEvtWatcher.bind(this),50);
	}
	
	function ytClip(id,start,stop){
		var f = host.genFrame.cloneNode(false),
			playing = false;
		f.src = "http://www.youtube.com/embed/"
				+id+"?wmode=transparent&enablejsapi=1&controls=0&start="+start;
		this.media_el = f;
		//to test: labeled break out of a function
		this.media = new YT.Player(f,{
			playerVars: { controls: '0'	},
			events: {
				onReady: ytReady.bind(this),
				onStateChange: function(evt){
					var v = this.v;
					if(!v){return;}
					playing = false;					
					switch(evt.data){
						case YT.PlayerState.PLAYING:
							playing = true;
							v.callHandlers('play');
							(v.events.timeupdate) && ytEvtWatcher.call(this);
							break;
						case YT.PlayerState.PAUSED:
							v.callHandlers('pause');
							break;
						case YT.PlayerState.ENDED:
							v.callHandlers('ended');
						case YT.PlayerState.BUFFERING:
						case YT.PlayerState.CUED:
					}
				}.bind(this)
			}
        });
		
		Object.defineProperty(this,'playing',{get:function(){return playing;}});
		
		this.aq = {};
		this.ready = false;
		this.events = null;
		this._timelatch = 0;
	}
	
	ytClip.prototype = Object.create(host.VideoClipPrototype, {
		addEventListener: {
			value: function(event,cb){
				if(	event === 'timeupdate' &&
					this.events.timeupdate.length === 1){
					ytEvtWatcher.call(this);
				}
			}
		},
		Play: {
			value: function() {
				if(this.ready){
					(this.media.getCurrentTime() < this.stop) &&
						this.media.playVideo();
				}else{this.aq.play = true;}
			}
		},
		Pause: {
			value: function() {
				if(this.ready){
					this.media.pauseVideo();
				}else{this.aq.play = false;}
			}
		},
		setCurrentTime: {		// The current playback time in seconds
			value: function(val) {
				val = Math.round(+val);
				if(this.ready){
					return this.media.seekTo(val);
				}else{
					this.aq.time = val;
					return 0;
				}
			}
		},
		getCurrentTime: {
			value: function() { return this.ready?this.media.getCurrentTime():0; }
		},
		muted: {
			set: function(mute) {
				mute = !!mute;
				var op = mute?'mute':'unMute';
				if(this.ready){
					return this.media[op]();
				}else{
					this.aq.mute = op;
					return mute;
				}
			},
			get: function() { return this.ready && this.media.isMuted(); },
			enumerable: true
		},
		volume: { //The volume as a percentage
			set: function(val) {
				if(this.ready){
					return this.media.setVolume(val);
				}else{
					this.aq.volume = val;
					return val;
				}
			},
			get: function() { return this.ready && this.media.getVolume(); },
			enumerable: true
		},
/*		duration: {
			get: function(){return this.ready?this.media.getDuration():0;},
			enumerable: true
		},*/
		Detach: {
			value: function(){
				var v = this.v;
				v.element.removeChild(this.media_el);
				v.removeEventListener('timeupdate',this.auto_pause,false);
				this.events = this.v = v.clip = null;
			}
		},
		Attach: {
			value: function(v){
				v.DetachClip();
				this.v = v;
				this.events = v.events;
				v.clip = this;
				this._timelatch = 0;
				v.addEventListener('timeupdate',this.auto_pause,false);
				v.element.appendChild(this.media_el);
			}
		}
	});
	
	global.onYouTubePlayerAPIReady = function() {
		delete global.onYouTubePlayerAPIReady;
		callback(function(res,start,stop){
            
            // Check the stream uris in the resource files for a youtube video
            res.content.files.forEach(function (file) {
                
                // Check that there is a youtube uri
                if (file.streamUri && /youtube:\/\//.test(file.streamUri)) {
                    
                    // Attempt to make the clip
                    return new ytClip(file.streamUri.substr(10),start,stop);
                }
            });
            return false;
		});
	};
	
	(function(){	//Load YouTube player api asynchronously.
		var tag = document.createElement('script'),
			first = document.getElementsByTagName('script')[0];		
		tag.src = "http://www.youtube.com/player_api";
		first.parentNode.insertBefore(tag, first);
	}());
};