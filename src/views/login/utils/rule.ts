import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 密码正则（密码格式应为8-18位数字、字母、符号的任意两种组合） */
export const REGEXP_PWD =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;

/** 登录校验 */
const loginRules = reactive(<FormRules>{
  password: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error("请输入密码"));
        } else if (!REGEXP_PWD.test(value)) {
          callback(
            new Error("密码格式应为8-18位数字、字母、符号的任意两种组合")
          );
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});

/** 注册校验（工厂函数，captchaCode 和 registerForm 由外部传入以实现响应式验证） */
function registerRules(
  captchaCode: string,
  registerForm: { password: string }
): FormRules {
  return {
    username: [
      { required: true, message: "请输入用户名", trigger: "blur" },
      { min: 2, max: 20, message: "用户名长度在2到20个字符", trigger: "blur" }
    ],
    password: [
      {
        validator: (rule, value, callback) => {
          if (value === "") {
            callback(new Error("请输入密码"));
          } else if (!REGEXP_PWD.test(value)) {
            callback(
              new Error("密码格式应为8-18位数字、字母、符号的任意两种组合")
            );
          } else {
            callback();
          }
        },
        trigger: "blur"
      }
    ],
    confirmPassword: [
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error("请再次输入密码"));
          } else if (value !== registerForm.password) {
            callback(new Error("两次输入的密码不一致"));
          } else {
            callback();
          }
        },
        trigger: "blur"
      }
    ],
    captcha: [
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error("请输入验证码"));
          } else if (
            value.toLowerCase() !== captchaCode.toLowerCase()
          ) {
            callback(new Error("验证码错误"));
          } else {
            callback();
          }
        },
        trigger: "blur"
      }
    ]
  };
}

export { loginRules, registerRules };
