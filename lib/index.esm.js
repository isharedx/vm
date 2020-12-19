function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function traverse(ast
/* , visitor */
, visit) {
  /**
   * 1、首先将根节点放入栈中。
   * 2、从栈中弹一个节点进行遍历， 同时将其尚未检验过的直接子节点压入栈中。
   * 3、重复步骤2。
   * 4、如果不存在未检测过的直接子节点，则将上一级节点加入栈中，并执行步骤2。
   * 5、重复步骤4。
   * 6、若栈为空，表示整个树都检查过了——亦即树中没有可遍历继续的目标。
   */
  var stack = [{
    current: ast,
    parent: null
  }]; // const paths = [];

  while (stack.length) {
    var _stack$pop = stack.pop(),
        current = _stack$pop.current,
        children = _stack$pop.current.children,
        parent = _stack$pop.parent; // const visit = visitor[type];


    if (visit) {
      visit(current, parent);
    }

    if (Array.isArray(children) && children.length) {
      // paths.push(current);
      for (var i = children.length - 1; i >= 0; i--) {
        // 逆序压栈，以保证顺序弹出
        stack.push({
          current: children[i],
          parent: current
        });
      } // children.reverse().forEach(child=>{// 逆序压栈，以保证顺序弹出
      //     stack.push({current:child, parent: current});
      // });

    }
  }
}

var state = {
  computers: [// `function(scope){ with(scope){ return ${expression}; } }`
  ],
  // new Function("",`return [${computers.join(',')}]; `)
  vdom: {
    type: "root",
    children: []
  },
  eval: function _eval() {
    var computers = state.computers;
    return new Function("return [".concat(computers.join(","), "]; "))();
  }
};

function functionalize(expr) {
  var computers = state.computers;
  var code = "function(scope){ with(scope){  return ".concat(expr, "; } }");
  return computers.push(code) - 1;
}

function transform(ast) {
  var vdom = state.vdom;
  traverse(ast, function (current, parent) {
    if (!parent) {
      // 根节点
      current.context = vdom.children; // 保留一个从旧 ASTNode 指向新 VNode 的引用 context

      return;
    }

    var type = current.type;

    try {
      switch (type) {
        case "text":
          checkTextASTNode(current, parent);
          break;

        case "element":
          checkElementASTNode(current, parent);
          break;

        default:
          throw new TypeError("Illegal ASTNode type with ".concat(type, "!"));
      }
    } catch (error) {
      console.warn({
        current: current,
        parent: parent
      });
      console.error(error); // throw error;
    } // console.log(current, parent);

  });
  console.log({
    vdom: vdom
  });
  return state;
}

function checkTextASTNode(current, parent) {
  var text = current.text;
  var context = parent.context; // transform text node

  var vnode = {
    type: "text",
    flag: "static",
    // Default, transform to static text vnode
    text: {
      raw: text
    }
  };

  if (/\{\{[\s\S]+\}\}/.test(text)) {
    // transform to dynamic text vnode
    var expression = "'".concat(text.replace(/'/g, "\"").split(/{{/g).join("'+").split(/}}/g).join("+'"), "'");
    Object.assign(vnode, {
      flag: "dynamic",
      text: {
        raw: text,
        key: Symbol(),
        expression: expression,
        compute: functionalize(expression)
      }
    });
  }

  context.push(vnode);
}

function checkElementASTNode(current, parent) {
  var data = current.data;
  var context = parent.context; // transform element node

  var tag = data.tag,
      map = data.map;
  var vnode = {
    type: "element",
    flag: "static",
    // Default, transform to static element vnode
    data: {
      tag: tag,
      directives: [],
      properties: [],
      attributes: []
    },
    // control: null,
    children: []
  };
  /* 属性转换 */

  var extras = []; // [ @for, @if ]

  transformAttrs(map, vnode, extras);
  /* 构建 extra 节点 */

  buildExtraVNode(extras, vnode, context);
  /* 保留一个从旧 ASTNode 指向新 VNode 的引用 context */

  current.context = vnode.children;
}

function transformAttrs(attrsMap, vnode, extras) {
  if (!attrsMap) return;
  var _vnode$data = vnode.data,
      directives = _vnode$data.directives,
      properties = _vnode$data.properties,
      attributes = _vnode$data.attributes;
  /* 遍历属性 */

  Object.entries(attrsMap).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        name = _ref2[0],
        text = _ref2[1];

    // let scope={};
    if (!name) {
      // illegal attribute name
      throw new TypeError("Illegal attribute name with ".concat(name, "!"));
    } else if (/^@for/.test(name)) {
      /* 收集 extra 节点 */
      extras[0] = transToLoopCtrl(name, text);
    } else if (/^@if/.test(name)) {
      /* 收集 extra 节点 */
      extras[1] = transToDecisionCtrl(name, text);
    } else if (/^@[a-zA-Z][a-zA-Z-:]*/.test(name)) {
      /* 收集指令属性 */
      directives.push(transToDirectives(name, text));
    } else if (/\{\{[\s\S]+\}\}/.test(text)) {
      /* 收集动态属性 */
      properties.push(transToProperties(name, text));
    } else {
      /* 收集静态属性 */
      attributes.push({
        name: name,
        text: text
      });
    }
  });
  /* 标记静态节点 */

  if (directives.length || properties.length) {
    Object.assign(vnode, {
      flag: "dynamic",
      key: Symbol()
    });
  }
}

