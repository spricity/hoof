var News = {}, bg, WHITE_SPACE = " ", storage = chrome.storage.local;

//the page handle
function setIdel(){
	News._title = document.querySelector("#title"),
	News._note = document.querySelector("#note");
	News._save = document.querySelector("#save");
	News._cancel = document.querySelector("#cancel");
	News._user = document.querySelector("#user");
}

//init news value for page
function setInitNews(){
	var user = chrome.extension.getBackgroundPage().User;
		
	News._user.innerText = user.uname;
}

function setTagFocus(){
	
	News._title.focus();
	
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
	info.title = News._title.value,
	info.note = News._note.value;
	bg.ideaSave(info);
}

document.addEventListener('DOMContentLoaded', function (argument) {
	setIdel();

	setInitNews();

	setTagFocus();

	bindSave();

	bg = chrome.extension.getBackgroundPage().News;
});
