class Compiler {
    // data ==> vm
    constructor() {
        // this.ast = ast;
        // this.scope = scope;
        console.log("Compiler.constructor");
        // const VMNodes = this.compile();
        // console.log("Compiler:", VMNodes);
    }

    /**
     *
     * @param {*} ASTNodes
     * @param {*} scope 数据空间：主要用以传递 for 指令产生的 item,index 等局部变量（局部数据的向下传递，会有‘下’对‘上’的覆盖）
     */
    compile(ASTNodes, scope = {}) {
        // let ASTNodes = [ast]
        if (!ASTNodes || !ASTNodes.length) {
            return {};
        }
        // console.log("Compiler.compile:ASTNodes", ASTNodes);
        let VMNodes = [];
        for (let i = 0; i < ASTNodes.length; i++) {
            const $node = ASTNodes[i];
            /**
             * DynamicNode: 包含 if,key 等除 for 之外的指令属性的节点
             * ExtraNode： 由 for 指令编译而来，以辅助管理含 for 指令的节点
             * StaticNode： 不含自定义属性
             */
            if (!$node.flag) {
                // To do ...
                VMNodes.push(...this.compileToDynamicNode($node, scope));
            } else if ($node.flag == "extra") {
                VMNodes.push(...this.compileToExtraNode($node, scope));
            } else if ($node.flag == "static") {
                VMNodes.push(...this.compileToStaticNode($node, scope));
            } else {
                this.compile($node.children);
            }
        }
        window.VMNodes = VMNodes;
        // console.log("Compiler.compile:VMNodes", VMNodes);
        return VMNodes;
    }

    /**
     * DynamicNode: 包含 if 等指令
     * @param {*} node
     * @param {*} scope
     */
    compileToDynamicNode(node, scope) {
        // console.log("Compiler.compileToDynamicNode:", node, scope);
        const { children: $children } = node;
        node.children = this.compile($children, scope);
        return [node];
    }

