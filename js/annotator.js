(function(Ayamel){
    "use strict";

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

	function gen_mod(attach,handler){
		if(typeof attach === 'function'){ return attach; }
		if(typeof handler !== 'function'){ throw new Error("No Annotation Handler Specified"); }
		return function(n,lang,str,loc){
			var node,
				word = attach[lang][str]||attach[lang][str.toLowerCase()],
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
			node.addEventListener('click', handler.bind(null,info.data,lang,str,loc));
			return node;
		};
	}

	function anText(config,content){
		fixConfig(config);
		var offset = config.index,
			modnode = gen_mod(config.attach,config.handler),
			matchers = config.regexes.filter(function(matcher){ return matcher.test(content); });
		config.index += content.length;
		return (matchers.length
				?anString(matchers,config.filter,modnode,content,offset)
				:config.filter(document.createTextNode(content)));
	}

	function anHTML(config,content){
		fixConfig(config);
		var matchers, text, root, nodes, n, len,
			filter = config.filter,
			modnode = gen_mod(config.attach,config.handler);

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

	function getMatchers(glosses,languages){
		var mlist = [];
		Object.keys(glosses).forEach(function(lang){
			try{
				var lobj = glosses[lang],
					match_gen = languages[lang].parser;
				Object.keys(lobj).forEach(function(word){
					Object.keys(lobj[word]).forEach(function(index){
						mlist.push(match_gen(word,parseInt(index,10)));
					});
				});
			}catch(e){console.log("No parser for ",lang);}
		});
		return mlist;
	}

	Ayamel.utils.Annotator = Object.create({},{
        HTML: { enumerable: true, value: anHTML },
        Text:{ enumerable: true, value: anText },
        getMatchers: { enumerable: true, value: getMatchers }
    });
}(Ayamel));