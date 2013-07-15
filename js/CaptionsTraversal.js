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
        back: function(track, currentTime) {
            var cue = track.cues
                .filter(function(cue) {return cue.endTime < currentTime}) // Take only those before the given time
                .sort(function (a,b) {return b.endTime - a.endTime})[0]; // Sort by end time with latest being first and take the first one
            return cue.startTime;
        },

        // Find the cue which is closest to being played and move to its beginning
        forward: function(track, currentTime) {
            var cue = track.cues
                .filter(function(cue) {return cue.startTime > currentTime}) // Take only those after the given time
                .sort(function (a,b) {return a.startTime - b.startTime})[0]; // Sort by start time with earliest being first and take the first one
            return cue.startTime;
        }
    };
})(Ayamel);