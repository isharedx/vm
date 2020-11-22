/******************************************************
规范：
1、原生属性中的字符串使用 {{}}  表示相应的绑定数据， 例如 <img class="default {{class">
2、自定义属性中是字符串即是相应的绑定数据


ASTNode:{
    type: "root" | "text" | "element",
    data?: { // When type is 'element'
        tag?: String,
        map?: {[attribute]: String}, // 被重复赋值的属性，取后者
    }
    text?: String // When type is 'text'
    children?: Array,  // When type is 'element' or 'root'
}

VNode:{
    type: "root" | "text" | "element" | "extra",
    flag: "static" | "dynamic",
    key: String | Number | Symbol,
    data?: { // When type is 'element'
        tag: String,
        directives: IDirective[], // Bound HTML event attributes, such as <img @click="click">, etc.
        attributes: IAttribute[], // When flag is static, means static HTML attributes, such as <img title="Title Text">, etc.
        properties: IProperty[], // When flag is dynamic, means dynamic HTML attributes, such as <img title="{{title}}">, etc.
    }
    text?: { // When type is 'text'
        raw: String,
        key: String | Number | Symbol, // When flag is dynamic
        compute: Function, // When flag is dynamic
    },
    control?: { // When type is 'extra', such as <img @for="(v,i) in 3"  @key="i">, <img @if="show">, etc.
        key: String | Number | Symbol, 
        type: 'for' | 'if', 
        expression: String, 
        compute: Function
    },
    children?: Array,
    element?: HTMLElement,
    parent?: HTMLElement,
}

IProperty: {
    key: String | Number | Symbol,
    name: String,
    text: String,
    compute: Function,
}
such as: 
{
    key: String | Number | Symbol,
    name: 'class',
    text: 'default {{classes.classA0}} {{classes.classA1}}',
    compute: (scope)=>{ // new Function("scope",`with(scope){return '${text.replace("'", "\"").split(/{{/igm).join("'+").split(/}}/igm).join("+'")}';}`)
        with(scope){
            return "default "+`${classes.classA0}  ${classes.classA1}`+"";
        }
    },

}
******************************************************/

import {traverse} from "./utils";

const state = {
    computers:[
        // `function(scope){ with(scope){ return ${expression}; } }`
    ],// new Function("",`return [${computers.join(',')}]; `)
    vdom: {
        type: "root",
        children: []
    },
    eval: ()=>{
        const {computers} = state;
        return (new Function("",`return [${computers.join(",")}]; `))();
    }
};

function functionalize(expr){
    const { computers } = state;
    let code = `function(scope){ with(scope){  return ${expr}; } }`;
    return computers.push(code)-1;
}

function transform(ast){
    const {vdom} = state;

    traverse(ast,(current, parent)=>{
        if(!parent){// 根节点
            current.context =vdom.children;// 保留一个从旧 ASTNode 指向新 VNode 的引用 context
            return;
        }
        const {type} = current;
        try {
            switch(type){
            case "text":
                checkTextASTNode(current, parent);
                break;
            case "element":
                checkElementASTNode(current, parent);
                break;
            default:
                throw new TypeError(`Illegal ASTNode type with ${type}!`);
            }
        } catch (error) {
            console.warn({current, parent});
            console.error(error);
            // throw error;
        }
        // console.log(current, parent);
    });
    console.log({vdom});
    
    return state;
}

function checkTextASTNode(current, parent){
    const {/* type, data, */ text/* , children */} = current;
    const {context} = parent;
    // transform text node
    const vnode = {
        type: "text",
        flag: "static",// Default, transform to static text vnode
        text: {
            raw: text,
        },
    };
    if(/\{\{[\s\S]+\}\}/.test(text)){
        // transform to dynamic text vnode
        let expression = `${text.replace(/'/g, "\"").split(/{{/g).join("'+").split(/}}/g).join("+'")}`;
        Object.assign(vnode, {
            flag: "dynamic",
            text: {
                raw: text,
                key: Symbol(),
                expression,
                compute: functionalize(expression)
            },
        });
    }
    context.push(vnode);
}

