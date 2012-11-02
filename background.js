var User = {}, 
	News = {}, 
	One_find = [],
	Search_result = [],
	port,
	storage = chrome.storage.local;


User.login = function(callback){
	if(!User.islogin){
		ajaxGET('http://f2e.dp/face/api/user',{}, function(u){
			if(u.code == 200){

				User.islogin = true;
				User.uid = u.msg.uid;
				User.uname = u.msg.uname;
			}else{
				User.islogin = false;
			}

		});
	}
	
	callback && callback();
}



chrome.omnibox.onInputEntered.addListener(function(text){
	// chrome.tabs.create({
	// 	url: text
	// });
	return false;
});


		 
chrome.omnibox.onInputChanged.addListener(function(text, suggest){

	News.search(text, suggest);
});


chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {

		if(request.type == 'init'){
			User.login(
				function(){
					if(User.islogin){

						News.title = request.title;
						News.note = request.note;
						News.url = request.url;
						var top = request.height / 2 - 115,
							left = request.width / 2 - 350;
						News.get(News.url, function(tag){
							News.tag = tag;
							window.open('rss.html', '_blank', 'width=700,height=330,left=' + left + ',top=' + top);
						});
					}else{
						window.open('http://f2e.dp/face/user/login');
					}
				}
			);
		}
		
	}
);


chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg) {

		if(msg.action == 'search'){
			News.search(msg.tag_name);
		}else if(msg.action == 'ctrl_/'){
			User.login(function(){
				if(User.islogin){
					var top = msg.height / 2 - 150,
					left = msg.width / 2 - 350;
					window.open('idea.html', '_blank', 'width=700,height=300,left=' + left + ',top=' + top);
				}else{
					window.open('http://f2e.dp/face/user/login');
				}
			});

		}else if(msg.action == 'ctrl_d'){
			User.login(
				function(){
					if(User.islogin){

						News.title = msg.title;
						News.note = msg.note;
						News.url = msg.url;
						var top = msg.height / 2 - 125,
							left = msg.width / 2 - 350;
						News.get(News.url, function(tag){
							News.tag = tag;
							window.open('rss.html', '_blank', 'width=700,height=350,left=' + left + ',top=' + top);
						});
					}else{
						window.open('http://f2e.dp/face/user/login');
					}
				}
			);
		}

	});
});


News.save = function(info){
	ajaxGET('http://f2e.dp/face/api/tag', {
		'url': info.url,
		'title': info.title,
		'note': info.note,
		'tag': info.tag,
		'hot': info.hot
	}, function(data){
		News.getPageByUID();
		News.getTagByUID();
	});
};

News.ideaSave = function(info){
	ajaxGET('http://f2e.dp/face/api/idea', {
		'title': info.title,
		'note': info.note
	}, function(data){
	});
};

News.get = function(url, callback){
	ajaxGET('http://f2e.dp/face/api/getTagByURL', { "url" : url}, function(data){
		if(data.code == 200){
			callback && callback(data.msg);
		}else{
			callback && callback('');
		}
	});
};

News.search = function(text, suggest){
	
	News.getSuggest(text, function(ret){
		if(ret.type == 'page'){
			var data = [];
			for(var i in Search_result){
				var cur = Search_result[i],
					url = cur.url,
					desc = cur.description || cur.title;
				data.push({content: url, description : desc});
			}
			data && suggest && suggest(data);
			if(data){
				chrome.tabs.getSelected(null, function(tab){
					port = chrome.tabs.connect(tab.id, {name: 'pipe'});
					port.postMessage({action : 'onInputChangedPage' , data: data });
				});
			}
		}else if(ret.type == 'user_tag'){
			chrome.tabs.getSelected(null, function(tab){
				port = chrome.tabs.connect(tab.id, {name: 'pipe'});
				port.postMessage({action : 'onInputChangedUserTag' , data: ret.result });
			});
		}
	});
}

News.parseSearchForTag = function(tags, usertaginfo, callback){
	var cur_tag = [];
	cur_tag.length = 0;
	if(!tags || !usertaginfo || !callback){
		callback && callback(false);
		return ;
	}

	if(typeof tags == "string"){
		tags = tags.split(" ");
	}

	for(var i in usertaginfo){
		var cur = usertaginfo[i],
			result = false;
		for(var j in tags){
			if(tags[j]){
				if(cur.tag_name.indexOf(tags[j]) >= 0){
					cur_tag.push(cur);
				}
			}
		}
	}

	if(cur_tag.length > 0){
		callback && callback({type: 'user_tag', result: cur_tag});
	}else{
		callback && callback({ type: 'user_tag', result: false});
	}

};

