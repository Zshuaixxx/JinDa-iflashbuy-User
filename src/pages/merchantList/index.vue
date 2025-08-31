<template>
  <view class="merchant-list-page">
    <!-- 顶部安全区域 -->
    <view class="status-bar"></view>
    
    <!-- 顶部标题区域 -->
    <view class="page-header">
      <view class="header-content">
        <view class="title-section">
          <text class="page-title">商家列表</text>
          <view class="location-info" @click="handleLocationClick">
            <text class="location-icon">📍</text>
            <text class="location-text">{{ currentLocationText }}</text>
            <text v-if="isLocating" class="locating-spinner">⟳</text>
          </view>
        </view>
        <!-- 预留空间避免与关闭按钮冲突 -->
        <view class="header-spacer"></view>
      </view>
    </view>

    <!-- 搜索和筛选区域 -->
    <view class="search-filter-section">
      <!-- 搜索框 -->
      <view class="search-container">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input 
            type="text" 
            v-model="keyword" 
            placeholder="搜索商家名称..." 
            @confirm="handleSearch"
            class="search-input"
          />
          <view v-if="keyword" class="clear-btn" @click="clearSearch">✕</view>
        </view>
        <button @click="handleSearch" class="search-btn">搜索</button>
      </view>
      
      <!-- 筛选条件 -->
      <view class="filter-tabs">
        <view 
          class="filter-tab" 
          :class="{active: sortBy === ''}" 
          @click="handleSortChange('')"
        >
          <text class="tab-text">综合排序</text>
          <text class="tab-icon">↓</text>
        </view>
        <view 
          class="filter-tab" 
          :class="{active: sortBy === 'distance'}" 
          @click="handleSortChange('distance')"
        >
          <text class="tab-text">距离最近</text>
          <text class="tab-icon">↓</text>
        </view>
        <view 
          class="filter-tab" 
          :class="{active: sortBy === 'time'}" 
          @click="handleSortChange('time')"
        >
          <text class="tab-text">送达最快</text>
          <text class="tab-icon">↓</text>
        </view>
      </view>
    </view>

    <scroll-view 
      class="merchant-list-container" 
      scroll-y="true" 
      enable-flex="true"
      :scroll-top="scrollTop"
      @scroll="onScroll"
      @scrolltolower="onScrollToLower"
      lower-threshold="50"
    >
      <view v-if="loading" class="loading">加载中...</view>
      <view v-else-if="merchantList && merchantList.length > 0" class="merchant-item" v-for="(merchant, index) in merchantList" :key="merchant.id || index">
        <view class="merchant-card">
          <!-- 商家头部信息 -->
          <view class="merchant-header">
            <image class="merchant-logo" :src="merchant.logo || '/static/images/default-logo.png'"></image>
            <view class="merchant-basic-info">
              <view class="merchant-name-line">
                <text class="merchant-name">{{ merchant.name }}</text>
                <view class="merchant-badges">
                  <text class="badge delivery-badge">自送</text>
                </view>
              </view>
              <view class="merchant-rating-line">
                <view class="rating-stars">
                  <text class="star">★★★★☆</text>
                  <text class="rating-score">4.5</text>
                </view>
                <text class="sales-count">月售1000+</text>
              </view>
              <text class="merchant-description">{{ merchant.description }}</text>
            </view>
          </view>
          
          <!-- 配送信息 -->
          <view class="delivery-info">
            <view class="delivery-item">
              <text class="delivery-label">配送费</text>
              <text class="delivery-value price-highlight">¥{{ safeToFixed(merchant.deliveryFee || 0, 2, 'deliveryFee') }}</text>
            </view>
            <view class="delivery-item">
              <text class="delivery-label">起送</text>
              <text class="delivery-value">¥{{ safeToFixed(merchant.minOrderAmount || 0, 2, 'minOrderAmount') }}</text>
            </view>
            <view class="delivery-item">
              <text class="delivery-label">距离</text>
              <text class="delivery-value">{{ safeToFixed(merchant.distance || 0, 1, 'distance') }}km</text>
            </view>
            <view class="delivery-item">
              <text class="delivery-label">时间</text>
              <text class="delivery-value">{{ merchant.deliveryTime || 30 }}分钟</text>
            </view>
          </view>
          
          <!-- 优惠信息 -->
          <view class="promotion-info">
            <view class="promotion-tags">
              <text class="promotion-tag">满减优惠</text>
              <text class="promotion-tag">新用户立减</text>
            </view>
            <text class="business-hours">{{ merchant.businessHours || '营业中' }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">暂无商家数据</view>
      
      <!-- 加载更多或无更多数据提示 -->
      <view v-if="!loading && merchantList && merchantList.length > 0">
        <view v-if="showLoadMore" class="load-more" @click="loadMore">
          <view class="load-more-content">
            <view class="loading-icon" :class="{spinning: loading}"></view>
            <text>加载更多...</text>
          </view>
        </view>
        <view v-else class="no-more-data" :class="{bounce: isScrollingToBottom}">
          <view class="no-more-content">
            <view class="no-more-icon">📍</view>
            <text>没有更多商家</text>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 滚动指示器 -->
    <view v-if="showScrollIndicator" class="scroll-indicator">
      <view class="scroll-indicator-content">
        <view class="scroll-icon">↓</view>
        <text>继续向下滚动查看更多</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import navBar from '../common/Navbar/navbar.vue';
import { userLogin, getMerchantPage } from '../api/api.js';
import { useMainStore } from '../../store/index';

export default defineComponent({
  components: {
    navBar
  },
  data() {
      return {
        token: '',
        userInfo: null,
        loginLoading: false,
        merchantList: [], // 确保初始化为空数组
        showLoadMore: false,
        currentPage: 1,
        pageSize: 10,
        total: 0,
        sortBy: '',
        keyword: '',
        latitude: 39.9042,
        longitude: 116.4074,
        loading: false,
        // 定位相关状态
        currentLocationText: '正在定位...',
        isLocating: false,
        locationPermissionDenied: false,
        currentAddress: '',
        currentLatitude: null,
        currentLongitude: null,
        // 添加滚动相关状态
        scrollTop: 0,
        showScrollIndicator: false,
        isScrollingToBottom: false
      };
    },
  created() {
    this.store = useMainStore();
    this.checkLoginStatus();
  },
  mounted() {
    // 页面加载后自动获取定位
    this.initLocation();
    
    // 监听地址选择事件
    uni.$on('addressSelected', this.onAddressSelected);
  },
  
  beforeDestroy() {
    // 移除事件监听
    uni.$off('addressSelected', this.onAddressSelected);
  },
  
  onShow() {
    // 从其他页面返回时的处理
    this.handlePageReturn();
  },
  methods: {
    /**
     * 处理页面返回逻辑
     */
    handlePageReturn() {
      // 获取页面参数
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      
      console.log('页面参数:', options);
      
      // 检查是否从地址管理页面返回
      if (options.fromAddress === 'true') {
        console.log('检测到从地址管理页面返回');
        this.handleAddressReturn(options);
      }
      
      // 检查store中的地址数据更新
      if (this.store.addressData && this.store.addressData.isFromAddressManagement) {
        console.log('检测到地址数据更新:', this.store.addressData);
        this.applySelectedAddress(this.store.addressData);
      }
    },

    /**
     * 处理从地址管理页面返回的逻辑
     */
    handleAddressReturn(options) {
      // 从 URL 参数中获取经纬度
      if (options.latitude && options.longitude) {
        const latitude = parseFloat(options.latitude);
        const longitude = parseFloat(options.longitude);
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
          console.log('使用从地址管理页面传递的经纬度:', latitude, longitude);
          
          // 更新当前位置信息
          this.currentLatitude = latitude;
          this.currentLongitude = longitude;
          this.latitude = latitude;
          this.longitude = longitude;
          
          // 重新加载商家列表
          this.currentPage = 1;
          this.loadMerchantList();
        }
      }
    },

    /**
     * 应用选中的地址信息
     */
    applySelectedAddress(addressData) {
      console.log('应用选中的地址信息:', addressData);
      
      // 更新地址显示
      if (addressData.fullAddress) {
        this.currentAddress = addressData.fullAddress;
        this.currentLocationText = addressData.fullAddress.length > 8 ? 
          addressData.fullAddress.substring(0, 8) + '...' : addressData.fullAddress;
      }
      
      // 如果有经纬度信息，更新位置
      if (addressData.location) {
        const [lat, lng] = addressData.location.split(',');
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
          this.currentLatitude = latitude;
          this.currentLongitude = longitude;
          this.latitude = latitude;
          this.longitude = longitude;
          
          // 重新加载商家列表
          this.currentPage = 1;
          this.loadMerchantList();
        }
      }
      
      // 清除标记，防止重复处理
      this.store.setAddress({
        ...addressData,
        isFromAddressManagement: false
      });
    },
    /**
     * 检查登录状态
     */
    checkLoginStatus() {
      if (!this.store.token) {
        this.showLoginModal();
      }
    },
    /**
     * 显示登录模态框
     */
    showLoginModal() {
      uni.showModal({
        title: "温馨提示",
        content: "亲，授权微信登录后才能使用服务！",
        showCancel: false,
        success: async () => {
          try {
            // 直接在用户点击事件中调用授权接口
            const userProfile = await uni.getUserProfile({
              desc: "用于登录"
            });
            this.handleLogin(userProfile);
          } catch (err) {
            console.error('授权失败:', err);
            uni.showToast({
              title: "授权失败，请重试",
              icon: "none",
              duration: 3000
            });
          }
        }
      });
    },
    /**
     * 处理微信登录逻辑
     */
    async handleLogin(userProfile) {
      this.loginLoading = true;
      try {
        // 获取登录凭证
        const loginRes = await uni.login({
          provider: "weixin"
        });

        if (loginRes.errMsg !== "login:ok") {
          throw new Error("获取登录凭证失败: " + loginRes.errMsg);
        }
        const jsCode = loginRes.code;

        // 调用登录接口 - 包含原逻辑中的位置参数格式
        const loginParams = {
          code: jsCode,
          userInfo: userProfile.userInfo,
          // 保留原逻辑中的位置参数格式，使用当前定位或默认值
          location: this.currentLatitude && this.currentLongitude ? 
            `${this.currentLongitude},${this.currentLatitude}` : '116.481488,39.990464'
        };

        console.log('登录参数:', loginParams);
        const res = await userLogin(loginParams);
        console.log('登录响应完整数据:', res);
        console.log('登录响应code:', res?.code);
        console.log('登录响应message:', res?.message);
        console.log('登录响应data:', res?.data);

        if (res && res.code === 1) {
          console.log('准备设置token - res.data.token值:', res.data.token);
            this.store.setToken(res.data.token);
            console.log('已设置token到store - 验证值:', this.store.token);
          console.log('准备设置用户信息 - userProfile.userInfo值:', userProfile.userInfo);
            this.store.setBaseUserInfo(userProfile.userInfo);
            console.log('已设置用户信息到store - 验证值:', this.store.baseUserInfo);
          // 保存原逻辑中的必要信息
          console.log('准备处理配送费 - res.data.deliveryFee值:', res.data.deliveryFee);
            if (res.data.deliveryFee) {
              this.store.setDeliveryFee(res.data.deliveryFee);
              console.log('已设置配送费到store:', this.store.deliveryFee);
            } else {
              console.log('配送费不存在，跳过设置');
            }
          console.log('准备处理商家信息 - shopName值:', res.data.shopName, 'shopAddress值:', res.data.shopAddress, 'shopId值:', res.data.shopId);
            if (res.data.shopName) {
              this.store.setShopInfo({
                shopName: res.data.shopName,
                shopAddress: res.data.shopAddress,
                shopId: res.data.shopId,
              });
              console.log('已设置商家信息到store:', this.store.shopInfo);
            } else {
              console.log('商家名称不存在，跳过设置商家信息');
            }
          console.log('准备显示登录成功提示');
            uni.showToast({
              title: "登录成功",
              icon: "success"
            });
            console.log('登录成功提示已显示，准备调用loadMerchantList()');
          // 登录成功后加载商家列表数据
          this.loadMerchantList();
        } else {
          console.error('登录失败分支 - code:', res?.code, 'message:', res?.message);
          throw new Error(res?.message || "登录失败: 服务器返回异常");
        }
      } catch (err) {
        console.error('登录异常捕获 - 错误对象:', err);
        console.error('登录异常捕获 - 错误消息:', err.message);
        uni.showToast({
          title: err.message || "登录失败，请重试",
          icon: "none",
          duration: 3000
        });
      } finally {
        this.loginLoading = false;
      }
    },
    /**
       * 加载商家列表数据
       */
      /**
       * 验证是否为有效数字
       */
      isValidNumber(value, fieldName) {
         // 显式检查null值和undefined值
         if (value === null || value === undefined) {
           console.error(`检测到null/undefined值 - 字段: ${fieldName}`);
           return false;
         }
         const isValid = typeof value === 'number' && !isNaN(value) && isFinite(value);
         if (!isValid) {
           console.error(`无效数字值 - 字段: ${fieldName}`, '值:', value, '类型:', typeof value, 'JSON值:', JSON.stringify(value));
         }
         return isValid;
       },

       /**
        * 安全的数字格式化方法 - 严格遵循项目规范
        */
        safeToFixed(value, decimalPlaces = 2, fieldName = 'unknown') {
          // 严格检查null、undefined和其他非数字类型
          if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
            console.warn(`安全格式化警告 - 字段: ${fieldName}`, '空值:', value);
            return decimalPlaces === 1 ? '0.0' : '0.00';
          }
          
          // 尝试转换为数字
          let numValue;
          if (typeof value === 'number') {
            numValue = value;
          } else {
            numValue = Number(value);
          }
          
          // 验证转换后的数字是否有效
          if (isNaN(numValue) || !isFinite(numValue)) {
            console.error(`安全格式化失败 - 字段: ${fieldName}`, '无效数值:', value, '转换后:', numValue);
            return decimalPlaces === 1 ? '0.0' : '0.00';
          }
          
          try {
            return numValue.toFixed(decimalPlaces);
          } catch (error) {
            console.error(`toFixed调用失败 - 字段: ${fieldName}`, '值:', numValue, '错误:', error);
            return decimalPlaces === 1 ? '0.0' : '0.00';
          }
        },

      async loadMerchantList() {
        console.log('开始执行loadMerchantList方法');
        if (this.loading) {
          console.log('loadMerchantList: 正在加载中，阻止重复调用');
          return;
        }
        this.loading = true;
        try {
          const token = uni.getStorageSync('token');
          console.log('调用getMerchantPage参数:', {
            page: this.currentPage,
            pageSize: this.pageSize,
            sortBy: this.sortBy,
            latitude: this.latitude,
            longitude: this.longitude,
            keyword: this.keyword
          });
          const res = await getMerchantPage({
            page: this.currentPage,
            pageSize: this.pageSize,
            sortBy: this.sortBy,
            latitude: this.latitude,
            longitude: this.longitude,
            keyword: this.keyword
          });
          console.log('getMerchantPage响应数据:', res);
          console.log('响应数据类型:', typeof res);
          console.log('响应数据结构:', JSON.stringify(res));
          console.log('商家列表响应code:', res?.code, '类型:', typeof res?.code);
          console.log('商家列表响应data:', res?.data);
          // 简化条件判断并添加执行路径追踪
          console.log('=== 开始处理商家列表响应 ===');
          console.log('响应code:', res?.code);
          console.log('响应data是否存在:', !!res?.data);
          
          // 简化成功条件判断
          // 最简化的成功条件判断
          // 最终简化版成功条件判断
          const isSuccess = res && res.code === 1;
          console.log('=== 响应处理核心判断 ===');
          console.log('API返回code:', res?.code);
          console.log('是否成功:', isSuccess);
          
          if (isSuccess) {
            try {
              // 详细记录数据结构并容错处理
              console.log('res.data完整结构:', JSON.stringify(res.data));
              const { records, total } = res.data || {};
              console.log('提取的records:', records?.length, 'total:', total);
              console.log('原始数据样例:', records[0]); // 打印第一条数据的结构
              if (!Array.isArray(records) || total === undefined) {
                console.error('数据结构异常 - records:', records, 'total:', total);
                throw new Error('商家列表数据格式错误');
              }
              
              // 数据格式化：确保数值字段为有效数字，严格处理null值
              console.log('开始数据格式化处理...');
              const formattedRecords = records.map((merchant, index) => {
                console.log(`正在处理第${index}个商家:`, merchant.name, '原始距离:', merchant.distance);
                
                // 对每个字段进行安全转换
                const safeDistance = merchant.distance === null || merchant.distance === undefined ? 0 : 
                  (typeof merchant.distance === 'number' ? merchant.distance : (Number(merchant.distance) || 0));
                const safeDeliveryFee = merchant.deliveryFee === null || merchant.deliveryFee === undefined ? 0 : 
                  (typeof merchant.deliveryFee === 'number' ? merchant.deliveryFee : (Number(merchant.deliveryFee) || 0));
                const safeMinOrderAmount = merchant.minOrderAmount === null || merchant.minOrderAmount === undefined ? 0 : 
                  (typeof merchant.minOrderAmount === 'number' ? merchant.minOrderAmount : (Number(merchant.minOrderAmount) || 0));
                const safeDeliveryTime = merchant.deliveryTime === null || merchant.deliveryTime === undefined ? 30 : 
                  (Number(merchant.deliveryTime) || 30);
                
                console.log(`安全格式化结果 - 距离:`, safeDistance, '配送费:', safeDeliveryFee);
                
                const result = {
                  ...merchant,
                  distance: safeDistance,
                  deliveryFee: safeDeliveryFee,
                  minOrderAmount: safeMinOrderAmount,
                  deliveryTime: safeDeliveryTime,
                  // 确保其他可能为null的字段也被处理
                  businessHours: merchant.businessHours || '营业时间未设置',
                  logo: merchant.logo || '/static/images/default-logo.png',
                  description: merchant.description || '暂无描述'
                };
                
                console.log(`格式化完成 - 商家: ${result.name}, 距离: ${result.distance}`);
                return result;
              });
              
              console.log('数据格式化完成，格式化后数据样例:', formattedRecords[0]);
              
              // 使用nextTick确保数据安全更新
              this.$nextTick(() => {
                if (this.currentPage === 1) {
                  this.merchantList = formattedRecords;
                  console.log('第一页商家列表数据已设置，记录数:', formattedRecords.length);
                } else {
                  this.merchantList = [...this.merchantList, ...formattedRecords];
                  console.log('加载更多商家列表数据，新增记录数:', formattedRecords.length, '总记录数:', this.merchantList.length);
                }
                this.total = total;
                console.log('商家列表总记录数:', total);
                // 修复显示逻辑：当前加载的数量小于total时才显示加载更多
                this.showLoadMore = this.merchantList.length < total && total > 0;
                console.log('=== 商家列表加载成功 ===');
                console.log('最终商家数量:', this.merchantList.length);
                console.log('总记录数:', total);
                console.log('是否显示加载更多:', this.showLoadMore);
              });
            } catch (successBranchError) {
              console.error('成功分支内部异常:', successBranchError);
              console.error('异常类型:', typeof successBranchError);
              console.error('异常堆栈:', successBranchError?.stack);
              if (!(successBranchError instanceof Error && successBranchError.message === '商家列表数据格式错误')) {
                uni.showToast({
                  title: '处理商家数据时出错',
                  icon: 'none',
                  duration: 3000
                });
              }
            }
          } else {
            console.log('进入失败分支');
            console.error('商家列表加载失败分支 - code:', res?.code, 'message:', res?.msg);
            console.error('商家列表加载失败响应完整数据:', res);
            if (res?.code !== 1) {
              uni.showToast({
                title: res?.msg || '加载商家列表失败',
                icon: 'none',
                duration: 3000
              });
            }
          }
      } catch (error) {
        console.log('5. 进入外部catch块');
        console.error('获取商家列表异常:', error);
        console.error('异常类型:', error.name);
        console.error('异常消息:', error.message);
        console.error('异常堆栈:', error.stack);
        if (error.name !== 'AbortError') {
          uni.showToast({
            title: '获取商家列表异常',
            icon: 'none',
            duration: 3000
          });
        }
      } finally {
          this.loading = false;
        }
      },

      loadMore() {
        if (this.merchantList.length < this.total) {
          this.currentPage++;
          this.loadMerchantList();
        }
      },

      handleSortChange(sortType) {
        this.sortBy = sortType;
        this.currentPage = 1;
        this.loadMerchantList();
      },

      handleSearch() {
        this.currentPage = 1;
        this.loadMerchantList();
      },

      /**
       * 清除搜索内容
       */
      clearSearch() {
        this.keyword = '';
        this.currentPage = 1;
        this.loadMerchantList();
      },

      /**
       * 处理滚动事件
       */
      onScroll(event) {
        this.scrollTop = event.detail.scrollTop;
        
        // 当滚动距离超过200px时显示滚动指示器
        this.showScrollIndicator = this.scrollTop > 200 && this.showLoadMore;
        
        // 滚动到底部附近时的动画提示
        const scrollHeight = event.detail.scrollHeight;
        const clientHeight = event.detail.scrollHeight - event.detail.scrollTop;
        
        if (scrollHeight - clientHeight < 100 && !this.showLoadMore) {
          this.triggerBottomAnimation();
        }
      },

      /**
       * 滚动到底部触发
       */
      onScrollToLower() {
        console.log('滚动到底部');
        if (!this.showLoadMore && this.merchantList.length > 0) {
          // 没有更多数据时显示提示
          this.showNoMoreDataToast();
          this.triggerBottomAnimation();
        } else if (this.showLoadMore) {
          // 有更多数据时自动加载
          this.loadMore();
        }
      },

      /**
       * 触发底部动画
       */
      triggerBottomAnimation() {
        this.isScrollingToBottom = true;
        setTimeout(() => {
          this.isScrollingToBottom = false;
        }, 800);
      },

      /**
       * 显示没有更多数据的提示
       */
      showNoMoreDataToast() {
        uni.showToast({
          title: '没有更多商家了',
          icon: 'none',
          duration: 1500
        });
      },

      /**
       * 初始化定位
       */
      async initLocation() {
        console.log('开始初始化定位功能');
        this.isLocating = true;
        this.currentLocationText = '正在定位...';
        
        try {
          await this.getCurrentLocation();
        } catch (error) {
          console.error('初始化定位失败:', error);
          this.handleLocationError(error);
        } finally {
          this.isLocating = false;
        }
      },

      /**
       * 获取当前位置
       */
      getCurrentLocation() {
        return new Promise((resolve, reject) => {
          console.log('开始获取设备定位');
          
          uni.getLocation({
            type: 'gcj02', // 使用国测局坐标系
            success: async (res) => {
              console.log('定位成功:', res);
              this.currentLatitude = res.latitude;
              this.currentLongitude = res.longitude;
              
              // 更新商家列表查询的经纬度
              this.latitude = res.latitude;
              this.longitude = res.longitude;
              
              try {
                // 逆地理编码获取地址信息
                await this.reverseGeocode(res.latitude, res.longitude);
                resolve(res);
              } catch (geocodeError) {
                console.error('逆地理编码失败:', geocodeError);
                this.currentLocationText = '定位成功';
                this.currentAddress = '位置获取成功';
                resolve(res);
              }
              
              // 重新加载商家列表（使用新的位置信息）
              this.currentPage = 1;
              this.loadMerchantList();
            },
            fail: (error) => {
              console.error('定位失败:', error);
              reject(error);
            }
          });
        });
      },

      /**
       * 逆地理编码 - 将经纬度转换为地址信息
       * 注意：这里需要调用服务端接口进行逆地理编码
       * 目前暂时使用模拟数据，后续需要集成QQmapUtil的逆地理编码功能
       */
      async reverseGeocode(latitude, longitude) {
        try {
          console.log('开始逆地理编码:', latitude, longitude);
          
          // TODO: 这里应该调用服务端的逆地理编码接口
          // 类似于现有的QQmapUtil.getLocation()方法，但是反向操作
          // 暂时使用模拟数据
          
          const mockAddress = {
            province: '北京市',
            city: '北京市', 
            district: '朝阳区',
            street: '建国门外大街'
          };
          
          this.currentAddress = `${mockAddress.district}${mockAddress.street}`;
          this.currentLocationText = this.currentAddress.length > 8 ? 
            this.currentAddress.substring(0, 8) + '...' : this.currentAddress;
          
          console.log('逆地理编码完成:', this.currentAddress);
          
        } catch (error) {
          console.error('逆地理编码异常:', error);
          throw error;
        }
      },

      /**
       * 处理定位错误
       */
      handleLocationError(error) {
        console.error('定位错误处理:', error);
        
        if (error.errMsg && error.errMsg.includes('auth')) {
          // 权限被拒绝
          this.locationPermissionDenied = true;
          this.currentLocationText = '定位权限已关闭';
          
          uni.showModal({
            title: '定位权限',
            content: '需要获取您的位置信息以显示附近商家，请在设置中开启定位权限',
            confirmText: '去设置',
            cancelText: '暂不开启',
            success: (res) => {
              if (res.confirm) {
                uni.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      // 用户开启了定位权限，重新获取定位
                      this.initLocation();
                    }
                  }
                });
              } else {
                // 用户取消，使用默认位置
                this.useDefaultLocation();
              }
            }
          });
        } else {
          // 其他定位错误
          this.currentLocationText = '定位失败';
          uni.showToast({
            title: '定位失败，将使用默认位置',
            icon: 'none',
            duration: 2000
          });
          this.useDefaultLocation();
        }
      },

      /**
       * 使用默认位置
       */
      useDefaultLocation() {
        console.log('使用默认位置');
        this.currentLocationText = '默认位置';
        this.currentAddress = '北京市朝阳区';
        this.latitude = 39.9042;
        this.longitude = 116.4074;
        
        // 使用默认位置加载商家列表
        this.currentPage = 1;
        this.loadMerchantList();
      },

      /**
       * 处理定位按钮点击事件
       */
      handleLocationClick() {
        console.log('定位按钮被点击');
        
        uni.showActionSheet({
          itemList: ['重新定位', '选择地址', '地址管理'],
          success: (res) => {
            switch(res.tapIndex) {
              case 0:
                // 重新定位
                this.initLocation();
                break;
              case 1:
                // 选择地址（打开地图选点）
                this.openMapSelector();
                break;
              case 2:
                // 地址管理
                this.goToAddressManagement();
                break;
            }
          },
          fail: (error) => {
            console.log('用户取消操作');
          }
        });
      },

      /**
       * 打开地图选点
       */
      openMapSelector() {
        console.log('打开地图选点功能');
        
        // 首先检查定位权限
        uni.getSetting({
          success: (settingRes) => {
            if (settingRes.authSetting['scope.userLocation'] === false) {
              // 用户曾经拒绝授权，引导用户开启
              uni.showModal({
                title: '定位权限',
                content: '需要获取您的位置信息以使用地图选点功能，请在设置中开启定位权限',
                confirmText: '去设置',
                cancelText: '取消',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    uni.openSetting({
                      success: (openRes) => {
                        if (openRes.authSetting['scope.userLocation']) {
                          // 用户开启了权限，重新调用地图选点
                          this.performChooseLocation();
                        }
                      }
                    });
                  }
                }
              });
              return;
            }
            
            // 有权限或未设置，直接调用
            this.performChooseLocation();
          },
          fail: () => {
            // 获取设置失败，尝试直接调用
            this.performChooseLocation();
          }
        });
      },

      /**
       * 执行地图选点操作
       */
      performChooseLocation() {
        uni.chooseLocation({
          latitude: this.currentLatitude || this.latitude,
          longitude: this.currentLongitude || this.longitude,
          success: (res) => {
            console.log('地图选点成功:', res);
            
            // 更新位置信息
            this.currentLatitude = res.latitude;
            this.currentLongitude = res.longitude;
            this.latitude = res.latitude;
            this.longitude = res.longitude;
            
            // 更新地址显示
            this.currentAddress = res.address || res.name || '已选择位置';
            this.currentLocationText = this.currentAddress.length > 8 ? 
              this.currentAddress.substring(0, 8) + '...' : this.currentAddress;
            
            // 重新加载商家列表
            this.currentPage = 1;
            this.loadMerchantList();
            
            uni.showToast({
              title: '位置已更新',
              icon: 'success',
              duration: 1500
            });
          },
          fail: (error) => {
            console.error('地图选点失败:', error);
            
            // 根据不同错误类型给出不同的提示
            let errorMessage = '选择位置失败';
            
            if (error.errMsg) {
              if (error.errMsg.includes('auth')) {
                errorMessage = '没有定位权限，请在设置中开启';
              } else if (error.errMsg.includes('cancel')) {
                errorMessage = '用户取消选择';
              } else if (error.errMsg.includes('requiredPrivateInfos')) {
                errorMessage = '小程序配置不完整，请联系开发者';
              } else if (error.errMsg.includes('fail')) {
                errorMessage = '地图服务不可用，请稍后重试';
              }
            }
            
            // 只在非取消操作时显示错误提示
            if (!error.errMsg || !error.errMsg.includes('cancel')) {
              uni.showToast({
                title: errorMessage,
                icon: 'none',
                duration: 2000
              });
            }
          }
        });
      },

    /**
     * 处理地址选择事件
     */
    onAddressSelected(eventData) {
      console.log('接收到地址选择事件:', eventData);
      
      // 更新地址显示
      if (eventData.fullAddress) {
        this.currentAddress = eventData.fullAddress;
        this.currentLocationText = eventData.fullAddress.length > 8 ? 
          eventData.fullAddress.substring(0, 8) + '...' : eventData.fullAddress;
      }
      
      // 如果有位置参数，解析并更新位置
      if (eventData.locationParams) {
        const urlParams = new URLSearchParams(eventData.locationParams.substring(1));
        const latitude = urlParams.get('latitude');
        const longitude = urlParams.get('longitude');
        
        if (latitude && longitude) {
          this.currentLatitude = parseFloat(latitude);
          this.currentLongitude = parseFloat(longitude);
          this.latitude = parseFloat(latitude);
          this.longitude = parseFloat(longitude);
        }
      } else if (eventData.location) {
        // 直接从地址数据中获取经纬度
        const [lat, lng] = eventData.location.split(',');
        if (lat && lng) {
          this.currentLatitude = parseFloat(lat);
          this.currentLongitude = parseFloat(lng);
          this.latitude = parseFloat(lat);
          this.longitude = parseFloat(lng);
        }
      }
      
      // 重新加载商家列表
      this.currentPage = 1;
      this.loadMerchantList();
    },

    /**
     * 跳转到地址管理页面
     */
    goToAddressManagement() {
      console.log('跳转到地址管理页面');
      
      // 设置返回路径为当前页面
      this.store.setAddressBackUrl('/pages/merchantList/index');
      
      uni.navigateTo({
        url: '/pages/address/address',
        success: () => {
          console.log('成功跳转到地址管理页面');
        },
        fail: (error) => {
          console.error('跳转地址管理页面失败:', error);
          uni.showToast({
            title: '跳转失败',
            icon: 'none',
            duration: 1500
          });
        }
      });
    }
  }
});
</script>

