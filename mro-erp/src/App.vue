<template>
  <router-view />
  <ToastNotification />
</template>

<script setup lang="ts">
import { useUpdateChecker } from '@/composables/useUpdateChecker'
import ToastNotification from '@/components/ToastNotification.vue'

useUpdateChecker()
</script>
