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


        this.toHtml = function (context) {
            if (this.isIfNode && !evalContext(this.ifNode, context)) {
                return null;
            }

            if (this.isForNode) {
                return renderFor(context);
            }

            if (this.type === TYPE_TEXT) {
                return renderText(context);
            }

            return renderNode(context);
        };

        var renderFor = function (context) {
            var result = [];
            result.array = true;
            var arr = me.forNode.split(/\s+in\s+/);
            var data = evalContext(arr[1], context);

            me.isForNode = false;
            for (var i = 0; i < data.length; i++){
                result.push(me.toHtml(data[i]))
            }
            me.isForNode = true;
            return result;
        };

        var renderText = function (context) {
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
                    var value = evalContext(js.substr(2, js.length - 4), context);
                    map[js] = value;
                    text = text.replace(js, value);
                }
            }

            return document.createTextNode(text);
        };

        var renderNode = function (context) {
            var element = document.createElement(me.name);
            for (var k in me.attributes) {
                if (!me.attributes.hasOwnProperty(k))
                    continue;
                element.setAttribute(k, me.attributes[k]);
            }
            // TODO render tAttribute
            for (var i = 0; i < me.children.length; i++) {
                var childElem = me.children[i].toHtml(context);

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
                children.push(parse(cs[i]));
            }
            node.children = children;
        } else {
            node.text = dom.textContent.trim();
        }
        return node;
    };


    return run();
}