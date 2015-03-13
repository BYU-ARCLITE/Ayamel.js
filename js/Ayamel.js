/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:48 AM
 * To change this template use File | Settings | File Templates.
 */
var Ayamel = (function() {
	"use strict";

	var parseElement = document.createElement('div');

	return {
		aspectRatios: {
			standard:           1.33,   // 4:3
			lichtenberg:        1.4142, // √2:1
			classicFilm:        1.5,    // 3:2
			creditCard:         1.6,    // 8:5
			golden:             1.618,  // 16:10
			europeanWidescreen: 1.66,   // 5:3
			hdVideo:            1.77,   // 16:9
			usWidescreen:       1.85,   // 1.85:1
			widescreen:         2.39    // 2.39:1
		},

		// Audio, video, and other players will be registered here
		mediaPlugins: {
			audio: {},
			video: {},
			image: {},
			document: {},
			archive: {},
			collection: {},
			fallbacks: {}
		},

		prioritizedPlugins: {
			audio: [],
			video: [],
			image: [],
			document: [],
			archive: [],
			collection: []
		},

		path: "",

		// Control widget classes will be registered here
		controls: {},

		// Additional classes that will be defined will be contained here
		classes: {},

		// Utility functions & objects will be registered here
		utils: {
			hasTimeline: function(resource){
				//determines if a resource has an inherent timeline, or if it's just static
				//Not very smart- only looks at type, so it can't discriminate collections
				switch(resource.type){
				case 'audio':
				case 'video':
					return true;
				case 'image':
				case 'document':
				default:
					return false;
				}
			},

			findFile: function(resource, filter){
				return resource.content.files.filter(filter)
				.sort(function(a,b){
					if(a.representation === b.representation){
						return	a.quality > b.quality ? -1 :
								a.quality < b.quality ? 1 : 0;
					}
					switch(a.representation){
					case 'original': return -1;
					case 'summary': return 1;
					case 'transcoding':
						return b.representation === 'original' ? 1 : -1;
					default: return 1;
					}
				})[0];
			},

			HTTP: function(args){
				var idx, url = args.url,
					method = args.method || "GET";
				if(!args.cached){
					idx = url.indexOf('?');
					if(idx === -1){ url += "?"; }
					else if(idx !== url.length-1){ url += '&nocache='; }
					url += Date.now().toString(36);
				}
				return new Promise(function(resolve, reject){
					var xhr = new XMLHttpRequest();
					xhr.addEventListener("load", function(){
						if(this.status >= 200 && this.status < 400){
							resolve(this.responseText);
						}else{
							reject(new Error(this.responseText));
						}
					}, false);
					xhr.addEventListener("error", function(){ reject(new Error("Request Failed")); }, false);
					xhr.addEventListener("abort", function(){ reject(new Error("Request Aborted")); }, false);
					xhr.open(method,url,true);
					xhr.send(args.body||null);
				});
			},

			parseHTML: function(text){
				var frag;
				parseElement.innerHTML = text;
				if(parseElement.childNodes.length > 1){
					frag = document.createDocumentFragment();
					[].slice.call(parseElement.childNodes).forEach(frag.appendChild.bind(frag));
					return frag;
				}else{
					return parseElement.firstChild;
				}
			},

			//Checks to see if a language has been set in HTML
			findCurrentLanguage: function (node,def,topclass){
				while(node && node.nodeType !== Node.ELEMENT_NODE){
					node = node.parentNode;
				}
				do {
					if(node.hasAttribute('lang')){
						return node.getAttribute('lang');
					}
					if(topclass && node.classList.contains(topclass)){
						return def;
					}
					node = node.parentNode;
				}while(node !== window.document);
				return def;
			},

			fitAspectRatio: function(element, aspectRatio, maxWidth, maxHeight){
				var pHeight;

				// Probe for maximum extents
				element.style.width = "100%";
				element.style.height = "100%";
				maxWidth = Math.min(element.clientWidth, maxWidth);
				maxHeight = Math.min(element.clientHeight, maxHeight);

				// Figure out proportional heights / widths
				// and assign accordingly
				pHeight = maxWidth / aspectRatio;
				if(pHeight > maxHeight){
					element.style.width = maxHeight * aspectRatio + "px";
					element.style.height = maxHeight + "px";
				}else{
					element.style.width = maxWidth + "px";
					element.style.height = pHeight + "px";
				}
			}
		}
	};
}());