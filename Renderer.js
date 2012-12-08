(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	function Renderer(element,ar){
		var aspect_control = document.createElement('div'),
			aspect_element = document.createElement('div'),
			content = document.createElement('div'),
			self = this,
			controls;
		
		this.attrs = {
			muted: false,
			volume: 100,
			playing: false,
			playbackRate: 1
		};

		controls = new ControlBar(this.attrs);
		
		aspect_control.style.marginTop = ar?(+ar)+"%":"50%";
		aspect_element.className = "aspect_element";
		aspect_element.appendChild(content);
		aspect_element.appendChild(controls.element);
		element.innerHTML = "";
		element.classList.add("aspect_container");
		element.appendChild(aspect_control);
		element.appendChild(aspect_element);
		
		controls.addEventListener('progressupdate',function(){
			self.currentTime = controls.progress;
		},false);
		
		controls.addEventListener('play',this.Play.bind(this),false);
		controls.addEventListener('pause',this.Pause.bind(this),false);
		controls.addEventListener('mutechange',function(e){
			self.muted = e.muted;
		},false);
		controls.addEventListener('volumechange',function(e){
			self.volume = e.volume;
		},false);
		controls.addEventListener('ratechange',function(e){
			self.playbackRate = e.rate;
		},false);
		controls.addEventListener('fullscreen',function(e){
			self[self.isFullScreen?'LeaveFullScreen':'EnterFullScreen']();
		},false);
		controls.addEventListener('timecode',function(e){
			controls.loopPoint = e.time;
		},false);
		controls.addEventListener('ab_click',function(e){
			var codes = prompt("What time codes?").split(',');
			controls.loopPoint = codes[0];
			controls.loopPoint = codes[1];
		},false);
		controls.addEventListener('ab_dblclick',function(e){
			controls.loopPoint = null;
		},false);
		
		this.index = -1;
		this.actor = null;
		this.element = aspect_element;
		this.controls = controls;
		
		this.Resize = function(width,height) {
			aspect_control.style.marginTop = (
				typeof height === 'undefined'
				?width
				:(100*height/width))+"%";
		};
		
		this.frame = Object.create(this,{
			element: {value: content},
			actor: {
				set: function(val){self.actor=val;},
				get: function(){return self.actor;}
			}
		});
		
		Object.defineProperty(this,'aspect',{
			set: function(val){
				val = +val;
				aspect_control.style.marginTop = val+"%";
				return val;
			},
			get: function(){return +aspect_control.style.marginTop;},
			enumerable: true		
		});
	}
		
	Ayamel.Renderer = Renderer;
}(Ayamel));