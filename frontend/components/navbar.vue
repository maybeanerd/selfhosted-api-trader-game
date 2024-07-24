<script setup lang="ts">
const links = [{
  label: 'User',
  icon: 'i-heroicons-user-circle',
  to: '/',
}, {
  label: 'Resources',
  icon: 'i-heroicons-archive-box-arrow-down-20-solid',
  to: '/resources',
}, {
  label: 'Trades',
  icon: 'i-heroicons-arrows-up-down-20-solid',
  to: '/trades',
}, {
  label: 'Treaties',
  icon: 'i-heroicons-link',
  to: '/treaties',
}];
</script>

<template>
  <UHorizontalNavigation class="px-4" :links="links" />
</template>
