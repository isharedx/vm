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
    type: "static" | "dynamic" | "virtual",
    tag: String,
    key: String | Number,
    attributes: IAttribute[], // Static HTML attributes, such as <img title="Title Text">, etc.
    properties: IProperty[], // Dynamic HTML attributes, such as <img title="{{title}}">, etc.
    commands: ICommand[], // Bound HTML event attributes, such as <img @click="click">, etc.
    control: {key: String | Number, type: 'for' | 'if', expression: String, compute: Function}, // when type is 'virtual', such as <img @for="(v,i) in 3"  @key="i">, <img @if="show">, etc.
    children: Array,
    element: HTMLElement,
    parent: HTMLElement,
    text: String
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

const template = 
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

const root = {
    type:"root",
    children:[
        {
            type: 'element',
            tag: 'div',
            attributes: [
                {name:"class", text:"default {{classes.classA0}} {{classes.classA1}}"},
                {name:"@for", text:"(valA keyA idxA) in lists.listA"},
                {name:"@key", text:"idxA"},
                {name:"@if", text:"conditions.conA0 && conditions.conA1"},
                {name:"@on:click", text:"onDivAClick"},
            ],
            children:[
                {
                    tag: 'div',
                    type: 'element',
                    children: [
                        {
                            type: 'text',
                            text: "layer:A"
                        }
                    ]
                },
                {
                    tag: 'div',
                    type: 'element',
                    attributes: [
                        {name:"class", text:"default {{classes.classB0}} {{classes.classB1}}"},
                        {name:"@for", text:"(valB keyB idxB) in lists.listB"},
                        {name:"@key", text:"idxB"},
                        {name:"@if", text:"conditions.conB0 && conditions.conB1"},
                        {name:"@click", text:"onDivBClick"},
                    ],
                    children: [
                        {
                            tag: 'div',
                            type: 'element',
                            children: [
                                {
                                    type: 'text',
                                    text: "layer:B"
                                },
                                {
                                    tag: 'div',
                                    type: 'element',
                                    attributes: [
                                        {name:"class", text:"default {{classes.classC0}} {{classes.classC1}}"},
                                        {name:"@if", text:"idxA !== idxB"},
                                        {name:"@click", text:"onDivCClick"},
                                    ],
                                    children: [
                                        {
                                            type: 'text',
                                            text: "layer:C"
                                        },
                                        {
                                            type: 'text',
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
}

let ast = {
  template:
    '<div class="default {{`${classes.classA0}  ${classes.classA1}`}}" @for="{{lists.listA}}" @for-index="idxA" @for-value="valA" @key="{{idxA}}" @if="{{conditions.conA0 && conditions.conA1}}">',
  element: null,
  tag: "div",
  flag: "extra",
  attributes: {
    class: {
      compute:(scope)=>{
        with(scope){
          return "default "+`${classes.classA0}  ${classes.classA1}`+"";// expression.split(/({{|}})/igm).join("+")
          // new Function("scope",`with(scope){return '${expression.replace("'", "\"").split(/{{/igm).join("'+").split(/}}/igm).join("+'")}';}`)
        }
      },
      expression: "default {{`${classes.classA0}  ${classes.classA1}`}}",
      arguments: {
        classA0: ["classes", "classA0"],
        classA1: ["classes", "classA1"],
      },
    },
    "@for": {
      compute:(scope)=>{
        with(scope){
          return lists.listA;
        }
      },
      expression: "lists.listA",
      arguments: {
        listA: ["lists", "classA"],
      },
      index: "idxA",
      value: "valA",
    },
    "@key": {
      compute:(scope)=>{
        with(scope){
          return idxA;
        }
      },
      expression: "idxA",
      arguments: {
        idxA: ["idxA"], // 编译为 scope.idxA
      },
    },
    "@if": {
      // $expression:()=>($var('conditions.conA0') && $var('conditions.conA1')),
      compute:(scope)=>{
        with(scope){
          return conditions.conA0 && conditions.conA1;
        }
      },
      expression: "{{conditions.conA0 && conditions.conA1}}",
      arguments: {
        conA0: ["conditions", "conA0"],
        conA1: ["conditions", "conA1"],
      },
    },
  },
  children: [
    {
      template: "<div>",
      element: null,
      tag: "div",
      flag: "static",
      text: {},
      attributes: {},
      children: [
        {
          template: "layer:A",
          element: null,
          tag: "",
          text: {
            expression: "layer:A",
            arguments: {},
          },
          attributes: {},
          children: [],
          renderers: [],
          updates: {},
        },
      ],
    },
    {
      template: "<div>",
      element: null,
      tag: "div",
      flag: "static",
      text: {},
      attributes: {},
      children: [
        {
          template: "layer:A",
          element: null,
          tag: "",
          text: {
            expression: "layer:A",
            arguments: {},
          },
          attributes: {},
          children: [],
          renderers: [],
          updates: {},
        },
      ],
    },
    {
      template: "<div>",
      element: null,
      tag: "div",
      flag: "static",
      text: {},
      attributes: {},
      children: [
        {
          template: "layer:A",
          element: null,
          tag: "",
          text: {
            expression: "layer:A",
            arguments: {},
          },
          attributes: {},
          children: [],
          renderers: [],
          updates: {},
        },
      ],
    },
    {
      template:
        '<div class="defaultB {{`${classes.classB0}  ${classes.classB1}`}}" @for="{{lists.listB}}" @for-index="idxB" @for-value="valB" @key="{{idxB}}" @if="{{conditions.conB0 && conditions.conB1}}">',
      element: null,
      tag: "div",
      flag: "extra",
      attributes: {
        class: {
          compute:(scope)=>{
            with(scope){
              return "defaultB "+`${classes.classB0}  ${classes.classB1}`;
            }
          },
          expression: "defaultB {{`${classes.classB0}  ${classes.classB1}`}}",
          arguments: {
            classB0: ["classes", "classB0"],
            classB1: ["classes", "classB1"],
          },
        },
        "@for": {
          compute:(scope)=>{
            with(scope){
              return lists.listB;
            }
          },
          expression: "lists.listB",
          arguments: {
            listB: ["lists", "classB"],
          },
          index: "idxB",
          value: "valB",
        },
        "@key": {
          compute:(scope)=>{
            with(scope){
              return idxB;
            }
          },
          expression: "idxB",
          arguments: {
            idxB: ["idxB"], // 编译为 scope.idxB
          },
        },
        "@if": {
          compute:(scope)=>{
            with(scope){
              return conditions.conB0 && conditions.conB1;
            }
          },
          expression: "{{conditions.conB0 && conditions.conB1}}",
          arguments: {
            conB0: ["conditions", "conB0"],
            conB1: ["conditions", "conB1"],
          },
        },
      },
      children: [
        {
          template: "<div>",
          element: null,
          tag: "div",
          flag: "static",
          text: {},
          attributes: {},
          children: [
            {
              template: "layer:B",
              element: null,
              tag: "",
              flag: "static",
              text: {
                expression: "layer:B",
                arguments: {},
              },
              attributes: {},
              children: [],
            },
          ],
        },
        {
          template: "<div>",
          element: null,
          tag: "div",
          flag: "static",
          text: {},
          attributes: {},
          children: [
            {
              template: "layer:B",
              element: null,
              tag: "",
              flag: "static",
              text: {
                expression: "layer:B",
                arguments: {},
              },
              attributes: {},
              children: [],
            },
          ],
        },
        {
          template:
            '<div class="{{`${classes.classC0}  ${classes.classC1}`}}" @for="{{lists.listC}}" @for-index="idxC" @for-value="valC" @key="{{idxC}}" @if="{{conditions.conC0 && conditions.conC1}}">',
          element: null,
          tag: "div",
          flag: "",
          attributes: {
            class: {
              compute:(scope)=>{
                with(scope){
                  return "defaultC "+`${classes.classC0}  ${classes.classC1}`+"";
                }
              },
              expression: "defaultC {{`${classes.classC0}  ${classes.classC1}`}}",
              arguments: {
                classC0: ["classes", "classC0"],
                classC1: ["classes", "classC1"],
              },
            },
            "@if": {
              compute:(scope)=>{
                with(scope){
                  return idxB;
                }
              },
              expression: "{{idxA !== idxB}}",
              arguments: {
                idxA: ["idxA"], // 编译为 scope.idxA
                idxB: ["idxB"], // 编译为 scope.idxB
              },
            },
          },
          children: [
            {
              template: "<div>",
              element: null,
              tag: "div",
              flag: "static",
              text: {},
              attributes: {},
              children: [
                {
                  template: "layer:C",
                  element: null,
                  tag: "",
                  text: {
                    expression: "layer:C",
                    arguments: {},
                  },
                  attributes: {},
                  children: [],
                },
              ],
              renderers: [],
              updates: {},
            },
            {
              template: "row:{{idxA}}, col:{{idxB}}",
              element: null,
              tag: "",
              flag: "",
              text: {
                compute:(scope)=>{
                  with(scope){
                    return "row:"+"idxA"+", col:"+"idxB"+"";
                  }
                },
                expression: "row:{{idxA}}, col:{{idxB}}",
                arguments: {
                  idxA: ["idxA"], // 编译为 scope.idxA
                  idxB: ["idxB"], // 编译为 scope.idxB
                },
              },
              attributes: {},
              children: [],
            },
          ],
        },
      ],
    },
  ],
};
