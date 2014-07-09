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
				var regex,regResult;	//divide working string into 3 parts, accumulate 1&2 into the dom tree
				do{	{					//set working string to part 3 until part 3 is zero-length
						regex = matchers[index--];	//save stack depth by decreasing index until we find something
						regex.lastIndex = pos;
					} //this block loops based on the following while() & the enclosing do...while()
					if(index === -1){ break; }
					while(!!(regResult = regex.exec(text)) && (regex.lastIndex<=strlen)){
							recloop(regResult.index+1,index); //part 1
							fragment.appendChild(modnode(filter(regResult[0]),regex.lang,regResult[1],offset+regResult.index+1)); //part 2
							pos = regex.lastIndex;
					}
				}while(true);
				while(!!(regResult = regex.exec(text)) && (regex.lastIndex<=strlen)){
					if(regResult.index > 0 && pos <= regResult.index){
						fragment.appendChild(filter(text.substring(pos,regResult.index+1)));	//part 1
					}
					fragment.appendChild(modnode(filter(regResult[0]),regex.lang,regResult[1],offset+regResult.index+1));	//part 2
					pos = regex.lastIndex;
				}
				if(pos<strlen){fragment.appendChild(filter(text.substring(pos,strlen)));}
			}(text.length,glen-1));
			return fragment;
		}
	}

	function defaultFilter(s){ return document.createTextNode(s); }
	function identity(n){ return n; }

	function fixConfig(config){
		if(typeof config.index !== 'number'){config.index=0;}
		if(typeof config.filter !== 'function'){config.filter = defaultFilter;}
		if(typeof config.attach !== 'function' && typeof config.attach !== 'object'){config.attach = identity;}
		if(config.regexes instanceof Array){
			config.regexes = config.regexes.map(function(matcher){
				var flags = "g";
				if((matcher instanceof RegExp) && !matcher.global){
					if(matcher.multiline){ flags+="m"; }
					if(matcher.ignoreCase){ flags+="i"; }
					return new RegExp(matcher.source,flags);
				}
				return matcher;
			});
		}else{
			config.regexes = [];
		}
	}

	function gen_mod(config){
		if(typeof config.attach === 'function'){ return config.attach; }
		if(typeof config.handler !== 'function'){ throw new Error("No Annotation Handler Specified"); }
		var handler = config.handler,
			anns = config.annotations;
		return function(n,lang,str,loc){
			var node,
				word = anns[lang][str]||anns[lang][str.toLowerCase()],
				info = word[loc]||word.global;
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
			modnode = gen_mod(config),
			matchers = config.regexes.filter(function(matcher){ return matcher.test(content); });
		config.index += content.length;
		return (matchers.length
				?anString(matchers,config.filter,modnode,content,offset)
				:config.filter(document.createTextNode(content)));
	}

	function anHTML(config,content){
		var matchers, text, root, nodes, n, len,
			filter = config.filter,
			modnode = gen_mod(config);

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

		matchers = config.regexes.filter(function(matcher){ return matcher.test(text); });
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

	function getMatchers(glosses,parsers){
		var mlist = [];
		Object.keys(glosses).forEach(function(lang){
			var lobj = glosses[lang],
				match_gen = parsers[lang] || parse_default;
			Object.keys(lobj).forEach(function(word){
				Object.keys(lobj[word]).forEach(function(index){
					mlist.push(match_gen(word,parseInt(index,10)));
				});
			});
		});
		return mlist;
	}

	function Annotator(config, annotations){
		var regexes, parsers = config.parsers || {};
		this.filter = (typeof config.filter === 'function')?config.filter:defaultFilter;
		this.attach = (typeof config.attach === 'function')?config.attach:null;
		this.handler = (typeof config.handler === 'function')?config.handler:null;
		this.index = +config.index||0;
		Object.defineProperties(this,{
			annotations: {
				enumerable: true,
				get: function(){ return annotations; },
				set: function(a){
					regexes = getMatchers(a, parsers);
					return annotations = a;
				}
			},
			parsers: {
				enumerable: true,
				get: function(){ return parsers; },
				set: function(p){
					regexes = getMatchers(annotations, p);
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

	Annotator.HTML = function(config, content){
		fixConfig(config);
		return anHTML(config, content);
	};

	Annotator.Text = function(config, content){
		fixConfig(config);
		return anText(config, content);
	};

	Annotator.getMatchers = getMatchers;

	Ayamel.Annotator = Annotator;
}(Ayamel));