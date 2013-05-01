/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 10:00 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {
    "use strict";

    var supportedTypes = [
        "text/vtt",
        "text/plain"
    ];

    Ayamel.CaptionTrackLoader = {
        load: function (resource, callback) {
            if (resource instanceof TextTrack) {
                callback(resource);
            } else {
                resource.content.files.forEach(function (file) {
                    if (supportedTypes.indexOf(file.mime) >= 0) {
                        TextTrack.get({
                            kind: "subtitles",
                            label: resource.title || "Unnamed",
                            lang: resource.language || "en",
                            url: file.downloadUri,
                            success: function(){
                                callback(this);
                            }
                        });
                    }
                });
            }
        }
    };

}(Ayamel));