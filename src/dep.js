class Dep{
    static create(){
        const instance = new Dep();
        Dep.instances.push(instance);
        return instance;
    }
    static reflect(subscriber, track){
        Dep.subscriber = subscriber;
        track();
        Dep.subscriber = null;
    }
    constructor(){
        this.callbacks =[];
    }
    subscribe(){
        if(!Dep.subscriber) return;
        let {context, caller, params} = Dep.subscriber;
        const {callbacks} = this;
        if(callbacks.some(
            ({context:ctx, caller:c, params:args})=>ctx === context && c === caller && args===params)
        ) return;/* 避免重复订阅 */
        
        context = context|| window;
        params = params ? Array.isArray(params) ? params : [params] : [];
        callbacks.push({context, caller, params});
    }
    publish(type="set"){/* type: 操作类型 */
        const {callbacks} = this;
        callbacks.forEach(({context, caller, params})=>{
            caller.apply(context, {type, params});
        });
    }
}
/* Dep.caller = null; */
Dep.instances = [];
Dep.subscriber = null;

export default Dep;
