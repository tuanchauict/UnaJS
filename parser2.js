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
        this.properties = {};
        this.linkProperties = {};

        this.toDOM = function (nodes, parentPath, parentElement, contexts) {
            // console.log(parentElement);
            if (this.isIfNode && !evalContext(this.ifNode, contexts.global, contexts.local)) {
                const path = (() => {
                    const comp = Una.$components[me.name.toLocaleLowerCase()];
                    if (comp) {
                        return parentPath + this.id + comp.$tree.id;
                    } else {
                        return parentPath + this.id;
                    }
                })();
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
                return renderFor(nodes, parentPath, parentElement, contexts);
            } else {
                const path = parentPath + this.id;
                // console.log(path);

                if (this.type === TYPE_TEXT) {
                    renderText(nodes, path, parentElement, contexts);
                } else {
                    if (this.name.toLocaleLowerCase() === 'content') {
                        renderComponentChildren(nodes, parentPath, parentElement, contexts);
                    } else if (this.name.toLowerCase() in Una.$components) {
                        renderComponent(nodes, parentPath, parentElement, contexts);
                    } else {
                        renderHTMLNode(nodes, path, parentElement, contexts);
                    }
                }
            }
        };

        const renderFor = function (nodes, parentPath, parentElement, contexts) {
            let result = [];
            result.array = true;
            const arr = me.forNode.split(/\s+in\s+/);
            const data = evalContext(arr[1], contexts.global, contexts.local);
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
            const context = contexts.local;
            // console.log(context);

            // console.log(data);
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
                contexts.local = localContext;
                const newContexts = {};
                Object.assign(newContexts, contexts);
                newContexts.local = localContext;

                result.push(me.toDOM(nodes, parentPath + '-' + i, parentElement, newContexts))
            }
            me.isForNode = true;
        };

        const renderText = function (nodes, path, parentElement, contexts) {
            let text = evalText(me.text, contexts.global, contexts.local);
            let node = nodes.get(path);
            if (node) {
                node.nodeValue = text;
            } else {
                node = document.createTextNode(text);
                parentElement.appendChild(node);
            }
            nodes.update(path, node);
        };

        const renderHTMLNode = function (nodes, path, parentElement, contexts) {
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

                element.setAttribute(k, evalText(me.attributes[k], contexts.global, contexts.local));
            }

            if (me.uAttributes.hasOwnProperty('u-click')) {
                element.onclick = function () {
                    evalContext(me.uAttributes['u-click'], contexts.global, contexts.local);
                }
            }
            const context = contexts.local;
            if (me.uAttributes.hasOwnProperty('u-bind')) {
                let binder = me.uAttributes['u-bind'];
                let inputType = element.type;
                if (inputType === 'checkbox' || inputType === 'radio') {
                    element.checked = evalContext(binder, contexts.global, contexts.local);
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

                        evalContext(js, contexts.global, contexts.local);
                    }
                } else {
                    element.value = evalContext(binder, contexts.global, contexts.local);
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

                        evalContext(js, contexts.global, contexts.local);
                    };
                    element.onchange = run;
                    element.onkeyup = run;
                }
            }
            // TODO render more uAttribute

            // for (let i = 0; i < me.children.length; i++) {
            //     me.children[i].toDOM(nodes, path, element, contexts);
            // }
            renderChildren(nodes, path, element, contexts, me.children);
        };

        const renderComponent = function (nodes, parentPath, parentElement, contexts) {
            // console.log('component', me.name, me);
            // console.log(contexts);
            const componentContext = {data: {}, methods: {}};
            for (let k in me.properties) {
                let p = me.properties[k];
                componentContext.data[k] = evalText(p, contexts.global, contexts.local);
            }
            for (let k in me.linkProperties) {
                let p = me.linkProperties[k];
                componentContext.data[k] = evalContext(p, contexts.global, contexts.local);
            }
            // console.log(parentPath);
            Una.$components[me.name.toLocaleLowerCase()].toHTML(nodes, parentPath + me.id, parentElement, {
                global: componentContext,
                local: contexts.local,
                children: {
                    nodes: me.children,
                    contexts
                }
            });
        };

        const renderComponentChildren = function (nodes, parentPath, parentElement, contexts) {
            // console.log("renderComponentChildren", contexts);
            // console.log(contexts.children);
            const children = contexts.children.nodes;

            // console.log(children);
            renderChildren(nodes, parentPath, parentElement, contexts.children.contexts, contexts.children.nodes);

        };

        const renderChildren = function (nodes, parentPath, parentElement, contexts, children) {
            if (!children)
                return;
            for (let i = 0; i < children.length; i++) {
                children[i].toDOM(nodes, parentPath, parentElement, contexts);
            }
        }
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
                }
                else if (name.startsWith('u:')) {
                    if (name.startsWith('u::')) {
                        node.linkProperties[name.substr(3)] = attr.value;
                    } else {
                        node.properties[name.substr(2)] = attr.value;
                    }
                }
                else {
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