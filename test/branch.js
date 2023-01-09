'use strict';

const { Branch, Pipeline } = require('..');

const { expect } = require('chai');

const {
    range,
    MidWare,
    EndWare,
    TrueWare,
    FalseWare,
} = require('./util');

describe('Branch', () => {

    describe('Basic usage', () => {

        it('Condition is true (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                TrueWare(arr, [-1], [0, 1], 0, 1)
            )(
                ctx
            );
            arr.push(...rets);
            expect(arr).to.eql(range(2));
            expect(ctx).to.eql(range(2));
        });

        it('Condition is true (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                TrueWare(arr, [-1], [2, 3], 0, 1)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(4));
            expect(ctx).to.eql(range(2));
        });

        it('Condition is true (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                TrueWare(arr, [2, 3], [6, 7], 0, 3),
                MidWare(arr, [-1], [4, 5], 1, 2)
            )(
                ctx,
                undefined,
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(8));
            expect(ctx).to.eql(range(4));
        });

        it('Condition is true (4)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                TrueWare(arr, [2, 3], [6, 7], 0, 3),
                MidWare(arr, [-1], [4, 5], 1, 2)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(8));
            expect(ctx).to.eql(range(4));
        });

        it('Condition is false (1)', async () => {
            await Branch()();
        });

        it('Condition is false (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                FalseWare(arr, [-1], 0)
            )(
                ctx,
                undefined,
                0, 1
            );
            expect(rets).to.eql(undefined);
            expect(arr).to.eql(range(2));
            expect(ctx).to.eql(range(1));
        });

        it('Condition is false (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                FalseWare(arr, [-1], 0)
            )(
                ctx,
                MidWare(arr, [-1], [2, 3], 1, 2),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(2), ...range(4)]);
            expect(ctx).to.eql(range(3));
        });

        it('Condition is false (4)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                undefined,
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                undefined,
                -1
            );
            expect(rets).to.eql(undefined);
            expect(arr).to.eql([]);
            expect(ctx).to.eql([]);
        });

        it('Condition is false (5)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                undefined,
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                MidWare(arr, [-1], [2, 3], 0, 1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(4));
            expect(ctx).to.eql(range(2));
        });

        it('Condition is false (6)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                FalseWare(arr, [-1], 0),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                MidWare(arr, [-1], [2, 3], 1, 2),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(2), ...range(4)]);
            expect(ctx).to.eql(range(3));
        });

        it('Expose "condition" and "middleware" properties (1)', async () => {
            const branch = Branch();
            await branch();

            expect(branch.condition).to.equal(undefined);
            expect(branch.middleware).to.equal(undefined);
        });

        it('Expose "condition" and "middleware" properties (2)', async () => {
            const arr = [], ctx = [];

            const cond = TrueWare(arr, [2, 3], [6, 7], 0, 3);
            const mw = MidWare(arr, [-1], [4, 5], 1, 2);
            const branch = Branch(cond, mw);

            const rets = await branch(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);

            expect(branch.condition).to.equal(cond);
            expect(branch.middleware).to.equal(mw);
            expect(arr).to.eql(range(8));
            expect(ctx).to.eql(range(4));
        });

        it('Expose "condition" and "middleware" properties (3)', async () => {
            const arr = [], ctx = [];

            const branch = Branch(
                MidWare(arr, [-1], [-1], -1, -1),
                MidWare(arr, [-1], [-1], -1, -1)
            );
            branch.condition = TrueWare(arr, [2, 3], [6, 7], 0, 3);
            branch.middleware = MidWare(arr, [-1], [4, 5], 1, 2);

            const rets = await branch(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);

            expect(arr).to.eql(range(8));
            expect(ctx).to.eql(range(4));
        });

    });

    describe('Nested usage', () => {

        it('Condition is B(true,B(true,1))(-1)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                TrueWare(arr, [2, 3], [10, 11], 0, 5),
                Branch(
                    TrueWare(arr, [4, 5], [8, 9], 1, 4),
                    MidWare(arr, [-1], [6, 7], 2, 3)
                )
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

        it('Condition is B(true,B(false,-1))(-1)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                TrueWare(arr, [2, 3], [4, 5], 0, 2),
                Branch(
                    FalseWare(arr, [-1], 1),
                    MidWare(arr, [-1], [-1], -1, -1)
                )
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(6));
            expect(ctx).to.eql(range(3));
        });

        it('Condition is B(false,-1)(B(true,1))', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                FalseWare(arr, [-1], 0),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                Branch(
                    TrueWare(arr, [2, 3], [6, 7], 1, 4),
                    MidWare(arr, [-1], [4, 5], 2, 3)
                ),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(2), ...range(8)]);
            expect(ctx).to.eql(range(5));
        });

        it('Condition is B(false,-1)(B(false,-1))', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                FalseWare(arr, [-1], 0),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                Branch(
                    FalseWare(arr, [-1], 1),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                0, 1
            );
            expect(rets).to.eql(undefined);
            expect(arr).to.eql([...range(2), ...range(2)]);
            expect(ctx).to.eql(range(2));
        });

        it('Condition is B(B(true,1),-1)(2)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                Branch(
                    TrueWare(arr, [2, 3], [-1], 0, 3),
                    MidWare(arr, [-1], [4, 5], 1, 2)
                ),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                MidWare(arr, [-1], [6, 7], 4, 5),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(6), ...range(2), ...range(6, 8)]);
            expect(ctx).to.eql(range(6));
        });

        it('Condition is B(B(false,-1),1)(-1)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                Branch(
                    FalseWare(arr, [-1], 0),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                MidWare(arr, [-1], [2, 3], 1, 2)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(2), ...range(4)]);
            expect(ctx).to.eql(range(3));
        });

    });

    describe('Usage with Pipeline', () => {

        it('Condition is true', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [18, 19], 0, 9),
                Branch(
                    Pipeline(
                        MidWare(arr, [4, 5], [16, 17], 1, 8),
                        MidWare(arr, [6, 7], [14, 15], 2, 7)
                    ),
                    Pipeline(
                        MidWare(arr, [8, 9], [12, 13], 3, 6),
                        MidWare(arr, [-1], [10, 11], 4, 5)
                    )
                ),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(20));
            expect(ctx).to.eql(range(10));
        });

        it('Condition is false', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [22, 23], 0, 12),
                Branch(
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, 5),
                        MidWare(arr, [6, 7], [10, 11], 2, 4),
                        EndWare(arr, [8, 9], 3),
                        MidWare(arr, [-1], [-1], -1, -1)
                    ),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                Pipeline(
                    MidWare(arr, [12, 13], [20, 21], 6, 11),
                    MidWare(arr, [14, 15], [18, 19], 7, 10)
                )
            )(
                ctx,
                MidWare(arr, [-1], [16, 17], 8, 9),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(12), ...range(2, 4), ...range(12, 24)]);
            expect(ctx).to.eql(range(13));
        });

        it('Condition is P(B(false,-1),B(true,1))', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [26, 27], 0, 14),
                Branch(
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, 5),
                        MidWare(arr, [6, 7], [10, 11], 2, 4),
                        EndWare(arr, [8, 9], 3),
                        MidWare(arr, [-1], [-1], -1, -1)
                    ),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                Branch(
                    Pipeline(
                        MidWare(arr, [12, 13], [24, 25], 6, 13),
                        MidWare(arr, [14, 15], [22, 23], 7, 12)
                    ),
                    Pipeline(
                        MidWare(arr, [16, 17], [20, 21], 8, 11),
                        MidWare(arr, [-1], [18, 19], 9, 10)
                    )
                ),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(12), ...range(2, 4), ...range(12, 28)]);
            expect(ctx).to.eql(range(15));
        });

    });

});
