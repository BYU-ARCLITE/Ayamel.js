(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	function UniformAspectRatio(element,ar){
		var aspect_control = document.createElement('div'),
			aspect_element = document.createElement('div'),
			content = document.createElement('div'),
			self = this;
		
		aspect_control.style.marginTop = ar?(+ar)+"%":"50%";
		aspect_element.className = "aspect_element";
		aspect_element.appendChild(content);
		element.innerHTML = "";
		element.classList.add("aspect_container");
		element.appendChild(aspect_control);
		element.appendChild(aspect_element);
		
		this.element = element;
		this.aspectElement = aspect_element;
		this.contentElement = content;
		
		this.Resize = function(width,height) {
			aspect_control.style.marginTop = (
				typeof height === 'undefined'
				?width
				:(100*height/width))+"%";
		};
		
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
		
	Ayamel.UniformAspectRatio = UniformAspectRatio;
}(Ayamel));