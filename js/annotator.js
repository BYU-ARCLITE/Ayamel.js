(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}

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
				do{	{					//set working string to part 3 until part 3 is zero-length
						matcher = matchers[index--];	//save stack depth by decreasing index until we find something
						matcher.lastIndex = pos;
					} //this block loops based on the following while() & the enclosing do...while()
					if(index === -1){ break; }
					while(!!(matchResult = matcher.exec(text)) && (matcher.lastIndex<=strlen)){
							recloop(matchResult.index+1,index); //part 1
							fragment.appendChild(modnode(filter(matchResult[0]),matcher.lang,matchResult[1],offset+matchResult.index+1,matcher.info)); //part 2
							pos = matcher.lastIndex;
					}
				}while(true);
				while(!!(matchResult = matcher.exec(text)) && (matcher.lastIndex<=strlen)){
					if(matchResult.index > 0 && pos <= matchResult.index){
						fragment.appendChild(filter(text.substring(pos,matchResult.index+1)));	//part 1
					}
					fragment.appendChild(modnode(filter(matchResult[0]),matcher.lang,matchResult[1],offset+matchResult.index+1,matcher.info));	//part 2
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
			if(info.classList){ node.className = info.classList.join(' '); }
			info.style && Object.keys(info.style).forEach(function(name){
				node.style[name] = info.style[name];
			});
			if(info.className){ node.className = info.className; }
			node.addEventListener('click', handler.bind(null,info.data,lang,str,loc));
			return node;
		};
	}

	function anText(config,content){
		var offset = config.index,
			matchers = config.matchers.filter(function(m){ return m.test(content); });
		config.index += content.length;
		return (matchers.length
				?anString(matchers,config.filter,getmod(config),content,offset)
				:config.filter(document.createTextNode(content)));
	}

	function anHTML(config,content){
		var matchers, text, root, nodes, n, len,
			filter = config.filter,
			modnode = getmod(config);

		if(content.cloneNode){
			root = content.cloneNode(true);
			text = content.textContent || content.nodeValue;
		}else{
			n = document.createElement('span');
			n.innerHTML = content;
			root = document.createDocumentFragment();
			[].forEach.call(n.childNodes,root.appendChild.bind(root));
			text = content;
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

	function overwrite_exec(i,j){
		return function exec(s){
			var ret,
				res = RegExp.prototype.exec.call(this,s);
			if(res){
				ret = [res[i],res[j]];
				ret.index = res.index;
				return ret;
			}
			return null;
		};
	}

	var parse_default = (function(){
		var latin_non_word = "\\s~`'\";:.,/?><[\\]{}\\\\|)(*&^%$#@!=\\-—",
			rf = "(?:^|["+latin_non_word+"])(",
			rl = ")(?=$|["+latin_non_word+"])",
			exec = overwrite_exec(1,1);
		return function(word){
			var regex = RegExp(rf+word.replace(/[\-\/\\?.*\^$\[{()|+]/g,"\\$&")+rl,'gim');
			regex.exec = exec;
			return regex;
		};
	}());

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

	function getMatchers(glosses,parsers){
		var mlist = [];
		Object.keys(glosses).forEach(function(lang){
			var lobj = glosses[lang],
				gen_regex = parsers[lang] || parse_default;
			Object.keys(lobj).forEach(function(word){
				var wobj = lobj[word];
				Object.keys(wobj).forEach(function(index){
					mlist.push(new Matcher(gen_regex(word,parseInt(index,10)), lang, wobj[index]));
				});
			});
		});
		return mlist;
	}

	function defaultFilter(s){ return document.createTextNode(s); }

	function Annotator(config, annotations){
		var parsers = config.parsers || {};
		this.filter = (typeof config.filter === 'function')?config.filter:defaultFilter;
		this.attach = (typeof config.attach === 'function')?config.attach:null;
		this.handler = (typeof config.handler === 'function')?config.handler:null;
		this.matchers = getMatchers(annotations, parsers);
		this.index = +config.index||0;
		Object.defineProperties(this,{
			annotations: {
				enumerable: true,
				get: function(){ return annotations; },
				set: function(a){
					this.matchers = getMatchers(a, parsers);
					return annotations = a;
				}
			},
			parsers: {
				enumerable: true,
				get: function(){ return parsers; },
				set: function(p){
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

	Ayamel.Annotator = Annotator;
}(Ayamel));