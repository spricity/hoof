// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var F2E = {}, port = chrome.extension.connect({ name : 'content' });
var storage = chrome.storage.local;
var tag_bg_img = chrome.extension.getURL("img/tag.png");



window.addEventListener("keydown", function(e) {
// Bind to both command (for Mac) and control (for Win/Linux)
	var modifier = e.ctrlKey || e.metaKey;

	//ctrl + d
	if (modifier && e.keyCode == 68) {
		e.preventDefault();
		e.stopPropagation();
		
		
		// Send message to background page to toggle tab
		port.postMessage({
			action: 'ctrl_d', 
			note: get_description(), 
			title: document.title,
			url: location.href, 
			height: F2E.height, 
			width: F2E.width
		});
		 // chrome.extension.sendRequest();

    // esc
	}else if(e.keyCode == 27){
		F2E.handle.hide();

	// ctrl + b
	}else if(modifier && e.keyCode == 66){

		if(F2E.isLoad){
			if(F2E.handle.css('display') == 'none'){
				F2E.keyword.focus();
				F2E.handle.show();
			}else if(F2E.handle.css('display') == 'block'){
				F2E.handle.hide();
			}
		}else{
			F2E.init();
			F2E.loadData(false);
			F2E.keyword.focus();
		}
	//ctrl + /
	}else if(modifier && e.keyCode == 191){
		port.postMessage({'action': 'ctrl_/', height: F2E.height, width: F2E.width});
	}

}, false);

chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg) {

		if(msg.action == 'onInputChangedPage'){
			F2E.init();
			F2E.setBookMarkHtml(msg.data);
		}else if(msg.action == "onInputChangedUserTag"){
			F2E.init();
			F2E.setTagHtml(msg.data);

		}
	});
});

port.onMessage.addListener(function(msg){
	if(msg.action == 'getTagByUID'){
		F2E.setTagHtml(msg.data);
	}
});


var HTML = '<div id="f2e-wrap">'+
		'<div class="f2e-head">Face Bookmarks</div>'+
		'<div class="f2e-dtxt">'+
			'<input type="text" value="" id="f2e-keyword" class="f2e-txt" placeholder="多标签搜索，请用空格分隔" />'+
		'</div>'+
		'<div class="fwe-body clearfix">'+
			'<div id="f2e-left" class="f2e-content">'+
				'<h1>Tags</h1>'+
				'<ul id="F2E-tag">'+
					
				'</ul>'+
			'</div>'+
			'<div id="f2e-right" class="f2e-content">'+
				'<h1>Bookmarks</h1>'+
				'<ul id="F2E-bookmarks">'+
				'</ul>'+
			'</div>'+
		'</div>'+
		'<div class="f2e-footer">'+
			'Chunchengli on Face'+
		'</div>'+
	'</div>';

//第一次初始化
F2E.init = function(){
	if(!F2E.isLoad){

		//加载HTML到BODY
		jQuery("body").append(HTML);
		F2E.handle = jQuery("#f2e-wrap");
		F2E.bookmarks = jQuery("#F2E-bookmarks");
		F2E.tag = jQuery("#F2E-tag");
		F2E.keyword = jQuery("#f2e-keyword");

		//设置高度
		var height = F2E.height - 90;
		F2E.handle.find("ul").css({
			height: height
		});


		F2E.keyword.bind({
			"keyup": function(e){
				if(e.keyCode = 13){
					var tag = jQuery(this).val();
					F2E.search(tag);
				}
			},
			"blur": function(){
				var tag = jQuery(this).val();
				F2E.search(tag);
			}
			
		});

		//标记已经加载
		F2E.isLoad = true;


		F2E.tag[0].addEventListener('click', function(e){
			var cur = e.target;
			if(cur.dataset.tag){
				F2E.getURLByTag(cur.dataset.tag);
				F2E.tag.find("li").removeClass('f2e-on');
				jQuery(cur).parent('li').addClass('f2e-on');
			}

		});
	}else{
		F2E.handle.show();
	}
};

F2E.search = function(tag){
	if(tag){
		port.postMessage({action: 'search', tag_name: tag});
	}else{
		F2E.loadData(false);
	}
};

F2E.loadData = function(data){
	
	if(data){ //用户搜索的数据
		// F2E.setBookMarkHtml(data);

		// F2e,setBookMarkHtml

	}else{
		// 初始化数据
		storage.get('page', function(item){
			F2E.setBookMarkHtml(item.page);
		});

		storage.get('user_tag', function(item){
			F2E.setTagHtml(item.user_tag);
		});

	}

	
};

F2E.setBookMarkHtml = function(data){
	var bookmarks = "";
	if(data){
		for(var i in data){
			var url = data[i].content || data[i].url,
				title = data[i].description || data[i].title;
			bookmarks += '<li><a href="' + url + '" target="_blank">' + title + '</a></li>';
		}
		F2E.bookmarks.html(bookmarks);
	}else{
		F2E.bookmarks.html(bookmarks);
	}
}

F2E.setTagHtml = function(data){
	var tag = "";
	if(data){
		for(var i in data){
			var title = data[i].tag_name,
				num = data[i].num;
			if(title){
				tag += '<li><a href="javascript:;" style="background-image:url(\''+tag_bg_img+'\')"class="tag" data-tag="' + title + '">' + title + '<em>'+num+'</em></a></li>';
			}
		}
		F2E.tag.html(tag);
	}else{
		F2E.tag.html(tag);
	}

}

F2E.getURLByTag = function(item_tag){
	var ret = [];
	ret.length = 0;
	storage.get('page', function(item){
		if(!item.page) return;
		var page = item.page;

		for(var i in page){
			var cur = page[i],
				tag = cur.tag.split(" ");
			if(in_array(item_tag, tag)){
				ret.push(cur);
			}

		}

		if(ret.length > 0){
			F2E.setBookMarkHtml(ret);
		}
	});
}


function get_description(){
  var desc = '';
  var metas = document.getElementsByTagName('meta');

  for (var x=0,y=metas.length; x<y; x++) {
    if (metas[x].name.toLowerCase() == "description") {
    	desc = metas[x].content;
    }
  }

  return desc;
}


function init(){
	F2E.isLoad = false;
	F2E.height = jQuery(window).height();
	F2E.width = jQuery(window).width();
}



init();


function in_array(value, arr){
	if(typeof arr !== 'object') return false;

	for(var i in arr){
		var cur = arr[i];
		if(value == cur) return true;
	}
	return false;
}