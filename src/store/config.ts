import { createSlice, current, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'
import { AppThunk } from './hook'
import { dashboard, IDataCondition, ISeries, DashboardState, IData, IGroupItem, ORDER, DATA_SOURCE_SORT_TYPE, Rollup } from '@lark-base-open/js-sdk'
import { setCurrentValue } from './tableData'

// Define a type for the slice state
export interface ConfigState {
    rowField: string
    columnField: string
    valueCalcMethod: string
    valueAggField: string
    valueAggMethod: string
    dataRange: string
    dataSource: string
    valueDigits: number
    calcPercentage: string
    sortBy: DATA_SOURCE_SORT_TYPE
    order: ORDER
}

export interface ConfigSliceState {
  config: ConfigState
}

export type ConfigPayload = Partial<ConfigState>

// Define the initial state using that type
const initialState: ConfigSliceState = {
  config: {
    rowField: "none",
    columnField: "none",
    valueCalcMethod: "count",
    valueAggField: "",
    valueAggMethod: "SUM",
    dataRange: "{\"type\":\"ALL\"}",
    dataSource: "",
    valueDigits: -1,
    calcPercentage: "none",
    sortBy: DATA_SOURCE_SORT_TYPE.VALUE,
    order: ORDER.DESCENDING
  }
}

export const configSlice = createSlice({
  name: 'config',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setConfigState: (state, action:PayloadAction<ConfigPayload>) => {
        // fix an issue, when input field is empty, the key will be omitted in semi Form's onChange event
        state.config = {...state.config, ...action.payload}
    },
  }
})

export const { setConfigState } = configSlice.actions

function dataConditionFromConfigState(state:ConfigState):IDataCondition {
    let groups:IGroupItem[] = []

    if (state.rowField && state.rowField != 'none') {
      groups.push({
        fieldId: state.rowField,
        sort: { order:state.order, sortType:state.sortBy }
      })
    }
    if (state.columnField && state.columnField != 'none') {
      groups.push({
        fieldId: state.columnField,
        sort: { order:state.order, sortType:state.sortBy }
      })
    }

    return {
      tableId: state.dataSource,
      dataRange: JSON.parse(state.dataRange),
      groups: groups,
      series: state.valueCalcMethod == 'count' ? 'COUNTA' : [{
        fieldId: state.valueAggField,
        rollup: state.valueAggMethod as Rollup
      }]
    }
}

export const updatePreviewData = (payload:ConfigPayload):AppThunk => (async (dispatch, getState) => {
  const configState = payload as ConfigState
  if (!configState.dataSource || !configState.dataRange) return

  let idata:IData = []
  const dataCondition = dataConditionFromConfigState(configState)
  if (dashboard.state === DashboardState.Config || dashboard.state === DashboardState.Create) {
    idata = await dashboard.getPreviewData(dataCondition)
  }
  else {
    idata = await dashboard.getData()
  } 

  dispatch(setCurrentValue(idata))
  
})

// 保存图表配置到多维表格，在确认配置时调用
export const saveConfig = (payload:ConfigPayload):AppThunk => (async (dispatch, getState) => {
  const configState = {...payload}
  const dashboardDataCondition = dataConditionFromConfigState(configState as ConfigState)
    
  dashboard.saveConfig({
    dataConditions: [dashboardDataCondition],
    customConfig: {
      'config': configState 
    }
  })
})

// 从多维表格中读取图表配置
export const loadConfig = ():AppThunk<Promise<ConfigPayload>> => (async (dispatch, getState):Promise<ConfigPayload> => {
  if (dashboard.state === DashboardState.Create) {
    return initialState.config
  }
  const dashboardConfig = await dashboard.getConfig()
  if (dashboardConfig.customConfig && 'config' in dashboardConfig.customConfig) {
    let configState = dashboardConfig.customConfig['config'] as ConfigState
    const dataCondition = dashboardConfig.dataConditions[0]
    configState = {
      ...configState, 
      dataSource: dataCondition.tableId,
      dataRange: JSON.stringify(dataCondition.dataRange),
      valueAggField: dataCondition.series == 'COUNTA' ? initialState.config.valueAggField : dataCondition.series![0].fieldId
    }
    dispatch(setConfigState(configState))
    return configState
  }
  return initialState.config
})

export default configSlice.reducer