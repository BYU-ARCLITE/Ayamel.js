var loadCSS = (function(){
	var map = {};
	return function(url){
		if(url in map){ return; }
		var header = document.getElementsByTagName("head")[0],
			tag = document.createElement("link");
		tag.setAttribute("rel", "stylesheet");
		tag.setAttribute("type", "text/css");
		tag.setAttribute("href", url);
		header.appendChild(tag);
		map[url] = true;
	};
}());

if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP
                                 ? this
                                 : oThis || window,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}