import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppThunk } from './hook'
import { dashboard, IData } from '@lark-base-open/js-sdk'

export interface tableDataState {
    currentValue: IData
}

const initialState:tableDataState = {
    currentValue: [],
}

export const tableDataSlice = createSlice({
    name: 'tableData',
    initialState,
    reducers: {
      setCurrentValue: (state, action:PayloadAction<IData>) => {
        state.currentValue = action.payload
      },
    }
})

export const { setCurrentValue } = tableDataSlice.actions

export default tableDataSlice.reducer