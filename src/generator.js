import {traverse} from "./utils";


class Generator {
    constructor(vdom){
        traverse(vdom, (current, parent)=>{
            console.log(current, parent);
        });
    }
}

export default Generator;
