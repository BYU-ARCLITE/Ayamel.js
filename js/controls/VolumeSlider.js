(function(Ayamel){
	"use strict";

	var template =
		'<div class="control volume">\
			<div class="button mute" title="mute">\
				<div class="menu">\
					<div class="menuTipDark"></div>\
					<div class="menuTip"></div>\
				</div>\
			</div>\
		</div>';

	function buildMenu(element, tracks){
		var item, akey, aitem = null,
			menu = element.querySelector('.menu');
		tracks.forEach(function(value,key){
			var item = document.createElement('div');

			if(value.active){
				item.classList.add("active");
				aitem = item;
				akey = key;
			}
			item.classList.add("menuEntry");
			item.textContent = value.label;

			item.addEventListener('click', function(e){
				var alist, active = !value.active;
				value.active = active;
				if(active){
					if(aitem){
						aitem.classList.remove("active");
						element.dispatchEvent(new CustomEvent(
							"disableaudio",{bubbles:true,detail:akey}
						));
					}else{
						element.dispatchEvent(new CustomEvent("unmute",{bubbles:true}));
					}
					aitem = item;
					akey = key;
					item.classList.add("active");
					element.dispatchEvent(new CustomEvent(
						"enableaudio",{bubbles:true,detail:key}
					));
				}else{
					aitem = null;
					item.classList.remove("active");
					element.dispatchEvent(new CustomEvent(
						"disableaudio",{bubbles:true,detail:key}
					));
					element.dispatchEvent(new CustomEvent("mute",{bubbles:true}));
				}
			});
			menu.appendChild(item);
		});
		element.classList.add("active");
	}

	function hideMenu(element){
		element.classList.remove("active");
		[].forEach.call(element.querySelectorAll(".menu .menuEntry"),
			function(el){ el.parentNode.removeChild(el); }
		);
	}

	function refresh(element, tracks){
		if(!element.classList.contains("active")){ return; }
		hideMenu(element);
		buildMenu(element, tracks);
	}

	function VolumeSlider(args){
		var that = this,
			volume = 1,
			muted = false,
			element = Ayamel.utils.parseHTML(template),
			slider = new Ayamel.controls.slider({
				parent: args.parent,
				holder: element,
				level: 1
			});

		this.element = element;
		args.holder.appendChild(element);
		this.tracks = new Map();

		slider.element.title = "volume";
		slider.addEventListener('levelchange',function(evt){
			volume = Math.min(evt.detail.level,1);
			slider.level = volume;
			element.dispatchEvent(new CustomEvent("volumechange",{bubbles:true,cancelable:true,detail:{volume:volume}}));
		},false);

		// Allow muting
		element.querySelector(".mute").addEventListener('click',function(){
			if(element.classList.contains("active")){
				hideMenu(element);
			}
			if(that.tracks.size > 1){
				buildMenu(element, that.tracks);
			}else if(muted){
				muted = false;
				element.title="mute";
				element.classList.remove("muted");
				element.dispatchEvent(new Event("unmute",{bubbles:true}));
			}else{
				muted = true;
				element.title="unmute";
				element.classList.add("muted");
				element.dispatchEvent(new Event("mute",{bubbles:true}));
			}
		},false);

		document.addEventListener('click', function(event){
			if(event.target === element || element.contains(event.target)){ return; }
			hideMenu(element);
		},false);
		element.querySelector(".menu").addEventListener('click', function(event){
			event.stopPropagation();
		},false);

		args.player.addEventListener('addaudiotrack',function(e){
			that.addTrack(e.detail.track, e.detail.name, e.detail.active);
		},false);

		// Be able to set the muted & volume attributes
		Object.defineProperties(this, {
			muted: {
				enumerable: true,
				get: function(){ return muted; },
				set: function(value){
					muted = !!value;
					element.classList[muted?'add':'remove']("muted");
					return muted;
				}
			},
			volume: {
				enumerable: true,
				get: function(){ return volume; },
				set: function(value){
					volume = +value||0;
					slider.level = volume;
					return volume;
				}
			}
		});

		if(typeof args.parent === 'object'){
			Object.defineProperties(args.parent, {
				muted: {
					enumerable: true,
					set: function (value){
						return that.muted = value;
					},
					get: function(){ return muted; }
				},
				volume: {
					enumerable: true,
					set: function(value){
						return that.volume = value;
					},
					get: function(){ return volume; }
				},
			});
		}
	}

	VolumeSlider.prototype.addTrack = function(key, label, active){
		var value;
		if(active){
			this.tracks.forEach(function(value,ignore){
				value.active = false;
			});
		}
		this.tracks.set(key,{label: label, active: active});
		if(this.tracks.size > 1){
			this.element.title = "Select Audio";
		}
		refresh(this.element, this.tracks);
	};

	VolumeSlider.prototype.removeTrack = function(key){
		this.tracks.delete(key);
		if(this.tracks.size < 2){
			hideMenu(this.element);
			this.element.title = this.muted?"unmute":"mute";
		}else{
			refresh(this.element, this.tracks);
		}
	};

	Ayamel.controls.volume = VolumeSlider;
}(Ayamel));