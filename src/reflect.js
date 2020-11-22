import Dep from "./dep";

// revocable 
// const state = {};

// function unique(){
//     let key;
//     do{
//         key = Math.random();
//     }while(state[key])
//     return key;
// }

export function reflect(obj){
    if(!obj || (typeof obj !== "object" && typeof obj !== "function")){
        obj = {value:obj};
    }
    const dep = Dep.create();
    return new Proxy(obj, {
        get:function(target, key, receiver){
            // Dep.caller && dep.sub(Dep.caller);
            dep.subscribe();
            return Reflect.get(target, key, receiver);
        },
        set: function(target, key, value, receiver){
            dep.publish();
            return Reflect.set(target, key, value, receiver);
        }
    });
}

