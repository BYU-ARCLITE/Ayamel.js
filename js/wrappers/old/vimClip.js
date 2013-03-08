var vimeoPlayerInstall = function(host,global,callback){
	
	function evt_map(ename){
		this.v && this.v.callHandlers(ename);
	}
	
	function vimClip(res,start,stop){
		var f = host.genFrame.cloneNode(false),
			muted = false,
			vol_latch = 1,
			time_latch = start,
			//duration = 0,
			playing = false,
			ready = false;

		f.src = "http://player.vimeo.com/video/"+
				res.match(/.*\/(.*)(\?|$)/)[1]+
				"?api=1";
		this.media_el = f;
		
		this.media = new Froogaloop(f,{
			ready: function(){
				var init_vol = muted?0:vol_latch;
				ready=true;
				if(init_vol!==1){
					this.media.setVolume(init_vol);
					this.v && this.v.callHandlers('volumechange');
				}
				(time_latch!==0) &&	this.media.seekTo(time_latch);
				playing && this.Play();
				//this.media.getDuration(function(val){duration=val;});
			}.bind(this),
			playProgress: function(event){
				if(!this.v) return;
	/*			if(duration !== event.duration){
					duration = event.duration;
					this.v.callHandlers('durationchange');
				}*/
				time_latch = event.seconds;
				this.v.callHandlers('timeupdate');
			}.bind(this),
			seek: function(event){
				if(!this.v) return;
				time_latch = event.seconds;
				this.v.callHandlers('seek');
				this.v.callHandlers('timeupdate');
			}.bind(this),
			play: evt_map.bind(this,'play'),
			pause: evt_map.bind(this,'pause'),
			finish: evt_map.bind(this,'ended')			
		});
		
		Object.defineProperties(this,{
			Play: {
				value: function() {
					if(time_latch < stop){
						playing = true;
						this.ready &&
							this.media.play();
					}
				}
			},		
			Pause: {
				value: function() {
					playing = false;
					this.ready &&
						this.media.pause();
				}
			},
			playing:{get:function(){return playing;}},
			muted:{
				set: function(mute){
					mute = !!mute;
					if(muted !== mute){
						muted = mute;
						this.ready &&
							this.media.setVolume(muted?0:vol_latch);
					}
					return mute;
				},
				get: function(){return muted;},
				enumerable: true
			},			
			volume: { //The volume as a percentage
				set: function(val) {
					val = +val;
					vol_latch = val/100;
					this.ready && this.media.setVolume(vol_latch);
					return val;
				},
				get: function(){return vol_latch*100;},
				enumerable: true
			},
/*			duration: {
				get: function(){return duration;},
				enumerable: true
			},*/
			setCurrentTime: {
				value: function(val) {
					time_latch = +val;
					if(this.ready){this.media.seekTo(time_latch);}
					else{this.aq.time = time_latch;}
					return time_latch;
				}
			},
			getCurrentTime: {value: function(){return time_latch;}},
			ready: {get: function(){return ready;}}
		});
	}
	
	vimClip.prototype = Object.create(host.Clip.prototype,{
		Detach: {
			value: function(){
				var v = this.v;
				v.element.removeChild(this.media_el);
				v.removeEventListener('timeupdate',this.auto_pause, false);
				global.removeEventListener('message', this.media.receiveMessage, false);
				this.events = this.v = v.clip = null;
			}
		},
		Attach: {
			value: function(v){
				v.DetachClip();
				this.v = v;
				this.events = v.events;
				v.clip = this;
				v.addEventListener('timeupdate',this.auto_pause, false);
				global.addEventListener('message', this.media.receiveMessage, false);
				v.element.appendChild(this.media_el);
			}
		}
	});
	
	var Froogaloop = (function(){
		function filterMessages(domain,match,ready_cb,event){
			var data, method;
			if (event.origin != domain) {return false;}
			try{data = JSON.parse(event.data);
				method = data.event || data.method;
			}catch(e){}
			return (!!(method === 'ready') === !!match) && ready_cb(data, method);
		}
	
		function Froogaloop(iframe,evt_cbs) {
			if(!(this instanceof Froogaloop)) return new Froogaloop(iframe);
			if(!evt_cbs){evt_cbs = {};}
			var playerDomain = getDomainFromUrl(iframe.getAttribute('src')),
				ready_cb = evt_cbs.ready || function(){},
				eventCallbacks = evt_cbs,
				origin;
			delete eventCallbacks.ready;
			this.element = iframe;
			this.eventCallbacks = eventCallbacks;
			this.targetOrigin = origin = iframe.src.split('?')[0];
			this.receiveMessage = filterMessages.bind(null,playerDomain,false,
				function(data, method) {
					var callback = eventCallbacks[method],
						params;
					if (!callback) {return false;}
					params=[];
					(typeof data.value !== 'undefined') && params.push(data.value);
					data.data && params.push(data.data);
					return callback.apply(null, params);
				}
			);
			var readyWatcher = filterMessages.bind(null,playerDomain,true,
				function(data, method){
					var ename;
					global.removeEventListener('message', readyWatcher);
					for(ename in eventCallbacks){
						iframe.contentWindow.postMessage(
							JSON.stringify({
								method: 'addEventListener',
								value: ename
							}), origin
						);
					}
					return ready_cb();
				}.bind(this)
			);
			global.addEventListener('message', readyWatcher);
		}
		Froogaloop.prototype = {
			play:		function(){api_set.call(this,'play',null);},
			pause:		function(){api_set.call(this,'pause',null);},
			seekTo:		function(val){api_set.call(this,'seekTo',+val);},
			setVolume:	function(val){api_set.call(this,'paused',+val);},
			
			paused:			function(cb){api_get.call(this,'paused',cb);},
			getCurrentTime:	function(cb){api_get.call(this,'getCurrentTime',cb);},
//			getDuration:	function(cb){api_get.call(this,'getDuration',cb);},
			getVolume:		function(cb){api_get.call(this,'getVolume',cb);},
			
			addEvent: function(eventName, callback) {
				if (!this.element) {return false;}
				this.eventCallbacks[eventName] = callback;
				postMessage.call(this, 'addEventListener', eventName);
			},
			removeEvent: function(eventName) {
				if (!this.element) {return false;}
				removeCallback.call(this,eventName) &&
					postMessage.call(this, 'removeEventListener', eventName);
			}
		};
		
		function api_set(method, val) {
			if (!this.element || !method) {throw "Invalid API Access";}
			postMessage.call(this, method, val);
		}
		function api_get(method, cb) {
			if (!this.element || !method) {throw "Invalid API Access";}
			eventCallbacks[method] = cb;
			postMessage.call(this, method, null);
		}
		function postMessage(method, params){
			this.element.contentWindow.postMessage(
				JSON.stringify({
					method: method,
					value: params
				}), this.targetOrigin
			);
		}
		
		function removeCallback(eventName) {
			if (!this.eventCallbacks[eventName]) {return false;}
			delete this.eventCallbacks[eventName];
			return true;
		}
		
		function getDomainFromUrl(url) {
			var url_pieces = url.split('/'),
				domain_str = '';
			for(var i = 0, length = url_pieces.length; i < length; i++) {
				if(i<3) {domain_str += url_pieces[i];}
				else {break;}
				if(i<2) {domain_str += '/';}
			}
			return domain_str;
		}
		
		return Froogaloop;
	})();

	callback(function(res,start,stop){
		return /vimeo\.com/.test(res) && postMessage && (new vimClip(res,start,stop));
	});
};