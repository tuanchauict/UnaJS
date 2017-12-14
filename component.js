function Component(information) {
    var me = this;
    function init(information) {
        if (information.template.startsWith('#')) {
            me.$code = document.getElementById(information.template.substr(1)).innerText.trim();
        } else {
            me.$code = information.template;
        }
        me.$tree = parseHtml(information.template);
        me.$props = information.props;
        me.$event = {

        }
    }

    init(information);
}