News.parseSearch = function(tags, pageinfo, callback){
	
	Search_result.length = 0;
	One_find.length = 0;
	if(!tags || !pageinfo || !callback){
		callback && callback(false);
		return;
	}
	if(typeof tags == "string"){
		tags = tags.split(" ");
	}
	var
		last_tag = tags.pop(),
		flag = tags.length >= 1 ? true : false;
	for(var i in pageinfo){
		var page = pageinfo[i],
			result = false,
		_page_tag = page.tag.split(" ");
		if(flag){
			for(var j in tags){
				result = in_array(tags[j], _page_tag);

			}
			if(result) One_find.push(page);
		}
		//进行模糊查找
		if(last_tag){
			//前面精确查找成果，在精确查找里继续模糊查找，多于一个关键词
			if(One_find.length){

				for(var k in One_find){
					if(One_find[k].tag.indexOf(last_tag) >= 0){
						Search_result.push(One_find[k]);
					}
				}
			}else{//精确查找不成功，直接进行模糊查找 ,查找源是 pageinfo
				if(flag){ //多余一个词, 全部进行模糊查找
					tags.push(last_tag);
					for(var j in tags){
						if(page.tag.indexOf(tags[j]) >= 0){
							Search_result.push(page);
						}
					}
				}else{//只有一个词
					if(page.tag.indexOf(last_tag) >= 0){
						Search_result.push(page);
					}
				}

			}
		}

	}
	if(Search_result.length>0){
		callback && callback({ type: 'page', result: Search_result});
	}else{
		callback && callback({ type: 'page', result: false});
	}


};

News.getPageFromStorage = function(tag, callback){
	storage.get('page', function(item){
		if(item.page){
			News.parseSearch(tag, item.page, callback);
		}else{
			News.getPageByUID(tag, callback);
		}
	});
};

News.getUserTagFromStorage = function(callback){
	storage.get('user_tag', function(item){
		if(item.user_tag){
			callback && callback(item.user_tag);
		}else{
			News.getTagByUID(callback);
		}
	});
};

News.getTagByUID = function(callback){

	ajaxGET('http://f2e.dp/face/api/getTagByUID', {}, function(data){
		if(data.code == 200){
			storage.set({user_tag: data.msg});
			callback && callback(data.msg);
		}else{
			callback && callback('');
		}
	});
	
};

News.getPageByUID = function(tag, callback){

	ajaxGET('http://f2e.dp/face/api/getPageByUID', {}, function(data){
		if(data.code == 200){
			storage.set({page : data.msg});
			News.parseSearch(tag, data.msg, callback);
		}else{
			News.parseSearch(false, callback);
		}
	});
};

News.getSuggest = function(tag, callback){
	storage.get('page', function(item){
		if(item.page){
			News.parseSearch(tag, item.page, callback);
		}else{
			News.getPageFromStorage(tag, callback);
		}
	});

	storage.get('user_tag', function(item){
		if(item.user_tag){
			News.parseSearchForTag(tag, item.user_tag, callback);
		}else{
			News.getUserTagFromStorage(tag);
		}
	});
};



function init(){
	User.login();
	News.getTagByUID();
	News.getPageByUID();
}

function in_array(value, arr){
	if(typeof arr !== 'object') return false;

	for(var i in arr){
		var cur = arr[i];
		if(value == cur) return true;
	}
	return false;
}


function ajaxGET(url, data, callback){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url + "?" + serialize(data), true);
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			if(xhr.responseText){
				callback && callback(JSON.parse(xhr.responseText));
			}
		}
	};

	xhr.send(data);
}

function serialize(obj){
	var str = "";
  	if(typeof obj == "object"){
    	for(var i in obj){
    		if(i != 'undefined'){
    			var tmp = "&" + i + "=" + obj[i]; 
    			str += tmp;
    		}
    	}

    	return str.slice(1, str.length);
    }else{
     	return obj.toString();
    }
};
 function defined (d) {
 	return typeof d !== 'undefined';
 }

init();