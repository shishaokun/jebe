
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
            this.errorMsg = {
                required: '不能为空',
                maxlength: '',
                minlength: '太短'
            };
            this.models = models;

            this.models.each(function (index, item) {
                item.$errors = {};
                $(item).on('input', $.proxy(self.onInput, self));
            });
        },

        onInput: function (e) {
            var self = this, element = $(e.target);

            if ($.inArray(element.attr('type'), self.types) > -1) {
                self[element.attr('type')](element);
                self.error(element);
            }

            $.each(self.attributes, function (index, attr) {
                if (element.attr(attr) !== undefined) {
                    self[attr](element);
                    self.error(element);
                }
            });
        },

        error: function (element) {
            var valid = true, key;
            element.siblings('.jebe-error').remove();
            element.removeClass('jebe-valid jebe-invalid');
            for (key in element[0].$errors) {
                if (element[0].$errors[key]) {
                    valid = false;
                    element.after('<p class="jebe-error">'+this.errorMsg[key]+'</p>')
                }
            }
            if (valid) {
                element.addClass('jebe-valid');
                var maxlength = element.attr('maxlength');
                if (maxlength !== undefined) {
                    element.after('<p class="jebe-error jebe-counter">还可以输入'+(Number(maxlength) - $.trim(element.val()).length)+'个汉字</p>');
                }
            }
            else {
                element.addClass('jebe-invalid');
            }
            
        },

        number: function (element) {
            element[0].$errors.number = !Validate.rNumber.test(element.val());
        },

        email: function (element) {

        },

        url: function (element) {

        },

        required: function (element) {
            element[0].$errors.required = $.trim(element.val()) === '';
        },

        maxlength: function (element) {
            element[0].$errors.maxlength = $.trim(element.val()).length > Number(element.attr('maxlength'));
        },

        minlength: function (element) {
            element[0].$errors.minlength = $.trim(element.val()).length < Number(element.attr('minlength'));
        },

        max: function (element) {
            
        },

        min: function (element) {
            
        },

        pattern: function (element) {
            element[0].$errors.pattern = !new RegExp(element.attr('pattern')).test(element.val());
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
