'use strict';

const { Pipeline } = require('..');

const { expect } = require('chai');

const {
    range,
    MidWare,
    EndWare,
    msgRight,
    msgWrong,
    ErrWareBeforeNext,
    ErrWareAfterNext,
    ErrWareMultiNext,
    MidSync,
    EndSync,
    ErrSyncBeforeNext,
} = require('./util');

describe('Pipeline', () => {

    describe('Basic usage', () => {

        it('Should work with empty middleware (1)', async () => {
            await Pipeline()();
        });

        it('Should work with empty middleware (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline()(
                ctx,
                MidWare(arr, [-1], [0, 1], 0, 1)
            );
            arr.push(...rets);
            expect(arr).to.eql(range(2));
            expect(ctx).to.eql(range(2));
        });

        it('Should work with empty middleware (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline()(
                ctx,
                MidWare(arr, [-1], [2, 3], 0, 1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(4));
            expect(ctx).to.eql(range(2));
        });

        it('Should call middlewares sequentially (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [0, 1], [8, 9], 0, 5),
                MidWare(arr, [2, 3], [6, 7], 1, 4),
                MidWare(arr, [-1], [4, 5], 2, 3)
            )(
                ctx
            );
            arr.push(...rets);
            expect(arr).to.eql(range(10));
            expect(ctx).to.eql(range(6));
        });

        it('Should call middlewares sequentially (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [10, 11], 0, 5),
                MidWare(arr, [4, 5], [8, 9], 1, 4),
                MidWare(arr, [-1], [6, 7], 2, 3)
            )(
                ctx,
                undefined,
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

        it('Should call middlewares sequentially (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [10, 11], 0, 5),
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

        it('Should return early when not call next() (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [6, 7], 0, 2),
                EndWare(arr, [4, 5], 1),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                undefined,
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(8));
            expect(ctx).to.eql(range(3));
        });

        it('Should return early when not call next() (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [6, 7], 0, 2),
                EndWare(arr, [4, 5], 1)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(8));
            expect(ctx).to.eql(range(3));
        });

        it('Should work with pipeline.push() (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline()
                .push(MidWare(arr, [2, 3], [10, 11], 0, 5))
                .push(MidWare(arr, [4, 5], [8, 9], 1, 4))
                .push(MidWare(arr, [-1], [6, 7], 2, 3))
                (
                    ctx,
                    undefined,
                    0, 1
                );
            arr.push(...rets);
            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

        it('Should work with pipeline.push() (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline()
                .push(MidWare(arr, [2, 3], [10, 11], 0, 5))
                .push(MidWare(arr, [4, 5], [8, 9], 1, 4))
                (
                    ctx,
                    MidWare(arr, [-1], [6, 7], 2, 3),
                    0, 1
                );
            arr.push(...rets);
            expect(arr).to.eql(range(12));
            expect(ctx).to.eql(range(6));
        });

        describe('Error capture', () => {

            it('Throw error before next() in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    MidWare(arr, [4, 5], [-1], 1, -1),
                    ErrWareBeforeNext(arr, 2),
                    MidWare(arr, [-1], [-1], -1, -1)
                );
                app(
                    ctx,
                    MidWare(arr, [-1], [-1], -1, -1),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(range(6));
                            expect(ctx).to.eql(range(3));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error before next() in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    MidWare(arr, [4, 5], [-1], 1, -1)
                );
                app(
                    ctx,
                    ErrWareBeforeNext(arr, 2),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(range(6));
                            expect(ctx).to.eql(range(3));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error after next() in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    MidWare(arr, [4, 5], [-1], 1, -1),
                    ErrWareAfterNext(arr, [6, 7], 2, 7),
                    MidWare(arr, [8, 9], [12, 13], 3, 6)
                );
                app(
                    ctx,
                    MidWare(arr, [-1], [10, 11], 4, 5),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(range(14));
                            expect(ctx).to.eql(range(8));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error after next() in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    MidWare(arr, [4, 5], [-1], 1, -1)
                );
                app(
                    ctx,
                    ErrWareAfterNext(arr, [-1], 2, 3),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(range(6));
                            expect(ctx).to.eql(range(4));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Call next() multiple times in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    MidWare(arr, [4, 5], [-1], 1, -1),
                    ErrWareMultiNext(arr, [6, 7], 2, 7),
                    MidWare(arr, [8, 9], [12, 13], 3, 6)
                );
                app(
                    ctx,
                    MidWare(arr, [-1], [10, 11], 4, 5),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal('next() is called multiple times!');
                            expect(arr).to.eql(range(14));
                            expect(ctx).to.eql(range(8));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Call next() multiple times in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    MidWare(arr, [4, 5], [-1], 1, -1)
                );
                app(
                    ctx,
                    ErrWareMultiNext(arr, [-1], 2, 3),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal('next() is called multiple times!');
                            expect(arr).to.eql(range(6));
                            expect(ctx).to.eql(range(4));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

        });

    });

    describe('Nested usage', () => {

        it('Should work with empty middleware (1)', async () => {
            await Pipeline(
                Pipeline(),
                Pipeline()
            )();
        });

        it('Should work with empty middleware (2)', async () => {
            await Pipeline(
                Pipeline(),
                Pipeline()
            )(
                undefined,
                Pipeline()
            );
        });

        it('Should work with empty middleware (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                Pipeline(),
                Pipeline()
            )(
                ctx,
                MidWare(arr, [-1], [0, 1], 0, 1)
            );
            arr.push(...rets);
            expect(arr).to.eql(range(2));
            expect(ctx).to.eql(range(2));
        });

        it('Should work with empty middleware (4)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                Pipeline(),
                Pipeline()
            )(
                ctx,
                MidWare(arr, [-1], [2, 3], 0, 1),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(4));
            expect(ctx).to.eql(range(2));
        });

        it('Should call middlewares sequentially', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [34, 35], 0, 17),
                Pipeline(
                    MidWare(arr, [4, 5], [32, 33], 1, 16),
                    MidWare(arr, [6, 7], [30, 31], 2, 15)
                ),
                MidWare(arr, [8, 9], [28, 29], 3, 14),
                Pipeline(
                    MidWare(arr, [10, 11], [26, 27], 4, 13),
                    MidWare(arr, [12, 13], [24, 25], 5, 12)
                ),
                MidWare(arr, [14, 15], [22, 23], 6, 11)
            )(
                ctx,
                Pipeline(
                    MidWare(arr, [16, 17], [20, 21], 7, 10),
                    MidWare(arr, [-1], [18, 19], 8, 9)
                ),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(36));
            expect(ctx).to.eql(range(18));
        });

        it('Should return early when not call next() (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [14, 15], 0, 6),
                Pipeline(
                    MidWare(arr, [4, 5], [12, 13], 1, 5),
                    Pipeline(
                        MidWare(arr, [6, 7], [10, 11], 2, 4),
                        EndWare(arr, [8, 9], 3),
                        MidWare(arr, [-1], [-1], -1, -1)
                    ),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                MidWare(arr, [-1], [-1], -1, -1),
                0, 1
            )
            arr.push(...rets);
            expect(arr).to.eql(range(16));
            expect(ctx).to.eql(range(7));
        });

        it('Should return early when not call next() (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [30, 31], 0, 14),
                Pipeline(
                    MidWare(arr, [4, 5], [28, 29], 1, 13),
                    Pipeline(
                        MidWare(arr, [6, 7], [26, 27], 2, 12),
                        MidWare(arr, [8, 9], [24, 25], 3, 11)
                    ),
                    MidWare(arr, [10, 11], [22, 23], 4, 10)
                ),
                MidWare(arr, [12, 13], [20, 21], 5, 9)
            )(
                ctx,
                Pipeline(
                    MidWare(arr, [14, 15], [18, 19], 6, 8),
                    EndWare(arr, [16, 17], 7),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                0, 1
            )
            arr.push(...rets);
            expect(arr).to.eql(range(32));
            expect(ctx).to.eql(range(15));
        });

        it('Should work with pipeline.push()', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline()
                .push(MidWare(arr, [2, 3], [34, 35], 0, 17))
                .push(
                    Pipeline()
                        .push(MidWare(arr, [4, 5], [32, 33], 1, 16))
                        .push(MidWare(arr, [6, 7], [30, 31], 2, 15))
                )
                .push(MidWare(arr, [8, 9], [28, 29], 3, 14))
                .push(
                    Pipeline()
                        .push(MidWare(arr, [10, 11], [26, 27], 4, 13))
                        .push(MidWare(arr, [12, 13], [24, 25], 5, 12))
                )
                .push(MidWare(arr, [14, 15], [22, 23], 6, 11))
                (
                    ctx,
                    Pipeline()
                        .push(MidWare(arr, [16, 17], [20, 21], 7, 10))
                        .push(MidWare(arr, [-1], [18, 19], 8, 9)),
                    0, 1
                )
            arr.push(...rets);
            expect(arr).to.eql(range(36));
            expect(ctx).to.eql(range(18));
        });

        describe('Error capture', () => {

            it('Throw error before next() in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, -1),
                        ErrWareBeforeNext(arr, 2),
                        MidWare(arr, [-1], [-1], -1, -1)
                    ),
                    MidWare(arr, [-1], [-1], -1, -1)
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [-1], [-1], -1, -1),
                        MidWare(arr, [-1], [-1], -1, -1)
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(range(6));
                            expect(ctx).to.eql(range(3));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error before next() in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, -1),
                        MidWare(arr, [6, 7], [-1], 2, -1)
                    ),
                    MidWare(arr, [8, 9], [-1], 3, -1)
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [10, 11], [-1], 4, -1),
                        ErrWareBeforeNext(arr, 5),
                        MidWare(arr, [-1], [-1], -1, -1)
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(range(12));
                            expect(ctx).to.eql(range(6));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error after next() in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, -1),
                        ErrWareAfterNext(arr, [6, 7], 2, 11),
                        MidWare(arr, [8, 9], [20, 21], 3, 10)
                    ),
                    MidWare(arr, [10, 11], [18, 19], 4, 9)
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [12, 13], [16, 17], 5, 8),
                        MidWare(arr, [-1], [14, 15], 6, 7)
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(range(22));
                            expect(ctx).to.eql(range(12));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error after next() in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, -1),
                        MidWare(arr, [6, 7], [-1], 2, -1)
                    ),
                    MidWare(arr, [8, 9], [-1], 3, -1)
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [10, 11], [-1], 4, -1),
                        ErrWareAfterNext(arr, [12, 13], 5, 8),
                        MidWare(arr, [-1], [14, 15], 6, 7)
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(range(16));
                            expect(ctx).to.eql(range(9));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Call next() multiple times in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, -1),
                        ErrWareMultiNext(arr, [6, 7], 2, 11),
                        MidWare(arr, [8, 9], [20, 21], 3, 10)
                    ),
                    MidWare(arr, [10, 11], [18, 19], 4, 9)
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [12, 13], [16, 17], 5, 8),
                        MidWare(arr, [-1], [14, 15], 6, 7)
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal('next() is called multiple times!');
                            expect(arr).to.eql(range(22));
                            expect(ctx).to.eql(range(12));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Call next() multiple times in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1], 1, -1),
                        MidWare(arr, [6, 7], [-1], 2, -1)
                    ),
                    MidWare(arr, [8, 9], [-1], 3, -1)
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [10, 11], [-1], 4, -1),
                        ErrWareMultiNext(arr, [12, 13], 5, 8),
                        MidWare(arr, [-1], [14, 15], 6, 7)
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal('next() is called multiple times!');
                            expect(arr).to.eql(range(16));
                            expect(ctx).to.eql(range(9));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

        });

    });

    describe('Usage with sync function', () => {

        it('Should work (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [28, 29], 0, 14),
                MidSync(arr, [4, 5], 1),
                Pipeline(
                    MidWare(arr, [6, 7], [26, 27], 2, 13),
                    MidSync(arr, [8, 9], 3),
                    MidWare(arr, [10, 11], [24, 25], 4, 12)
                ),
                Pipeline(
                    MidSync(arr, [12, 13], 5),
                    MidWare(arr, [14, 15], [22, 23], 6, 11),
                    MidSync(arr, [16, 17], 7)
                ),
                MidWare(arr, [18, 19], [20, 21], 8, 10),
                MidSync(arr, [-1], 9)
            )(
                ctx,
                undefined,
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(30));
            expect(ctx).to.eql(range(15));
        });

        it('Should work (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidSync(arr, [2, 3], 0),
                MidWare(arr, [4, 5], [34, 35], 1, 17),
                MidSync(arr, [6, 7], 2)
            )(
                ctx,
                Pipeline(
                    MidSync(arr, [8, 9], 3),
                    Pipeline(
                        MidWare(arr, [10, 11], [32, 33], 4, 16),
                        MidSync(arr, [12, 13], 5),
                        MidWare(arr, [14, 15], [30, 31], 6, 15)
                    ),
                    MidSync(arr, [16, 17], 7),
                    Pipeline(
                        MidSync(arr, [18, 19], 8),
                        MidWare(arr, [20, 21], [28, 29], 9, 14),
                        MidSync(arr, [22, 23], 10)
                    ),
                    MidSync(arr, [24, 25], 11),
                    MidWare(arr, [-1], [26, 27], 12, 13)
                ),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(36));
            expect(ctx).to.eql(range(18));
        });

        it('Should return early when not call next() (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [12, 13], 0, 5),
                MidSync(arr, [4, 5], 1),
                Pipeline(
                    MidWare(arr, [6, 7], [10, 11], 2, 4),
                    EndSync(arr, [8, 9], 3),
                    MidWare(arr, [-1], [-1], -1, -1)
                ),
                MidSync(arr, [-1], -1),
                MidWare(arr, [-1], [-1], -1, -1)
            )(
                ctx,
                undefined,
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(14));
            expect(ctx).to.eql(range(6));
        });

        it('Should return early when not call next() (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidSync(arr, [2, 3], 0),
                MidWare(arr, [4, 5], [16, 17], 1, 7),
                MidSync(arr, [6, 7], 2)
            )(
                ctx,
                Pipeline(
                    MidSync(arr, [8, 9], 3),
                    Pipeline(
                        MidWare(arr, [10, 11], [14, 15], 4, 6),
                        EndSync(arr, [12, 13], 5),
                        MidWare(arr, [-1], [-1], -1, -1)
                    ),
                    MidSync(arr, [-1], -1)
                ),
                0, 1
            );
            arr.push(...rets);
            expect(arr).to.eql(range(18));
            expect(ctx).to.eql(range(8));
        });

        describe('Error capture', () => {

            it('Throw error before next() in middleware', done => {
                const arr = [], ctx = [];
                try {
                    const app = Pipeline(
                        ErrSyncBeforeNext(arr, 0)
                    );
                    app(
                        ctx,
                        MidSync(arr, [-1], -1),
                        0, 1
                    );
                    done(new Error(msgWrong));
                } catch (err) {
                    expect(err.message).to.equal(msgRight);
                    expect(arr).to.eql(range(2));
                    expect(ctx).to.eql(range(1));
                    done();
                }
            });

            it('Throw error before next() in next()', done => {
                const arr = [], ctx = [];
                try {
                    const app = Pipeline();
                    app(
                        ctx,
                        ErrSyncBeforeNext(arr, 0),
                        0, 1
                    );
                    done(new Error(msgWrong));
                } catch (err) {
                    expect(err.message).to.equal(msgRight);
                    expect(arr).to.eql(range(2));
                    expect(ctx).to.eql(range(1));
                    done();
                }
            });

        });

    });

});
