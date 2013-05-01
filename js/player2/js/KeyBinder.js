/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 11:35 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var keyBindings = {};

    $(window).keypress(function (event) {
        // Get the keycode
        var keycode = null;
        if(window.event) {
            keycode = window.event.keyCode;
        }else if(e) {
            keycode = e.which;
        }

        if (keyBindings[keycode]) {
            keyBindings[keycode].forEach(function (callback) {
                callback();
            });
        }
    });

    Ayamel.KeyBinder = {
        addKeyBinding: function(key, callback) {
            if (keyBindings[key]) {
                keyBindings[key].push(callback);
            } else {
                keyBindings[key] = [callback];
            }
        },
        keyCodes: {
            // Lower-case letters
            a: 97, b: 98, c: 99, d: 100, e: 101, f: 102, g: 103, h: 104, i: 105, j: 106, k: 107, l: 108, m: 109, n: 110,
            o: 111, p: 112, q: 113, r: 114, s: 115, t: 116, u: 117, v: 118, w: 119, x: 120, y: 121, z: 122,

            // Upper-case letters
            A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79,
            P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,

            // Numbers
            0: 48, 1: 49, 2: 50, 3: 51, 4: 52, 5: 53, 6: 54, 7: 55, 8: 56, 9: 57,

            // Punctuation
            "~": 126, "`": 96, "!": 33, "@": 64, "#": 35, "$": 36, "%": 37, "^": 94, "&": 38, "*": 42, "(": 40, ")": 41,
            "-": 45, "_": 95, "=": 61, "+": 43, "[": 91, "{": 123, "]": 93, "}": 125, ";": 59, ":": 58, "'": 39,
            "\"": 34, ",": 44, "<": 60, ".": 46, ">": 62, "/": 47, "?": 63, "\\": 92, "|": 124,

            // Other
            space: 32, " ": 32, enter: 13
        }
    }
}(Ayamel));