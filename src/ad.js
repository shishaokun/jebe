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

            loadJS(src, function () {
                if (JebeLoader) {
                    JebeLoader.reset(src);
                }
                else {
                    loadJS('jebe.js');
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

JebeManager({ns: 'jebe'}).load('http://www.renren.com/109224573');
