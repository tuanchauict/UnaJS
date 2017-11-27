

function parseHtml(html){
    var TYPE_TEXT = 0;
    var TYPE_NODE = 1;


    function Node(){
        this.name = '';
        this.type = TYPE_TEXT;
        this.ifNode = false;
        this.forNode = false;
        this.children = [];


        this.toHtml = function(context){

        }
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
            node.name = node.nodeName;
            node.ifNode = dom.getAttribute('t-if');
            node.forNode = dom.hasAttribute('t-for');

        }

        if (dom.nodeType === 1){
            var cs = dom.childNodes;
            var children = [];
            for (var i = 0, l = cs.length; i < l; i++){
                children.push(parse(cs[i]));
            }
            node.children = children;
        }
        return node;
    };


    return run();
}