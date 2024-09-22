import './App.css';
import { DashboardState, bitable, dashboard } from "@lark-base-open/js-sdk";
import Config from './components/Config';
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hook';
import { ConfigPayload, loadConfig, updatePreviewData } from './store/config';
import TableView from './components/TableView';

export default function App() {
  const dispatch = useAppDispatch()
  const config = useAppSelector(store => store.config.config)
  
  dashboard.onThemeChange(res => {
    document.body.setAttribute('theme-mode', res.data.theme.toLowerCase());
  })
  const setThemeAttribute = async() => {
    const theme = await dashboard.getTheme();
    document.body.setAttribute('theme-mode', theme.theme.toLowerCase());
  }
  

  const fetchInitData = useCallback(async() => {
    const configState = await dispatch<Promise<ConfigPayload>>(loadConfig())
    dispatch(updatePreviewData(configState))
  }, [])

  useEffect(() => {
    setThemeAttribute()
    if (dashboard.state === DashboardState.View || dashboard.state === DashboardState.FullScreen) {
      fetchInitData()

      dashboard.onConfigChange(async (e) => {
        const configState = await dispatch<Promise<ConfigPayload>>(loadConfig())
        dispatch(updatePreviewData(configState))
      })

      setTimeout(() => {
        // 预留3s给浏览器进行渲染，3s后告知服务端可以进行截图了
        dashboard.setRendered();
    }, 2000);
    }  
    dashboard.onDataChange(async(e) => {
      const configState = await dispatch<Promise<ConfigPayload>>(loadConfig())
      dispatch(updatePreviewData(configState))
    })
  }, [])

  
  return (
    <div className='goal-app'>
        <div className='goal-chart'>
          <TableView/>
        </div>
        {dashboard.state === DashboardState.Config || dashboard.state === DashboardState.Create ? (
          <div className='config-panel'>
            <Config/>
          </div>
            
        ) : null}
    </div>
  );
}