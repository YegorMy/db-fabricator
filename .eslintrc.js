module.exports = {
  "extends": 'airbnb',
  "env": {
    "node": true,
    "mocha" : true,
    "es6" : true
  },
  "rules" : {
    "indent": ["error", 2, { "VariableDeclarator": 2 ,"SwitchCase": 1}],
    "max-len": ["error", 140, 2,  {"ignoreUrls": true, "ignoreTemplateLiterals": true}],
    "no-param-reassign": ["error", { "props": false }],
    "no-console" : "off",
    "space-before-function-paren": ["error", "never"],
    "func-names": "warn",
    "no-underscore-dangle": ["warn", {"allowAfterThis": true, "allowAfterSuper": true} ],
    'linebreak-style': ["error", "unix"]
  },
  "globals": {"browser": false, "$": false, "expect": false, "assert": false, "beforeAll": false}
};