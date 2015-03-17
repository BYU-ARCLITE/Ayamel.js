(function(Ayamel) {
	"use strict";

	var template = "<div class='videoBox'><video></video></div>",
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

	function supportsFile(file) {
		return supports.indexOf(testVideo.canPlayType(file.mime)) >= 0;
	}

	function Html5VideoPlayer(args) {
		var startTime = args.startTime, endTime = args.endTime,
			element = Ayamel.utils.parseHTML(template),
			video = element.querySelector("video");

		// Create the element
		this.element = element;
		args.holder.appendChild(element);

		this.video = video;

		// Load the source
		video.src = Ayamel.utils.findFile(args.resource, supportsFile).downloadUri;

		// Set up event propagation
		Object.keys(events).forEach(function (eventName) {
			video.addEventListener(eventName, function(event){
				event.stopPropagation();
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

	Html5VideoPlayer.prototype.play = function(){
		this.video.play();
	};

	Html5VideoPlayer.prototype.pause = function(){
		this.video.pause();
	};

	Html5VideoPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	Html5VideoPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	Html5VideoPlayer.prototype.features = {
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

	Ayamel.mediaPlugins.video.html5 = {
		install: function(args) {
			return new Html5VideoPlayer(args);
		},
		supports: function(resource) {
			return resource.type === "video" &&
					resource.content.files.some(supportsFile);
		}
	};


}(Ayamel));