/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:48 AM
 * To change this template use File | Settings | File Templates.
 */
var Ayamel = (function() {
    "use strict";

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
			audio_sequence: {},
			video: {},
			video_sequence: {},
			image: {},
			image_sequence: {},
			text: {},
			text_sequence: {}
		},
		
        prioritizedPlugins: {
			audio: [],
			audio_sequence: [],
			video: [],
			video_sequence: [],
			image: [],
			image_sequence: [],
			text: [],
			text_sequence: []
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
				switch(resource.type){
				case 'audio':
				case 'audio_sequence':
				case 'video':
				case 'video_sequence':
				case 'image_sequence':
					return true;
				case 'image':
				case 'text':
				case 'text_sequence':
				default:
					return false;
				}
			}
		}
    };
}());