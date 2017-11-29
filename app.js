var app = new Tuna({
    el: 'app',
    data: {
        foo: 1,
        array: [100, 200, 300],
        inputText: 'text',
        input: {
            text: 'con co be be'
        }
    },
    methods: {
        bar: function () {
            return 1000;
        },
        onClick: function () {
            console.log('Click', this);
            app.$data.foo++;
        },
        onItemClick: function (item) {
            console.log("Click on", item);
        }
    }
});

// app.$data.foo = 2;