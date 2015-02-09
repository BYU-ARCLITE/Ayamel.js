/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 9:18 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {
	"use strict";

	var template =
		'<div class="control button captions">\
			<div class="icon" title="Caption Menu"></div>\
			<div class="menu">\
				<div class="menuTipDark"></div>\
				<div class="menuTip"></div>\
				<div class="noOptions">No captions available.</div>\
			</div>\
		</div>';

	function CaptionsMenu(args) {
		var element = Ayamel.utils.parseHTML(template),
			menu = element.querySelector(".menu");

		this.element = element;
		args.holder.appendChild(element);
		this.length = 0;

		// Set up clicking to show the menu
		element.addEventListener('click', function(event){
			element.classList.toggle("active");
		},false);
		document.addEventListener('click', function(event){
			if(event.target === element || element.contains(event.target)){ return; }
			element.classList.remove("active");
		},false);
		menu.addEventListener('click', function(event){
			event.stopPropagation();
		},false);
	}

	CaptionsMenu.prototype.addTrack = function(track){
		// Create the menu entry
		var that = this, emptyMessage,
			element = this.element,
			item = document.createElement('div');
		item.classList.add("menuEntry");
		item.textContent = track.label + ' (' + track.language + ')';
		
		emptyMessage = element.querySelector(".noOptions");
		if(emptyMessage !== null){ emptyMessage.parentNode.removeChild(emptyMessage); }
		
		element.querySelector(".menu").appendChild(item);
		if (track.mode === "showing") { item.classList.add("active"); }
		this.length++;

		// Set up clicking here because we have the track in scope
		item.addEventListener('click', function(e){
			var active = item.classList.contains("active");
			e.stopPropagation();
			if(that.length === 1){ element.classList.remove("active"); }
			item.classList.toggle("active");
			track.mode = active?'disabled':'showing';
			element.dispatchEvent(new CustomEvent(
				active?"disabletrack":"enabletrack",
				{bubbles:true,cancelable:true,detail:{track:track}}
			));
		});
	};

	CaptionsMenu.prototype.rebuild = function(tracks){
		var item = document.createElement('div'),
			menu = this.element.querySelector(".menu");
		[].forEach.call(this.element.querySelectorAll(".menu .menuEntry"),
			function(el){ el.parentNode.removeChild(el); }
		);
		if(!tracks){
			item.classList.add("noOptions");
			item.textContent = "No Captions Available.";
			menu.appendChild(item);
		}else{
			tracks.forEach(this.addTrack,this);
		}
	};

	Ayamel.controls.captions = CaptionsMenu;
}(Ayamel));