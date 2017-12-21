function Component(information) {
    const me = this;

    function init(information) {
        if (information.template.startsWith('#')) {
            me.$code = document.getElementById(information.template.substr(1)).innerText.trim();
        } else {
            me.$code = information.template;
        }
        me.$tree = parseHtml(me.$code);
        me.$props = information.props;
        me.$data = information.data;
        me.$methods = information.methods;

    }

    this.toHTML = function (nodes, parentPath, parentElement, contexts) {
        if (me.$data){
            let data = contexts.global.data;
            contexts.global.data = JSON.parse(JSON.stringify(me.$data));
            for (let k in data) {
                if (data.hasOwnProperty(k))
                    contexts.global.data[k] = data[k];
            }
        }
        if (me.$methods) {
            let methods = contexts.global.methods;
            for (let k in methods){
                if (methods.hasOwnProperty(k))
                    contexts.global.methods[k] = methods[k];
            }
        }
        me.$tree.toDOM(nodes, parentPath, parentElement, contexts);
    };

    init(information);
}