/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 10:00 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel, TimedText) {
	"use strict";

	Ayamel.utils.loadCaptionTrack = function(resource){
		var supportedFiles, file;
		if(!TimedText){ throw new Error("TimedText library not loaded."); }
		if(resource instanceof TextTrack){
			return Promise.resolve(resource);
		}else{
			supportedFiles = resource.content.files.filter(function(file){
				return TimedText.isSupported(file.mime);
			});
			if(supportedFiles.length === 0){
				return Promise.reject(new Error("Unsupported MIME-Type"));
			}
			file = supportedFiles[0];
			return new Promise(function(resolve, reject){
				TextTrack.get({
					kind: (file.attributes && file.attributes.kind) || "subtitles",
					label: resource.title || "Untitled",
					lang: resource.languages.iso639_3[0] || "eng",
					src: file.downloadUri,
					error: reject,
					success: function(track, mime){
						resolve({track: track, mime: mime});
					}
				});
			});
		}
	};

}(window.Ayamel,window.TimedText));