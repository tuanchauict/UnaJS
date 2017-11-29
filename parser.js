function parseHtml(html) {
    var TYPE_TEXT = 0;
    var TYPE_NODE = 1;


    function Node() {
        var me = this;
        this.name = '';
        this.type = TYPE_TEXT;
        this.isIfNode = false;
        this.isForNode = false;
        this.children = [];
        this.tAttributes = {};
        this.attributes = {};


        this.toDOM = function (globalContext, context) {
            if (this.isIfNode && !evalContext(this.ifNode, globalContext, context)) {
                return null;
            }

            if (this.isForNode) {
                return renderFor(globalContext, context);
            }

            if (this.type === TYPE_TEXT) {
                return renderText(globalContext, context);
            }

            return renderNode(globalContext, context);
        };

        var renderFor = function (globalContext, context) {
            var result = [];
            result.array = true;
            var arr = me.forNode.split(/\s+in\s+/);
            var data = evalContext(arr[1],globalContext,  context);
            var indexes = arr[0].split(',');
            var keyIndex = '';
            var keyItem = '';
            if (indexes.length === 2){
                keyIndex = indexes[0].trim();
                keyItem = indexes[1].trim();
            } else {
                keyItem = indexes[0].trim();
            }


            me.isForNode = false;
            for (var i = 0; i < data.length; i++){
                var localContext = {};
                if (context){
                    for (var k in context){
                        if (context.hasOwnProperty(k)){
                            localContext[k] = context[k];
                        }
                    }
                }
                localContext[keyItem] = data[i];
                if (keyIndex){
                    localContext[keyIndex] = i;
                }

                result.push(me.toDOM(globalContext, localContext))
            }
            me.isForNode = true;
            return result;
        };

        var renderText = function (globalContext, context) {
            var text = me.text;

            var re = /{{.+?}}/g;
            var map = {};
            var arr = text.match(re);
            if (!arr){
                return document.createTextNode(text);
            }
            for (var i = 0; i < arr.length; i++){
                js = arr[i];
                if (!(js in map)) {
                    var value = evalContext(js.substr(2, js.length - 4),globalContext,  context);
                    map[js] = value;
                    text = text.replace(js, value);
                }
            }

            return document.createTextNode(text);
        };

        var renderNode = function (globalContext, context) {
            var element = document.createElement(me.name);
            for (var k in me.attributes) {
                if (!me.attributes.hasOwnProperty(k))
                    continue;
                element.setAttribute(k, me.attributes[k]);
            }
            // TODO render tAttribute
            for (var i = 0; i < me.children.length; i++) {
                var childElem = me.children[i].toDOM(globalContext, context);

                if (childElem) {
                    if ('array' in childElem){
                        console.log(childElem);
                        for (var j = 0; j < childElem.length; j++){
                            element.appendChild(childElem[j]);
                        }
                    } else {
                        element.appendChild(childElem);
                    }
                }

            }
            return element;
        };

    }


    var run = function () {
        var domParser = new DOMParser();
        var dom = domParser.parseFromString(html, 'text/html');
        dom = dom.children[0].children[1].children[0];
        return parse(dom);
    };

    var parse = function (dom) {
        if (dom.nodeType === 8){
            return null;
        }
        var node = new Node();
        node.type = dom.nodeType === 3 ? TYPE_TEXT : TYPE_NODE;
        if (node.type === TYPE_NODE) {
            node.name = dom.nodeName;
            node.isIfNode = dom.hasAttribute('t-if');
            node.isForNode = dom.hasAttribute('t-for');
            node.ifNode = dom.getAttribute('t-if');
            node.forNode = dom.getAttribute('t-for');
            var attrs = dom.attributes;
            var attr;
            var name;
            for (var i = 0, l = attrs.length; i < l; i++) {
                attr = attrs[i];
                name = attr.name;
                if (name.startsWith('t-')) {
                    if (name !== 't-if' && name !== 't-for') {
                        node.tAttributes[name] = attr.value;
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
                if (child){
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