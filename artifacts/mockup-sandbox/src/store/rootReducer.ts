import { combineReducers } from '@reduxjs/toolkit'
import { authReducer } from '@/features/auth'
import { sidebarReducer } from '@/features/sidebar/store/sidebarSlice'

export const rootReducer = combineReducers({
  auth: authReducer,
  sidebar: sidebarReducer,
})
