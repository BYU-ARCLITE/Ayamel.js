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
		back: function(tracks, currentTime){
			var lastTime = tracks.reduce(function(p,track){
				var i, cue, cueTime,
					startTime = 0, endTime = 0,
					cues = track.cues;
				for(i = 0; (cue = cues[i]) && cue.startTime < currentTime; i++){
					cueTime = cue.endTime;
					if(cueTime < currentTime && cueTime > endTime){
						endTime = cueTime;
						startTime = cue.startTime;
					}
				}
				return startTime > p ? startTime : p;
			},-1);
			return lastTime === -1?currentTime:lastTime;
		},

		// Find the cue which is closest to being played and move to its beginning
		forward: function(tracks, currentTime){
			var nextTime = tracks.reduce(function(p,track){
				var i, cue, cueTime,
					cues = track.cues;
				for(i = 0; cue = cues[i]; i++){
					cueTime = cue.startTime;
					if(cueTime > currentTime){ return cueTime < p ? cueTime : p; }
				}
				return p;
			},1/0);
			return isFinite(nextTime)?nextTime:currentTime;
		}
	};
})(Ayamel);