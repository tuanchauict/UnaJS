// object.watch
if (!Object.prototype.watch) {
    Object.defineProperty(Object.prototype, "watch", {
        enumerable: false
        , configurable: true
        , writable: false
        , value: function (prop, handler) {
            var
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
            var val = this[prop];
            delete this[prop]; // remove accessors
            this[prop] = val;
        }
    });
}

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

function evalContext(js, globalContext, localContext) {
    return function () {
        var s = "";
        var g = this.global;
        var l = this.local;
        for (var k in g) {
            if (!g.hasOwnProperty(k)) continue;
            var v = g[k];
            if (typeof(v) === "object") {
                s += "var " + k + "=" + JSON.stringify(v) + ";";
            } else {
                s += "var " + k + "=" + v + ";";
            }
        }

        if (l) {
            for (var k in l) {
                if (!l.hasOwnProperty(k)) continue;
                var v = l[k];
                if (typeof(v) === "object") {
                    s += "var " + k + "=" + JSON.stringify(v) + ";";
                } else {
                    s += "var " + k + "=" + v + ";";
                }
            }
        }

        s += js;
        // console.log("js =", s);
        return eval(s);
    }.call({global: globalContext, local: localContext});
}