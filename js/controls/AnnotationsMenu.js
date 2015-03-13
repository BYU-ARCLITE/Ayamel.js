(function (Ayamel) {
	"use strict";

	var template =
		'<div class="control button annotations">\
			<div class="icon" title="Annotation Menu"></div>\
			<div class="menu">\
				<div class="menuTipDark"></div>\
				<div class="menuTip"></div>\
			</div>\
		</div>';

	function buildMenu(element, annsets){
		var item, menu = element.querySelector('.menu');
		if(annsets.length === 0){
			item = document.createElement('div');
			item.classList.add("noOptions");
			item.textContent = "No Captions Available.";
			menu.appendChild(item);
		}else{
			annsets.forEach(function(annset){
				var item = document.createElement('div');
				if(annset.mode === "showing"){ item.classList.add("active"); }
				item.classList.add("menuEntry");
				item.textContent = annset.label + ' (' + annset.language + ')';
				item.addEventListener('click', function(e){
					var active = item.classList.contains("active");
					item.classList.toggle("active");
					annset.mode = active?'disabled':'showing';
					element.dispatchEvent(new CustomEvent(
						active?"disableannset":"enableannset",
						{bubbles:true,cancelable:true,detail:{annset:annset}}
					));
				});
				menu.appendChild(item);
			});
		}
		element.classList.add("active");
	};

	function hideMenu(element){
		element.classList.remove("active");
		[].forEach.call(element.querySelectorAll(".menu .menuEntry, .noOptions"),
			function(el){ el.parentNode.removeChild(el); }
		);
	}

	function AnnotationsMenu(args) {
		var that = this,
			element = Ayamel.utils.parseHTML(template);

		this.element = element;
		args.holder.appendChild(element);
		this.annsets = [];

		// Set up clicking to show the menu
		element.addEventListener('click', function(event){
			if(element.classList.contains("active")){
				hideMenu(element);
			}else{
				buildMenu(element, that.annsets);
			}
		},false);
		document.addEventListener('click', function(event){
			if(event.target === element || element.contains(event.target)){ return; }
			hideMenu(element);
		},false);
		element.querySelector(".menu").addEventListener('click', function(event){
			event.stopPropagation();
		},false);

		args.player.addEventListener('addannset',function(e){
			that.addSet(e.detail.annset);
		},false);
	}

	function refresh(element, annsets){
		if(!element.classList.contains("active")){ return; }
		hideMenu(element);
		buildMenu(element, annsets);
	}

	AnnotationsMenu.prototype.addSet = function(annset){
		if(this.annsets.indexOf(annset) > -1){ return; }
		this.annsets.push(annset);
		refresh(this.element, this.annsets);
	};

	AnnotationsMenu.prototype.removeSet = function(annset){
		var idx = this.annsets.indexOf(annset);
		if(idx === -1){ return; }
		this.annsets.splice(idx,1);
		refresh(this.element, this.annsets);
	};

	AnnotationsMenu.prototype.rebuild = function(annsets){
		this.annsets = annsets.slice();
		refresh(this.element, annsets);
	};

	Ayamel.controls.annotations = AnnotationsMenu;
}(Ayamel));