'use strict';

function Branch(condition, middleware) {

    function branch(context, next, ...args) {

        const nxt = () => {
            if (next === undefined)
                return;
            if (next.length === 0)
                // When Branch is used in a Pipeline, it has a specific next():
                //     function ite(i, ...a) { ... }
                //     next = ite.bind(null, i + 1);
                // The next() function has zero parameter!
                return next(...args);
            return next(context, () => { }, ...args);
        };

        let cond = false;
        function sel(...args) {
            cond = true;
            if (branch.middleware)
                return branch.middleware(context, () => { }, ...args);
        }

        if (branch.condition)
            return Promise
                .resolve(branch.condition(context, sel, ...args))
                .then(val => cond ? val : nxt());

        return nxt();
    }

    branch.condition = condition;
    branch.middleware = middleware;

    return branch;
}

module.exports = Branch;
