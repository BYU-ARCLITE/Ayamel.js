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

		// Don't translate if it's empty
		if(!text || typeof text !== 'string'){
			return Promise.reject({
				text: text,
				message: "Empty Text",
				srcLang: srcLang,
				destLang: destLang,
				data: params.data
			});
		}

		this.e.dispatchEvent(new CustomEvent("translate", {
			bubbles: true,
			cancelable: true,
			detail: {
				text: text,
				srcLang: srcLang,
				destLang: destLang,
				data: params.data
			}
		}));

		return new Promise(function(resolve, reject){
			var xhr = new XMLHttpRequest(),
				data = new FormData();

			xhr.responseType = "json";

			data.append("srcLang",srcLang);
			data.append("dstLang",destLang);
			data.append("text",text);
			data.append("codeFormat","iso639_3");

			function err(msg){
				var data = {
					text: text, message: msg,
					srcLang: srcLang,
					destLang: destLang,
					data: params.data
				};
				that.e.dispatchEvent(new CustomEvent("error",{detail:data, bubbles:true}));
				reject(data);
			}

			xhr.addEventListener('load',function(){
				var resp = xhr.response;
				if (!(resp && resp.success)) {
					err((resp && resp.message) || "No Data"); 
				} else {
					that.e.dispatchEvent(new CustomEvent("translation", {
						bubbles: true,
						cancelable: true,
						detail: resp.result
					}));
					resolve(resp.result);
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
			xhr.setRequestHeader("Authorization", that.key);
			xhr.send(data);
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