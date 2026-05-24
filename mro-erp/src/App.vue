<template>
  <router-view />
</template>

<script setup lang="ts">
import { useUpdateChecker } from '@/composables/useUpdateChecker'

useUpdateChecker()
</script>
