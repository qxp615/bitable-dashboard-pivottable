import React from 'react'
import ReactDOM from 'react-dom/client'
import 'normalize.css';
import './locales/i18n' // 支持国际化
import App from './App';
import { store } from './store'
import { Provider } from 'react-redux'


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <Provider store={store}>
        <App />
    </Provider>,
)
