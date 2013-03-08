JebeManager.define(function (globalOptions, developmentMode) {

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

        var jQueryLite = function (selector, context) {
            return new jQueryLite.fn.init(selector, context);
        };

        jQueryLite.fn = jQueryLite.prototype = {

            init: function (selector, context) {
                var elements;
                if (selector.nodeType) {
                    elements = [selector];
                }
                else if (selector.length && selector.nodeType) {
                    elements = selector;
                }
                else if (typeof selector === 'string') {
                    elements = this.query(selector, context);
                }
                for (var i = 0, len = elements.length ; i < len ; i += 1) {
                    this[i] = elements[i];
                }
                this.length = len;
            },

            on: function (type, handler) {
                for (var i = 0, len = this.length ; i < len ; i += 1) {
                    if (document.addEventListener) {
                        this[i].addEventListener(type, jQueryLite.Event.on(handler), false);
                    }
                    else {
                        this[i].attachEvent('on' + type, jQueryLite.Event.on(handler));
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
            },

            query: function (selector, parent) {
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
                    if (selector.indexOf(',') > -1) {
                        var section = selector.split(','), result = [];
                        for (var i = 0, len = section.length ; i < len ; i++) {
                            result = result.concat(query(section[i], parent));
                        }
                        return query('', result);
                    }
                    var section = /(\S+?)\s*/.exec(selector);
                    if (section) {
                        var remain = selector.slice(section[0].length);
                        section = section[1];
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
                        var a = [];
                        for (var i = 0, len = parent.length ; i < len ; i++) {
                            var item = parent[i];
                            if (item.uniqueId === undefined) {
                                item.uniqueId = 1;
                                a.push(item);
                            }
                        }
                        for (i = 0, len = a.length ; i < len ; i++) {
                            delete a[i].uniqueId;
                        }
                        return a;
                    }

                }
            }
        };

        jQueryLite.fn.init.prototype = jQueryLite.fn;

        jQueryLite.ajax = (function () {

            function createXMLHttpObject() {
                var XMLHttpFactories = [
                    function () {return new XMLHttpRequest()},
                    function () {return new ActiveXObject("Msxml2.XMLHTTP")},
                    function () {return new ActiveXObject("Msxml3.XMLHTTP")},
                    function () {return new ActiveXObject("Microsoft.XMLHTTP")}
                ];

                var xmlhttp = false, i, len;
                for (i = 0, len = XMLHttpFactories.length ; i < len ; i += 1) {
                    try {
                        xmlhttp = XMLHttpFactories[i]();
                    }
                    catch (e) {
                        continue;
                    }
                    break;
                }

                createXMLHttpObject = XMLHttpFactories[i];
                return xmlhttp;
            }

            function stringify(parameters) {
                var params = [], p;
                for(p in parameters) {
                    params.push(encodeURIComponent(p) + '=' + encodeURIComponent(parameters[p]));
                }
                return params.join('&');
            }

            return function (method, url, data, success, error) {
                var client = createXMLHttpObject(), data;
                method = method.toLowerCase();
                if (typeof data === 'object') {
                    data = stringify(data);
                }
                if (method === 'get' && data) {
                    url += '?' + data;
                    data = null;
                }
                client.onreadystatechange = function () {
                    if (client.readyState === 4) {
                        if ((client.status >= 200 && client.status < 300) || client.status == 304) {
                            success && success(client);
                        }
                        else {
                            error && error(client);
                        }
                    }
                };
                client.open(method, url, true);
                method === 'post' && client.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                client.setRequestHeader('ajax', 'true');
                client.send(data);
            };
        })();

        jQueryLite.Event = {
            handlerOrigin: {},
            handler: {},
            fix: function (e) {
                e = e || window.event;
                var event = {};
                event.originEvent = e;
                event.target = e.target || e.srcElement;
                event.preventDefault = function () {
                    return e.preventDefault ?  e.preventDefault() : (e.returnValue = false);
                }
                event.stopPropagation = function () {
                    return e.stopPropagation ? e.stopPropagation() : (e.cancelBubble = true);
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
        };

        return jQueryLite;

    })();

    var Utils = {

        tmpl: (function () {
            var tmplRDelimiter = /{{([#/]?)([^{}]*?)}}/mg,
                tmplRSpace = /[\r\n\t]/mg,
                tmplRQuote = /'/mg,
                tmplRTrim = /^["'\s]*|["'\s]*$/g,
                geneRealClickUrls = function(data, url, abflag, tcount, noEngineUrl) {
                    if (!url) {url = data.titleClickUrl;}
                    if(data && data.socialType && data.socialType === 12 && data.socialId) {
                        if (url.indexOf('?') >= 0) {
                            url = url + '&token=' + XN.get_check;
                        }
                        else {
                            url =  url + '?token=' + XN.get_check;
                        }
                        url = "http://page.renren.com/api/rd?pid="+data.socialId+"&url="+encodeURIComponent(url); 
                    }
                    if(abflag != "yuliangdownflash" ){
                        abflag = 'abflag=' + abflag + '';
                        if (tcount === 0) {
                            abflag += '&statID=ad_'+data.adzoneId+'_'+data.creative_id+'&level='+tcount;
                        }
                        url += (url.indexOf('?') > -1 ? '&' : '?') + abflag;
                    }
                    if (data.click_url != '' && !noEngineUrl) {
                        return data.click_url +  encodeURIComponent(url);
                    }
                    else {
                        return url;
                    }
                };

            return developmentMode ? 
            function (template) {
                template = template.replace(tmplRSpace, '').replace(tmplRQuote, "\"").replace(tmplRDelimiter, function (s, p1, p2) {
                    if (p1 === '#') {
                        return "<div style=\"display: {{p2?'block':'none'}}\">";
                    }
                    else if (p1 === '/') {
                        return "</div>";
                    }
                    else {
                        return s;
                    }
                });
                return template;
            } : 
            function (template, data) {
                template = template.replace(tmplRSpace, '').replace(tmplRQuote, "\"").replace(tmplRDelimiter, function (s, p1, p2) {
                    if (p1 === '#') {
                        return "'+(function(){if("+p2+"){return '";
                    }
                    else if (p1 === '/') {
                        return "'}else{return ''}})()+'";
                    }
                    else if (p2.indexOf(',,,') > -1) {
                        var args = p2.split(','), opt = {};
                        for (var i = 1, arg ; i < args.length ; i += 1) {
                            arg = args[i].split('=');
                            opt[arg[0].replace(tmplRTrim, '')] = arg[1].replace(tmplRTrim, '');
                        }
                        return "'+(function(){return '"+geneRealClickUrls.apply(null, [data, data[args.shift()], opt.abflag, parseInt(opt.tcount), opt.noEngineUrl])+"'})()+'";
                    }
                    else {
                        return "'+("+p2+")+'";
                    }
                });
                return new Function("obj", "with(obj){return '" + template + "'}")(data);
            }
        })(),

        extend: function (obj, objn) {
            for (var i = 1, key ; i < arguments.length ; i += 1) {
                for (key in arguments[i]) {
                    obj[key] = arguments[i][key];
                }
            }
            return obj;
        },

        PubSub: {
            sub: function(ev, callback) {
                var calls = this._callbacks || (this._callbacks = {});
                (this._callbacks[ev] || (this._callbacks[ev] = [])).push(callback);
                return this;
            },
            pub: function() {
                var args = Array.prototype.slice.call(arguments, 0);
                var ev   = args.shift();
                var list, calls, i, l;
                if (!(calls = this._callbacks)) return this;
                if (!(list  = this._callbacks[ev])) return this;
                for (i = 0, l = list.length; i < l; i++)
                list[i].apply(this, args);
                return this;
            }
        }
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

        render: function (template) {
            console.log('Jebe.load', template, this.templateData)
            var i, j, adzone, html, script, rr = +new Date(), self = this;
            var stat = 0;
            for (i = 0 ; i < template.length ; i += 1) {
                console.log('template', template[i])
                adzone = $('#'+this.adzonePrex + this.templateData[i].adzone_id)[0];
                script = document.createElement('script');
                try {
                    script.appendChild(document.createTextNode('window["'+this.randJSRepoVar+'"]['+template[i].adzone_id+']=(function($, data){'+template[i].js+'})'));
                }
                catch (e) {
                    script.text = 'window["'+this.randJSRepoVar+'"]['+template[i].adzone_id+']=(function($, data){'+template[i].js+'})';
                }
                adzone.appendChild(script);
                html = '';
                for (j = 0 ; j < this.templateData[i].ads.length ; j += 1) {
                    console.log('data', eval("("+this.templateData[i].ads[j].widget+")"), this.templateData[i].ads[j].ad_param)
                    //'ad'+this.templateData[i].ads[j].ad_param.creative_id+'_'+rr+'_adbox'+this.templateData[i].adzone_id
                    //html += template[i].html.replace(new RegExp(template[i].placeholder, 'g'), 'ad'+this.templateData[i].ads[j].ad_param.creative_id);
                    this.templateData[i].ads[j].data = Utils.extend({},this.templateData[i].ads[j].ad_param, eval("("+this.templateData[i].ads[j].widget+")"));
                    //this.templateData[i].ads[j].data.userId = globalOptions.userId;
                    html += Utils.tmpl(template[i].html, this.templateData[i].ads[j].data);
                    html = '<div class="jebe-ad" id="ad' + self.templateData[i].ads[j].data.creative_id + '"><div class="jebe-utils"></div><div class="jebe-ad-body">' + html + '</div></div>';
                }
                adzone.innerHTML = html;
                if (adzone.getAttribute('controls') !== null) {
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
                    })(window[this.randJSRepoVar][template[i].adzone_id], [this.factory('ad'+this.templateData[i].ads[j].ad_param.creative_id), this.templateData[i].ads[j].data]);
                }
                try {
                    delete window[this.randJSRepoVar];
                }
                catch (e) {
                    window[this.randJSRepoVar] = undefined;
                }
                if (developmentMode) {
                    this.bridge = {};
                    this.data = {};
                    this.compileHTML(adzone);
                    
                    for (var v in this.templateData[0].ads[0].data) {
                        for (var i = 0, len = this.bridge[v].length ; i < len ; i += 1) {
                            var value = '';
                            for (var j = 0 ; j < this.bridge[v][i].value.length ; j += 1) {
                                value += this.templateData[0].ads[0].data[this.bridge[v][i].value[j]];
                            }
                            this.bridge[v][i].node.nodeValue = value;
                        }
                    }
                }
            }
        },

        compileHTML: function (element) {
            var attributes = element.attributes;
            for (var i = 0, len = attributes.length ; i < len ; i += 1) {
                var attribute = attributes[i];
                var m = /{{(.+?)}}/.exec(attribute.value);
                if (m) {
                    var v = m[1].replace(/\s+/g, '').split('+');
                    for (var j = 0 ; j < v.length ; j += 1) {
                        if (!bridge[v[j]]) {
                            bridge[v[j]] = [];
                        }
                        bridge[v[j]].push({
                            node: attribute,
                            value: v
                        });
                    }
                }
            }
            var childNodes = element.childNodes;
            for (var i = 0, len = childNodes.length ; i < len ; i += 1) {
                var childNode = childNodes[i];
                if (childNode.nodeType === 1) {
                    arguments.callee(childNode);
                }
                else if (childNode.nodeType === 3) {
                    var m = /{{(.+?)}}/.exec(childNode.nodeValue);
                    if (m) {
                        var v = m[1].replace(/\s+/g, '').split('+');
                        for (var j = 0 ; j < v.length ; j += 1) {
                            if (!bridge[v[j]]) {
                                bridge[v[j]] = [];
                            }
                            bridge[v[j]].push({
                                node: childNode,
                                value: v
                            });
                        }
                    }
                }
            }
        },

        refresh: function () {
            Utils.PubSub.pub('refresh', this.getAttribute('data-index'));
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

            Utils.PubSub.sub('refresh', function (index) {
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

    var JebeApi = {

        RestRequests: Class({

            init: function (adID, widgetID, widgetVersion) {
                this.uid = globalOptions.userId;
                this.adID = adID;
                this.widgetID = widgetID;
                this.widgetVersion = widgetVersion;
                this.requests = [];
            },

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
                    $.ajax('post', 'http://rest.widgetbox.jebe.renren.com/widgetboxs/rest/execute.htm', '&content=' + this.toString(this.requests), onSuccess, onError);
                }
            },

            toString: function (obj) {
                if (obj.push) {
                    var tmp = [];
                    for (var i = 0 ; i < obj.length ; i++ ) {
                        tmp.push(this.toString(obj[i]));
                    }
                    return '[' + tmp.join(',') + ']';
                }
                else {
                    var tmp = [];
                    for (var key in obj) {
                        tmp.push('"' + key + '":' + obj[key]);
                    }
                    tmp = tmp.join(',');
                    return '{' + tmp + '}';
                }
            }
        }),

        RequestParam: function (serviceType, methodType, parameter, key, concurrent) {
            this.serviceType = serviceType;
            this.methodType = methodType;
            this.parameter = parameter;
            this.key = key;
            this.concurrent = false;
        },

        PersonRequest: (function () {
            var obj = {};
            var method = ['getFriendList', 'getFriendListByFans', 'getFriendListByIsFans', 'getFriendListByVoted', 'getFriendListByZaned',
                            'getFriendListByFansXce', 'getFriendListByVotedHbase', 'getFriendListByZanedHbase', 'p9', 'getFriendsListBySocial',
                            'getCountBySocial', 'getJoinedBySocial', 'p13', 'getFriendListByVideolikeHbase'];
            for (var i = 1 ; i < 15 ; i += 1) {
                obj[method[i]] = function (params, returnKey, concurrent) {
                    return new JebeApi.RequestParam('1', i.toString(), params, returnKey, concurrent);
                }
            }
            return obj;
        })(),

        ActionRequest: (function () {
            var obj = {};
            var method = ['smsRequest', 'becomeFansRequest',
                            'isFans', 'getFansCount', 'getPageName', 'vote', 'getVoteCounts',
                            'zan', 'getZanCounts', 'p13', 'p14', 'sendWidgetClickLog',
                            'sendVideoLike', 'getVideo', 'setVideo', 'AddPage2Friend', 'likeAd',
                            'unLikeAd', 'getAdLikeCount', 'getLikedAds', 'blockAd', 'sendFeed'];
            for (var i = 4 ; i < 26 ; i += 1) {
                obj[method[i]] = function (params, returnKey, concurrent) {
                    return new JebeApi.RequestParam('2', i.toString(), params, returnKey, concurrent);
                }
            }
            return obj;
        })(),

        DataRequest: (function () {
            var obj = {};
            var method = ['newAddRequest', 'newAddMuchRequest', 'newRemoveRequest', 'newRemoveMuchRequest', 'newGetRequest',
                            'newGetMuchRequest', 'newAddOneRequest', 'voteRequest', 'getVoteCountRequest', 'zanRequest',
                            'getZanCountRequest', 'p12', 'getQuestionaryList', 'p14', 'p15',
                            'answerQuestionary'];
            for (var i = 1 ; i < 17 ; i += 1) {
                obj[method[i]] = function () {
                    var args = Array.prototype.slice.call(arguments, 0);
                    var concurrent = args.pop();
                    var returnKey = args.pop();
                    var params = {};
                    if (Object.prototype.toString.call(args[0]) === '[object Object]') {
                        params = args[0];
                    }
                    else {
                        Utils.extend(params, args);
                    }
                    return new JebeApi.RequestParam('3', i.toString(), params, returnKey, concurrent);
                }
            }
            return obj;
        })()

    }; 

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
                        userID : globalOptions.userId
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
            
            $.ajax('get','http://ebp.renren.com/ebpn/close.html?cid=' + this.opt.adparam.creative_id);    //向引擎发送关闭请求
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
        
        var userid = globalOptions.userId;
        var loc = encodeURIComponent(window.location.href);
        
        var time = new Date().valueOf();
        var param =  '&log_tag=' + log_tag + '&url=' + clickUrl + '&adzone_id=' + adzone_id + '&creative_id=' + creative_id + '&member_id=' + userid + '&location=' + loc + '&widget_id=' + widget_id + '&widget_version=' + widget_version + '&time=' + time;
        if(typeof customName != "undefined" && customName != "") {
            param += '&' + customName + '=' + customValue;
        }
        
        $.ajax('post', 'http://rest.widgetbox.jebe.renren.com/widgetboxs/rest/widget', param);
        
    }

    JebeManager.API = {
        Like: function (o) {
            return new Like(o);
        },
        Close: function (o) {
            return new Close(o);
        }
    };

    JebeManager.Jebe = Jebe;

    //return new JebeLoader(globalOptions.ebpSrc);

});