function transToLoopCtrl(name, text) {
  var match = /(.+?)\s*in\s*([^\s]+)/.exec(text),
      expression = match[2].trim(),
      alias = /^([^()]+)$/.exec(match[1]),
      entry = /\((.+?)(?:[, ](.+?))(?:[, ](.+?))\)/.exec(match[1]);
  return {
    type: "extra",
    use: "loop",
    control: {
      type: "@for",
      name: name,
      text: text,
      detail: {
        alias: alias ? alias[1] : "",
        value: entry ? entry[1] : "",
        index: entry ? entry[2] : ""
      },
      expression: expression,
      // such as "(val, key, idx) in list" or "(val, key) in list" or "(val) in list" or "item:{key, index, value} in list"
      computer: functionalize(expression) //new Function("scope", `with(scope){return ${expression}}`)

    },
    origin: null,
    children: []
  };
}

function transToDecisionCtrl(name, text) {
  var expression = text.trim();
  return {
    type: "extra",
    use: "decision",
    control: {
      type: "@if",
      name: name,
      text: text,
      expression: expression,
      computer: functionalize(expression) //new Function("scope", `with(scope){return ${expression}}`)

    },
    origin: null,
    children: []
  };
}

function transToDirectives(name, text) {
  var match = /@(?:[a-zA-Z][a-zA-Z-]*:)?([a-zA-Z][a-zA-Z-]*)/.exec(name);
  return {
    name: name,
    text: text,
    expression: match[1]
  };
}

function transToProperties(name, text) {
  var expression = "'".concat(text.replace(/'/g, "\"").split(/{{/g).join("'+").split(/}}/g).join("+'"), "'");
  return {
    key: Symbol(),
    name: name,
    text: text,
    expression: expression,
    computer: functionalize(expression)
  };
}

function buildExtraVNode(extras, vnode, context) {
  var extra = null;

  if (extras[0] && extras[1]) {
    extras[0]["origin"] = extras[1];
    extras[1]["origin"] = vnode;
    extra = extras[0];
  } else if (extras[0]) {
    extras[0]["origin"] = vnode;
    extra = extras[0];
  } else if (extras[1]) {
    extras[1]["origin"] = vnode;
    extra = extras[1];
  } else {
    extra = vnode;
  }

  context.push(extra);
}

var Dep = /*#__PURE__*/function () {
  _createClass(Dep, null, [{
    key: "create",
    value: function create() {
      var instance = new Dep();
      Dep.instances.push(instance);
      return instance;
    }
  }, {
    key: "reflect",
    value: function reflect(subscriber, track) {
      Dep.subscriber = subscriber;
      track();
      Dep.subscriber = null;
    }
  }]);

  function Dep() {
    _classCallCheck(this, Dep);

    this.callbacks = [];
  }

  _createClass(Dep, [{
    key: "subscribe",
    value: function subscribe() {
      if (!Dep.subscriber) return;
      var _Dep$subscriber = Dep.subscriber,
          context = _Dep$subscriber.context,
          caller = _Dep$subscriber.caller,
          params = _Dep$subscriber.params;
      var callbacks = this.callbacks;
      if (callbacks.some(function (_ref) {
        var ctx = _ref.context,
            c = _ref.caller,
            args = _ref.params;
        return ctx === context && c === caller && args === params;
      })) return;
      /* 避免重复订阅 */

      context = context || window;
      params = params ? Array.isArray(params) ? params : [params] : [];
      callbacks.push({
        context: context,
        caller: caller,
        params: params
      });
    }
  }, {
    key: "publish",
    value: function publish() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "set";

      /* type: 操作类型 */
      var callbacks = this.callbacks;
      callbacks.forEach(function (_ref2) {
        var context = _ref2.context,
            caller = _ref2.caller,
            params = _ref2.params;
        caller.apply(context, {
          type: type,
          params: params
        });
      });
    }
  }]);

  return Dep;
}();
/* Dep.caller = null; */


Dep.instances = [];
Dep.subscriber = null;

function resetArrayProto(dep) {
  if (!(dep instanceof Dep)) return;
  var arrayProto = Array.prototype;
  /* 复制一份新的原型，避免对数组的原型造成污染 */

  var proto = Object.create(arrayProto);
  /* 改写数组的方法 */

  ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"].forEach(function (method) {
    proto[method] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      // Array.prototype[method]
      var result = arrayProto[method].apply(this, args);
      dep.publish(method);
      console.log("resetArrayProto:".concat(method));
      return result;
    };
  });
  return proto;
}

