JebeManager.define(function (opt) {

    var NS = opt.ns;

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
        var query = function (query, parent) {
            parent = parent || document;
            if (parent.querySelectorAll) {
                if (parent === document) {
                    return document.querySelectorAll(query);
                }
                var oldID = parent.id;
                parent.id = 'rooted' + (++arguments.callee.counter);
                try {
                    return parent.querySelectorAll('#' + parent.id + ' ' + query);
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
                var regex = /\S+\s*/;
                var section = regex.exec(query);
                if (section) {
                    var remain = query.slice(section[0].length);
                    section = section[0].replace(/\s+$/, '');
                    var result = [];
                    var id;
                    var tagName;
                    var className;
                    var level = section.split('.');

                    if (level[0].charAt(0) === '#') {
                        id = level[0].slice(1);
                    }
                    else {
                        tagName = level[0];
                    }

                    if (level[1]) {
                        className = level[1];
                    }

                    for (var i = 0, len = parent.length ; i < len ; i++) {
                        var elem = parent[i];
                        var nodeList;
                        if (id) {
                            result.push(document.getElementById(id));
                            continue;
                        }
                        else if (tagName) {
                            nodeList = elem.getElementsByTagName(tagName);
                        }
                        if (className) {
                            if (!nodeList) {
                                nodeList = elem.getElementsByTagName('*');
                            }
                            var regexClassName = new RegExp('(^|\\s)' + className + '(\\s|$)');
                            for (i = 0, len = nodeList.length ; i < len ; i++) {
                                if (regexClassName.test(nodeList[i].className)) {
                                    result.push(nodeList[i]);
                                }
                            }
                        }
                        else {
                            result = result.concat(dom.Tool.toArray(nodeList));
                        }
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

        return query;
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

    var Jebe = Class({

        init: function (templateData) {
            this.templateData = templateData;
            this.templateBaseUrl = 'http://jebe.xnimg.cn/widgetbox/main/content/';
            this.adzonePrex = 'ad';
            this.jsRepo = {};

            this.load();
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
            this.templateBaseUrl += NS + '_template.';
            loadJS(this.templateBaseUrl, function () {
                self.render(window[NS + '_template']);
            });
        },

        render: function (tmpl) {console.log(tmpl)
            var i, j, adzone, html, rr = +new Date();
            for (i = 0 ; i < tmpl.length ; i += 1) {
                adzone = $('#'+this.adzonePrex + tmpl[i].adzone_id)[0];
                html = '';
                for (j = 0 ; j < this.templateData[i].ads.length ; j += 1) {
                    //'ad'+this.templateData[i].ads[j].ad_param.creative_id+'_'+rr+'_adbox'+this.templateData[i].adzone_id
                    html += '<a data-index="'+i+'" class="jebe-refresh" href="#">refresh</a>'+tmpl[i].html.replace(new RegExp(tmpl[i].placeholder, 'g'), 'ad'+this.templateData[i].ads[j].ad_param.creative_id);
                }
                adzone.innerHTML = html;
                this.jsRepo[tmpl[i].adzone_id] = eval('(function(){'+tmpl[i].js+';return init;})()');
                for (j = 0 ; j < this.templateData[i].ads.length ; j += 1) {
                    try {
                        this.jsRepo[tmpl[i].adzone_id](eval("("+this.templateData[i].ads[j].widget+")"),this.templateData[i].ads[j].ad_param, this.factory('ad'+this.templateData[i].ads[j].ad_param.creative_id));
                    } catch (e) {console.error(e.toString())}
                }
                $('.jebe-refresh', adzone)[0].onclick = this.refresh;
            }
        },

        refresh: function () {
            PubSub.publish('refresh', this.getAttribute('data-index'));
            return false;
        },

        factory: function (idPrex) {
            return {
                getElementById: function (id) {
                    return document.getElementById(idPrex + id);
                }
            }
        }

    });

    var JebeLoader = Class({

        init: function (src) {
            console.log(window[NS+'_json'])

            var self = this;

            PubSub.subscribe('refresh', function (index) {
                self.load('refresh_source='+index);
            });

            this.src = src;
            this.autoRefresh();

            new Jebe(window[NS+'_json'].list);
        },

        reset: function (src) {
            this.src = src;
            this.autoRefresh();
            new Jebe(window[NS+'_json'].list);
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
            }, parseFloat(window[NS+'_json'].udpate_interval) * 100);
        },

        load: function (data) {
            var src = this.src + '&' + data, self = this;

            loadJS(src, function () {
                new Jebe(window[NS+'_json'].list);
            });
        }

    });

    return new JebeLoader(opt.src);

});
