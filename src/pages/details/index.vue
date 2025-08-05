<template>
  <view>
    <!-- 导航 -->
    <uni-nav-bar @clickLeft="goBack" left-icon="back" leftIcon="arrowleft" title="订单详情" statusBar="true" fixed="true"
      color="#ffffff" backgroundColor="#333333"></uni-nav-bar>
    <!-- end -->
    <view class="order_content orderDetail">
      <view class="order_content_box" scroll-y="true" scroll-top="0rpx">
        <!-- 支付状态 -->
        <status ref="status" :timeout="timeout" :orderDetailsData="orderDetailsData" :rocallTime="rocallTime"
          @statusWord="statusWord" @paymentTime="paymentTime" @handlePay="handlePay" @handleReminder="handleReminder"
          @handleRefund="handleRefund"></status>
        <!-- end -->
        <!-- 订单详情 -->
        <order-detail :orderDataes="orderDataes" :orderDetailsData="orderDetailsData"
          :showDisplay="showDisplay"></order-detail>
        <!-- end -->
        <!-- 联系商家 -->
        <view class="box contactMerchant">
          <button @click="handlePhone('bottom', orderDetailsData.shopTelephone)">
            <view class="phoneIcon"></view>
            联系商家
          </button>
          <!-- 4 派送中 5 派送中 -->
          <button class="call-rider" v-if="[4, 5].includes(orderDetailsData.status)"
            @click="handlePhone('bottom', orderDetailsData.courierTelephone)">
            <view class="phoneIcon"></view>
            联系骑手
          </button>
        </view>
        <!-- end -->
        <!-- 配送信息 -->
        <delivery-info :orderDetailsData="orderDetailsData"></delivery-info>
        <!-- end -->
        <!-- 订单信息 -->
        <order-info :orderDetailsData="orderDetailsData"></order-info>
        <!-- end -->
      </view>
      <!-- 联系商家弹层 -->
      <uni-popup ref="commonPopup" class="comPopupBox">
        <view class="popup-content">
          <view class="text">{{ textTip }}</view>
          <view class="btn" v-if="showConfirm">
            <view @click="closePopupInfo">确认</view>
          </view>
          <view class="btn" v-else>
            <view @click="closePopupInfo">先等等</view>
            <view @click="handlePhone('bottom')">拨打电话</view>
          </view>
        </view>
      </uni-popup>
      <!-- 拨打电话弹层 -->
      <view class="container phoneCon">
        <uni-popup ref="phone" @change="change" class="popupBox">
          <view class="popup-content">
            <view>{{ phone }}</view>
            <view @click="call">呼叫</view>
            <view @click="closePopup" class="closePopup">取消</view>
          </view>
        </uni-popup>
      </view>
      <!-- end -->
    </view>
  </view>
</template>
<script>
// 导入index.js作为主要实现
import index from './index.js'
// 导入common.js但不直接合并
import common from '../../utils/common.js'

// 导出组件，使用index作为基础
// 只添加common中特有的属性和方法，避免覆盖
const mergedComponent = {
  ...index,
  data() {
    // 合并data
    return {
      ...index.data(),
      ...common.data()
    }
  },
  methods: {
    // 保留index中的所有方法
    ...index.methods,
    // 添加common中特有的方法，如果有的话
    // 注意：这里不添加会被index覆盖的同名方法
  }
}

export default mergedComponent
</script>
<style src="./../common/Navbar/navbar.scss" lang="scss" scoped></style>
<style src="../order/style.scss" lang="scss"></style>
