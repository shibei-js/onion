'use strict';

function range(a, b) {
    let [min, max] = b ? [a, b] : [0, a];
    return [...Array(max - min).keys()].map(num => num + min);
}

function random(max) {
    return Math.floor(Math.random() * max);
}

function asyncSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function asyncArrayPush(arr, ...val) {
    return asyncSleep(random(2)).then(() => arr.push(...val));
}

function MidWare(arr, a1, a2, c1, c2) {
    return async (ctx, next, ...args) => {
        await asyncArrayPush(arr, ...args);
        await asyncArrayPush(ctx, c1);
        const rets = await next(...a1);
        if (rets) await asyncArrayPush(arr, ...rets);
        await asyncArrayPush(ctx, c2);
        return a2;
    };
}

function EndWare(arr, a1, c1) {
    return async (ctx, next, ...args) => {
        await asyncArrayPush(arr, ...args);
        await asyncArrayPush(ctx, c1);
        return a1;
    };
}

const msgRight = 'Work correctly!';
const msgWrong = 'Something wrong!';

function ErrWareBeforeNext(arr, c1) {
    return async (ctx, next, ...args) => {
        await asyncArrayPush(arr, ...args);
        await asyncArrayPush(ctx, c1);
        throw new Error(msgRight);
        await next(-1);
        await asyncArrayPush(arr, -1);
        return -1;
    };
}

function ErrWareAfterNext(arr, a1, c1, c2) {
    return async (ctx, next, ...args) => {
        await asyncArrayPush(arr, ...args);
        await asyncArrayPush(ctx, c1);
        const rets = await next(...a1);
        if (rets) await asyncArrayPush(arr, ...rets);
        await asyncArrayPush(ctx, c2);
        throw new Error(msgRight);
        await asyncArrayPush(arr, -1);
        return -1;
    };
}

function ErrWareMultiNext(arr, a1, c1, c2) {
    return async (ctx, next, ...args) => {
        await asyncArrayPush(arr, ...args);
        await asyncArrayPush(ctx, c1);
        const rets = await next(...a1);
        if (rets) await asyncArrayPush(arr, ...rets);
        await asyncArrayPush(ctx, c2);
        await next(-1);
        await asyncArrayPush(arr, -1);
        return -1;
    };
}

function MidSync(arr, a1, c1) {
    return (ctx, next, ...args) => {
        for (const a of args) arr.push(a);
        ctx.push(c1);
        return next(...a1);
    };
}

function EndSync(arr, a1, c1) {
    return (ctx, next, ...args) => {
        for (const a of args) arr.push(a);
        ctx.push(c1);
        return a1;
    };
}

module.exports = {
    range,
    random,
    asyncSleep,
    asyncArrayPush,
    MidWare,
    EndWare,
    msgRight,
    msgWrong,
    ErrWareBeforeNext,
    ErrWareAfterNext,
    ErrWareMultiNext,
    MidSync,
    EndSync,
    TrueWare: MidWare,
    FalseWare: EndWare,
};
