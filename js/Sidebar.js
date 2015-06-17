(function(Ayamel) {
	"use strict";

	var templateStr = '';

	function Sidebar(args) {
		var that = this,
			tabNames = args.tabs,
            holder = args.holder;

		var tabs = generateTabs(tabNames);
		this.tabs = tabs;

        this.holder = holder;

        console.log(holder);
        console.log(element);

		var element = render(tabs);
        console.log(element);
        this.element = element;

        holder.appendChild(element);
	}

	function generateTabs(tabNames) {
	    var result = {};
	    for(var i = 0; i < tabNames.length; i++) {
	    	var tabName = tabNames[i];
	    	var tabContentStr = '<div class="tab-pane" id="' + name + '"></div>';
	    	result[tabName] = Ayamel.utils.parseHTML(tabContentStr);
	    }
	    return result;
    }

    function render(tabs) {
        var sidebarStr = '<div class="sidebar"></div>';
        var result = Ayamel.utils.parseHTML(sidebarStr);
    	var tabHeads = renderTabHeads(tabs);
        result.appendChild(tabHeads);
        var tabContents = renderTabContents(tabs);
        result.appendChild(tabContents);
        return result;
    }

    function renderTabHeads(tabs) {
        var headsStr = '<ul class="nav nav-tabs" id="videoTabs"></ul>';
        var result = Ayamel.utils.parseHTML(headsStr);
        for(var name in tabs) {
            var tabHeadStr = '<li><a href="#' + name + '">' + name + '</a></li>';
            var tabHead = Ayamel.utils.parseHTML(tabHeadStr);
            result.appendChild(tabHead);
        }
        return result;
    }

    function renderTabContents(tabs) {
    	var contentsStr = '<div class="tab-content"></div>';
    	var result = Ayamel.utils.parseHTML(contentsStr);
    	for(var name in tabs) {
    		var tabContent = tabs[name];
    		result.appendChild(tabContent);
    	}
        return result;
    }

    Ayamel.classes.Sidebar = Sidebar;

}(Ayamel));