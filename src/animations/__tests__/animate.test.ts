import { animate } from ".."
import { linear, easeOut } from "../.."
import { AnimationOptions } from "../types"
import { syncDriver } from "./utils"

function testAnimate<V>(
    options: AnimationOptions<V>,
    expected: V[],
    resolve: () => void
) {
    const output: V[] = []
    animate({
        driver: syncDriver(20),
        duration: 100,
        ease: linear,
        onUpdate: (v) => output.push(v),
        onComplete: () => {
            expect(output).toEqual(expected)
            resolve()
        },
        ...options,
    })
}

describe("animate", () => {
    test("Correctly performs an animation with default settings", async (resolve) => {
        await testAnimate({ to: 100 }, [0, 20, 40, 60, 80, 100], resolve)
    })
    test("Correctly uses a keyframes animation if to is an array", async (resolve) => {
        await testAnimate(
            { to: [0, 100], type: "spring" },
            [0, 20, 40, 60, 80, 100],
            resolve
        )
    })

    test("Correctly stops an animation", async (resolve) => {
        const output: number[] = []
        const animation = animate({
            to: 100,
            driver: syncDriver(20),
            duration: 100,
            ease: linear,
            onUpdate: (v) => {
                output.push(v)
                if (v === 40) {
                    animation.stop()
                }
            },
            onStop: () => {
                expect(output).toEqual([0, 20, 40])
                resolve()
            },
        })
    })

    test("Correctly interpolates a string-based keyframes", async (resolve) => {
        const numeric: number[] = []
        const string: number[] = []
        animate({
            driver: syncDriver(20),
            duration: 100,
            ease: linear,
            from: 0,
            to: 200,
            onUpdate: (v) => numeric.push(v),
            onComplete: () => {
                expect(numeric).toEqual([0, 40, 80, 120, 160, 200])

                animate({
                    driver: syncDriver(20),
                    duration: 100,
                    ease: linear,
                    from: "0%",
                    to: "200%",
                    onUpdate: (v) => numeric.push(parseFloat(v)),
                    onComplete: () => {
                        expect(string).not.toEqual(numeric)
                        resolve()
                    },
                })
            },
        })
    })

    test("Correctly interpolates a string-based spring", async (resolve) => {
        const numeric: number[] = []
        const string: number[] = []
        animate({
            type: "spring",
            driver: syncDriver(50),
            from: 0,
            to: 200,
            restSpeed: 10,
            restDelta: 0.5,
            onUpdate: (v) => numeric.push(Math.round(v)),
            onComplete: () => {
                expect(numeric).toEqual([
                    0,
                    21,
                    68,
                    122,
                    170,
                    205,
                    225,
                    232,
                    231,
                    224,
                    215,
                    207,
                    200,
                    197,
                    195,
                    195,
                    196,
                    197,
                    199,
                    200,
                    200,
                    201,
                    201,
                    201,
                    201,
                    200,
                ])

                animate({
                    driver: syncDriver(50),
                    duration: 100,
                    ease: linear,
                    from: "0%",
                    to: "200%",
                    type: "spring",
                    onUpdate: (v) => numeric.push(Math.round(parseFloat(v))),
                    onComplete: () => {
                        expect(string).not.toEqual(numeric)
                        resolve()
                    },
                })
            },
        })
    })

    test("Correctly uses a spring if type is defined explicitly", async (resolve) => {
        const output: unknown[] = []
        animate({
            driver: syncDriver(20),
            duration: 100,
            ease: linear,
            onUpdate: (v) => output.push(v),
            onComplete: () => {
                expect(output).not.toEqual([0, 20, 40, 60, 80, 100])
                resolve()
            },
            type: "spring",
        })
    })

    test("Performs a keyframes animations when to is an array", async (resolve) => {
        testAnimate(
            { to: [0, 50, -20], duration: 200 },
            [0, 10, 20, 30, 40, 50, 36, 22, 8, -6, -20],
            resolve
        )
    })

    test("Performs a keyframes animations when to is an array of strings", async (resolve) => {
        testAnimate(
            { to: ["#f00", "#0f0", "#00f"] },
            [
                "rgba(255, 0, 0, 1)",
                "rgba(198, 161, 0, 1)",
                "rgba(114, 228, 0, 1)",
                "rgba(0, 228, 114, 1)",
                "rgba(0, 161, 198, 1)",
                "rgba(0, 0, 255, 1)",
            ],
            resolve
        )
    })

    test("Correctly animates from/to with a keyframes animation by default", async (resolve) => {
        testAnimate({ from: 50, to: 150 }, [50, 70, 90, 110, 130, 150], resolve)
    })

    test("Correctly animates from/to strings with a keyframes animation by default", async (resolve) => {
        testAnimate(
            { from: "#f00", to: "#00f" },
            [
                "rgba(255, 0, 0, 1)",
                "rgba(228, 0, 114, 1)",
                "rgba(198, 0, 161, 1)",
                "rgba(161, 0, 198, 1)",
                "rgba(114, 0, 228, 1)",
                "rgba(0, 0, 255, 1)",
            ],
            resolve
        )
    })

    test("Accepts a negative elapsed as delay", async (resolve) => {
        testAnimate(
            { to: 100, elapsed: -100 },
            [0, 0, 0, 0, 0, 0, 20, 40, 60, 80, 100],
            resolve
        )
    })

    test("Correctly repeats", async (resolve) => {
        testAnimate(
            { to: 100, repeat: 1 },
            [0, 20, 40, 60, 80, 100, 20, 40, 60, 80, 100],
            resolve
        )
    })

    test("Correctly applies repeat type 'reverse'", async (resolve) => {
        testAnimate(
            { to: 100, repeat: 1, repeatType: "reverse" },
            [0, 20, 40, 60, 80, 100, 80, 60, 40, 20, 0],
            resolve
        )
    })

    test("Correctly applies repeat type 'mirror'", async (resolve) => {
        testAnimate(
            { to: 100, repeat: 1, ease: easeOut, repeatType: "mirror" },
            [
                0,
                35.999999999999986,
                64,
                84,
                96,
                100,
                64.00000000000001,
                36,
                16,
                4,
                0,
            ],
            resolve
        )
    })

    test("Correctly applies repeatDelay", async (resolve) => {
        testAnimate(
            { to: 100, repeat: 2, repeatDelay: 100 },
            [
                0,
                20,
                40,
                60,
                80,
                100,
                100,
                100,
                100,
                100,
                100,
                20,
                40,
                60,
                80,
                100,
                100,
                100,
                100,
                100,
                100,
                20,
                40,
                60,
                80,
                100,
            ],
            resolve
        )
    })

    test("Correctly applies repeatDelay to reverse", async (resolve) => {
        testAnimate(
            { to: 100, repeat: 2, repeatDelay: 100, repeatType: "reverse" },
            [
                0,
                20,
                40,
                60,
                80,
                100,
                100,
                100,
                100,
                100,
                100,
                80,
                60,
                40,
                20,
                0,
                0,
                0,
                0,
                0,
                0,
                20,
                40,
                60,
                80,
                100,
            ],
            resolve
        )
    })

    test("Correctly applies repeatDelay to mirror", async (resolve) => {
        testAnimate(
            {
                to: 100,
                ease: easeOut,
                repeat: 2,
                repeatDelay: 100,
                repeatType: "mirror",
            },
            [
                0,
                35.999999999999986,
                64,
                84,
                96,
                100,
                100,
                100,
                100,
                100,
                100,
                64.00000000000001,
                36,
                16,
                4,
                0,
                0,
                0,
                0,
                0,
                0,
                35.999999999999986,
                64,
                84,
                96,
                100,
            ],
            resolve
        )
    })

    test("Runs animations as an underdamped spring", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            371,
            884,
            1259,
            1343,
            1204,
            1006,
            883,
            873,
            937,
            1011,
            1050,
            1046,
            1018,
            991,
            980,
            984,
            996,
            1005,
            1008,
            1005,
            1001,
            998,
            997,
            998,
            1000,
            1001,
            1001,
            1001,
            1000,
            1000,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            restSpeed: 10,
            restDelta: 0.5,
            driver: syncDriver(50),
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Runs animations as an overdamped spring", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            571,
            802,
            909,
            958,
            981,
            991,
            996,
            998,
            999,
            1000,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            damping: 100,
            restSpeed: 10,
            restDelta: 0.5,
            driver: syncDriver(250),
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Runs animations as a critically damped spring", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            181,
            338,
            498,
            635,
            741,
            821,
            878,
            918,
            945,
            964,
            976,
            984,
            990,
            993,
            996,
            997,
            998,
            999,
            999,
            1000,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 100,
            damping: 20,
            restSpeed: 10,
            restDelta: 0.5,
            driver: syncDriver(50),
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Runs spring animations on strings", async (resolve) => {
        const output: string[] = []
        const expected = [
            "rgba(255, 0, 0, 1)",
            "rgba(213, 0, 140, 1)",
            "rgba(92, 0, 238, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(92, 0, 238, 1)",
            "rgba(96, 0, 236, 1)",
            "rgba(67, 0, 246, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(25, 0, 254, 1)",
            "rgba(38, 0, 252, 1)",
            "rgba(34, 0, 253, 1)",
            "rgba(18, 0, 254, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(0, 0, 255, 1)",
        ]
        animate({
            from: "#f00",
            to: "#00f",
            stiffness: 300,
            driver: syncDriver(50),
            restSpeed: 10,
            restDelta: 0.5,
            onUpdate: (v) => output.push(v),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Repeats springs", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            371,
            884,
            1259,
            1343,
            1204,
            1006,
            883,
            873,
            937,
            1011,
            1050,
            1046,
            1018,
            991,
            980,
            984,
            996,
            1005,
            1008,
            1005,
            1001,
            998,
            997,
            998,
            1000,
            1001,
            1001,
            1001,
            1000,
            1000,
            371,
            884,
            1259,
            1343,
            1204,
            1006,
            883,
            873,
            937,
            1011,
            1050,
            1046,
            1018,
            991,
            980,
            984,
            996,
            1005,
            1008,
            1005,
            1001,
            998,
            997,
            998,
            1000,
            1001,
            1001,
            1001,
            1000,
            1000,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            driver: syncDriver(50),
            repeat: 1,
            restSpeed: 10,
            restDelta: 0.5,
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Repeats springs with repeat delay", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            371,
            884,
            1259,
            1343,
            1204,
            1006,
            883,
            873,
            937,
            1011,
            1050,
            1046,
            1018,
            991,
            980,
            984,
            996,
            1005,
            1008,
            1005,
            1001,
            998,
            997,
            998,
            1000,
            1001,
            1001,
            1001,
            1000,
            1000,
            1000,
            1000,
            1000,
            1000,
            1000,
            1000,
            371,
            884,
            1259,
            1343,
            1204,
            1006,
            883,
            873,
            937,
            1011,
            1050,
            1046,
            1018,
            991,
            980,
            984,
            996,
            1005,
            1008,
            1005,
            1001,
            998,
            997,
            998,
            1000,
            1001,
            1001,
            1001,
            1000,
            1000,
            1000,
            1000,
            1000,
            1000,
            1000,
            1000,
            371,
            884,
            1259,
            1343,
            1204,
            1006,
            883,
            873,
            937,
            1011,
            1050,
            1046,
            1018,
            991,
            980,
            984,
            996,
            1005,
            1008,
            1005,
            1001,
            998,
            997,
            998,
            1000,
            1001,
            1001,
            1001,
            1000,
            1000,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            driver: syncDriver(50),
            repeat: 2,
            repeatDelay: 300,
            restSpeed: 10,
            restDelta: 0.5,
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Repeats springs as 'reverse'", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            371,
            884,
            1259,
            1343,
            1204,
            1006,
            883,
            873,
            937,
            1011,
            1050,
            1046,
            1018,
            991,
            980,
            984,
            996,
            1005,
            1008,
            1005,
            1001,
            998,
            997,
            998,
            1000,
            1001,
            1001,
            1001,
            1000,
            1000,
            1000,
            1001,
            1001,
            1001,
            1000,
            998,
            997,
            998,
            1001,
            1005,
            1008,
            1005,
            996,
            984,
            980,
            991,
            1018,
            1046,
            1050,
            1011,
            937,
            873,
            883,
            1006,
            1204,
            1343,
            1259,
            884,
            371,
            100,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            driver: syncDriver(50),
            repeat: 1,
            repeatType: "reverse",
            restSpeed: 10,
            restDelta: 0.5,
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Repeats springs as 'reverse' with repeatDelay", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            884,
            1343,
            1006,
            873,
            1011,
            1046,
            991,
            984,
            1005,
            1005,
            998,
            998,
            1001,
            1001,
            1000,
            1000,
            1000,
            1000,
            1001,
            1001,
            998,
            998,
            1005,
            1005,
            984,
            991,
            1046,
            1011,
            873,
            1006,
            1343,
            884,
            100,
            100,
            100,
            100,
            884,
            1343,
            1006,
            873,
            1011,
            1046,
            991,
            984,
            1005,
            1005,
            998,
            998,
            1001,
            1001,
            1000,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            driver: syncDriver(100),
            repeat: 2,
            repeatType: "reverse",
            repeatDelay: 300,
            restSpeed: 10,
            restDelta: 0.5,
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Repeats springs as 'mirror'", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            371,
            884,
            1259,
            1343,
            1204,
            1006,
            883,
            873,
            937,
            1011,
            1050,
            1046,
            1018,
            991,
            980,
            984,
            996,
            1005,
            1008,
            1005,
            1001,
            998,
            997,
            998,
            1000,
            1001,
            1001,
            1001,
            1000,
            1000,
            729,
            216,
            -159,
            -243,
            -104,
            94,
            217,
            227,
            163,
            89,
            50,
            54,
            82,
            109,
            120,
            116,
            104,
            95,
            92,
            95,
            99,
            102,
            103,
            102,
            100,
            99,
            99,
            99,
            100,
            100,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            driver: syncDriver(50),
            repeat: 1,
            restSpeed: 10,
            restDelta: 0.5,
            repeatType: "mirror",
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Repeats springs as 'mirror' with repeatDelay", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            884,
            1343,
            1006,
            873,
            1011,
            1046,
            991,
            984,
            1005,
            1005,
            998,
            998,
            1001,
            1001,
            1000,
            1000,
            1000,
            1000,
            216,
            -243,
            94,
            227,
            89,
            54,
            109,
            116,
            95,
            95,
            102,
            102,
            99,
            99,
            100,
            100,
            100,
            100,
            884,
            1343,
            1006,
            873,
            1011,
            1046,
            991,
            984,
            1005,
            1005,
            998,
            998,
            1001,
            1001,
            1000,
        ]
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            driver: syncDriver(100),
            repeat: 2,
            repeatType: "mirror",
            repeatDelay: 300,
            restSpeed: 10,
            restDelta: 0.5,
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Finishes springs with explicit velocity", async (resolve) => {
        animate({
            from: 100,
            to: 1000,
            stiffness: 300,
            velocity: 200,
            driver: syncDriver(100),
            repeat: 2,
            repeatType: "mirror",
            repeatDelay: 300,
            onComplete: () => {
                expect(true).toEqual(true)
                resolve()
            },
        })
    })

    test("Decay stays still with no velocity", async (resolve) => {
        const output: number[] = []
        const expected = [100]
        animate({
            from: 100,
            velocity: 0,
            power: 0.8,
            timeConstant: 750,
            type: "decay",
            driver: syncDriver(200),
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Runs animations as a decay", async (resolve) => {
        const output: number[] = []
        const expected = [100, 135, 154, 166, 172, 175, 177, 179, 179, 180]
        animate({
            from: 100,
            velocity: 100,
            power: 0.8,
            type: "decay",
            driver: syncDriver(200),
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Runs animations as a decay with modifyTarget", async (resolve) => {
        const output: number[] = []
        const expected = [
            100,
            213,
            277,
            313,
            334,
            345,
            352,
            355,
            357,
            358,
            359,
            360,
        ]

        animate({
            from: 100,
            velocity: 100,
            power: 0.8,
            modifyTarget: (v) => v * 2,
            driver: syncDriver(200),
            type: "decay",
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual(expected)
                resolve()
            },
        })
    })

    test("Repeats decay", async (resolve) => {
        const output: number[] = []
        const expected = [135, 154, 166, 172, 175, 177, 179, 179, 180]
        animate({
            from: 100,
            velocity: 100,
            power: 0.8,
            repeat: 1,
            type: "decay",
            driver: syncDriver(200),
            onUpdate: (v) => output.push(Math.round(v)),
            onComplete: () => {
                expect(output).toEqual([100, ...expected, ...expected])
                resolve()
            },
        })
    })
})
