/**
 * Created with IntelliJ IDEA.
 * User: josh
 * Date: 7/15/13
 * Time: 4:53 PM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
	"use strict";

	Ayamel.utils.CaptionsTranversal = {

		// Find the cue which most recently ended and move to its beginning
		back: function(track, currentTime){
			var i, cue, cueTime,
				startTime = 0, endTime = 0,
				cues = track.cues;
			for(i = 0; cue = cues[i]; i++){
				cueTime = cue.endTime;
				//if we knew that cues were always sorted, we could break early
				if(cueTime < currentTime && cueTime > endTime){
					endTime = cueTime;
					startTime = cue.startTime;
				}
			}
			return startTime;
		},

		// Find the cue which is closest to being played and move to its beginning
		forward: function(track, currentTime){
			var i, cue, cueTime,
				startTime = 1/0,
				cues = track.cues;
			for(i = 0; cue = cues[i]; i++){
				cueTime = cue.startTime;
				//if we knew that cues were always sorted, we could break early
				if(cueTime > currentTime && cueTime < startTime){
					startTime = cueTime;
				}
			}
			return isFinite(startTime)?startTime:currentTime;
		}
	};
})(Ayamel);