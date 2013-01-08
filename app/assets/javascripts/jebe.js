JebeManager.define(function (src, undefined) {

    var Class = function () {
        var Class = function () {
            this.init.apply(this, arguments);
        },
        fnTest = /\$super\b/,
        tempCtor = function(){},
        name,
        i,
        parent = arguments[0],
        props = arguments[arguments.length - 1],
        interface;
        if (typeof parent === 'function') {
            tempCtor.prototype = parent.prototype;
            Class.prototype = new tempCtor();
            props = arguments[arguments.length - 1];
            for (name in props) {
                if (typeof props[name] === 'function' && fnTest.test(props[name])) {
                    Class.prototype[name] = (function (name, fn, fnSuper) {
                        return function () {
                            var bak = this.$super, res;
                            this.$super = fnSuper;
                            res = fn.apply(this, arguments);
                            this.$super = bak;
                            return res;
                        };
                    })(name, props[name], parent.prototype[name]);
                }
                else {
                    Class.prototype[name] = props[name];
                }
            }
            Class.prototype.$super = parent.prototype;
            interface = Array.prototype.slice.call(arguments, 1, -1);
        }
        else {
            Class.prototype = props;
            interface = Array.prototype.slice.call(arguments, 0, -1);
        }
        for (i = 0, name ; i < interface.length ; i += 1) {
            for (name in interface[i]) {
                Class.prototype[name] = interface[i][name];
            }
        }
        Class.prototype.constructor = Class;
        return Class;
    };

    var loadJS = function (path, fn) {
        var tag = document.createElement('script');
        tag.onload = tag.onerror = tag.onreadystatechange = function () {
            if (tag && tag.readyState && tag.readyState !== 'loaded' && tag.readyState !== 'complete') { return; }
            try {
                tag.parentNode.removeChild(tag);
                tag = null;
            } catch (ex) {}
            fn && fn();
        }
        tag.src = path;
        document.getElementsByTagName('head')[0].appendChild(tag);
    };

    /**
     * CSS selector
     *
     * Usage:
     * <pre>
     * //This example returns a list of all a elements within the document with a class of "note"
     * query('a.note')
     * </pre>
     *
     * @param {String} query A string containing a selector expression to match elements against.
     * @param {Element} [parent=document] A element to limit the scrope of search
     * @return {Element[]} A list of all a elements within the parent
     */
    var $ = (function () {
        var query = function (selector, parent) {
            parent = parent || document;
            if (parent.querySelectorAll) {
                if (parent === document) {
                    return document.querySelectorAll(selector);
                }
                var oldID = parent.id;
                parent.id = 'rooted' + (++arguments.callee.counter);
                try {
                    return parent.querySelectorAll('#' + parent.id + ' ' + selector);
                } catch (e) {
                    throw e;
                } finally {
                    parent.id = oldID;
                }
            }
            else {
                if (!parent.push) {
                    parent = [parent];
                }
                var section = /\S+\s*/.exec(selector);
                if (section) {
                    var remain = selector.slice(section[0].length);
                    section = section[0].replace(/\s+$/, '');
                    var result = [];
                    var id = /#([^\[\.]+)/.exec(section);
                    if (id) {
                        id = id[1];
                    }
                    var tagName = /^[^\[\.#]+/.exec(section);
                    if (tagName) {
                        tagName = tagName[0];
                    }
                    var className = /\.([^\[]+)/.exec(section);
                    if (className) {
                        className = className[1];
                    }
                    var attribute = /\[(.+)\]/.exec(section);
                    if (attribute) {
                        attribute = attribute[1];
                        attribute = attribute.split('=');
                        if (attribute.length === 1) {attribute[1] = '';}
                    }

                    for (var i = 0, len = parent.length ; i < len ; i++) {
                        var p = parent[i];
                        var nodeList, filterList = [];
                        var j;

                        if (id) {
                            result.push(document.getElementById(id));
                            continue;
                        }

                        if (tagName) {
                            nodeList = p.getElementsByTagName(tagName);
                        }
                        else if (attribute || className) {
                            nodeList = p.getElementsByTagName('*');
                        }

                        if (attribute) {
                            j = 0;
                            while (j < nodeList.length) {
                                if (nodeList[j].getAttribute(attribute[0]) === attribute[1]) {
                                    filterList.push(nodeList[j]);
                                }
                                j += 1;
                            }
                            nodeList = filterList;
                            filterList = [];
                        }

                        if (className) {
                            var regexClassName = new RegExp('(^|\\s)' + className + '(\\s|$)');
                            j = 0;
                            while (j < nodeList.length) {
                                if (regexClassName.test(nodeList[j].className)) {
                                    filterList.push(nodeList[j]);
                                }
                                j += 1;
                            }
                        }

                        result = result.concat(filterList);

                    }
                    return query(remain, result);
                }
                else {
                    var obj = {};
                    var a = [];
                    for (var j = 0, jLen = parent.length ; j < jLen ; j++) {
                        var item = parent[j];
                        if (item.uniqueId === undefined) {
                            item.uniqueId = 1;
                            a.push(item);
                        }
                    }
                    for (j = 0, jLen = a.length ; j < jLen ; j++) {
                        a[j].uniqueId = undefined;
                    }
                    return a;
                }

            }
        }

        var jQueryLite = function (selector, context) {
            var elements;
            if (selector.nodeType) {
                elements = [selector];
            }
            else if (typeof selector === 'string') {
                elements = query(selector, context);
            }
            for (var i = 0, len = elements.length ; i < len ; i += 1) {
                this[i] = elements[i];
            }
            this.length = len;
        }

        jQueryLite.Event = {
            handlerOrigin: {},
            handler: {},
            fix: function (e) {
                e = e || window.event;
                var event = {};
                event.originEvent = e;
                event.target = e.target || e.srcElement;
                event.prevetDefault = function () {
                    return e.prevetDefault ?  e.prevetDefault() : (e.returnValue = false);
                }
                event.stopPropagation = function () {
                    return e.stopPropagation ? e.stopPropagation() : (e.cancelBubble = true)
                }
                return event;
            },
            on: function (handler) {
                var key = 'handler' + parseInt(Math.random()* +new Date(), 10);
                this.handlerOrigin[key] = handler;
                this.handler[key] = function (e) {
                    handler.call(this, jQueryLite.Event.fix(e));
                }
                return this.handler[key];
            },
            off: function (handler) {
                for (var key in this.handlerOrigin) {
                    if (this.handlerOrigin[key] === handler) {
                        var fn = this.handler[key];
                        delete this.handlerOrigin[key];
                        delete this.handler[key];
                        return fn;
                    }
                }
            }
        }

        jQueryLite.prototype = {

            on: function (type, handler) {
                for (var i = 0, len = this.length ; i < len ; i += 1) {
                    if (document.addEventListener) {
                        this[i].addEventListener(type, jQueryLite.Event.on(handler), false);
                    }
                    else {
                        this[i].attachEvent('on' + type, type, jQueryLite.Event.on(handler));
                    }
                }
            },

            off: function (type, handler) {
                for (var i = 0, len = this.length ; i < len ; i += 1) {
                    if (document.removeEventListener) {
                        this[i].removeEventListener(type, jQueryLite.Event.off(handler), false);
                    }
                    else {
                        this[i].dettachEvent('on' + type, jQueryLite.Event.off(handler));
                    }
                }
            }
        };

        return function (selector, context) {
            return new jQueryLite(selector, context);
        }

    })();

    var PubSub = {
        subscribe: function(ev, callback) {
            var calls = this._callbacks || (this._callbacks = {});
            (this._callbacks[ev] || (this._callbacks[ev] = [])).push(callback);
            return this;
        },
        publish: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            var ev   = args.shift();
            var list, calls, i, l;
            if (!(calls = this._callbacks)) return this;
            if (!(list  = this._callbacks[ev])) return this;
            for (i = 0, l = list.length; i < l; i++)
            list[i].apply(this, args);
            return this;
        }
    };

    /***********************************************API***********************************************/
    var JebeApi = {};
    
    JebeApi.RestRequests = function (adID, widgetID, widgetVersion) {
        this.uid = '109224573';
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
    /*************************************************************************************************/

    var extend = function (obj1, obj2) {
        for (var key in obj2) {
            obj1[key] = obj2[key];
        }
        return obj1
    };
    
    var Jebe = Class({

        init: function (templateData) {
            this.templateData = templateData;
            this.templateBaseUrl = 'http://t.jebe.renren.com/widgetbox/main/content/'||'http://jebe.xnimg.cn/widgetbox/main/content/';
            this.adzonePrex = 'ad';
            this.randJSRepoVar = 'jebeJSRepo' + + new Date();
            window[this.randJSRepoVar] = {};
        },

        load: function () {
            var self = this, i;
            for (i = 0 ; i < this.templateData.length ; i += 1) {
                if (this.templateData[i].ads[0]) {
                    this.templateBaseUrl += this.templateData[i].ads[0].widget_id + ',';
                    this.templateBaseUrl += this.templateData[i].ads[0].widget_version + ',';
                    this.templateBaseUrl += this.templateData[i].adzone_id + ',';
                    this.templateBaseUrl += 'runtime-';
                }
            }
            this.templateBaseUrl += 'jebe_template.';
            loadJS(this.templateBaseUrl, function () {
                self.render(window['jebe_template']);
            });
        },

        render: function (tmpl) {
            var d1 = new Date()
            //console.log(tmpl, this.templateData)
            var i, j, adzone, html, script, rr = +new Date(), self = this;
            var stat = 0;
            for (i = 0 ; i < tmpl.length ; i += 1) {
                if (tmpl[i].widget_id !== '100') {
                    stat ++;
                    continue;
                }
                console.log(tmpl[i], this.templateData[i].ads)
                adzone = $('#'+this.adzonePrex + tmpl[i].adzone_id)[0];
                script = document.createElement('script');
                try {
                    script.appendChild(document.createTextNode('window["'+this.randJSRepoVar+'"]['+tmpl[i].adzone_id+']=(function($, data){'+tmpl[i].js+'})'));
                }
                catch (e) {
                    script.text = 'window["'+this.randJSRepoVar+'"]['+tmpl[i].adzone_id+']=(function($, data){'+tmpl[i].js+'})';
                }
                adzone.appendChild(script);
                var d2 = new Date()
                html = '';
                //html = '<div class="jebe-utils">'+(?'':'')+'<a data-index="'+i+'" class="jebe-close" href="#"></a></div>';
                for (j = 0 ; j < this.templateData[i].ads.length ; j += 1) {
                    //'ad'+this.templateData[i].ads[j].ad_param.creative_id+'_'+rr+'_adbox'+this.templateData[i].adzone_id
                    //html += tmpl[i].html.replace(new RegExp(tmpl[i].placeholder, 'g'), 'ad'+this.templateData[i].ads[j].ad_param.creative_id);
                    this.templateData[i].ads[j].ad_param = extend(this.templateData[i].ads[j].ad_param, eval("("+this.templateData[i].ads[j].widget+")"));
                    html += tmpl[i].html.replace(/{{(.+?)}}/mg, function (s, p) {
                        return new Function('obj', 'with(obj){return '+p+'}')(self.templateData[i].ads[j].ad_param);
                    });
                    html = '<div class="jebe-ad" id="ad' + self.templateData[i].ads[j].ad_param.creative_id + '"><div class="jebe-utils"></div><div class="jebe-ad-body">' + html + '</div></div>';
                }
                adzone.innerHTML = html;
                if (adzone.getAttribute('controls') !== undefined) {
                    var btnNext = document.createElement('a');
                    btnNext.className = 'jebe-next';
                    $('.jebe-utils', adzone)[0].appendChild(btnNext);
                    btnNext.onclick = this.refresh;
                }
                for (j = 0 ; j < this.templateData[i].ads.length ; j += 1) {
                    (function (init, args) {
                        setTimeout(function () {
                            init.apply(window, args);
                        }, 0);
                    })(window[this.randJSRepoVar][tmpl[i].adzone_id], [this.factory('ad'+this.templateData[i].ads[j].ad_param.creative_id), this.templateData[i].ads[j].ad_param]);
                }
            }
            delete window[this.randJSRepoVar];
            if (stat === tmpl.length) {location.href = location.href}
            $('#log')[0].innerHTML = (new Date() - d1) + '-' + (d2-d1)
        },

        refresh: function () {
            PubSub.publish('refresh', this.getAttribute('data-index'));
            return false;
        },

        factory: function (prex) {
            var query = function (selector) {
                return $('#' + prex + ' ' + selector);
            };
            query.getElementById = function (id) {
                return $('#' + prex + ' #'+ id)[0];
            };
            query.getElementsByName = function (name) {
                return $('#' + prex + ' [name=' + name + ']');
            };
            return query;
        }

    });

    var JebeLoader = Class({

        init: function (src) {
            //console.log(window[NS+'_json'])

            var self = this;

            PubSub.subscribe('refresh', function (index) {
                self.load('refresh_source='+index);
            });

            this.src = src;
            //this.autoRefresh();

            new Jebe(window['jebe_json'].list).load();
        },

        reset: function (src) {
            this.src = src;
            this.autoRefresh();
            new Jebe(window['jebe_json'].list);
        },

        autoRefresh: function () {
            var self = this;
            clearInterval(this.timer);
            this.refreshCount = 0;
            this.timer = setInterval(function () {
                self.refreshCount += 1;
                if (self.refreshCount > parseFloat(window[NS+'_json'].max_update_count)) {
                    clearInterval(self.timer);
                }
                else {
                    self.load('refresh_idx='+self.refreshCount);
                }
            }, parseFloat(window['jebe_json'].udpate_interval) * 1000);
        },

        load: function (data) {
            var src = this.src + '&' + data, self = this;

            loadJS(src, function () {
                (new Jebe(window['jebe_json'].list)).load();
            });
        }

    });

    var Like = Class({

        init: function (opt) {
            var self = this;
            this.opt = opt;
            this.opt.placeholder = $('#ad' + this.opt.adId + ' ' + this.opt.placeholder)[0];
            this.getLikedAds(function (likedAds) {
                var liked = false, i, len; 
                for (i = 0, len = likedAds.length ; i < len ; i += 1) {
                    if(self.opt.adId === likedAds[i]){
                        liked = true;
                        break;
                    }
                }
                if (!liked) {
                    var request = new JebeApi.RestRequests(self.opt.adId, '', '');
                    request.add(JebeApi.ActionRequest.getAdLikeCount({creativeID : self.opt.adId}, 'result', false));
                    request.send(function(response){
                        var count = parseInt(eval('{'+ response.responseText +'}')[0].result, 10);
                        if (count) {
                            self.stat.innerHTML = (count > 5 ? count : 5) + '人';
                        }
                    }, function(){});
                }
                self.opt.placeholder.innerHTML = '<div class="jebe-like"><a class="like-ad" href="#">'+(liked?'已经喜欢':'喜欢')+'</a><span></span></div>';
                self.btn = $('a', self.opt.placeholder)[0];
                self.stat = $('span', self.opt.placeholder)[0];
                self.btn.onclick = function (e) {self.onClick(e);};
                self.btn.onmouseover = function (e) {self.onMouseover(e);};
                self.btn.onmouseout = function (e) {self.onMouseout(e);};
            });
        },

        getLikedAds: function (fn) {
            if (this.constructor.likedAds) {
                fn(this.constructor.likedAds);
            }
            else {
                var request = new JebeApi.RestRequests('', '', ''), self = this;
                request.add(JebeApi.ActionRequest.getLikedAds({
                        userID : '109224573'||XN.cookie.get('id')
                    }, 'adlist', false));
                request.send(function (response) {
                    self.constructor.likedAds = eval('{'+ response.responseText +'}')[0].adlist.split(',');
                    fn(self.constructor.likedAds);
                }, function () {});
            }
        },

        onMouseover: function () {
            if (this.btn.innerHTML === "已经喜欢") {
                this.btn.innerHTML = "取消喜欢";
            }
        },

        onMouseout: function () {
            if (this.btn.innerHTML === "取消喜欢") {
                this.btn.innerHTML = '已经喜欢';
            }
        },

        onClick: function () {
            var likeText = this.btn.innerHTML;
            var logTag = '';
            var self = this;
            if(likeText === "取消喜欢") {
                logTag = 'unlikeAd';
            }
            else if(likeText === "喜欢") {
                logTag = 'likeAd';
            }
            //sendRestLog(logTag,adparam.click_url,adparam.creative_id,adparam.widgetId,adparam.widgetVersion,adparam.adzoneId);
            if (this.btn.innerHTML === '取消喜欢') {
                var request = new JebeApi.RestRequests(this.opt.adId, '', '');
                request.add(JebeApi.ActionRequest.getAdLikeCount({creativeID : this.opt.adId}, 'result', false));
                request.add(JebeApi.ActionRequest.unLikeAd({creativeID : this.opt.adId, clickUrl : this.opt.adparam.click_url, absPos : this.opt.adparam.click_url}, 'result', false));
                request.send(
                    function(response){
                        var count = parseInt(eval('{'+ response.responseText +'}')[0].result, 10);
                        if (count) {
                            self.stat.innerHTML = (count > 5 ? count : 5) + '人';
                        }
                        for(var i = 0, len = self.constructor.likedAds.length ; i < len ; i += 1) {
                            if(self.opt.adId === self.constructor.likedAds[i]) {
                                self.constructor.likedAds.splice(i, 1);
                                break;
                            }   
                        }
                        self.btn.innerHTML = '喜欢';
                    }, function(){});
            }
            else if (this.btn.innerHTML === '喜欢') {
                var request = new JebeApi.RestRequests(this.opt.adId, '', '');
                request.add(JebeApi.ActionRequest.likeAd({creativeID : this.opt.adId, clickUrl : this.opt.adparam.click_url, absPos : this.opt.adparam.click_url}, 'result', false));
                request.send(
                    function(response){
                        self.constructor.likedAds.push(self.opt.adId);
                        self.btn.innerHTML = '已经喜欢';
                        self.stat.innerHTML = '';
                    }, function(){});
            }
        }

    });

    var Close = Class({

        init: function (opt) {
            var self = this;
            this.opt = opt;
            this.ad = $('#ad' + this.opt.adId)[0];
            this.btn = document.createElement('a');
            this.btn.className = 'jebe-close';
            $(this.btn).on('click', function (e) {
                self.showSurvey();
                e.prevetDefault();
            });
            $('.jebe-utils', this.ad)[0].appendChild(this.btn);

            this.surveyTmpl = '<h4 style="padding:6px 0px;">我们将尽量不再向你展示此广告</h4>\
                            <div style="padding:2px 0px">为什么不喜欢此广告？</div>\
                            <div style="padding:2px 0px"><input type="radio" name="option" value="我对这条广告不感兴趣" checked /> 我对这条广告不感兴趣</div>\
                            <div style="padding:2px 0px"><input type="radio" name="option" value="担心广告误导我" /> 担心广告误导我</div>\
                            <div style="padding:2px 0px"><input type="radio" name="option" value="已看过这条广告" /> 已看过这条广告</div>\
                            <div style="padding:2px 0px"><input type="radio" name="option" value="其它" /><input id="reason" class="close-reason" style="color:#999" type="text" maxlength="20" value="其它" /></div>\
                            <div style="padding:7px 0px 3px 20px; *padding:7px 0px 3px 24px;">\
                                <input id="confirm" class="ad-confirm-btn" style="margin:2px 0px 5px 0px;*padding:3px 8px 0px 8px;" type="button" value="确定" />\
                                <input id="cancel" class="ad-cancel-btn" style="margin:2px 0px 5px 0px;*padding:3px 8px 0px 8px;" type="button" value="取消" />\
                            </div>';
            this.surveySuccessTmpl = '<div class="thanks">感谢您的反馈，<br />我们将努力提供更多您喜欢的广告！</div>'
        },

        showSurvey: function () {
            var survey = document.createElement('div'), self = this;
            survey.className = 'jebe-survey';
            survey.innerHTML = this.surveyTmpl;
            this.ad.appendChild(survey);
            $('div.jebe-ad-body', this.ad)[0].style.display = 'none';
            $('input.close-reason', survey).on('focus', function () {
                this.value = '';
                this.previousSibling.checked = true;
                this.style.color = "#333333";
            });
            $('input.ad-confirm-btn', survey).on('click', function () {
                self.submitSurvey();
                self.ad.removeChild(survey);
                $('div.jebe-ad-body', self.ad)[0].style.display = 'block';
            });
            $('input.ad-cancel-btn', survey).on('click', function () {
                self.ad.removeChild(survey);
                $('div.jebe-ad-body', self.ad)[0].style.display = 'block';
            });
        },

        submitSurvey: function () {
            var options = $('[name=option]', this.ad), i, len, reasonClose;
            for(i = 0, len = options.length ; i < len ; i += 1) {
                if(options[i].checked){
                    if(i === 3){
                        reasonClose = $('.close-reason', this.ad)[0].value;
                        reasonClose = reasonClose || '其他';
                    }
                    else{
                        reasonClose = options[i].value;
                    }
                }
            }
            
            //记录关闭广告日志
            //sendRestLog("closeAd",adparam.click_url,adparam.creative_id,adparam.widgetId,adparam.widgetVersion,adparam.adzoneId,'closeReason',encodeURIComponent(reasonClose));
            
            XN.net.sendStats('http://ebp.renren.com/ebpn/close.html?cid=' + this.opt.adparam.creative_id);    //使用XN.net.sendStats()方法向引擎发送关闭请求
            var request = new JebeApi.RestRequests('adparam.creative_id', '', ''); 
            request.add(JebeApi.ActionRequest.blockAd({creativeID : this.opt.adId, absPos : this.opt.adparam.click_url, clickUrl : this.opt.adparam.click_url, blockReason : encodeURIComponent(reasonClose)}, 'result', false));
            request.send(function(response){response = eval('{'+ response.responseText +'}');}, function(){});
            this.ad.removeChild($('div.jebe-survey', this.ad)[0]);
            var surveySuccess = document.createElement('div');
            surveySuccess.className = 'jebe-survey-success';
            surveySuccess.innerHTML = this.surveySuccessTmpl;
            this.ad.appendChild(surveySuccess);
        }
    });

    /*
    向REST服务发起记录log的请求。
    customName/customValue 参数是根据不同的业务增加的一个自定义字段的名称和字段值。
    */
    var sendRestLog = function(log_tag,clickUrl,creative_id,widget_id, widget_version,adzone_id,customName,customValue) {
    
        var clickUrl = encodeURIComponent(clickUrl);
        
        var userid = XN.cookie.get('id');
        var loc = encodeURIComponent(window.location.href);
        
        var time = new Date().valueOf();
        var param =  '&log_tag=' + log_tag + '&url=' + clickUrl + '&adzone_id=' + adzone_id + '&creative_id=' + creative_id + '&member_id=' + userid + '&location=' + loc + '&widget_id=' + widget_id + '&widget_version=' + widget_version + '&time=' + time;
        if(typeof customName != "undefined" && customName != "") {
            param += '&' + customName + '=' + customValue;
        }
        
        console.log("sendRestLog,param=" + param);
        
        new XN.net.xmlhttp({
            url: "http://rest.widgetbox.jebe.renren.com/widgetboxs/rest/widget",
            method: 'post',
            data: param,
            onSuccess: function(){},
            onError: function(){}
        });
        
    }

    JebeManager.API = {
        Like: function (o) {
            return new Like(o);
        },
        Close: function (o) {
            return new Close(o);
        }
    };

    return new JebeLoader(src);

});