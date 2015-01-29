(function (Ayamel, global) {
	"use strict";

	// https://developers.google.com/youtube/iframe_api_reference

	var template = '<div class="videoBox"><div></div></div>',
		captionHolderTemplate = '<div class="videoCaptionHolder"></div>',
		watchReg = /https?:\/\/www\.youtube\.com\/watch\?v=(.{11})/i,
		shortReg = /https?:\/\/youtu\.be\/(.{11})/i;

	function supportsFile(file) {
		return file.streamUri &&
			(file.streamUri.substr(0, 10) === "youtube://"
			|| watchReg.test(file.streamUri)
			|| shortReg.test(file.streamUri));
	}

	function findFile(resource) {
		var file, i;
		for (i=0; i<resource.content.files.length; i += 1) {
			file = resource.content.files[i];
			if (supportsFile(file))
				return file;
		}
		return null;
	}

	function getYouTubeId(url) {
		var match;
		if (url.substr(0, 10) === "youtube://") {
			return url.substr(10,11);
		}
		match = watchReg.exec(url) || shortReg.exec(url);
		if(match){ return match[1]; }
		return "";
	}

	function YouTubePlayer(args) {
		var _this = this,
			startTime = +args.startTime || 0,
			stopTime = +args.endTime || -1,
			element = Ayamel.utils.parseHTML(template),
			captionsElement = Ayamel.utils.parseHTML(captionHolderTemplate);

		// Create the element
		this.element = element;
		args.holder.appendChild(element);

		this.video = null;

		// Create a place for captions
		this.captionsElement = captionsElement;
		args.holder.appendChild(captionsElement);

		//TODO: Set up properties object to allow interactions before YouTube has loaded

		//Info on how properties & controls work: https://developers.google.com/youtube/js_api_reference

		Object.defineProperties(this, {
			init: {
				value: function() {
					var played = false,
						playing = false;

					video.style.height = "100%";
					video.style.width = "100%";

					// We don't know proper height and width here, so just put in a default;
					this.video = new YT.Player(element.firstChild, {
						height: '600',
						width: '800',
						videoId: getYouTubeId(findFile(args.resource).streamUri),
						playerVars: {
							autoplay: 0,
							cc_load_policy: 0,
							controls: 0,
							disablekb: 1,
							enablejsapi: 1,
							start: startTime,
							end: stopTime === -1 ? undefined : stopTime,
							iv_load_policy: 3,
							modestbranding: 1,
							origin: location.origin,
							playsinline: 1,
							rel: 0,
							showinfo: 0,
						},
						events: {
							onStateChange: function(data){
								if(data === -1) { return; }
								element.dispatchEvent(new Event({
									0: "ended",
									1: "play",
									2: "pause",
									3: "durationchange", //buffering
									5: 'loading' //video cued
								}[data],{bubbles:true,cancelable:true}));

								// If we started playing then send out timeupdate events
								if (data === 1) {
									playing = true;
									timeUpdate();
								}else if(data === 0 || data === 2){
									// If this is the first pause, then the duration is changed/loaded, so send out that event
									if (!played) {
										played = true;
										element.dispatchEvent(new Event('durationchange',{bubbles:true,cancelable:true}));
									}

									playing = false;
								}
							},
							onError: function(err){
								switch(err){
								case 2: alert("Invalid video ID"); return;
								case 100: alert("Video not found"); return;
								case 101:
								case 150: alert("This video can only be watched on YouTube"); return;
								}
							}
						}
					  });

					function timeUpdate() {
						var timeEvent = document.createEvent("HTMLEvents");
						timeEvent.initEvent("timeupdate", true, true);
						element.dispatchEvent(timeEvent);

						if (!playing) { return; }
						if(Ayamel.utils.Animation){
							Ayamel.utils.Animation.requestFrame(timeUpdate);
						}else{
							setTimeout(timeUpdate, 50);
						}
					}
				}
			},
			duration: {
				get: function () {
//                    var stop = stopTime === -1 ? this.video.getDuration() : stopTime;
//                    return stop - startTime;
					return this.video ? this.video.getDuration() : 0;
				}
			},
			currentTime: {
				get: function () {
//                    return this.video.getCurrentTime() - startTime;
					return this.video ? this.video.getCurrentTime() : 0;
				},
				set: function (time) {
					if(!this.video){ return 0; }
					time = Math.floor((+time||0)* 100) / 100;
					this.video.seekTo(time);
					this.element.dispatchEvent(new Event('timeupdate',{bubbles:true,cancelable:true}));
					return time;
				}
			},
			muted: {
				get: function () {
					return this.video ? this.video.isMuted() : false;
				},
				set: function (muted) {
					if(!this.video){ return false; }
					muted = !!muted;
					this.video[muted?'mute':'unMute']();
					return muted;
				}
			},
			paused: {
				get: function () {
					return this.video ? this.video.getPlayerState() !== 1 : true;
				}
			},
			playbackRate: {
				get: function () {
					return this.video ? this.video.getPlaybackRate() : 1;
				},
				set: function (playbackRate) {
					if(!this.video){ return 1; }
					var i, ratelist, best, next, bdist, ndist;
					playbackRate = +playbackRate
					if(isNaN(playbackRate)){ playbackRate = 1; }
					ratelist = this.video.getAvailablePlaybackRates();
					bdist = 1/0;
					for(i=ratelist.length-1, best = ratelist[i]; i>=0; i--){
						next = ratelist[i];
						ndist = Math.abs(playbackRate - next);
						if(ndist > bdist){ break; }
						bdist = ndist;
						best = next;
					}
					if(best !== this.video.getPlaybackRate()){
						this.video.setPlaybackRate(best);
					}
					return best;
				}
			},
			readyState: {
				get: function () {
					return this.video ? this.video.getPlayerState() : 0;
				}
			},
			volume: {
				get: function () {
					return this.video ? this.video.getVolume() / 100 : 1;
				},
				set: function (volume) {
					if(!this.video){ return 1; }
					volume = (+volume||0);
					this.video.setVolume(volume * 100);
					return volume;
				}
			},
			height: {
				get: function(){ return element.clientHeight; },
				set: function(h){
					h = +h || element.clientHeight;
					element.style.height = h + "px";
					//element.firstChild.style.height = h + "px";
					return h;
				}
			},
			width: {
				get: function(){ return element.clientWidth; },
				set: function(w){
					w = +w || element.clientWidth;
					element.style.width = w + "px";
					//element.firstChild.style.width = w + "px";
					return w;
				}
			}
		});
	}

	YouTubePlayer.prototype.play = function(){
		if(!this.video){ return; }
		this.video.playVideo();
	};

	YouTubePlayer.prototype.pause = function(){
		if(!this.video){ return; }
		this.video.pauseVideo();
	};

	YouTubePlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	YouTubePlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	YouTubePlayer.prototype.features = {
		desktop: {
			captions: true,
			annotations: true,
			fullScreen: true,
			lastCaption: true,
			play: true,
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
			rate: true,
			timeCode: true,
			volume: false
		}
	};

	//Load the IFrame Player API code
	var tag = document.createElement('script'),
		ready = false, inits = [];
	tag.src = "https://www.youtube.com/iframe_api";
	document.getElementsByTagName('head')[0].appendChild(tag);
	global.onYouTubeIframeAPIReady = function(){
		ready = true;
		inits.forEach(function(init){ init(); });
	};

	//Register the plugin
	Ayamel.mediaPlugins.video.youtube = {
		install: function(args) {
			var player = new YouTubePlayer(args);
			//If it's ever asynchronous, it should always be asynchronous
			if(ready){ setTimeout(player.init.bind(player),0); }
			else{ inits.push(player.init.bind(player)); }
			return player;
		},
		supports: function(resource) {
			return resource.content.files.some(function (file) {
				return (resource.type === "video" && supportsFile(file));
			});
		}
	};

}(Ayamel, window));