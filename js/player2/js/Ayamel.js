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
        mediaPlugins: {},
        prioritizedPlugins: [],

        path: "/assets/Ayamel.js/js/player2/",

        // Additional classes that will be defined will be contained here
        classes: {}
    };
}());