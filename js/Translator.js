(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}

	function Translator(args){
		args = args || {};
		this.e = document.createElement("div");
		this.endpoint = args.endpoint || Translator.endpoint;
		this.key = args.key || Translator.key;
		this.targetLang = args.targetLang || "eng";
	}

	Translator.endpoint = "";
	Translator.key = "";

	Translator.prototype.translate = function(params) {
		var that = this,
			text = params.text,
			srcLang = params.srcLang,
			destLang = params.destLang || this.targetLang;

		// Because translation engines look for two-letter codes, make sure that's what we are dealing with
		if(srcLang.length === 3){ srcLang = Ayamel.utils.downgradeLangCode(srcLang); }
		if(destLang.length === 3){ destLang = Ayamel.utils.downgradeLangCode(destLang); }

		// Don't translate if it's empty
		if(!text || typeof text !== 'string'){
			return Promise.reject({
				text: text,
				message: "Empty Text",
				srcLang: Ayamel.utils.upgradeLangCode(srcLang),
				destLang: Ayamel.utils.upgradeLangCode(destLang),
				data: params.data
			});
		}

		this.e.dispatchEvent(new CustomEvent("translate", {
			bubbles: true,
			cancelable: true,
			detail: {
				text: text,
				srcLang: Ayamel.utils.upgradeLangCode(srcLang),
				destLang: Ayamel.utils.upgradeLangCode(destLang),
				data: params.data
			}
		}));

		return new Promise(function(resolve, reject){
			var xhr = new XMLHttpRequest();
			
			function err(msg){
				var data = {
					text: text, message: msg,
					srcLang: Ayamel.utils.upgradeLangCode(srcLang),
					destLang: Ayamel.utils.upgradeLangCode(destLang),
					data: params.data
				};
				that.e.dispatchEvent(new CustomEvent("error",{detail:data, bubbles:true}));
				reject(data);
			}

			xhr.addEventListener('load',function(){
				var resp = JSON.parse(xhr.responseText),
					data = {
						text: text,
						translations: resp.entries,
						engine: resp.source,
						srcLang: Ayamel.utils.upgradeLangCode(srcLang),
						destLang: Ayamel.utils.upgradeLangCode(destLang),
						data: params.data
					};
				if (data.translations === void 0) {  // Make sure we actually received translations
					err("No Data"); 
				} else {
					that.e.dispatchEvent(new CustomEvent("translation", {
						bubbles: true,
						cancelable: true,
						detail: data
					}));
					resolve(data);
				}
			},false);

			xhr.addEventListener('timeout',function(){ err("Timeout"); }, false);
			xhr.addEventListener('abort',function(){ err("Abort"); }, false);

			xhr.addEventListener('error',function(){
				var message;
				try { message = JSON.parse(xhr.responseText).message; }
				finally { err(message || xhr.statusText); }
			}, false);

			xhr.open("POST", that.endpoint+"/lookup", true);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.setRequestHeader("Authorization", that.key);
			xhr.send("srcLang="+encodeURIComponent(srcLang)+
					"&destLang="+encodeURIComponent(destLang)+
					"&word="+encodeURIComponent(text));
		});
	};

	Translator.prototype.addEventListener = function(event, callback, capture) {
		this.e.addEventListener(event, callback, capture);
	};

	Translator.prototype.removeEventListener = function(event, callback, capture) {
		this.e.removeEventListener(event, callback, capture);
	};

	Ayamel.classes.Translator = Translator;
}(Ayamel));