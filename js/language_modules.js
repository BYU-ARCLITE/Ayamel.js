var Languages = (function(){
	//closure scope stuff goes here
	function overwrite_exec(i,j){
		return function exec(s){
			var result, res = RegExp.prototype.exec.call(this,s);
			if(!res){return res;}
			result = [res[j],res[i]]
			result.input = s;
			result.index = res.index;
			return result;
		};
	}
	
	function parse_no_spaces(lang,word){
		var lastIndex=0,
			tag_word=word+'\\@',
			wlen=tag_word.length;
		return {
			test:function(s){
				return s.indexOf(tag_word)>=0;
			},
			exec:function(s){
				var result, index = s.indexOf(tag_word,lastIndex);
				if(index>=0){
					lastIndex = index+wlen;
					result = [word,word];
					result.input = s;
					result.index = index-1;
					return result;
				}
				return null;
			},
			lang: lang,
			get lastIndex(){return lastIndex;},
			set lastIndex(i){lastIndex=i;}
		};
	}

	var _default = (function(){
		var latin_non_word = "\\s~`'\";:.,/?><[\\]{}\\\\|)(*&^%$#@!=\\-—",
			rf = "(?:^|["+latin_non_word+"])(",
			rl = ")(?=$|["+latin_non_word+"])",
			exec = overwrite_exec(1,1);
		return function(lang,word){
			var regex = RegExp(rf+word.replace(/[\-\/\\?.*\^$\[{()|+]/g,"\\$&")+rl,'gim');
			regex.exec = exec;
			regex.lang = lang;
			return regex;
		};
	}());
	
	var langs = {
		"af":{name:"Afrikaans"},
		"sq":{name:"Albanian"},
		"ar":{name:"Arabic",
			dir:'rtl',
			parser:(function(){
				//ARABIC FULL STOP - U+06D4 ARABIC QUESTION MARK - U+061F ARABIC COMMA - U+060C ARABIC SEMICOLON - U+061B ARABIC DECIMAL SEPARATOR - U+066B
				var arpunctuation = "\\s\\u06D4\\u061F\\u060C\\u061B\\u066B\\u061E!.",
					arletters = "\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF",
					arprefixes = "\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF",
					rf = "(?:^|[^"+arletters+"])(["+arprefixes+"]?(",
					rl = "))(?=$|["+arpunctuation+"]|[^"+arletters+"])",
					exec = overwrite_exec(2,1);
				
				return function(word){
					var regex = RegExp(rf+word.replace(/[\-\/\\?.*\^$\[{()|+]/g,"\\$&")+rl,'gim');
					regex.exec = exec;
					regex.lang = 'ar';
					return regex;
				};
			}())
		},
		"hy":{name:"Armenian ALPHA"},
		"az":{name:"Azerbaijani ALPHA"},
		"eu":{name:"Basque ALPHA"},
		"be":{name:"Belarusian"},
		"bg":{name:"Bulgarian"},
		"ca":{name:"Catalan"},
		"zh":{name:"Chinese",
			parser:parse_no_spaces.bind(null,'zh')
		},
		"hr":{name:"Croatian"},
		"cs":{name:"Czech"},
		"da":{name:"Danish"},
		"nl":{name:"Dutch"},
		"en":{name:"English"},
		"et":{name:"Estonian"},
		"tl":{name:"Filipino"},
		"fi":{name:"Finnish"},
		"fr":{name:"French"},
		"gl":{name:"Galician"},
		"ka":{name:"Georgian ALPHA"},
		"de":{name:"German"},
		"el":{name:"Greek"},
		"ht":{name:"Haitian Creole ALPHA"},
		"iw":{name:"Hebrew"},
		"hi":{name:"Hindi"},
		"hu":{name:"Hungarian"},
		"is":{name:"Icelandic"},
		"id":{name:"Indonesian"},
		"ga":{name:"Irish"},
		"it":{name:"Italian"},
		"ja":{name:"Japanese",
			parser:parse_no_spaces.bind(null,'ja')
		},
		"ko":{name:"Korean"},
		"lv":{name:"Latvian"},
		"lt":{name:"Lithuanian"},
		"mk":{name:"Macedonian"},
		"ms":{name:"Malay"},
		"mt":{name:"Maltese"},
		"no":{name:"Norwegian"},
		"fa":{name:"Persian"},
		"pl":{name:"Polish"},
		"pt":{name:"Portuguese"},
		"ro":{name:"Romanian"},
		"ru":{name:"Russian"},
		"sr":{name:"Serbian"},
		"sk":{name:"Slovak"},
		"sl":{name:"Slovenian"},
		"es":{name:"Spanish"},
		"sw":{name:"Swahili"},
		"sv":{name:"Swedish"},
		"th":{name:"Thai"},
		"tr":{name:"Turkish"},
		"uk":{name:"Ukrainian"},
		"ur":{name:"Urdu ALPHA"},
		"vi":{name:"Vietnamese"},
		"cy":{name:"Welsh"},
		"yi":{name:"Yiddish"}
	};
	
	Object.keys(langs).forEach(function(lang){
		if(!langs[lang].parser){
			langs[lang].parser = _default.bind(null,lang);
		}
	});
	
	return langs;
}());