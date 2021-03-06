/*! iBox v2.0.4 ~ (c) 2013 Max Zhang, https://github.com/maxzhang/ibox2 */
/**
 * @class klass.Base
 *
 * Class基类，使用Klass.define()方法声明类继承的顶级父类
 */
(function(window) {
    var slice = Array.prototype.slice,
        enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'],
        noArgs = [],
        TemplateClass = function() {},
        chain = function(object) {
            TemplateClass.prototype = object;
            var result = new TemplateClass();
            TemplateClass.prototype = null;
            return result;
        },
        apply = function(object, config) {
            if (object && config && typeof config === 'object') {
                var i, j, k;

                for (i in config) {
                    object[i] = config[i];
                }

                if (enumerables) {
                    for (j = enumerables.length; j--;) {
                        k = enumerables[j];
                        if (config.hasOwnProperty(k)) {
                            object[k] = config[k];
                        }
                    }
                }
            }
        };
    
    var Base = function() {};
    apply(Base, {
        $isClass: true,

        extend: function(SuperClass) {
            var superPrototype = SuperClass.prototype,
                basePrototype, prototype, name;

            prototype = this.prototype = chain(superPrototype);
            this.superclass = prototype.superclass = superPrototype;

            if (!SuperClass.$isClass) {
                basePrototype = Base.prototype;
                for (name in basePrototype) {
                    if (name in prototype) {
                        prototype[name] = basePrototype[name];
                    }
                }
            }
        },

        /**
         * 新增或重写一个static属性
         *
         *     var MyCls = Klass.define({
         *         ...
         *     });
         *
         *     MyCls.addStatics({
         *         someProperty: 'someValue',      // MyCls.someProperty = 'someValue'
         *         method1: function() { ... },    // MyCls.method1 = function() { ... };
         *         method2: function() { ... }     // MyCls.method2 = function() { ... };
         *     });
         *
         * @param {Object} members
         * @return {Base} this
         * @static
         */
        addStatics: function(members) {
            var member, name;
            for (name in members) {
                if (members.hasOwnProperty(name)) {
                    member = members[name];
                    this[name] = member;
                }
            }
            return this;
        },

        addMembers: function(members) {
            var prototype = this.prototype,
                names = [],
                i, ln, name, member;

            for (name in members) {
                names.push(name);
            }

            if (enumerables) {
                names.push.apply(names, enumerables);
            }

            for (i = 0,ln = names.length; i < ln; i++) {
                name = names[i];

                if (members.hasOwnProperty(name)) {
                    member = members[name];

                    if (typeof member == 'function' && !member.$isClass) {
                        member.$owner = this;
                        member.$name = name;
                    }

                    prototype[name] = member;
                }
            }

            return this;
        },

        /**
         * 重写类的属性或方法，例子：
         * <code>
         *  var Cls1 = Klass.define({
         *      constructor: function(name) {
         *          this.name = name;
         *      },
         *
         *      say: function() {
         *          alert(this.name + ' say: hello, world!');
         *      }
         *  });
         *
         *  Cls1.implement({
         *      say: function() {
         *          alert(this.name + ' say: hello, I'm Max, nice to meet you!');
         *      },
         *
         *      sayHello: function() {
         *          alert('hello, world!');
         *      }
         *  });
         *
         *  var cls1 = new Cls1();
         *  cls1.say(); // 输出 'Max say: hello, I'm Max, nice to meet you!'
         *  cls1.sayHello(); // 输出 'hello world!'
         * </code>
         *
         * 如果想为类的方法定义一个新的别名，应该使用下面的方式，不能使用override函数：
         * <code>
         *  Cls1.prototype.speak = Cls1.prototype.say;
         *
         *  var cls1 = new Cls1();
         *  cls1.speak(); // 输出 'Max  say: hello, I'm Max, nice to meet you!'
         * </code>
         *
         * @param {Object} overrides 被添加到类的属性或方法
         * @static
         */
        implement: function() {
            this.addMembers.apply(this, arguments);
        }
    });
    
    // Base类的prototype属性
    apply(Base.prototype, {
        $isInstance: true,
        
        /**
         * 调用当前方法的父类方法，例子：
         * <code>
         *  var Cls1 = Klass.define({
         *      constructor: function(name) {
         *          this.name = name;
         *      },
         *      
         *      say: function() {
         *          alert(this.name + ' say: hello, world!');
         *      }
         *  });
         *  
         *  var Cls2 = Klass.define(Cls1, {
         *      constructor: function() {
         *          thia.callParent(['Max']); // 调用父类的构造函数
         *      }
         *  });
         *  
         *  var cls2 = new Cls2();
         *  cls2.say(); // 输出 'Max say: hello, world!'
         * </code>
         * 
         * @param {Array/Arguments} args 传递给父类方法的形参
         * @return {Object} 返回父类方法的执行结果
         */
        callParent: function(args) {
            var method,
                superMethod = (method = this.callParent.caller) && 
                              (method = method.$owner ? method : method.caller) &&
                               method.$owner.superclass[method.$name];
            
            return superMethod.apply(this, slice.call(args, 0) || noArgs);
        },
        
        // Default constructor, simply returns `this`
        constructor: function() {
            return this;
        }
    });

    window.BaseKlass = Base;
})(window);
/**
 * @class klass.Klass
 *
 * 声明类，类的继承，重写类方法
 */
