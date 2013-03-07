var TextMenu = (function(){
	"use strict";
	var getSelection = (window.getSelection || document.getSelection || document.selection.createRange),
		activeMenu = null;
		
	function TextMenu(menu,filter){
		var element, selection;
			
		this.displayed = false;
		this.filter = (typeof filter === 'function')?filter:function(s){return s;};
		
		if(menu instanceof HTMLElement){
			element = menu;
			Object.defineProperty(this,'selection',{
				get: function(){return selection;},
				set: function(s){return selection = s;}
			});
		}else if(menu && (menu.element instanceof HTMLElement)){
			element = menu.element;
			Object.defineProperty(this,'selection',{
				get: function(){return menu.selection;},
				set: function(s){return menu.selection = s;}
			});
		}else{ throw new Error("Menu Not Displayable"); }
		
		element.parentNode && element.parentNode.removeChild(element);
		element.addEventListener("mouseup",function(e){e.stopPropagation();},false);
		element.style.position = "absolute";
		this.open = function(x,y,s){
			element.style.top = y+"px";
			element.style.left = x+"px";
			this.selection = s;
			(Ayamel.FSElement||document.body).appendChild(element);
		};
		this.close = function(){
			if(activeMenu === this){
				element.parentNode && element.parentNode.removeChild(element);
				activeMenu = null;
			}
		};
		Object.freeze(this);
	}
	
	function textMouseup(e){
		var st = this.filter(getSelection());
		activeMenu && activeMenu.close();
		if(!st.isCollapsed){
			if(e.target.contains(st.focusNode)){
				this.open(
						document.body.scrollLeft+e.clientX,
						document.body.scrollTop+e.clientY,
						st
					);
				activeMenu = this;
			}
		}else{activeMenu = null;}
		e.stopPropagation();
		e.preventDefault();
	}

	TextMenu.prototype.bindToElement = function(el){
		el.addEventListener("mouseup",textMouseup.bind(this),false);
	};
	
	return TextMenu;
}());