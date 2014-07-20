/*

Copyright (c) 2009 Anant Garg (anantgarg.com | inscripts.com)

This script may be used for non-commercial purposes only. For any
commercial purposes, please contact the author at 
anant.garg@inscripts.com

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

var windowFocus = true;
var username;
var chatHeartbeatCount = 0;
var minChatHeartbeat = 1000;
var maxChatHeartbeat = 33000;
var chatHeartbeatTime = minChatHeartbeat;
var originalTitle;
var blinkOrder = 0;

var chatboxFocus = new Array();
var newMessages = new Array();
var newMessagesWin = new Array();
var chatBoxes = new Array();

$(document).ready(function(){
	originalTitle = document.title;
	startChatSession();

	$([window, document]).blur(function(){
		windowFocus = false;
	}).focus(function(){
		windowFocus = true;
		document.title = originalTitle;
	});
});

function restructureChatBoxes() {
	align = 0;
	for (x in chatBoxes) {
		chatboxtitle = chatBoxes[x];

		if ($("#chatbox_"+chatboxtitle).css('display') != 'none') {
			if (align == 0) {
				$("#chatbox_"+chatboxtitle).css('right', '20px');
			} else {
				width = (align)*(225+7)+20;
				$("#chatbox_"+chatboxtitle).css('right', width+'px');
			}
			align++;
		}
	}
}

function chatWith(chatuser) {
	createChatBox(chatuser);
	$("#chatbox_"+chatuser+" .chatboxtextarea").focus();
}

function createChatBox(chatboxtitle,minimizeChatBox) {
	if ($("#chatbox_"+chatboxtitle).length > 0) {
		if ($("#chatbox_"+chatboxtitle).css('display') == 'none') {
			$("#chatbox_"+chatboxtitle).css('display','block');
			restructureChatBoxes();
		}
		$("#chatbox_"+chatboxtitle+" .chatboxtextarea").focus();
		return;
	}

	$(" <div />" ).attr("id","chatbox_"+chatboxtitle)
	.addClass("chatbox")
	.html('<div class="chatboxhead"><div class="chatboxtitle">'+chatboxtitle+'</div><div class="chatboxoptions"><a href="javascript:void(0)" onclick="javascript:toggleChatBoxGrowth(\''+chatboxtitle+'\')">-</a> &nbsp; <a href="javascript:void(0)" onclick="javascript:closeChatBox(\''+chatboxtitle+'\')"><img src="./css/vgEDZOkFYM22.png" /></a></div><br clear="all"/></div><div class="chatboxcontent"></div><div class="chatboxinput"><textarea class="chatboxtextarea" onkeydown="javascript:return checkChatBoxInputKey(event,this,\''+chatboxtitle+'\');"></textarea></div>')
	.appendTo($( "body" ));
			   
	$("#chatbox_"+chatboxtitle).css('bottom', '0px');
	
	chatBoxeslength = 0;

	for (x in chatBoxes) {
		if ($("#chatbox_"+chatBoxes[x]).css('display') != 'none') {
			chatBoxeslength++;
		}
	}

	if (chatBoxeslength == 0) {
		$("#chatbox_"+chatboxtitle).css('right', '20px');
	} else {
		width = (chatBoxeslength)*(225+7)+20;
		$("#chatbox_"+chatboxtitle).css('right', width+'px');
	}
	
	chatBoxes.push(chatboxtitle);

	if (minimizeChatBox == 1) {
		minimizedChatBoxes = new Array();

		if ($.cookie('chatbox_minimized')) {
			minimizedChatBoxes = $.cookie('chatbox_minimized').split(/\|/);
		}
		minimize = 0;
		for (j=0;j<minimizedChatBoxes.length;j++) {
			if (minimizedChatBoxes[j] == chatboxtitle) {
				minimize = 1;
			}
		}

		if (minimize == 1) {
			$('#chatbox_'+chatboxtitle+' .chatboxcontent').css('display','none');
			$('#chatbox_'+chatboxtitle+' .chatboxinput').css('display','none');
		}
	}

	chatboxFocus[chatboxtitle] = false;

	$("#chatbox_"+chatboxtitle+" .chatboxtextarea").blur(function(){
		chatboxFocus[chatboxtitle] = false;
		$("#chatbox_"+chatboxtitle+" .chatboxtextarea").removeClass('chatboxtextareaselected');
	}).focus(function(){
		chatboxFocus[chatboxtitle] = true;
		newMessages[chatboxtitle] = false;
		$('#chatbox_'+chatboxtitle+' .chatboxhead').removeClass('chatboxblink');
		$("#chatbox_"+chatboxtitle+" .chatboxtextarea").addClass('chatboxtextareaselected');
	});

	$("#chatbox_"+chatboxtitle).click(function() {
		if ($('#chatbox_'+chatboxtitle+' .chatboxcontent').css('display') != 'none') {
			$("#chatbox_"+chatboxtitle+" .chatboxtextarea").focus();
		}
	});

	$("#chatbox_"+chatboxtitle).show();
}


function chatHeartbeat(){

	var itemsfound = 0;
	
	if (windowFocus == false) {
 
		var blinkNumber = 0;
		var titleChanged = 0;
		for (x in newMessagesWin) {
			if (newMessagesWin[x] == true) {
				++blinkNumber;
				if (blinkNumber >= blinkOrder) {
					document.title = 'Nouveau Message de '+x;
					titleChanged = 1;
					break;	
				}
			}
		}
		
		if (titleChanged == 0) {
			document.title = originalTitle;
			blinkOrder = 0;
		} else {
			++blinkOrder;
		}

	} else {
		for (x in newMessagesWin) {
			newMessagesWin[x] = false;
		}
	}

	for (x in newMessages) {
		if (newMessages[x] == true) {
			if (chatboxFocus[x] == false) {
				//FIXME: add toggle all or none policy, otherwise it looks funny
				$('#chatbox_'+x+' .chatboxhead').toggleClass('chatboxblink');
			}
		}
	}
	
	$.ajax({
	  url: "chat.php?action=chatheartbeat",
	  cache: false,
	  dataType: "json",
	  success: function(data) {

		$.each(data.items, function(i,item){
			if (item)	{ // fix strange ie bug

				chatboxtitle = item.f;

				if ($("#chatbox_"+chatboxtitle).length <= 0) {
					createChatBox(chatboxtitle);
				}
				if ($("#chatbox_"+chatboxtitle).css('display') == 'none') {
					$("#chatbox_"+chatboxtitle).css('display','block');
					restructureChatBoxes();
				}
				
				if (item.s == 1) {
					item.f = username;
				}

				if (item.s == 2) {
					$("#chatbox_"+chatboxtitle+" .chatboxcontent").append('<div><div class="_510g _510e seen" data-reactid=".1j"><div class="_510h" data-reactid=".1j.0"></div><span class="_510f" data-reactid=".1j.1">'+item.m+'</span></div></div>');
				} else {
					newMessages[chatboxtitle] = true;
					newMessagesWin[chatboxtitle] = true;
					
					
					if (item.f != chatboxtitle) {
					$("#chatbox_"+chatboxtitle+" .chatboxcontent").append('<div class="_5wd4 _1nc6 direction_ltr _5yt9" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496"><div class="_5wd9" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0"><div class="_5wde" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0"><div class="_5wdf _5w1r" style="max-width:171px;" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0"><div data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0.0"><span class="_5yl5" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0.0.0"><span class="null">'+item.m+'</span></span></div></div></div></div><div class="_3ry4" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1"><div class="_5wda clearfix _2fs6 _2fs2" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0"><div class="_2fs1" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0.0"></div><span data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0.1"></span></div></div></div>');
					} else {
					$("#chatbox_"+chatboxtitle+" .chatboxcontent").append('<div class="_5wd4 _1nc7 direction_ltr _5yt9 _2cnu" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086"><div class="_5wd9" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0"><div class="_5wde" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0.0"><div class="_5wdf _5w1r" style="max-width:171px;" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0.0.0"><div data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0.0.0.0"><span class="_5yl5" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0.0.0.0.0"><span class="null">'+item.m+'</span></span></div></div></div></div><div class="_3ry4" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:1"><div class="_5wda clearfix _2fs6 _2fs2" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:1.0"><div class="_2fs1" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:1.0.0"></div><span data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:1.0.1"></span></div></div></div>');
					}
					
				}

				$("#chatbox_"+chatboxtitle+" .chatboxcontent").scrollTop($("#chatbox_"+chatboxtitle+" .chatboxcontent")[0].scrollHeight);
				itemsfound += 1;
			}
		});

		chatHeartbeatCount++;

		if (itemsfound > 0) {
			chatHeartbeatTime = minChatHeartbeat;
			chatHeartbeatCount = 1;
		} else if (chatHeartbeatCount >= 10) {
			chatHeartbeatTime *= 2;
			chatHeartbeatCount = 1;
			if (chatHeartbeatTime > maxChatHeartbeat) {
				chatHeartbeatTime = maxChatHeartbeat;
			}
		}
		
		setTimeout('chatHeartbeat();',chatHeartbeatTime);
	}});
}

function closeChatBox(chatboxtitle) {
	$('#chatbox_'+chatboxtitle).css('display','none');
	restructureChatBoxes();

	$.post("chat.php?action=closechat", { chatbox: chatboxtitle} , function(data){	
	});

}

function toggleChatBoxGrowth(chatboxtitle) {
	if ($('#chatbox_'+chatboxtitle+' .chatboxcontent').css('display') == 'none') {  
		
		var minimizedChatBoxes = new Array();
		
		if ($.cookie('chatbox_minimized')) {
			minimizedChatBoxes = $.cookie('chatbox_minimized').split(/\|/);
		}

		var newCookie = '';

		for (i=0;i<minimizedChatBoxes.length;i++) {
			if (minimizedChatBoxes[i] != chatboxtitle) {
				newCookie += chatboxtitle+'|';
			}
		}

		newCookie = newCookie.slice(0, -1)


		$.cookie('chatbox_minimized', newCookie);
		$('#chatbox_'+chatboxtitle+' .chatboxcontent').css('display','block');
		$('#chatbox_'+chatboxtitle+' .chatboxinput').css('display','block');
		$("#chatbox_"+chatboxtitle+" .chatboxcontent").scrollTop($("#chatbox_"+chatboxtitle+" .chatboxcontent")[0].scrollHeight);
	} else {
		
		var newCookie = chatboxtitle;

		if ($.cookie('chatbox_minimized')) {
			newCookie += '|'+$.cookie('chatbox_minimized');
		}


		$.cookie('chatbox_minimized',newCookie);
		$('#chatbox_'+chatboxtitle+' .chatboxcontent').css('display','none');
		$('#chatbox_'+chatboxtitle+' .chatboxinput').css('display','none');
	}
	
}

function checkChatBoxInputKey(event,chatboxtextarea,chatboxtitle) {
	 
	if(event.keyCode == 13 && event.shiftKey == 0)  {
		message = $(chatboxtextarea).val();
		message = message.replace(/^\s+|\s+$/g,"");

		$(chatboxtextarea).val('');
		$(chatboxtextarea).focus();
		$(chatboxtextarea).css('height','20px');
		if (message != '') {
			$.post("chat.php?action=sendchat", {to: chatboxtitle, message: message} , function(data){
				message = message.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
				$("#chatbox_"+chatboxtitle+" .chatboxcontent").append('<div class="_5wd4 _1nc6 direction_ltr _5yt9"  data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496"><div class="_5wd9" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0"><div class="_5wde" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0"><div class="_5wdf _5w1r" style="max-width:171px;" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0"><div data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0.0"><span class="_5yl5" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0.0.0"><span class="null">'+message+'</span></span></div></div></div></div><div class="_3ry4" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1"><div class="_5wda clearfix _2fs6 _2fs2" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0"><div class="_2fs1" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0.0"></div><span data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0.1"></span></div></div></div>');
				$("#chatbox_"+chatboxtitle+" .chatboxcontent").scrollTop($("#chatbox_"+chatboxtitle+" .chatboxcontent")[0].scrollHeight);
			});
		}
		chatHeartbeatTime = minChatHeartbeat;
		chatHeartbeatCount = 1;

		return false;
	}

	var adjustedHeight = chatboxtextarea.clientHeight;
	var maxHeight = 94;

	if (maxHeight > adjustedHeight) {
		adjustedHeight = Math.max(chatboxtextarea.scrollHeight, adjustedHeight);
		if (maxHeight)
			adjustedHeight = Math.min(maxHeight, adjustedHeight);
		if (adjustedHeight > chatboxtextarea.clientHeight)
			$(chatboxtextarea).css('height',adjustedHeight+8 +'px');
	} else {
		$(chatboxtextarea).css('overflow','auto');
	}
	 
}

function startChatSession(){  
	$.ajax({
	  url: "chat.php?action=startchatsession",
	  cache: false,
	  dataType: "json",
	  success: function(data) {
 
		username = data.username;

		$.each(data.items, function(i,item){
			if (item)	{ // fix strange ie bug

				chatboxtitle = item.f;

				if ($("#chatbox_"+chatboxtitle).length <= 0) {
					createChatBox(chatboxtitle,1);
				}
				
				if (item.s == 1) {
					item.f = username;
				}

				if (item.s == 2) {
					$("#chatbox_"+chatboxtitle+" .chatboxcontent").append('<div class="chatboxmessage"><span class="chatboxinfo">'+item.m+'</span></div>');
				} else {
				if (item.f != chatboxtitle) {
					$("#chatbox_"+chatboxtitle+" .chatboxcontent").append('<div class="_5wd4 _1nc6 direction_ltr _5yt9" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496"><div class="_5wd9" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0"><div class="_5wde" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0"><div class="_5wdf _5w1r" style="max-width:171px;" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0"><div data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0.0"><span class="_5yl5" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:0.0.0.0.0"><span class="null">'+item.m+'</span></span></div></div></div></div><div class="_3ry4" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1"><div class="_5wda clearfix _2fs6 _2fs2" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0"><div class="_2fs1" data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0.0"></div><span data-reactid=".1k.$mid=11404849427120=21e523848f2084bc496.2:1.0.1"></span></div></div></div>');
					} else {
					$("#chatbox_"+chatboxtitle+" .chatboxcontent").append('<div class="_5wd4 _1nc7 direction_ltr _5yt9 _2cnu" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086"><div class="_5wd9" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0"><div class="_5wde" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0.0"><div class="_5wdf _5w1r" style="max-width:171px;" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0.0.0"><div data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0.0.0.0"><span class="_5yl5" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:0.0.0.0.0"><span class="null">'+item.m+'</span></span></div></div></div></div><div class="_3ry4" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:1"><div class="_5wda clearfix _2fs6 _2fs2" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:1.0"><div class="_2fs1" data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:1.0.0"></div><span data-reactid=".1k.$mid=11404849401700=2601ef003acb3933086.2:1.0.1"></span></div></div></div>');
					}
				}
			}
		});
		
		for (i=0;i<chatBoxes.length;i++) {
			chatboxtitle = chatBoxes[i];
			$("#chatbox_"+chatboxtitle+" .chatboxcontent").scrollTop($("#chatbox_"+chatboxtitle+" .chatboxcontent")[0].scrollHeight);
			setTimeout('$("#chatbox_"+chatboxtitle+" .chatboxcontent").scrollTop($("#chatbox_"+chatboxtitle+" .chatboxcontent")[0].scrollHeight);', 100); // yet another strange ie bug
		}
	
	setTimeout('chatHeartbeat();',chatHeartbeatTime);
		
	}});
}

/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};