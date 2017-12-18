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
        me.$event = {

        }
    }

    this.toHTML = function (nodes, parentPath, parentElement, contexts) {
        me.$tree.toDOM(nodes, parentPath, parentElement, contexts);
    };

    init(information);
}