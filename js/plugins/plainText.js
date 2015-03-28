(function(Ayamel) {
	"use strict";

	/* Events
		error, play, pause, timeupdate, seeked, ended,
		ratechange, durationchange, volumechange, loadedmetadata
	*/

	function supportsFile(file){
		return file.mimeType === "text/plain";
	}

	function PlaintextPlayer(args) {
		var that = this, xhr,
			muted = false, volume = 1, ready = 0,
			startTime = args.startTime, endTime = args.endTime,
			element = document.createElement('pre');

		this.resource = args.resource;

		// Create the element
		this.element = element;
		element.style.overflowY = "auto";
		args.holder.appendChild(element);

		// Load the source
		xhr = new XMLHttpRequest();
		xhr.open('GET', Ayamel.utils.findFile(args.resource, supportsFile).downloadUri, true);
		xhr.onreadystatechange = function(eventData) {
			if (this.readyState !== 4) { return; }
			if(this.status !== 200){ return; }
			element.textContent = this.responseText;
			ready = 4;
		};
		xhr.send(null);

		Object.defineProperties(this, {
			duration: {
				get: function(){ return 0; }
			},
			currentTime: {
				get: function(){ return 0; },
				set: function(time){ return 0; }
			},
			muted: {
				get: function(){ return muted; },
				set: function(muted){ return muted = !!muted; }
			},
			paused: {
				get: function(){ return true; }
			},
			playbackRate: {
				get: function(){ return 1; },
				set: function(playbackRate){ return 1; }
			},
			readyState: {
				get: function(){ return ready; }
			},
			volume: {
				get: function(){ return volume; },
				set: function(volume){
					volume = +volume||0;
					element.dispatchEvent(new Event("volumechange",{bubbles:true,cancelable:false}));
					return volume;
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

	PlaintextPlayer.prototype.play = function(){};

	PlaintextPlayer.prototype.pause = function(){};

	PlaintextPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	PlaintextPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	PlaintextPlayer.prototype.features = {
		desktop: {
			captions: true,
			annotations: true,
			fullScreen: true,
			lastCaption: false,
			play: false,
			seek: false,
			rate: false,
			timeCode: false,
			volume: false
		},
		mobile: {
			captions: true,
			annotations: true,
			fullScreen: true,
			lastCaption: false,
			play: false,
			seek: false,
			rate: false,
			timeCode: false,
			volume: false
		}
	};

	Ayamel.mediaPlugins.document.plaintext = {
		install: function(args){
			return new PlaintextPlayer(args);
		},
		supports: function(args){
			return args.holder && args.resource.type === "document" &&
					args.resource.content.files.some(supportsFile);
		}
	};


}(Ayamel));