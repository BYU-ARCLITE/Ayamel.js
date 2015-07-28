(function(Ayamel,global){

	var counter = 0,
		template = "<div class='videoBox'><div></div></div>",
		installed = false,
		supportedMimeTypes = [
			"video/mp4",
			"video/x-flv"
		];

	function supportsFile(file){
		var mime = file.mime.split(";")[0];
		return supportedMimeTypes.indexOf(mime) >= 0;
	}

	function FlashVideoPlayer(args){
		var flowId = "flowVideoHolder"+(counter++).toString(36),
			playing = false,
			swfPath = Ayamel.path + "js/plugins/flowplayer/flowplayer-3.2.16.swf",
			element = Ayamel.utils.parseHTML(template),
			startTime = args.startTime, endTime = args.endTime,
			width, height, player;

		this.resource = args.resource;

		// Create the element
		this.element = element;
		element.firstChild.id = flowId;
		element.firstChild.style = "height:100%;";  // So that the flowPlayer will show up in Mac-Firefox
		args.holder.appendChild(element);

		function fireTimeEvents(){
			if(!playing){ return; }
			// Make sure that we are playing within bounds (give a buffer because flash vid isn't perfect)
			if(startTime !== 0 && player.getTime() < startTime - 0.5){
				player.seek(startTime);
			}
			if(endTime > -1 && player.getTime() >= endTime - 0.1){
				player.seek(endTime);
				player.stop();
				element.dispatchEvent(new Event('ended',{bubbles:true,cancelable:false}));
			}

			element.dispatchEvent(new Event('timeupdate',{bubbles:true,cancelable:false}));

			if(Ayamel.utils.Animation){
				Ayamel.utils.Animation.requestFrame(fireTimeEvents);
			}else{
				setTimeout(fireTimeEvents, 50);
			}
		}

		// Create the player
		player = flowplayer(flowId, {
			src: swfPath,
			wmode: "opaque"
		}, {
			canvas: {
				backgroundColor: "#000000",
				backgroundGradient: "none"
			},
			clip: {
				url: Ayamel.utils.findFile(args.resource, supportsFile).downloadUri,
				autoPlay: false,
				autoBuffering: true,
				scaling: "fit",

				// Set up clip events
				onFinish: function(){
					playing = false;
					element.dispatchEvent(new Event('ended',{bubbles:true,cancelable:false}));
				},
				onMetaData: function(){
					element.dispatchEvent(new Event('durationchange',{bubbles:true,cancelable:false}));
				},
				onPause: function(){
					playing = false;
					element.dispatchEvent(new Event('pause',{bubbles:true,cancelable:false}));
				},
				onResume: function(){
					playing = true;
					element.dispatchEvent(new Event('play',{bubbles:true,cancelable:false}));
					fireTimeEvents();
				},
				onStart: function(){
					playing = true;
					element.dispatchEvent(new Event('play',{bubbles:true,cancelable:false}));
					fireTimeEvents();
				},
				onStop: function(){
					playing = false;
					element.dispatchEvent(new Event('pause',{bubbles:true,cancelable:false}));
				},
				onVolume: function(){
					element.dispatchEvent(new Event('volumechange',{bubbles:true,cancelable:false}));
				}
			},
			play: null,
			plugins: {
				controls: null
			}
		});

		this.player = player;

		Object.defineProperties(this, {
			duration: {
				get: function(){ return player.getClip().fullDuration; }
			},
			currentTime: {
				get: function(){ return player.getTime(); },
				set: function(time){
					time = Math.floor((+time||0) * 100) / 100;
					player.seek(time);
					element.dispatchEvent(new Event('timeupdate',{bubbles:true,cancelable:false}));
					return time;
				}
			},
			muted: {
				get: function(){ return muted; },
				set: function(muted){
					muted = !!muted;
					player[muted?'mute':'unmute']();
					return muted;
				}
			},
			paused: {
				get: function(){ return player.isPaused(); }
			},
			playbackRate: {
				get: function(){ return 1; },
				set: function(playbackRate){ return 1; }
			},
			readyState: {
				get: function(){ return player.getState(); }
			},
			volume: {
				get: function(){ return player.getVolume() / 100; },
				set: function(volume){
					volume = (+volume||0) * 100;
					player.setVolume(volume);
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

	FlashVideoPlayer.prototype.play = function(){
		this.player.play();
	};

	FlashVideoPlayer.prototype.pause = function(){
		this.player.pause();
	};

	FlashVideoPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	FlashVideoPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	FlashVideoPlayer.prototype.addEventListener = function(name, handler, capture){
		this.element.addEventListener(name, handler, !!capture);
	};

	FlashVideoPlayer.prototype.removeEventListener = function(name, handler, capture){
		this.element.removeEventListener(name, handler, !!capture);
	};

	FlashVideoPlayer.prototype.features = {
		desktop: {
			captions: true,
			annotations: true,
			fullScreen: true,
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
			play: true,
			seek: true,
			rate: false,
			timeCode: true,
			volume: false
		}
	};

	Ayamel.mediaPlugins.video.flash = {
		install: function(args){
			if(!Ayamel.path){
				console.log('Missing Ayamel Library Path');
				return null;
			}
			if(typeof global.flowplayer !== 'function'){
				console.log('Missing Flowplayer API');
				return null;
			}
			return new FlashVideoPlayer(args);
		},
		supports: function(args){

			// Ensure that the browser supports flash
			var hasFlash = (
				typeof global.ActiveXObject === 'function' &&
				!!(new global.ActiveXObject('ShockwaveFlash.ShockwaveFlash'))
			) || (typeof navigator.mimeTypes["application/x-shockwave-flash"] !== 'undefined');

			// Check that there is a supported resource
			return hasFlash && args.resource.type === "video" &&
					args.resource.content.files.some(supportsFile);
		}
	};

}(Ayamel,window));