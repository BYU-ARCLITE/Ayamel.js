(function(Ayamel) {
	"use strict";

	function supportsFile(file) {
		return file.downloadUri && file.mimeType.substr(0,6) === "image/";
	}

	function ImagePlayer(args) {
		var that = this,
			img = new Image(),
			element = document.createElement('div');

		element.className = "videoBox";
		element.appendChild(img);

		this.resource = args.resource;
		this.img = img;
		this.element = element;
		args.holder.appendChild(element);

		img.addEventListener('load', resize, false);
		img.src = Ayamel.utils.findFile(args.resource, supportsFile).downloadUri;

		function resize(){
			//Manual lightboxing
			var scale,
				h = that.height, ih = img.naturalHeight || h,
				w = that.width, iw = img.naturalWidth || w;

			scale = Math.min(h/ih, w/iw);
			img.height = ih * scale;
			img.width = iw * scale;
		}

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
					resize();
					return h;
				}
			},
			width: {
				get: function(){ return element.clientWidth; },
				set: function(w){
					w = +w || element.clientWidth;
					element.style.width = w + "px";
					resize();
					return w;
				}
			}
		});
	}

	ImagePlayer.prototype.play = function(){};
	ImagePlayer.prototype.pause = function(){};

	ImagePlayer.prototype.enterFullScreen = function(availableHeight){
		this.normalHeight = this.element.clientHeight;
		this.height = availableHeight + 'px';
	};

	ImagePlayer.prototype.exitFullScreen = function(){
		this.height = this.normalHeight + 'px';
	};

	ImagePlayer.prototype.addEventListener = function(name, handler, capture){
		this.element.addEventListener(name, handler, !!capture);
	};

	ImagePlayer.prototype.removeEventListener = function(name, handler, capture){
		this.element.removeEventListener(name, handler, !!capture);
	};

	ImagePlayer.prototype.features = {
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

	Ayamel.mediaPlugins.image.basic = {
		install: function(args){
			return new ImagePlayer(args);
		},
		supports: function(args){
			return args.resource.type === "image" &&
					args.resource.content.files.some(supportsFile);
		}
	};

}(Ayamel));