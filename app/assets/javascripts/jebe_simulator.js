
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
            this.attributes = ['required', 'maxlen', 'minlen', 'maxlength', 'minlength', 'max', 'min', 'pattern'];
            this.errorMsg = {
                required: '不能为空',
                maxlen: '太长',
                minlen: '太短'
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
                var maxlen = element.attr('maxlen');
                if (maxlen !== undefined) {
                    element.after('<p class="jebe-error jebe-counter">还可以输入'+Math.floor((Number(maxlen) - this.getBytes($.trim(element.val())))/2)+'个汉字</p>');
                }
            }
            else {
                element.addClass('jebe-invalid');
            }
            
        },

        getBytes: function (str) {
            var cArr = str.match(/[^\u0000-\u00ff]/img);
　　        return str.length + (cArr == null ? 0 : cArr.length);
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

        maxlen: function (element) {
            element[0].$errors.maxlen = this.getBytes($.trim(element.val())) > Number(element.attr('maxlen'));
        },

        minlen: function (element) {
            element[0].$errors.minlen = this.getBytes($.trim(element.val())) < Number(element.attr('minlen'));
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

    $.fn.ajaxFileUpload = function (opt) {
        opt = $.extend({
            url: '/jebe/uploadFile',
            context: null,
            beforeSend: function () {},
            success: function () {}
        }, opt);
        return this.each(function (index, element) {
            element = $(element);
            var iframeId = 'iframeForAjaxFileUpload' + +new Date;
            var iframe = $('<iframe id="' + iframeId + '" style="display: none">');
            var form = $('<form action="' + (opt.url || element.attr('url')) + '" target="' + iframeId + '" method="post" enctype="multipart/form-data">');
            form.append('<input type="hidden" name="width" value="'+element.attr('width')+'">');
            form.append('<input type="hidden" name="width" value="'+element.attr('height')+'">');
            form.insertBefore(element);
            form.append(element);
            form.append(iframe);
            iframe.on('load', function () {
                var response = $.parseJSON(this.contentWindow.document.body.innerHTML);
                opt.success.call(opt.context || element.get(0), response);
            });
            element.on('change', function () {
                form[0].submit();
            });
        });
    };

    var FileUpload = Class({

        init: function (opt) {
            this.opt = $.extend({
                element: null
            }, opt);

            this.trigger = $(this.opt.element);

            this.field = this.trigger.clone(false);
            this.field.attr('type', 'hidden');
            this.field.removeAttr('id');
            this.field.insertBefore(this.trigger);

            this.progress = $('<div class="loading-s"><img src="http://static.jebe.renren.com/bolt/img/loading-s.gif" />&nbsp;&nbsp;正在上传中...</div>');
            this.finish = $('<div class="finish">图片上传成功，若需删除请<a href="javascript:;">点此</a>。</div>');

            this.trigger.ajaxFileUpload({
                context: this,
                beforeSend: function () {
                    this.progress.insertAfter(this.field);
                },
                success: function (data) {
                    this.progress.remove();
                    if (data.result === 1) {
                        this.field.val(data.mediaUri).trigger('change');
                        this.finish.insertAfter(this.field);
                        this.finish.find('a').on('click', $.proxy(this.remove, this));
                        this.trigger.val('').hide();
                    }
                    else{
                        //show error
                    }
                }
            });
        },

        remove: function (e) {
            $.ajax({
                url: '/jebe/removeUploadedFile',
                type: 'post',
                data: {'mediaUri': this.field.val()},
                dataType: 'json',
                context: this,
                success: function (data) {
                    if (data.result === 1) {
                        this.finish.remove();
                        this.field.val('').trigger('change');
                        this.trigger.show();
                    }
                    else{
                        //show error
                    }
                }
            });
            e.preventDefault();
        }
    });

    var JebeSimulator = Class({
        init: function() {
            this.app = $('[jebe-app]');
            this.simulator = $('[jebe-simulator]');
            this.models = $('[jebe-model]', this.app);
            this.fackInterface = [
                {
                ads: [
                    {
                        ad_param: {},
                        widget: '{"media_uri": "", "creative_id": 0}'
                    }
                ],
                adzone_id: '0'
            }
            ];
            var self = this;

            this.simulator.on('load', function() {
                self.simulator = self.simulator[0].contentWindow;
                //self.simulator.name = window.jebePreviewTmpl;
            });
            
            this.models.each(function(index, item) {
                item = $(item);
                item.attr('name', item.attr('jebe-model'));
                item.attr('id', item.attr('jebe-model'));
                if (item.attr('type') === 'text' || item[0].nodeName === 'TEXTAREA') {
                    item.on('input', $.proxy(self.trigger, self));
                }
                else if (item.attr('type') === 'file') {
                    new FileUpload({element: item});
                    new Validate(item.parent().siblings('[name='+item.attr('jebe-model')+']'));
                    item.parent().siblings('[name='+item.attr('jebe-model')+']').on('change', $.proxy(self.trigger, self));
                }
                else {
                    item.on('change', $.proxy(self.trigger, self));
                }
            });
            new Validate(this.models.not('[type=file]'));

            this.timer = null;
        },
        trigger: function() {
            clearTimeout(this.timer);
            this.timer = setTimeout($.proxy(function () {
                var data = {};
                this.models.each(function(index, item) {
                    item = $(item);
                    if (item.attr('type') === 'file') {
                        data[item.attr('jebe-model')] = item.parent().siblings('[name='+item.attr('jebe-model')+']').val();
                    }
                    else {
                        data[item.attr('jebe-model')] = item.val();
                    }
                });
                this.fackInterface[0].ads[0].ad_param = data;
                this.simulator.send && this.simulator.send([{html: window.jebePreviewTmplHTML, js: window.jebePreviewTmplJS}], this.fackInterface);
            }, this), 1000);
        }
    });

    $(function() {
        return new JebeSimulator;
    });

}).call(this);

document.domain = 'renren.com';
