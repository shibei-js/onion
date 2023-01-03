'use strict';

function Circuit(condition, middleware) {

    function circuit(context, next, ...args) {

        const nxt = () => {
            if (next === undefined)
                return () => { };
            if (next.length === 0)
                return next.bind(null);
            return next.bind(null, context, () => { });
        };

        let cond = false;
        function sel(...args) {
            cond = true;
            if (middleware)
                return middleware(context, nxt(), ...args);
            return nxt()(...args);
        }

        if (condition)
            return Promise
                .resolve(condition(context, sel, ...args))
                .then(val => cond ? val : nxt()(...args));

        return nxt()(...args);
    }

    return circuit;
}

module.exports = Circuit;
