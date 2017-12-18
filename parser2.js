function parseHtml(html) {
    const TYPE_TEXT = 0;
    const TYPE_NODE = 1;

    function Node() {
        const me = this;
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
                const path = parentPath + this.id;
                let node = nodes.get(path);
                if (node) {
                    if (node.nodeType !== 8) {
                        const cmt = document.createComment('if');
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
                const path = parentPath + this.id;

                if (this.type === TYPE_TEXT) {
                    renderText(nodes, path, parentElement, globalContext, context);
                } else {
                    if (Una.$components.hasOwnProperty(this.name)){
                        renderComponent(nodes, parentPath, parentElement, globalContext, context);
                    } else {
                        renderHTMLNode(nodes, path, parentElement, globalContext, context);
                    }
                }
            }
        };

        const renderFor = function (nodes, parentPath, parentElement, globalContext, context) {
            let result = [];
            result.array = true;
            const arr = me.forNode.split(/\s+in\s+/);
            const data = evalContext(arr[1], globalContext, context);
            const indexes = arr[0].split(',');
            let keyIndex = '';
            let keyItem = '';
            if (indexes.length === 2) {
                keyIndex = indexes[0].trim();
                keyItem = indexes[1].trim();
            } else {
                keyItem = indexes[0].trim();
            }

            me.isForNode = false;
            for (let i = 0; i < data.length; i++) {
                const localContext = {};
                if (context) {
                    for (let k in context) {
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

        const renderText = function (nodes, path, parentElement, globalContext, context) {
            let text = evalText(me.text, globalContext, context);
            let node = nodes.get(path);
            if (node) {
                node.nodeValue = text;
            } else {
                node = document.createTextNode(text);
                parentElement.appendChild(node);
            }
            nodes.update(path, node);
        };

        const renderHTMLNode = function (nodes, path, parentElement, globalContext, context) {
            let element = nodes.get(path);
            if (element && element.nodeType !== 8) {

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

            for (let k in me.attributes) {
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
                let binder = me.uAttributes['u-bind'];
                let inputType = element.type;
                if (inputType === 'checkbox' || inputType === 'radio') {
                    element.checked = evalContext(binder, globalContext, context);
                    element.onchange = function () {
                        let js;
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
                    let run = function () {
                        let js;
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
            for (let i = 0; i < me.children.length; i++) {
                me.children[i].toDOM(nodes, path, element, globalContext, context);
            }
        };

        const renderComponent = function(nodes, path, parentElement, globalContext, context){
            console.log(path);
        };
    }


    const run = function (html) {
        let domParser = new DOMParser();
        let dom = domParser.parseFromString(html, 'text/html');
        dom = dom.children[0].children[1].children[0];
        return parse(dom);
    };

    const parse = function (dom) {
        if (dom.nodeType === 8) {
            return null;
        }
        let node = new Node();
        node.type = dom.nodeType === 3 ? TYPE_TEXT : TYPE_NODE;
        if (node.type === TYPE_NODE) {
            node.name = dom.nodeName;
            node.isIfNode = dom.hasAttribute('u-if');
            node.isForNode = dom.hasAttribute('u-for');
            node.ifNode = dom.getAttribute('u-if');
            node.forNode = dom.getAttribute('u-for');
            let attrs = dom.attributes;
            let attr;
            let name;
            for (let i = 0, l = attrs.length; i < l; i++) {
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

            let cs = dom.childNodes;
            // console.log(cs);
            let children = [];
            for (let i = 0, l = cs.length; i < l; i++) {
                let child = parse(cs[i]);
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


    return run(html);
}