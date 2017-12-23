if (!Array.prototype.remove) {
    Array.prototype.remove = function(item){
        const index = this.indexOf(item);
        if (index >= 0){
            this.splice(index, 1);
        }
    }
}

// object.watch
if (!Object.prototype.watch) {
    Object.defineProperty(Object.prototype, "watch", {
        enumerable: false
        , configurable: true
        , writable: false
        , value: function (prop, handler) {
            let
                oldval = this[prop]
                , newval = oldval
                , getter = function () {
                    return newval;
                }
                , setter = function (val) {
                    oldval = newval;
                    newval = val;
                    handler.call(this, prop, oldval, val);
                    return newval;
                }
            ;

            if (delete this[prop]) { // can't watch constants
                Object.defineProperty(this, prop, {
                    get: getter
                    , set: setter
                    , enumerable: true
                    , configurable: true
                });
            }
        }
    });
}

// object.unwatch
if (!Object.prototype.unwatch) {
    Object.defineProperty(Object.prototype, "unwatch", {
        enumerable: false
        , configurable: true
        , writable: false
        , value: function (prop) {
            const val = this[prop];
            delete this[prop]; // remove accessors
            this[prop] = val;
        }
    });
}

if (!String.prototype.format) {
    String.prototype.format = function () {
        const args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}


function guid() {
    if (!this.counter){
        this.counter = 0;
    }
    this.counter++;
    return '#' + this.counter;
}


function evalContext(js, globalContext, localContext) {
    return function () {
        let s = "";
        const g = this.global.data;
        const m = this.global.methods;
        const l = this.local;
        const set = new Set();

        for (let k in g) {
            if (!g.hasOwnProperty(k)) continue;
            if (set.has(k)){
                s += "{0} = g.{0};".format(k);
            } else {
                s += "let {0} = g.{0};".format(k);
                set.add(k);
            }
        }
        for (let k in m) {
            if (!m.hasOwnProperty(k)) continue;
            if (set.has(k)){
                s += "{0} = m.{0}.bind(g);".format(k);
            } else {
                s += "let {0} = m.{0}.bind(g);".format(k);
                set.add(k);
            }
        }

        if (l) {
            for (let k in l) {
                if (!l.hasOwnProperty(k)) continue;
                if (set.has(k)){
                    s += "{0} = l.{0};".format(k);
                } else {
                    s += "let {0} = l.{0};".format(k);
                    set.add(k);
                }
            }
        }
        s += js;
        // console.log(s);
        return eval(s);
    }.call({global: globalContext, local: localContext});
}

function evalText(text, globalContext, localContext) {
    const re = /{{.+?}}/g;
    const map = {};
    const arr = text.match(re);
    if (!arr){
        return text;
    }
    for (let i = 0; i < arr.length; i++){
        const js = arr[i];
        if (!(js in map)) {
            const value = evalContext(js.substr(2, js.length - 4),globalContext,  localContext);
            map[js] = value;
            text = text.replace(js, value);
        }
    }
    return text;
}