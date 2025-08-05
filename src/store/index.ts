import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
  // 状态
  const storeInfo = ref({})
  const shopInfo = ref('')
  const orderListData = ref([])
  const baseUserInfo = ref('')
  const lodding = ref(false)
  const sessionId = ref('')
  const addressBackUrl = ref('')
  const dishTypeIndex = ref(0)
  const shopPhone = ref('')
  const shopStatus = ref({})
  const orderData = ref({})
  const token = ref('')
  const arrivals = ref('')
  const remarkData = ref('')
  const addressData = ref({})
  const deliveryFee = ref(0)
  const gender = ref(0)

  // 相当于 mutations
  function setStoreInfo(provider) {
    storeInfo.value = provider
  }

  function setShopInfo(provider) {
    shopInfo.value = provider
  }

  function initdishListMut(provider) {
    orderListData.value = provider
  }

  function setBaseUserInfo(provider) {
    baseUserInfo.value = provider
  }

  function setLodding(provider) {
    lodding.value = provider
  }

  function setSessionId(provider) {
    sessionId.value = provider
  }

  function setAddressBackUrl(provider) {
    addressBackUrl.value = provider
  }

  function setDishTypeIndex(provider) {
    dishTypeIndex.value = provider
  }

  function setShopPhone(provider) {
    shopPhone.value = provider
  }

  function setShopStatus(provider) {
    shopStatus.value = provider
  }

  function setOrderData(provider) {
    orderData.value = provider
  }

  function setToken(provider) {
    token.value = provider
  }

  function setArrivalTime(provider) {
    arrivals.value = provider
  }

  function setRemark(provider) {
    remarkData.value = provider
  }

  function setAddress(provider) {
    addressData.value = provider
  }

  function setDeliveryFee(value) {
    deliveryFee.value = value
  }

  function setGender(value) {
    gender.value = value
  }

  return {
    // 状态
    storeInfo,
    shopInfo,
    orderListData,
    baseUserInfo,
    lodding,
    sessionId,
    addressBackUrl,
    dishTypeIndex,
    shopPhone,
    shopStatus,
    orderData,
    token,
    arrivals,
    remarkData,
    addressData,
    deliveryFee,
    gender,
    // 方法
    setStoreInfo,
    setShopInfo,
    initdishListMut,
    setBaseUserInfo,
    setLodding,
    setSessionId,
    setAddressBackUrl,
    setDishTypeIndex,
    setShopPhone,
    setShopStatus,
    setOrderData,
    setToken,
    setArrivalTime,
    setRemark,
    setAddress,
    setDeliveryFee,
    setGender
  }
})