var ControlBar = (function(global){

	loadCSS("./css/controls.css");

	function ProgBar(color){
		var bar_c = document.createElement('div'),
			bar_m = bar_c.cloneNode(false),
			bar_p = bar_c.cloneNode(false);
		
		bar_p.className = "progress_tiny "+color;
		bar_p.style.width = "0%";
		bar_m.className = "mortice_tiny";
		bar_m.appendChild(bar_p);
		bar_c.className = "container_tiny";
		bar_c.appendChild(bar_m);
		this.element = bar_c;
		Object.defineProperty(this,"width",{
			set: function(val){bar_p.style.width = val;},
			get: function(){return bar_p.style.width;}
		});
	}
	
	ProgBar.prototype = {
		addEventListener: function(ename,cb){
			this.element.addEventListener(ename,cb,false);
		},
		removeEventListener: function(ename,cb){
			this.element.removeEventListener(ename,cb,false);
		},
		percent: function(pixels){
			return pixels / parseInt(global.getComputedStyle(this.element,null).getPropertyValue('width'),10);
		}
	};
	
	function SpeedControl(container, initrate){
		var c_speed = container.cloneNode(false),
			s_icon = container.cloneNode(false),
			s_bar = new ProgBar("green"),
			rate;
		
		s_icon.className = "control speed";
		c_speed.className = "playrate";
		c_speed.appendChild(s_icon);
		c_speed.appendChild(s_bar.element);
		
		s_icon.addEventListener('click',function(e){
			if(e.button !== 0){return;}
			var newe = document.createEvent('HTMLEvents');
			newe.initEvent("ratereset",true,true);
			container.dispatchEvent(newe);
		},false);
		
		s_bar.addEventListener('click',function(e){
			if(e.button !== 0){return;}
			var pc = s_bar.percent(e.offsetX || e.layerX),
				newe = document.createEvent('HTMLEvents');
			s_bar.width = (100 * pc) + "%";
			newe.initEvent('ratechange',true,true);
			newe.rate = pc * 3; //pc * 4 - 2;
			container.dispatchEvent(newe);
		},false);
		
		Object.defineProperty(this,'rate',{
			get: function(){return rate;},
			set: function(val){
				//rate = (val<=2?(val>=-2?val:-2):2);
				//s_bar.width = 25*(rate+2)+'%';
				rate = (val<=3?(val>=0?val:0):3);
				s_bar.width = (100*rate/3)+'%';
			}
		});
		this.rate = initrate || 1;
		this.element = c_speed;
	}
	
	function VolControl(container, initvol, initmuted){
		var c_volume = container.cloneNode(false),
			v_icon = container.cloneNode(false),
			v_bar = new ProgBar("green"),
			volume, muted;
			
		c_volume.className = "volume";
		c_volume.appendChild(v_icon);
		c_volume.appendChild(v_bar.element);
	
		v_icon.addEventListener('click',function(e){
			if(e.button !== 0){return;}
			var newe = document.createEvent('HTMLEvents');
			newe.initEvent("mutechange",true,true);
			newe.muted = !muted;
			container.dispatchEvent(newe);
		},false);
		
		v_bar.addEventListener('click',function(e){
			if(e.button !== 0){return;}
			var pc = v_bar.percent(e.offsetX || e.layerX),
				newe = document.createEvent('HTMLEvents');
			v_bar.width = (100 * pc) + "%";
			newe.initEvent('volumechange',true,true);
			newe.volume = 100 * pc;
			container.dispatchEvent(newe);
		},false);
		
		Object.defineProperties(this,{
			volume: {
				get: function(){return volume;},
				set: function(val){
					volume = val<=100?(val>=0?val:0):100;
					v_bar.width = volume+'%';
				}
			},
			muted: {
				get: function(){return muted;},
				set: function(val){
					muted = !!val;
					v_icon.className = muted?'control vol_off':'control vol_on';
				}
			}
		});
		this.volume = initvol || 100;
		this.muted = initmuted || false;
		this.element = c_volume;
	}
	
	function TimeControl(container, duration){
		var prog_bar = new ProgBar("green"),
			progress = 0;
		
		duration = +duration || 0;
		
		prog_bar.element.classList.add("control_time");
		
		prog_bar.addEventListener('click',function(e){
			var pc = prog_bar.percent(e.offsetX || e.layerX),
				newe = document.createEvent('HTMLEvents');		
			prog_bar.width = (100 * pc) + "%";
			newe.initEvent('progressupdate',true,true);
			newe.progress = progress = duration * pc;
			prog_bar.element.dispatchEvent(newe);
		},false);
		
		prog_bar.addEventListener('contextmenu',function(e){
			var newe = document.createEvent('HTMLEvents');
			e.preventDefault();
			newe.initEvent('timecode',true,true);
			newe.time = duration * prog_bar.percent(e.offsetX || e.layerX);
			prog_bar.element.dispatchEvent(newe);
		},false);
		
		Object.defineProperties(this,{
			duration: {
				get: function(){return duration;},
				set: function(val){duration = +val;}
			},
			progress: {
				set: function(val){
					progress = (val<=duration)?(val>=0?val:0):duration;
					prog_bar.width = (duration?100*progress/duration:0)+'%';
				},
				get: function(){return progress;}
			},
		});		
		
		this.element = prog_bar.element;
	}
	
	TimeControl.prototype = {
		addEventListener: function(ename,cb){
			this.element.addEventListener(ename,cb,false);
		},
		removeEventListener: function(ename,cb){
			this.element.removeEventListener(ename,cb,false);
		}
	};
	
	function toTimecode(seconds){
		var hr = Math.floor(seconds/3600),
			mn = (Math.floor(seconds/60)%60),
			sc = (seconds%60);
		hr = hr?hr+":":"";
		if(mn<10){mn="0"+mn;}
		if(sc<10){sc="0"+sc;}
		return hr+mn+":"+sc;
	}
	
	function ControlBar(attrs){
		//Play Back Next Volume Time - Speed A/B CC FS
		var container = document.createElement('div'),
			c_left = container.cloneNode(false),
			c_right = container.cloneNode(false),
			c_buttons = container.cloneNode(false),
			//play back next
			playpause = container.cloneNode(false),
			backb = container.cloneNode(false),
			nextb = container.cloneNode(false),
			//timecode display
			text = document.createElement('span'),
			prog_text = text.cloneNode(false),
			dur_text = text.cloneNode(false),
			//progress bar
			prog_bar = new TimeControl(container),
			playing = attrs.playing,
			ABstart = Number.NEGATIVE_INFINITY,
			ABend = Number.POSITIVE_INFINITY,
			//volume, speed, A/B repeat, CC, fullscreen
			v_bar, s_bar, ab_repeat=false, a_mark=false, b_mark=false,
			ccb=false, fullscreen=false;
		
		v_bar = (attrs.volume !== false) && new VolControl(container, attrs.volume, attrs.muted);
		s_bar = (attrs.playbackRate !== false) && new SpeedControl(container, attrs.playbackRate);
		if(attrs.ab !== false){
			ab_repeat = container.cloneNode(false);
			a_mark = container.cloneNode(false);
			b_mark = container.cloneNode(false);	
			ab_repeat.className = "control ab";
			a_mark.className = b_mark.className = "ab_mark";
		}
		if(attrs.cc !== false){
			ccb = container.cloneNode(false);
			ccb.className = "control cc";
		}
		if(attrs.fs !== false && window.top === window.self){
			fullscreen = container.cloneNode(false);
			fullscreen.className = "control fs";
		}
		
		//Left Section
		playpause.className = "control play";
		backb.className = "control rw";
		nextb.className = "control ff";
		
		prog_text.innerText = "00:00";
		dur_text.innerText = "00:00";
		text.className = "control_text";
		text.appendChild(prog_text);
		text.appendChild(document.createTextNode('/'));
		text.appendChild(dur_text);
		
		//Play Back Next Volume
		c_left.className = "control_left";
		c_left.appendChild(playpause);
		c_left.appendChild(backb);
		c_left.appendChild(nextb);
		v_bar && c_left.appendChild(v_bar.element);
		
		//Right Section
		
		//Speed A/B CC FS
		c_right.className = "control_right";
		s_bar && c_right.appendChild(s_bar.element);
		ab_repeat && c_right.appendChild(ab_repeat);
		ccb && c_right.appendChild(ccb);
		fullscreen && c_right.appendChild(fullscreen);
		
		c_buttons.className = "button_bar";
		c_buttons.appendChild(c_left);
		c_buttons.appendChild(text);
		c_buttons.appendChild(c_right);
		
		container.className = "control_bar";
		container.appendChild(c_buttons);
		container.appendChild(prog_bar.element);

		if(ab_repeat){
			prog_bar.element.appendChild(a_mark);
			prog_bar.element.appendChild(b_mark);
			
			ab_repeat.addEventListener('click',function(e){
				var newe = document.createEvent('HTMLEvents');
				newe.initEvent("timecode",true,true);
				newe.time = prog_bar.progress;
				container.dispatchEvent(newe);
			},false);

			ab_repeat.addEventListener('dblclick',function(e){
				var newe = document.createEvent('HTMLEvents');
				newe.initEvent("ab_dblclick",true,true);
				newe.time = prog_bar.progress;
				container.dispatchEvent(newe);
			},false);
			
			ab_repeat.addEventListener('contextmenu',function(e){
				var newe = document.createEvent('HTMLEvents');
				e.preventDefault();
				newe.initEvent("ab_click",true,true);
				container.dispatchEvent(newe);
			},false);
		}

		if(fullscreen){
			fullscreen.addEventListener('click',function(e){
				if(e.button !== 0){return;}
				var newe = document.createEvent('HTMLEvents');
				newe.initEvent("fullscreen",true,true);
				container.dispatchEvent(newe);
			},false);
		}
		
		playpause.addEventListener('click',function(e){
			if(e.button !== 0){return;}
			var newe = document.createEvent('HTMLEvents');
			newe.initEvent(playing?'pause':'play',true,true);
			container.dispatchEvent(newe);
		},false);
		
		//This event will automatically bubble
		/*prog_bar.addEventListener('timecode',function(e){
			container.dispatchEvent(e);
		},false);*/
		
		Object.defineProperties(this,{
			duration: {
				set: function(val){
					prog_bar.duration = val;
					dur_text.innerText = toTimecode(Math.floor(val));
				},
				get: function(){return prog_bar.duration;}
			},
			progress: {
				set: function(val){
					prog_bar.progress = val;
					prog_text.innerText = toTimecode(Math.floor(val));
				},
				get: function(){return prog_bar.progress;}
			},
			volume: {
				set: function(val){v_bar.volume = val;},
				get: function(){return v_bar.volume;}
			},
			playbackRate: {
				set: function(val){s_bar.rate = val;},
				get: function(){return s_bar.rate;}
			},
			playing: {
				set: function(val){
					playing = !!val;
					playpause.className = playing?'control pause':'control play';
				},
				get: function(){return playing;}
			},
			muted: {
				set: function(val){v_bar.muted = val;},
				get: function(){return v_bar.muted;}
			},
			loopStart: {
				get: function(){return ABstart;},
				set: function(val){
					var d = prog_bar.duration;
					val = +val;
					if(val > ABend){
						this.loopPoint = null;
					}else{
						ABstart = (val>d?d:(val<0?0:val));
						a_mark.style.left = (100*ABstart/d)+'%';
						a_mark.style.visibility = 'visible';
					}
					return ABstart;
				}
			},
			loopEnd: {
				get: function(){return ABend;},
				set: function(val){
					var d = prog_bar.duration;
					val = +val;
					if(val < ABstart){
						this.loopPoint = null;
					}else{
						ABend = (val>d?d:(val<0?0:val));
						b_mark.style.left = (100*ABend/d)+'%';
						b_mark.style.visibility = 'visible';
					}
					return ABend;
				}
			},
			loopPoint: {
				set: function(val){
					var d;
					if(val === null){
						ABstart = Number.NEGATIVE_INFINITY;
						ABend = Number.POSITIVE_INFINITY;
						a_mark.style.visibility = 'hidden';
						b_mark.style.visibility = 'hidden';
					}else{
						d = prog_bar.duration;
						val = +val;
						if(val>d){val = d;}
						else if(val<0){val = 0;}
						
						if(val == ABstart || val == ABend){ return; }
						
						if(ABstart < 0){ //first mark
							ABstart = val;
							a_mark.style.visibility = 'visible';
							a_mark.style.left = (100*ABstart/prog_bar.duration)+'%';
						}else if(ABend === Number.POSITIVE_INFINITY){ //second mark
							if(val > ABstart){ABend = val;}
							else{
								ABend = ABstart;
								ABstart = val;
								a_mark.style.left = (100*ABstart/prog_bar.duration)+'%';
							}
							b_mark.style.visibility = 'visible';
							b_mark.style.left = (100*ABend/prog_bar.duration)+'%';
						}else{
							if(val < ABstart){ // move the starting mark
								ABstart = val;
								a_mark.style.left = (100*ABstart/prog_bar.duration)+'%';
							}
							else{ //move the ending mark
								ABend = val;
								b_mark.style.left = (100*ABend/prog_bar.duration)+'%';
							}
						}
					}
				}
			},
			element: {get: function(){return container;}}
		});
	}
	
	ControlBar.prototype = {
		addEventListener: function(ename,cb){
			this.element.addEventListener(ename,cb,false);
		},
		removeEventListener: function(ename,cb){
			this.element.removeEventListener(ename,cb,false);
		}
	};
	
	return ControlBar;
	
}(window));