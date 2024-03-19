<script setup lang="ts">
const links = [{
  label: 'Home',
  icon: 'i-heroicons-home',
  to: '/',
}, {
  label: 'Resources',
  icon: 'i-heroicons-archive-box-arrow-down-20-solid',
  to: '/resources',
}, {
  label: 'Treaties',
  icon: 'i-heroicons-link',
  to: '/treaties',
}];
</script>

<template>
  <UHorizontalNavigation class="px-4" :links="links" />
</template>
