(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}

	function Translator(endpoint, key){
		this.e = document.createElement("div");
		this.endpoint = endpoint;
		this.key = key;
	}

	Translator.prototype.translate = function(params) {
		var promise, that = this,
			text = params.text,
			srcLang = params.srcLang,
			destLang = params.destLang,
			xhr = new XMLHttpRequest();

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

		promise = new Promise(function(resolve, reject){
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
				if (data.translations === void 0) {  // Make sure we actually recieved translations
					this.dispatchEvent(new Event("error")); 
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

			xhr.addEventListener('error',function(){
				var message;
				try { message = JSON.parse(xhr.responseText).message; }
				finally { err(message || xhr.statusText); }
			}, false);

			function err(msg){
				var data = {
						text: text,
						message: msg,
						srcLang: Ayamel.utils.upgradeLangCode(srcLang),
						destLang: Ayamel.utils.upgradeLangCode(destLang),
						data: params.data
					};
				that.e.dispatchEvent(new CustomEvent("error", {
					bubbles: true,
					cancelable: true,
					detail: data
				}));
				reject(data);
			}
		});

		xhr.open("POST", this.endpoint+"/lookup", true)
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
		xhr.setRequestHeader("Authorization", this.key)
		xhr.send("srcLang="+encodeURIComponent(srcLang)+"&destLang="+encodeURIComponent(destLang)+"&word="+encodeURIComponent(text));

		return promise;
	};

	Translator.prototype.addEventListener = function(event, callback, capture) {
		this.e.addEventListener(event, callback, capture);
	};

	Translator.prototype.removeEventListener = function(event, callback, capture) {
		this.e.removeEventListener(event, callback, capture);
	};

	Ayamel.utils.Translator = Translator;
}(Ayamel));