    compileToExtraNode(node, scope) {
        // console.log("Compiler.compileToExtraNode:", node, scope);
        let $scope;

        const {
            template,
            tag,
            flag,
            attributes, // 动态属性
            properties, // 静态属性
            children,
        } = node;

        let {
            index: $index,
            value: $value,
            arguments: $arguments,
            expression: $expression,
        } = attributes["@for"];
        $index = $index || "index";
        $value = $value || "index";

        const extraNode = this.createNode({
            template,
            tag,
            flag,
            attributes: {
                "@for": Object.assign({ array: [] }, attributes["@for"]),
            }, // attributes：动态属性
            properties: Object.assign({}, properties), // 静态属性
        });

        let $update = () => {
            /* 需将 Compiler.refer 的值设置为相应的调用者 */
            // Compiler.refer = ()=>{};
            const array = this.compute($expression, scope) || [];
            // Compiler.refer =null;
            if (!Array.isArray(array)) return []; // 待完成：暂时认定列表数据仅为数组类型

            let $children = []; // 子节点
            let $refers = []; // 缓存引用当前节点所产生的局部列表数据的节点（的更新方法）
            array.forEach((value, index) => {
                /**
                 * 更新数据空间
                 * @{
                 */
                $scope = $scope || Object.assign({}, scope);
                $scope.$references = $scope.$references || {};
                $scope[$index] = index;
                $scope[$value] = value;
                $scope.$references[$index] = extraNode;
                $scope.$references[$value] = extraNode;
                // console.log("$scope", Object.assign({}, $scope)) influences 影响
                /**
                 * @}
                 */

                /**
                 * 为局部数据绑定更新 dom 结点的方法（
                 *      通过重写 get/set 方法，
                 *      调用 get 时绑定更新方法、调用 set 时调用更新方法，
                 *      更新方法在绑定时须提前挂载到 Compiler.refer
                 * )
                 * @{
                 */
                // 检测子节点对 index & value 值的引用情况并记录到 extraNode 的 influences 属性中
                // 以方便直接锁定需要更新的子孙节点
                [$index, $value].forEach((item) => {
                    // console.log($scope, $index, $value, item);
                    Object.defineProperties($scope, {
                        [item]: {
                            enumerable: true,
                            configurable: true,
                            get() {
                                Compiler.refer && $refers.push(Compiler.refer);
                                console.log("get a value by", item);
                            },
                            set() {
                                $refers.forEach((refer) => {
                                    refer && refer($scope);
                                });
                                console.log("set a value by", item);
                            },
                        },
                    });
                });
                /**
                 * @}
                 */

                // const $attributes = Object.assign({}, {...attributes});
                // delete $attributes["@for"];
                const $node = Object.assign({}, node, {
                    flag: "",
                    attributes: Object.assign({}, attributes, {
                        "@for": undefined,
                    }), //$attributes,
                });
                // console.log({ $node, node });
                $children.push(
                    ...this.compile([Object.assign({}, $node)], $scope)
                );

                /**
                 * 通过替换原型的方式改写数组的方法
                 * @{
                 */
                const oldProto = Array.prototype, // Array.prototype 无法达到改写（不止一次改写）覆盖
                    newProto = Object.create(oldProto); // 复制一份新的原型，避免对数组的原型造成污染
                /* 改写数组的7个方法 */
                // [
                //     "push",
                //     "pop",
                //     "shift",
                //     "unshift",
                //     "splice",
                //     "sort",
                //     "reverse",
                // ].forEach((method) => {});
                const that = this;
                newProto["push"] = function (...args) {
                    // Array.prototype[method]
                    const result = oldProto["push"].call(this, ...args);
                    // callbacks.forEach((callback) => callback && callback());
                    // console.log(`resetProto:${method}`);
                    $children.push(
                        ...that.compile([Object.assign({}, $node)], $scope)
                    );
                    return result;
                };
                console.log(oldProto,newProto);
                /* 给数组设置新的原型 */
                // array.__proto__ = newProto
                Object.setPrototypeOf(array, newProto);
                /**
                 * @}
                 */
            });
            extraNode.children = $children; // 待优化：1） 后期不应整体替换，而是只替换或增减改动的节点； 2）更新时，若非新增节点，则不需要重新编译其子孙节点
            extraNode.attributes["@for"]["array"] = array; // 存储当前列表数据，用以下次更新时比对列表数组的新旧差异
            extraNode.refers = $refers;
            console.log({ $children });
            return $children;
        };
        /* 以下保留参考： 
        //  列表数据校验：
        //  列表数据不变==>相应DOM元素结构不变
        //  1）index & value 的值均一致（不改变DOM元素结构）
        //  2）index 值一致，且子节点均不引用 value 值（子节点仅引用 index 值且 index 值存在时，不改变DOM元素结构）
        //  3）value 值一致，且子节点均不引用 index 值（子节点仅引用 value 值且 value 值存在时，只移动DOM元素位置）
        // 
        //  extraNode 中增加 influences 属性记录子节点对 index & value 值的引用情况
        //
        const update = () => {
            const arr = attributes["@for"].compute(Object.assign({}, scope));
            const $arr = extraNode.attributes["@for"].array;
            arr.forEach((val, idx) => {
                if (JSON.stringify(val) != JSON.stringify(array[idx])) {
                    // To update
                    if (
                        array
                            .map((item) => {
                                return JSON.stringify(item);
                            })
                            .some(JSON.stringify(val))
                    ) {
                        // To switch DOM element position
                    } else {
                        // To create a new DOM element and remove the old DOM element
                    }
                }
            });
        }; */
        /**
         * 利用 Observer.callback 将节点更新函数 $update 挂载到数据监听（Object.defineProperty）上
         */
        Observer.callback = $update;
        $update();
        Observer.callback = null;

        return [extraNode];
    }

    compileToStaticNode(node, scope) {
        return [node];
    }

    compileIf() {}

    compute(expression, scope) {
        // let expression = "classes.classA";
        // console.log(
        //   "compute:",
        //   expression,
        //   this.scope,
        //   scope,
        //   Object.assign({}, this.scope, scope)
        // );
        let data = expression.split(".").reduce((prev, curr) => {
            // console.log({prev,curr})
            return prev[curr];
        }, Object.assign({}, this.scope, scope));
        // console.log("compute:data", data);
        return data || [];
        // return [];
    }

    createNode({
        template = "",
        element = null,
        tag = "",
        key = "",
        flag = "",
        attributes = {}, // 动态属性
        properties = {}, // 静态属性
        children = [],
        renderers = [],
        updates = {},
    }) {
        return {
            template,
            element,
            tag,
            key,
            flag,
            attributes, // 动态属性
            properties, // 静态属性
            children,
            renderers,
            updates,
        };
    }
}

Compiler.refer = null; // 用于绑定引用节点的更新方法，在调用 compute 方法计算来 scope 的值时设置为相应的调用者
