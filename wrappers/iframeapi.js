(function () {
    var g = void 0,
        h = null,
        i = !1,
        j, k = this,
        n = function (a) {
            for (var a = a.split("."), b = k, c; c = a.shift();) if (b[c] != h) b = b[c];
            else return h;
            return b
        },
        p = function (a) {
            return "string" == typeof a
        },
        q = "closure_uid_" + Math.floor(2147483648 * Math.random()).toString(36),
        aa = 0,
        ba = function (a, b, c) {
            return a.call.apply(a.bind, arguments)
        },
        ca = function (a, b, c) {
            if (!a) throw Error();
            if (2 < arguments.length) {
                var d = Array.prototype.slice.call(arguments, 2);
                return function () {
                    var c = Array.prototype.slice.call(arguments);
                    Array.prototype.unshift.apply(c, d);
                    return a.apply(b, c)
                }
            }
            return function () {
                return a.apply(b, arguments)
            }
        },
        r = function (a, b, c) {
            r = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? ba : ca;
            return r.apply(h, arguments)
        },
        s = function (a, b) {
            var c = a.split("."),
                d = k;
            !(c[0] in d) && d.execScript && d.execScript("var " + c[0]);
            for (var e; c.length && (e = c.shift());)!c.length && b !== g ? d[e] = b : d = d[e] ? d[e] : d[e] = {}
        },
        t = function (a, b) {
            function c() {}
            c.prototype = b.prototype;
            a.o = b.prototype;
            a.prototype = new c
        };
    Function.prototype.bind = Function.prototype.bind ||
    function (a, b) {
        if (1 < arguments.length) {
            var c = Array.prototype.slice.call(arguments, 1);
            c.unshift(this, a);
            return r.apply(h, c)
        }
        return r(this, a)
    };
    var u = function (a) {
            this.stack = Error().stack || "";
            if (a) this.message = "" + a
        };
    t(u, Error);
    var da = function (a, b) {
            for (var c = 1; c < arguments.length; c++) var d = ("" + arguments[c]).replace(/\$/g, "$$$$"),
                a = a.replace(/\%s/, d);
            return a
        };
    var v = function (a, b) {
            b.unshift(a);
            u.call(this, da.apply(h, b));
            b.shift();
            this.n = a
        };
    t(v, u);
    var w = function (a, b, c) {
            if (!a) {
                var d = Array.prototype.slice.call(arguments, 2),
                    e = "Assertion failed";
                if (b) var e = e + (": " + b),
                    f = d;
                throw new v("" + e, f || []);
            }
        };
    var x = Array.prototype,
        ea = x.indexOf ?
    function (a, b, c) {
        w(a.length != h);
        return x.indexOf.call(a, b, c)
    } : function (a, b, c) {
        c = c == h ? 0 : 0 > c ? Math.max(0, a.length + c) : c;
        if (p(a)) return !p(b) || 1 != b.length ? -1 : a.indexOf(b, c);
        for (; c < a.length; c++) if (c in a && a[c] === b) return c;
        return -1
    }, fa = x.forEach ?
    function (a, b, c) {
        w(a.length != h);
        x.forEach.call(a, b, c)
    } : function (a, b, c) {
        for (var d = a.length, e = p(a) ? a.split("") : a, f = 0; f < d; f++) f in e && b.call(c, e[f], f, a)
    }, ga = function (a, b, c) {
        w(a.length != h);
        return 2 >= arguments.length ? x.slice.call(a, b) : x.slice.call(a, b, c)
    };
    var ha = function (a) {
            var b = y,
                c;
            for (c in b) if (a.call(g, b[c], c, b)) return c
        };
    var z, A, B, C, D = function () {
            return k.navigator ? k.navigator.userAgent : h
        };
    C = B = A = z = i;
    var E;
    if (E = D()) {
        var ia = k.navigator;
        z = 0 == E.indexOf("Opera");
        A = !z && -1 != E.indexOf("MSIE");
        B = !z && -1 != E.indexOf("WebKit");
        C = !z && !B && "Gecko" == ia.product
    }
    var F = A,
        G = C,
        H = B,
        I;
    a: {
        var J = "",
            K;
        if (z && k.opera) var L = k.opera.version,
            J = "function" == typeof L ? L() : L;
        else if (G ? K = /rv\:([^\);]+)(\)|;)/ : F ? K = /MSIE\s+([^\);]+)(\)|;)/ : H && (K = /WebKit\/(\S+)/), K) var M = K.exec(D()),
            J = M ? M[1] : "";
        if (F) {
            var N, O = k.document;
            N = O ? O.documentMode : g;
            if (N > parseFloat(J)) {
                I = "" + N;
                break a
            }
        }
        I = J
    }
    var ja = I,
        P = {},
        Q = function (a) {
            var b;
            if (!(b = P[a])) {
                b = 0;
                for (var c = ("" + ja).replace(/^[\s\xa0]+|[\s\xa0]+$/g, "").split("."), d = ("" + a).replace(/^[\s\xa0]+|[\s\xa0]+$/g, "").split("."), e = Math.max(c.length, d.length), f = 0; 0 == b && f < e; f++) {
                    var o = c[f] || "",
                        pa = d[f] || "",
                        qa = RegExp("(\\d*)(\\D*)", "g"),
                        ra = RegExp("(\\d*)(\\D*)", "g");
                    do {
                        var l = qa.exec(o) || ["", "", ""],
                            m = ra.exec(pa) || ["", "", ""];
                        if (0 == l[0].length && 0 == m[0].length) break;
                        b = ((0 == l[1].length ? 0 : parseInt(l[1], 10)) < (0 == m[1].length ? 0 : parseInt(m[1], 10)) ? -1 : (0 == l[1].length ? 0 : parseInt(l[1], 10)) > (0 == m[1].length ? 0 : parseInt(m[1], 10)) ? 1 : 0) || ((0 == l[2].length) < (0 == m[2].length) ? -1 : (0 == l[2].length) > (0 == m[2].length) ? 1 : 0) || (l[2] < m[2] ? -1 : l[2] > m[2] ? 1 : 0)
                    } while (0 == b)
                }
                b = P[a] = 0 <= b
            }
            return b
        },
        R = {},
        S = function () {
            return R[9] || (R[9] = F && document.documentMode && 9 <= document.documentMode)
        };
    !F || S();
    !G && !F || F && S() || G && Q("1.9.1");
    F && Q("9");
    var ka = function () {};
    var T = function () {
            this.a = [];
            this.c = {}
        };
    t(T, ka);
    T.prototype.h = 1;
    T.prototype.e = 0;
    var la = function (a, b, c) {
            var d = a.c[b];
            d || (d = a.c[b] = []);
            var e = a.h;
            a.a[e] = b;
            a.a[e + 1] = c;
            a.a[e + 2] = g;
            a.h = e + 3;
            d.push(e)
        };
    T.prototype.m = function (a, b) {
        var c = this.c[a];
        if (c) {
            this.e++;
            for (var d = ga(arguments, 1), e = 0, f = c.length; e < f; e++) {
                var o = c[e];
                this.a[o + 1].apply(this.a[o + 2], d)
            }
            this.e--;
            if (this.d && 0 == this.e) for (; c = this.d.pop();) if (0 != this.e) {
                if (!this.d) this.d = [];
                this.d.push(c)
            } else if (d = this.a[c]) {
                if (d = this.c[d]) e = d, d = ea(e, c), 0 <= d && (w(e.length != h), x.splice.call(e, d, 1));
                delete this.a[c];
                delete this.a[c + 1];
                delete this.a[c + 2]
            }
        }
    };
    var ma = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([\\w\\d\\-\\u0100-\\uffff.%]*)(?::([0-9]+))?)?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$");
    s("yt.config_", window.yt && window.yt.config_ || {});
    s("yt.globals_", window.yt && window.yt.globals_ || {});
    s("yt.msgs_", window.yt && window.yt.msgs_ || {});
    s("yt.timeouts_", window.yt && window.yt.timeouts_ || []);
    var na = window.yt && window.yt.intervals_ || [];
    s("yt.intervals_", na);
    eval("/*@cc_on!@*/false");
    var U = n("yt.dom.getNextId_");
    if (!U) {
        U = function () {
            return ++oa
        };
        s("yt.dom.getNextId_", U);
        var oa = 0
    };
    var sa = function (a) {
            if (a = a || n("window.event")) {
                this.type = a.type;
                var b = a.target || a.srcElement;
                if (b && 3 == b.nodeType) b = b.parentNode;
                this.target = b;
                if (b = a.relatedTarget) try {
                    b = b.nodeName && b
                } catch (c) {
                    b = h
                } else if ("mouseover" == this.type) b = a.fromElement;
                else if ("mouseout" == this.type) b = a.toElement;
                this.relatedTarget = b;
                this.data = a.data;
                this.source = a.source;
                this.origin = a.origin;
                this.state = a.state;
                this.clientX = a.clientX !== g ? a.clientX : a.pageX;
                this.clientY = a.clientY !== g ? a.clientY : a.pageY;
                if (a.pageX || a.pageY) this.pageX = a.pageX, this.pageY = a.pageY;
                else if ((a.clientX || a.clientY) && document.body && document.documentElement) this.pageX = a.clientX + document.body.scrollLeft + document.documentElement.scrollLeft, this.pageY = a.clientY + document.body.scrollTop + document.documentElement.scrollTop;
                this.keyCode = a.keyCode ? a.keyCode : a.which;
                this.charCode = a.charCode || ("keypress" == this.type ? this.keyCode : 0);
                if (0 == this.type.indexOf("touch")) this.touches = a.touches, this.changedTouches = a.changedTouches;
                if (0 == this.type.indexOf("gesture")) this.scale = a.scale, this.rotation = a.rotation;
                this.l = a
            }
        };
    j = sa.prototype;
    j.type = "";
    j.target = h;
    j.relatedTarget = h;
    j.currentTarget = h;
    j.data = h;
    j.source = h;
    j.origin = h;
    j.state = h;
    j.keyCode = 0;
    j.charCode = 0;
    j.l = h;
    j.clientX = 0;
    j.clientY = 0;
    j.pageX = 0;
    j.pageY = 0;
    j.touches = h;
    j.changedTouches = h;
    var y = n("yt.events.listeners_") || {};
    s("yt.events.listeners_", y);
    var ta = n("yt.events.counter_") || {
        count: 0
    };
    s("yt.events.counter_", ta);
    var ua = function (a, b) {
            return ha(function (c) {
                return c[0] == a && "message" == c[1] && c[2] == b && c[4] == i
            })
        },
        wa = function () {
            var a = window,
                b = va;
            if (a && (a.addEventListener || a.attachEvent)) {
                var c = ua(a, b);
                if (!c) {
                    var c = ++ta.count + "",
                        d = function (c) {
                            c = new sa(c);
                            c.currentTarget = a;
                            return b.call(a, c)
                        };
                    y[c] = [a, "message", b, d, i];
                    a.addEventListener ? a.addEventListener("message", d, i) : a.attachEvent("onmessage", d)
                }
            }
        };
    var xa = window.YTConfig || {},
        V = {
            width: 640,
            height: 390,
            title: "video player"
        };
    V.host = ("https:" == document.location.protocol ? "https:" : "http:") + "//www.youtube.com";
    V.apiReady = "onYouTubePlayerAPIReady";
    V.videoId = "";
    var ya = {
        "0": "onEnded",
        1: "onPlaying",
        2: "onPaused",
        3: "onBuffering",
        5: "onVideoCued"
    },
        W = h,
        X = function (a, b) {
            return (b ? b : {})[a] || xa[a] || V[a]
        },
        va = function (a) {
            if (a.origin == X("host")) {
                var a = JSON.parse(a.data),
                    b = W[a.id];
                switch (a.event) {
                case "onReady":
                    window.clearInterval(b.g);
                    Y(b, "onReady");
                    break;
                case "onStateChange":
                    var c = a.info.playerState;
                    Z(b, a);
                    Y(b, "onStateChange", c); - 1 != c && Y(b, ya[c]);
                    break;
                case "onPlaybackQualityChange":
                    b.j = a.playbackQuality;
                    Y(b, "onPlaybackQualityChange", b.j);
                    break;
                case "onError":
                    Y(b, "onError", a.error);
                    break;
                case "infoDelivery":
                    Z(b, a);
                    break;
                case "initialDelivery":
                    za(b, a.apiInterface), Z(b, a)
                }
            }
        },
        $ = function (a, b) {
            var c = p(a) ? document.getElementById(a) : a;
            if (c) {
                if ("iframe" != c.tagName.toLowerCase() && (c.innerHTML += n("YT.embed_template"), c = c || document, c = c.querySelectorAll && c.querySelector && (!H || "CSS1Compat" == document.compatMode || Q("528")) ? c.querySelectorAll("IFRAME") : c.getElementsByTagName("IFRAME"), c = c.length ? c[0] : h, c.removeAttribute("width"), c.removeAttribute("height"), c.removeAttribute("src"), c.setAttribute("title", "YouTube " + X("title", b)), b)) {
                    c.height = X("height", b);
                    c.width = X("width", b);
                    var d = X("playerVars", b) || [];
                    d.enablejsapi = 1;
                    window.location.host && (d.origin = window.location.protocol + "//" + window.location.host);
                    var e = [],
                        f;
                    for (f in d) d.hasOwnProperty(f) && e.push(f + "=" + d[f]);
                    c.src = X("host", b) + "/embed/" + X("videoId", b) + "?" + e.join("&")
                }
                this.b = c;
                this.id = this[q] || (this[q] = ++aa);
                this.f = {};
                if (window.JSON && window.postMessage && (this.pubsub = new T, f = this.id, W || (W = {}, wa()), W[f] = this, f = r(this.i, this), f = window.setInterval(f, 250), na.push(f), this.g = f, b)) {
                    f = X("events", b);
                    for (var o in f) f.hasOwnProperty(o) && this.addEventListener(o, f[o])
                }
            }
        };
    j = $.prototype;
    j.k = function () {
        var a = this.b;
        a && a.parentNode && a.parentNode.removeChild(a)
    };
    j.b = h;
    j.id = 0;
    j.g = 0;
    j.pubsub = h;
    j.i = function () {
        this.b && this.b.contentWindow ? this.sendMessage({
            event: "listening"
        }) : window.clearInterval(this.g)
    };
    var Z = function (a, b) {
            var c = b.info || {},
                d;
            for (d in c) a.f[d] = c[d]
        };
    $.prototype.addEventListener = function (a, b) {
        var c = b;
        "string" == typeof b && (c = function () {
            window[b].apply(window, arguments)
        });
        la(this.pubsub, a, c)
    };
    var za = function (a, b) {
            fa(b, function (a) {
                this[a] || (this[a] = 0 == a.search("cue") || 0 == a.search("load") ?
                function () {
                    this.f = {};
                    Aa(this, a, arguments);
                    return this
                } : 0 == a.search("get") || 0 == a.search("is") ?
                function () {
                    var b = this.f,
                        e = 0;
                    0 == a.search("get") ? e = 3 : 0 == a.search("is") && (e = 2);
                    return b[a[e].toLowerCase() + a.substr(e + 1)]
                } : function () {
                    Aa(this, a, arguments);
                    return this
                })
            }, a)
        },
        Y = function (a, b, c) {
            a.pubsub.m(b, {
                target: a,
                data: c
            })
        },
        Aa = function (a, b, c) {
            c = c || [];
            c = Array.prototype.slice.call(c);
            a.sendMessage({
                event: "command",
                func: b,
                args: c
            })
        };
    $.prototype.sendMessage = function (a) {
        a.id = this.id;
        var a = JSON.stringify(a),
            b = this.b.src.match(ma),
            c = b[1],
            d = b[2],
            e = b[3],
            b = b[4],
            f = [];
        c && f.push(c, ":");
        e && (f.push("//"), d && f.push(d, "@"), f.push(e), b && f.push(":", b));
        this.b.contentWindow.postMessage(a, f.join(""))
    };
    $.prototype.setSize = function (a, b) {
        this.b.width = a;
        this.b.height = b;
        return this
    };
    $.prototype.getVideoEmbedCode = function () {
        var a = this.b.cloneNode(i),
            b = this.f.videoData,
            c = X("host");
        a.src = b && b.video_id ? c + "/embed/" + b.video_id : a.src;
        b = document.createElement("div");
        b.appendChild(a);
        return b.innerHTML
    };
    s("YT.PlayerState.ENDED", 0);
    s("YT.PlayerState.PLAYING", 1);
    s("YT.PlayerState.PAUSED", 2);
    s("YT.PlayerState.BUFFERING", 3);
    s("YT.PlayerState.CUED", 5);
    s("YT.Player", $);
    $.prototype.destroy = $.prototype.k;
    $.prototype.setSize = $.prototype.setSize;
    $.prototype.getVideoEmbedCode = $.prototype.getVideoEmbedCode;
    $.prototype.addEventListener = $.prototype.addEventListener;
    var Ba = n(X("apiReady"));
    Ba && Ba();
})();