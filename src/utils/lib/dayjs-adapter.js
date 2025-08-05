// dayjs适配器，用于将UMD模块转换为ES模块
// UMD模块会在全局作用域注册dayjs对象
import './dayjs.min.js';

export default window.dayjs;