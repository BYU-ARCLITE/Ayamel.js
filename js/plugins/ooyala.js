(function(Ayamel){
	"use strict";

	// Ooyala URLs look like ooyala://{playerId}?{videoId}
	function getVideoId(url){
		if(url.substr(0,9) === "ooyala://"){
			return url.substr(9).split('?')[1];
		}
		return /.*?ec=([0-9a-zA-Z]+).*/.exec(url)[1];
	}
	function getPlayerId(url){
		if(url.substr(0,9) === "ooyala://"){
			return url.substr(9).split('?')[0];
		}
		return /.*?pbid=([0-9a-zA-Z]+).*/.exec(url)[1];
	}

	function supportsFile(file) {
		return file.streamUri && (
			file.streamUri.substr(0,9) === "ooyala://" ||
			file.streamUri.substr(0,35) === "http://player.ooyala.com/iframe.js#" ||
			file.streamUri.substr(0,36) === "https://player.ooyala.com/iframe.js#"
		);
	}

	function frameCode(){
		var player,
			loaded = false,
			properties = {
				duration: 0,
				currentTime: 0,
				paused: true,
				volume: 1,
				muted: false
			};

		player = OO.Player.create('ooplayer',videoId,{
			autoplay: false,
			showAdMarquee: false,
			onCreate: function(player){
				loaded = true;

				player.mb.subscribe(OO.EVENTS.PLAYHEAD_TIME_CHANGED, 'frame', function(){
					var duration = Math.max(player.getTotalTime()||0,0),
						currentTime = Math.max(player.getPlayheadTime()||0,0);

					if(duration !== properties.duration){
						properties.duration = duration;
						parent.postMessage({type: 'durationchange', properties: properties}, '*');
					}

					if(currentTime !== properties.currentTime){
						properties.currentTime = currentTime;
						parent.postMessage({type: 'timeupdate', properties: properties}, '*');
					}
				});

				player.mb.subscribe(OO.EVENTS.PAUSED, 'frame', function(){
					if(properties.paused){ return; }
					properties.paused = true;
					parent.postMessage({type: 'pause', properties: properties}, '*');
				});

				player.mb.subscribe(OO.EVENTS.PLAYING, 'frame', function(){
					if(!properties.paused){ return; }
					properties.paused = false;
					parent.postMessage({type: 'play', properties: properties}, '*');
				});

				player.setVolume(properties.muted?0:properties.volume);
				player.setPlayheadTime(properties.currentTime);
				if(!properties.paused){ player.play(); }
			}
		});

		addEventListener('message',function(e){
			if(e.source !== parent){ return; }
			switch(e.data.method){
			case 'play':
				if(loaded){ player.play(); }
				else{ properties.paused = false; }
				break;
			case 'pause':
				if(loaded){ player.pause(); }
				else{ properties.paused = true; }
				break;
			case 'volume':
				if(properties.muted || !loaded){
					properties.volume = e.data.arg;
				}else{ player.setVolume(e.data.arg); }
				break;
			case 'currentTime':
				if(loaded){ player.setPlayheadTime(e.data.arg); }
				else{ properties.currentTime = e.data.arg; }
				break;
			case 'muted':
				properties.muted = e.data.arg;
				if(!loaded){ break; }
				if(properties.muted){ player.setVolume(0); }
				else{ player.setVolume(properties.volume); }
				break;
			}
		},false);
	}

	function generateOoyalaTemplate(videoId, player_branding_id){
		var box = Ayamel.utils.parseHTML('<div class="videoBox"><iframe style="width:100%;height:100%;overflow:hidden;" scrolling="no"/></div>');
		box.firstChild.src = URL.createObjectURL(new Blob([
			'<html><head><base href="'+location.href+'"></head>\n\
			<body style="margin:0;padding:0;">\n\
			<div id="ooplayer"></div>\
			<script src="http://player.ooyala.com/v3/'+player_branding_id+'"></script>\n\
			<script>var videoId = "'+videoId+'";('+frameCode.toString()+')();<\/script>\n\
			</body></html>'
		], {type: 'text/html'}));
		return box;
	}

	function OoyalaVideoPlayer(args) {
		var that = this, player,
			startTime = args.startTime, endTime = args.endTime,
			file = Ayamel.utils.findFile(args.resource, supportsFile),
			element = generateOoyalaTemplate(
				getVideoId(file.streamUri),
				getPlayerId(file.streamUri)
			);

		this.resource = args.resource;

		this.element = element;
		args.holder.appendChild(element);

		player = element.firstChild.contentWindow;
		this.player = player;
		this.properties = {
			duration: 0,
			currentTime: startTime,
			paused: true,
			volume: 1,
			muted: false,
			playbackRate: 1
		};

		window.addEventListener('message', function(e){
			if(e.source !== player){ return; }
			that.properties = e.data.properties;
			element.dispatchEvent(new Event(e.data.type,{
				bubbles:true,cancelable:false
			}));
		},false);

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

	Object.defineProperties(OoyalaVideoPlayer.prototype,{
		duration: {
			get: function(){ return this.properties.duration; }
		},
		currentTime: {
			get: function(){ return this.properties.currentTime; },
			set: function(time){
				time = +time||0;
				this.properties.currentTime = time;
				this.player.postMessage({method: 'currentTime', arg: time}, '*');
				return time;
			}
		},
		muted: {
			get: function(){ return this.properties.muted; },
			set: function(muted){
				muted = !! muted;
				if(muted !== this.properties.muted){
					this.properties.muted = muted;
					this.player.postMessage({method: 'muted', arg: muted}, '*');
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
				this.player.postMessage({method: 'volume', arg: volume}, '*');
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
			get: function(){ return 0; }
		}
	});

	OoyalaVideoPlayer.prototype.play = function(){
		this.player.postMessage({method: 'play'}, '*');
		this.properties.paused = false;
	};

	OoyalaVideoPlayer.prototype.pause = function(){
		this.player.postMessage({method: 'pause'}, '*');
		this.properties.paused = true;
	};

	OoyalaVideoPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	OoyalaVideoPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	OoyalaVideoPlayer.prototype.addEventListener = function(name, handler, capture){
		this.element.addEventListener(name, handler, !!capture);
	};

	OoyalaVideoPlayer.prototype.removeEventListener = function(name, handler, capture){
		this.element.removeEventListener(name, handler, !!capture);
	};

	OoyalaVideoPlayer.prototype.features = {
		desktop: {
			captions: true,
			annotations: true,
			fullScreen: false,
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

	Ayamel.mediaPlugins.video.Ooyala = {
		install: function(args){
			return new OoyalaVideoPlayer(args);
		},
		supports: function(args){
			return args.resource.type === "video" &&
					args.resource.content.files.some(supportsFile);
		}
	};

}(Ayamel));