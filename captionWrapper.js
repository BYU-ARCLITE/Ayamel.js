var captionWrapper = (function(){
	var shell = document.createElement('span'),
		bg	= document.createElement('span');
	
	with(shell.style){
		position = "relative";
		width = "auto";
		color = "white";
		fontSize = "20pt";
	}
	with(bg.style){
		position = "absolute";
		top = 0;
		bottom = 0;
		left = 0;
		right = 0;
		border = "1px solid black";
		background = "rgba(0,0,0,.3)";
		opacity = .25;
		pointerEvents = "none";
	}
	
	return function(el){
		var s = shell.cloneNode(false),
			w = shell.cloneNode(false);
		w.appendChild(bg.cloneNode(false));
		w.appendChild(el);
		s.appendChild(w);
		return s;
	}
}());