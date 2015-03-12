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