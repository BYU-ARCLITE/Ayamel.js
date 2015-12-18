(function(Ayamel) {
	"use strict";

	var template =
		"<div class='playerTop'></div>",
		supports = ["probably", "maybe"],
		testAudio = document.createElement("audio");

	var events = {
		abort: 'error',                     // Data loading was aborted
		error: 'error',                     // An error occured
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
		// Not sure how all browsers will deal with Apple's special mime types, so we'll normalize them
		var mime = file.mime.replace("x-m4a", "mp4");
		return supports.indexOf(testAudio.canPlayType(mime)) >= 0;
	}

	function Html5AudioPlayer(args){
		var startTime = args.startTime, endTime = args.endTime,
			element = Ayamel.utils.parseHTML(template),
			audio = new Audio();

		this.element = element;
		if(args.holder){
			args.holder.appendChild(element);
		}

		this.audio = audio;
		this.resource = args.resource;

		// Load the source
		audio.src = Ayamel.utils.findFile(args.resource, supportsFile).downloadUri;

		// Set up event propagation
		Object.keys(events).forEach(function(eventName){
			audio.addEventListener(eventName, function(event){
				element.dispatchEvent(new Event(events[eventName],{bubbles:true,cancelable:true}));
				event.stopPropagation();
			}, false);
		});

		// Set up the duration
		element.addEventListener("timeupdate", function(event){
			if (endTime > -1 && audio.currentTime >= endTime) {
				audio.pause();
				element.dispatchEvent(new Event("ended",{bubbles:true,cancelable:false}));
			}
		}, false);

		Object.defineProperties(this, {
			duration: {
				get: function(){ return audio.duration; }
			},
			currentTime: {
				get: function(){ return audio.currentTime; },
				set: function(time){
					return audio.currentTime = +time||0;
				}
			},
			muted: {
				get: function(){ return audio.muted; },
				set: function(muted){
					return audio.muted = !!muted;
				}
			},
			playbackRate: {
				get: function(){ return audio.playbackRate; },
				set: function(playbackRate){
					playbackRate = +playbackRate
					return audio.playbackRate = isNaN(playbackRate)?1:playbackRate;
				}
			},
			readyState: {
				get: function(){ return audio.readyState; }
			},
			volume: {
				get: function(){ return audio.volume; },
				set: function(volume){
					return audio.volume = +volume||0;
				}
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

	Html5AudioPlayer.prototype.play = function(){
		this.audio.play();
	};

	Html5AudioPlayer.prototype.pause = function(){
		this.audio.pause();
	};

	Html5AudioPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	Html5AudioPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	Html5AudioPlayer.prototype.addEventListener = function(name, handler, capture){
		this.element.addEventListener(name, handler, !!capture);
	};

	Html5AudioPlayer.prototype.removeEventListener = function(name, handler, capture){
		this.element.removeEventListener(name, handler, !!capture);
	};

	Html5AudioPlayer.prototype.features = {
		desktop: {
			captions: true,
			annotations: true,
			fullScreen: false,
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
			fullScreen: false,
			lastCaption: true,
			play: true,
			seek: true,
			rate: false,
			timeCode: true,
			volume: false
		}
	};

	Ayamel.mediaPlugins.audio.html5 = {
		install: function(args){
			return new Html5AudioPlayer(args);
		},
		supports: function(args){
			return args.resource.type === "audio" &&
					args.resource.content.files.some(supportsFile);
		}
	};

}(Ayamel));