function checkElementASTNode(current, parent){
    const {/* type, */ data/* , text, children */} = current;
    const {context} = parent;
    // transform element node
    const {tag, map} = data;
    const vnode = {
        type: "element",
        flag: "static",// Default, transform to static element vnode
        data: {
            tag,
            directives: [],
            properties: [],
            attributes: [],
        },
        // control: null,
        children: [],
    };
    /* 属性转换 */
    const controls = [];// [ @for, @if ]
    transformAttrs(map, vnode, controls);
    /* 构建 extra 节点 */
    buildExtraVNode(controls, vnode, context);
    /* 保留一个从旧 ASTNode 指向新 VNode 的引用 context */
    current.context = vnode.children; 
}

function transformAttrs(attrsMap, vnode, controls){
    if(!attrsMap) return;

    const { 
        data:{ directives, properties, attributes }
    } = vnode;
    /* 遍历属性 */
    Object.entries(attrsMap).forEach(([name,text])=>{
        // let scope={};
        if(!name){ // illegal attribute name
            throw new TypeError(`Illegal attribute name with ${name}!`);
        }else if(/^@for/.test(name)){/* 收集 extra 节点 */
            controls[0] =transToLoopCtrl(name, text);
        }else if(/^@if/.test(name)){/* 收集 extra 节点 */
            controls[1] = transToCondCtrl(name, text);
        }else if((/^@[a-zA-Z][a-zA-Z-:]*/.test(name))){/* 收集指令属性 */
            directives.push(transToDirectives(name, text));
        }else if(/\{\{[\s\S]+\}\}/.test(text)){/* 收集动态属性 */
            properties.push(transToProperties(name, text));
        }else{/* 收集静态属性 */
            attributes.push({name, text});
        } 
    });
    /* 标记静态节点 */
    if(directives.length || properties.length){
        Object.assign(vnode, {
            flag: "dynamic",
            key: Symbol(),
        });
    }
}

function transToLoopCtrl(name, text){
    let match= /(.+?)\s*in\s*([^\s]+)/.exec(text),
        expression = match[2].trim(),
        alias=/^([^()]+)$/.exec(match[1]),
        entry=/\((.+?)(?:[, ](.+?))(?:[, ](.+?))\)/.exec(match[1]);
    return {
        type: "extra",
        control: {
            type: "loop",
            name,
            text,
            target: null,
            detail:{
                alias: alias ? alias[1] : "",
                value: entry ? entry[1] : "",
                index: entry ? entry[2] : "",
            },
            expression,// such as "(val, key, idx) in list" or "(val, key) in list" or "(val) in list" or "item:{key, index, value} in list"
            computer: functionalize(expression), //new Function("scope", `with(scope){return ${expression}}`)
        },
        children: []
    };
}

function transToCondCtrl(name, text){
    let expression = text.trim();
    return {
        type: "extra",
        control: {
            type: "condition",
            name,
            text,
            target: null,
            expression,
            computer: functionalize(expression), //new Function("scope", `with(scope){return ${expression}}`)
        },
        children: []
    };
}

function transToDirectives(name, text){
    let match=/@(?:[a-zA-Z][a-zA-Z-]*:)?([a-zA-Z][a-zA-Z-]*)/.exec(name);
    return {name, text, expression:match[1]};
}

function transToProperties(name, text){
    let expression = `'${text.replace(/'/g, "\"").split(/{{/g).join("'+").split(/}}/g).join("+'")}'`;
    return {
        key: Symbol(),
        name, 
        text,
        expression,
        computer: functionalize(expression)
    };
}

function buildExtraVNode(controls, vnode, context){
    let extra = null;
    if(controls[0] && controls[1]){
        controls[0]["control"]["target"] = controls[1];
        controls[1]["control"]["target"] = vnode;
        extra = controls[0];
    }else if(controls[0]){
        controls[0]["control"]["target"] = vnode;
        extra = controls[0];
    }else if(controls[1]){
        controls[1]["control"]["target"] = vnode;
        extra = controls[1];
    }else{
        extra = vnode;
    }
    context.push(extra);
}


export default transform;
