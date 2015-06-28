(function(Ayamel) {
	"use strict";

	var wtemplate =
		'<div class="widgets">\
			<div class="left"></div>\
			<div class="right"></div>\
		</div>';

	function addComponent(holder, mplayer, component) {
		// Check to see if this component is supported by the plugin and device
		if(!mplayer.supports(component)){ return; }

		var constructor = Ayamel.controls[component];
		if(typeof constructor !== 'function'){ return; }

		this.components[component] = new constructor({
			parent: this,
			player: mplayer,
			holder: holder
		});
	}

	function ControlBar(args) {
		var ayamelPlayer = args.ayamelPlayer,
			control_timeout = 0,
			controlLists = args.components || {left:["play", "volume", "captions", "annotations"], right:["rate", "fullScreen", "timeCode"]},
			components = {}, progressBar, timeCode,
			currentTime = 0, duration = 0,
			element = document.createElement('div');

		element.className = "controlBar";

		// Create the ProgressBar
		progressBar = args.mediaPlayer.supports('seek')?
		new Ayamel.classes.ProgressBar({
			holder: element
		}):{};

		element.appendChild(Ayamel.utils.parseHTML(wtemplate));

		this.element = element;
		args.holder.appendChild(element);

		//set default values
		this.volume = 0;
		this.muted = false;
		this.playbackRate = 0;
		this.playing = false;
		this.fullScreen = false;
		this.scale = 1;

		// Create the control bar components
		this.components = components;

		if(controlLists.left instanceof Array){
			controlLists.left.forEach(addComponent.bind(this, element.querySelector(".left"), args.mediaPlayer));
		}
		if(controlLists.right instanceof Array){
			controlLists.right.forEach(addComponent.bind(this, element.querySelector(".right"), args.mediaPlayer));
		}

		function showControls(){
			if(control_timeout){
				clearTimeout(control_timeout);
				control_timeout = 0;
			}
			element.style.opacity = 1;
		}

		element.addEventListener('mouseenter', showControls, false);
		ayamelPlayer.addEventListener('touchstart', showControls, false);
		ayamelPlayer.addEventListener('exitfullscreen', showControls, false);

		function hideControls(){
			if(control_timeout){ clearTimeout(control_timeout); }
			if(!ayamelPlayer.isFullScreen){
				element.style.opacity = 1;
				control_timeout = 0;
				return;
			}
			control_timeout = setTimeout(function(){
				element.style.opacity = 0;
			}, 2000);
		}

		element.addEventListener('mouseleave', hideControls, false);
		ayamelPlayer.addEventListener('touchend', hideControls, false);

		timeCode = components.timeCode || {};
		Object.defineProperties(this, {
			height: {
				enumerable: true,
				get: function(){ return element.offsetHeight; }
			},
			currentTime: {
				enumerable: true,
				set: function (value) {
					currentTime = Math.min(+value||0,duration);
					progressBar.progress = currentTime / duration;
					timeCode.currentTime = currentTime;
					return currentTime;
				},
				get: function(){ return currentTime; }
			},
			duration: {
				enumerable: true,
				set: function (value) {
					duration = +value||0;
					timeCode.duration = duration;
					if(currentTime > duration) {
						currentTime = duration;
						progressBar.progress = 1;
						timeCode.currentTime = duration;
					}
					return duration;
				},
				get: function(){ return duration; }
			}
		});
	}

	ControlBar.prototype.resize = function(){
		var key, component,
			el = this.element,
			left = el.querySelector(".left"),
			right = el.querySelector(".right"),
			scale = el.clientWidth / (left.clientWidth + right.clientWidth + 2);
		this.scale = Math.min(scale, 1);
		if(scale < 1){
			left.style.transform = "scale("+scale+","+scale+")";
			right.style.transform = "scale("+scale+","+scale+")";
		}else{
			left.style.removeProperty("transform");
			right.style.removeProperty("transform");
		}
		for(key in this.components){
			component = this.components[key];
			if(typeof component.resize === 'function'){ component.resize(); }
		}
	};

	ControlBar.prototype.addEventListener = function(event, callback, capture) {
		this.element.addEventListener(event, callback, !!capture);
	};

	ControlBar.prototype.removeEventListener = function(event, callback, capture) {
		this.element.removeEventListener(event, callback, !!capture);
	};

	Ayamel.classes.ControlBar = ControlBar;
}(Ayamel));