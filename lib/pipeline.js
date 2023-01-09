'use strict';

function Pipeline(...middlewares) {

    if (Array.isArray(middlewares[0]))
        middlewares = middlewares[0];

    function pipeline(context, next, ...args) {

        let last = -1;
        const length = pipeline.middlewares.length;

        function ite(i, ...as) {

            if (last >= i)
                throw new Error('next() is called multiple times!');
            last = i;

            if (pipeline.middlewares[i] !== undefined)
                return pipeline.middlewares[i](context, ite.bind(null, i + 1), ...as);
            if (i !== length || next === undefined)
                return;
            if (next.length === 0)
                // When Pipeline is used in a Pipeline, it has a specific next():
                //     function ite(i, ...as) { ... }
                //     next = ite.bind(null, i + 1);
                // The next() function has zero parameter!
                return next(...as);
            return next(context, ite.bind(null, i + 1), ...as);
        }

        return ite(0, ...args);
    }

    pipeline.middlewares = middlewares;

    pipeline.push = function (middleware) {
        pipeline.middlewares.push(middleware);
        return this;
    };

    return pipeline;
}

module.exports = Pipeline;
