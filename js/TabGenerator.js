(function(Ayamel) {
	"use strict";

	function generateTab(name) {
		var head = renderHead(name);
		var body = renderBody(name);
		var content = renderContent(name);
		body.appendChild(content);
		return {
			title: name,
			head: head,
			body: body,
			content: content,
			select: function() {
				this.head.onclick();
			}
		};
	}

	function renderHead(name) {
        var result = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + name;
        link.innerHTML = name;
        result.appendChild(link);
        return result;
	}

	function renderBody(name) {
		var result = document.createElement('div');
		result.className = 'tab-pane';
		result.id = name;
		return result;
	}

	function renderContent(name) {
		switch(name) {
			case 'Transcript': return renderTranscript();
			break;
			case 'Definitions': return renderDefinitions();
			break;
			case 'Annotations': return renderAnnotations();
			break;
			default: throw 'tabs can only be \
				"Transcript", "Definitions", or \
				"Annotations"'.replace('\n', '');
		}
		
	}

	function renderTranscript() {
		return document.createElement('div');
	}

	function renderDefinitions() {
		return document.createElement('div');
	}

	function renderAnnotations() {
		return document.createElement('div');
	}

	Ayamel.TabGenerator = {
		generateTabs: function(tabNames) {
			var result = [];
		    for(var i = 0; i < tabNames.length; i++) {
		    	var tabName = tabNames[i];
		    	var tab = generateTab(tabName);
		    	result.push(tab);
		    	result[tabName] = tab;
		    }
		    return result;
		}
	}

}(Ayamel))