import { configureStore } from '@reduxjs/toolkit'
import configReducer from './config'
import tableDataReducer from './tableData'

export const store = configureStore({
  reducer: {
    config: configReducer,
    tableData: tableDataReducer
  }
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch