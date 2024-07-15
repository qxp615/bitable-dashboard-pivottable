import React, { useCallback, useEffect, useState } from 'react';
import { DATA_SOURCE_SORT_TYPE, FieldType, IDataRange, IField, ITable, ORDER, SourceType, base } from '@lark-base-open/js-sdk';
import { Form, Button, Divider, Select, useFieldApi, useFormApi, Banner } from '@douyinfe/semi-ui';
import IconFormular from '/src/assets/icons/icon-formular.svg?react'
import IconMore from '/src/assets/icons/icon-more.svg?react'
import { DashboardState, bitable, dashboard } from "@lark-base-open/js-sdk";
// import '../../assets/semi-feishu-custom.min.css'
import './style.scss'
import config, { ConfigPayload, ConfigState, loadConfig, saveConfig, setConfigState, updatePreviewData } from '../../store/config';
import { useAppDispatch, useAppSelector } from '../../store/hook';
import { darkModeThemeColor, getLocalUnitAbbrRule, themeColors } from '../common';
import { T } from '../../locales/i18n';
import Section from '@douyinfe/semi-ui/lib/es/form/section';

export default () => {
    type TableInfo = {tableId: string, tableName: string}
    const [tableList, setTableList] = useState<TableInfo[]>([])
    const [tableDataRange, setTableDataRange] = useState<IDataRange[]>([])
    type FieldItemInfo = {fieldId: string, fieldName: string, fieldType: FieldType}
    const dispatch = useAppDispatch()
    const [numberFieldList, setNumberFieldList] = useState<FieldItemInfo[]>([])
    const [fieldList, setFieldList] = useState<FieldItemInfo[]>([])
    const config = useAppSelector(store => store.config.config)
    
    // because Form in semi-design requires formApi, and it has to be
    // within the Form's context, so an additional component (DefaultValueSetter) is created to 
    // keep formApi instances
    const emptyDefaultValueSetter = (value: string) => {}
    let setDefaultValues = {
        form: (values:ConfigPayload) => {},
        dataSource: emptyDefaultValueSetter,
        dataRange: emptyDefaultValueSetter,
        valueAggField: emptyDefaultValueSetter,
        targetValueAggField: emptyDefaultValueSetter
    }

    const DefaultValueSetter = () => {
        const dataRangeFieldApi = useFieldApi('dataRange')
        const dataSourceFieldApi = useFieldApi('dataSource')
        const valueAggFieldApi = useFieldApi('valueAggField')
        const formApi = useFormApi()
        setDefaultValues.form = (values ) => { formApi.setValues(values) }
        setDefaultValues.dataSource = (value: string) => { dataSourceFieldApi.setValue(value) }
        setDefaultValues.dataRange = (value: string) => { dataRangeFieldApi.setValue(value) }
        setDefaultValues.valueAggField = (value: string) => { valueAggFieldApi.setValue(value) }
        return '';
    }

    const getTableList = useCallback(async () => {
        const tables = await bitable.base.getTableList();
        return await Promise.all(tables.map(async table => {
          const name = await table.getName();
          return {
            tableId: table.id,
            tableName: name
          }
        }))
      }, [])
    
    const getTableRange = useCallback((tableId: string) => {
        return dashboard.getTableDataRange(tableId);
    }, [])
    
    const onDataSourceChange = async (tableId:string) => {
        const dataRange = await getTableRange(tableId)
        setTableDataRange(dataRange)
        const table = await base.getTableById(tableId)
        const numberFields = [
            ...await table.getFieldListByType(FieldType.Number),
            ...await table.getFieldListByType(FieldType.Currency),
            ...await table.getFieldListByType(FieldType.Formula),
            ...await table.getFieldListByType(FieldType.Lookup),
            ...await table.getFieldListByType(FieldType.Progress),
            ...await table.getFieldListByType(FieldType.Rating),
        ]
        const numberFieldsInfo =  await Promise.all(numberFields.map(async field => {
            const name = await field.getName();
            return {
                fieldId: field.id,
                fieldName: name,
                fieldType: await field.getType(),
            }
        }))
        setNumberFieldList(numberFieldsInfo)
        const allFields = await table.getFieldList()
        const allFieldsInfo =  await Promise.all(allFields.map(async field => {
            const name = await field.getName();
            return {
                fieldId: field.id,
                fieldName: name,
                fieldType: await field.getType(),
            }
        }))
        setFieldList(allFieldsInfo)

        if(numberFieldsInfo.length > 0) {
            setDefaultValues.valueAggField(numberFieldsInfo[0].fieldId)
        }
    }

    const fetchInitData = async() => {
        const tableListData = await getTableList();
        const configState = await dispatch<Promise<ConfigPayload>>(loadConfig())
        setTableList(tableListData);
        if (tableListData.length > 0) {
            if (configState.dataSource != '') {
                await onDataSourceChange(configState.dataSource!)
                setDefaultValues.form(configState)
            }
            else {
                const firstTableId = tableListData[0].tableId
                setDefaultValues.dataSource(firstTableId)
                await onDataSourceChange(firstTableId)
                setDefaultValues.dataRange('{"type":"ALL"}')
            }
        }
        dispatch(updatePreviewData(configState))
    }

    const renderCustomFieldSelect = (field:FieldItemInfo) => {
        return <Select.Option value={field.fieldId} showTick={true} key={field.fieldId}>
            <div className='fieldOption'>
                <div className='prefixIcon' style={field.fieldType != FieldType.Denied ? {} : {display: 'none'}}>
                    <img src={new URL(`./field-icons/${field.fieldType}.svg`, import.meta.url).href}/>
                </div>{field.fieldName}
            </div>
        </Select.Option>
    }

    useEffect(() => {
        fetchInitData()
    }, [])

    return <Form labelPosition='top' className='configForm' 
                onChange={(formData) => {
                    dispatch(updatePreviewData(formData.values as ConfigPayload))
                    dispatch(setConfigState(formData.values as ConfigPayload))
                }}
                onSubmit={(formData) => dispatch(saveConfig(formData as ConfigPayload))}>
        <div className='configFields'>
            <Form.Select field="dataSource" label={T("dataSource")}
                onChange={value => {onDataSourceChange(value as string)}}
                optionList={tableList.map(source => ({
                    value: source.tableId,
                    label: source.tableName
                }))} ></Form.Select>

            <Form.Select field="dataRange" label={T("dataRange")}
                    // onChange={handleDataRangeChange}
                    optionList={tableDataRange.map(range => {
                    const { type } = range;
                    if (type === SourceType.ALL) {
                        return {
                        value: JSON.stringify(range),
                        label: T('dataRangeAll')
                        }
                    } else {
                        return {
                        value: JSON.stringify(range),
                        label: range.viewName
                        }
                    }
                    })}></Form.Select>

            <Divider/>

            <Form.Select field="rowField" label={T("rows")} initValue="none" 
                filter searchPosition='dropdown' searchPlaceholder={T("searchPlaceholder")}>
                {[{fieldName: T("none"), fieldId: 'none', fieldType: FieldType.Denied}, ...fieldList].map(field => 
                        (renderCustomFieldSelect(field)))}
            </Form.Select>


            <Form.Select field="columnField" label={T("columns")} initValue="none"
                filter searchPosition='dropdown' searchPlaceholder={T("searchPlaceholder")}>
                {[{fieldName: T("none"), fieldId: 'none', fieldType: FieldType.Denied}, ...fieldList].map(field => 
                (renderCustomFieldSelect(field)))}
            </Form.Select>
            
            
            <Form.InputGroup label={{ text: T("values") }} className='fieldUnit'>
                <Form.Select field="valueCalcMethod" label={T("currentValue")} initValue="count">
                    <Select.Option value="count">{T("countRecords")}</Select.Option>
                    <Select.Option value="calc">{T("aggrValue")}</Select.Option>
                </Form.Select>
                <Form.Select field="valueAggField" initValue="" className='valueAggField' showArrow={false}
                        suffix={
                            <Form.Select field="valueAggMethod" className='currentValueAggMethod' noLabel={true} showArrow={false}
                                    initValue="SUM"  onFocus={(e) => {e.stopPropagation()}} dropdownClassName="aggMethodDropdown" position='bottomRight'
                                    suffix={<div className='suffixIcon'><IconMore/></div>}>
                                <Select.Option value="SUM">{T("sum")}</Select.Option>
                                <Select.Option value="AVERAGE">{T("average")}</Select.Option>
                                <Select.Option value="MAX">{T("max")}</Select.Option>
                                <Select.Option value="MIN">{T("min")}</Select.Option>
                            </Form.Select>
                        } 
                        filter searchPosition='dropdown' searchPlaceholder={T("searchPlaceholder")}
                        style={config.valueCalcMethod === 'calc' ? {} : {display: 'none'}}
                        >
                        {numberFieldList.map(field => (renderCustomFieldSelect(field)))}
                </Form.Select>
            </Form.InputGroup>


                
            <Section text={T("formatSettings")}>
                <Form.Select field="valueDigits" initValue={-1} label={T("valueDigits")}>
                    <Select.Option value={-1}>{T("originalDigits")}</Select.Option>
                    <Select.Option value={0}>{T("integer")}</Select.Option>
                    <Select.Option value={1}>{T("keepOneDigit")}</Select.Option>
                    <Select.Option value={2}>{T("keepTwoDigit")}</Select.Option>
                </Form.Select>

                {/* <Form.Select field="calcPercentage" initValue="none" label={T("calcPercentage")}>
                    <Select.Option value="none">{T("noPercentage")}</Select.Option>
                    <Select.Option value="rows">{T("percentageAcrossRows")}</Select.Option>
                    <Select.Option value="columns">{T("percentageAcrossColumns")}</Select.Option>
                    <Select.Option value="allItems">{T("percentageAcrossAllItems")}</Select.Option>
                </Form.Select> */}

                <Form.RadioGroup type="button" field="sortBy" label={T("sortBy")} initValue={DATA_SOURCE_SORT_TYPE.VALUE} className="unitPosition">
                    <Form.Radio value={DATA_SOURCE_SORT_TYPE.VALUE}>{T("fieldValue")}</Form.Radio>
                    <Form.Radio value={DATA_SOURCE_SORT_TYPE.VIEW}>{T("recordOrder")}</Form.Radio>
                </Form.RadioGroup>

                <Form.RadioGroup type="button" field="order" label={T("order")} initValue={ORDER.DESCENDING} className="unitPosition">
                    <Form.Radio value={ORDER.ASCENDING}>{T("ascending")}</Form.Radio>
                    <Form.Radio value={ORDER.DESCENDING}>{T("decending")}</Form.Radio>
                </Form.RadioGroup>
            </Section>


        </div>
        <div className='configActions'>
            <Button theme='solid' type="primary" htmlType="submit" className="btn-margin-right">{T('confirm')}</Button>
        </div>
        
        <DefaultValueSetter/>
    </Form>
}
