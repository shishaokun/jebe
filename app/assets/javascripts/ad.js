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


    window.JebeManager = {
        src: null,
        JebeLoader: null,
        define: function (fn) {
            this.JebeLoader = new fn({
                epbSrc: this.src,
                userId: XN.cookie.get('id')
            });
        },
        load: function (r) {
            var src = 'http://ebp.renren.com/ebpn/show?var=jebe_json&t=' + +new Date(), self = this;
            if (/\.renren\.com/.test(r)) {
                src += '&userid='+XN.user.id+'&isvip='+XN.user.isVip+'&hideads='+XN.user.hideAds+(XN.pageId?'&pageType='+XN.pageId:'');
                if (XN.app.share && XN.app.share.pageInfo ) { r = r.replace(/\?.*$/,'') + '?shareType=' + XN.app.share.pageInfo.type; }
            }
            src += '&r=' + encodeURIComponent(r || location.href);

            this.src = src;

            loadRes(src, function () {
                if (self.JebeLoader) {
                    self.JebeLoader.reset(src);
                }
                else {
                    loadRes('http://developer.renren.com/assets/jebe.js');
                    loadRes('http://developer.renren.com/assets/widgetbox.css');
                }
            });
        }
    }

})();

document.domain = 'renren.com';

XN.user = {
    id: "109224573",
    isVip: false,
    hideAds: false
}
XN.pageId = 'home';
XN.jebe = {};



JebeManager.load({
    epbSrc: 'http://www.renren.com/109224573'
});