function reactive(target, key, value) {
  if (!target || _typeof(target) !== "object") return;
  var dep = Dep.create();
  /**
   * 调用 get 时绑定更新方法、调用 set 时调用更新方法，
   */

  Object.defineProperty(target, key, {
    get: function get() {
      /* 这里不能 return target[key]，会一直触发get，造成死循环 */
      console.log("get", target, key);
      dep.subscribe();
      return value;
    },
    set: function set(newVal) {
      /* 同理这里使用 data[key] 去判断也会出现死循环 */
      if (value === newVal) return;
      console.log("set", value, newVal);
      value = newVal;
      dep.publish("set");
    }
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

function observe(obj) {
  /* 非递归深度优先遍历 */
  var stack = [[null, "", obj]]; // element format: [ target, key, value ]

  var _loop = function _loop() {
    var _stack$pop = stack.pop(),
        _stack$pop2 = _slicedToArray(_stack$pop, 3),
        target = _stack$pop2[0],
        key = _stack$pop2[1],
        value = _stack$pop2[2];

    reactive(target, key, value);
    if (!value || _typeof(value) !== "object") return "continue";
    /* 过滤空值和常量值，避免无效遍历和 value 值为 undefined, null 时导致报错 */

    Object.entries(value).forEach(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          val = _ref2[1];

      stack.push([value, key, val]);
    });
  };

  while (stack.length) {
    var _ret = _loop();

    if (_ret === "continue") continue;
  }

  return obj;
}
function ref(obj) {
  var $ = {
    value: obj
  };
  observe($);
  return function () {
    if (!$) throw Error("The ref var is destroyed!");

    switch (arguments.length) {
      case 1:
        $.value = arguments[0];
        return function () {
          return $ = null;
        };

      /* 不再使用时将其指向的对象释放  */

      case 0:
        return $.value;

      default:
        return void ($ = null);

      /* 不再使用时将其指向的对象释放  */
    }
  };
}

var ast = {
  type: "root",
  children: [{
    type: "element",
    data: {
      tag: "div",
      map: {
        "class": "default {{classes.classA0}} {{classes.classA1}}",
        "@for": "(valA keyA idxA) in lists.listA",
        "@key": "idxA",
        "@if": "conditions.conA0 && conditions.conA1",
        "@on:click": "onDivAClick"
      }
    },
    children: [{
      type: "element",
      data: {
        tag: "div"
      },
      children: [{
        type: "text",
        text: "layer:A"
      }]
    }, {
      type: "element",
      data: {
        tag: "div",
        map: {
          "class": "default {{classes.classB0}} {{classes.classB1}}",
          "@for": "(valB keyB idxB) in lists.listB",
          "@key": "idxB",
          "@if": "conditions.conB0 && conditions.conB1",
          "@click": "onDivBClick"
        }
      },
      children: [{
        type: "text",
        text: "layer:B"
      }, {
        type: "element",
        data: {
          tag: "div",
          map: {
            "class": "default {{classes.classC0}} {{classes.classC1}}",
            "@if": "idxA !== idxB",
            "@click": "onDivCClick"
          }
        },
        children: [{
          type: "text",
          text: "layer:C"
        }, {
          type: "text",
          text: "row:{{idxA}}, col: {{idxB}}"
        }]
      }]
    }]
  }]
};

// import Transformer from "./transformer";
/* export default class VM{
    constructor(setup=()=>{return {}}){
        const context = setup.call(this)
    }
} */

var data = {
  classes: {
    classA0: "classA0",
    classA1: "classA1",
    classB0: "classB0",
    classB1: "classB1",
    classC0: "classC0",
    classC1: "classC1"
  },
  lists: {
    listA: ["A0", "A1", "A2", "A3", "A4", "A5"],
    listB: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
    listC: ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9"]
  },
  conditions: {
    conA0: true,
    conA1: true,
    conB0: true,
    conB1: true,
    conC0: true,
    conC1: true
  }
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

var s = transform(ast);
console.log("transform:ret", s);
var computers = s.eval();
console.log("state.eval()", computers);
console.log("[computers[0](data)]", [computers[0](data)]
/* computers.map(item=>item(data)) */
);
