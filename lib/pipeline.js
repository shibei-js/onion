'use strict';

function Pipeline(...middlewares) {

    function pipeline(ctx, next, ...args) {

        let last = -1;
        const length = middlewares.length;

        function ite(i, ...as) {

            if (last >= i)
                throw new Error('next() is called multiple times!');
            last = i;

            if (middlewares[i] !== undefined)
                return middlewares[i](ctx, ite.bind(null, i + 1), ...as);
            if (i !== length || next === undefined)
                return Promise.resolve();
            if (next.length === 0)
                // When Pipeline is used in a Pipeline, it has a specific next():
                //     function ite(i, ...as) { ... }
                //     next = ite.bind(null, i + 1);
                // The next() function has zero parameter!
                return next(...as);
            return next(ctx, ite.bind(null, i + 1), ...as);
        }

        return ite(0, ...args);
    }

    pipeline.use = function (middleware) {
        middlewares.push(middleware);
        return this;
    }

    return pipeline;
}

module.exports = Pipeline;
