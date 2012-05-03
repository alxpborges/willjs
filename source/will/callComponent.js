(function (window, globalName) {
    var will = window[globalName],
        u = will.u,
        Processors = u.Processors,
        Processor = u.Processor,
        Path = u.Path,
        process = u.process,
        requireAssets = u.requireAssets,
        registerFunctions = u.registerFunctions;

    Processors.prototype.callComponent = new Processor(function (context, compPath, args) {
        if (!context.configured) {
            context.use("willjs-Config@" + context.info.dir + "config.js" + context.info.qs)(function () {
                context.configured = true;
                process(context, "callComponent", [context, compPath, args]);
            });
            return;
        }
        var self = this,
            path = new Path(context, compPath),
            url = path.url,
            entry = path.entry,
            impl = entry.impl;
        if (impl) {
            impl.apply(undefined, args);
            return;
        }
        if (path.format == "js") {
            url = path.toString().replace(/[:\.]/g, "_") + "@" + url;
            requireAssets(context, [url], true)(function (status) {
                try {
                    if (status == "success") {
                        impl = entry.impl;
                        if (impl) impl.apply(undefined, args);
                    }
                } finally {
                    self.sched();
                }
            });
        } else {
            will.u.loadComponent(context, url, function (statusCode, data) {
                try {
                    if (statusCode !== 200) {
                        throw "could not load component: " + path;
                    }
                    if (typeof data == "string") data = eval("("+data+")");
                    if (typeof data != "object") return;
                    registerFunctions(context, data, path);
                    impl = entry.impl;
                    if (impl) impl.apply(undefined, args);
                } finally {
                    self.sched();
                }
            });
        }
        return false;
    });

    will.constructor.prototype.call = function (compPath) {
        var context = this;
        return function () {
            process(context, "callComponent", [context, compPath, arguments]);
        };
    };
})(window, "will");
