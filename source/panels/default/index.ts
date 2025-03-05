import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App, ref } from 'vue';
import { IAnim, ISymbols, ISymbolGroup, ITableData } from './types-definition';
const panelDataMap = new WeakMap<any, App>();

export const useMousePosition = () => {
    const mouseX = ref<number | null>(null);
    const mouseY = ref<number | null>(null);

    document.addEventListener('mousemove', (e) => {
        mouseX.value = e.clientX;
        mouseY.value = e.clientY;
    });

    return { mouseX, mouseY };
};


export const useGlobalStore = () => {

    let anim: IAnim = {
        curSpeed: 0,
        oneLoopTime: 1,
        distanceOfOneLoop: 0,
        fps: 60,
        initFrame: 0,
        frameStep: 15
    }

    let symbols: ISymbols = {
        unit_width: 180,
        unit_height: 211,
        count: 21,
        nGroups: 3,

        preSymbols: {
            initPosY: 0,
            posYAtFrame: {},
            switchOrder: 2
        },

        mainSymbols: {
            initPosY: -422,
            posYAtFrame: {},
            switchOrder: 1
        },
        postSymbols: {
            initPosY: -844,
            posYAtFrame: {},
            switchOrder: 0
        },
    }

    let tableData: ITableData[] = [{
        pre: "pre-data", main: "main-data", post: "post-data"
    }]

    let data = ref({
        anim: anim,
        symbols: symbols,
        tableData: tableData,
        curSwitchOrder: -1,
    })

    let methods = {

        updateTable() {
            let anim = data.value.anim;
            let symbols = data.value.symbols;

            anim.distanceOfOneLoop = symbols.unit_height * symbols.count;
            anim.curSpeed = anim.distanceOfOneLoop / anim.oneLoopTime;

            symbols.preSymbols.posYAtFrame[anim.initFrame] = symbols.preSymbols.initPosY
            symbols.mainSymbols.posYAtFrame[anim.initFrame] = symbols.mainSymbols.initPosY
            symbols.postSymbols.posYAtFrame[anim.initFrame] = symbols.postSymbols.initPosY
            //let nextFrame = anim.initFrame + anim.frameStep;
            let framesArr = Array.from(
                { length: anim.fps / anim.frameStep },
                (_, i) => anim.initFrame + i * anim.frameStep
            ) // make [15, 30, 45, 60] if initFrame=0 or [35, 50, 65, 80] if initFrame = 20

            console.log("framesArr %o", framesArr);


            data.value.tableData = framesArr.map((frame, i) => {
                data.value.curSwitchOrder++;
                let getSymbolResultParams = {
                    curFrame: frame,
                    frameStep: anim.frameStep,
                    speed: anim.curSpeed,
                    curSwitchOrder: data.value.curSwitchOrder % symbols.nGroups,
                    distanceOfOneLoop: anim.distanceOfOneLoop,
                    fps: anim.fps
                }

                return {
                    pre: this.getSymbolResult(symbols.preSymbols, getSymbolResultParams),
                    main: this.getSymbolResult(symbols.mainSymbols, getSymbolResultParams),
                    post: this.getSymbolResult(symbols.postSymbols, getSymbolResultParams),
                }
            });

            console.log("tableData %o", data.value.tableData);

        },

        getSymbolResult(
            symbolGroup: ISymbolGroup,
            params: {
                curFrame: number,
                frameStep: number,
                speed: number,
                curSwitchOrder: number,
                distanceOfOneLoop: number,
                fps: number
            }
        ): string {
            const { curFrame, frameStep, speed, curSwitchOrder, distanceOfOneLoop, fps } = params;
            let res = `frame: ${curFrame}`;

            let prevSwitchOrder = curSwitchOrder - 1;
            let isSwitchOnTopOnLastTime =
                prevSwitchOrder >= 0 && prevSwitchOrder == symbolGroup.switchOrder
            let lastFrame = 0;

            if (false == isSwitchOnTopOnLastTime) {
                lastFrame = curFrame - frameStep >= 0 ? curFrame - frameStep : 0;
                let curPosY = symbolGroup.posYAtFrame[lastFrame];
                symbolGroup.posYAtFrame[curFrame] = this.getPosYOnMovingDownward(
                    curPosY, frameStep, speed, fps
                );
                res += `, curPosY: ${symbolGroup.posYAtFrame[curFrame]} `
            }

            else {
                lastFrame = curFrame - frameStep + 1 >= 0 ? curFrame - frameStep + 1 : 0;
                let curPosY = symbolGroup.posYAtFrame[lastFrame];
                symbolGroup.posYAtFrame[curFrame] = this.getPosYOnMovingDownward(
                    curPosY, frameStep - 1, speed, fps
                );
                res += `, curPosY: ${symbolGroup.posYAtFrame[curFrame]} `
            }

            if (curSwitchOrder == symbolGroup.switchOrder) {
                symbolGroup.posYAtFrame[curFrame + 1] = this.getPosYOnSwitchingToTop(
                    symbolGroup.posYAtFrame[curFrame], speed, distanceOfOneLoop, fps
                );

                res += `| `
                res += `frame: ${curFrame + 1}`
                res += `, curPosY: ${symbolGroup.posYAtFrame[curFrame + 1]} `
            }

            return res;

        },

        getPosYOnMovingDownward(
            curPosY: number,
            frameStep: number,
            speed: number,
            fps: number
        ): number {
            return curPosY - speed * frameStep / fps;
        },

        getPosYOnSwitchingToTop(
            curPosY: number,
            speed: number,
            distanceOfOneLoop: number,
            fps: number
        ): number {
            return curPosY + distanceOfOneLoop - speed * 1 / fps;
        },

    }
    return { data, methods }
}







/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        show() { console.log('show'); },
        hide() { console.log('hide'); },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        text: '#text',
    },
    methods: {},
    ready() {
        if (this.$.text) {
            this.$.text.innerHTML = 'Hello Cocos.';
        }

        if (this.$.app) {
            const app = createApp({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');

            // ---------------------
            // -- @app-testsection
            // ---------------------
            const { data, methods } = useGlobalStore();

            // -------------------
            // -- @app-component
            // -------------------
            app.component('reel-anim-info', {
                template: readFileSync(join(__dirname, '../../../static/template/vue/reel-anim-info.html'), 'utf-8'),
                data() {
                    return { data };
                },
                methods: methods,
                mounted() {
                    //data = (this as any).$data;
                    //methods.updateTable();
                },
            });
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});




