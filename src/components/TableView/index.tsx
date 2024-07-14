import { Table } from "@douyinfe/semi-ui";
import { useAppSelector } from "../../store/hook"
import { darkModeThemeColor, getLocalUnitAbbrRule } from "../common";
import './style.scss'
import { T } from "../../locales/i18n";
import { DATA_SOURCE_SORT_TYPE, ORDER } from "@lark-base-open/js-sdk";


export default () => {
    const config = useAppSelector(store => store.config.config)
    const idata = useAppSelector(store => store.tableData.currentValue)
    if (idata.length < 2) {
        return <></>
    }

    const hasRowTotal = (config.valueCalcMethod == 'count' || config.valueAggMethod == 'SUM') && idata[0].length >= 2
    const hasColTotal = idata[0].length >= 3

    const keepDigits = (x:number | string | null) => {
        if (typeof(x) != 'number') return x
        if (config.valueDigits == -1) return x
        else return x.toFixed(config.valueDigits)
    }

    let rowTotals: { [k:string]: number } = {}
    let columns = idata[0].map(col => {
        rowTotals[String(col.value)] = 0
        return {
            'title': col.value == 'Bitable_Dashboard_Count' ? T('count') : col.value, 
            'dataIndex': String(col.value)
        }
    })
    if (hasColTotal) {
        rowTotals['_total'] = 0
        columns.push({
            'title': T('total'),
            'dataIndex': '_total'
        })
    }

    let tableData = idata.slice(1).map((row, index) => {
        let colTotal = 0
        let colData = Object.fromEntries(columns.map((col, i) => { 
            if (col.dataIndex == '_total') {
                rowTotals['_total'] += colTotal
                return [col.dataIndex, keepDigits(colTotal)]
            }
            else {
                if (i > 0) { // column 0 is label column, skip
                    colTotal += Number(row[i].value)
                    rowTotals[String(col.dataIndex)] += Number(row[i].value)
                }
            }
            return [col.dataIndex, keepDigits(row[i].value)]
        }))
        return {
            key: index,
            ...colData    
        }
    })
    // 因为多维表格内置的数据排序比较随机，所以重新做一个排序
    type TableDataRow = { [k:string]: number }
    if (config.sortBy == DATA_SOURCE_SORT_TYPE.VALUE) {
        const descFactor = config.order == ORDER.DESCENDING ? -1 : 1
        tableData.sort((a:TableDataRow, b:TableDataRow) => {
            if ('_total' in a) {
                return (a['_total'] - b['_total']) * descFactor
            }
            else {
                return (a[String(columns[1].dataIndex)] - b[String(columns[1].dataIndex)]) * descFactor
            }
        })
    }
    if (hasRowTotal) {
        Object.keys(rowTotals).forEach((k, i) => {  // 把每个合计值，过一下小数位数
            if (i>0) rowTotals[k] = Number(keepDigits(rowTotals[k]))
        })
        tableData.push({ key: -1, ...rowTotals, [String(columns[0].dataIndex)]:T('total') })
    }
    

    return <Table columns={columns} dataSource={tableData} pagination={false} />
}