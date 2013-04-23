(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	function MediaController(element, components){
		var self = this,
			attrs = {
				muted: false,
				volume: 100,
				playing: false,
				playbackRate: 1,
                componentNames: components
			},
			controls = new ControlBar(attrs);
		
		this.attrs = attrs;
		this.controls = controls;
		this.controlElement = element;
		
		element.appendChild(controls.element);
		
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
	}
		
	Ayamel.MediaController = MediaController;
}(Ayamel));