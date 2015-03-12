(function(Ayamel) {
	"use strict";

	var captionHolderTemplate = '<div class="videoCaptionHolder"></div>';

	/* Events
		error, play, pause, timeupdate, seeked, ended,
		ratechange, durationchange, volumechange, loadedmetadata
	*/

	function Timer(element){
		var that = this, start;
		function timeUpdate(timestamp){
			if(!that.playing){ return; }
			if(start){
				that.currentTime += that.playbackRate*(timestamp - start)/1000;
				element.dispatchEvent(new Event("timeupdate",{bubbles:true,cancelable:false}));
			}
			start = timestamp;
			Ayamel.utils.Animation.requestFrame(timeUpdate);
		}
		this.currentTime = 0;
		this.playbackRate = 1;
		this.playing = false;
		this.play = function(){
			this.playing = true;
			start = 0;
			Ayamel.utils.Animation.requestFrame(timeUpdate);
		};
	}

	Timer.prototype.pause = function(){
		this.playing = false;
	};

	function findFile(resource){
		return resource.content.files.filter(
			function(f){ return TimedText.isSupported(f.mime); }
		).sort(function(a,b){
			if(a.representation === b.representation){
				return	a.quality > b.quality ? -1 :
						a.quality < b.quality ? 1 : 0;
			}
			switch(a.representation){
			case 'original': return -1;
			case 'summary': return 1;
			case 'transcoding':
				return b.representation === 'original' ? 1 : -1;
			default: return 1;
			}
		})[0];
	}

	function updateScroll(element,cues,time){
		var before, start, after, end, height, weight;
		[].forEach.call(element.childNodes,function(cdiv){
			var cue = cues[cdiv.dataset.index];
			if(cue.startTime <= time){
				before = cdiv;
				start = cue.startTime;
			}
			if(!after && cue.endTime >= time){
				after = cdiv;
				end = cue.endTime;
			}
			cdiv.classList[(time >= cue.startTime && time <= cue.endTime)?'add':'remove']('active');
		});
		if(!before){
			element.scrollTop = 0;
		}else if(!after){
			element.scrollTop = element.clientHeight - element.offsetHeight;
		}else{
			weight = (time - start)/(end - start);
			height = after.offsetTop - before.offsetTop + after.offsetHeight;
			element.scrollTop =
				(before.offsetTop - element.offsetTop) -
				(element.offsetHeight - height*weight)/2;
		}
	};

	function TextTranscriptPlayer(args) {
		var that = this, timer, track,
			muted = false, volume = 1, ready = 0,
			startTime = args.startTime, endTime = args.endTime,
			element = document.createElement('div'),
			captionsElement = Ayamel.utils.parseHTML(captionHolderTemplate);

		// Create the element
		this.element = element;
		element.style.overflowY = "hidden";
		element.style.paddingLeft = "24pt";
		args.holder.appendChild(element);

		// Create a place for captions
		this.captionsElement = captionsElement;
		args.holder.appendChild(captionsElement);

		// Load the source
		track = TextTrack.get({
			src: findFile(args.resource).downloadUri,
			kind: 'subtitles',
			label: args.resource.title,
			lang: args.resource.languages.iso639_3[0],
			success: function(track){
				ready = 4;
				track.cues.forEach(function(cue,i){
					var cdiv = document.createElement('div');
					cdiv.className = "transcriptCue";
					cdiv.dataset.index = i;
					cdiv.appendChild(cue.getCueAsHTML());
					cdiv.addEventListener('click',function(){
						that.currentTime = cue.startTime;
					},false);
					element.appendChild(cdiv);
				});
				updateScroll(element,track.cues,timer.currentTime);
				element.dispatchEvent(new Event("loadedmetadata",{bubbles:true,cancelable:false}));
				element.dispatchEvent(new Event("durationchange",{bubbles:true,cancelable:false}));
			},
			error: function(){
				element.dispatchEvent(new Event("error",{bubbles:true,cancelable:false}));
			}
		});
		this.track = track;

		timer = new Timer(element);
		this.timer = timer;

		element.addEventListener('timeupdate',function(){
			var d = that.duration;
			if(timer.currentTime >= d){
				timer.pause();
				timer.currentTime = d;
				element.dispatchEvent(new Event("ended",{bubbles:true,cancelable:false}));
			}else{
				updateScroll(element,track.cues,timer.currentTime);
			}
		});
		
		Object.defineProperties(this, {
			duration: {
				get: function(){ return track.cues[track.cues.length-1].endTime; }
			},
			currentTime: {
				get: function(){ return timer.currentTime; },
				set: function(time){ 
					timer.currentTime = +time||0;
					element.dispatchEvent(new Event("seeked",{bubbles:true,cancelable:false}));
					element.dispatchEvent(new Event("timeupdate",{bubbles:true,cancelable:false}));
					return timer.currentTime;
				}
			},
			muted: {
				get: function(){ return muted; },
				set: function(muted){ return muted = !!muted; }
			},
			paused: {
				get: function(){ return !timer.playing; }
			},
			playbackRate: {
				get: function(){ return timer.playbackRate; },
				set: function(playbackRate){
					playbackRate = +playbackRate
					timer.playbackRate = isNaN(playbackRate)?1:playbackRate;
					element.dispatchEvent(new Event("ratechange",{bubbles:true,cancelable:false}));
					return timer.playbackRate;
				}
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

	TextTranscriptPlayer.prototype.play = function(){
		this.timer.play();
		this.element.dispatchEvent(new Event("play",{bubbles:true,cancelable:false}));
	};

	TextTranscriptPlayer.prototype.pause = function(){
		this.timer.pause();
		this.element.dispatchEvent(new Event("pause",{bubbles:true,cancelable:false}));
	};

	TextTranscriptPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	TextTranscriptPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	TextTranscriptPlayer.prototype.features = {
		desktop: {
			captions: true,
			annotations: true,
			fullScreen: true,
			lastCaption: true,
			play: true,
			rate: true,
			timeCode: true,
			volume: false
		},
		mobile: {
			captions: true,
			annotations: true,
			fullScreen: true,
			lastCaption: true,
			play: true,
			rate: false,
			timeCode: true,
			volume: false
		}
	};

	Ayamel.mediaPlugins.document.transcript = {
		install: function(args) {
			return new TextTranscriptPlayer(args);
		},
		supports: function(resource) {
			return resource.type === "document" &&
					resource.content.files.some(
						function(f){ return TimedText.isSupported(f.mime); }
					);
		}
	};


}(Ayamel));