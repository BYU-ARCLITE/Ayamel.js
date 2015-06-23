(function(Ayamel){
	"use strict";

	var accountNum = "1126213333001";
	var playerId = "d3af83a6-196d-4b91-bb6a-9838bdff05ec";

	function supportsFile(file) {
		return file.streamUri && file.streamUri.substr(0,13) === "brightcove://";
	}

	function frameCode(){
		var loaded = false,
			player = videojs(document.getElementById('vplayer')),
			properties = {
				duration: 0,
				currentTime: 0,
				paused: true,
				volume: 1,
				muted: false,
				playbackRate: 1
			};

		player.ready(function(){
			var c = document.querySelector('.vjs-control-bar');
			c.parentElement.removeChild(c);
			c = document.querySelector('.vjs-big-play-button');
			c.parentElement.removeChild(c);
			loaded = true;

			[	'play','pause','ended',
				'timeupdate',
				'durationchange',
				'volumechange'
			].forEach(function(ename){
				player.on(ename, function(){
					properties.currentTime = player.currentTime();
					properties.duration = player.duration();
					properties.paused = player.paused();
					properties.volume = player.volume();
					properties.muted = player.muted();
					properties.playbackRate = player.playbackRate();
					parent.postMessage({type: ename, properties: properties}, '*');
				});
			});

			player.height(window.innerHeight, true);
			player.width(window.innerWidth, true);
			player.currentTime(properties.currentTime);
			player.volume(properties.volume);
			player.muted(properties.muted);
			player.playbackRate(properties.playbackRate);
			if(!properties.paused){ player.play(); }
		});

		addEventListener('resize', function(){
			player.height(window.innerHeight, true);
			player.width(window.innerWidth, true);
		}, false);

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
			default:
				if(loaded){ player[e.data.method](e.data.arg); }
				else{ properties[e.data.method] = e.data.arg; }
				break;
			}
		},false);
	}

	function generateBrightcoveTemplate(videoId){
		var box = Ayamel.utils.parseHTML('<div class="videoBox"><iframe style="width:100%;height:100%;overflow:hidden;" scrolling="no"/></div>');
		box.firstChild.src = URL.createObjectURL(new Blob([
			'<html><head><base href="'+location.href+'"></head>\n\
			<body style="margin:0;padding:0;">\n\
			<video id="vplayer" data-account="' + accountNum
			+ '" data-player="' + playerId + '" data-video-id="' + videoId
			+ '" data-embed="default" class="video-js"></video>\n\
			<script src="//players.brightcove.net/'
			+ accountNum + '/'
			+ playerId + '_default/index.min.js"><\/script>\n\
			<script>('+frameCode.toString()+')();<\/script>\n\
			</body></html>'
		], {type: 'text/html'}));
		return box;
	}

	function BrightcoveVideoPlayer(args) {
		var that = this, player,
			startTime = args.startTime, endTime = args.endTime,
			file = Ayamel.utils.findFile(args.resource, supportsFile),
			videoId = file.streamUri.substr(13),
			element = generateBrightcoveTemplate(videoId);

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

	Object.defineProperties(BrightcoveVideoPlayer.prototype,{
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
				this.properties.muted = muted;
				this.player.postMessage({method: 'muted', arg: muted}, '*');
				return muted;
			}
		},
		volume: {
			get: function(){ return this.properties.volume; },
			set: function(volume){
				volume = Math.max(+volume || 0, 0);
				this.properties.volume = volume;
				this.player.postMessage({method: 'volume', arg: volume}, '*');
				return volume;
			}
		},
		paused: {
			get: function(){ return this.properties.paused; }
		},
		playbackRate: {
			get: function(){ return this.properties.playbackRate; },
			set: function(rate){
				rate = +rate || 1;
				this.properties.playbackRate = rate;
				this.player.postMessage({method: 'playbackRate', arg: rate}, '*');
				return rate;
			}
		},
		readyState: {
			get: function(){ return 0; }
		}
	});

	BrightcoveVideoPlayer.prototype.play = function(){
		this.player.postMessage({method: 'play'}, '*');
		this.properties.paused = false;
	};

	BrightcoveVideoPlayer.prototype.pause = function(){
		this.player.postMessage({method: 'pause'}, '*');
		this.properties.paused = true;
	};

	BrightcoveVideoPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	BrightcoveVideoPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	BrightcoveVideoPlayer.prototype.addEventListener = function(name, handler, capture){
		this.element.addEventListener(name, handler, !!capture);
	};

	BrightcoveVideoPlayer.prototype.removeEventListener = function(name, handler, capture){
		this.element.removeEventListener(name, handler, !!capture);
	};

	BrightcoveVideoPlayer.prototype.features = {
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
			fullScreen: true,
			lastCaption: true,
			play: true,
			seek: true,
			rate: false,
			timeCode: false,
			volume: false
		}
	};

	Ayamel.mediaPlugins.video.brightcove = {
		install: function(args){
			return new BrightcoveVideoPlayer(args);
		},
		supports: function(args){
			return args.resource.type === "video" &&
					args.resource.content.files.some(supportsFile);
		}
	};

}(Ayamel));