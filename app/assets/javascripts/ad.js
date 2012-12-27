(function () {

    var domReady = (function () {
        var isReady = false,
            listening = false,
            callbacks = [],
            init = function (fn) {
                callbacks.push(fn);
                if (isReady) {
                    ready();
                }
                else if (!listening) {
                    prepare();
                }
            },
            ready = function () {
                isReady = true;
                listening = false;
                while (callbacks.length) {
                    callbacks.shift()();
                }
            },
            DOMContentLoaded = function() {
                if (document.addEventListener) {
                    document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
                    ready();
                }
                else if ( document.readyState === "complete" ) {
                    document.detachEvent( "onreadystatechange", DOMContentLoaded );
                    ready();
                }
            },
            prepare = function () {
                listening = true;
                if ( document.readyState === "complete" ) {
                    setTimeout(ready);
                }
                else if (document.addEventListener) {
                    document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
                    window.addEventListener( "load", ready, false );
                }
                else {
                    document.attachEvent( "onreadystatechange", DOMContentLoaded );
                    window.attachEvent( "onload", ready );

                    var top = false;
                    try {
                        top = window.frameElement == null && document.documentElement;
                    } catch(e) {}
                    if ( top && top.doScroll ) {
                        (function doScrollCheck() {
                            if ( !isReady ) {
                                try {
                                    top.doScroll("left");
                                } catch(e) {
                                    return setTimeout( doScrollCheck, 50 );
                                }
                                ready();
                            }
                        })();
                    }
                }
            };

        return init;
    })();

    var loadRes = function (path, fn) {
        var isCSS = /\.css$/.test(path), tag;
        if (isCSS) {
            tag = document.createElement('link');
        }
        else {
            tag = document.createElement('script');
        }
        tag.onload = tag.onerror = tag.onreadystatechange = function () {
            if (tag && tag.readyState && tag.readyState !== 'loaded' && tag.readyState !== 'complete') { return; }
            try {
                //tag.parentNode.removeChild(tag);
                tag = null;
            } catch (ex) {}
            fn && fn();
        }
        if (isCSS) {
            tag.type = 'text/css';
            tag.rel = 'stylesheet';
            tag.href = path;
        }
        else {
            tag.type = 'text/javascript';
            tag.src = path;
        }
        document.getElementsByTagName('head')[0].appendChild(tag);
    };

    var JebeLoader = null;

    var options = {ns: 'jebe', src: null};

    var JebeManager = function (o) {

        for (var key in o) {options[key] = o[key]}

        var load = function (r) {
            r = r || location.href;
            var src = 'http://ebp.renren.com/ebpn/show?var='+options.ns+'_json&t=' + +new Date();
            if (/\.renren\.com/.test(r)) {
                src += '&userid='+XN.user.id+'&isvip='+XN.user.isVip+'&hideads='+XN.user.hideAds+(XN.pageId?'&pageType='+XN.pageId:'');;
                //if (r.match(/http:\/\/www\.renren\.com\/home/ig)) { r = 'http://www.renren.com/Home.do'; };//这个应该没什么用了，测试有问题再恢复吧 by emil
                if (XN.app.share && XN.app.share.pageInfo ) { r = r.replace(/\?.*$/,'') + '?shareType=' + XN.app.share.pageInfo.type; }
            }
            src += '&r=' + encodeURIComponent(r);

            options.src = src;

            loadRes(src, function () {
                if (JebeLoader) {
                    JebeLoader.reset(src);
                }
                else {
                    loadRes('src/jebe.js');
                    loadRes('css/widgetbox.css');
                }
            });
        };

        return {
            load: load
        }
    };

    JebeManager.define = function (fn) {
        JebeLoader = fn(options);
    }

    window.JebeManager = JebeManager;


})();

