(function(Ayamel){
	"use strict";

	// Vimeo URLs look like vimeo://{videoId}
	function getVideoId(url){ return url.substr(8); }

	function supportsFile(file) {
		return file.streamUri && file.streamUri.substr(0,8) === "vimeo://";
	}

	function generateVimeoTemplate(videoId){
		var box = Ayamel.utils.parseHTML('<div class="videoBox" style="margin-top: -150px;"><iframe src="https://player.vimeo.com/video/'
			+videoId+'?autoplay=0&api=1" style="width:100%;height: calc(100% + 300px);overflow:hidden;" scrolling="no"/></div>');
		return box;
	}

	function VimeoVideoPlayer(args) {
		var that = this, player,
			startTime = args.startTime, endTime = args.endTime,
			file = Ayamel.utils.findFile(args.resource, supportsFile),
			element = generateVimeoTemplate(
				getVideoId(file.streamUri)
			);

		this.resource = args.resource;

		this.element = element;
		args.holder.appendChild(element);

		this.player = null;
		this.properties = {
			duration: 0,
			currentTime: startTime,
			paused: true,
			volume: 1,
			muted: false,
			playbackRate: 1,
			ready: false
		};

		Object.defineProperties(this, {
			height: {
				get: function(){ return element.clientHeight; },
				set: function(h){
					h = +h || element.clientHeight;
					element.style.height = h + "px";
					return h;
				}
			},
			width: {
				get: function(){ return element.clientWidth; },
				set: function(w){
					w = +w || element.clientWidth;
					element.style.width = w + "px";
					return w;
				}
			}
		});
	}

	Object.defineProperties(VimeoVideoPlayer.prototype,{
		init: {
			value: function(){
				var that = this,
					player = $f(this.element.firstChild);
				this.player = player;

			    // When the player is ready, add event listeners
			    player.addEvent('ready', function() {
			    	that.properties.ready = true;
		            player.api('seekTo', that.properties.currentTime);
		            if(!that.properties.muted){
			            player.api('setVolume', that.properties.volume);
			        }
		            if(!that.properties.paused){ player.api('play'); }
			        player.addEvent('play', function(){
			        	that.element.dispatchEvent(new Event('play',{bubbles:true,cancelable:false}));
			        });
			        player.addEvent('pause', function(){
			        	that.element.dispatchEvent(new Event('pause',{bubbles:true,cancelable:false}));
			        });
			        player.addEvent('finish', function(){
			        	that.properties.paused = true;
			        	that.element.dispatchEvent(new Event('ended',{bubbles:true,cancelable:false}));
			        });
			        player.addEvent('loadProgress', function(data){
			        	if(data.duration === that.properties.duration){ return; }
		        		that.properties.duration = data.duration;
		        		that.element.dispatchEvent(new Event('durationchange',{bubbles:true,cancelable:false}));
			        });
			        player.addEvent('playProgress', function(data){
			        	that.properties.currentTime = data.seconds;
			        	that.element.dispatchEvent(new Event('timeupdate',{bubbles:true,cancelable:false}));
			        });
			        player.addEvent('seek', function(data){
			        	that.properties.currentTime = data.seconds;
			        	that.element.dispatchEvent(new Event('timeupdate',{bubbles:true,cancelable:false}));
			        });
			    });
			}
		},
		duration: {
			get: function(){ return this.properties.duration; }
		},
		currentTime: {
			get: function(){ return this.properties.currentTime; },
			set: function(time){
				time = +time||0;
				this.properties.currentTime = time;
				if(this.properties.ready){ this.player.api('seekTo', time); }
				return time;
			}
		},
		muted: {
			get: function(){ return this.properties.muted; },
			set: function(muted){
				muted = !! muted;
				if(muted !== this.properties.muted){
					this.properties.muted = muted;
					if(this.properties.ready){
						if(muted){ this.player.api('setVolume', 0); }
						else{ this.player.api('setVolume', this.properties.volume); }
					}
					this.element.dispatchEvent(new Event('volumechange',{bubbles:true,cancelable:false}));
				}
				return muted;
			}
		},
		volume: {
			get: function(){ return this.properties.volume; },
			set: function(volume){
				volume = Math.max(+volume || 0, 0);
				this.properties.volume = volume;
				if(this.properties.ready){ this.player.api('setVolume', volume); }
				this.element.dispatchEvent(new Event('volumechange',{bubbles:true,cancelable:false}));

				return volume;
			}
		},
		paused: {
			get: function(){ return this.properties.paused; }
		},
		playbackRate: {
			get: function(){ return 1; },
			set: function(rate){ return 1; }
		},
		readyState: {
			get: function(){ return this.properties.ready?4:0; }
		}
	});

	VimeoVideoPlayer.prototype.play = function(){
		if(this.properties.ready) { this.player.api('play');}
		this.properties.paused = false;
	};

	VimeoVideoPlayer.prototype.pause = function(){
		if(this.properties.ready){ this.player.api('pause'); }
		this.properties.paused = true;
	};

	VimeoVideoPlayer.prototype.enterFullScreen = function(availableHeight){
		//this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	VimeoVideoPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	VimeoVideoPlayer.prototype.addEventListener = function(name, handler, capture){
		this.element.addEventListener(name, handler, !!capture);
	};

	VimeoVideoPlayer.prototype.removeEventListener = function(name, handler, capture){
		this.element.removeEventListener(name, handler, !!capture);
	};

	VimeoVideoPlayer.prototype.features = {
		desktop: {
			captions: true,
			annotations: true,
			fullScreen: true,
			lastCaption: true,
			play: true,
			seek: true, 
			rate: false,
			timeCode: true,
			volume: true
		},
		mobile: {
			captions: true,
			annotations: true,
			fullScreen: false,
			lastCaption: true,
			play: true,
			seek: true,
			rate: false,
			timeCode: false,
			volume: false
		}
	};

	//Load the IFrame Player API code
	var tag = document.createElement('script'),
		ready = false, inits = [];
	tag.src = "https://f.vimeocdn.com/js/froogaloop2.min.js";
	document.getElementsByTagName('head')[0].appendChild(tag);
	tag.addEventListener('load', function(){
		ready = true;
		inits.forEach(function(init){ init(); });
	}, false);

	//Register the plugin
	Ayamel.mediaPlugins.video.vimeo = {
		install: function(args){
			var player = new VimeoVideoPlayer(args);
			//If it's ever asynchronous, it should always be asynchronous
			if(ready){ setTimeout(player.init.bind(player),0); }
			else{ inits.push(player.init.bind(player)); }
			return player;
		},
		supports: function(args){
			return args.holder && args.resource.type === "video" &&
					args.resource.content.files.some(supportsFile);
		}
	};


}(Ayamel));