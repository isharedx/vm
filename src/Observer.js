class Observer {
    constructor() {}

    defineReactive(data, key, val) {
        let callbacks = [];
        this.observe(val);
        /**
         * 为数据绑定更新 dom 结点的方法（
         *      通过重写 get/set 方法，
         *      调用 get 时绑定更新方法、调用 set 时调用更新方法，
         *      更新方法在绑定时须提前挂载到 Observer.callback 
         * ）
         * @{
         */
        Object.defineProperty(data, key, {
            get() {
                // 这里不能return data[key]，会一直触发get，造成死循环
                console.log("挂载",Observer.callback);
                Observer.callback && callbacks.push(Observer.callback);
                return val;
            },
            set(newVal) {
                // 同理这里使用data[key]去判断也会出现死循环
                if (val === newVal) return;
                val = newVal;
                callbacks.forEach((callback) => callback && callback());
                console.log("setter");
            },
        });
        /**
         * 由 Compiler 完成对数组操作方法的改写，
         * 以便确定数组数据进行着何种变化（插入、删除、交换）
         * @{
         */
        /* if (Array.isArray(val)) {
            // 给数组设置新的原型
            // val.__proto__ = proto
            Object.setPrototypeOf(val, this.resetProto(callbacks));
            for (let i = 0; i < val.length; i += 1) {
                this.observe(val[i]);
            }
        } */
        /**
         * @}
         */
    }

    resetProto(callbacks = []) {
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
                const result = arrayProto[method].call(this, ...args);
                callbacks.forEach((callback) => callback && callback());
                console.log(`resetProto:${method}`);
                return result;
            };
        });
        return proto;
    }

    observe(data) {
        if (typeof data !== "object" || data === null) return;
        Object.keys(data).forEach((key) => {
            this.defineReactive(data, key, data[key]);
        });
    }
}

Observer.callback = () => {
    console.log("更新视图");
};