<style scoped>
/* 页面主容器 */
.merchant-list-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
}

/* 顶部安全区域 */
.status-bar {
  height: 44px; /* iOS状态栏高度 */
  background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.15);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.location-info:active {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(0.95);
}

.location-icon {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.location-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 定位加载动画 */
.locating-spinner {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  animation: spin 1s linear infinite;
  margin-left: 4px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 预留空间避免与关闭按钮冲突 */
.header-spacer {
  width: 80px; /* 预留右侧空间 */
  height: 1px;
}

/* 搜索和筛选区域 */
.search-filter-section {
  background: white;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 搜索容器 */
.search-container {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 0 16px;
  height: 36px;
}

.search-icon {
  font-size: 14px;
  color: #999;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.clear-btn {
  color: #999;
  font-size: 14px;
  padding: 4px;
  cursor: pointer;
}

.search-btn {
  background: #9c27b0;
  color: white;
  border: none;
  border-radius: 18px;
  padding: 0 20px;
  height: 36px;
  font-size: 14px;
  font-weight: 500;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 16px;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-tab.active .tab-text {
  color: #9c27b0;
  font-weight: 500;
}

.filter-tab.active .tab-icon {
  color: #9c27b0;
  transform: rotate(180deg);
}

.tab-text {
  font-size: 14px;
  color: #333;
  transition: all 0.3s ease;
}

.tab-icon {
  font-size: 12px;
  color: #999;
  transition: all 0.3s ease;
}

/* 列表区域 */
.merchant-list-container {
  flex: 1;
  padding: 0 12px;
  background: #f8f8f8;
}

.merchant-item {
  margin-bottom: 12px;
}

/* 商家卡片 - 美团风格 */
.merchant-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.merchant-card:active {
  transform: scale(0.98);
}

/* 商家头部信息 */
.merchant-header {
  display: flex;
  padding: 16px;
  gap: 12px;
}

.merchant-logo {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
}

.merchant-basic-info {
  flex: 1;
}

.merchant-name-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.merchant-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.merchant-badges {
  display: flex;
  gap: 4px;
}

.badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #666;
}

.delivery-badge {
  background: #e8f5e8;
  color: #52c41a;
}

.merchant-rating-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.rating-stars {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star {
  color: #ffa500;
  font-size: 12px;
}

.rating-score {
  font-size: 12px;
  color: #666;
}

.sales-count {
  font-size: 12px;
  color: #999;
}

.merchant-description {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

/* 配送信息 */
.delivery-info {
  display: flex;
  padding: 12px 16px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.delivery-item {
  flex: 1;
  text-align: center;
}

.delivery-label {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
}

.delivery-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.price-highlight {
  color: #9c27b0;
  font-weight: 600;
}

/* 优惠信息 */
.promotion-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.promotion-tags {
  display: flex;
  gap: 6px;
}

.promotion-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #fff2e8;
  color: #fa8c16;
  border-radius: 4px;
  border: 1px solid #ffd591;
}

.business-hours {
  font-size: 12px;
  color: #52c41a;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
  font-size: 14px;
}

/* 加载更多和底部提示 */
.load-more {
  margin: 20px 12px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: #9c27b0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.load-more-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-icon {
  width: 16px;
  height: 16px;
  border: 2px solid #9c27b0;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-more-data {
  margin: 20px 12px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: #999;
  border: 1px dashed #e0e0e0;
}

.no-more-data.bounce {
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.no-more-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.no-more-icon {
  font-size: 14px;
}

/* 滚动指示器 */
.scroll-indicator {
  position: fixed;
  bottom: 100px;
  right: 16px;
  background: rgba(156, 39, 176, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 11px;
  animation: fadeInUp 0.3s ease;
  z-index: 1000;
}

.scroll-indicator-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.scroll-icon {
  animation: bounce-down 2s ease-in-out infinite;
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}
</style>