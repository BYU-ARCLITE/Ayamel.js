(function(Ayamel) {
	"use strict";

	var template = "<div class='videoBox'><video style='pointer-events:none;'></video></div>";

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
		return	file.mimeType === 'application/x-mpegURL' ||
				file.mimeType === 'application/vnd.apple.mpegURL' ||
				file.downloadUri.indexOf('.m3u8') > -1;
	}

	function THEOVideoPlayer(args){
		var startTime = args.startTime, endTime = args.endTime,
			element = Ayamel.utils.parseHTML(template),
			videoel = element.querySelector("video"),
			video;

		// Create the element
		this.element = element;
		if(args.holder){
			args.holder.appendChild(element);
		}

		this.resource = args.resource;

		// Load the source
		videoel.src = Ayamel.utils.findFile(args.resource, supportsFile).downloadUri;
		video = theoplayer(videoel);
		this.video = video;
		
		// Set up event propagation
		Object.keys(events).forEach(function(eventName){
			video.addEventListener(eventName, function(event){
				element.dispatchEvent(new Event(events[eventName],{bubbles:true,cancelable:false}));
			}, false);
		});

		// Set up the duration
		element.addEventListener("timeupdate", function(event) {
			if(endTime > -1 && video.currentTime > endTime){
				video.pause();
				element.dispatchEvent(new Event("ended",{bubbles:true,cancelable:false}));
			}
		}, false);

		Object.defineProperties(this, {
			duration: {
				get: function(){ return video.duration; }
			},
			currentTime: {
				get: function(){ return video.currentTime; },
				set: function(time){ return video.currentTime = +time||0; }
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
				get: function(){ return video.readyState; }
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
					video.height = h;
					return h;
				}
			},
			width: {
				get: function(){ return element.clientWidth; },
				set: function(w){
					w = +w || element.clientWidth;
					element.style.width = w + "px";
					video.width = w;
					return w;
				}
			}
		});
	}

	THEOVideoPlayer.prototype.play = function(){
		this.video.play();
	};

	THEOVideoPlayer.prototype.pause = function(){
		this.video.pause();
	};

	THEOVideoPlayer.prototype.enterFullScreen = function(h,w){
		this.normalHeight = this.element.clientHeight;
		this.normalWidth = this.element.clientWidth;
		this.element.style.height = h + 'px';
		this.element.style.width = w + 'px';
		this.video.height = h;
		this.video.width = w;
	};

	THEOVideoPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
		this.element.style.width = this.normalWidth + 'px';
		this.video.height = this.normalHeight;
		this.video.width = this.normalWidth;
	};

	THEOVideoPlayer.prototype.addEventListener = function(name, handler, capture){
		this.element.addEventListener(name, handler, !!capture);
	};

	THEOVideoPlayer.prototype.removeEventListener = function(name, handler, capture){
		this.element.removeEventListener(name, handler, !!capture);
	};

	THEOVideoPlayer.prototype.features = {
		desktop: {
			captions: true,
			annotations: true,
			fullScreen: true,
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
			play: true,
			seek: true,
			rate: false,
			timeCode: true,
			volume: false
		}
	};

	Ayamel.mediaPlugins.video.theo = {
		install: function(args){
			return new THEOVideoPlayer(args);
		},
		supports: function(args){
			return args.resource.type === "video" &&
					args.resource.content.files.some(supportsFile);
		}
	};


}(Ayamel));