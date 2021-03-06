# Slider

滑块选择器。

## Props

| 属性            | 类型    | 默认值 | 必填 | 说明                                          |
| --------------- | ------- | ------ | ---- | --------------------------------------------- |
| value / v-model | number  |        | 否   |
| name            | string  |        | 否   | [form](./README.Form.md) 的标识               |
| min             | number  | 0      | 否   | 最小值                                        |
| max             | number  | 100    | 否   | 最大值                                        |
| step            | number  | 1      | 否   | 步长，取值必须大于 0，并且可被(max - min)整除 |
| disabled        | boolean | false  | 否   | 是否禁用                                      |
| show-value      | boolean | false  | 否   | 是否显示当前 value                            |

## CSS

| 属性    | 默认值  | 说明   |
| ------- | ------- | ------ |
| --color | #09bb07 | 主色调 |

## Events

| 事件   | 描述                     | 回调函数参数                                 |
| ------ | ------------------------ | -------------------------------------------- |
| input  | 拖动过程中触发的事件     | CustomEvent，可通过 event.details.value 取值 |
| change | 完成一次拖动后触发的事件 | CustomEvent，可通过 event.details.value 取值 |
