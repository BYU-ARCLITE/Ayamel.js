(function(Ayamel) {
	"use strict";

	var template = '<div class="videoBox" style="color:white;text-align:center;">\
		<h3>This resource could not be played on your current machine & browser.</h3></div>';

	function FallbackPlayer(args) {
		var element = Ayamel.utils.parseHTML(template);

		this.resource = args.resource;

		// Create the element
		this.element = element;
		args.holder.appendChild(element);

		Object.defineProperties(this, {
			duration: {
				get: function(){ return 0; }
			},
			currentTime: {
				get: function(){ return 0; },
				set: function(time){ return 0; }
			},
			muted: {
				get: function(){ return true; },
				set: function(muted){ return true; }
			},
			paused: {
				get: function(){ return true; }
			},
			playbackRate: {
				get: function(){ return 1; },
				set: function(playbackRate){ return 1; }
			},
			readyState: {
				get: function(){ return 0; }
			},
			volume: {
				get: function(){ return 100; },
				set: function(volume){ return 100; }
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

	FallbackPlayer.prototype.play = function(){};
	FallbackPlayer.prototype.pause = function(){};

	FallbackPlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.element.style.height = availableHeight + 'px';
	};

	FallbackPlayer.prototype.exitFullScreen = function(){
		this.element.style.height = this.normalHeight + 'px';
	};

	FallbackPlayer.prototype.features = {
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

	var obj = {
		install: function(args){
			return new FallbackPlayer(args);
		},
		supports: function(args){
			return (args.resource.type === "video" || args.resource.type === "audio");
		}
	};
	Ayamel.mediaPlugins.fallbacks.video = obj;
	Ayamel.mediaPlugins.fallbacks.audio = obj;

}(Ayamel));