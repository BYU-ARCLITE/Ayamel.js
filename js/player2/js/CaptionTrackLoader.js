/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 10:00 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel, TimedText) {
    "use strict";

    Ayamel.utils.loadCaptionTrack = function (resource, callback) {
		if(!TimedText){ throw new Error("TimedText library not loaded."); }
		if (resource instanceof TextTrack) {
			callback(resource);
		} else {
			resource.content.files.forEach(function (file) {
				if (TimedText.isSupported(file.mime)) {
					TextTrack.get({
						kind: (file.attributes && file.attributes.kind) || "subtitles",
						label: resource.title || "Untitled",
						lang: resource.languages[0] || "eng",
						url: file.downloadUri,
						success: callback
					});
				}
			});
		}
	};

}(window.Ayamel,window.TimedText));