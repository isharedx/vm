import Dep from "./dep";

function  resetArrayProto(dep) {
    if(!(dep instanceof Dep)) return;

    const arrayProto = Array.prototype;

    /* 复制一份新的原型，避免对数组的原型造成污染 */
    const proto = Object.create(arrayProto);
    /* 改写数组的方法 */
    [
        "push",
        "pop",
        "shift",
        "unshift",
        "splice",
        "sort",
        "reverse",
    ].forEach((method) => {
        proto[method] = function (...args) {
            // Array.prototype[method]
            const result = arrayProto[method].apply(this, args);
            dep.publish(method);
            console.log(`resetArrayProto:${method}`);
            return result;
        };
    });
    return proto;
}

function reactive(target, key, value) {
    if(!target || typeof target !== "object") return;

    const dep = Dep.create();
    /**
     * 调用 get 时绑定更新方法、调用 set 时调用更新方法，
     */
    Object.defineProperty(target, key, {
        get() {
            /* 这里不能 return target[key]，会一直触发get，造成死循环 */
            console.log("get", target, key);
            dep.subscribe();
            return value;
        },
        set(newVal) {
            /* 同理这里使用 data[key] 去判断也会出现死循环 */
            if (value === newVal) return;
            console.log("set", value, newVal);
            value = newVal;
            dep.publish("set");
        },
    });
    /**
     * 对数组操作方法进行改写，以便确定数组数据进行着何种变化（插入、删除、交换）
     */
    if (Array.isArray(value)) {
        // 给数组设置新的原型
        // value.__proto__ = proto
        Object.setPrototypeOf(value, resetArrayProto(dep));
    }
}

export function observe(obj){
    /* 非递归深度优先遍历 */
    const stack = [[null, "", obj]];// element format: [ target, key, value ]
    while(stack.length){
        const [target, key, value] = stack.pop();

        reactive(target, key, value);

        if(!value || typeof value !== "object") continue;/* 过滤空值和常量值，避免无效遍历和 value 值为 undefined, null 时导致报错 */

        Object.entries(value).forEach(([key, val]) => {
            stack.push([value, key, val]);
        });
    }
    return obj;
}

export function ref(obj){
    let $ = {value: obj};
    observe($);
    return function(){
        if(!$) throw Error("The ref var is destroyed!");
        switch(arguments.length){
        case 1:
            $.value = arguments[0];
            return ()=> ($ = null);/* 不再使用时将其指向的对象释放  */
        case 0:
            return $.value;
        default: 
            return void ($ = null);/* 不再使用时将其指向的对象释放  */
        }
    };
}

export default observe;
