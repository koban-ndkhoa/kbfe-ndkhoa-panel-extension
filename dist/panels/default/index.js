"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGlobalStore = exports.symbols = exports.useMousePosition = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = require("vue");
const panelDataMap = new WeakMap();
const useMousePosition = () => {
    const mouseX = (0, vue_1.ref)(null);
    const mouseY = (0, vue_1.ref)(null);
    document.addEventListener('mousemove', (e) => {
        mouseX.value = e.clientX;
        mouseY.value = e.clientY;
    });
    return { mouseX, mouseY };
};
exports.useMousePosition = useMousePosition;
exports.symbols = {
    unit_width: 180,
    unit_height: 211,
    count: 20,
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
};
const useGlobalStore = () => {
    let tableData = [{
            pre: "pre-data", main: "main-data", post: "post-data"
        }];
    let anim = {
        curSpeed: 0,
        oneLoopTime: 1,
        distanceOfOneLoop: 0,
        fps: 60,
        initFrame: 20,
        frameStep: 15
    };
    let data = (0, vue_1.ref)({
        curSwitchOrder: -1,
        symbols: exports.symbols,
        tableData: tableData,
        anim: anim,
    });
    let methods = {
        updateTable() {
            let anim = data.value.anim;
            let symbols = data.value.symbols;
            anim.distanceOfOneLoop = symbols.unit_height * symbols.count;
            anim.curSpeed = anim.distanceOfOneLoop / anim.oneLoopTime;
            symbols.preSymbols.posYAtFrame[anim.initFrame] = symbols.preSymbols.initPosY;
            symbols.mainSymbols.posYAtFrame[anim.initFrame] = symbols.mainSymbols.initPosY;
            symbols.postSymbols.posYAtFrame[anim.initFrame] = symbols.postSymbols.initPosY;
            let nextFrame = anim.initFrame + anim.frameStep;
            let framesArr = Array.from({ length: anim.fps / anim.frameStep }, (_, i) => nextFrame + i * anim.frameStep); // make [15, 30, 45, 60] or [35, 50, 65, 80]
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
                };
                return {
                    pre: this.getSymbolResult(symbols.preSymbols, getSymbolResultParams),
                    main: this.getSymbolResult(symbols.mainSymbols, getSymbolResultParams),
                    post: this.getSymbolResult(symbols.postSymbols, getSymbolResultParams),
                };
            });
            console.log("tableData %o", data.value.tableData);
        },
        getSymbolResult(symbolGroup, params) {
            const { curFrame, frameStep, speed, curSwitchOrder, distanceOfOneLoop, fps } = params;
            let res = `frame: ${curFrame}`;
            let prevSwitchOrder = curSwitchOrder - 1;
            let isSwitchOnTopOnLastTime = prevSwitchOrder >= 0 && prevSwitchOrder == symbolGroup.switchOrder;
            let lastFrame = 0;
            if (false == isSwitchOnTopOnLastTime) {
                lastFrame = curFrame - frameStep >= 0 ? curFrame - frameStep : 0;
                let curPosY = symbolGroup.posYAtFrame[lastFrame];
                symbolGroup.posYAtFrame[curFrame] = this.getPosYOnMovingDownward(curPosY, frameStep, speed, fps);
                res += `, curPosY: ${symbolGroup.posYAtFrame[curFrame]} `;
            }
            else {
                lastFrame = curFrame - frameStep + 1 >= 0 ? curFrame - frameStep + 1 : 0;
                let curPosY = symbolGroup.posYAtFrame[lastFrame];
                symbolGroup.posYAtFrame[curFrame] = this.getPosYOnMovingDownward(curPosY, frameStep - 1, speed, fps);
                res += `, curPosY: ${symbolGroup.posYAtFrame[curFrame]} `;
            }
            if (curSwitchOrder == symbolGroup.switchOrder) {
                symbolGroup.posYAtFrame[curFrame + 1] = this.getPosYOnSwitchingToTop(symbolGroup.posYAtFrame[curFrame], speed, distanceOfOneLoop, fps);
                res += `| `;
                res += `frame: ${curFrame + 1}`;
                res += `, curPosY: ${symbolGroup.posYAtFrame[curFrame + 1]} `;
            }
            return res;
        },
        getPosYOnMovingDownward(curPosY, frameStep, speed, fps) {
            return curPosY - speed * frameStep / fps;
        },
        getPosYOnSwitchingToTop(curPosY, speed, distanceOfOneLoop, fps) {
            return curPosY + distanceOfOneLoop - speed * 1 / fps;
        },
    };
    return { data, methods };
};
exports.useGlobalStore = useGlobalStore;
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
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
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
            const app = (0, vue_1.createApp)({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            // ---------------------
            // -- @app-testsection
            // ---------------------
            const { data, methods } = (0, exports.useGlobalStore)();
            // -------------------
            // -- @app-component
            // -------------------
            app.component('reel-anim-info', {
                template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/vue/reel-anim-info.html'), 'utf-8'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUM1Qiw2QkFBMEM7QUFFMUMsTUFBTSxZQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVksQ0FBQztBQUV0QyxNQUFNLGdCQUFnQixHQUFHLEdBQUcsRUFBRTtJQUNqQyxNQUFNLE1BQU0sR0FBRyxJQUFBLFNBQUcsRUFBZ0IsSUFBSSxDQUFDLENBQUM7SUFDeEMsTUFBTSxNQUFNLEdBQUcsSUFBQSxTQUFHLEVBQWdCLElBQUksQ0FBQyxDQUFDO0lBRXhDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUN6QyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDekIsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQzdCLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUM5QixDQUFDLENBQUM7QUFWVyxRQUFBLGdCQUFnQixvQkFVM0I7QUFFUyxRQUFBLE9BQU8sR0FBYTtJQUMzQixVQUFVLEVBQUUsR0FBRztJQUNmLFdBQVcsRUFBRSxHQUFHO0lBQ2hCLEtBQUssRUFBRSxFQUFFO0lBQ1QsT0FBTyxFQUFFLENBQUM7SUFFVixVQUFVLEVBQUU7UUFDUixRQUFRLEVBQUUsQ0FBQztRQUNYLFdBQVcsRUFBRSxFQUFFO1FBQ2YsV0FBVyxFQUFFLENBQUM7S0FDakI7SUFFRCxXQUFXLEVBQUU7UUFDVCxRQUFRLEVBQUUsQ0FBQyxHQUFHO1FBQ2QsV0FBVyxFQUFFLEVBQUU7UUFDZixXQUFXLEVBQUUsQ0FBQztLQUNqQjtJQUNELFdBQVcsRUFBRTtRQUNULFFBQVEsRUFBRSxDQUFDLEdB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LENBQUM7WUFDMUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTVFLHdCQUF3QjtZQUN4QixzQkFBc0I7WUFDdEIsd0JBQXdCO1lBQ3hCLE1BQU0sRUFBRSxJQUFJLEVBQUcsT0FBTyxFQUFFLEdBQUcsSUFBQSxzQkFBYyxHQUFFLENBQUM7WUFFNUMsc0JBQXNCO1lBQ3RCLG9CQUFvQjtZQUNwQixzQkFBc0I7WUFDdEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDNUIsUUFBUSxFQUFFLElBQUEsdUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsa0RBQWtELENBQUMsRUFBRSxPQUFPLENBQUM7Z0JBQ3BHLElBQUk7b0JBQ0EsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUNwQixDQUFDO2dCQUNELE9BQU8sRUFBRSxPQUFPO2dCQUNoQixPQUFPO29CQUNILDZCQUE2QjtvQkFDN0Isd0JBQXdCO2dCQUM1QixDQUFDO2FBQ0osQ0FBQyxDQUFDO1lBQ0gsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7SUFDTCxDQUFDO0lBQ0QsV0FBVyxLQUFLLENBQUM7SUFDakIsS0FBSztRQUNELE1BQU0sR0FBRyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNOLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsQixDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcclxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBjcmVhdGVBcHAsIEFwcCwgcmVmIH0gZnJvbSAndnVlJztcclxuaW1wb3J0IHsgSUFuaW0sIElTeW1ib2xzLCBJU3ltYm9sR3JvdXAsIElUYWJsZURhdGEgfSBmcm9tICcuL3R5cGVzLWRlZmluaXRpb24nO1xyXG5jb25zdCBwYW5lbERhdGFNYXAgPSBuZXcgV2Vha01hcDxhbnksIEFwcD4oKTtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VNb3VzZVBvc2l0aW9uID0gKCkgPT4ge1xyXG4gICAgY29uc3QgbW91c2VYID0gcmVmPG51bWJlciB8IG51bGw+KG51bGwpO1xyXG4gICAgY29uc3QgbW91c2VZID0gcmVmPG51bWJlciB8IG51bGw+KG51bGwpO1xyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB7XHJcbiAgICAgICAgbW91c2VYLnZhbHVlID0gZS5jbGllbnRYO1xyXG4gICAgICAgIG1vdXNlWS52YWx1ZSA9IGUuY2xpZW50WTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB7IG1vdXNlWCwgbW91c2VZIH07XHJcbn07XHJcblxyXG5leHBvcnQgbGV0IHN5bWJvbHM6IElTeW1ib2xzID0ge1xyXG4gICAgdW5pdF93aWR0aDogMTgwLFxyXG4gICAgdW5pdF9oZWlnaHQ6IDIxMSxcclxuICAgIGNvdW50OiAyMCxcclxuICAgIG5Hcm91cHM6IDMsXHJcblxyXG4gICAgcHJlU3ltYm9sczoge1xyXG4gICAgICAgIGluaXRQb3NZOiAwLFxyXG4gICAgICAgIHBvc1lBdEZyYW1lOiB7fSxcclxuICAgICAgICBzd2l0Y2hPcmRlcjogMlxyXG4gICAgfSxcclxuXHJcbiAgICBtYWluU3ltYm9sczoge1xyXG4gICAgICAgIGluaXRQb3NZOiAtNDIyLFxyXG4gICAgICAgIHBvc1lBdEZyYW1lOiB7fSxcclxuICAgICAgICBzd2l0Y2hPcmRlcjogMVxyXG4gICAgfSxcclxuICAgIHBvc3RTeW1ib2xzOiB7XHJcbiAgICAgICAgaW5pdFBvc1k6IC04NDQsXHJcbiAgICAgICAgcG9zWUF0RnJhbWU6IHt9LFxyXG4gICAgICAgIHN3aXRjaE9yZGVyOiAwXHJcbiAgICB9LFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgdXNlR2xvYmFsU3RvcmUgPSAoKSA9PiB7XHJcblxyXG4gICAgbGV0IHRhYmxlRGF0YTogSVRhYmxlRGF0YVtdID0gW3tcclxuICAgICAgICBwcmU6IFwicHJlLWRhdGFcIiwgbWFpbjogXCJtYWluLWRhdGFcIiwgcG9zdDogXCJwb3N0LWRhdGFcIlxyXG4gICAgfV1cclxuXHJcbiAgICBsZXQgYW5pbTogSUFuaW0gPSB7XHJcbiAgICAgICAgY3VyU3BlZWQ6IDAsXHJcbiAgICAgICAgb25lTG9vcFRpbWU6IDEsXHJcbiAgICAgICAgZGlzdGFuY2VPZk9uZUxvb3A6IDAsXHJcbiAgICAgICAgZnBzOiA2MCxcclxuICAgICAgICBpbml0RnJhbWU6IDIwLFxyXG4gICAgICAgIGZyYW1lU3RlcDogMTVcclxuICAgIH1cclxuXHJcbiAgICBsZXQgZGF0YSA9IHJlZih7XHJcbiAgICAgICAgY3VyU3dpdGNoT3JkZXI6IC0xLFxyXG4gICAgICAgIHN5bWJvbHM6IHN5bWJvbHMsXHJcbiAgICAgICAgdGFibGVEYXRhOiB0YWJsZURhdGEsXHJcbiAgICAgICAgYW5pbTogYW5pbSxcclxuICAgIH0pXHJcblxyXG4gICAgbGV0IG1ldGhvZHMgPSB7XHJcblxyXG4gICAgICAgIHVwZGF0ZVRhYmxlKCkge1xyXG4gICAgICAgICAgICBsZXQgYW5pbSA9IGRhdGEudmFsdWUuYW5pbTtcclxuICAgICAgICAgICAgbGV0IHN5bWJvbHMgPSBkYXRhLnZhbHVlLnN5bWJvbHM7XHJcblxyXG4gICAgICAgICAgICBhbmltLmRpc3RhbmNlT2ZPbmVMb29wID0gc3ltYm9scy51bml0X2hlaWdodCAqIHN5bWJvbHMuY291bnQ7XHJcbiAgICAgICAgICAgIGFuaW0uY3VyU3BlZWQgPSBhbmltLmRpc3RhbmNlT2ZPbmVMb29wIC8gYW5pbS5vbmVMb29wVGltZTtcclxuXHJcbiAgICAgICAgICAgIHN5bWJvbHMucHJlU3ltYm9scy5wb3NZQXRGcmFtZVthbmltLmluaXRGcmFtZV0gID0gc3ltYm9scy5wcmVTeW1ib2xzLmluaXRQb3NZXHJcbiAgICAgICAgICAgIHN5bWJvbHMubWFpblN5bWJvbHMucG9zWUF0RnJhbWVbYW5pbS5pbml0RnJhbWVdID0gc3ltYm9scy5tYWluU3ltYm9scy5pbml0UG9zWVxyXG4gICAgICAgICAgICBzeW1ib2xzLnBvc3RTeW1ib2xzLnBvc1lBdEZyYW1lW2FuaW0uaW5pdEZyYW1lXSA9IHN5bWJvbHMucG9zdFN5bWJvbHMuaW5pdFBvc1lcclxuICAgICAgICAgICAgbGV0IG5leHRGcmFtZSA9IGFuaW0uaW5pdEZyYW1lICsgYW5pbS5mcmFtZVN0ZXA7XHJcbiAgICAgICAgICAgIGxldCBmcmFtZXNBcnIgPSBBcnJheS5mcm9tKFxyXG4gICAgICAgICAgICAgICAgeyBsZW5ndGg6IGFuaW0uZnBzIC8gYW5pbS5mcmFtZVN0ZXAgfSxcclxuICAgICAgICAgICAgICAgIChfLCBpKSA9PiBuZXh0RnJhbWUgKyBpICogYW5pbS5mcmFtZVN0ZXBcclxuICAgICAgICAgICAgKSAvLyBtYWtlIFsxNSwgMzAsIDQ1LCA2MF0gb3IgWzM1LCA1MCwgNjUsIDgwXVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJmcmFtZXNBcnIgJW9cIiwgZnJhbWVzQXJyKTtcclxuXHJcblxyXG4gICAgICAgICAgICBkYXRhLnZhbHVlLnRhYmxlRGF0YSA9IGZyYW1lc0Fyci5tYXAoKGZyYW1lLCBpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLnZhbHVlLmN1clN3aXRjaE9yZGVyKys7XHJcbiAgICAgICAgICAgICAgICBsZXQgZ2V0U3ltYm9sUmVzdWx0UGFyYW1zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGN1ckZyYW1lOiBmcmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBmcmFtZVN0ZXA6IGFuaW0uZnJhbWVTdGVwLFxyXG4gICAgICAgICAgICAgICAgICAgIHNwZWVkOiBhbmltLmN1clNwZWVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGN1clN3aXRjaE9yZGVyOiBkYXRhLnZhbHVlLmN1clN3aXRjaE9yZGVyICUgc3ltYm9scy5uR3JvdXBzLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3RhbmNlT2ZPbmVMb29wOiBhbmltLmRpc3RhbmNlT2ZPbmVMb29wLFxyXG4gICAgICAgICAgICAgICAgICAgIGZwczogYW5pbS5mcHNcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHByZTogdGhpcy5nZXRTeW1ib2xSZXN1bHQoc3ltYm9scy5wcmVTeW1ib2xzLCBnZXRTeW1ib2xSZXN1bHRQYXJhbXMpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1haW46IHRoaXMuZ2V0U3ltYm9sUmVzdWx0KHN5bWJvbHMubWFpblN5bWJvbHMsIGdldFN5bWJvbFJlc3VsdFBhcmFtcyksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zdDogdGhpcy5nZXRTeW1ib2xSZXN1bHQoc3ltYm9scy5wb3N0U3ltYm9scywgZ2V0U3ltYm9sUmVzdWx0UGFyYW1zKSxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInRhYmxlRGF0YSAlb1wiLCBkYXRhLnZhbHVlLnRhYmxlRGF0YSk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldFN5bWJvbFJlc3VsdChcclxuICAgICAgICAgICAgc3ltYm9sR3JvdXA6IElTeW1ib2xHcm91cCxcclxuICAgICAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgICAgICBjdXJGcmFtZTogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgZnJhbWVTdGVwOiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBzcGVlZDogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgY3VyU3dpdGNoT3JkZXI6IG51bWJlcixcclxuICAgICAgICAgICAgICAgIGRpc3RhbmNlT2ZPbmVMb29wOiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBmcHM6IG51bWJlclxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTogc3RyaW5nIHtcclxuICAgICAgICAgICAgY29uc3QgeyBjdXJGcmFtZSwgZnJhbWVTdGVwLCBzcGVlZCwgY3VyU3dpdGNoT3JkZXIsIGRpc3RhbmNlT2ZPbmVMb29wLCBmcHMgfSA9IHBhcmFtcztcclxuICAgICAgICAgICAgbGV0IHJlcyA9IGBmcmFtZTogJHtjdXJGcmFtZX1gO1xyXG5cclxuICAgICAgICAgICAgbGV0IHByZXZTd2l0Y2hPcmRlciA9IGN1clN3aXRjaE9yZGVyIC0gMTtcclxuICAgICAgICAgICAgbGV0IGlzU3dpdGNoT25Ub3BPbkxhc3RUaW1lID1cclxuICAgICAgICAgICAgICAgIHByZXZTd2l0Y2hPcmRlciA+PSAwICYmIHByZXZTd2l0Y2hPcmRlciA9PSBzeW1ib2xHcm91cC5zd2l0Y2hPcmRlclxyXG4gICAgICAgICAgICBsZXQgbGFzdEZyYW1lID0gMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PSBpc1N3aXRjaE9uVG9wT25MYXN0VGltZSkge1xyXG4gICAgICAgICAgICAgICAgbGFzdEZyYW1lID0gY3VyRnJhbWUgLSBmcmFtZVN0ZXAgPj0gMCA/IGN1ckZyYW1lIC0gZnJhbWVTdGVwIDogMDtcclxuICAgICAgICAgICAgICAgIGxldCBjdXJQb3NZID0gc3ltYm9sR3JvdXAucG9zWUF0RnJhbWVbbGFzdEZyYW1lXTtcclxuICAgICAgICAgICAgICAgIHN5bWJvbEdyb3VwLnBvc1lBdEZyYW1lW2N1ckZyYW1lXSA9IHRoaXMuZ2V0UG9zWU9uTW92aW5nRG93bndhcmQoXHJcbiAgICAgICAgICAgICAgICAgICAgY3VyUG9zWSwgZnJhbWVTdGVwLCBzcGVlZCwgZnBzXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgcmVzICs9IGAsIGN1clBvc1k6ICR7c3ltYm9sR3JvdXAucG9zWUF0RnJhbWVbY3VyRnJhbWVdfSBgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGFzdEZyYW1lID0gY3VyRnJhbWUgLSBmcmFtZVN0ZXAgKyAxID49IDAgPyBjdXJGcmFtZSAtIGZyYW1lU3RlcCArIDEgOiAwO1xyXG4gICAgICAgICAgICAgICAgbGV0IGN1clBvc1kgPSBzeW1ib2xHcm91cC5wb3NZQXRGcmFtZVtsYXN0RnJhbWVdO1xyXG4gICAgICAgICAgICAgICAgc3ltYm9sR3JvdXAucG9zWUF0RnJhbWVbY3VyRnJhbWVdID0gdGhpcy5nZXRQb3NZT25Nb3ZpbmdEb3dud2FyZChcclxuICAgICAgICAgICAgICAgICAgICBjdXJQb3NZLCBmcmFtZVN0ZXAgLSAxLCBzcGVlZCwgZnBzXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgcmVzICs9IGAsIGN1clBvc1k6ICR7c3ltYm9sR3JvdXAucG9zWUF0RnJhbWVbY3VyRnJhbWVdfSBgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjdXJTd2l0Y2hPcmRlciA9PSBzeW1ib2xHcm91cC5zd2l0Y2hPcmRlcikge1xyXG4gICAgICAgICAgICAgICAgc3ltYm9sR3JvdXAucG9zWUF0RnJhbWVbY3VyRnJhbWUgKyAxXSA9IHRoaXMuZ2V0UG9zWU9uU3dpdGNoaW5nVG9Ub3AoXHJcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9sR3JvdXAucG9zWUF0RnJhbWVbY3VyRnJhbWVdLCBzcGVlZCwgZGlzdGFuY2VPZk9uZUxvb3AsIGZwc1xyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXMgKz0gYHwgYFxyXG4gICAgICAgICAgICAgICAgcmVzICs9IGBmcmFtZTogJHtjdXJGcmFtZSArIDF9YFxyXG4gICAgICAgICAgICAgICAgcmVzICs9IGAsIGN1clBvc1k6ICR7c3ltYm9sR3JvdXAucG9zWUF0RnJhbWVbY3VyRnJhbWUrMV19IGBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0UG9zWU9uTW92aW5nRG93bndhcmQoXHJcbiAgICAgICAgICAgIGN1clBvc1k6IG51bWJlcixcclxuICAgICAgICAgICAgZnJhbWVTdGVwOiBudW1iZXIsXHJcbiAgICAgICAgICAgIHNwZWVkOiBudW1iZXIsXHJcbiAgICAgICAgICAgIGZwczogbnVtYmVyXHJcbiAgICAgICAgKTogbnVtYmVyIHtcclxuICAgICAgICAgICAgcmV0dXJuIGN1clBvc1kgLSBzcGVlZCAqIGZyYW1lU3RlcCAvIGZwcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBnZXRQb3NZT25Td2l0Y2hpbmdUb1RvcChcclxuICAgICAgICAgICAgY3VyUG9zWTogbnVtYmVyLFxyXG4gICAgICAgICAgICBzcGVlZDogbnVtYmVyLFxyXG4gICAgICAgICAgICBkaXN0YW5jZU9mT25lTG9vcDogbnVtYmVyLFxyXG4gICAgICAgICAgICBmcHM6IG51bWJlclxyXG4gICAgICAgICk6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJQb3NZICsgZGlzdGFuY2VPZk9uZUxvb3AgLSBzcGVlZCAqIDEgLyBmcHM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICB9XHJcbiAgICByZXR1cm4ge2RhdGEsIG1ldGhvZHN9XHJcbn1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbi8qKlxyXG4gKiBAemgg5aaC5p6c5biM5pyb5YW85a65IDMuMyDkuYvliY3nmoTniYjmnKzlj6/ku6Xkvb/nlKjkuIvmlrnnmoTku6PnoIFcclxuICogQGVuIFlvdSBjYW4gYWRkIHRoZSBjb2RlIGJlbG93IGlmIHlvdSB3YW50IGNvbXBhdGliaWxpdHkgd2l0aCB2ZXJzaW9ucyBwcmlvciB0byAzLjNcclxuICovXHJcbi8vIEVkaXRvci5QYW5lbC5kZWZpbmUgPSBFZGl0b3IuUGFuZWwuZGVmaW5lIHx8IGZ1bmN0aW9uKG9wdGlvbnM6IGFueSkgeyByZXR1cm4gb3B0aW9ucyB9XHJcbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmRlZmluZSh7XHJcbiAgICBsaXN0ZW5lcnM6IHtcclxuICAgICAgICBzaG93KCkgeyBjb25zb2xlLmxvZygnc2hvdycpOyB9LFxyXG4gICAgICAgIGhpZGUoKSB7IGNvbnNvbGUubG9nKCdoaWRlJyk7IH0sXHJcbiAgICB9LFxyXG4gICAgdGVtcGxhdGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS9kZWZhdWx0L2luZGV4Lmh0bWwnKSwgJ3V0Zi04JyksXHJcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3N0eWxlL2RlZmF1bHQvaW5kZXguY3NzJyksICd1dGYtOCcpLFxyXG4gICAgJDoge1xyXG4gICAgICAgIGFwcDogJyNhcHAnLFxyXG4gICAgICAgIHRleHQ6ICcjdGV4dCcsXHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge30sXHJcbiAgICByZWFkeSgpIHtcclxuICAgICAgICBpZiAodGhpcy4kLnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy4kLnRleHQuaW5uZXJIVE1MID0gJ0hlbGxvIENvY29zLic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy4kLmFwcCkge1xyXG4gICAgICAgICAgICBjb25zdCBhcHAgPSBjcmVhdGVBcHAoe30pO1xyXG4gICAgICAgICAgICBhcHAuY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5pc0N1c3RvbUVsZW1lbnQgPSAodGFnKSA9PiB0YWcuc3RhcnRzV2l0aCgndWktJyk7XHJcblxyXG4gICAgICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAgICAgLy8gLS0gQGFwcC10ZXN0c2VjdGlvblxyXG4gICAgICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAgICAgY29uc3QgeyBkYXRhICwgbWV0aG9kcyB9ID0gdXNlR2xvYmFsU3RvcmUoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAgICAgLy8gLS0gQGFwcC1jb21wb25lbnRcclxuICAgICAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgICAgICBhcHAuY29tcG9uZW50KCdyZWVsLWFuaW0taW5mbycsIHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvdnVlL3JlZWwtYW5pbS1pbmZvLmh0bWwnKSwgJ3V0Zi04JyksXHJcbiAgICAgICAgICAgICAgICBkYXRhKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGRhdGEgfTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBtZXRob2RzOiBtZXRob2RzLFxyXG4gICAgICAgICAgICAgICAgbW91bnRlZCgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL2RhdGEgPSAodGhpcyBhcyBhbnkpLiRkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vbWV0aG9kcy51cGRhdGVUYWJsZSgpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFwcC5tb3VudCh0aGlzLiQuYXBwKTtcclxuICAgICAgICAgICAgcGFuZWxEYXRhTWFwLnNldCh0aGlzLCBhcHApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBiZWZvcmVDbG9zZSgpIHsgfSxcclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIGNvbnN0IGFwcCA9IHBhbmVsRGF0YU1hcC5nZXQodGhpcyk7XHJcbiAgICAgICAgaWYgKGFwcCkge1xyXG4gICAgICAgICAgICBhcHAudW5tb3VudCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbn0pO1xyXG5cclxuXHJcblxyXG5cclxuIl19