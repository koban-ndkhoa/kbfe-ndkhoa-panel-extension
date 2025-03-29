
export interface ISymbols {
    unit_width: number,
    unit_height: number,
    count: number,
    nGroups: number,
    preSymbols: ISymbolGroup,
    mainSymbols: ISymbolGroup,
    postSymbols: ISymbolGroup,
}

export interface ISymbolGroup {
    initPosY: number
    posYAtFrame: { [key: number]: number}
    switchOrder: number 
}

export interface ITableData {
    pre: string[],
    main: string[],
    post: string[]
}

export interface IAnim {
    curSpeed: number,
    oneLoopTime: number,
    distanceOfOneLoop: number,  
    fps: number,
    initFrame: number,
    frameStep: number
}


