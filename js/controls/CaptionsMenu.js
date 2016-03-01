(function (Ayamel) {
	"use strict";

	var template =
		'<div class="control button captions">\
			<div class="icon" title="Caption Menu"></div>\
			<div class="menu">\
				<div class="menuTipDark"></div>\
				<div class="menuTip"></div>\
			</div>\
		</div>';

	function resizeMenu(menu, top){
		var width, columns = 0;
		do {
			columns += 1;
			menu.style.webkitColumnCount = columns;
			menu.style.MozColumnCount = columns;
			menu.style.columnCount = columns;
		}while(menu.getBoundingClientRect().top < top);
		width = 200*columns;
		menu.style.width = width + "px";
		menu.style.marginLeft = (-width/2) + "px";
	}

	function buildMenu(playerElement, element, tracks){
		var item, menu = element.querySelector('.menu');

		if(tracks.length === 0){
			item = document.createElement('div');
			item.classList.add("noOptions");
			item.textContent = "No Captions Available.";
			menu.appendChild(item);
		}else{
			tracks.forEach(function(track){
				var item = document.createElement('div');
				if(track.mode === "showing"){ item.classList.add("active"); }
				item.classList.add("menuEntry");
				item.textContent = track.label + ' (' + track.language + ')';
				item.addEventListener('click', function(e){
					var active = item.classList.contains("active");
					item.classList.toggle("active");
					track.mode = active?'disabled':'showing';
					element.dispatchEvent(new CustomEvent(
						active?"disabletrack":"enabletrack",
						{bubbles:true,cancelable:true,detail:{track:track}}
					));
					if(tracks.length === 1){ hideMenu(element); }
				});
				menu.appendChild(item);
			});
		}

		element.classList.add("active");
		resizeMenu(menu, playerElement.getBoundingClientRect().top);
	}

	function hideMenu(element){
		element.classList.remove("active");
		[].forEach.call(element.querySelectorAll(".menu .menuEntry, .noOptions"),
			function(el){ el.parentNode.removeChild(el); }
		);
	}

	function refresh(playerElement, element, tracks){
		if(!element.classList.contains("active")){ return; }
		hideMenu(element);
		buildMenu(playerElement, element, tracks);
	}

	function CaptionsMenu(args) {
		var that = this,
			element = Ayamel.utils.parseHTML(template),
			playerElement = args.player.element;

		this.playerElement = playerElement;
		this.element = element;
		args.holder.appendChild(element);
		this.tracks = [];

		// Set up clicking to show the menu
		element.addEventListener('click', function(event){
			if(element.classList.contains("active")){
				hideMenu(element);
			}else{
				buildMenu(playerElement, element, that.tracks);
			}
		},false);
		document.addEventListener('click', function(event){
			if(event.target === element || element.contains(event.target)){ return; }
			hideMenu(element);
		},false);
		element.querySelector(".menu").addEventListener('click', function(event){
			event.stopPropagation();
		},false);

		args.player.addEventListener('addtexttrack',function(e){
			that.addTrack(e.detail.track);
		},false);

		args.player.addEventListener('removetexttrack',function(e){
			that.removeTrack(e.detail.track);
		},false);
	}

	CaptionsMenu.prototype.addTrack = function(track){
		if(track.kind !== "subtitles" && track.kind !== "captions"){ return; }
		if(this.tracks.indexOf(track) > -1){ return; }
		this.tracks.push(track);
		refresh(this.playerElement, this.element, this.tracks);
	};

	CaptionsMenu.prototype.removeTrack = function(track){
		var idx = this.tracks.indexOf(track);
		if(idx === -1){ return; }
		this.tracks.splice(idx,1);
		refresh(this.playerElement, this.element, this.tracks);
	};

	CaptionsMenu.prototype.rebuild = function(tracks){
		this.tracks = tracks.slice();
		refresh(this.playerElement, this.element, tracks);
	};

	CaptionsMenu.prototype.resize = function(){
		if(!this.element.classList.contains("active")){ return; }
		resizeMenu(
			this.element.querySelector('.menu'),
			this.playerElement.getBoundingClientRect().top
		);
	};

	Ayamel.controls.captions = CaptionsMenu;
}(Ayamel));