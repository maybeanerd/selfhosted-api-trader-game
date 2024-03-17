<template>
  <div>
    <h1>Home</h1>
  </div>
</template>

<script setup lang="ts">
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Home';
</script>
