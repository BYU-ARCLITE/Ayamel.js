(function(Ayamel) {
	"use strict";

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

	function supportsFile(file){
		return TimedText.isSupported(file.mime);
	}

	//TODO: Dedeuplicate this with MediaPlayer.js
	function loadAnnotations(resource, config){
		var test = null;
		if(config.whitelist instanceof Array){
			test = function(relation){ return config.whitelist.indexOf(relation.subjectId) > -1; };
		}else if(config.blacklist instanceof Array){
			test = function(relation){ return config.blacklist.indexOf(relation.subjectId) === -1; };
		}
		return resource.getAnnotations(test).then(function(rlist){
			return Promise.all(rlist.map(function(annres){
				return Ayamel.utils.HTTP({url: annres.content.files[0].downloadUri})
				.then(function(manifest){
					return new Ayamel.Annotator.AnnSet(
						resource.title,
						resource.languages.iso639_3[0],
						JSON.parse(manifest)
					);
				}).then(null,function(err){ return null; });
			}));
		}).then(function(list){
			return list.filter(function(m){ return m !== null; });
		});
	}

	function TextTranscriptPlayer(args){
		var that = this, timer, track, annotator,
			resource = args.resource,
			muted = false, volume = 1, ready = 0,
			startTime = args.startTime, endTime = args.endTime,
			translator = args.translator,
			annotations = args.annotations,
			element = document.createElement('div');

		this.resource = resource;

		// Create the element
		this.element = element;
		element.style.overflowY = "hidden";
		element.style.paddingLeft = "24pt";
		args.holder.appendChild(element);

		if(annotations){
			annotator = new Ayamel.Annotator({
				parsers: annotations.parsers,
				classList: annotations.classList,
				style: annotations.style,
				handler: function(data, lang, text, index){
					player.element.dispatchEvent(new CustomEvent("annotation", {
						bubbles: true,
						detail: {data: data, lang: lang, text: text, index: index}
					}));
				}
			});
			loadAnnotations(resource, annotations).then(function(list){
				var element = player.element;
				annotator.annotations = list;
				list.forEach(function(annset){
					element.dispatchEvent(new CustomEvent('addannset', {
						bubbles:true, detail: {annset: annset}
					}));
				});
			});
		}

		// Load the source
		track = TextTrack.get({
			src: Ayamel.utils.findFile(resource, supportsFile).downloadUri,
			kind: 'subtitles',
			label: args.resource.title,
			lang: args.resource.languages.iso639_3[0],
			success: function(track){
				var offset = 0;
				ready = 4;
				track.cues.forEach(function(cue,i){
					var content = cue.getCueAsHTML(),
						textIndex = offset;
					offset += content.textContent.length;

					if(cue.endTime < startTime){ return; }
					if(endTime > -1 && cue.startTime > endTime){ return; }
					var txt, cdiv = document.createElement('div');
					cdiv.className = "transcriptCue";
					cdiv.dataset.index = i;

					txt = new Ayamel.Text({
						content: cue.getCueAsHTML(),
						processor: annotator?function(n){
							annotator.index = textIndex;
							return annotator.HTML(n);
						}:null
					});

					if(translator){
						//TODO: Deduplicate this with MediaPlayer.js
						txt.addEventListener('selection',function(event){
							var detail = event.detail;
							translator.translate({
								//TODO: Check if range contains multiple languages
								srcLang: Ayamel.utils.findCurrentLanguage(
									detail.range.startContainer,
									cue.track.language,
									'transcriptCue'
								),//destLang is left to default
								text: detail.fragment.textContent.trim(),
								data: {
									cue: cue,
									sourceType: "transcript"
								}
							});
						},false);
					}

					cdiv.appendChild(txt.displayElement);
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
			var d = (endTime > -1 ? endTime : that.duration);
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
					time = Math.max(+time||0,startTime);
					if(endTime > -1){ time = Math.min(time, endTime); }
					timer.currentTime = time;
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
			seek: true,
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
			seek: true,
			rate: false,
			timeCode: true,
			volume: false
		}
	};

	Ayamel.mediaPlugins.document.transcript = {
		install: function(args){
			return new TextTranscriptPlayer(args);
		},
		supports: function(args){
			return args.holder && args.resource.type === "document" &&
					args.resource.content.files.some(supportsFile);
		}
	};


}(Ayamel));