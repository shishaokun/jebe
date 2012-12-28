// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
(function ($) {

    if ('onpropertychange' in document) {
        $.event.special.input = {
            setup: function () {
                $(this).one('keyup paste', function (event) {
                    $.event.trigger('input', null, this);
                })
                $.event.add(this, 'propertychange', function (event) {
                    if (event.originalEvent.propertyName === 'value') {
                        $.event.trigger('input', null, this);
                    }
                });
            },
            teardown: function () {
                $.event.remove(this, 'propertychange');
            }
        };
    };

    jQuery.fn.input = function (data, fn) {
        if (fn == null) {
            fn = data;
            data = null;
        }
        return arguments.length > 0 ? this.on('input', null, data, fn) : this.trigger('input');
    };;

})(jQuery);

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