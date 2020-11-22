
export const data = {
    classes: {
        classA0: "classA0",
        classA1: "classA1",
        classB0: "classB0",
        classB1: "classB1",
        classC0: "classC0",
        classC1: "classC1",
    },
    lists: {
        listA: ["A0", "A1", "A2", "A3", "A4", "A5"],
        listB: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
        listC: ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9"],
    },
    conditions: {
        conA0: true,
        conA1: true,
        conB0: true,
        conB1: true,
        conC0: true,
        conC1: true,
    },/*  */
};/*  */

/******************************************************
规范：
1、原生属性中的字符串使用 {{}}  表示相应的绑定数据， 例如 <img class="default {{class">
2、自定义属性中是字符串即是相应的绑定数据


ASTNode:{
    type: "root" | "text" | "element",
    tag?: String, // when type is 'element'
    attributes?: Array, // when type is 'element'
    children?: Array,  // when type is 'element' or 'root'
    text?: String // when type is 'text'
}

VNode:{
    type: "static" | "dynamic" | "extra",
    tag?: String,
    key?: String | Number,
    attributes?: IAttribute[], // Static HTML attributes, such as <img title="Title Text">, etc.
    properties?: IProperty[], // Dynamic HTML attributes, such as <img title="{{title}}">, etc.
    commands?: ICommand[], // Bound HTML event attributes, such as <img @click="click">, etc.
    control?: {key: String | Number, type: 'for' | 'if', expression: String, compute: Function}, // when type is 'virtual', such as <img @for="(v,i) in 3"  @key="i">, <img @if="show">, etc.
    children?: Array,
    element?: HTMLElement,
    parent?: HTMLElement,
    text?: String
}

IProperty: {
    key: String | Number,
    name: String,
    text: String,
    compute: Function,

}
such as: 
{
    key: String | Number,
    name: 'class',
    text: 'default {{classes.classA0}} {{classes.classA1}}',
    compute: (scope)=>{ // new Function("scope",`with(scope){return '${text.replace("'", "\"").split(/{{/igm).join("'+").split(/}}/igm).join("+'")}';}`)
        with(scope){
            return "default "+`${classes.classA0}  ${classes.classA1}`+"";
        }
    },

}
******************************************************/

export const template = 
`<div
    class="default {{classes.classA0}} {{classes.classA1}}"
    @for="(valA keyA idxA) in lists.listA"
    @key="idxA"
    @if="conditions.conA0 && conditions.conA1"
>
    <div>layer:A</div>
    <div
        class="default {{classes.classB0}} {{classes.classB1}}"
        @for="(valB keyB idxB) in lists.listB"
        @key="idxB"
        @if="conditions.conB0 && conditions.conB1"
    >
        <div>layer:B</div>
        <div
            class="default {{classes.classC0}} {{classes.classC1}}"
            @if="idxA !== idxB"
        >
            <div>layer:C</div>
            row:{{idxA}}, col: {{idxB}}
        </div>
    </div>
</div>`;

export const ast = {
    type:"root",
    children:[
        {
            type: "element",
            data: {
                tag: "div",
                map: {
                    "class":"default {{classes.classA0}} {{classes.classA1}}",
                    "@for":"(valA keyA idxA) in lists.listA",
                    "@key":"idxA",
                    "@if":"conditions.conA0 && conditions.conA1",
                    "@on:click":"onDivAClick",
                }
            },
            children:[
                {
                    type: "element",
                    data: {
                        tag: "div",
                    },
                    children: [
                        {
                            type: "text",
                            text: "layer:A"
                        }
                    ]
                },
                {
                    type: "element",
                    data: {
                        tag: "div",
                        map: {
                            "class":"default {{classes.classB0}} {{classes.classB1}}",
                            "@for":"(valB keyB idxB) in lists.listB",
                            "@key":"idxB",
                            "@if":"conditions.conB0 && conditions.conB1",
                            "@click":"onDivBClick",
                        }
                    },
                    children: [
                        {
                            type: "element",
                            data: {
                                tag: "div",
                            },
                            children: [
                                {
                                    type: "text",
                                    text: "layer:B"
                                },
                                {
                                    type: "element",
                                    data: {
                                        tag: "div",
                                        map: {
                                            "class":"default {{classes.classC0}} {{classes.classC1}}",
                                            "@if":"idxA !== idxB",
                                            "@click":"onDivCClick",
                                        }
                                    },
                                    children: [
                                        {
                                            type: "text",
                                            text: "layer:C"
                                        },
                                        {
                                            type: "text",
                                            text: "row:{{idxA}}, col: {{idxB}}"
                                        },
                                    ]
                                }
                            ]
                        },
                    ]
                }
            ]
        }
    ]
};
