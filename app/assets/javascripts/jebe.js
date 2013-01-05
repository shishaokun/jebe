JebeManager.define(function (opt) {

    var NS = 'jebe';

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
            if (false&&parent.querySelectorAll) {
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

    var Addons = {
        destroy: Class({
            init: function () {
            
            }
        }),

        tmpl: function (data) {

        }
    };


    var Jebe = Class({

        init: function (templateData) {
            this.templateData = templateData;
            this.templateBaseUrl = 'http://jebe.xnimg.cn/widgetbox/main/content/';
            this.adzonePrex = 'ad';
            this.jsRepo = {};

            //this.load();
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

        render: function (tmpl) {
            //console.log(tmpl)
            var i, j, adzone, html, script, rr = +new Date(), self = this;
            for (i = 0 ; i < tmpl.length ; i += 1) {
                adzone = $('#'+this.adzonePrex + tmpl[i].adzone_id)[0];
                html = '';
                if (adzone.getAttribute('controls') === '') {
                    html += '<a data-index="'+i+'" class="jebe-next" href="#">next</a>';
                }
                for (j = 0 ; j < this.templateData[i].ads.length ; j += 1) {
                    //'ad'+this.templateData[i].ads[j].ad_param.creative_id+'_'+rr+'_adbox'+this.templateData[i].adzone_id
                    html += tmpl[i].html//.replace(new RegExp(tmpl[i].placeholder, 'g'), 'ad'+this.templateData[i].ads[j].ad_param.creative_id);
                    html = html.replace(/{{(.+?)}}/mg, function (s, p) {
                        if (self.templateData[i].ads[j].ad_param[p]) {
                            return self.templateData[i].ads[j].ad_param[p];
                        }
                        else {
                            return '';
                        }
                    });
                }
                adzone.innerHTML = html;
                script = document.createElement('script');
                try {
                    script.appendChild(document.createTextNode('(function(){'+tmpl[i].js+';JebeManager.jsRepo['+tmpl[i].adzone_id+'] = init;})()'));
                }
                catch (e) {
                    script.text = '(function(){'+tmpl[i].js+';JebeManager.jsRepo['+tmpl[i].adzone_id+'] = init;})()';
                }
                adzone.appendChild(script);
                for (j = 0 ; j < this.templateData[i].ads.length ; j += 1) {
                    (function (init, args) {
                        setTimeout(function () {
                            init.apply(window, args);
                        }, 0);
                    })(JebeManager.jsRepo[tmpl[i].adzone_id], [eval("("+this.templateData[i].ads[j].widget+")"),this.templateData[i].ads[j].ad_param, this.factory('ad'+this.templateData[i].ads[j].ad_param.creative_id)]);
                }
                if (adzone.getAttribute('controls') === '') {
                    $('.jebe-next', adzone)[0].onclick = this.refresh;
                }
            }
        },

        refresh: function () {
            PubSub.publish('refresh', this.getAttribute('data-index'));
            return false;
        },

        factory: function (prex) {
            var query = function (selector) {
                return $(selector.replace(/#|=/g, '$1' + prex));
            };
            query.getElementById = function (id) {
                return $('#'+ prex + id)[0];
            };
            query.getElementsByName = function (name) {
                return $('[name=' + prex + name + ']');
            };
            return query;
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
            //this.autoRefresh();

            new Jebe(window[NS+'_json'].list).load();
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
            }, parseFloat(window[NS+'_json'].udpate_interval) * 1000);
        },

        load: function (data) {
            var src = this.src + '&' + data, self = this;

            loadJS(src, function () {
                (new Jebe(window[NS+'_json'].list)).load();
            });
        }

    });

    JebeManager.jsRepo = {};

    JebeManager.Jebe = Jebe;
    JebeManager.JebeLoader = JebeLoader;

});
