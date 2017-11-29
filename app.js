var app = new Tuna({
    el: 'app',
    data: {
        foo: 1,
        array: [100, 200, 300]
    }
});

app.$data.foo = 2;