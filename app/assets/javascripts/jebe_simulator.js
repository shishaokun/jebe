
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

(function(undefined) {

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

    var Validate = Class({
        init: function (models) {
            var self = this;

            this.types = ['number', 'email', 'url'];
            this.attributes = ['required', 'maxlength', 'minlength', 'max', 'min', 'pattern'];
            this.models = models;

            this.models.each(function (index, item) {
                item = $(item);
                item.on('input', $.proxy(self.onInput, self));
            });
        },

        onInput: function (e) {
            var self = this, element = $(e.target);

            if ($.inArray(element.attr('type'), self.types) > -1) {
                self[element.attr('type')](element);
            }

            $.each(self.attributes, function (index, attr) {
                if (element.attr(attr) !== undefined) {
                    self[attr](element);
                }
            });
        },

        number: function (element) {
            if (Validate.rNumber.test(element.val())) {
                element.addClass('jebe-valid');
            }
            else {
                element.addClass('jebe-invalid');
            }
        },

        email: function (element) {

        },

        url: function (element) {

        },

        required: function (element) {

        },

        maxlength: function (element) {
            
        },

        minlength: function (element) {
            
        },

        max: function (element) {
            
        },

        min: function (element) {
            
        },

        pattern: function (element) {
            
        }
    });

    Validate.rNumber = /^\d+(?:\.\d+)$/;

    var JebeSimulator = Class({
        init: function() {
            this.app = $('[jebe-app]');
            this.models = $('[jebe-model]');
            this.simulator = $('[jebe-simulator]');
            this.fackInterface = [
                {
                ads: [
                    {
                    ad_param: {}
                }
                ],
                adzone_id: '0'
            }
            ];
            var self = this;
            this.simulator.on('load', function() {
                self.simulator = self.simulator[0].contentWindow;
                self.simulator.name = window.jebePreviewTmpl;
                self.simulator.send(self.fackInterface);
                self.models.each(function(index, item) {
                    item = $(item);
                    item.attr('name', item.attr('jebe-model'));
                    if (item.attr('type') === 'text' || item[0].nodeName === 'textarea') {
                        item.on('input', $.proxy(self.oninput, self));
                    }
                    else if (item.attr('type') === 'file') {
                        item.attr('data-url', '/upload');
                        item.fileupload({
                            dataType: 'json',
                            done: function (e, data) {
                                item.attr('data-value', data.result.files[0]);
                                self.trigger();
                            }
                        });
                    }
                    else {
                        item.on('change', $.proxy(self.onchange, self));
                    }
                });
            });
            
            new Validate(this.models);
        },
        trigger: function() {
            var data = {};
            this.models.each(function(index, item) {
                item = $(item);
                if (item.attr('type') === 'file') {
                    data[item.attr('jebe-model')] = item.attr('data-value');
                }
                else {
                    data[item.attr('jebe-model')] = item.val();
                }
            });
            this.fackInterface[0].ads[0].ad_param = data;
            return this.simulator.send(this.fackInterface);
        },
        oninput: function(e) {
            return this.trigger(e.target.value);
        },
        onchange: function(e) {
            return this.trigger(e.target.value);
        }
    });

    $(function() {
        return new JebeSimulator;
    });

}).call(this);

document.domain = 'renren.com';
