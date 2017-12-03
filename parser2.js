function parseHtml(html) {
    var TYPE_TEXT = 0;
    var TYPE_NODE = 1;

    function Node() {
        var me = this;
        this.id = guid();
        this.name = '';
        this.type = TYPE_TEXT;
        this.isIfNode = false;
        this.isForNode = false;
        this.children = [];
        this.uAttributes = {};
        this.attributes = {};

        this.toDOM = function (nodes, parentPath, parentElement, globalContext, context) {
            // console.log(parentElement);
            if (this.isIfNode && !evalContext(this.ifNode, globalContext, context)) {
                var path = parentPath + this.id;
                var node = nodes.get(path);
                if (node) {
                    if (node.nodeType !== 8) {
                        var cmt = document.createComment('if');
                        parentElement.insertBefore(cmt, node);
                        node.remove();
                        node = cmt;
                    }
                } else {
                    node = document.createComment("if");
                    parentElement.appendChild(node);
                }
                nodes.update(path, node);
            } else if (this.isForNode) {
                return renderFor(nodes, parentPath, parentElement, globalContext, context);
            } else {
                var path = parentPath + this.id;

                if (this.type === TYPE_TEXT) {
                    renderText(nodes, path, parentElement, globalContext, context);
                } else {
                    renderNode(nodes, path, parentElement, globalContext, context);
                }
            }
        };

        var renderFor = function (nodes, parentPath, parentElement, globalContext, context) {
            var result = [];
            result.array = true;
            var arr = me.forNode.split(/\s+in\s+/);
            var data = evalContext(arr[1], globalContext, context);
            var indexes = arr[0].split(',');
            var keyIndex = '';
            var keyItem = '';
            if (indexes.length === 2) {
                keyIndex = indexes[0].trim();
                keyItem = indexes[1].trim();
            } else {
                keyItem = indexes[0].trim();
            }


            me.isForNode = false;
            for (var i = 0; i < data.length; i++) {
                var localContext = {};
                if (context) {
                    for (var k in context) {
                        if (context.hasOwnProperty(k)) {
                            localContext[k] = context[k];
                        }
                    }
                }
                localContext[keyItem] = data[i];
                if (keyIndex) {
                    localContext[keyIndex] = i;
                }

                result.push(me.toDOM(nodes, parentPath + '-' + i, parentElement, globalContext, localContext))
            }
            me.isForNode = true;
        };

        var renderText = function (nodes, path, parentElement, globalContext, context) {
            var text = evalText(me.text, globalContext, context);
            var node = nodes.get(path);
            if (node) {
                node.nodeValue = text;
            } else {
                node = document.createTextNode(text);
                parentElement.appendChild(node);
            }
            nodes.update(path, node);
        };

        var renderNode = function (nodes, path, parentElement, globalContext, context) {
            var element = nodes.get(path);
            if (element && element.nodeType != 8) {

            } else {
                element = document.createElement(me.name);
                if (nodes.get(path)) {
                    parentElement.insertBefore(element, nodes.get(path));
                    nodes.get(path).remove();
                } else {
                    parentElement.appendChild(element);
                }
            }
            nodes.update(path, element);

            for (var k in me.attributes) {
                if (!me.attributes.hasOwnProperty(k))
                    continue;

                element.setAttribute(k, evalText(me.attributes[k], globalContext, context));
            }

            if (me.uAttributes.hasOwnProperty('u-click')) {
                element.onclick = function () {
                    evalContext(me.uAttributes['u-click'], globalContext, context);
                    // console.log('click');
                }
            }
            if (me.uAttributes.hasOwnProperty('u-bind')) {
                var binder = me.uAttributes['u-bind'];
                var inputType = element.type;
                if (inputType === 'checkbox' || inputType === 'radio' ){
                    element.checked = evalContext(binder, globalContext, context);
                    element.onchange = function(){
                        var js;
                        if (binder.indexOf('.') >= 0) {
                            js = '{0} = {1}'.format(binder, element.checked);
                        } else {
                            if (context !== null && context.hasOwnProperty(binder)) {
                                js = 'l.{0} = {1}'.format(binder, element.checked);
                            } else {
                                js = 'g.{0} = {1}'.format(binder, element.checked);
                            }
                        }

                        evalContext(js, globalContext, context);
                    }
                } else {
                    element.value = evalContext(binder, globalContext, context);
                    var run = function (e) {
                        var js;
                        if (binder.indexOf('.') >= 0) {
                            js = '{0} = {1}'.format(binder, JSON.stringify(element.value));
                        } else {
                            if (context !== null && context.hasOwnProperty(binder)) {
                                js = 'l.{0} = {1}'.format(binder, JSON.stringify(element.value));
                            } else {
                                js = 'g.{0} = {1}'.format(binder, JSON.stringify(element.value));
                            }
                        }

                        evalContext(js, globalContext, context);
                    };
                    element.onchange = run;
                    element.onkeyup = run;
                }
            }
            // TODO render more uAttribute
            for (var i = 0; i < me.children.length; i++) {
                me.children[i].toDOM(nodes, path, element, globalContext, context);
            }
        };
    }


    var run = function () {
        var domParser = new DOMParser();
        var dom = domParser.parseFromString(html, 'text/html');
        dom = dom.children[0].children[1].children[0];
        return parse(dom);
    };

    var parse = function (dom) {
        if (dom.nodeType === 8) {
            return null;
        }
        var node = new Node();
        node.type = dom.nodeType === 3 ? TYPE_TEXT : TYPE_NODE;
        if (node.type === TYPE_NODE) {
            node.name = dom.nodeName;
            node.isIfNode = dom.hasAttribute('u-if');
            node.isForNode = dom.hasAttribute('u-for');
            node.ifNode = dom.getAttribute('u-if');
            node.forNode = dom.getAttribute('u-for');
            var attrs = dom.attributes;
            var attr;
            var name;
            for (var i = 0, l = attrs.length; i < l; i++) {
                attr = attrs[i];
                name = attr.name;
                if (name.startsWith('u-')) {
                    if (name !== 'u-if' && name !== 'u-for') {
                        node.uAttributes[name] = attr.value;
                    }
                } else {
                    node.attributes[name] = attr.value;
                }
            }

            var cs = dom.childNodes;
            // console.log(cs);
            var children = [];
            for (var i = 0, l = cs.length; i < l; i++) {
                var child = parse(cs[i]);
                if (child) {
                    children.push(child);
                }
            }
            node.children = children;
        } else {
            node.text = dom.textContent.trim();
        }
        return node;
    };


    return run();
}