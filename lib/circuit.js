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
            if (circuit.middleware)
                return circuit.middleware(context, nxt(), ...args);
            return nxt()(...args);
        }

        if (circuit.condition)
            return Promise
                .resolve(circuit.condition(context, sel, ...args))
                .then(val => cond ? val : nxt()(...args));

        return nxt()(...args);
    }

    circuit.condition = condition;
    circuit.middleware = middleware;

    return circuit;
}

module.exports = Circuit;
