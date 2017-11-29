
function Tuna(information){
    var me = this;

    function init(information){
        me.$el = document.getElementById(information.el);
        me.$code = '<' + me.$el.nodeName + '>' + me.$el.innerHTML + '</' + me.$el.nodeName + '>';
        me.$tree = parseHtml(me.$code);
        me.$methods = information.methods;

        me.$data = {};
        var data = information.data;
        var $data = me.$data;
        for (var k in data){
            if (!(data.hasOwnProperty(k))){
                continue;
            }
            $data[k] = data[k];
            $data.watch(k, function(prop, old, val){
                // console.log(prop, old, val);
                updateView();
            });
        }

        updateView();
    }

    function updateView(){
        var newDOM = me.$tree.toDOM({data: me.$data, methods: me.$methods}, null);
        console.log(newDOM);
        //TODO
        me.$el.innerHTML = '';
        me.$el.appendChild(newDOM);
        // for(var i = 0; i < newDOM.childNodes.length; i++){
        //     console.log(newDOM.childNodes[i]);
        //     me.$el.appendChild(newDOM.childNodes[i]);
        // }
    }


    init(information);
}


