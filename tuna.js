
function Tuna(information){
    var me = this;

    function init(information){
        me.$el = document.getElementById(information.el);
        me.$data = {};
        var data = information.data;
        var $data = me.$data;
        for (var k in data){
            if (!(data.hasOwnProperty(k))){
                continue;
            }
            $data[k] = data[k];
            $data.watch(k, function(prop, old, val){
                console.log(prop, old, val);
            });
        }
    }

    function updateView(){
        //TODO
    }


    init(information);
}



