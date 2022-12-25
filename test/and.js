'use strict';

const { And } = require('..');

const { expect } = require('chai');

const {
    range,
    MidWare,
    TrueWare,
    FalseWare,
} = require('./util');

describe('And', () => {

    describe('Basic usage', () => {

        it('And() is T', async () => {
            const arr = [], ctx = [];
            const rets = await And()(
                ctx,
                MidWare(arr, [-1], [2, 3], 0, 1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(4));
            expect(ctx).to.eql(range(2));
        });

        it('And(T) is T', async () => {
            const arr = [], ctx = [];
            const rets = await And(
                TrueWare(arr, [2, 3], [6, 7], 0, 3)
            )(
                ctx,
                MidWare(arr, [-1], [4, 5], 1, 2),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(8));
            expect(ctx).to.eql(range(4));
        });

        it('And(F) is F', async () => {
            const arr = [], ctx = [];
            const rets = await And(
                FalseWare(arr, [2, 3], 0)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(4));
            expect(ctx).to.eql(range(1));
        });

        it('And(T,T) is T', async () => {
            const arr = [], ctx = [];
            const rets = await And(
                TrueWare(arr, [2, 3], [10, 11], 0, 5),
                TrueWare(arr, [4, 5], [8, 9], 1, 4)
            )(
                ctx,
                MidWare(arr, [-1], [6, 7], 2, 3),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

        it('And(T,F) is F', async () => {
            const arr = [], ctx = [];
            const rets = await And(
                TrueWare(arr, [2, 3], [6, 7], 0, 2),
                FalseWare(arr, [4, 5], 1)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(8));
            expect(ctx).to.eql(range(3));
        });

        it('And(F,T) is F', async () => {
            const arr = [], ctx = [];
            const rets = await And(
                FalseWare(arr, [2, 3], 0),
                TrueWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(4));
            expect(ctx).to.eql(range(1));
        });

        it('And(F,F) is F', async () => {
            const arr = [], ctx = [];
            const rets = await And(
                FalseWare(arr, [2, 3], 0),
                FalseWare(arr, [-1], -1)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(4));
            expect(ctx).to.eql(range(1));
        });

    });

});
