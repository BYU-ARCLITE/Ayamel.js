(function (Ayamel) {
	"use strict";

	var template =
		'<div class="control button annotations">\
			<div class="icon" title="Annotation Menu"></div>\
			<div class="menu">\
				<div class="menuTipDark"></div>\
				<div class="menuTip"></div>\
				<div class="noOptions">No annotations available.</div>\
			</div>\
		</div>';

	function AnnotationsMenu(args) {
		var element = Ayamel.utils.parseHTML(template),
			menu = element.querySelector(".menu");

		this.element = element;
		args.holder.appendChild(element);
		this.length = 0;

		// Set up clicking to show the menu
		element.addEventListener('click', function(event){
			event.stopPropagation();
			element.classList.toggle("active");
		},false);
		document.addEventListener('click', function(){
			element.classList.remove("active");
		},false);
		menu.addEventListener('click', function(event){
			event.stopPropagation();
		},false);
	}

	AnnotationsMenu.prototype.addSet = function(annset){
		// Create the menu entry
		var that = this, emptyMessage,
			element = this.element,
			item = document.createElement('div');
		item.classList.add("menuEntry");
		item.textContent = annset.label + ' (' + annset.language + ')';
		
		emptyMessage = element.querySelector(".noOptions");
		if(emptyMessage !== null){ emptyMessage.parentNode.removeChild(emptyMessage); }
		
		element.querySelector(".menu").appendChild(item);
		if (annset.mode === "showing") { item.classList.add("active"); }
		this.length++;

		// Set up clicking here because we have the track in scope
		item.addEventListener('click', function(e){
			var active = item.classList.contains("active");
			e.stopPropagation();
			if(that.length === 1){ element.classList.remove("active"); }
			item.classList.toggle("active");
			annset.mode = active?'disabled':'showing';
			element.dispatchEvent(new CustomEvent(
				active?"disableannset":"enableannset",
				{bubbles:true,cancelable:true,detail:{annset:annset}}
			));
		});
	};

	AnnotationsMenu.prototype.rebuild = function(sets){
		var item = document.createElement('div'),
			menu = this.element.querySelector(".menu");
		[].forEach.call(this.element.querySelectorAll(".menu .menuEntry"),
			function(el){ el.parentNode.removeChild(el); }
		);
		if(!sets){
			item.classList.add("noOptions");
			item.textContent = "No Annotations Available.";
			menu.appendChild(item);
		}else{
			sets.forEach(this.addSet,this);
		}
	};

	Ayamel.controls.annotations = AnnotationsMenu;
}(Ayamel));