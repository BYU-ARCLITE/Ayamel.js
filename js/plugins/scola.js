(function(Ayamel) {
	"use strict";

	var template = "<div class='videoBox'><video style='pointer-events:none;'></video></div>",
		supports = ["probably", "maybe"],
		testVideo = document.createElement('video');

	var events = {
		abort: 'error',                     // Data loading was aborted
		error: 'error',                     // An error occurred
		emptied: 'error',                   // Data not present unexpectedly
		stalled: 'error',                   // Data transfer stalled
		play: 'play',                       // Video started playing (fired with play())
		pause: 'pause',                     // Video has paused (fired with pause())
		playing: 'play',                    // Playback started
		timeupdate: 'timeupdate',           // currentTime was changed
		seeked: 'seek',
		ended: 'ended',                     // Video has ended
		ratechange: 'ratechange',           // Playback rate has changed
		durationchange: 'durationchange',   // Duration has changed (for streams)
		loadedmetadata: 'loadedmetadata',   // Metadata (including duration) is fully loaded
		volumechange: 'volumechange'        // Volume has changed
	};

	function supportsFile(file){
		return file.streamUri && file.streamUri.substr(0, 8) === 'scola://';
	}

	function getSignedUrl(args){
		if(!window.SCOLAEndpoint){
			throw new Error("No Endpoint Configured for SCOLA plugin");
		}

		return new Promise(function(resolve, reject){
			var data = new FormData(),
			    xhr = new XMLHttpRequest(),
				file = Ayamel.utils.findFile(args.resource, supportsFile);

			data.append("url", file.streamUri.replace(/^scola:/,"https:"));
			xhr.open("POST", window.SCOLAEndpoint,true);
			xhr.addEventListener("load", function(){
				if(xhr.status < 200 || xhr.status > 299){
					reject(new Error("Error requesting signed URL"));
				}
				resolve(xhr.responseText);
			});
			xhr.addEventListener("error", function(){
				reject(new Error("Error requesting signed URL"));
			});
			xhr.send(data);
		});
	}

	function scolaPlayer(args, url){
		var startTime = args.startTime, endTime = args.endTime,
			element = Ayamel.utils.parseHTML(template),
			video = element.querySelector("video");

		// Create the element
		this.element = element;
		if(args.holder){
			args.holder.appendChild(element);
		}

		this.resource = args.resource;
		this.video = video;

		// Load the source
		var context = Dash.di.DashContext();
		var player = MediaPlayer(context);

		player.startup();
		player.attachView(video);
		player.attachSource(url);
		player.debug.setLogToBrowserConsole(false);
		this.player = player;

		// Set up event propagation
		Object.keys(events).forEach(function(eventName){
			video.addEventListener(eventName, function(event){
				event.stopPropagation();
				element.dispatchEvent(new Event(events[eventName],{bubbles:true,cancelable:false}));
			}, false);
		});

		// Set up the duration
		element.addEventListener("timeupdate", function(event) {
			if(endTime > -1 && player.time() > endTime){
				video.pause();
				element.dispatchEvent(new Event("ended",{bubbles:true,cancelable:false}));
			}
		}, false);

		Object.defineProperties(this, {
			duration: {
				get: function(){ return player.duration(); }
			},
			currentTime: {
				get: function(){ return player.time(); },
				set: function(time){
					player.seek(+time||0);
					return player.time();
				}
			},
			muted: {
				get: function(){ return video.muted; },
				set: function(muted){ return video.muted = !!muted; }
			},
			paused: {
				get: function(){ return video.paused; }
			},
			playbackRate: {
				get: function(){ return video.playbackRate; },
				set: function(playbackRate){
					playbackRate = +playbackRate
					return video.playbackRate = isNaN(playbackRate)?1:playbackRate;
				}
			},
			readyState: {
				get: function(){ return (player.isReady()) ? video.readyState:0; }
			},
			volume: {
				get: function(){ return video.volume; },
				set: function(volume){ return video.volume = +volume||0; }
			},
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

	scolaPlayer.prototype.play = function(){
		this.video.play();
	};

	scolaPlayer.prototype.pause = function(){
		this.video.pause();
	};

	scolaPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	scolaPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	scolaPlayer.prototype.addEventListener = function(name, handler, capture){
		this.element.addEventListener(name, handler, !!capture);
	};

	scolaPlayer.prototype.removeEventListener = function(name, handler, capture){
		this.element.removeEventListener(name, handler, !!capture);
	};

	scolaPlayer.prototype.features = {
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
			timeCode: true,
			volume: false
		}
	};

	Ayamel.mediaPlugins.video.scola = {
		install: function(args){
			return getSignedUrl(args).then(function(url){
				return new scolaPlayer(args, url);
			});
		},
		supports: function(args){
			return args.resource.type === "video" &&
					args.resource.content.files.some(supportsFile);
		}
	};


}(Ayamel));