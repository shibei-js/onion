'use strict';

const { Circuit, Pipeline } = require('..');

const { expect } = require('chai');

const {
    range,
    MidWare,
    EndWare,
    TrueWare,
    FalseWare,
} = require('./util');

describe('Circuit', () => {

    describe('Basic usage', () => {

        it('Condition is true (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
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
            const rets = await Circuit(
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

        it('Condition is true (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
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
            const rets = await Circuit(
                TrueWare(arr, [2, 3], [10, 11], 0, 5),
                MidWare(arr, [4, 5], [8, 9], 1, 4)
            )(
                ctx,
                MidWare(arr, [-1], [6, 7], 2, 3),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

        it('Condition is false (1)', async () => {
            await Circuit()();
        });

        it('Condition is false (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
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
            const rets = await Circuit(
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
            const rets = await Circuit(
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
            const rets = await Circuit(
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
            const rets = await Circuit(
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
            const circuit = Circuit();
            await circuit();

            expect(circuit.condition).to.equal(undefined);
            expect(circuit.middleware).to.equal(undefined);
        });

        it('Expose "condition" and "middleware" properties (2)', async () => {
            const arr = [], ctx = [];

            const cond = TrueWare(arr, [2, 3], [10, 11], 0, 5);
            const mw = MidWare(arr, [4, 5], [8, 9], 1, 4);
            const circuit = Circuit(cond, mw);

            const rets = await circuit(
                ctx,
                MidWare(arr, [-1], [6, 7], 2, 3),
                0, 1
            );
            arr.push(...rets);

            expect(circuit.condition).to.equal(cond);
            expect(circuit.middleware).to.equal(mw);
            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

        it.skip('Expose "condition" and "middleware" properties (3)', async () => {
            const arr = [], ctx = [];

            const circuit = Circuit(
                MidWare(arr, [-1], [-1], -1, -1),
                MidWare(arr, [-1], [-1], -1, -1)
            );
            circuit.condition = TrueWare(arr, [2, 3], [10, 11], 0, 5);
            circuit.middleware = MidWare(arr, [4, 5], [8, 9], 1, 4);

            const rets = await circuit(
                ctx,
                MidWare(arr, [-1], [6, 7], 2, 3),
                0, 1
            );
            arr.push(...rets);

            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

    });

    describe('Nested usage', () => {

        it('Condition is C(true,C(true,1))(2)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                TrueWare(arr, [2, 3], [14, 15], 0, 7),
                Circuit(
                    TrueWare(arr, [4, 5], [12, 13], 1, 6),
                    MidWare(arr, [6, 7], [10, 11], 2, 5)
                )
            )(
                ctx,
                MidWare(arr, [-1], [8, 9], 3, 4),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(16));
            expect(ctx).to.eql(range(8));
        });

        it('Condition is C(true,C(true,undefined))(1)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                TrueWare(arr, [2, 3], [10, 11], 0, 5),
                Circuit(
                    TrueWare(arr, [4, 5], [8, 9], 1, 4)
                )
            )(
                ctx,
                MidWare(arr, [-1], [6, 7], 2, 3),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

        it('Condition is C(true,C(false,-1))(1)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                TrueWare(arr, [2, 3], [6, 7], 0, 4),
                Circuit(
                    FalseWare(arr, [-1], 1),
                    MidWare(arr, [-1], [-1], -1, -1)
                )
            )(
                ctx,
                MidWare(arr, [-1], [4, 5], 2, 3),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(4), ...range(2, 8)]);
            expect(ctx).to.eql(range(5));
        });

        it('Condition is C(false,-1)(C(true,1))', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                FalseWare(arr, [-1], 0),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                Circuit(
                    TrueWare(arr, [2, 3], [6, 7], 1, 4),
                    MidWare(arr, [-1], [4, 5], 2, 3)
                ),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(2), ...range(8)]);
            expect(ctx).to.eql(range(5));
        });

        it('Condition is C(false,-1)(C(true,undefined))', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                FalseWare(arr, [-1], 0),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                Circuit(
                    TrueWare(arr, [-1], [2, 3], 1, 2)
                ),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(2), ...range(4)]);
            expect(ctx).to.eql(range(3));
        });

        it('Condition is C(false,-1)(C(false,-1))', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                FalseWare(arr, [-1], 0),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                Circuit(
                    FalseWare(arr, [-1], 1),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                0, 1
            );
            expect(rets).to.eql(undefined);
            expect(arr).to.eql([...range(2), ...range(2)]);
            expect(ctx).to.eql(range(2));
        });

        it('Condition is C(C(true,1),2)(3)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                Circuit(
                    TrueWare(arr, [2, 3], [14, 15], 0, 7),
                    MidWare(arr, [4, 5], [12, 13], 1, 6)
                ),
                MidWare(arr, [6, 7], [10, 11], 2, 5)
            )(
                ctx,
                MidWare(arr, [-1], [8, 9], 3, 4),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(16));
            expect(ctx).to.eql(range(8));
        });

        it('Condition is C(C(false,-1),1)(2)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                Circuit(
                    FalseWare(arr, [-1], 0),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                MidWare(arr, [2, 3], [6, 7], 1, 4)
            )(
                ctx,
                MidWare(arr, [-1], [4, 5], 2, 3),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(2), ...range(8)]);
            expect(ctx).to.eql(range(5));
        });

    });

    describe('Usage with Pipeline', () => {

        it('Condition is true', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [26, 27], 0, 13),
                Circuit(
                    Pipeline(
                        MidWare(arr, [4, 5], [24, 25], 1, 12),
                        MidWare(arr, [6, 7], [22, 23], 2, 11)
                    ),
                    Pipeline(
                        MidWare(arr, [8, 9], [20, 21], 3, 10),
                        MidWare(arr, [10, 11], [18, 19], 4, 9)
                    )
                ),
                MidWare(arr, [12, 13], [16, 17], 5, 8)
            )(
                ctx,
                MidWare(arr, [-1], [14, 15], 6, 7),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(28));
            expect(ctx).to.eql(range(14));
        });

        it('Condition is false', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [22, 23], 0, 12),
                Circuit(
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

        it('Condition is P(C(false,-1),C(true,1))', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [34, 35], 0, 18),
                Circuit(
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, 5),
                        MidWare(arr, [6, 7], [10, 11], 2, 4),
                        EndWare(arr, [8, 9], 3),
                        MidWare(arr, [-1], [-1], -1, -1)
                    ),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                Circuit(
                    Pipeline(
                        MidWare(arr, [12, 13], [32, 33], 6, 17),
                        MidWare(arr, [14, 15], [30, 31], 7, 16)
                    ),
                    Pipeline(
                        MidWare(arr, [16, 17], [28, 29], 8, 15),
                        MidWare(arr, [18, 19], [26, 27], 9, 14)
                    )
                ),
                MidWare(arr, [20, 21], [24, 25], 10, 13)
            )(
                ctx,
                MidWare(arr, [-1], [22, 23], 11, 12),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql([...range(12), ...range(2, 4), ...range(12, 36)]);
            expect(ctx).to.eql(range(19));
        });

    });

});
