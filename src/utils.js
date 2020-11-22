
export function traverse(ast/* , visitor */, visit){
    /**
     * 1、首先将根节点放入栈中。
     * 2、从栈中弹一个节点进行遍历， 同时将其尚未检验过的直接子节点压入栈中。
     * 3、重复步骤2。
     * 4、如果不存在未检测过的直接子节点，则将上一级节点加入栈中，并执行步骤2。
     * 5、重复步骤4。
     * 6、若栈为空，表示整个树都检查过了——亦即树中没有可遍历继续的目标。
     */
    const stack = [{current:ast, parent: null}];
    // const paths = [];
    while(stack.length){
        const {current, current:{/* type, */ children}, parent} = stack.pop();

        // const visit = visitor[type];
        if(visit){
            visit(current, parent);
        }

        if(Array.isArray(children) && children.length){
            // paths.push(current);
            for(let i=children.length-1; i>=0; i--){// 逆序压栈，以保证顺序弹出
                stack.push({current:children[i], parent: current});
            }
            // children.reverse().forEach(child=>{// 逆序压栈，以保证顺序弹出
            //     stack.push({current:child, parent: current});
            // });
        }
    }
}
