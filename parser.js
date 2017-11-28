

function parseHtml(html){
    var TYPE_TEXT = 0;
    var TYPE_NODE = 1;


    function Node(){
        var me = this;
        this.name = '';
        this.type = TYPE_TEXT;
        this.isIfNode = false;
        this.isForNode = false;
        this.children = [];
        this.tAttributes = {};
        this.attributes = {};


        this.toHtml = function(context){
            console.log('toHtml',this, context);
            if (this.isIfNode && !evalContext(this.ifNode, context)) {
                return '';
            }
            if (this.isForNode){
                return renderFor(context);
            }

            if (this.type === TYPE_TEXT) {
                return renderText( context);
            }

            return renderNode(context);
        };

        var renderFor = function (context) {
            return '';
        };

        var renderText = function (context) {
            var text = me.text;
            var l = text.length;
            var result = '';
            for (var i = 0; i < l; i++) {
                var c = text[i];
                var c1 = i < l - 1 ? text[i+1] : '';
                if (c + c1 === '{{') {
                    var j = i + 2;
                    var js = '';
                    for (; j < l; j++) {
                        c = text[j];
                        c1 = j < l - 1 ? text[j+1] : '';
                        if (c + c1 === '}}') {
                            result += evalContext(js, context);
                            i = j + 1;
                        } else {
                            js += c;
                        }
                    }
                } else {
                    result += c;
                }
            }
            return result;
        };

        var renderNode = function (context) {
            console.log("renderNode", context);
            var attrs = '';
            for (var k in me.attributes){
                if (!me.attributes.hasOwnProperty(k))
                    continue;
                attrs += k + '="' + me.attributes[k] + '"';
            }
            // TODO render tAttribute
            var children = '';
            for (var i = 0; i < me.children.length; i++){
                children += me.children[i].toHtml(context);
            }
            attrs = attrs.trim();
            children = children.trim();
            if (children) {
                if (attrs) {
                    return '<{0} {1}>{2}</{0}>'.format(me.name, attrs, children);
                } else {
                    return '<{0}>{1}</{0}>'.format(me.name, children);
                }
            } else if(attrs) {
                return '<{0} {1}/>'.format(me.name, attrs);
            } else {
                return '<{0}/>'.format(me.name);
            }
        };

    }


    var run = function() {
        var domParser = new DOMParser();
        var dom = domParser.parseFromString(html, 'text/html');
        dom = dom.children[0].children[1].children[0];
        return parse(dom);
    };

    var parse = function(dom){
        var node = new Node();
        node.type = dom.nodeType === 3 ? TYPE_TEXT : TYPE_NODE;
        if (node.type === TYPE_NODE){
            node.name = dom.nodeName;
            node.isIfNode = dom.hasAttribute('t-if');
            node.isForNode = dom.hasAttribute('t-for');
            node.ifNode = dom.getAttribute('t-if');
            node.forNode = dom.hasAttribute('t-for');
            var attrs = dom.attributes;
            var attr;
            var name;
            for (var i = 0, l = attrs.length; i < l; i++){
                attr = attrs[i];
                name = attr.name;
                if (name.startsWith('t-')){
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
            for (var i = 0, l = cs.length; i < l; i++){
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