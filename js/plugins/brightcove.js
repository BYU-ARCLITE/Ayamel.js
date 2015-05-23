(function(Ayamel){
	"use strict";

	var accountNum = "1126213333001";
	var playerId = "d3af83a6-196d-4b91-bb6a-9838bdff05ec";

	var events = [
		'play','pause','ended',
		'timeupdate',
		'durationchange',
		'volumechange'
	];

	function supportsFile(file) {
		return file.streamUri && file.streamUri.substr(0,13) === "brightcove://";
	}

	function generateBrightcoveTemplate(videoId){
		var source, box = Ayamel.utils.parseHTML('<div class="videoBox"><iframe style="width:100%;height:100%;"/></div>');
		source = '<html><body><video data-account="' + accountNum
			+ '" data-player="' + playerId
			+ '" data-video-id="' + videoId
			+ '" data-embed="default" class="video-js"></video>\
			<script src="http://players.brightcove.net/'
			+ accountNum + '/'
			+ playerId + '_default/index.min.js"></script>\
			</body></html>';
		box.firstChild.src = URL.createObjectURL(new Blob([source], {type: 'text/html'}));
		return box;
	}

	function BrightcoveVideoPlayer(args) {
		var that = this, player,
			startTime = args.startTime, endTime = args.endTime,
			file = Ayamel.utils.findFile(args.resource, supportsFile),
			videoId = file.streamUri.substr(13),
			element = generateBrightcoveTemplate(videoId),
			properties = {
				duration: 0,
				currentTime: startTime,
				paused: true,
				volume: 1,
				muted: false,
				playbackRate: 1
			};

		this.resource = args.resource;

		this.element = element;
		args.holder.appendChild(element);

		this.player = null;
		this.properties = properties;

		/*APIPromise.then(function(){
			player = videojs(element.firstChild, {
				controls: false,
				autoplay: false,
				preload: "auto"
			});
			that.player = player;
			return new Promise(function(resolve){
				player.ready(resolve);
			});
		}).then(function(){
			var c = element.querySelector('.vjs-control-bar');
			c.parentElement.removeChild(c);
			events.forEach(function(ename){
				player.on(ename, function(){
					properties.currentTime = player.currentTime();
					properties.duration = player.duration();
					properties.paused = player.paused();
					properties.volume = player.volume();
					properties.muted = player.muted();
					properties.playbackRate = player.playbackRate();
					element.dispatchEvent(new Event(ename,{
						bubbles:true,cancelable:false
					}));
				});
			});

			player.height(element.clientHeight, true);
			player.width(element.clientWidth, true);
			player.currentTime(properties.currentTime);
			player.volume(properties.volume);
			player.muted(properties.muted);
			player.playbackRate(properties.playbackRate);
			if(!properties.paused){ player.play(); }
		});*/

		Object.defineProperties(this, {
			height: {
				get: function(){ return element.clientHeight; },
				set: function(h){
					h = +h || element.clientHeight;
					element.style.height = h + "px";
					player && player.height(h, true);
					return h;
				}
			},
			width: {
				get: function(){ return element.clientWidth; },
				set: function(w){
					w = +w || element.clientWidth;
					element.style.width = w + "px";
					player && player.width(w, true);
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
				this.player && this.player.currentTime(time);
				return time;
			}
		},
		muted: {
			get: function(){ return this.properties.muted; },
			set: function(muted){
				muted = !! muted;
				this.properties.muted = muted;
				this.player && this.player.muted(muted);
				return muted;
			}
		},
		volume: {
			get: function(){ return this.properties.volume; },
			set: function(volume){
				volume = Math.max(+volume || 0, 0);
				this.properties.volume = volume;
				this.player && this.player.volume(volume);
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
				this.player && this.player.playbackRate(rate);
				return rate;
			}
		},
		readyState: {
			get: function(){ return 0; }
		}
	});

	BrightcoveVideoPlayer.prototype.play = function() {
		this.player && this.player.play();
		this.properties.paused = false;
	};

	BrightcoveVideoPlayer.prototype.pause = function() {
		this.player && this.player.pause();
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
			rate: true,
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