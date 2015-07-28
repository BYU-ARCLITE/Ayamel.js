(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}

	//re-useable span element for parsing HTML strings.
	var pspan = document.createElement('span');

	function anString(matchers,filter,modnode,text,offset){
		var fragment, pos,
			glen = matchers.length;
		if(glen===0){
			return filter(text);
		}else{
			fragment = document.createDocumentFragment();
			pos = 0;
			(function recloop(strlen,index){
				var matcher,matchResult;	//divide working string into 3 parts, accumulate 1&2 into the dom tree
				do{	{						//set working string to part 3 until part 3 is zero-length
						matcher = matchers[index--];	//save stack depth by decreasing index until we find something
						matcher.lastIndex = pos;
					} //this block loops based on the following while() & the enclosing do...while()
					if(index === -1){ break; }
					while(!!(matchResult = matcher.exec(text)) && (matcher.lastIndex<=strlen)){
							if(matchResult.index > 0){ recloop(matchResult.index,index); } //part 1
							fragment.appendChild(modnode(filter(matchResult[0]),matcher.lang,matchResult[1],offset+matchResult.index,matcher.info)); //part 2
							pos = matcher.lastIndex;
					}
				}while(true);
				while(!!(matchResult = matcher.exec(text)) && (matcher.lastIndex<=strlen)){
					if(matchResult.index > 0 && pos <= matchResult.index){
						fragment.appendChild(filter(text.substring(pos,matchResult.index))); //part 1
					}
					fragment.appendChild(modnode(filter(matchResult[0]),matcher.lang,matchResult[1],offset+matchResult.index,matcher.info)); //part 2
					pos = matcher.lastIndex;
				}
				if(pos<strlen){fragment.appendChild(filter(text.substring(pos,strlen)));}
			}(text.length,glen-1));
			return fragment;
		}
	}

	function getmod(config){
		if(typeof config.attach === 'function'){ return config.attach; }
		if(typeof config.handler !== 'function'){ throw new Error("No Annotation Handler Specified"); }
		var handler = config.handler;
		return function(n,lang,str,loc,info){
			var node;
			if(n.nodeType === Node.ELEMENT_NODE){
				node = n;
			}else{
				node = document.createElement('span');
				node.appendChild(n);
			}
			if(info.className){ node.className = info.className; }
			else{
				node.className = (info.classList || config.classList || []).join(' ');
			}
			Object.keys(info.style || config.style || {}).forEach(function(name){
				node.style[name] = info.style[name];
			});
			node.addEventListener('click', handler.bind(null,info.data,lang,str,loc));
			return node;
		};
	}

	//content must be a string
	function anText(config,content){
		var offset = config.index,
			matchers = config.matchers.filter(function(m){ return m.test(content); });
		config.index += content.length;
		return (matchers.length
				?anString(matchers,config.filter,getmod(config),content,offset)
				:config.filter(content));
	}

	//content could be an HTML string, a document, an element, or a text node,
	function anHTML(config,content){
		var matchers, text, root, nodes, n, len,
			filter = config.filter,
			modnode = getmod(config);

		if(content.cloneNode){
			if(content.nodeType === Node.TEXT_NODE){
				text = content.nodeValue;
				root = document.createDocumentFragment();
				root.appendChild(content.cloneNode(true));
			}else{
				//Documents and elements can be root nodes
				//Some jiggering is necessary to get around
				//the lack of innerHTML on doc fragments
				pspan.innerHTML = "";
				pspan.appendChild(content.cloneNode(true));
				text = pspan.innerHTML;
				root = content.cloneNode(true);
			}
		}else{
			text = content;
			pspan.innerHTML = text;
			root = document.createDocumentFragment();
			[].forEach.call(pspan.childNodes,root.appendChild.bind(root));
		}

		matchers = config.matchers.filter(function(m){ return m.test(text); });
		len = matchers.length;
		nodes = [root];
		while(n = nodes.shift()) switch(n.nodeType){
			case Node.DOCUMENT_FRAGMENT_NODE:
			case Node.ELEMENT_NODE:
				Array.prototype.push.apply(nodes,n.childNodes);
				continue;
			case Node.TEXT_NODE:
				n.parentNode.replaceChild(len?anString(matchers,filter,modnode,n.nodeValue,config.index):filter(n.nodeValue),n);
				config.index += n.nodeValue.length;
		}
		return root;
	}

	function Matcher(regex, lang, info){
		Object.defineProperties(this,{
			regex: { value: regex },
			lang: { value: lang },
			info: { value: info },
			lastIndex: {
				get: function(){ return regex.lastIndex; },
				set: function(i){ return regex.lastIndex = i; }
			}
		});
	}

	Matcher.prototype.test = function(s){ return this.regex.test(s); };
	Matcher.prototype.exec = function(s){ return this.regex.exec(s); };

	function getMatchers(setlist,parsers){
		var mlist = [];
		if(!(setlist instanceof Array)){ return mlist; }
		setlist.forEach(function(annset){
			var glosses = annset.glosses;
			if(annset.mode !== "showing"){ return; }
			Object.keys(glosses).forEach(function(lang){
				var lobj = glosses[lang],
					gen_regex = parsers[lang] || parse_default;
				//Validation/sanitization;
				//skip invalid keys rather than breaking on not-perfectly-valid documents
				if((typeof lobj !== 'object') || (lobj instanceof String)){ return; }
				Object.keys(lobj).forEach(function(word){
					var wobj = lobj[word];
					Object.keys(wobj).forEach(function(index){
						mlist.push(new Matcher(gen_regex(word,parseInt(index,10)), lang, wobj[index]));
					});
				});
			});
		});
		return mlist;
	}

	function defaultFilter(s){ return document.createTextNode(s); }

	function Annotator(config, annotations){
		var parsers = config.parsers || Annotator.parsers;
		if(!(annotations instanceof Array)){
			annotations = (config.annotations instanceof Array)
							?config.annotations:[];
		}

		this.element = document.createElement('div');
		this.classList = (config.classList instanceof Array)?config.classList:[];
		this.style = (config.style instanceof Object)?config.style:{};

		this.filter = (typeof config.filter === 'function')?config.filter:defaultFilter;
		this.attach = (typeof config.attach === 'function')?config.attach:null;
		this.handler = (typeof config.handler === 'function')?config.handler:null;
		this.matchers = getMatchers(annotations, parsers);
		this.index = +config.index||0;

		this._refresher = this.refresh.bind(this);

		Object.defineProperties(this,{
			annotations: {
				enumerable: true,
				get: function(){ return annotations; },
				set: function(a){
					var that = this, r = false, o, n;
					if(a instanceof Array){
						this.matchers = getMatchers(a, parsers);
						n = a.filter(function(annset){ return annotations.indexOf(annset) > -1; });
						o = annotations.filter(function(annset){ return a.indexOf(annset) > -1; });
						return annotations = a;
					}else{
						this.matchers = [];
						o = annotations;
						n = [];
						return annotations = n;
					}
					if(n.length === 0 && o.length === 0){ return; }
					n.forEach(function(annset){
						if(annset.mode === "showing"){ r = true; }
						annset.addEventListener('modechange', that._refresher, false);
						that.element.dispatchEvent(new CustomEvent('addannset', { detail: annset }));
					});
					o.forEach(function(annset){
						if(annset.mode === "showing"){ r = true; }
						annset.removeEventListener('modechange', that._refresher, false);
						that.element.dispatchEvent(new CustomEvent('removeannset', { detail: annset }));
					});
					if(r){ this.refresh(); }
				}
			},
			parsers: {
				enumerable: true,
				get: function(){ return parsers; },
				set: function(p){
					if(!(p instanceof Object)){ p = {}; }
					this.matchers = getMatchers(annotations, p);
					return parsers = p;
				}
			}
		});
	}

	Annotator.prototype.HTML = function(content){
		return anHTML(this, content);
	};

	Annotator.prototype.Text = function(content){
		return anText(this, content);
	};

	Annotator.prototype.addSet = function(annset){
		if(this.annotations.indexOf(annset) > -1){ return false; }
		this.annotations.push(annset);
		this.element.dispatchEvent(new CustomEvent('addannset', { detail: annset }));
		if(annset.mode === "showing"){ this.refresh(); }
		annset.addEventListener('modechange', this._refresher, false);
		return true;
	};

	Annotator.prototype.removeSet = function(annset){
		var idx = this.annotations.indexOf(annset);
		if(idx === -1){ return false; }
		this.annotations.splice(idx,1);
		this.element.dispatchEvent(new CustomEvent('removeannset', { detail: annset }));
		if(annset.mode === "showing"){ this.refresh(); }
		annset.removeEventListener('modechange', this._refresher, false);
		return true;
	}

	Annotator.prototype.addEventListener = function(event, cb, capture){
		this.element.addEventListener(event, cb, !!capture);
	};

	Annotator.prototype.removeEventListener = function(event, cb, capture){
		this.element.removeEventListener(event, cb, !!capture);
	}

	Annotator.prototype.refresh = function(){
		this.matchers = getMatchers(this.annotations, this.parsers);
		this.element.dispatchEvent(new CustomEvent('refresh'));
	};

	/****************************************
	 * Language-Specific Word-Breaking Code *
	 ****************************************/

	function overwrite_exec(i,j,k){
		return function exec(s){
			var ret,
				res = RegExp.prototype.exec.call(this,s);
			if(res){
				ret = [res[i],res[j]];
				ret.index = res.index + res[k].length;
				return ret;
			}
			return null;
		};
	}

	var parse_default = (function(){
		var latin_non_word = "\\s~`'\";:.,/?><[\\]{}\\\\|)(*&^%$#@!=\\-—",
			rf = "(^|["+latin_non_word+"])(",
			rl = ")(?=$|["+latin_non_word+"])",
			exec = overwrite_exec(2,2,1);

		return function(word){
			var regex = RegExp(rf+word.replace(/[\-\/\\?.*\^$\[{()|+]/g,"\\$&")+rl,'gim');
			regex.exec = exec;
			return regex;
		};
	}());

	function parse_no_spaces(word){
		var lastIndex=0,
			wlen=word.length;
		return {
			test:function(s){
				return s.indexOf(word)>=0;
			},
			exec:function(s){
				var ret, index = s.indexOf(word,lastIndex);
				if(index>=0){
					lastIndex = index+wlen;
					ret = [word,word];
					ret.index = index;
					return ret;
				}
				return null;
			},
			get lastIndex(){return lastIndex;},
			set lastIndex(i){lastIndex=+i||0;}
		};
	}

	Annotator.parsers = {
		zho: parse_no_spaces,
		jpn: parse_no_spaces,
		ara: (function(){
			//ARABIC FULL STOP - U+06D4 ARABIC QUESTION MARK - U+061F ARABIC COMMA - U+060C ARABIC SEMICOLON - U+061B ARABIC DECIMAL SEPARATOR - U+066B
			var arpunctuation = "\\s\\u06D4\\u061F\\u060C\\u061B\\u066B\\u061E!.",
				arletters = "\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF",
				arprefixes = "\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF",
				rf = "(^|[^"+arletters+"])(["+arprefixes+"]?(",
				rl = "))(?=$|["+arpunctuation+"]|[^"+arletters+"])",
				exec = overwrite_exec(3,2,1);

			return function(word){
				var regex = RegExp(rf+word.replace(/[\-\/\\?.*\^$\[{()|+]/g,"\\$&")+rl,'gim');
				regex.exec = exec;
				return regex;
			};
		}())
	};

	Annotator.AnnSet = function(label, language, glosses){
		var mode = "disabled";
		this.element = document.createElement('div');
		this.label = ""+label;
		this.language = ""+language;
		this.glosses = glosses;
		Object.defineProperties(this, {
			label: {value: ""+label, enumerable: true},
			language: {value: ""+language, enumerable: true},
			glosses: {value: glosses, enumerable: true},
			mode: {
				get: function(){ return mode; },
				set: function(str){
					if(mode === str){ return mode; }
					mode = str;
					this.element.dispatchEvent(new CustomEvent('modechange'));
					return mode;
				},
				enumerable: true
			}
		});
	};

	Annotator.AnnSet.prototype.addEventListener = function(event, cb, capture){
		this.element.addEventListener(event, cb, !!capture);
	};

	Annotator.AnnSet.prototype.removeEventListener = function(event, cb, capture){
		this.element.removeEventListener(event, cb, !!capture);
	}

	Annotator.loadFor = function(resource, config){
		var annotator = new Annotator(config);

		resource.getAnnotations(
			(config.whitelist instanceof Array)?
				function(relation){ return config.whitelist.indexOf(relation.subjectId) > -1; }:
			(config.blacklist instanceof Array)?
				function(relation){ return config.blacklist.indexOf(relation.subjectId) === -1; }:
			null
		).then(function(rlist){
			rlist.map(function(annres){
				return Ayamel.utils.HTTP({url: annres.content.files[0].downloadUri})
				.then(function(manifest){
					return new Ayamel.Annotator.AnnSet(
						annres.title,
						annres.languages.iso639_3[0],
						JSON.parse(manifest)
					);
				}).then(function(annset){ annotator.addSet(annset); });
			});
		});

		return annotator;
	};

	Ayamel.Annotator = Annotator;
}(Ayamel));