(function(window) {
    var Base = window.BaseKlass;

    var makeCtor = function() {
        function constructor() {
            return this.constructor.apply(this, arguments) || null;
        }
        return constructor;
    };
    
    var extend = function(newClass, newClassExtend) {
        var basePrototype = Base.prototype,
            SuperClass, superPrototype, name;

        if (newClassExtend && newClassExtend !== Object) {
            SuperClass = newClassExtend;
        } else {
            SuperClass = Base;
        }

        superPrototype = SuperClass.prototype;

        if (!SuperClass.$isClass) {
            for (name in basePrototype) {
                if (!superPrototype[name]) {
                    superPrototype[name] = basePrototype[name];
                }
            }
        }

        newClass.extend(SuperClass);
    };
    
    var Klass = {
        /**
         * 声明一个类，或继承自一个父类，子类拥有父类的所有prototype定义的特性，
         * 如未定义extend属性，默认继承BaseKlass类，例子：
         * <code>
         *  var Cls1 = Klass.define({
         *      constructor: function(name) {
         *          this.name = name;
         *      },
         *      
         *      say: function() {
         *          alert(this.name + ' say: hello, world!');
         *      }
         *  });
         *  
         *  var Cls2 = Klass.define(Cls1, {
         *      constructor: function() {
         *          thia.callParent(['Max']); // 调用父类的构造函数
         *      }
         *  });
         *  
         *  var cls2 = new Cls2();
         *  cls2.say(); // 输出 'Max say: hello, world!'
         * </code>
         *
         * @param {Object} newClassExtend 继承父类
         * @param {Object} overrides 类的属性和方法
         * @return {Klass} The new class
         */
        define: function(newClassExtend, overrides) {
            var newClass, name;

            if (!newClassExtend && !overrides) {
                newClassExtend = Base;
                overrides = {};
            } else if (!overrides) {
                overrides = newClassExtend;
                newClassExtend = Base;
            }
            
            newClass = makeCtor();
            for (name in Base) {
                newClass[name] = Base[name];
            }
            if (overrides.statics) {
                newClass.addStatics(overrides.statics);
                delete overrides.statics;
            }
            extend(newClass, newClassExtend);
            newClass.addMembers(overrides);

            return newClass;
        }
    };
    
    window.Klass = Klass;
})(window);
(function(window) {
    var navigator = window.navigator,
        userAgent = navigator.userAgent,
        android = userAgent.match(/(Android)[\s\/]+([\d\.]+)/),
        ios = userAgent.match(/(iPad|iPhone|iPod)\s+OS\s([\d_\.]+)/),
        wp = userAgent.match(/(Windows\s+Phone)\s([\d\.]+)/),
        isWebkit = /WebKit\/[\d.]+/i.test(userAgent),
        isSafari = ios ? (navigator.standalone ? isWebkit : (/Safari/i.test(userAgent) && !/CriOS/i.test(userAgent) && !/MQQBrowser/i.test(userAgent))) : false,
        os = {},
        toString = Object.prototype.toString,
        slice = Array.prototype.slice;

    if (android) {
        os.android = true;
        os.version = android[2];
    }
    if (ios) {
        os.ios = true;
        os.version = ios[2].replace(/_/g, '.');
        os.ios7 = /^7/.test(os.version);
        if (ios[1] === 'iPad') {
            os.ipad = true;
        } else if (ios[1] === 'iPhone') {
            os.iphone = true;
            os.iphone5 = window.screen.height == 568;
        } else if (ios[1] === 'iPod') {
            os.ipod = true;
        }
    }
    if (wp) {
        os.wp = true;
        os.version = wp[2];
        os.wp8 = /^8/.test(os.version);
    }

    var Utils = {

        BLANK_IMAGE: 'data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',

        /**
         * 移动设备操作系统信息，可能会包含一下属性:
         *
         *  Boolean : android
         *  Boolean : ios
         *  Boolean : ios7
         *  Boolean : ipad
         *  Boolean : iphone
         *  Boolean : iphone5
         *  Boolean : ipod
         *  String : version 系统版本号
         *
         */
        os: os,

        isMobile: function() {
            return os.ios || os.android || os.wp;
        },

        /**
         * 是否webkit内核浏览器
         */
        isWebkit: isWebkit,

        /**
         * 是否safari浏览器
         */
        isSafari: isSafari,

        noop: function() {},

        isDefined: function(val) {
            return typeof val !== 'undefined';
        },

        isString: function(val) {
            return typeof val === 'string';
        },

        isBoolean: function(val) {
            return typeof val === 'boolean';
        },

        isObject: (toString.call(null) === '[object Object]') ? function(value) {
            // check ownerDocument here as well to exclude DOM nodes
            return value !== null && value !== undefined && toString.call(value) === '[object Object]' && value.ownerDocument === undefined;
        } : function(value) {
            return toString.call(value) === '[object Object]';
        },

        isArray: ('isArray' in Array) ? Array.isArray : function(val) {
            return toString.call(val) === '[object Array]';
        },

        isFunction: function(val) {
            return toString.call(val) === '[object Function]';
        },

        proxy:function(fn, scope) {
            return function() {
                return fn.apply(scope, arguments);
            };
        },

        createOrientationChangeProxy: function(fn, scope) {
            return function() {
                clearTimeout(scope.orientationChangedTimeout);
                var args = slice.call(arguments, 0);
                scope.orientationChangedTimeout = setTimeout(Utils.proxy(function() {
                    var ori = window.orientation;
                    if (ori != scope.lastOrientation) {
                        fn.apply(scope, args);
                    }
                    scope.lastOrientation = ori;
                }, scope), os.android ? 300 : 50);
            };
        },

        removeElement: function() {
            var args = slice.call(arguments, 0);
            args.forEach(function(el) {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        },

        addClass: function(elem, value) {
            var classes, cur, clazz, i;
            classes = (value || '').match(/\S+/g) || [];
            cur = elem.nodeType === 1 && ( elem.className ? (' ' + elem.className + ' ').replace(/[\t\r\n]/g, ' ') : ' ');
            if (cur) {
                i = 0;
                while ((clazz = classes[i++])) {
                    if (cur.indexOf(' ' + clazz + ' ') < 0) {
                        cur += clazz + ' ';
                    }
                }
                elem.className = cur.trim();
            }
        },

        removeClass: function(elem, value) {
            var classes, cur, clazz, i;
            classes = (value || '').match(/\S+/g) || [];
            cur = elem.nodeType === 1 && ( elem.className ? (' ' + elem.className + ' ').replace(/[\t\r\n]/g, ' ') : ' ');
            if (cur) {
                i = 0;
                while ((clazz = classes[i++])) {
                    while (cur.indexOf(' ' + clazz + ' ') >= 0) {
                        cur = cur.replace(' ' + clazz + ' ', ' ');
                    }
                }
                elem.className = cur.trim();
            }
        },

        parsePx: function(px) {
            return px ? parseInt(px.replace(/[^\d]/g, ''), 10) : 0;
        },

        getComputedSize: function(el, outerSize) {
            var style = window.getComputedStyle(el, null),
                w, h, iw, ih, ow, oh;
            if (!Utils.isDefined(outerSize)) {
                w = el.offsetWidth;
                h = el.offsetHeight;
                iw = w - Utils.parsePx(style.paddingLeft) - Utils.parsePx(style.paddingRight) - Utils.parsePx(style.borderLeftWidth) - Utils.parsePx(style.borderRightWidth);
                ih = h - Utils.parsePx(style.paddingTop) - Utils.parsePx(style.paddingBottom) - Utils.parsePx(style.borderTopWidth) - Utils.parsePx(style.borderBottomWidth);
                ow = w + Utils.parsePx(style.marginLeft) + Utils.parsePx(style.marginRight);
                oh = h + Utils.parsePx(style.marginTop) + Utils.parsePx(style.marginBottom);
            } else {
                if (!Utils.isObject(outerSize)) {
                    outerSize = { width: outerSize };
                }
                ow = outerSize.width;
                oh = outerSize.height;
                if (Utils.isDefined(ow)) {
                    w = ow - Utils.parsePx(style.marginLeft) - Utils.parsePx(style.marginRight);
                    iw = w - Utils.parsePx(style.paddingLeft) - Utils.parsePx(style.paddingRight) - Utils.parsePx(style.borderLeftWidth) - Utils.parsePx(style.borderRightWidth);
                }
                if (Utils.isDefined(oh)) {
                    h = oh - Utils.parsePx(style.marginTop) - Utils.parsePx(style.marginBottom);
                    ih = h - Utils.parsePx(style.paddingTop) - Utils.parsePx(style.paddingBottom) - Utils.parsePx(style.borderTopWidth) - Utils.parsePx(style.borderBottomWidth);
                }
            }
            return {
                width: w < 0 ? 0 : w,
                height: h < 0 ? 0 : h,
                innerWidth: iw < 0 ? 0 : iw,
                innerHeight: ih < 0 ? 0 : ih,
                outerWidth: ow < 0 ? 0 : ow,
                outerHeight: oh < 0 ? 0 : oh
            };
        },

        vendor: (function() {
            var dummyStyle = document.createElement('div').style,
                propVendor = (function () {
                    var vendors = 't,webkitT,MozT,msT,OT'.split(','),
                        t,
                        i = 0,
                        l = vendors.length;

                    for (; i < l; i++) {
                        t = vendors[i] + 'ransform';
                        if (t in dummyStyle) {
                            return vendors[i].substr(0, vendors[i].length - 1);
                        }
                    }

                    return false;
                }()),
                cssVendor = propVendor ? '-' + propVendor.toLowerCase() + '-' : '',
                prefixStyle = function(style) {
                    if (propVendor === '') return style;
                    style = style.charAt(0).toUpperCase() + style.substr(1);
                    return propVendor + style;
                },
                transform = prefixStyle('transform'),
                transition = prefixStyle('transition'),
                transitionProperty = prefixStyle('transitionProperty'),
                transitionDuration = prefixStyle('transitionDuration'),
                transformOrigin = prefixStyle('transformOrigin'),
                transitionTimingFunction = prefixStyle('transitionTimingFunction'),
                transitionDelay = prefixStyle('transitionDelay'),
                transitionEndEvent = (function() {
                    if (propVendor == 'webkit' || propVendor === 'O') {
                        return propVendor.toLowerCase() + 'TransitionEnd';
                    }
                    return 'transitionend';
                }());

            dummyStyle = null;

            return {
                propVendor: propVendor,
                cssVendor: cssVendor,
                transform: transform,
                transition: transition,
                transitionProperty: transitionProperty,
                transitionDuration: transitionDuration,
                transformOrigin: transformOrigin,
                transitionTimingFunction: transitionTimingFunction,
                transitionDelay: transitionDelay,
                transitionEndEvent: transitionEndEvent
            };
        }()),

        listenTransition: function(target, duration, callbackFn) {
            var me = this,
                transitionEndEvent = Utils.vendor.transitionEndEvent,
                clear = function() {
                    if (target.transitionTimer) clearTimeout(target.transitionTimer);
                    target.transitionTimer = null;
                    target.removeEventListener(transitionEndEvent, handler, false);
                },
                handler = function() {
                    clear();
                    if (callbackFn) callbackFn.call(me);
                };
            clear();
            target.addEventListener(transitionEndEvent, handler, false);
            target.transitionTimer = setTimeout(handler, duration + 100);
        },

        queryFunction: function(method) {
            var fn;
            if (method && Utils.isString(method)) {
                fn = window;
                method = method.split('.');
                method.forEach(function(m) {
                    fn = fn[m];
                });
            }
            return fn || Utils.noop;
        },

        dispatchClickEvent: function(e) {
            var target = e.target,
                ev;

            if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
                ev = document.createEvent('MouseEvents');
                ev.initMouseEvent('click', true, true, e.view, 1,
                    target.screenX, target.screenY, target.clientX, target.clientY,
                    e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                    0, null);

                ev._constructed = true;
                target.dispatchEvent(ev);
            }
        }
    };

    window.iBoxUtils = Utils;

})(window);
(function(window) {
    var iBoxUtils = window.iBoxUtils,
        slice = Array.prototype.slice;

    /**
     * @class iBox
     */
    var iBox = Klass.define({
        statics: {
            version: '2.0.4'
        },

        /**
         * @cfg {String} baseCSSPrefix ibox页面元素样式前缀，默认'ibox'
         */
        baseCSSPrefix: 'ibox',

        /**
         * @cfg {String} cls 添加到ibox主容器元素的扩展样式
         */

        /**
         * @cfg {String} headerCls 添加到header元素的扩展样式
         */

        /**
         * @cfg {String} bodyCls 添加到ibox body元素的扩展样式
         */

        /**
         * @cfg {Object} offsets ibox主容器的偏移值
         */
        offsets: { top: 0, bottom: 0 },

        /**
         * 构造函数
         *
         * @param {Element/Object} target (optional) 目标对象 / iBox 主容器对象
         * @param {Object} config (optional) 配置参数
         */
        constructor: function(target, config) {
            if (iBoxUtils.isObject(target)) {
                config = target;
                target = null;
            }
            target = target || document.body;

            config = config || {};
            for (var o in config) {
                this[o] = config[o];
            }

            this.views = {};

            this.render(target);
            this.scrollTop();
            this.resize();

            var first = this.body.children[0];
            if (first) {
                this.slide({ el: first, silent: true });
            }

            this.resizeProxy = iBoxUtils.proxy(this.resize, this);
            this.onOrientationChangedProxy = iBoxUtils.createOrientationChangeProxy(this.onOrientationChanged, this);
            window.addEventListener('resize', this.resizeProxy, false);
            window.addEventListener('orientationchange', this.onOrientationChangedProxy, false);
        },

        // private
        render: function(target) {
            if (!this.rendered) {
                this.rendered = true;

                var elCls = this.baseCSSPrefix,
                    hdCls = this.baseCSSPrefix + '-header',
                    bdCls = this.baseCSSPrefix + '-body';

                this.el = iBoxUtils.isString(target) ? document.querySelector(target) : target;
                iBoxUtils.addClass(this.el, elCls);
                if (this.cls) {
                    iBoxUtils.addClass(this.el, this.cls);
                }

                this.header = this.el.querySelector('.' + hdCls);
                if (!this.header) {
                    this.header = document.createElement('div');
                    this.el.appendChild(this.header);
                }
                iBoxUtils.addClass(this.header, hdCls);
                if (this.headerCls) {
                    iBoxUtils.addClass(this.header, this.headerCls);
                }

                this.body = this.el.querySelector('.' + bdCls);
                if (!this.body) {
                    this.body = document.createElement('div');
                    this.el.appendChild(this.body);
                }
                iBoxUtils.addClass(this.body, bdCls);
                if (this.bodyCls) {
                    iBoxUtils.addClass(this.body, this.bodyCls);
                }

                this.onRender();
            }
        },

        /**
         * @protected
         * 当iBox渲染时调用，可以被子类实现或实例化时重写
         */
        onRender: iBoxUtils.noop,

        /**
         * 重置iBox高宽
         */
        resize: function() {
            var innerWidth = window.innerWidth,
                innerHeight = window.innerHeight,
                screenWidth = window.screen.width,
                screenHeight = window.screen.height,
                offsetTop = this.offsets.top,
                offsetBottom = this.offsets.bottom,
                width = innerWidth, height, headerHeight,
                elSize, headerSize, bodySize;

            offsetTop = iBoxUtils.isFunction(offsetTop) ? offsetTop() : offsetTop;
            offsetBottom = iBoxUtils.isFunction(offsetBottom) ? offsetBottom() : offsetBottom;

            if (iBoxUtils.isSafari && !iBoxUtils.os.ios7) { // 计算高度，收起 iOS6 顶部导航条
                height = window.navigator.standalone ? innerHeight : (window.orientation === 0 ? screenHeight - 44 : screenWidth - 32) - 20;
                height = height < innerHeight ? innerHeight : height;
            } else {
                height = innerHeight;
            }
            height = height - offsetTop - offsetBottom;

            if (width != this.lastWidth || height != this.lastHeight) {
                this.lastWidth = width;
                this.lastHeight = height;

                elSize = iBoxUtils.getComputedSize(this.el, { width: width, height: height });
                headerHeight = iBoxUtils.getComputedSize(this.header).outerHeight;
                headerSize = iBoxUtils.getComputedSize(this.header, { width: elSize.innerWidth, height: headerHeight });
                bodySize = iBoxUtils.getComputedSize(this.body, { width: elSize.innerWidth, height: elSize.innerHeight - headerHeight });

                this.el.style.cssText = 'top:' + offsetTop + 'px;width:' + elSize.innerWidth + 'px;height:' + elSize.innerHeight + 'px;';
                this.header.style.cssText = 'top:0px;width:' + headerSize.innerWidth + 'px;height:' + headerSize.innerHeight + 'px;';
                this.body.style.cssText = 'top:' + headerHeight + 'px;width:' + bodySize.innerWidth + 'px;height:' + bodySize.innerHeight + 'px;';

                if (this.lastView && !this.sliding) this.lastView.resize();
                this.onResize(elSize, headerSize, bodySize);
            }
        },

        /**
         * @protected
         * 当iBox重置高宽时调用，可以被子类实现或实例化时重写
         */
        onResize: iBoxUtils.noop,

        /**
         * 切换视图，接口调用包含以下6种方式：
         *
         *      slide(options);
         *
         *      slide(options, callbacks);
         *
         *      slide(options, reverse);
         *
         *      slide(options, reverse, silent);
         *
         *      slide(options, reverse, callbacks);
         *
         *      slide(options, reverse, silent, callbacks);
         *
         * @param {Object/String} options 切换视图参数
         *      新增视图，传入JSON参数，设置视图
         *      已存在视图，直接传入String类型视图id
         * @param {Boolean/Object} reverse (optional) true视图切换动画反向
         * @param {Boolean/Object} silent (optional) true静默切换视图
         * @param {Object} callbacks (optional) 回调函数，show回调对应下一视图，hide回调对应上一视图
         *      Function : beforeShow
         *      Function : onShow
         *      Function : beforeHide
         *      Function : onHide
         */
        slide: function(options, reverse, silent, callbacks) {
            var me = this,
                args = slice.call(arguments, 0), argLen = args.length,
                lastView = me.lastView, nextView;

            me.scrollTop();

            if (options) {
                if (argLen == 2 && !iBoxUtils.isBoolean(reverse)) {
                    callbacks = reverse;
                    reverse = false;
                } if (argLen == 3 && !iBoxUtils.isBoolean(silent)) {
                    callbacks = silent;
                    silent = false;
                }

                options = iBoxUtils.isString(options) ? { id: options } : options;
                options.id = options.id && (iBoxUtils.isString(options.id) ? options.id : options.id.getAttribute('id'));
                silent = silent === true;
                reverse = reverse === true;
                callbacks = callbacks || {};

                nextView = me.views[options.id];
                if (!nextView) {
                    nextView = new iBox.View(me.body, me.header, options);
                    me.views[nextView.id] = nextView;
                }

                if (lastView != nextView && !me.sliding) {
                    me.sliding = true;

                    if (lastView) {
                        if (callbacks.beforeHide) callbacks.beforeHide(lastView);
                        lastView.slide(reverse, 'out', silent, function() {
                            if (callbacks.onHide) callbacks.onHide(lastView);
                            if (lastView.single !== true) {
                                lastView.destroy();
                                delete me.views[lastView.id];
                            }
                        });
                    } else {
                        silent = true; // 没有前一视图时，直接跳过动画切换，这种情况一般会发生在初始化的时候
                    }

                    if (callbacks.beforeShow) callbacks.beforeShow(nextView);
                    nextView.slide(reverse, 'in', silent, function() {
                        me.lastView = nextView;
                        if (callbacks.onShow) callbacks.onShow(nextView);
                        me.sliding = false;
                        me.resize(); // 这里必须是滑动结束之后，才能重置iBox高宽
                    });
                }
            }
        },

        // private
        scrollTop: function() {
            if (iBoxUtils.isSafari) window.scrollTo(0, 1);
        },

        // private
        onOrientationChanged: function(e) {
            this.scrollTop();
            this.resize();
        },

        /**
         * 销毁iBox对象
         */
        destroy: function() {
            if (!this.destroyed) {
                this.destroyed = true;
                this.beforeDestroy();

                window.removeEventListener('resize', this.resizeProxy, false);
                window.removeEventListener('orientationchange', this.onOrientationChangedProxy, false);

                for (var o in this.view) {
                    this.views[o].destroy();
                    delete this.views[o];
                }
                this.views = this.lastView = null;

                iBoxUtils.removeElement(this.header, this.body);
                this.el = this.header = this.body = null;
                this.onDestroy();
            }
        },

        /**
         * @protected
         * 当iBox销毁之前调用，可以被子类实现或实例化时重写
         */
        beforeDestroy: iBoxUtils.noop,

        /**
         * @protected
         * 当iBox被销毁时调用，可以被子类实现或实例化时重写
         */
        onDestroy: iBoxUtils.noop
    });


    /*
     * 实现 iphone5 分辨率 viewport 兼容，在 iphone5 下，WebApp 被添加到桌面后，从桌面启动时，
     * 可视区域无法达到满屏，所以需要将页面上 viewport width 属性设置为320.1，如下：
     *      <meta name="viewport" content="width=320.1, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0" />
     *
     * 为了适配非 iphone5 设备，仍旧要将 viewport width 设置为 'device-width'
     *
     * Note: 这个问题已在iOS7下被修复。
     */
    (function() {
        function setViewportWidthProperty(value) {
            var viewport = document.querySelector("meta[name=viewport]"),
                content = viewport.content,
                props = content.split(','),
                newProps = [],
                prop,
                wStr = 'width',
                i = 0, len = props.length;
            for (; i < len; i++) {
                prop = props[i].trim().split('=');
                if (prop[0] == wStr) {
                    newProps.push(wStr + '=' + value);
                } else {
                    newProps.push(prop[0] + '=' + prop[1]);
                }
            }
            content = newProps.join(', ');
            if (content.indexOf(wStr + '=') == -1) {
                content = wStr + '=' + value + ', ' + content;
            }
            viewport.content = content;
        }
        if (!iBoxUtils.os.ios7 && iBoxUtils.os.iphone5) {
            setViewportWidthProperty('320.1');
        } else {
            setViewportWidthProperty('device-width');
        }
    }());

    // 声明 AMD / SeaJS module
    if (typeof define === "function" && (define.amd || seajs)) {
        define('ibox', [], function() {
            return iBox;
        });
    }

    window.iBox = iBox;

})(window);
(function(window) {
    var IScroll = window.IScroll,
        iBoxUtils = window.iBoxUtils;

    /**
     * @clsss iBox.View
     */
    var View = Klass.define({
        statics: {
            idSeed: 1000
        },

        /**
         * @cfg {String} id 视图唯一id，会被设置到视图的主节点元素上
         */

        /**
         * @cfg {String} cls 添加到视图主元素的扩展样式
         */

        /**
         * @cfg {Boolean} single true单例视图
         */

        /**
         * @cfg {Class} headerClass header类，默认iBox.GeneralHeader
         */

        /**
         * @cfg {Object/String} header header配置参数，参见Header类API
         */

        /**
         * @cfg {Object/Boolean} iscroll iScroll组件配置参数，也可以设置为false禁用iScroll组件
         */
        iscroll: { scrollX: false, scrollY: true, preventDefault: true, click: true },

        // private
        constructor: function(ct, headerCt, config) {
            config = config || {};
            for (var o in config) {
                this[o] = config[o];
            }

            this.headerKlass = this.headerKlass || iBox.GeneralHeader;

            this.ct = ct;
            this.headerCt = headerCt;
            this.render();
        },

        // private
        makeId: function() {
            return 'ibox-view-gen' + (++View.idSeed);
        },

        // private
        render: function() {
            if (!this.rendered) {
                this.rendered = true;

                if (this.el) {
                    // 从页面中已存在的DOM元素初始化View
                    this.el = iBoxUtils.isString(this.el) ? document.querySelector(this.el) : this.el;
                    this.scroller = this.el.children[0];
                    this.id = this.el.getAttribute('id');
                    this.single = this.el.getAttribute('data-single') !== 'false';
                    this.onRender = iBoxUtils.queryFunction(this.el.getAttribute('data-render'));
                } else {
                    this.el = document.createElement('div');
                    this.scroller = document.createElement('div');
                    this.el.appendChild(this.scroller);
                    this.el.style.cssText = 'display:none;';
                    this.ct.appendChild(this.el);
                }

                if (!this.id) {
                    this.id = this.makeId();
                }
                iBoxUtils.addClass(this.scroller, 'scroller');
                this.el.setAttribute('id', this.id);
                iBoxUtils.addClass(this.el, 'ibox-view');
                if (this.cls) {
                    iBoxUtils.addClass(this.el, this.cls);
                }

                if (iBoxUtils.isString(this.header)) {
                    this.header = { title: this.header };
                }
                this.header = new this.headerKlass(this.id, this.headerCt, this.header);

                if (this.iscroll !== false && IScroll) {
                    this.iscroll = new IScroll(this.el, this.iscroll);
                }

                this.onRender();
            }
        },

        /**
         * @protected
         * 当View渲染时调用，可以被子类实现或实例化时重写
         */
        onRender: iBoxUtils.noop,

        // private
        slide: function(reverse, action, silent, callbackFn) {
            var me = this,
                ct = me.ct, el = me.el,
                cssVendor = iBoxUtils.vendor.cssVendor,
                ctSize = iBoxUtils.getComputedSize(ct),
                elSize = iBoxUtils.getComputedSize(el, { width: ctSize.outerWidth, height: ctSize.outerHeight }),
                beforeCss, afterCss,
                zIndex = 1, shadow,
                offset = 80,
                duration = 350, defer = 50,
                handler;

            me.header.slide(reverse, action, silent);

            if ((action == 'in' && !reverse) || (action == 'out' && reverse)) {
                zIndex = 2;
                shadow = '-5px 0 20px #dddddd';
            }

            afterCss = 'display:block;z-index:' + zIndex + ';opacity:' + (action == 'in' ? 1 : 0.7) + ';' + cssVendor + 'box-shadow:' + shadow + ';width:' + elSize.innerWidth + 'px;height:' + elSize.innerHeight + 'px;' + cssVendor + 'transform:translate3d(' + (action == 'in' ? '0' : (reverse ? ctSize.width : -offset)) + 'px,0px,0px);' + (silent === true ? '' : cssVendor + 'transition:' + cssVendor + 'transform ' + duration + 'ms,opacity ' + duration + 'ms;');
            handler = function() {
                if (action != 'in' && el) {
                    el.style.display = 'none';
                } else if (action == 'in' && me.iscroll) {
                    me.iscroll.refresh();
                }
                if (callbackFn) callbackFn.call(me, elSize);
                me.onSlide();
            };
            if (silent !== true) {
                if (action == 'in') {
                    beforeCss = 'display:block;z-index:' + zIndex + ';opacity:' + (reverse ? 0.5 : 1) + ';' + cssVendor + 'box-shadow:' + shadow + ';width:' + elSize.innerWidth + 'px;height:' + elSize.innerHeight + 'px;' + cssVendor + 'transform:translate3d(' + (reverse ? -offset : ctSize.width) + 'px,0px,0px);';
                    el.style.cssText = beforeCss;
                }
                iBoxUtils.listenTransition(el, duration + defer, handler);
                setTimeout(function() { el.style.cssText = afterCss; }, defer);
            } else {
                el.style.cssText = afterCss;
                handler();
            }
        },

        /**
         * @protected
         * 当View切换时调用，可以被子类实现或实例化时重写
         */
        onSlide: iBoxUtils.noop,

        // private
        resize: function() {
            var me = this;
            me.slide(false, 'in', true, function(elSize) {
                me.onResize(elSize);
            });
        },

        /**
         * @protected
         * 当View重置高宽时调用，可以被子类实现或实例化时重写
         */
        onResize: iBoxUtils.noop,

        // private
        destroy: function() {
            if (!this.destroyed) {
                this.destroyed = true;
                this.beforeDestroy();

                this.header.destroy();
                this.header = null;

                if (this.iscroll) {
                    this.iscroll.destroy();
                    this.iscroll = null;
                }

                iBoxUtils.removeElement(this.el);
                this.el = this.ct = this.headerCt = null;
                this.onDestroy();
            }
        },

        /**
         * @protected
         * 当View销毁之前调用，可以被子类实现或实例化时重写
         */
        beforeDestroy: iBoxUtils.noop,

        /**
         * @protected
         * 当View被销毁时调用，可以被子类实现或实例化时重写
         */
        onDestroy: iBoxUtils.noop
    });

    iBox.View = View;

})(window);
(function(window) {
    var iBoxUtils = window.iBoxUtils;

    /**
     * @class iBox.Header
     *
     * Header抽象类，定义Header子类实现接口
     */
    iBox.Header = Klass.define({
        // private
        constructor: function(viewId, ct, config) {
            config = config || {};
            for (var o in config) {
                this[o] = config[o];
            }

            this.viewId = viewId;
            this.ct = ct;
            this.render();
        },

        // private
        render: function() {
            if (!this.rendered) {
                this.rendered = true;
                this.doRender();
                this.onRender();
            }
        },

        /**
         * @protected
         * 当Header渲染时调用，子类实现
         */
        doRender: iBoxUtils.noop,

        /**
         * @protected
         * 当Header渲染时调用，可以被子类实现或实例化时重写
         */
        onRender: iBoxUtils.noop,

        // private
        slide: function(reverse, action, silent, callbackFn) {
            var me = this;
            me.doSlide(reverse, action, silent, function() {
                if (callbackFn) callbackFn.call(me);
                me.onSlide();
            });
        },

        /**
         * @protected
         * 当Header切换时调用，子类实现
         */
        doSlide: iBoxUtils.noop,

        /**
         * @protected
         * 当Header切换时调用，可以被子类实现或实例化时重写
         */
        onSlide: iBoxUtils.noop,

        // private
        resize: function() {
            var me = this;
            me.slide(false, 'in', true, function(elSize) {
                me.onResize(elSize);
            });
        },

        /**
         * @protected
         * 当Header重置高宽时调用，可以被子类实现或实例化时重写
         */
        onResize: iBoxUtils.noop,

        destroy: function() {
            if (!this.destroyed) {
                this.destroyed = true;
                this.beforeDestroy();

                this.doDestroy();

                this.ct = null;
                this.onDestroy();
            }
        },

        /**
         * @protected
         * 当Header销毁时调用，子类实现
         */
        doDestroy: iBoxUtils.noop,

        /**
         * @protected
         * 当Header销毁之前调用，可以被子类实现或实例化时重写
         */
        beforeDestroy: iBoxUtils.noop,

        /**
         * @protected
         * 当Header被销毁时调用，可以被子类实现或实例化时重写
         */
        onDestroy: iBoxUtils.noop
    });
})(window);
(function(window) {
    var pointerEnabled = window.navigator.msPointerEnabled,
        iBoxUtils = window.iBoxUtils;

    /**
     * @class iBox.GeneralHeader
     */
    iBox.GeneralHeader = Klass.define(iBox.Header, {
        /**
         * @cfg {String} title 标题
         */

        /**
         * @cfg {Object/String} leftButton 配置左侧按钮
         *      String : text
         *      String : icon 图标url
         *      Function : handler click回调函数
         */

        /**
         * @cfg {Object/String} rightButton 配置右侧按钮
         *      String : text
         *      Function : handler click回调函数
         */

        doRender: function() {
            var div, options = this.title;
            if (options) {
                options = iBoxUtils.isString(options) ? { text: options } : options;
                div = document.createElement('div');
                div.innerHTML = '<div>' + options.text + '</div>';
                div.className = 'button title' + (options.cls ? (' ' + options.cls) : '');
                div.setAttribute('data-view', this.viewId);
                div.style.cssText = 'display:none;';
                this.ct.appendChild(div);
                this.title = div;
                div = null;
            } else {
                this.title = this.ct.querySelector('div.title[data-view="' + this.id + '"]');
            }

            this.onButtonTouchStartProxy = iBoxUtils.proxy(this.onButtonTouchStart, this);
            this.onButtonTouchEndProxy = iBoxUtils.proxy(this.onButtonTouchEnd, this);
            this.onButtonClickProxy = iBoxUtils.proxy(this.onButtonClick, this);
            this.renderButton(this.leftButton, true);
            this.renderButton(this.rightButton, false);
        },

        renderButton: function(options, isLeft) {
            var me = this,
                text = isLeft ? 'left' : 'right',
                div, handler, btn;
            if (options) {
                options = iBoxUtils.isString(options) ? { text: options } : options;
                handler = options.handler;
                div = document.createElement('div');
                div.innerHTML = (isLeft ? '<img src="' + (options.icon || (iBoxUtils.BLANK_IMAGE + '" class="back"')) + ' />' : '') + '<div>' + options.text + '</div>';
                div.className = 'button ' + text + (options.cls ? (' ' + options.cls) : '');
                div.style.cssText = 'display:none;';
                div.setAttribute('data-view', me.viewId);
                me.ct.appendChild(div);
                me[text + 'Button'] = btn = div;
                div = null;
            } else {
                me[text + 'Button'] = btn = me.ct.querySelector('div.' + text + '[data-view="' + me.id + '"]');
                if (btn) {
                    handler = iBoxUtils.queryFunction(btn.getAttribute('data-handler'));
                }
            }

            if (handler) {
                btn.clickHandler = handler;
                if (iBoxUtils.isMobile()) {
                    btn.addEventListener(pointerEnabled ? 'MSPointerDown' : 'touchstart', this.onButtonTouchStartProxy, false);
                    btn.addEventListener(pointerEnabled ? 'MSPointerUp' : 'touchend', this.onButtonTouchEndProxy, false);
                }
                btn.addEventListener('click', this.onButtonClickProxy, false);
            }
        },

        onButtonTouchStart: function(e) {
            var target = e.currentTarget;
            clearTimeout(target.highlightTimeout);
            iBoxUtils.addClass(target, 'highlighted');
        },

        onButtonTouchEnd: function(e) {
            iBoxUtils.dispatchClickEvent(e);
        },

        onButtonClick: function(e) {
            var target = e.currentTarget;
            target.highlightTimeout = setTimeout(function() {
                iBoxUtils.removeClass(target, 'highlighted');
            }, 300);
            if (target.clickHandler) target.clickHandler();
        },

        doSlide: function(reverse, action, silent, callbackFn) {
            var me = this,
                cssVendor = iBoxUtils.vendor.cssVendor,
                direction = reverse ? 'right' : 'left',
                leftButton = me.leftButton, leftText,
                rightButton = me.rightButton,
                title = me.title,
                headerWidth = iBoxUtils.getComputedSize(me.ct).innerWidth,
                titleWidth, leftWidth, rightWidth, titleLeft, leftInnerWidth, leftTextWidth,
                minLeftWidth = 70,
                leftBeforeCss, leftTextBeforeCss, rightBeforeCss, titleBeforeCss,
                leftAfterCss, leftTextAfterCss, rightAfterCss, titleAfterCss,
                duration = 350, opacityDuration = 300, defer = 50;

            if (action == 'in') {
                if (leftButton) leftButton.style.cssText = 'display:block;' + cssVendor + 'transform:translate3d(-1000px,-1000px,0px);';
                if (rightButton) rightButton.style.cssText = 'display:block;' + cssVendor + 'transform:translate3d(-1000px,-1000px,0px);';
                if (title) title.style.cssText = 'display:block;' + cssVendor + 'transform:translate3d(-1000px,-1000px,0px);';
            }

            leftWidth = leftButton ? iBoxUtils.getComputedSize(leftButton).outerWidth : 0;
            rightWidth = rightButton ? iBoxUtils.getComputedSize(rightButton).outerWidth : 0;
            titleWidth = title ? iBoxUtils.getComputedSize(title).outerWidth : 0;
            if (headerWidth < leftWidth + rightWidth + titleWidth) {
                leftWidth = headerWidth - titleWidth - rightWidth;
            }
            if (leftWidth < minLeftWidth) {
                leftWidth = minLeftWidth;
            }
            titleLeft = (headerWidth - titleWidth) / 2;
            titleLeft = (titleLeft + titleWidth + rightWidth > headerWidth) ? (headerWidth - titleWidth - rightWidth) / 2 : titleLeft;
            titleLeft = titleLeft < leftWidth ? leftWidth : titleLeft;

            if (leftButton) {
                iBoxUtils.removeClass(leftButton, 'highlighted');
                leftText = leftButton.querySelector('div');
                leftInnerWidth = iBoxUtils.getComputedSize(leftButton, leftWidth).innerWidth;
                leftTextWidth = iBoxUtils.getComputedSize(leftText, leftInnerWidth).innerWidth;
                leftAfterCss = 'display:block;width:' + leftInnerWidth + 'px;opacity:' + (action == 'in' ? '1' : '0') + ';' + (silent === true ? '' : cssVendor + 'transition:' + 'opacity ' + opacityDuration + 'ms;');
                leftTextAfterCss = 'width:' + leftTextWidth + 'px;' + cssVendor + 'transform:translate3d(' + (action == 'in' ? 0 : (direction == 'left' ? -leftWidth : titleLeft)) + 'px,0px,0px);' + (silent === true ? '' : '' + cssVendor + 'transition:' + cssVendor + 'transform ' + duration + 'ms;');
                if (silent !== true) {
                    if (action == 'in') {
                        leftBeforeCss = 'display:block;width:' + leftInnerWidth + 'px;opacity:0;';
                        leftTextBeforeCss = 'width:' + leftTextWidth + 'px;' + cssVendor + 'transform:translate3d(' + (direction == 'left' ? titleLeft : -leftWidth) + 'px,0px,0px);';
                        leftButton.style.cssText = leftBeforeCss;
                        leftText.style.cssText = leftTextBeforeCss;
                    }
                    iBoxUtils.listenTransition(leftButton, duration + defer, function() {
                        if (action != 'in' && me.leftButton) me.leftButton.style.display = 'none';
                    });
                    setTimeout(function() {
                        leftButton.style.cssText = leftAfterCss;
                        leftText.style.cssText = leftTextAfterCss;
                    }, defer);
                } else {
                    leftButton.style.cssText = leftAfterCss;
                    leftText.style.cssText = leftTextAfterCss;
                    if (action != 'in') leftButton.style.display = 'none';
                }
            }
            if (rightButton) {
                iBoxUtils.removeClass(rightButton, 'highlighted');
                rightAfterCss = 'display:block;opacity:' + (action == 'in' ? '1' : '0') + ';' + (silent === true ? '' : cssVendor + 'transition:opacity ' + opacityDuration + 'ms;');
                if (silent !== true) {
                    if (action == 'in') {
                        rightBeforeCss = 'display:block;opacity:0;';
                        rightButton.style.cssText = rightBeforeCss;
                    }
                    iBoxUtils.listenTransition(rightButton, duration + defer, function() {
                        if (action != 'in' && me.rightButton) me.rightButton.style.display = 'none';
                    });
                    setTimeout(function() {
                        rightButton.style.cssText = rightAfterCss;
                    }, defer);
                } else {
                    rightButton.style.cssText = rightAfterCss;
                    if (action != 'in') rightButton.style.display = 'none';
                }
            }
            if (title) {
                titleAfterCss = 'display:block;opacity:' + (action == 'in' ? '1' : '0') + ';' + cssVendor + 'transform:translate3d(' + (action == 'in' ? titleLeft : (direction == 'left' ? 30 : headerWidth)) + 'px,0px,0px);' + (silent === true ? '' : cssVendor + 'transition:' + cssVendor + 'transform ' + duration + 'ms,opacity ' + opacityDuration + 'ms;');
                if (silent !== true) {
                    if (action == 'in') {
                        titleBeforeCss = 'display:block;opacity:0;' + cssVendor + 'transform:translate3d(' + (direction == 'left' ? (headerWidth - titleWidth / 2) : 0) + 'px,0px,0px);';
                        title.style.cssText = titleBeforeCss;
                    }
                    iBoxUtils.listenTransition(title, duration + defer, function() {
                        if (action != 'in' && me.title) me.title.style.display = 'none';
                        if (callbackFn) callbackFn.call(me);
                    });
                    setTimeout(function() {
                        title.style.cssText = titleAfterCss;
                    }, defer);
                } else {
                    title.style.cssText = titleAfterCss;
                    if (action != 'in') title.style.display = 'none';
                    if (callbackFn) callbackFn.call(me);
                }
            }
        },

        doDestroy: function() {
            if (this.title) {
                iBoxUtils.removeElement(this.title);
                this.title = null;
            }
            this.destroyButton(true);
            this.destroyButton(false);
        },

        destroyButton: function(isLeft) {
            var text = isLeft ? 'left' : 'right',
                btn = this[text + 'Button'];

            if (btn) {
                if (iBoxUtils.isMobile()) {
                    btn.removeEventListener(pointerEnabled ? 'MSPointerDown' : 'touchstart', this.onButtonTouchStartProxy, false);
                    btn.removeEventListener(pointerEnabled ? 'MSPointerUp' : 'touchend', this.onButtonTouchEndProxy, false);
                }
                btn.removeEventListener('click', this.onButtonClickProxy, false);
                iBoxUtils.removeElement(btn);
                this[text + 'Button'] = btn = null;
            }
        }
    });
})(window);