XN.user = {
    id: "109224573",
    isVip: false,
    hideAds: false
}
XN.pageId = 'home';
XN.jebe = {};
var cookieArray = [];

	
	JebeApi = {};
	
	JebeApi.RestRequests = function (adID, widgetID, widgetVersion) {
		this.uid = XN.cookie.get('id');
		this.adID = adID;
		this.widgetID = widgetID;
		this.widgetVersion = widgetVersion;
		this.requests = [];
	}
	
	JebeApi.RestRequests.prototype = {
		add : function (request) {
			request.uid = this.uid;
			request.adID = this.adID;
			request.widgetID = this.widgetID;
			request.widgetVersion = this.widgetVersion;
			this.requests.push(request);
		},
		send : function (onSuccess, onError) {
			var This = this;
			if (this.requests.length > 0) {
				if (!onSuccess)
					onSuccess = function () {};
				if (!onError)
					onError = function () {};
				new XN.net.xmlhttp({
					url : "http://rest.widgetbox.jebe.renren.com/widgetboxs/rest/execute.htm",
					method : 'post',
					data : '&content=' + encodeURIComponent(XN.JSON.build(This.requests)),
					onSuccess : onSuccess,
					onError : onError
				});
			}
		}
	}
	
	JebeApi.RequestParam = function (serviceType, methodType, parameter, key, concurrent) {
		this.serviceType = serviceType;
		this.methodType = methodType;
		this.parameter = parameter;
		this.key = key;
		this.concurrent = false;
	}
	
	JebeApi.PersonRequest = {
		serviceType : '1',
		newActionRequest : function (methodType, param, returnKey, concurrent) {
			return new JebeApi.RequestParam(this.serviceType, methodType, param, returnKey, concurrent);
		},
		getFriendList : function (params, returnKey, concurrent) {
			return this.newActionRequest('1', params, returnKey, concurrent);
		},
		getFriendListByFans : function (params, returnKey, concurrent) {
			return this.newActionRequest('2', params, returnKey, concurrent);
		},
		getFriendListByIsFans : function (params, returnKey, concurrent) {
			return this.newActionRequest('3', params, returnKey, concurrent);
		},
		getFriendListByVoted : function (params, returnKey, concurrent) {
			return this.newActionRequest('4', params, returnKey, concurrent);
		},
		getFriendListByZaned : function (params, returnKey, concurrent) {
			return this.newActionRequest('5', params, returnKey, concurrent);
		},
		getFriendListByFansXce : function (params, returnKey, concurrent) {
			return this.newActionRequest('6', params, returnKey, concurrent);
		},
		getFriendListByVotedHbase : function (params, returnKey, concurrent) {
			return this.newActionRequest('7', params, returnKey, concurrent);
		},
		getFriendListByZanedHbase : function (params, returnKey, concurrent) {
			return this.newActionRequest('8', params, returnKey, concurrent);
		},
		getFriendsListBySocial : function (params, returnKey, concurrent) {
			return this.newActionRequest('10', params, returnKey, concurrent);
		},
		getCountBySocial : function (params, returnKey, concurrent) {
			return this.newActionRequest('11', params, returnKey, concurrent);
		},
		getJoinedBySocial : function (params, returnKey, concurrent) {
			return this.newActionRequest('12', params, returnKey, concurrent);
		},
		getFriendListByVideolikeHbase : function (params, returnKey, concurrent) {
			return this.newActionRequest('14', params, returnKey, concurrent);
		}
		
	}
	
	JebeApi.ActionRequest = {
		serviceType : '2',
		newActionRequest : function (methodType, param, returnKey, concurrent) {
			return new JebeApi.RequestParam(this.serviceType, methodType, param, returnKey, concurrent);
		},
		smsRequest : function (params, returnKey, concurrent) {
			return this.newActionRequest('4', params, returnKey, concurrent);
		},
		becomeFansRequest : function (params, returnKey, concurrent) {
			return this.newActionRequest('5', params, returnKey, concurrent);
		},
		isFans : function (params, returnKey, concurrent) {
			return this.newActionRequest('6', params, returnKey, concurrent);
		},
		getFansCount : function (params, returnKey, concurrent) {
			return this.newActionRequest('7', params, returnKey, concurrent);
		},
		getPageName : function (params, returnKey, concurrent) {
			return this.newActionRequest('8', params, returnKey, concurrent);
		},
		vote : function (params, returnKey, concurrent) {
			return this.newActionRequest('9', params, returnKey, concurrent);
		},
		getVoteCounts : function (params, returnKey, concurrent) {
			return this.newActionRequest('10', params, returnKey, concurrent);
		},
		zan : function (params, returnKey, concurrent) {
			return this.newActionRequest('11', params, returnKey, concurrent);
		},
		getZanCounts : function (params, returnKey, concurrent) {
			return this.newActionRequest('12', params, returnKey, concurrent);
		},
		sendWidgetClickLog : function (params, returnKey, concurrent) {
			return this.newActionRequest('15', params, returnKey, concurrent);
		},
		sendVideoLike : function (params, returnKey, concurrent) {
			return this.newActionRequest('16', params, returnKey, concurrent);
		},
		getVideo : function (params, returnKey, concurrent) {
			return this.newActionRequest('17', params, returnKey, concurrent);
		},
		setVideo : function (params, returnKey, concurrent) {
			return this.newActionRequest('18', params, returnKey, concurrent);
		},
		
		AddPage2Friend : function (params, returnKey, concurrent) {
			return this.newActionRequest('19', params, returnKey, concurrent);
		},
		
		likeAd : function (params, returnKey, concurrent) {
			return this.newActionRequest('20', params, returnKey, concurrent);
		},
		unLikeAd : function (params, returnKey, concurrent) {
			return this.newActionRequest('21', params, returnKey, concurrent);
		},
		getAdLikeCount : function (params, returnKey, concurrent) {
			return this.newActionRequest('22', params, returnKey, concurrent);
		},
		getLikedAds : function (params, returnKey, concurrent) {
			return this.newActionRequest('23', params, returnKey, concurrent);
		},
		blockAd : function (params, returnKey, concurrent) {
			return this.newActionRequest('24', params, returnKey, concurrent);
		},
		
		sendFeed : function (params, returnKey, concurrent) {
			return this.newActionRequest('25', params, returnKey, concurrent);
		}
	}
	
	JebeApi.DataRequest = {
		serviceType : '3',
		newDataRequest : function (methodType, param, returnKey, concurrent) {
			return new JebeApi.RequestParam(this.serviceType, methodType, param, returnKey, concurrent);
		},
		newAddRequest : function (primaryKey, key, value, returnKey, concurrent) {
			//add
			return this.newDataRequest('1', {
				'primaryKey' : primaryKey,
				'key' : key,
				'value' : value
			}, returnKey, concurrent);
		},
		newAddMuchRequest : function (primaryKey, map, returnKey, concurrent) {
			//addMuch
			return this.newDataRequest('2', {
				'primaryKey' : primaryKey,
				'map' : map
			}, returnKey, concurrent);
		},
		newRemoveRequest : function (primaryKey, key, returnKey, concurrent) {
			//remove
			return this.newDataRequest('3', {
				'primaryKey' : primaryKey,
				'key' : key
			}, returnKey, concurrent);
		},
		newRemoveMuchRequest : function (primaryKey, returnKey, concurrent) {
			//remove
			return this.newDataRequest('4', {
				'primaryKey' : primaryKey
			}, returnKey, concurrent);
		},
		newGetRequest : function (primaryKey, key, returnKey, concurrent) {
			//get
			return this.newDataRequest('5', {
				'primaryKey' : primaryKey,
				'key' : key
			}, returnKey, concurrent);
		},
		newGetMuchRequest : function (primaryKey, returnKey, concurrent) {
			//getMuch
			return this.newDataRequest('6', {
				'primaryKey' : primaryKey
			}, returnKey, concurrent);
		},
		newAddOneRequest : function (primaryKey, returnKey, concurrent) {
			//addOne
			return this.newDataRequest('7', {
				'primaryKey' : primaryKey
			}, returnKey, concurrent);
		},
		voteRequest : function (primaryKey, map, returnKey, concurrent) {
			//addMuch
			return this.newDataRequest('8', {
				'primaryKey' : primaryKey,
				'map' : map
			}, returnKey, concurrent);
		},
		getVoteCountRequest : function (primaryKey, key, returnKey, concurrent) {
			//addOne
			return this.newDataRequest('9', {
				'primaryKey' : primaryKey,
				'key' : key
			}, returnKey, concurrent);
		},
		zanRequest : function (primaryKey, map, returnKey, concurrent) {
			//addMuch
			return this.newDataRequest('10', {
				'primaryKey' : primaryKey,
				'map' : map
			}, returnKey, concurrent);
		},
		getZanCountRequest : function (primaryKey, key, returnKey, concurrent) {
			//addOne
			return this.newDataRequest('11', {
				'primaryKey' : primaryKey,
				'key' : key
			}, returnKey, concurrent);
		},
		getQuestionaryList : function (params, returnKey, concurrent) {
			//addOne
			return this.newDataRequest('13', params, returnKey, concurrent);
		},
		answerQuestionary : function (params, returnKey, concurrent) {
			//addOne
			return this.newDataRequest('16', params, returnKey, concurrent);
		}
		
	}


JebeManager({ns: 'jebe'}).load('http://www.renren.com/109224573');
