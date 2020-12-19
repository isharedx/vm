// import Transformer from "./transformer";
// import Generator from "./generator";
import transform from "./transform";
// import {reflect} from "./reflect";
import {observe, ref} from "./state";

import {ast} from "./data";
/* export default class VM{
    constructor(setup=()=>{return {}}){
        const context = setup.call(this)
    }
} */
const data = {
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
    },
};
/* console.log("reflect:number", reflect(1));
console.log("reflect:string", reflect("a"));
console.log("reflect:null", reflect(null));
console.log("reflect:undefined", reflect(undefined));
console.log("reflect:symbol", reflect(Symbol()));
console.log("reflect:object", reflect(data)); */
console.log("observe:object", observe(data));
console.log("[ref(false)]", [ref(false)]);
/* const arr = [];
let proxy = new Proxy(arr, {
    get:function(target, p, receiver){
        console.log("get", p);
        return Reflect.get(target, p, receiver);
    },
    set:function(target, p, value, receiver){
        console.log("set", p, value);
        return Reflect.set(target, p, value, receiver);
    }
});
console.log({proxy});
proxy.push(1); */

// const t = new Transformer(ast);
// const g = new Generator(t.vdom);
const s = transform(ast);
console.log("transform:ret", s);
const computers = s.eval();
console.log("state.eval()", computers);
console.log("[computers[0](data)]", [computers[0](data)]/* computers.map(item=>item(data)) */);
