import Dep from "./dep";

function defineReactive(target, key, val) {
    if(!target || typeof target !== "object") return;

    const dep = Dep.create();
    /**
     * 调用 get 时绑定更新方法、调用 set 时调用更新方法，
     */
    Object.defineProperty(target, key, {
        get() {
            // 这里不能return target[key]，会一直触发get，造成死循环
            console.log("get", target, key);
            dep.subscribe();
            return val;
        },
        set(newVal) {
            // 同理这里使用data[key]去判断也会出现死循环
            if (val === newVal) return;
            val = newVal;
            dep.publish("set");
            console.log("set", val, newVal);
        },
    });
    /**
     * 对数组操作方法进行改写，以便确定数组数据进行着何种变化（插入、删除、交换）
     */
    if (Array.isArray(val)) {
        // 给数组设置新的原型
        // val.__proto__ = proto
        Object.setPrototypeOf(val, resetArrayProto(dep));
        // val.forEach((item, key)=>{
        //     defineReactive(val, key, item);
        // });
    }
    observe(val);/* 向下递归 */
}

function  resetArrayProto(dep) {
    const arrayProto = Array.prototype;

    // 复制一份新的原型，避免对数组的原型造成污染
    const proto = Object.create(arrayProto);
    // 改写数组的7个方法
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

function observe(obj) {
    if (typeof obj !== "object" || obj === null) return;
    Object.entries(obj).forEach(([key, val]) => {
        defineReactive(obj, key, val);
    });
    return obj;
}


export default observe;
