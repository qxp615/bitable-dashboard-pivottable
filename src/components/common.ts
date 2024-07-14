import { DashboardState, dashboard, bitable } from "@lark-base-open/js-sdk";

export let isDarkMode = false;

export const isConfigLayout = () => {
    return dashboard.state === DashboardState.Config || dashboard.state === DashboardState.Create
}

export const themeColors = [
    'rgba(31, 35, 41, 1)', 'rgba(51, 109, 244, 1)', 'rgba(122, 53, 240, 1)',
    'rgba(53, 189, 75, 1)', 'rgba(45, 190, 171, 1)', 'rgba(255, 198, 10, 1)',
    'rgba(255, 129, 26, 1)', 'rgba(245, 74, 69, 1)'
]

type UnitAbbrRule = { size:number, suffix:string }
type LocalUnitAbbrRuleSet = { [key:string]: UnitAbbrRule }
type UnitAbbrRuleSet = { [key:string]: LocalUnitAbbrRuleSet }
const unitAbbrRules:UnitAbbrRuleSet = {
  'zh': {
    'none' : { size:1, suffix:'' },
    'k' : { size:1000, suffix:T('K') },
    'wan' : { size:10000, suffix:T('WAN') },
    'm' : { size:1000000, suffix:T('M') },
    'kwan' : { size:10000000, suffix:T('QIANWAN') },
    'yi' : { size:100000000, suffix:T('YI') },
  },
  'ja': {
    'none' : { size:1, suffix:'' },
    'k' : { size:1000, suffix:T('K') },
    'wan' : { size:10000, suffix:T('WAN') },
    'm' : { size:1000000, suffix:T('M') },
    'kwan' : { size:10000000, suffix:T('QIANWAN') },
    'yi' : { size:100000000, suffix:T('YI') },
  },
  'default': {
    'none' : { size:1, suffix:'' },
    'k' : { size:1000, suffix:T('K') },
    'm' : { size:1000000, suffix:T('M') },
  },
}

export const getLocalUnitAbbrRule = () => {
  if (i18n.language in unitAbbrRules) {
    return unitAbbrRules[i18n.language]
  }
  else {
    return unitAbbrRules['default']
  }
}

export const getLocalUnitAbbrNumber = (number: number, abbrRule:string) => {
  const abbrRuleSet = getLocalUnitAbbrRule()
  if (!(abbrRule in abbrRuleSet)) {
    abbrRule = 'none'
  }
  const rule = abbrRuleSet[abbrRule]
  return (number / rule.size) + rule.suffix
}

export const darkModeThemeColor = (color: string) => {
  const lookup:{[key:string]: string} = {
    'rgba(31, 35, 41, 1)': '#EBEBEB',
    'rgba(51, 109, 244, 1)': 'rgba(76, 136, 255, 1)',
    'rgba(122, 53, 240, 1)': 'rgba(184, 143, 254, 1)',
    'rgba(53, 189, 75, 1)': 'rgba(81, 186, 67, 1)',
    'rgba(45, 190, 171, 1)': 'rgba(23, 207, 181, 1)',
    'rgba(255, 198, 10, 1)': 'rgba(251, 203, 70, 1)',
    'rgba(255, 129, 26, 1)': 'rgba(248, 158, 68, 1)',
    'rgba(245, 74, 69, 1)': 'rgba(240, 91, 86, 1)',
  }
  if (!isDarkMode) return color
  if (color in lookup) {
    return lookup[color]
  }
  else {
    return color
  }
}

export const getLongTextClass = (currentValueText:string, targetValueText:string, percentageText:string, firstThreshold=18, secondThreshold=28) => {
  const fullTextLength = currentValueText.length + targetValueText.length + `${percentageText}%`.length
    let longTextClass = ''
    if (fullTextLength > secondThreshold) {
        longTextClass = ' longLongText'
    }
    else if (fullTextLength > firstThreshold) {
        longTextClass = ' longText'
    }
    return longTextClass
}

import { useLayoutEffect } from "react";
import i18n, { T } from "../locales/i18n";

function updateTheme(theme: string) {
  document.body.setAttribute('theme-mode', theme);
}

/** following dark mode theme */
export function useTheme() {
  useLayoutEffect(() => {
    bitable.bridge.getTheme().then((theme: string) => {
      updateTheme(theme.toLocaleLowerCase())
      isDarkMode = theme.toLocaleLowerCase() === 'dark'
    })

    bitable.bridge.onThemeChange((e) => {
      updateTheme(e.data.theme.toLocaleLowerCase())
      isDarkMode = e.data.theme.toLocaleLowerCase() === 'dark'
    })
  }, [])
}

export function onDrakModeChange(callback:() => void) {
  useLayoutEffect(() => {
    bitable.bridge.onThemeChange((e) => {
      callback()
    })
  }, [])
}