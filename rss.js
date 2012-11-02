var News = {}, bg, WHITE_SPACE = " ", storage = chrome.storage.local;

//the page handle
function setIdel(){
	News._url = document.querySelector("#url"),
	News._title = document.querySelector("#title"),
	News._note = document.querySelector("#note");
	News._tag = document.querySelector("#tag");
	News._save = document.querySelector("#save");
	News._cancel = document.querySelector("#cancel");
	News._user = document.querySelector("#user");
	News._suggest = document.querySelector("#suggest");
	News._hot = document.querySelector("#hot");
}

//init news value for page
function setInitNews(){
	News.info = chrome.extension.getBackgroundPage().News;
	var user = chrome.extension.getBackgroundPage().User;
		
	News._url.value = News.info.url;
	News._title.value = News.info.title;
	News._note.value = News.info.note;
	News._user.innerText = user.uname;
	News._tag.value = News.info.tag;
}

var suggest = {
	current : -1,
	length : 0,
	project: null,
	init: function(li_item){
		this.project = li_item;
		this.length = li_item.children.length;
	},
	destroy: function(){
		this.current = -1;
		this.length = 0;
	},
	prev: function(old_value){
		if(this.current == -1){
			this.current = 0;	
		}
		var cur = this.getCurrent();
		if(!cur) return;
		removeClass(cur, 'on');
		var length = this.length - 1;
		if(this.current == 0){
			this.current = length;
		}else{
			this.current--;
		}
		cur = this.getCurrent();
		var val = cur.children[0].dataset.tag;
		News._tag.value = old_value + ' ' + val;
		addClass(cur, 'on');
	},
	next: function(old_value){
		if(this.current == -1){
			this.current = this.length - 1;	
		}
		var cur = this.getCurrent(),
			length = this.length - 1;
		if(!cur) return;
		removeClass(cur, 'on');
		if(this.current == length){
			this.current = 0;
		}else{
			this.current++;
		}
		cur = this.getCurrent();
		var val = cur.children[0].dataset.tag;
		News._tag.value = old_value + ' ' + val;
		addClass(cur, 'on');
	},
	getCurrent: function(){
		return this.get(this.current);
	},
	get: function(i){
		if(i < this.length){
			return this.project.children[i];
		}
	}
}
function setTagFocus(){
	
	News._tag.focus();
	News._tag.addEventListener('keyup', function(e){
		var val = this.value.split(" "),
		key = val.pop(),
		old_value = val.join(" "),
		modifier = e.ctrlKey || e.metaKey;
		if(e.keyCode == 38){
			suggest.prev(old_value);
		}else if(e.keyCode == 40){
			suggest.next(old_value);
		}else if(e.keyCode != 91 && e.keyCode != 68){
			suggest.destroy();
			storage.get('user_tag', function(item){
				bg.parseSearchForTag(key, item.user_tag, function(data){
					var ret = data.result,
						html = '';
					if(ret){
						for(var i in ret){
							html += '<li><a href="#" data-tag="' + ret[i].tag_name + '"">' + ret[i].tag_name + '(' + ret[i].num + ')</a></li>';
						}
						News._suggest.innerHTML = html;
						removeClass(News._suggest, 'hide');
						suggest.init(News._suggest);
					}else{
						addClass(News._suggest, 'hide');
						
					}
				});
			});
		}
	});

	News._suggest.addEventListener("click", function(e){
		e.preventDefault();
		e.stopPropagation();
		var cur = e.target,
			val = News._tag.value.split(" "),
			key = val.pop(),
			old_value = val.join(" ");
		News._tag.value = old_value + ' ' + cur.dataset.tag;
	});

}


function bindSave(){
	News._save.addEventListener('click', function(){
		save();
		setTimeout(function(){
			window.close();
		},500);
	});

	News._cancel.addEventListener('click', function(){
		window.close();
	});

	window.addEventListener("keydown", function(e){
		if(e.keyCode ==13){
			save();
			window.close();
		}else if(e.keyCode == 27){
			window.close();
		}
	});
}

function save(){
	var info = {};
	info.url = News._url.value,
	info.title = News._title.value,
	info.note = News._note.value,
	info.tag = News._tag.value,
	info.hot = News._hot.checked ? 1 : 0,
	info.cb = chrome.extension.getBackgroundPage().News;
	info.cb.save(info);
}

document.addEventListener('DOMContentLoaded', function (argument) {
	setIdel();

	setInitNews();

	setTagFocus();

	bindSave();

	bg = chrome.extension.getBackgroundPage().News;
});


function hasClass(el, cls){
	var whitespace = WHITE_SPACE; 
	return (whitespace + el.className + whitespace).indexOf(whitespace + cls + whitespace) !== -1;
};

function addClass(el, cls){
	
	if(!hasClass(el, cls)){
		el.className = ( el.className + WHITE_SPACE + cls ).trim();
	}
};

function removeClass(el, cls){
	el.className = el.className.replace(new RegExp('(?:^|\\s+)' + cls + '(?:\\s+|$)'), ' ').trim();
};