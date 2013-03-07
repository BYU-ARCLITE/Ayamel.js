if (!window['YT']) {var YT = {};}
if (!YT.Player) {
	(function(){
		var p = document.location.protocol == 'https:' ? 'https:' : 'http:';
		var s = p + '//s.ytimg.com/yt/jsbin/www-playerapi-vflz-EHji.js';
		var a = document.createElement('script');
		a.src = s;
		a.async = true;
		var b = document.getElementsByTagName('script')[0];
		b.parentNode.insertBefore(a, b);
		YT.embed_template = "\u003ciframe width=\"425\" height=\"344\" src=\"\" frameborder=\"0\" allowfullscreen\u003e\u003c\/iframe\u003e";
	})();
}